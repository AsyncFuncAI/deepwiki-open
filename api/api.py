import os
import logging
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
import json
from datetime import datetime
import google.generativeai as genai
from api.multi_repo_rag import MultiRepoRAG
from typing import List
from api.models import (
    Repository, MultiRepoRequest, MultiRepoQueryRequest,
    WikiPage, MultiRepoWikiExportRequest
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get API keys from environment variables
google_api_key = os.environ.get('GOOGLE_API_KEY')

# Configure Google Generative AI
if google_api_key:
    genai.configure(api_key=google_api_key)
else:
    logger.warning("GOOGLE_API_KEY not found in environment variables")

# Initialize FastAPI app
app = FastAPI(
    title="Streaming API",
    description="API for streaming chat completions"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

from api.models import WikiPage, WikiExportRequest

@app.post("/export/wiki")
async def export_wiki(request: WikiExportRequest):
    """
    Export wiki content as Markdown or JSON.

    Args:
        request: The export request containing wiki pages and format

    Returns:
        A downloadable file in the requested format
    """
    try:
        logger.info(f"Exporting wiki for {request.repo_url} in {request.format} format")

        # Extract repository name from URL for the filename
        repo_parts = request.repo_url.rstrip('/').split('/')
        repo_name = repo_parts[-1] if len(repo_parts) > 0 else "wiki"

        # Get current timestamp for the filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        if request.format == "markdown":
            # Generate Markdown content
            content = generate_markdown_export(request.repo_url, request.pages)
            filename = f"{repo_name}_wiki_{timestamp}.md"
            media_type = "text/markdown"
        else:  # JSON format
            # Generate JSON content
            content = generate_json_export(request.repo_url, request.pages)
            filename = f"{repo_name}_wiki_{timestamp}.json"
            media_type = "application/json"

        # Create response with appropriate headers for file download
        response = Response(
            content=content,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

        return response

    except Exception as e:
        error_msg = f"Error exporting wiki: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/local_repo/structure")
async def get_local_repo_structure(path: str = Query(None, description="Path to local repository")):
    """Return the file tree and README content for a local repository."""
    if not path:
        return JSONResponse(
            status_code=400,
            content={"error": "No path provided. Please provide a 'path' query parameter."}
        )

    if not os.path.isdir(path):
        return JSONResponse(
            status_code=404,
            content={"error": f"Directory not found: {path}"}
        )

    try:
        logger.info(f"Processing local repository at: {path}")
        file_tree_lines = []
        readme_content = ""

        for root, dirs, files in os.walk(path):
            # Exclude hidden dirs/files and virtual envs
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__' and d != 'node_modules' and d != '.venv']
            for file in files:
                if file.startswith('.') or file == '__init__.py' or file == '.DS_Store':
                    continue
                rel_dir = os.path.relpath(root, path)
                rel_file = os.path.join(rel_dir, file) if rel_dir != '.' else file
                file_tree_lines.append(rel_file)
                # Find README.md (case-insensitive)
                if file.lower() == 'readme.md' and not readme_content:
                    try:
                        with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                            readme_content = f.read()
                    except Exception as e:
                        logger.warning(f"Could not read README.md: {str(e)}")
                        readme_content = ""

        file_tree_str = '\n'.join(sorted(file_tree_lines))
        return {"file_tree": file_tree_str, "readme": readme_content}
    except Exception as e:
        logger.error(f"Error processing local repository: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Error processing local repository: {str(e)}"}
        )

def generate_markdown_export(repo_url: str, pages: List[WikiPage]) -> str:
    """
    Generate Markdown export of wiki pages.

    Args:
        repo_url: The repository URL
        pages: List of wiki pages

    Returns:
        Markdown content as string
    """
    # Start with metadata
    markdown = f"# Wiki Documentation for {repo_url}\n\n"
    markdown += f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"

    # Add table of contents
    markdown += "## Table of Contents\n\n"
    for page in pages:
        markdown += f"- [{page.title}](#{page.id})\n"
    markdown += "\n"

    # Add each page
    for page in pages:
        markdown += f"<a id='{page.id}'></a>\n\n"
        markdown += f"## {page.title}\n\n"

        # Add related files
        if page.filePaths and len(page.filePaths) > 0:
            markdown += "### Related Files\n\n"
            for file_path in page.filePaths:
                markdown += f"- `{file_path}`\n"
            markdown += "\n"

        # Add related pages
        if page.relatedPages and len(page.relatedPages) > 0:
            markdown += "### Related Pages\n\n"
            related_titles = []
            for related_id in page.relatedPages:
                # Find the title of the related page
                related_page = next((p for p in pages if p.id == related_id), None)
                if related_page:
                    related_titles.append(f"[{related_page.title}](#{related_id})")

            if related_titles:
                markdown += "Related topics: " + ", ".join(related_titles) + "\n\n"

        # Add page content
        markdown += f"{page.content}\n\n"
        markdown += "---\n\n"

    return markdown

def generate_json_export(repo_url: str, pages: List[WikiPage]) -> str:
    """
    Generate JSON export of wiki pages.

    Args:
        repo_url: The repository URL
        pages: List of wiki pages

    Returns:
        JSON content as string
    """
    # Create a dictionary with metadata and pages
    export_data = {
        "metadata": {
            "repository": repo_url,
            "generated_at": datetime.now().isoformat(),
            "page_count": len(pages)
        },
        "pages": [page.model_dump() for page in pages]
    }

    # Convert to JSON string with pretty formatting
    return json.dumps(export_data, indent=2)

# Import the simplified chat implementation
from api.simple_chat import chat_completions_stream, multi_repo_chat_completions_stream

# Add the chat_completions_stream endpoint to the main app
app.add_api_route("/chat/completions/stream", chat_completions_stream, methods=["POST"])

# Add the multi-repository chat endpoint to the main app
app.add_api_route("/multi_repo/chat/completions/stream", multi_repo_chat_completions_stream, methods=["POST"])

# Models for multi-repository operations are imported from api.models

# Create a global instance of MultiRepoRAG
multi_repo_rag_instance = None

@app.post("/multi_repo/initialize")
async def initialize_multi_repo(request: MultiRepoRequest):
    """
    Initialize the multi-repository RAG system with the specified repositories.

    Args:
        request: The request containing the repositories to include

    Returns:
        A status message indicating success or failure
    """
    try:
        global multi_repo_rag_instance

        # Create a new MultiRepoRAG instance
        multi_repo_rag_instance = MultiRepoRAG(local_ollama=request.local_ollama)

        # Add each repository
        success_count = 0
        failures = []

        for repo in request.repositories:
            try:
                success = multi_repo_rag_instance.add_repository(
                    repo_url=repo.repo_url,
                    access_token=repo.access_token,
                    description=repo.description
                )

                if success:
                    success_count += 1
                else:
                    failures.append(f"Failed to add repository: {repo.repo_url}")
            except Exception as e:
                failures.append(f"Error adding repository {repo.repo_url}: {str(e)}")

        # Return status
        return {
            "status": "success" if success_count == len(request.repositories) else "partial_success",
            "message": f"Successfully initialized {success_count} of {len(request.repositories)} repositories",
            "failures": failures if failures else None
        }

    except Exception as e:
        error_msg = f"Error initializing multi-repository system: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/multi_repo/query")
