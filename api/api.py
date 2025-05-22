import os
import logging
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from typing import List, Optional, Dict, Any, Literal
import json
from datetime import datetime
from pydantic import BaseModel, Field
import google.generativeai as genai
import asyncio

# Get a logger for this module
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

# Helper function to get adalflow root path
def get_adalflow_default_root_path() -> str:
    """
    Computes the default root path for adalflow application data.

    This path is typically located in the user's home directory under `.adalflow`.

    Returns:
        str: The absolute path to the adalflow root directory.
    """
    return os.path.expanduser(os.path.join("~", ".adalflow"))

# --- Pydantic Models ---

# Base model for WikiPage, needs to be defined before BaseWikiData
class WikiPage(BaseModel):
    """
    Represents a single page within a generated wiki.

    Attributes:
        id (str): A unique identifier for the wiki page.
        title (str): The title of the wiki page.
        content (str): The main content of the wiki page, often in Markdown.
        filePaths (List[str]): A list of source code file paths relevant to this page.
        importance (str): An indicator of the page's importance (e.g., 'high', 'medium', 'low').
                          Ideally, this would be a Literal type.
        relatedPages (List[str]): A list of IDs of other wiki pages that are related to this one.
    """
    id: str
    title: str
    content: str
    filePaths: List[str]
    importance: str # Should ideally be Literal['high', 'medium', 'low']
    relatedPages: List[str]

# Base model for WikiStructure, needs to be defined before BaseWikiData
class WikiStructureModel(BaseModel):
    """
    Defines the overall structure and metadata of a generated wiki.

    Attributes:
        id (str): A unique identifier for the wiki structure itself.
        title (str): The main title of the entire wiki.
        description (str): A brief description of the wiki's content or purpose.
        pages (List[WikiPage]): A list of WikiPage objects that make up the pages of this wiki.
    """
    id: str
    title: str
    description: str
    pages: List[WikiPage]

# New Base Models for common structures
class RepositoryInfo(BaseModel):
    """
    Encapsulates common identifying information for a code repository.

    Attributes:
        owner (str): The owner or organization of the repository (e.g., 'AsyncFuncAI').
        repo (str): The name of the repository (e.g., 'deepwiki-open').
        repo_type (str): The type of repository, indicating its origin (e.g., 'github', 'gitlab').
        language (str): The primary programming language of the content or wiki (e.g., 'en', 'python').
    """
    owner: str
    repo: str
    repo_type: str
    language: str

class BaseWikiData(BaseModel):
    """
    Represents the core data components of a cached wiki.

    This model groups the structural definition of a wiki with its generated page content.

    Attributes:
        wiki_structure (WikiStructureModel): The overall structure and metadata of the wiki.
        generated_pages (Dict[str, WikiPage]): A dictionary mapping page IDs to their
                                               corresponding WikiPage objects.
    """
    wiki_structure: WikiStructureModel
    generated_pages: Dict[str, WikiPage]

# Refactored Models
class ProcessedProjectEntry(RepositoryInfo):
    """
    Represents a project that has been processed and has its wiki data cached.

    Inherits repository identification fields from `RepositoryInfo`.

    Attributes:
        id (str): The unique identifier for this entry, typically the cache filename.
        name (str): A display name for the project, often in 'owner/repo' format.
        submittedAt (int): A Unix timestamp (in milliseconds) indicating when the project
                           was last processed or its cache entry was created/updated.
        owner (str): Inherited from RepositoryInfo. The owner of the repository.
        repo (str): Inherited from RepositoryInfo. The name of the repository.
        repo_type (str): Inherited from RepositoryInfo. The type of the repository (e.g., 'github').
        language (str): Inherited from RepositoryInfo. The language of the processed content.
    """
    id: str  # Filename, specific to this model
    name: str  # owner/repo combination, specific to this model
    submittedAt: int # Timestamp, specific to this model
    # owner, repo, repo_type, language are inherited from RepositoryInfo

