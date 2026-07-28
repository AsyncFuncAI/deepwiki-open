from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.websockets import WebSocketState

from api.logger import get_logger
from api.schemas import CodeMapRequest
from api.services.codemap import generate_codemap, read_repo_file

logger = get_logger(__name__)

router = APIRouter(tags=["codemap"])


@router.websocket("/ws/codemap")
async def handle_websocket_codemap(websocket: WebSocket):
    """Stream codemap generation events (NDJSON) over a WebSocket."""
    await websocket.accept()
    try:
        request = CodeMapRequest(**await websocket.receive_json())
        async for event in generate_codemap(request):
            if websocket.application_state != WebSocketState.CONNECTED:
                break
            await websocket.send_text(event)
    except WebSocketDisconnect:
        logger.info("Codemap WebSocket disconnected")
    except Exception as e:  # noqa: BLE001
        logger.error("Codemap generation error: %s", str(e), exc_info=True)
        if websocket.application_state == WebSocketState.CONNECTED:
            import json

            await websocket.send_text(
                json.dumps({"type": "error", "message": str(e)}) + "\n"
            )
    finally:
        if websocket.application_state == WebSocketState.CONNECTED:
            await websocket.close()


@router.post("/codemap/stream")
async def codemap_stream(request: CodeMapRequest):
    """HTTP fallback: stream codemap generation events as NDJSON."""
    try:
        return StreamingResponse(
            generate_codemap(request),
            media_type="application/x-ndjson",
        )
    except Exception as e:  # noqa: BLE001
        logger.error("Codemap generation error: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/codemap/file")
async def codemap_file(
    repo_url: str = Query(..., description="Repository URL or local path"),
    file_path: str = Query(..., description="Repository-relative file path"),
    type: str = Query("github", description="Repository type"),
):
    """Return the full content of a file from the cloned/local repository."""
    try:
        content = read_repo_file(repo_url, type, file_path)
        return {"file_path": file_path, "content": content}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:  # noqa: BLE001
        logger.error("Error reading repo file: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
