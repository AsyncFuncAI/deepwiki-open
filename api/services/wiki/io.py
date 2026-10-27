import asyncio
import json
import os
from datetime import datetime
from typing import Literal

from api.logger import get_logger
from api.schemas import (
    TaskStatus,
    ProcessedProjectEntry,
    WikiCacheData,
    WikiTaskSummary,
    WikiPage,
    aload,
    asave,
)
from api.utils import deepwiki_root

logger = get_logger(__name__)

WIKI_CACHE_DIR = os.path.join(deepwiki_root(), "wikicache")
os.makedirs(WIKI_CACHE_DIR, exist_ok=True)
WIKI_PREFIX = "deepwiki_cache_"


def get_wiki_cache_path(owner: str, repo: str, repo_type: str, language: str) -> str:
    """Generates the file path for a given wiki cache."""
    filename = f"{WIKI_PREFIX}{repo_type}_{owner}_{repo}_{language}.json"
    return os.path.join(WIKI_CACHE_DIR, filename)


def wiki_cache_exists(owner: str, repo: str, repo_type: str, language: str) -> bool:
    return os.path.exists(
        get_wiki_cache_path(owner, repo=repo, repo_type=repo_type, language=language)
    )


async def read_wiki_cache(
    owner: str, repo: str, repo_type: str, language: str
) -> WikiCacheData | None:
    """Reads wiki cache data from the file system."""
    if not wiki_cache_exists(owner, repo, repo_type, language):
        return None
    cache_path = get_wiki_cache_path(owner, repo, repo_type, language)
    try:
        return await aload(WikiCacheData, cache_path, encoding="utf-8")
    except Exception:
        logger.exception("Error reading wiki cache from %s", cache_path)
        return None


async def save_wiki_cache(
    owner: str, repo: str, repo_type: str, language: str, wiki_cache: WikiCacheData
) -> bool:
    """Saves wiki cache data to the file system."""
    cache_path = get_wiki_cache_path(
        owner=owner,
        repo=repo,
        repo_type=repo_type,
        language=language,
    )
    logger.info(f"Attempting to save wiki cache. Path: {cache_path}")
    try:
        await asave(wiki_cache, cache_path, encoding="utf-8")
        logger.info(f"Wiki cache successfully saved to {cache_path}")
        return True
    except OSError:
        logger.exception("IOError saving wiki cache to %s", cache_path)
        return False
    except Exception:
        logger.exception("Unexpected error saving wiki cache to %s", cache_path)
        return False


async def delete_wiki_cache(owner: str, repo: str, repo_type: str, language: str):
    cache_path = get_wiki_cache_path(
        owner,
        repo,
        repo_type,
        language,
    )

    if not os.path.exists(cache_path):
        logger.warning("Wiki cache not found, cannot delete: %s", cache_path)
        return False

    os.remove(cache_path)
    logger.info("Successfully deleted wiki cache: %s", cache_path)
    return True


async def list_wiki_cache() -> list[WikiTaskSummary]:
    if not os.path.exists(WIKI_CACHE_DIR):
        logger.info(
            f"Cache directory {WIKI_CACHE_DIR} not found. Returning empty list."
        )
        return []

    logger.info(f"Scanning for project cache files in: {WIKI_CACHE_DIR}")
    entries = []
    for filename in await asyncio.to_thread(os.listdir, WIKI_CACHE_DIR):
        if not (filename.startswith(WIKI_PREFIX) and filename.endswith(".json")):
            continue
        file_path = os.path.join(WIKI_CACHE_DIR, filename)
        try:
            stats = await asyncio.to_thread(os.stat, file_path)
            repo_type, owner, *repo, language = (
                os.path.splitext(filename)[0].removeprefix(WIKI_PREFIX).split("_")
            )
            entries.append(
                WikiTaskSummary(
                    id=filename,
                    owner=owner,
                    repo="_".join(repo),
                    repo_type=repo_type,
                    language=language,
                    submitted_at=int(stats.st_mtime * 1000),
                    status=TaskStatus.COMPLETED,
                )
            )
        except Exception:
            logger.exception("Error processing file %s", file_path, exc_info=True)

    logger.info("Found %d processed project entries.", len(entries))
    return entries


async def list_processed_projects() -> list[ProcessedProjectEntry]:
    project_entries: list[ProcessedProjectEntry] = [
        ProcessedProjectEntry(
            id=wiki.id,
            owner=wiki.owner,
            repo=wiki.repo,
            name=wiki.name,
            repo_type=wiki.repo_type,
            submittedAt=wiki.submitted_at,
            language=wiki.language,
        )
        for wiki in await list_wiki_cache()
    ]

    project_entries.sort(key=lambda p: p.submittedAt, reverse=True)
    return project_entries


def _generate_json_export(
    repo_url: str, pages: list[WikiPage], timestamp: datetime
) -> str:
    """
    Generate JSON export of wiki pages.

    Args:
        repo_url: The repository URL
        pages: List of wiki pages

    Returns:
        JSON content as string
    """
    # Create a dictionary with metadata and pages
    export_data = {
        "metadata": {
            "repository": repo_url,
            "generated_at": timestamp.isoformat(),
            "page_count": len(pages),
        },
        "pages": [page.model_dump() for page in pages],
    }

    # Convert to JSON string with pretty formatting
    return json.dumps(export_data, indent=2)


def _generate_markdown_export(
    repo_url: str, pages: list[WikiPage], timestamp: datetime
) -> str:
    """
    Generate Markdown export of wiki pages.

    Args:
        repo_url: The repository URL
        pages: List of wiki pages

    Returns:
        Markdown content as string
    """
    # Start with metadata
    markdown = f"# Wiki Documentation for {repo_url}\n\n"
    markdown += f"Generated on: {timestamp.strftime('%Y-%m-%d %H:%M:%S')}\n\n"

    # Add table of contents
    markdown += "## Table of Contents\n\n"
    for page in pages:
        markdown += f"- [{page.title}](#{page.id})\n"
    markdown += "\n"

    # Add each page
    for page in pages:
        markdown += f"<a id='{page.id}'></a>\n\n"
        markdown += f"## {page.title}\n\n"

        # Add related pages
        if page.relatedPages and len(page.relatedPages) > 0:
            markdown += "### Related Pages\n\n"
            related_titles = []
            for related_id in page.relatedPages:
                # Find the title of the related page
                related_page = next((p for p in pages if p.id == related_id), None)
                if related_page:
                    related_titles.append(f"[{related_page.title}](#{related_id})")

            if related_titles:
                markdown += "Related topics: " + ", ".join(related_titles) + "\n\n"

        # Add page content
        markdown += f"{page.content}\n\n"
        markdown += "---\n\n"

    return markdown


def export_wiki(
    repo_url: str,
    pages: list[WikiPage],
    format: Literal["json", "markdown"],
    timestamp: datetime | None = None,
) -> str:
    dt = timestamp or datetime.now()
    if format == "json":
        return _generate_json_export(repo_url, pages, timestamp=dt)
    elif format == "markdown":
        return _generate_markdown_export(repo_url, pages, timestamp=dt)
    else:
        raise NotImplementedError(
            f"Exporting wiki to format {format} is not supported. Must be one of 'markdown' or 'json'.",
        )
