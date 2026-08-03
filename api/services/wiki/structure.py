"""Helpers for `determine_structure`: read the cloned repo's file tree, detect
its default branch, and parse the LLM's XML wiki-structure response.

Ported from the frontend fetchRepositoryStructure + determineWikiStructure
(clone-walk instead of provider REST APIs).
"""

import os
import re
import subprocess
import xml.etree.ElementTree as ET

from api.logger import get_logger
from api.config import iterate_files
from api.schemas import WikiPage, WikiSection, WikiStructureModel

logger = get_logger(__name__)


def read_repo_file_tree(
    path: str,
    included_files: list[str] | None = None,
    included_dirs: list[str] | None = None,
    excluded_files: list[str] | None = None,
    excluded_dirs: list[str] | None = None,
) -> tuple[list[str], str]:
    """Walk a cloned/local repo dir → (file list, README.md text)."""

    files = iterate_files(
        root_dir=path,
        included_files=included_files,
        included_dirs=included_dirs,
        excluded_dirs=excluded_dirs,
        excluded_files=excluded_files,
    )

    readme = ""

    for file in sorted(files, key=lambda x: len(x)):
        if os.path.splitext(file)[0].lower().endswith("readme"):
            try:
                with open(os.path.join(path, file), encoding="utf-8") as f:
                    readme = f.read()
            except OSError as e:
                logger.warning("Could not read README.md: %s", e)
                readme = ""
            break
    return files, readme


def detect_default_branch(path: str) -> str:
    """Return the checked-out branch of a local git repo, or 'main' if unknown."""
    try:
        result = subprocess.run(
            ["git", "-C", path, "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout.strip() or "main"
    except (subprocess.SubprocessError, OSError):
        return "main"


def _normalize_importance(value: str | None) -> str:
    v = (value or "").strip().lower()
    return v if v in ("high", "medium", "low") else "medium"


def _page_from_element(el: ET.Element, index: int) -> WikiPage:
    return WikiPage(
        id=el.get("id") or f"page-{index + 1}",
        title=(el.findtext("title") or "").strip(),
        content="",
        filePaths=[
            e.text.strip() for e in el.iter("file_path") if e.text and e.text.strip()
        ],
        importance=_normalize_importance(el.findtext("importance")),
        relatedPages=[
            e.text.strip() for e in el.iter("related") if e.text and e.text.strip()
        ],
    )


def _pages_via_regex(xml_text: str) -> list[WikiPage]:
    """Fallback when strict XML parsing fails or yields no pages."""
    pages: list[WikiPage] = []
    for i, block in enumerate(re.findall(r"<page\b[\s\S]*?</page>", xml_text)):
        pid = re.search(r'<page\s+id="([^"]+)"', block)
        title = re.search(r"<title>([\s\S]*?)</title>", block)
        importance = re.search(r"<importance>([\s\S]*?)</importance>", block)
        file_paths = [
            m.strip()
            for m in re.findall(r"<file_path>([\s\S]*?)</file_path>", block)
            if m.strip()
        ]
        related = [
            m.strip()
            for m in re.findall(r"<related>([\s\S]*?)</related>", block)
            if m.strip()
        ]
        pages.append(
            WikiPage(
                id=pid.group(1) if pid else f"page-{i + 1}",
                title=title.group(1).strip() if title else "",
                content="",
                filePaths=file_paths,
                importance=_normalize_importance(
                    importance.group(1) if importance else None
                ),
                relatedPages=related,
            )
        )
    return pages


def _parse_sections(root: ET.Element) -> tuple[list[WikiSection], list[str]]:
    sections: list[WikiSection] = []
    referenced: set[str] = set()
    for i, el in enumerate(root.iter("section")):
        sid = el.get("id") or f"section-{i + 1}"
        subs = [
            e.text.strip() for e in el.iter("section_ref") if e.text and e.text.strip()
        ]
        sections.append(
            WikiSection(
                id=sid,
                title=(el.findtext("title") or "").strip(),
                pages=[
                    e.text.strip()
                    for e in el.iter("page_ref")
                    if e.text and e.text.strip()
                ],
                subsections=subs or None,
            )
        )
        referenced.update(subs)
    root_sections = [s.id for s in sections if s.id not in referenced]
    return sections, root_sections


def parse_wiki_structure(text: str, comprehensive: bool) -> WikiStructureModel:
    """Parse the LLM's XML response into a WikiStructureModel.

    Robust against the model's usual malformations: strips markdown fences and
    control chars, escapes bare ``&`` (a single one breaks strict XML), and
    falls back to regex page extraction if strict parsing fails or finds no
    pages. Raises ValueError if no <wiki_structure> block is present at all.
    """
    text = re.sub(r"^```(?:xml)?\s*", "", text.strip(), flags=re.IGNORECASE)
    text = re.sub(r"```\s*$", "", text)

    match = re.search(r"<wiki_structure>[\s\S]*?</wiki_structure>", text)
    if not match:
        raise ValueError("No valid <wiki_structure> XML found in response")
    xml_text = match.group(0)

    # Strip control chars, then escape bare '&' that are not valid XML entities.
    xml_text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", xml_text)
    xml_text = re.sub(
        r"&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)", "&amp;", xml_text
    )

    root: ET.Element | None = None
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as e:
        logger.warning("Strict XML parse failed, using regex fallback: %s", e)

    title = (root.findtext("title") if root is not None else None) or ""
    description = (root.findtext("description") if root is not None else None) or ""

    pages = (
        [_page_from_element(el, i) for i, el in enumerate(root.iter("page"))]
        if root is not None
        else []
    )
    if not pages:
        logger.warning("XML parsing yielded no pages; using regex fallback")
        pages = _pages_via_regex(xml_text)

    sections: list[WikiSection] = []
    root_sections: list[str] = []
    if comprehensive and root is not None:
        sections, root_sections = _parse_sections(root)

    return WikiStructureModel(
        id="wiki",
        title=title.strip(),
        description=description.strip(),
        pages=pages,
        sections=sections,
        rootSections=root_sections,
    )
