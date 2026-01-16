"""GitHub Wiki writer for DeepWiki Single Provider."""

import logging
import os
from typing import List, Dict
from pathlib import Path

logger = logging.getLogger(__name__)


class WikiWriter:
    """Write generated pages to GitHub Wiki format.

    Creates .md files and _Sidebar.md for navigation.
    """

    def __init__(self, output_dir: str, dry_run: bool = False):
        """Initialize wiki writer.

        Args:
            output_dir: Directory to write wiki files
            dry_run: If True, don't actually write files
        """
        self.output_dir = output_dir
        self.dry_run = dry_run

        if not dry_run:
            os.makedirs(output_dir, exist_ok=True)

    def write_wiki(self, pages: List[Dict[str, str]]):
        """Write all wiki pages.

        Args:
            pages: List of {name, content} dictionaries
        """
        if not pages:
            logger.warning("No pages to write")
            return

        logger.info(f"Writing {len(pages)} pages to {self.output_dir}")

        # Write individual pages
        for page in pages:
            self._write_page(page['name'], page['content'])

        # Generate and write sidebar
        self._write_sidebar(pages)

        if self.dry_run:
            logger.info("[DRY RUN] Would have written files")
        else:
            logger.info(f"Wiki written to {self.output_dir}")

    def _write_page(self, name: str, content: str):
        """Write a single page.

        Args:
            name: Page name (without .md extension)
            content: Markdown content
        """
        # Sanitize filename
        filename = self._sanitize_filename(name) + ".md"
        filepath = os.path.join(self.output_dir, filename)

        if self.dry_run:
            logger.info(f"[DRY RUN] Would write: {filepath} ({len(content)} chars)")
        else:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            logger.debug(f"Wrote {filepath}")

    def _write_sidebar(self, pages: List[Dict[str, str]]):
        """Generate and write _Sidebar.md.

        Args:
            pages: List of pages
        """
        sidebar_content = "# Wiki Navigation\n\n"

        # Ensure Home is first
        sorted_pages = sorted(pages, key=lambda p: (p['name'] != 'Home', p['name']))

        for page in sorted_pages:
            name = page['name']
            link = self._sanitize_filename(name)
            sidebar_content += f"* [{name}]({link})\n"

        filepath = os.path.join(self.output_dir, "_Sidebar.md")

        if self.dry_run:
            logger.info(f"[DRY RUN] Would write: {filepath}")
            logger.debug(sidebar_content)
        else:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(sidebar_content)
            logger.debug(f"Wrote {filepath}")

    def _sanitize_filename(self, name: str) -> str:
        """Convert page name to valid filename.

        Args:
            name: Page name

        Returns:
            Sanitized filename (without extension)
        """
        # Replace spaces with hyphens
        sanitized = name.replace(' ', '-')
        # Remove invalid characters
        sanitized = ''.join(c for c in sanitized if c.isalnum() or c in '-_')
        return sanitized

    def get_wiki_summary(self) -> str:
        """Get summary of written wiki.

        Returns:
            Summary string
        """
        if not os.path.exists(self.output_dir):
            return "Wiki directory not found"

        files = list(Path(self.output_dir).glob("*.md"))
        total_size = sum(f.stat().st_size for f in files)

        return f"Wiki: {len(files)} pages, {total_size:,} bytes in {self.output_dir}"
