from fastapi import APIRouter, HTTPException

from api.config import WIKI_AUTH_CODE, WIKI_AUTH_MODE
from api.schemas import AuthorizationConfig

router = APIRouter(prefix="/auth", tags=["auth"])


def check_wiki_auth_code(authorization_code: str | None) -> None:
    """Enforce WIKI_AUTH_MODE consistently across every protected route.

    Previously only DELETE /api/wiki_cache checked this inline; every other
    sensitive/costly route (wiki generation, repo indexing, chat, codemap,
    cache reads) performed no such check at all, so enabling WIKI_AUTH_MODE
    gave callers no actual protection anywhere but that one endpoint.
    """
    if not WIKI_AUTH_MODE:
        return
    if not authorization_code or WIKI_AUTH_CODE != authorization_code:
        raise HTTPException(status_code=401, detail="Authorization code is invalid")


@router.get("/status")
async def get_auth_status():
    """
    Check if authentication is required for the wiki.
    """
    return {"auth_required": WIKI_AUTH_MODE}


@router.post("/validate")
async def validate_auth_code(request: AuthorizationConfig):
    """
    Check authorization code.
    """
    return {"success": WIKI_AUTH_CODE == request.code}
