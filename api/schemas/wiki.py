from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, computed_field

from api.schemas.repo import RepoInfo, TaskStatus


class WikiPage(BaseModel):
    """
    Model for a wiki page.
    """

    id: str
    title: str
    content: str
    filePaths: list[str]
    importance: str  # Should ideally be Literal['high', 'medium', 'low']
    relatedPages: list[str]


class WikiSection(BaseModel):
    """
    Model for the wiki sections.
    """

    id: str
    title: str
    pages: list[str]
    subsections: list[str] | None = None


class WikiStructureModel(BaseModel):
    """
    Model for the overall wiki structure.
    """

    id: str
    title: str
    description: str
    pages: list[WikiPage]
    sections: list[WikiSection] | None = None
    rootSections: list[str] | None = None


class WikiCacheData(BaseModel):
    """
    Model for the data to be stored in the wiki cache.
    """

    wiki_structure: WikiStructureModel
    generated_pages: dict[str, WikiPage]
    repo_url: str | None = None  # compatible for old cache
    repo: RepoInfo | None = None
    provider: str | None = None
    model: str | None = None


class WikiCacheRequest(BaseModel):
    """
    Model for the request body when saving wiki cache.
    """

    repo: RepoInfo
    language: str
    wiki_structure: WikiStructureModel
    generated_pages: dict[str, WikiPage]
    provider: str
    model: str


class WikiExportRequest(BaseModel):
    """
    Model for requesting a wiki export.
    """

    repo_url: str = Field(..., description="URL of the repository")
    pages: list[WikiPage] = Field(..., description="List of wiki pages to export")
    format: Literal["markdown", "json"] = Field(
        ..., description="Export format (markdown or json)"
    )


class ProcessedProjectEntry(BaseModel):
    id: str  # Filename
    owner: str
    repo: str
    name: str  # owner/repo
    repo_type: str  # Renamed from type to repo_type for clarity with existing models
    submittedAt: int  # Timestamp
    language: str  # Extracted from filename


class WikiTaskSummary(BaseModel):
    """Client-facing status of a wiki-generation task (SPEC.md §9).

    Serialization target for WikiTask.to_status(); never carries the token.
    """

    # Canonical field is snake_case `submitted_at` (also the serialized/wire
    # name). `submittedAt` is accepted on input via a validation alias for
    # backward compatibility during the transition; populate_by_name keeps the
    # field name usable too.
    model_config = ConfigDict(populate_by_name=True)

    id: str
    owner: str
    repo: str
    repo_type: str
    language: str
    status: TaskStatus
    pages_done: int = Field(default=0, ge=0)
    pages_total: int = Field(default=0, ge=0)
    current_page_ids: list[str] = Field(default_factory=list)
    error: str | None = None
    submitted_at: int = Field(..., ge=0, validation_alias="submittedAt")

    @computed_field
    @property
    def name(self) -> str:
        return f"{self.owner}/{self.repo}"


class WikiTaskStatus(WikiTaskSummary):
    wiki_structure: WikiStructureModel | None = None
