from typing import Literal
from urllib.parse import unquote

from pydantic import BaseModel, Field, field_validator

RepoType = Literal["local", "github", "gitlab", "bitbucket"]


class RepoRequestBase(BaseModel):
    repo_url: str = Field(..., description="URL or local path of the repository")
    type: RepoType = Field("github", description="Repository type")
    token: str | None = Field(None, description="PAT for private repositories")
    provider: str = Field("google", description="Model provider")
    model: str | None = Field(None, description="Model name for the provider")
    language: str = Field("en", description="Language for content generation")
    excluded_dirs: list[str] = Field(
        default_factory=list,
        description="List or newline-separated string of directories to exclude from processing",
    )
    excluded_files: list[str] = Field(
        default_factory=list,
        description="List or newline-separated string of file patterns to exclude from processing",
    )
    included_dirs: list[str] = Field(
        default_factory=list,
        description="List or newline-separated string of directories to include exclusively",
    )
    included_files: list[str] = Field(
        default_factory=list,
        description="List or newline-separated string of file patterns to include exclusively",
    )

    @field_validator(
        "excluded_dirs",
        "excluded_files",
        "included_dirs",
        "included_files",
        mode="before",
    )
    @classmethod
    def validate_path(cls, value: list[str] | str) -> list[str]:
        if isinstance(value, str):
            value = [unquote(p) for p in value.strip().split("\n") if p]
        return value