class WikiCacheData(BaseWikiData):
    """
    Model for the complete data stored in the wiki cache for a single repository.

    Inherits the main wiki data components (`wiki_structure`, `generated_pages`)
    from `BaseWikiData`. This model essentially acts as a type alias for `BaseWikiData`
    but provides a specific name for cached wiki content.
    """
    # wiki_structure and generated_pages are inherited
    pass

class WikiCacheRequest(RepositoryInfo, BaseWikiData):
    """
    Represents the request payload for saving wiki data to the cache.

    This model combines repository identification from `RepositoryInfo` with the
    actual wiki content from `BaseWikiData`. It's used when clients send
    wiki data to be stored by the server.
    """
    # owner, repo, repo_type, language are inherited from RepositoryInfo
    # wiki_structure, generated_pages are inherited from BaseWikiData
    pass

class WikiExportRequest(BaseModel):
    """
    Defines the request structure for exporting wiki content.

    Attributes:
        repo_url (str): The URL of the repository for which the wiki is being exported.
                        This is used for metadata in the exported file.
        pages (List[WikiPage]): A list of `WikiPage` objects to be included in the export.
        format (Literal["markdown", "json"]): The desired format for the export.
                                             Must be either "markdown" or "json".
    """
    repo_url: str = Field(..., description="URL of the repository")
    pages: List[WikiPage] = Field(..., description="List of wiki pages to export")
    format: Literal["markdown", "json"] = Field(..., description="Export format (markdown or json)")

# --- Model Configuration Models ---
class Model(BaseModel):
    """
    Model for LLM model configuration
    """
    id: str = Field(..., description="Model identifier")
    name: str = Field(..., description="Display name for the model")

class Provider(BaseModel):
    """
    Model for LLM provider configuration
    """
    id: str = Field(..., description="Provider identifier")
    name: str = Field(..., description="Display name for the provider")
    models: List[Model] = Field(..., description="List of available models for this provider")
    supportsCustomModel: Optional[bool] = Field(False, description="Whether this provider supports custom models")

class ModelConfig(BaseModel):
    """
    Model for the entire model configuration
    """
    providers: List[Provider] = Field(..., description="List of available model providers")
    defaultProvider: str = Field(..., description="ID of the default provider")

from api.config import configs

@app.get("/models/config", response_model=ModelConfig)
async def get_model_config():
    """
    Retrieves the configuration of available model providers and their models.

    This endpoint allows the frontend or other clients to understand which
    Language Model (LLM) providers (e.g., Google, OpenAI) and specific models
    (e.g., Gemini Pro, GPT-4) are available for use within the application.
    It also indicates the default provider.

    Returns:
        ModelConfig: A Pydantic model instance containing a list of providers,
                     their supported models, and the ID of the default provider.

    Raises:
        HTTPException:
            - 500: If there's an unexpected error during the creation of the
                   model configuration from the server-side settings.
    """
    try:
        logger.info("Fetching model configurations")

        # Create providers from the config file
        providers = []
        default_provider = configs.get("default_provider", "google")

        # Add provider configuration based on config.py
        for provider_id, provider_config in configs["providers"].items():
            models = []
            # Add models from config
            for model_id in provider_config["models"].keys():
                # Get a more user-friendly display name if possible
                models.append(Model(id=model_id, name=model_id))

            # Add provider with its models
            providers.append(
                Provider(
                    id=provider_id,
                    name=f"{provider_id.capitalize()}",
                    supportsCustomModel=provider_config.get("supportsCustomModel", False),
                    models=models
                )
            )

        # Create and return the full configuration
        config = ModelConfig(
            providers=providers,
            defaultProvider=default_provider
        )
        return config

    except Exception as e:
        logger.error(f"Error creating model configuration: {str(e)}", exc_info=True)
        # It's better to raise an error than return a potentially incomplete default.
        # The frontend can decide how to handle this, e.g. by using a cached/fallback config.
        raise HTTPException(status_code=500, detail="Error creating model configuration.")

