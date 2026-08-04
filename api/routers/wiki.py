import asyncio
import os
from datetime import datetime
from typing import Optional, Literal

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse, Response, StreamingResponse

from api.config import WIKI_AUTH_CODE, WIKI_AUTH_MODE, configs
from api.logger import get_logger
from api.schemas import (
    ProcessedProjectEntry,
    WikiCacheData,
    WikiExportRequest,
    WikiTaskSummary,
    WikiTaskRequest,
    WikiTaskSubmitResult,
    WikiTaskStatus,
    TaskStatus,
)
from api.services.wiki import (
    delete_wiki_cache,
    export_wiki,
    generate_repo_wiki,
    list_processed_projects,
    list_wiki_cache,
    read_wiki_cache,
    registry,
    WikiTask,
)

logger = get_logger(__name__)

router = APIRouter(tags=["wiki"])


@router.post("/export/wiki")
async def post_export_wiki(request: WikiExportRequest):
    """
    Export wiki content as Markdown or JSON.

    Args:
        request: The export request containing wiki pages and format

    Returns:
        A downloadable file in the requested format
    """
    logger.info(f"Exporting wiki for {request.repo_url} in {request.format} format")

    # Extract repository name from URL for the filename
    repo_parts = request.repo_url.rstrip("/").split("/")
    repo_name = repo_parts[-1] if len(repo_parts) > 0 else "wiki"

    timestamp = datetime.now()

    content = export_wiki(
        request.repo_url,
        pages=request.pages,
        format=request.format,
        timestamp=timestamp,
    )
    filename = f"{repo_name}_wiki_{timestamp.strftime('%Y%m%d_%H%M%S')}"

    if request.format == "markdown":
        # Generate Markdown content
        filename += ".md"
        media_type = "text/markdown"
    else:  # JSON format
        # Generate JSON content
        filename += ".json"
        media_type = "application/json"

    # Create response with appropriate headers for file download
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/local_repo/structure")
async def get_local_repo_structure(
    path: str = Query(None, description="Path to local repository"),
):
    """Return the file tree and README content for a local repository."""
    if not path:
        return JSONResponse(
            status_code=400,
            content={
                "error": "No path provided. Please provide a 'path' query parameter."
            },
        )

    if not os.path.isdir(path):
        return JSONResponse(
            status_code=404, content={"error": f"Directory not found: {path}"}
        )

    try:
        logger.info(f"Processing local repository at: {path}")
        file_tree_lines = []
        readme_content = ""

        for root, dirs, files in os.walk(path):
            # Exclude hidden dirs/files and virtual envs
            dirs[:] = [
                d
                for d in dirs
                if not d.startswith(".")
                and d != "__pycache__"
                and d != "node_modules"
                and d != ".venv"
            ]
            for file in files:
                if file.startswith(".") or file == "__init__.py" or file == ".DS_Store":
                    continue
                rel_dir = os.path.relpath(root, path)
                rel_file = os.path.join(rel_dir, file) if rel_dir != "." else file
                file_tree_lines.append(rel_file)
                # Find README.md (case-insensitive)
                if file.lower() == "readme.md" and not readme_content:
                    try:
                        with open(os.path.join(root, file), "r", encoding="utf-8") as f:
                            readme_content = f.read()
                    except Exception as e:
                        logger.warning(f"Could not read README.md: {str(e)}")
                        readme_content = ""

        file_tree_str = "\n".join(sorted(file_tree_lines))
        return {"file_tree": file_tree_str, "readme": readme_content}
    except Exception as e:
        logger.error(f"Error processing local repository: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Error processing local repository: {str(e)}"},
        )


@router.get("/api/wiki_cache", response_model=Optional[WikiCacheData])
async def read_wiki(
    owner: str = Query(..., description="Repository owner"),
    repo: str = Query(..., description="Repository name"),
    repo_type: str = Query(..., description="Repository type (e.g., github, gitlab)"),
    language: str = Query(..., description="Language of the wiki content"),
):
    """Retrieve cached wiki data (structure and generated pages) for a repository."""
    supported_langs = configs["lang_config"]["supported_languages"]
    if language not in supported_langs:
        language = configs["lang_config"]["default"]

    logger.info(
        f"Attempting to retrieve wiki cache for {owner}/{repo} ({repo_type}), lang: {language}"
    )
    cached_data = await read_wiki_cache(owner, repo, repo_type, language)
    if cached_data:
        return cached_data
    # Return 200 with null body if not found (frontend expects this behavior)
    logger.info(
        f"Wiki cache not found for {owner}/{repo} ({repo_type}), lang: {language}"
    )
    return None