async def query_multi_repo(request: MultiRepoQueryRequest):
    """
    Query multiple repositories using RAG.

    Args:
        request: The request containing the repositories and query

    Returns:
        The RAG answer
    """
    try:
        global multi_repo_rag_instance

        # Check if multi_repo_rag_instance is initialized
        if not multi_repo_rag_instance:
            # Initialize it first
            await initialize_multi_repo(MultiRepoRequest(
                repositories=request.repositories,
                local_ollama=request.local_ollama,
                language=request.language
            ))

        # Query the multi-repository system
        response, _ = multi_repo_rag_instance(request.query, language=request.language)

        # Return the response
        return {
            "answer": response.answer,
            "rationale": response.rationale
        }

    except Exception as e:
        error_msg = f"Error querying multi-repository system: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/multi_repo/export_wiki")
async def export_multi_repo_wiki(request: MultiRepoWikiExportRequest):
    """
    Export wiki content for multiple repositories as Markdown or JSON.

    Args:
        request: The export request containing repositories, wiki pages, and format

    Returns:
        A downloadable file in the requested format
    """
    try:
        logger.info(f"Exporting multi-repository wiki in {request.format} format")

        # Extract repository names for the filename
        repo_names = []
        for repo in request.repositories:
            repo_parts = repo.repo_url.rstrip('/').split('/')
            repo_name = repo_parts[-1] if len(repo_parts) > 0 else "repo"
            repo_names.append(repo_name)

        # Join repository names (limit to first 3 to avoid very long filenames)
        if len(repo_names) > 3:
            filename_prefix = f"{'-'.join(repo_names[:3])}-and-{len(repo_names)-3}-more"
        else:
            filename_prefix = "-".join(repo_names)

        # Get current timestamp for the filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        if request.format == "markdown":
            # Generate Markdown content
            content = generate_multi_repo_markdown_export(request.repositories, request.pages)
            filename = f"{filename_prefix}_wiki_{timestamp}.md"
            media_type = "text/markdown"
        else:  # JSON format
            # Generate JSON content
            content = generate_multi_repo_json_export(request.repositories, request.pages)
            filename = f"{filename_prefix}_wiki_{timestamp}.json"
            media_type = "application/json"

        # Create response with appropriate headers for file download
        response = Response(
            content=content,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

        return response

    except Exception as e:
        error_msg = f"Error exporting multi-repository wiki: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

def generate_multi_repo_markdown_export(repositories: List[Repository], pages: List[WikiPage]) -> str:
    """
    Generate Markdown export of wiki pages for multiple repositories.

    Args:
        repositories: List of repositories
        pages: List of wiki pages

    Returns:
        Markdown content as string
    """
    # Start with metadata
    markdown = f"# Multi-Repository Wiki Documentation\n\n"
    markdown += f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"

    # Add repository information
    markdown += "## Repositories\n\n"
    for i, repo in enumerate(repositories):
        markdown += f"{i+1}. [{repo.repo_url}]({repo.repo_url})"
        if repo.description:
            markdown += f" - {repo.description}"
        markdown += "\n"
    markdown += "\n"

    # Add table of contents
    markdown += "## Table of Contents\n\n"
    for page in pages:
        markdown += f"- [{page.title}](#{page.id})\n"
    markdown += "\n"

    # Add each page
    for page in pages:
        markdown += f"<a id='{page.id}'></a>\n\n"
        markdown += f"## {page.title}\n\n"

        # Add related files
        if page.filePaths and len(page.filePaths) > 0:
            markdown += "### Related Files\n\n"
            for file_path in page.filePaths:
                markdown += f"- `{file_path}`\n"
            markdown += "\n"

        # Add related pages
        if page.relatedPages and len(page.relatedPages) > 0:
            markdown += "### Related Pages\n\n"
            related_titles = []
            for related_id in page.relatedPages:
                # Find the title of the related page
                related_page = next((p for p in pages if p.id == related_id), None)
                if related_page:
                    related_titles.append(f"[{related_page.title}](#{related_id})")

            if related_titles:
                markdown += "Related topics: " + ", ".join(related_titles) + "\n\n"

        # Add page content
        markdown += f"{page.content}\n\n"
        markdown += "---\n\n"

    return markdown

def generate_multi_repo_json_export(repositories: List[Repository], pages: List[WikiPage]) -> str:
    """
    Generate JSON export of wiki pages for multiple repositories.

    Args:
        repositories: List of repositories
        pages: List of wiki pages

    Returns:
        JSON content as string
    """
    # Create a dictionary with metadata and pages
    export_data = {
        "metadata": {
            "repositories": [repo.repo_url for repo in repositories],
            "generated_at": datetime.now().isoformat(),
            "page_count": len(pages)
        },
        "repositories": [
            {
                "repo_url": repo.repo_url,
                "description": repo.description
            } for repo in repositories
        ],
        "pages": [page.model_dump() for page in pages]
    }

    # Convert to JSON string with pretty formatting
    return json.dumps(export_data, indent=2)

@app.get("/")
async def root():
    """Root endpoint to check if the API is running"""
    return {
        "message": "Welcome to Streaming API",
        "version": "1.0.0",
        "endpoints": {
            "Chat": [
                "POST /chat/completions/stream - Streaming chat completion",
            ],
            "Wiki": [
                "POST /export/wiki - Export wiki content as Markdown or JSON",
            ],
            "Repository": [
                "GET /local_repo/structure - Get structure of a local repository (with path parameter)",
            ],
            "Multi-Repository": [
                "POST /multi_repo/initialize - Initialize the multi-repository system",
                "POST /multi_repo/query - Query multiple repositories",
                "POST /multi_repo/export_wiki - Export wiki content for multiple repositories",
            ]
        }
    }
