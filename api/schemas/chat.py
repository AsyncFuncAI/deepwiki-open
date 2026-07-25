from typing import Literal
from urllib.parse import unquote

from pydantic import BaseModel, Field, field_validator


# Models for the API
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    mode: Literal["normal", "deep_research"] = Field(default="normal")


class ChatCompletionRequest(BaseModel):
    """
    Model for requesting a chat completion.
    """

    repo_url: str = Field(..., description="URL of the repository to query")
    messages: list[ChatMessage] = Field(..., description="List of chat messages")
    filePath: str | None = Field(
        None,
        description="Optional path to a file in the repository to include in the prompt",
    )
    token: str | None = Field(
        None, description="Personal access token for private repositories"
    )
    type: Literal["local", "github", "gitlab", "bitbucket"] | None = Field(
        "github",
        description="Type of repository (e.g., 'github', 'gitlab', 'bitbucket')",
    )

    # model parameters
    provider: str = Field(
        "google",
        description="Model provider (google, openai, openrouter, ollama, bedrock, azure, dashscope)",
    )
    model: str | None = Field(None, description="Model name for the specified provider")

    language: str | None = Field(
        "en",
        description="Language for content generation (e.g., 'en', 'ja', 'zh', 'es', 'kr', 'vi')",
    )

    research_iteration: int = Field(
        default=1,
        ge=1,
        description="Current deep research iteration (1-based). Only used when the request is in deep_research mode.",
    )

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
            value = [unquote(path) for path in value.strip().split("\n") if path]
        return value