@app.post("/export/wiki")
async def export_wiki(request: WikiExportRequest):
    """
    Exports the provided wiki content as a downloadable Markdown or JSON file.

    The client submits a list of wiki pages and specifies the desired export format.
    The server then generates the file content and returns it as a file attachment.

    Args:
        request (WikiExportRequest): The request object containing the repository URL
                                     (for metadata), a list of `WikiPage` objects,
                                     and the desired export `format` ("markdown" or "json").

    Returns:
        Response: A FastAPI `Response` object that triggers a file download in the
                  client's browser. The file will contain the wiki content in the
                  requested format.

    Raises:
        HTTPException:
            - 400 (Bad Request): If an invalid export `format` is specified (though
              Pydantic's `Literal` type should catch this first), or if there's a
              `ValueError` during data processing (e.g., issues with `repo_url`
              or `pages` data that prevent export).
            - 500 (Internal Server Error): If an unexpected error occurs during
              the file generation or response creation process.
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
        elif request.format == "json":
            # Generate JSON content
            content = generate_json_export(request.repo_url, request.pages)
            filename = f"{repo_name}_wiki_{timestamp}.json"
            media_type = "application/json"
        else:
            # This case should ideally be caught by Pydantic/FastAPI due to Literal type
            logger.error(f"Invalid export format requested: {request.format}")
            raise HTTPException(status_code=400, detail=f"Invalid export format: {request.format}. Supported formats are 'markdown' and 'json'.")

        # Create response with appropriate headers for file download
        response = Response(
            content=content,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

        return response
    except ValueError as ve: # Example: if URL parsing or data processing fails
        logger.error(f"ValueError during wiki export: {str(ve)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Bad request data for wiki export: {str(ve)}")
    except Exception as e:
        logger.error(f"Error exporting wiki: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred while exporting the wiki.")

@app.get("/local_repo/structure")
async def get_local_repo_structure(path: str = Query(..., description="Absolute path to the local repository")):
    """
    Retrieves the file tree structure and README.md content for a local repository.

    This endpoint scans a specified local directory, builds a list of its files
    (excluding common VCS, Python, and OS-specific temporary files/directories),
    and attempts to read the content of the first README.md file it finds.

    Args:
        path (str): The absolute path to the local repository directory. This is a
                    required query parameter.

    Returns:
        Dict[str, str]: A dictionary containing:
            - "file_tree" (str): A string listing all relevant files, one per line,
                                 with paths relative to the provided repository root.
            - "readme" (str): The content of the first README.md found, or an empty
                              string if no README.md is found or it's unreadable.

    Raises:
        HTTPException:
            - 400 (Bad Request): If the 'path' query parameter is not provided.
            - 403 (Forbidden): If the server lacks read permissions for the specified
                               path or files within it.
            - 404 (Not Found): If the specified 'path' is not a directory or does not exist.
            - 500 (Internal Server Error): If an unexpected `OSError` or other exception
                               occurs during file system operations.
    """
    if not path:
        # This check is technically redundant if Query(..., description=...) is used,
        # as FastAPI/Pydantic would handle the missing required parameter with a 422.
        # However, keeping it for explicit clarity or if Query might be changed.
        raise HTTPException(
            status_code=400,
            detail="No path provided. Please provide a 'path' query parameter."
        )

    try:
        logger.info(f"Processing local repository at: {path}")
        if not os.path.isdir(path): # Check if path is a directory
            logger.warning(f"Directory not found: {path}")
            raise HTTPException(status_code=404, detail=f"Directory not found: {path}")
        
        if not os.access(path, os.R_OK): # Check for read permissions
            logger.error(f"Permission denied for path: {path}")
            raise HTTPException(status_code=403, detail=f"Permission denied for path: {path}")

        file_tree_lines = []
        readme_content = ""

        for root, dirs, files in os.walk(path, topdown=True):
            # Exclude hidden dirs/files and virtual envs
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__' and d != 'node_modules' and d != '.venv']
            for file in files:
                if file.startswith('.') or file == '__init__.py' or file == '.DS_Store':
                    continue
                
                file_abs_path = os.path.join(root, file)
                if not os.access(file_abs_path, os.R_OK): # Check read permission for each file
                    logger.warning(f"Skipping unreadable file: {file_abs_path}")
                    continue

                rel_dir = os.path.relpath(root, path)
                rel_file = os.path.join(rel_dir, file) if rel_dir != '.' else file
                file_tree_lines.append(rel_file)
                
                # Find README.md (case-insensitive)
                if file.lower() == 'readme.md' and not readme_content:
                    try:
                        with open(file_abs_path, 'r', encoding='utf-8') as f:
                            readme_content = f.read()
                    except IOError as e:
                        logger.warning(f"Could not read README.md at {file_abs_path}: {str(e)}")
                        readme_content = "" # Keep it as empty if unreadable
                    except Exception as e: # Catch other potential errors during README read
                        logger.warning(f"An unexpected error occurred while reading README.md at {file_abs_path}: {str(e)}")
                        readme_content = ""


        file_tree_str = '\n'.join(sorted(file_tree_lines))
        return {"file_tree": file_tree_str, "readme": readme_content}
    except HTTPException: # Re-raise HTTPExceptions directly
        raise
    except FileNotFoundError: # Should be caught by is_dir or os.walk
        logger.error(f"Directory not found during processing: {path}", exc_info=True)
        raise HTTPException(status_code=404, detail=f"Directory not found: {path}")
    except PermissionError: # Should be caught by os.access checks
        logger.error(f"Permission error processing local repository: {path}", exc_info=True)
        raise HTTPException(status_code=403, detail=f"Permission denied while processing repository: {path}")
    except OSError as e:
        logger.error(f"OS error processing local repository {path}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"A file system error occurred while processing the repository.")
    except Exception as e:
        logger.error(f"Error processing local repository {path}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred while processing the local repository.")

def generate_markdown_export(repo_url: str, pages: List[WikiPage]) -> str:
    """
    Generates a Markdown string from a list of wiki pages.

    The Markdown includes a main title with the repository URL, a generation timestamp,
    a table of contents linking to each page, and then the content of each page.
    Page sections are demarcated, and related pages are listed if available.

    Args:
        repo_url (str): The URL of the repository, used for the main title.
        pages (List[WikiPage]): A list of `WikiPage` objects to be included in the
                                Markdown export.

    Returns:
        str: A single string containing the complete wiki documentation in Markdown format.
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
    Generates a JSON string representing an export of wiki pages.

    The JSON structure includes metadata (repository URL, generation timestamp, page count)
    and a list of all pages, where each page is serialized from its `WikiPage` model.

    Args:
        repo_url (str): The URL of the repository, included in the metadata.
        pages (List[WikiPage]): A list of `WikiPage` objects to be included in the JSON.

    Returns:
        str: A JSON string representing the exported wiki data, pretty-printed with an
             indent of 2 spaces.
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
from api.simple_chat import chat_completions_stream

