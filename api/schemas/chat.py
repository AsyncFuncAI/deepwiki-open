from typing import Literal

from pydantic import BaseModel, Field

from api.schemas.base import RepoRequestBase


# Models for the API
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    mode: Literal["normal", "deep_research"] = Field(default="normal")


class ChatCompletionRequest(RepoRequestBase):
    """
    Model for requesting a chat completion.
    """

    messages: list[ChatMessage] = Field(..., description="List of chat messages")
    research_iteration: int = Field(
        default=1,
        ge=1,
        description="Current deep research iteration (1-based). Only used when the request is in deep_research mode.",
    )
