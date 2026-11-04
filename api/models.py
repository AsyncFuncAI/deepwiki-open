from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

class Repository(BaseModel):
    """Model for a repository."""
    repo_url: str = Field(..., description="URL or local path of the repository")
    access_token: Optional[str] = Field(None, description="Access token for private repositories")
    description: Optional[str] = Field(None, description="Description of the repository's role in the system")

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatCompletionRequest(BaseModel):
    """
    Model for requesting a chat completion.
    """
    repo_url: str = Field(..., description="URL of the repository to query")
    messages: List[ChatMessage] = Field(..., description="List of chat messages")
    filePath: Optional[str] = Field(None, description="Optional path to a file in the repository to include in the prompt")
    github_token: Optional[str] = Field(None, description="GitHub personal access token for private repositories")
    gitlab_token: Optional[str] = Field(None, description="GitLab personal access token for private repositories")
    local_ollama: Optional[bool] = Field(False, description="Use locally run Ollama model for embedding and generation")
    use_openrouter: Optional[bool] = Field(False, description="Use OpenRouter API for generation")
    openrouter_model: Optional[str] = Field("openai/gpt-4o", description="OpenRouter model to use (e.g., 'openai/gpt-4o', 'anthropic/claude-3-opus')")
    bitbucket_token: Optional[str] = Field(None, description="Bitbucket personal access token for private repositories")
    language: Optional[str] = Field("en", description="Language for content generation (e.g., 'en', 'ja', 'zh', 'es', 'kr', 'vi')")

class MultiRepoChatCompletionRequest(BaseModel):
    """
    Model for requesting a chat completion across multiple repositories.
    """
    repositories: List[Repository] = Field(..., description="List of repositories to include")
    messages: List[ChatMessage] = Field(..., description="List of chat messages")
    local_ollama: Optional[bool] = Field(False, description="Use locally run Ollama model for embedding and generation")
    use_openrouter: Optional[bool] = Field(False, description="Use OpenRouter for generation")
    openrouter_model: Optional[str] = Field("openai/gpt-4o", description="OpenRouter model to use")
    language: Optional[str] = Field("en", description="Language code for response (e.g., 'en', 'ja', 'zh', 'es', 'kr', 'vi')")

class MultiRepoRequest(BaseModel):
    """Model for multi-repository operations."""
    repositories: List[Repository] = Field(..., description="List of repositories to include")
    local_ollama: Optional[bool] = Field(False, description="Use locally run Ollama model for embedding and generation")
    language: Optional[str] = Field("en", description="Language code for response")

class MultiRepoQueryRequest(MultiRepoRequest):
    """Model for querying multiple repositories."""
    query: str = Field(..., description="Query to run against the repositories")

class WikiPage(BaseModel):
    """Model for a wiki page."""
    id: str = Field(..., description="Unique identifier for the page")
    title: str = Field(..., description="Title of the page")
    content: str = Field(..., description="Markdown content of the page")
    filePaths: Optional[List[str]] = Field(None, description="List of file paths related to this page")
    importance: Optional[str] = Field(None, description="Importance of the page")
    relatedPages: Optional[List[str]] = Field(None, description="List of related page IDs")

class WikiExportRequest(BaseModel):
    """
    Model for requesting a wiki export.
    """
    repo_url: str = Field(..., description="URL of the repository")
    pages: List[WikiPage] = Field(..., description="List of wiki pages to export")
    format: Literal["markdown", "json"] = Field(..., description="Export format (markdown or json)")

class MultiRepoWikiExportRequest(BaseModel):
    """Model for exporting a wiki for multiple repositories."""
    repositories: List[Repository] = Field(..., description="List of repositories to include")
    pages: List[WikiPage] = Field(..., description="List of wiki pages to export")
    format: Literal["markdown", "json"] = Field(..., description="Export format (markdown or json)")