# Add the chat_completions_stream endpoint to the main app
app.add_api_route("/chat/completions/stream", chat_completions_stream, methods=["POST"])

# --- Wiki Cache Helper Functions ---

WIKI_CACHE_DIR = os.path.join(get_adalflow_default_root_path(), "wikicache")
os.makedirs(WIKI_CACHE_DIR, exist_ok=True)

def get_wiki_cache_path(owner: str, repo: str, repo_type: str, language: str) -> str:
    """
    Generates the standardized file path for a given wiki cache.

    The path is constructed using the WIKI_CACHE_DIR base, and a filename
    that includes the repository type, owner, name, and language.

    Args:
        owner (str): The owner of the repository.
        repo (str): The name of the repository.
        repo_type (str): The type of the repository (e.g., 'github').
        language (str): The language of the cached wiki content.

    Returns:
        str: The absolute file path for the specified wiki cache JSON file.
    """
    filename = f"deepwiki_cache_{repo_type}_{owner}_{repo}_{language}.json"
    return os.path.join(WIKI_CACHE_DIR, filename)

async def read_wiki_cache(owner: str, repo: str, repo_type: str, language: str) -> Optional[WikiCacheData]:
    """
    Reads and deserializes wiki cache data from the file system.

    If the cache file for the specified repository parameters exists, this function
    attempts to read it, parse its JSON content, and validate it against the
    `WikiCacheData` Pydantic model.

    Args:
        owner (str): The owner of the repository.
        repo (str): The name of the repository.
        repo_type (str): The type of the repository.
        language (str): The language of the wiki content.

    Returns:
        Optional[WikiCacheData]: An instance of `WikiCacheData` if the cache file
                                 is found and successfully parsed. Returns `None`
                                 if the cache file does not exist.
    Raises:
        HTTPException:
            - 500 (Internal Server Error): If there's an `IOError` reading the file,
              a `json.JSONDecodeError` parsing the JSON, or any other unexpected
              error during Pydantic model validation or processing.
    """
    cache_path = get_wiki_cache_path(owner, repo, repo_type, language)
    if not os.path.exists(cache_path):
        return None # Cache not found is not an error for this function's contract

    try:
        with open(cache_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return WikiCacheData(**data)
    except json.JSONDecodeError as e:
        logger.error(f"JSONDecodeError reading wiki cache from {cache_path}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error decoding wiki cache file: {cache_path}")
    except IOError as e:
        logger.error(f"IOError reading wiki cache from {cache_path}: {e.strerror}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"IOError reading wiki cache file: {cache_path}")
    except Exception as e: # Catch any other Pydantic validation errors or unexpected issues
        logger.error(f"Unexpected error reading wiki cache from {cache_path}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Unexpected error processing wiki cache file: {cache_path}")


async def save_wiki_cache(data: WikiCacheRequest) -> bool:
    """
    Saves provided wiki data to a cache file on the server's file system.

    The data, encapsulated in a `WikiCacheRequest` object, is first structured
    into a `WikiCacheData` payload. This payload is then serialized to JSON
    and written to a file whose path is determined by the repository details
    (owner, repo, type, language).

    Args:
        data (WikiCacheRequest): The wiki data to be cached. This includes
                                 repository identifiers and the wiki content itself.

    Returns:
        bool: `True` if the wiki cache was successfully saved, `False` otherwise.
              Failures are typically due to `IOError` or other unexpected exceptions
              during file writing or data serialization, which are logged.
    """
    cache_path = get_wiki_cache_path(data.owner, data.repo, data.repo_type, data.language)
    logger.info(f"Attempting to save wiki cache. Path: {cache_path}")
    try:
        payload = WikiCacheData(
            wiki_structure=data.wiki_structure,
            generated_pages=data.generated_pages
        )
        # Log size of data to be cached for debugging (avoid logging full content if large)
        try:
            payload_json = payload.model_dump_json()
            payload_size = len(payload_json.encode('utf-8'))
            logger.info(f"Payload prepared for caching. Size: {payload_size} bytes.")
        except Exception as ser_e:
            logger.warning(f"Could not serialize payload for size logging: {ser_e}")


        logger.info(f"Writing cache file to: {cache_path}")
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(payload.model_dump(), f, indent=2)
        logger.info(f"Wiki cache successfully saved to {cache_path}")
        return True
    except IOError as e:
        logger.error(f"IOError saving wiki cache to {cache_path}: {e.strerror} (errno: {e.errno})", exc_info=True)
        return False
    except Exception as e:
        logger.error(f"Unexpected error saving wiki cache to {cache_path}: {e}", exc_info=True)
        return False

# --- Wiki Cache API Endpoints ---

@app.get("/api/wiki_cache", response_model=Optional[WikiCacheData])
async def get_cached_wiki(
    owner: str = Query(..., description="Repository owner"),
    repo: str = Query(..., description="Repository name"),
    repo_type: str = Query(..., description="Repository type (e.g., github, gitlab)"),
    language: str = Query(..., description="Language of the wiki content")
):
    """
    Retrieves cached wiki data for a specified repository.

    This endpoint fetches the `WikiCacheData` (which includes the wiki structure
    and all generated pages) based on the repository owner, name, type, and language.

    Args:
        owner (str): The owner of the repository (e.g., 'AsyncFuncAI').
                     Query parameter.
        repo (str): The name of the repository (e.g., 'deepwiki-open').
                    Query parameter.
        repo_type (str): The type of repository (e.g., 'github', 'gitlab').
                         Query parameter.
        language (str): The language of the cached wiki content (e.g., 'en').
                        Query parameter.

    Returns:
        Optional[WikiCacheData]: The cached wiki data if found. If the cache entry
                                 does not exist, it returns `None` with a 200 OK status,
                                 as per current frontend expectations.
                                 (Alternatively, a 404 could be raised).
    Raises:
        HTTPException:
            - 500 (Internal Server Error): If `read_wiki_cache` encounters an issue
              (e.g., file corruption, permission issues not caught by `read_wiki_cache`
              itself, or other unexpected errors during cache retrieval).
    """
    logger.info(f"Attempting to retrieve wiki cache for {owner}/{repo} ({repo_type}), lang: {language}")
    try:
        cached_data = await read_wiki_cache(owner, repo, repo_type, language)
        if cached_data:
            return cached_data
        else:
            # As per existing comment, frontend expects 200 with null body if not found.
            # If 404 is preferred, change here.
            logger.info(f"Wiki cache not found for {owner}/{repo} ({repo_type}), lang: {language}")
            return None # This will result in a 200 OK with a null body.
                        # To return 404: raise HTTPException(status_code=404, detail="Wiki cache not found")
    except HTTPException: # Re-raise if read_wiki_cache raised one
        raise
    except Exception as e: # Catch any other unexpected errors from read_wiki_cache
        logger.error(f"Unexpected error retrieving cache for {owner}/{repo}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred while retrieving the wiki cache.")


@app.post("/api/wiki_cache")
async def store_wiki_cache(request_data: WikiCacheRequest):
    """
    Stores provided wiki data (structure and generated pages) to the server-side cache.

    The client sends a `WikiCacheRequest` payload containing all necessary
    repository identification and the wiki content to be saved.

    Args:
        request_data (WikiCacheRequest): The complete wiki data to be cached,
                                         including repository details and content.

    Returns:
        Dict[str, str]: A JSON response with a "message" indicating successful saving.

    Raises:
        HTTPException:
            - 500 (Internal Server Error): If `save_wiki_cache` returns `False`
              (indicating a logged failure during the save operation) or if any
              other unexpected server error occurs.
    """
    logger.info(f"Attempting to save wiki cache for {request_data.owner}/{request_data.repo} ({request_data.repo_type}), lang: {request_data.language}")
    try:
        success = await save_wiki_cache(request_data)
        if success:
            return {"message": "Wiki cache saved successfully"}
        else:
            # save_wiki_cache now logs specific errors.
            # The detail message here should be generic.
            raise HTTPException(status_code=500, detail="Failed to save wiki cache due to a server-side issue.")
    except HTTPException: # If save_wiki_cache itself raises an HTTPException (though it currently doesn't)
        raise
    except Exception as e: # For any other unexpected errors
        logger.error(f"Unexpected error in store_wiki_cache endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected server error occurred while attempting to save the wiki cache.")

@app.delete("/api/wiki_cache")
async def delete_wiki_cache(
    owner: str = Query(..., description="Repository owner"),
    repo: str = Query(..., description="Repository name"),
    repo_type: str = Query(..., description="Repository type (e.g., github, gitlab)"),
    language: str = Query(..., description="Language of the wiki content")
):
    """
    Deletes a specific wiki cache file from the server's file system.

    The cache to be deleted is identified by the repository owner, name, type,
    and language.

    Args:
        owner (str): The owner of the repository. Query parameter.
        repo (str): The name of the repository. Query parameter.
        repo_type (str): The type of the repository. Query parameter.
        language (str): The language of the wiki content to be deleted. Query parameter.

    Returns:
        Dict[str, str]: A JSON response with a "message" indicating successful deletion.

    Raises:
        HTTPException:
            - 403 (Forbidden): If there's a `PermissionError` while trying to delete the file.
            - 404 (Not Found): If the specified cache file does not exist.
            - 500 (Internal Server Error): If an `OSError` (other than `FileNotFoundError`
              or `PermissionError`) or any other unexpected exception occurs during deletion.
    """
    logger.info(f"Attempting to delete wiki cache for {owner}/{repo} ({repo_type}), lang: {language}")
    cache_path = get_wiki_cache_path(owner, repo, repo_type, language)

    if os.path.exists(cache_path):
        try:
            os.remove(cache_path)
            logger.info(f"Successfully deleted wiki cache: {cache_path}")
            return {"message": f"Wiki cache for {owner}/{repo} ({language}) deleted successfully"}
        except FileNotFoundError: # Should be caught by os.path.exists, but as a safeguard
            logger.warning(f"Wiki cache not found during deletion attempt: {cache_path}", exc_info=True)
            raise HTTPException(status_code=404, detail="Wiki cache not found.")
        except PermissionError:
            logger.error(f"Permission error deleting wiki cache {cache_path}", exc_info=True)
            raise HTTPException(status_code=403, detail=f"Permission denied when trying to delete wiki cache: {cache_path}")
        except OSError as e:
            logger.error(f"OS error deleting wiki cache {cache_path}: {e.strerror}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"A file system error occurred while deleting the wiki cache.")
        except Exception as e:
            logger.error(f"Unexpected error deleting wiki cache {cache_path}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="An unexpected error occurred while deleting the wiki cache.")
    else:
        logger.warning(f"Wiki cache not found, cannot delete: {cache_path}")
        raise HTTPException(status_code=404, detail="Wiki cache not found")

@app.get("/")
async def root() -> Dict[str, Any]:
    """
    Provides a simple welcome message and a list of available endpoint categories.

    This root endpoint can be used as a basic health check or for API discovery.

    Returns:
        Dict[str, Any]: A dictionary containing a welcome message, API version,
                        and a breakdown of available endpoint groups (Chat, Wiki, LocalRepo).
    """
    return {
        "message": "Welcome to Streaming API",
        "version": "1.0.0",
        "endpoints": {
            "Chat": [
                "POST /chat/completions/stream - Streaming chat completion",
            ],
            "Wiki": [
                "POST /export/wiki - Export wiki content as Markdown or JSON",
                "GET /api/wiki_cache - Retrieve cached wiki data",
                "POST /api/wiki_cache - Store wiki data to cache"
            ],
            "LocalRepo": [
                "GET /local_repo/structure - Get structure of a local repository (with path parameter)",
            ]
        }
    }

# --- Processed Projects Endpoint --- (New Endpoint)
@app.get("/api/processed_projects", response_model=List[ProcessedProjectEntry])
async def get_processed_projects():
    """
    Lists all processed projects by scanning the wiki cache directory.

    Projects are identified by filenames matching the pattern
    `deepwiki_cache_{repo_type}_{owner}_{repo}_{language}.json`.
    For each valid cache file found, it extracts metadata like owner, repo name,
    type, language, and last modification time (as `submittedAt`).

    Returns:
        List[ProcessedProjectEntry]: A list of `ProcessedProjectEntry` objects,
                                     sorted by `submittedAt` timestamp in descending
                                     order (most recent first). Returns an empty list
                                     if the cache directory doesn't exist or no
                                     valid cache files are found.
    Raises:
        HTTPException:
            - 403 (Forbidden): If the server lacks read permissions for the
                               `WIKI_CACHE_DIR`.
            - 500 (Internal Server Error): If there's an `OSError` listing the
                               cache directory, or any other unexpected error occurs
                               during the process of scanning files and parsing their names.
    """
    project_entries: List[ProcessedProjectEntry] = []
    # WIKI_CACHE_DIR is already defined globally in the file

    try:
        if not os.path.exists(WIKI_CACHE_DIR):
            logger.info(f"Cache directory {WIKI_CACHE_DIR} not found. Returning empty list.")
            return []
        
        if not os.access(WIKI_CACHE_DIR, os.R_OK):
            logger.error(f"Permission denied for cache directory: {WIKI_CACHE_DIR}")
            raise HTTPException(status_code=403, detail=f"Permission denied for cache directory: {WIKI_CACHE_DIR}")

        logger.info(f"Scanning for project cache files in: {WIKI_CACHE_DIR}")
        # Use asyncio.to_thread for os.listdir to avoid blocking
        try:
            filenames = await asyncio.to_thread(os.listdir, WIKI_CACHE_DIR)
        except OSError as e:
            logger.error(f"OSError listing directory {WIKI_CACHE_DIR}: {e.strerror}", exc_info=True)
            raise HTTPException(status_code=500, detail="Error reading cache directory contents.")


        for filename in filenames:
            if filename.startswith("deepwiki_cache_") and filename.endswith(".json"):
                file_path = os.path.join(WIKI_CACHE_DIR, filename)
                try:
                    # Use asyncio.to_thread for os.stat
                    if not os.access(file_path, os.R_OK):
                        logger.warning(f"Skipping unreadable cache file: {file_path}")
                        continue
                    
                    stats = await asyncio.to_thread(os.stat, file_path)
                    parts = filename.replace("deepwiki_cache_", "").replace(".json", "").split('_')

                    if len(parts) >= 4:
                        repo_type = parts[0]
                        owner = parts[1]
                        language = parts[-1]
                        repo = "_".join(parts[2:-1])

                        project_entries.append(
                            ProcessedProjectEntry(
                                id=filename,
                                owner=owner,
                                repo=repo,
                                name=f"{owner}/{repo}",
                                repo_type=repo_type,
                                submittedAt=int(stats.st_mtime * 1000),
                                language=language
                            )
                        )
                    else:
                        logger.warning(f"Could not parse project details from filename: {filename}. Parts: {parts}")
                except FileNotFoundError: # Should not happen if os.listdir worked, but good for safety
                    logger.warning(f"Cache file not found during processing: {file_path}", exc_info=True)
                    continue # Skip this file
                except OSError as e:
                    logger.error(f"OSError processing file {file_path}: {e.strerror}", exc_info=True)
                    continue # Skip this file on stat error
                except Exception as e: # Catch other errors like Pydantic validation or unexpected issues
                    logger.error(f"Unexpected error processing project entry for file {file_path}: {e}", exc_info=True)
                    continue # Skip this file

        project_entries.sort(key=lambda p: p.submittedAt, reverse=True)
        logger.info(f"Found {len(project_entries)} processed project entries.")
        return project_entries
    except HTTPException: # Re-raise HTTPExceptions directly
        raise
    except Exception as e: # Catch-all for any other unexpected errors
        logger.error(f"Error listing processed projects from {WIKI_CACHE_DIR}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred while listing processed projects.")
