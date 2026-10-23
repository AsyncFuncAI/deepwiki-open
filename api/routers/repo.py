import asyncio
import json
import os

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from api.logger import get_logger
from api.rag import repo_index_exist
from api.repository import Repo
from api.routers.auth import check_wiki_auth_code
from api.schemas import RepoPrepareRequest
from api.services.research import prepare_repo_index as prepare_index

logger = get_logger(__name__)

router = APIRouter(prefix="/repo", tags=["repo"])


# Heartbeat cadence MUST stay below the frontend proxy / undici bodyTimeout
# (undici default = 300s). 10s keeps the connection alive with wide margin.
_HEARTBEAT_INTERVAL_SEC = 10

# Admission cap: distinct in-flight /repo/prepare indexing jobs allowed at
# once. This endpoint has no registry of its own (unlike wiki task
# submission); every request used to get an unconditional asyncio.create_task
# with no limit at all, so a caller varying repo_url could queue unbounded
# clone/embedding work.
try:
    _MAX_CONCURRENT_PREPARE_TASKS = int(
        os.environ.get("DEEPWIKI_MAX_CONCURRENT_PREPARE_TASKS", "10")
    )
except (TypeError, ValueError):
    _MAX_CONCURRENT_PREPARE_TASKS = 10

_in_flight_prepare_keys: set[str] = set()


@router.post("/prepare")
async def prepare_repo_index(request: RepoPrepareRequest):
    check_wiki_auth_code(request.authorization_code)

    key = f"{request.type}_{request.repo_url}"

    async def event_stream():
        # Fast path: cache already warm -> return immediately.
        if repo_index_exist(Repo(repo_url=request.repo_url, repo_type=request.type)):
            yield "event: ready\ndata: already indexed\n\n"
            yield "event: done\ndata: ok\n\n"
            return

        if key in _in_flight_prepare_keys:
            yield "event: ready\ndata: already in progress\n\n"
            yield "event: done\ndata: ok\n\n"
            return

        if len(_in_flight_prepare_keys) >= _MAX_CONCURRENT_PREPARE_TASKS:
            yield (
                "event: error\ndata: "
                + json.dumps(
                    {
                        "error": f"{_MAX_CONCURRENT_PREPARE_TASKS} indexing jobs are "
                        "already in flight; try again later"
                    }
                )
                + "\n\n"
            )
            return

        # First byte -> response headers are flushed now (kills the timeout).
        yield ": indexing-start\n\n"

        _in_flight_prepare_keys.add(key)
        try:
            task = asyncio.create_task(prepare_index(request))
            elapsed = 0
            # Wait on the task, but wake up every interval to emit a heartbeat.
            while not task.done():
                try:
                    # shield: a heartbeat timeout must NOT cancel the indexing task.
                    await asyncio.wait_for(
                        asyncio.shield(task), timeout=_HEARTBEAT_INTERVAL_SEC
                    )
                except asyncio.TimeoutError:
                    elapsed += _HEARTBEAT_INTERVAL_SEC
                    yield f"event: progress\ndata: {json.dumps({'elapsed_sec': elapsed})}\n\n"
                except Exception:
                    # Task raised; break out and report via task.exception() below.
                    break

            exc = task.exception()
            if exc is not None:
                logger.error("Repo indexing failed for %s: %s", request.repo_url, exc)
                yield f"event: error\ndata: {json.dumps({'error': str(exc)})}\n\n"
            else:
                logger.info("Repo indexing complete for %s", request.repo_url)
                yield "event: done\ndata: ok\n\n"
        finally:
            _in_flight_prepare_keys.discard(key)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",  # disable proxy buffering (nginx etc.)
        },
    )


@router.get("/index/status")
async def repo_index_status(
    repo_url: str = Query(..., description="Repository URL or local path"),
    type: str = Query("github", description="Repository type"),
):
    """Cheap readiness probe: is the embedding index already built on disk?

    Frontend can poll this instead of holding the /repo/prepare stream open.
    """
    return {"ready": repo_index_exist(Repo(repo_url=repo_url, repo_type=type))}