@router.delete("/api/wiki_cache")
async def delete_wiki(
    owner: str = Query(..., description="Repository owner"),
    repo: str = Query(..., description="Repository name"),
    repo_type: str = Query(..., description="Repository type (e.g., github, gitlab)"),
    language: str = Query(..., description="Language of the wiki content"),
    authorization_code: Optional[str] = Query(None, description="Authorization code"),
):
    """
    Deletes a specific wiki cache from the file system.
    """
    # Language validation
    supported_langs = configs["lang_config"]["supported_languages"]
    if language not in supported_langs:
        raise HTTPException(status_code=400, detail="Language is not supported")

    if WIKI_AUTH_MODE:
        logger.info("check the authorization code")
        if not authorization_code or WIKI_AUTH_CODE != authorization_code:
            raise HTTPException(status_code=401, detail="Authorization code is invalid")

    logger.info(
        f"Attempting to delete wiki cache for {owner}/{repo} ({repo_type}), lang: {language}"
    )

    try:
        deleted = await delete_wiki_cache(owner, repo, repo_type, language)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete wiki cache: {str(e)}"
        )

    if deleted:
        return {
            "message": f"Wiki cache for {owner}/{repo} ({language}) deleted successfully"
        }
    raise HTTPException(status_code=404, detail="Wiki cache not found")


@router.get("/api/processed_projects", response_model=list[ProcessedProjectEntry])
async def get_processed_projects():
    """
    Lists all processed projects found in the wiki cache directory.
    Projects are identified by files named like: deepwiki_cache_{repo_type}_{owner}_{repo}_{language}.json
    """
    try:
        return await list_processed_projects()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to list processed projects from server cache.",
        )


@router.post("/wiki/tasks", response_model=WikiTaskSubmitResult)
async def submit_wiki_task(request: WikiTaskRequest):
    """Submit a repo for index + wiki generation (get-or-create; SPEC.md §6).

    Returns one of: created (new task), joined (an active task for the repo
    already exists), or from_cache (this variant is already generated).
    """

    return await registry.submit(
        WikiTask.from_wiki_request(request), async_func=generate_repo_wiki
    )


@router.get(
    "/wiki/tasks",
    response_model=list[WikiTaskSummary],
)
async def list_wiki_tasks(
    status: Literal["active", "completed", None] = Query(
        None, description="active | completed | (omit for completed + queued)"
    ),
):
    """List tasks.

    Omit `status` for the homepage list: completed projects first, then queued
    tasks (by submission time) last.
    """

    active = [
        task.to_summary()
        for task in sorted(
            registry.active(),
            key=lambda task: task.submitted_at,
        )
    ]
    if status == "active":
        return active
    completed = await list_wiki_cache()
    if status == "completed":
        return completed
    return completed + active


@router.get("/wiki/tasks/{task_id}", response_model=WikiTaskStatus)
async def get_wiki_task(task_id: str):
    """Single task status + progress (SPEC.md §9). 404 once the task is gone —
    the frontend then falls back to the wiki cache."""
    task = registry.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task.to_status()


@router.get("/wiki/tasks/{task_id}/stream")
async def stream_wiki_task(task_id: str):
    """SSE progress stream: `progress` events until a terminal `done`/`error`."""
    if registry.get(task_id) is None:
        raise HTTPException(status_code=404, detail="Task not found")

    async def event_stream():
        while True:
            task = registry.get(task_id)
            if task is None:
                yield 'event: error\ndata: {"error": "task no longer available"}\n\n'
                return

            # we use wiki task status, so that frontend could show the current processing pages.
            payload = task.to_status().model_dump_json()
            if task.status == TaskStatus.COMPLETED:
                yield f"event: done\ndata: {payload}\n\n"
                return
            if task.status == TaskStatus.FAILED:
                yield f"event: error\ndata: {payload}\n\n"
                return
            yield f"event: progress\ndata: {payload}\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    )
