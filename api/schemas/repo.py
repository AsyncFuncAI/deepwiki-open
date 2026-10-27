from enum import Enum
from pydantic import BaseModel, Field, field_validator

from api.schemas.base import RepoRequestBase


class RepoPrepareRequest(RepoRequestBase):
    """Request body for POST /repo/prepare (index warming). No chat messages."""


class WikiTaskRequest(RepoRequestBase):
    """Request body for POST /wiki/tasks, submitting a wiki-generation task."""

    owner: str
    repo: str
    comprehensive: bool = Field(True, description="Comprehensive vs concise wiki")

    @property
    def repo_key(self) -> str:
        return f"{self.type}_{self.owner}_{self.repo}"


class TaskStatus(str, Enum):
    PENDING = "pending"
    INDEXING = "indexing"
    DETERMINING_STRUCTURE = "determining_structure"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"

    def is_terminal(self):
        return self in (TaskStatus.COMPLETED, TaskStatus.FAILED)


class WikiTaskSubmitResult(BaseModel):
    task_id: str
    status: TaskStatus | str
    created: bool = False
    joined: bool = False
    from_cache: bool = False

    @field_validator(
        "status",
        mode="before",
    )
    @classmethod
    def _status_validate(cls, value):
        if isinstance(value, str):
            return TaskStatus(value.lower())
        return value


class RepoInfo(BaseModel):
    owner: str
    repo: str
    type: str
    token: str | None = None
    localPath: str | None = None
    repoUrl: str | None = None
