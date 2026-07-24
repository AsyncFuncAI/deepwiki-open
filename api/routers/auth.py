from fastapi import APIRouter

from api.config import WIKI_AUTH_CODE, WIKI_AUTH_MODE
from api.schemas import AuthorizationConfig

router = APIRouter(prefix="/auth", tags=["auth"])


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
