import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query, Request, WebSocket
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


# --- Lifespan Context Manager ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI application.

    Handles startup and shutdown events for the sync scheduler.
    """
    # Startup: Start the sync scheduler
    logger.info("Starting sync scheduler...")
    try:
        # Import here to avoid circular imports
        from api.sync_scheduler import start_scheduler, stop_scheduler

        # Check if sync is enabled via environment variable
        sync_enabled = os.environ.get("DEEPWIKI_SYNC_ENABLED", "true").lower() == "true"

        if sync_enabled:
            await start_scheduler()
            logger.info("Sync scheduler started successfully")
        else:
            logger.info("Sync scheduler is disabled via DEEPWIKI_SYNC_ENABLED=false")
    except Exception as e:
        logger.error(f"Failed to start sync scheduler: {e}")

    yield  # Application runs here

    # Shutdown: Stop the sync scheduler
    logger.info("Stopping sync scheduler...")
    try:
        from api.sync_scheduler import stop_scheduler
        await stop_scheduler()
        logger.info("Sync scheduler stopped successfully")
    except Exception as e:
        logger.error(f"Error stopping sync scheduler: {e}")


# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Streaming API",
    description="API for streaming chat completions",
    lifespan=lifespan
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
def get_adalflow_default_root_path():
    return os.path.expanduser(os.path.join("~", ".adalflow"))

# --- Pydantic Models ---
class WikiPage(BaseModel):
    """
    Model for a wiki page.
    """
    id: str
    title: str
    content: str
    filePaths: List[str]
    importance: str # Should ideally be Literal['high', 'medium', 'low']
    relatedPages: List[str]

class ProcessedProjectEntry(BaseModel):
    id: str  # Filename
    owner: str
    repo: str
    name: str  # owner/repo
    repo_type: str # Renamed from type to repo_type for clarity with existing models
    submittedAt: int # Timestamp
    language: str # Extracted from filename

class WikiStructureModel(BaseModel):
    """
    Model for the overall wiki structure.
    """
    id: str
    title: str
    description: str
    pages: List[WikiPage]

class WikiCacheData(BaseModel):
    """
    Model for the data to be stored in the wiki cache.
    """
    wiki_structure: WikiStructureModel
    generated_pages: Dict[str, WikiPage]

class WikiCacheRequest(BaseModel):
    """
    Model for the request body when saving wiki cache.
    """
    owner: str
    repo: str
    repo_type: str
    language: str
    wiki_structure: WikiStructureModel
    generated_pages: Dict[str, WikiPage]

class WikiExportRequest(BaseModel):
    """
    Model for requesting a wiki export.
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
from api.sync_scheduler import (
    get_scheduler, start_scheduler, stop_scheduler,
    SyncStatus, SyncMetadata
)

@app.get("/models/config", response_model=ModelConfig)
async def get_model_config():
    """
    Get available model providers and their models.

    This endpoint returns the configuration of available model providers and their
    respective models that can be used throughout the application.

    Returns:
        ModelConfig: A configuration object containing providers and their models
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
        logger.error(f"Error creating model configuration: {str(e)}")
        # Return some default configuration in case of error
        return ModelConfig(
            providers=[
                Provider(
                    id="google",
                    name="Google",
                    supportsCustomModel=True,
                    models=[
                        Model(id="gemini-2.0-flash", name="Gemini 2.0 Flash")
                    ]
                )
            ],
            defaultProvider="google"
        )

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
from api.simple_chat import chat_completions_stream
from api.websocket_wiki import handle_websocket_chat

# Add the chat_completions_stream endpoint to the main app
app.add_api_route("/chat/completions/stream", chat_completions_stream, methods=["POST"])

# Add the WebSocket endpoint
app.add_websocket_route("/ws/chat", handle_websocket_chat)

# --- Wiki Cache Helper Functions ---

WIKI_CACHE_DIR = os.path.join(get_adalflow_default_root_path(), "wikicache")
os.makedirs(WIKI_CACHE_DIR, exist_ok=True)

def get_wiki_cache_path(owner: str, repo: str, repo_type: str, language: str) -> str:
    """Generates the file path for a given wiki cache."""
    filename = f"deepwiki_cache_{repo_type}_{owner}_{repo}_{language}.json"
    return os.path.join(WIKI_CACHE_DIR, filename)

async def read_wiki_cache(owner: str, repo: str, repo_type: str, language: str) -> Optional[WikiCacheData]:
    """Reads wiki cache data from the file system."""
    cache_path = get_wiki_cache_path(owner, repo, repo_type, language)
    if os.path.exists(cache_path):
        try:
            with open(cache_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return WikiCacheData(**data)
        except Exception as e:
            logger.error(f"Error reading wiki cache from {cache_path}: {e}")
            return None
    return None

async def save_wiki_cache(data: WikiCacheRequest) -> bool:
    """Saves wiki cache data to the file system."""
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
    Retrieves cached wiki data (structure and generated pages) for a repository.
    """
    logger.info(f"Attempting to retrieve wiki cache for {owner}/{repo} ({repo_type}), lang: {language}")
    cached_data = await read_wiki_cache(owner, repo, repo_type, language)
    if cached_data:
        return cached_data
    else:
        # Return 200 with null body if not found, as frontend expects this behavior
        # Or, raise HTTPException(status_code=404, detail="Wiki cache not found") if preferred
        logger.info(f"Wiki cache not found for {owner}/{repo} ({repo_type}), lang: {language}")
        return None

