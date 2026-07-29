from pydantic import BaseModel

from api.schemas.base import RepoRequestBase


class RepoPrepareRequest(RepoRequestBase):
    """Request body for POST /repo/prepare (index warming). No chat messages."""


class RepoInfo(BaseModel):
    owner: str
    repo: str
    type: str
    token: str | None = None
    localPath: str | None = None
    repoUrl: str | None = None
