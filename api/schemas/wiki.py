import anyio
import json
from typing import Literal
from pydantic import BaseModel, Field


class RepoInfo(BaseModel):
    owner: str
    repo: str
    type: str
    token: str | None = None
    localPath: str | None = None
    repoUrl: str | None = None


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

    async def save(self, path):
        async with await anyio.open_file(path, mode="w", encoding="utf-8") as file:
            json.dump(self.model_dump_json(), await file)

    @classmethod
    async def load(cls, path):
        async with await anyio.open_file(path, mode="r", encoding="utf-8") as file:
            return cls(**json.load(await file))


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