@app.post("/api/wiki_cache")
async def store_wiki_cache(request_data: WikiCacheRequest):
    """
    Stores generated wiki data (structure and pages) to the server-side cache.
    """
    logger.info(f"Attempting to save wiki cache for {request_data.owner}/{request_data.repo} ({request_data.repo_type}), lang: {request_data.language}")
    success = await save_wiki_cache(request_data)
    if success:
        return {"message": "Wiki cache saved successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to save wiki cache")

@app.delete("/api/wiki_cache")
async def delete_wiki_cache(
    owner: str = Query(..., description="Repository owner"),
    repo: str = Query(..., description="Repository name"),
    repo_type: str = Query(..., description="Repository type (e.g., github, gitlab)"),
    language: str = Query(..., description="Language of the wiki content")
):
    """
    Deletes a specific wiki cache from the file system.
    """
    logger.info(f"Attempting to delete wiki cache for {owner}/{repo} ({repo_type}), lang: {language}")
    cache_path = get_wiki_cache_path(owner, repo, repo_type, language)

    if os.path.exists(cache_path):
        try:
            os.remove(cache_path)
            logger.info(f"Successfully deleted wiki cache: {cache_path}")
            return {"message": f"Wiki cache for {owner}/{repo} ({language}) deleted successfully"}
        except Exception as e:
            logger.error(f"Error deleting wiki cache {cache_path}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to delete wiki cache: {str(e)}")
    else:
        logger.warning(f"Wiki cache not found, cannot delete: {cache_path}")
        raise HTTPException(status_code=404, detail="Wiki cache not found")

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker and monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "deepwiki-api"
    }

@app.get("/")
async def root():
    """Root endpoint to check if the API is running"""
    return {
        "message": "Welcome to Streaming API",
        "version": "1.0.0",
        "endpoints": {
            "Chat": [
                "POST /chat/completions/stream - Streaming chat completion (HTTP)",
                "WebSocket /ws/chat - WebSocket chat completion",
            ],
            "Wiki": [
                "POST /export/wiki - Export wiki content as Markdown or JSON",
                "GET /api/wiki_cache - Retrieve cached wiki data",
                "POST /api/wiki_cache - Store wiki data to cache"
            ],
            "Sync": [
                "GET /api/sync/status - Get sync scheduler status",
                "GET /api/sync/projects - List all sync projects",
                "POST /api/sync/projects - Add project for periodic sync",
                "GET /api/sync/projects/{repo_type}/{owner}/{repo} - Get project sync status",
                "PUT /api/sync/projects/{repo_type}/{owner}/{repo} - Update project sync settings",
                "DELETE /api/sync/projects/{repo_type}/{owner}/{repo} - Remove project from sync",
                "POST /api/sync/projects/{repo_type}/{owner}/{repo}/trigger - Manually trigger sync",
                "GET /api/sync/projects/{repo_type}/{owner}/{repo}/check - Check for updates"
            ],
            "LocalRepo": [
                "GET /local_repo/structure - Get structure of a local repository (with path parameter)",
            ],
            "Health": [
                "GET /health - Health check endpoint"
            ]
        }
    }

