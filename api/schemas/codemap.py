from pydantic import BaseModel, Field

from api.schemas.base import RepoRequestBase


class CodeMapCitation(BaseModel):
    """A grounded reference from a codemap step back to real source code."""

    file_path: str = Field(
        ..., description="Repository-relative path of the source file"
    )
    start_line: int | None = Field(
        None, description="1-based start line of the cited range in the source file"
    )
    end_line: int | None = Field(
        None, description="1-based end line of the cited range in the source file"
    )
    snippet: str = Field(
        "",
        description="Verbatim excerpt copied from the source, used to locate/verify the range",
    )


class CodeMapStep(BaseModel):
    """A single actionable sub-step (e.g. 1a, 1b) within a section."""

    id: str = Field(..., description="Human-facing id such as '1a', '1b', '2a'")
    label: str = Field(..., description="Short title of the step")
    code: str = Field("", description="Example code snippet illustrating the step")
    citation: CodeMapCitation | None = Field(
        None, description="Where this step's code comes from in the repository"
    )


class CodeMapSection(BaseModel):
    """A top-level numbered section grouping related steps."""

    id: str = Field(..., description="Section id such as '1', '2'")
    title: str = Field(..., description="Section title")
    guide: str = Field(
        "", description="Prose guide for the section (filled in phase 2)"
    )
    diagram: str = Field(
        "", description="Mermaid diagram source for the section (filled in phase 2)"
    )
    steps: list[CodeMapStep] = Field(default_factory=list)


class CodeMap(BaseModel):
    """The full codemap produced for a user's question."""

    title: str = Field(..., description="Overall codemap title")
    summary: str = Field(
        "", description="Introductory summary, may contain [1a][2a] citation markers"
    )
    sections: list[CodeMapSection] = Field(default_factory=list)


class CodeMapRequest(RepoRequestBase):
    """Request to generate a codemap for a repository question."""

    question: str = Field(..., description="The user's how-to / usage question")
