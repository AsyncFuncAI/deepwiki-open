"""Repository ingestion pipeline for DeepWiki Single Provider."""

import os
import logging
import subprocess
import glob
from typing import List, Dict
from pathlib import Path
from urllib.parse import urlparse, urlunparse, quote

logger = logging.getLogger(__name__)

# Simplified exclusion patterns
EXCLUDED_DIRS = [
    ".git", ".venv", "venv", "node_modules", "__pycache__",
    "dist", "build", ".idea", ".vscode", "logs", "tmp"
]

EXCLUDED_EXTENSIONS = [
    ".pyc", ".pyo", ".so", ".dll", ".exe", ".bin",
    ".zip", ".tar", ".gz", ".jpg", ".png", ".gif", ".pdf",
    ".lock", ".log", ".min.js", ".min.css", ".map"
]


class RepositoryIngester:
    """Simplified repository ingestion - no complex filtering."""

    def __init__(self, workspace_dir: str = "./workspace"):
        """Initialize ingester.

        Args:
            workspace_dir: Directory to clone repositories
        """
        self.workspace_dir = workspace_dir
        os.makedirs(workspace_dir, exist_ok=True)

    def clone_repo(
        self,
        repo_url: str,
        access_token: str = None,
    ) -> str:
        """Clone GitHub repository.

        Args:
            repo_url: GitHub repository URL
            access_token: Optional GitHub token for private repos

        Returns:
            Local path to cloned repository
        """
        # Extract repo name from URL
        repo_name = repo_url.rstrip('/').split('/')[-1].replace('.git', '')
        local_path = os.path.join(self.workspace_dir, repo_name)

        # Check if already exists
        if os.path.exists(local_path) and os.listdir(local_path):
            logger.info(f"Repository already exists at {local_path}")
            return local_path

        # Prepare clone URL with token if provided
        clone_url = repo_url
        if access_token:
            parsed = urlparse(repo_url)
            encoded_token = quote(access_token, safe='')
            clone_url = urlunparse((
                parsed.scheme,
                f"{encoded_token}@{parsed.netloc}",
                parsed.path,
                '', '', ''
            ))

        # Clone repository
        logger.info(f"Cloning {repo_url} to {local_path}")
        try:
            subprocess.run(
                ["git", "clone", "--depth=1", "--single-branch", clone_url, local_path],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            logger.info("Repository cloned successfully")
            return local_path
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.decode('utf-8')
            if access_token:
                error_msg = error_msg.replace(access_token, "***TOKEN***")
            raise RuntimeError(f"Clone failed: {error_msg}")

    def load_files(self, repo_path: str) -> List[Dict[str, str]]:
        """Load code files from repository.

        Args:
            repo_path: Path to cloned repository

        Returns:
            List of {path, content} dictionaries
        """
        files = []
        repo_path = Path(repo_path).resolve()

        logger.info(f"Loading files from {repo_path}")

        for root, dirs, filenames in os.walk(repo_path):
            # Filter out excluded directories
            dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]

            for filename in filenames:
                # Skip excluded extensions
                if any(filename.endswith(ext) for ext in EXCLUDED_EXTENSIONS):
                    continue

                file_path = Path(root) / filename
                relative_path = file_path.relative_to(repo_path)

                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    files.append({
                        'path': str(relative_path),
                        'content': content,
                        'size': len(content),
                    })
                except (UnicodeDecodeError, IOError) as e:
                    logger.debug(f"Skipping {relative_path}: {e}")
                    continue

        logger.info(f"Loaded {len(files)} files")
        return files