# --- Processed Projects Endpoint --- (New Endpoint)
@app.get("/api/processed_projects", response_model=List[ProcessedProjectEntry])
async def get_processed_projects():
    """
    Lists all processed projects found in the wiki cache directory.
    Projects are identified by files named like: deepwiki_cache_{repo_type}_{owner}_{repo}_{language}.json
    """
    project_entries: List[ProcessedProjectEntry] = []
    # WIKI_CACHE_DIR is already defined globally in the file

    try:
        if not os.path.exists(WIKI_CACHE_DIR):
            logger.info(f"Cache directory {WIKI_CACHE_DIR} not found. Returning empty list.")
            return []

        logger.info(f"Scanning for project cache files in: {WIKI_CACHE_DIR}")
        filenames = await asyncio.to_thread(os.listdir, WIKI_CACHE_DIR) # Use asyncio.to_thread for os.listdir

        for filename in filenames:
            if filename.startswith("deepwiki_cache_") and filename.endswith(".json"):
                file_path = os.path.join(WIKI_CACHE_DIR, filename)
                try:
                    stats = await asyncio.to_thread(os.stat, file_path) # Use asyncio.to_thread for os.stat
                    parts = filename.replace("deepwiki_cache_", "").replace(".json", "").split('_')

                    # Expecting repo_type_owner_repo_language
                    # Example: deepwiki_cache_github_AsyncFuncAI_deepwiki-open_en.json
                    # parts = [github, AsyncFuncAI, deepwiki-open, en]
                    if len(parts) >= 4:
                        repo_type = parts[0]
                        owner = parts[1]
                        language = parts[-1] # language is the last part
                        repo = "_".join(parts[2:-1]) # repo can contain underscores

                        project_entries.append(
                            ProcessedProjectEntry(
                                id=filename,
                                owner=owner,
                                repo=repo,
                                name=f"{owner}/{repo}",
                                repo_type=repo_type,
                                submittedAt=int(stats.st_mtime * 1000), # Convert to milliseconds
                                language=language
                            )
                        )
                    else:
                        logger.warning(f"Could not parse project details from filename: {filename}")
                except Exception as e:
                    logger.error(f"Error processing file {file_path}: {e}")
                    continue # Skip this file on error

        # Sort by most recent first
        project_entries.sort(key=lambda p: p.submittedAt, reverse=True)
        logger.info(f"Found {len(project_entries)} processed project entries.")
        return project_entries

    except Exception as e:
        logger.error(f"Error listing processed projects from {WIKI_CACHE_DIR}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list processed projects from server cache.")


# --- Sync API Models ---

class SyncProjectRequest(BaseModel):
    """Request model for adding a project for periodic sync"""
    repo_url: str = Field(..., description="Full URL of the repository")
    owner: str = Field(..., description="Repository owner/organization")
    repo: str = Field(..., description="Repository name")
    repo_type: str = Field(default="github", description="Type of repository (github, gitlab, bitbucket)")
    sync_interval_minutes: int = Field(default=60, description="How often to sync (in minutes)")
    access_token: Optional[str] = Field(default=None, description="Access token for private repositories")
    enabled: bool = Field(default=True, description="Whether sync is enabled")


class SyncProjectUpdateRequest(BaseModel):
    """Request model for updating sync settings"""
    sync_interval_minutes: Optional[int] = Field(default=None, description="How often to sync (in minutes)")
    enabled: Optional[bool] = Field(default=None, description="Whether sync is enabled")


class SyncStatusResponse(BaseModel):
    """Response model for sync status"""
    repo_url: str
    owner: str
    repo: str
    repo_type: str
    last_synced: Optional[str] = None
    last_commit_hash: Optional[str] = None
    sync_status: str
    sync_interval_minutes: int
    document_count: int
    embedding_count: int
    error_message: Optional[str] = None
    next_sync: Optional[str] = None
    enabled: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class SyncTriggerResponse(BaseModel):
    """Response model for sync trigger"""
    success: bool
    skipped: Optional[bool] = None
    reason: Optional[str] = None
    document_count: Optional[int] = None
    embedding_count: Optional[int] = None
    commit_hash: Optional[str] = None
    error: Optional[str] = None


class UpdateCheckResponse(BaseModel):
    """Response model for update check"""
    has_updates: bool
    remote_commit: Optional[str] = None
    local_commit: Optional[str] = None
    changed_files: List[str] = []
    reason: Optional[str] = None
    error: Optional[str] = None


# --- Sync API Endpoints ---

