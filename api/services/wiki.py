import asyncio
import json
import os
from datetime import datetime
from typing import Literal

from api.logger import get_logger
from api.schemas import (
    ProcessedProjectEntry,
    WikiCacheData,
    WikiCacheRequest,
    WikiPage,
    aload,
    asave,
)

logger = get_logger(__name__)


# Helper function to get adalflow root path
def get_adalflow_default_root_path():
    return os.path.expanduser(os.path.join("~", ".adalflow"))


WIKI_CACHE_DIR = os.path.join(get_adalflow_default_root_path(), "wikicache")
os.makedirs(WIKI_CACHE_DIR, exist_ok=True)


def get_wiki_cache_path(owner: str, repo: str, repo_type: str, language: str) -> str:
    """Generates the file path for a given wiki cache."""
    filename = f"deepwiki_cache_{repo_type}_{owner}_{repo}_{language}.json"
    return os.path.join(WIKI_CACHE_DIR, filename)


async def read_wiki_cache(
    owner: str, repo: str, repo_type: str, language: str
) -> WikiCacheData | None:
    """Reads wiki cache data from the file system."""
    cache_path = get_wiki_cache_path(owner, repo, repo_type, language)
    if not os.path.exists(cache_path):
        return None
    try:
        return await aload(WikiCacheData, cache_path, encoding="utf-8")
    except Exception:
        logger.exception("Error reading wiki cache from %s", cache_path)
        return None


async def save_wiki_cache(data: WikiCacheRequest) -> bool:
    """Saves wiki cache data to the file system."""
    cache_path = get_wiki_cache_path(
        data.repo.owner, data.repo.repo, data.repo.type, data.language
    )
    logger.info(f"Attempting to save wiki cache. Path: {cache_path}")
    try:
        wiki_cache = WikiCacheData(
            wiki_structure=data.wiki_structure,
            generated_pages=data.generated_pages,
            repo=data.repo,
            provider=data.provider,
            model=data.model,
        )
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


async def list_processed_projects() -> list[ProcessedProjectEntry]:
    project_entries: list[ProcessedProjectEntry] = []

    if not os.path.exists(WIKI_CACHE_DIR):
        logger.info(
            f"Cache directory {WIKI_CACHE_DIR} not found. Returning empty list."
        )
        return []

    logger.info(f"Scanning for project cache files in: {WIKI_CACHE_DIR}")
    filenames = await asyncio.to_thread(os.listdir, WIKI_CACHE_DIR)

    for filename in filenames:
        if filename.startswith("deepwiki_cache_") and filename.endswith(".json"):
            file_path = os.path.join(WIKI_CACHE_DIR, filename)
            try:
                stats = await asyncio.to_thread(os.stat, file_path)
                parts = (
                    filename.replace("deepwiki_cache_", "")
                    .replace(".json", "")
                    .split("_")
                )
                # Expecting repo_type_owner_repo_language
                if len(parts) >= 4:
                    repo_type = parts[0]
                    owner = parts[1]
                    language = parts[-1]
                    repo = "_".join(parts[2:-1])  # repo can contain underscores
                    project_entries.append(
                        ProcessedProjectEntry(
                            id=filename,
                            owner=owner,
                            repo=repo,
                            name=f"{owner}/{repo}",
                            repo_type=repo_type,
                            submittedAt=int(stats.st_mtime * 1000),
                            language=language,
                        )
                    )
                else:
                    logger.warning(
                        f"Could not parse project details from filename: {filename}"
                    )
            except Exception as e:
                logger.error(f"Error processing file {file_path}: {e}")
                continue

    project_entries.sort(key=lambda p: p.submittedAt, reverse=True)
    logger.info(f"Found {len(project_entries)} processed project entries.")
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