@app.post("/api/sync/projects", response_model=SyncStatusResponse)
async def add_sync_project(request: SyncProjectRequest):
    """
    Add a project for periodic index synchronization.

    This endpoint registers a repository for automatic periodic sync.
    The scheduler will periodically check for changes and re-index when updates are detected.
    """
    try:
        scheduler = get_scheduler()
        metadata = scheduler.add_project(
            repo_url=request.repo_url,
            owner=request.owner,
            repo=request.repo,
            repo_type=request.repo_type,
            sync_interval_minutes=request.sync_interval_minutes,
            access_token=request.access_token,
            enabled=request.enabled
        )
        logger.info(f"Added project for sync: {request.owner}/{request.repo}")
        return SyncStatusResponse(**metadata.to_dict())
    except Exception as e:
        logger.error(f"Error adding project for sync: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sync/projects", response_model=List[SyncStatusResponse])
async def get_all_sync_projects():
    """
    Get all projects registered for periodic synchronization.
    """
    try:
        scheduler = get_scheduler()
        projects = scheduler.get_all_projects()
        return [SyncStatusResponse(**p) for p in projects]
    except Exception as e:
        logger.error(f"Error getting sync projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sync/projects/{repo_type}/{owner}/{repo}", response_model=SyncStatusResponse)
async def get_sync_project_status(repo_type: str, owner: str, repo: str):
    """
    Get sync status for a specific project.
    """
    try:
        scheduler = get_scheduler()
        status = scheduler.get_project_status(owner, repo, repo_type)
        if not status:
            raise HTTPException(status_code=404, detail="Project not found")
        return SyncStatusResponse(**status)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/sync/projects/{repo_type}/{owner}/{repo}", response_model=SyncStatusResponse)
async def update_sync_project(repo_type: str, owner: str, repo: str, request: SyncProjectUpdateRequest):
    """
    Update sync settings for a project.
    """
    try:
        scheduler = get_scheduler()
        status = scheduler.update_project_settings(
            owner=owner,
            repo=repo,
            repo_type=repo_type,
            sync_interval_minutes=request.sync_interval_minutes,
            enabled=request.enabled
        )
        if not status:
            raise HTTPException(status_code=404, detail="Project not found")
        return SyncStatusResponse(**status)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating project settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/sync/projects/{repo_type}/{owner}/{repo}")
async def remove_sync_project(repo_type: str, owner: str, repo: str):
    """
    Remove a project from periodic synchronization.
    """
    try:
        scheduler = get_scheduler()
        success = scheduler.remove_project(owner, repo, repo_type)
        if not success:
            raise HTTPException(status_code=404, detail="Project not found or could not be removed")
        return {"message": f"Project {owner}/{repo} removed from sync"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sync/projects/{repo_type}/{owner}/{repo}/trigger", response_model=SyncTriggerResponse)
async def trigger_sync(repo_type: str, owner: str, repo: str):
    """
    Manually trigger a sync for a project.

    This will force a re-index of the repository, regardless of whether changes are detected.
    """
    try:
        scheduler = get_scheduler()
        result = await scheduler.trigger_sync(owner, repo, repo_type)
        return SyncTriggerResponse(**result)
    except Exception as e:
        logger.error(f"Error triggering sync: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sync/projects/{repo_type}/{owner}/{repo}/check", response_model=UpdateCheckResponse)
async def check_for_updates(repo_type: str, owner: str, repo: str):
    """
    Check if a project has updates without actually syncing.

    This is useful to preview what would happen during a sync.
    """
    try:
        scheduler = get_scheduler()
        result = scheduler.check_for_updates(owner, repo, repo_type)
        return UpdateCheckResponse(**result)
    except Exception as e:
        logger.error(f"Error checking for updates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sync/status")
async def get_scheduler_status():
    """
    Get the overall status of the sync scheduler.
    """
    try:
        scheduler = get_scheduler()
        projects = scheduler.get_all_projects()

        # Count projects by status
        status_counts = {
            "pending": 0,
            "in_progress": 0,
            "completed": 0,
            "failed": 0,
            "disabled": 0
        }

        for p in projects:
            status = p.get("sync_status", "pending")
            if not p.get("enabled", True):
                status_counts["disabled"] += 1
            elif status in status_counts:
                status_counts[status] += 1

        return {
            "scheduler_running": scheduler._running,
            "total_projects": len(projects),
            "status_counts": status_counts,
            "check_interval_seconds": scheduler.check_interval
        }
    except Exception as e:
        logger.error(f"Error getting scheduler status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
