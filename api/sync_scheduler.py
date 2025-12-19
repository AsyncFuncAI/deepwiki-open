"""
Periodic Index Synchronization Scheduler

This module provides background scheduling for automatic index synchronization,
allowing the system to periodically check for repository changes and update
the embeddings index accordingly.

Environment Variables:
    DEEPWIKI_SYNC_ENABLED: Enable/disable sync scheduler (default: true)
    DEEPWIKI_SYNC_CHECK_INTERVAL: Scheduler check interval in seconds (default: 60)
    DEEPWIKI_SYNC_DEFAULT_INTERVAL: Default sync interval in minutes (default: 60)
    DEEPWIKI_SYNC_MAX_RETRIES: Maximum retry attempts for failed syncs (default: 3)
    DEEPWIKI_SYNC_AUTO_REGISTER: Auto-register projects from wiki cache (default: true)
"""

import os
import json
import logging
import asyncio
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from enum import Enum
from threading import Lock
from collections import deque


def get_adalflow_default_root_path():
    """Get the default adalflow root path. Lazy import to avoid issues."""
    try:
        from adalflow.utils import get_adalflow_default_root_path as _get_path
        return _get_path()
    except ImportError:
        return os.path.expanduser(os.path.join("~", ".adalflow"))


logger = logging.getLogger(__name__)


# --- Configuration from Environment Variables ---

def get_sync_config() -> Dict[str, Any]:
    """Get sync configuration from environment variables."""
    return {
        "enabled": os.environ.get("DEEPWIKI_SYNC_ENABLED", "true").lower() == "true",
        "check_interval_seconds": int(os.environ.get("DEEPWIKI_SYNC_CHECK_INTERVAL", "60")),
        "default_interval_minutes": int(os.environ.get("DEEPWIKI_SYNC_DEFAULT_INTERVAL", "60")),
        "max_retries": int(os.environ.get("DEEPWIKI_SYNC_MAX_RETRIES", "3")),
        "auto_register": os.environ.get("DEEPWIKI_SYNC_AUTO_REGISTER", "true").lower() == "true",
        "retry_base_delay_seconds": int(os.environ.get("DEEPWIKI_SYNC_RETRY_DELAY", "30")),
    }


class SyncStatus(str, Enum):
    """Status of a sync operation"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    DISABLED = "disabled"


@dataclass
class SyncHistoryEntry:
    """Entry in sync history log"""
    timestamp: str
    status: str
    commit_hash: Optional[str] = None
    document_count: Optional[int] = None
    embedding_count: Optional[int] = None
    duration_seconds: Optional[float] = None
    error_message: Optional[str] = None
    triggered_by: str = "scheduler"  # scheduler, manual, webhook

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class SyncMetadata:
    """Metadata for tracking sync status of a project"""
    repo_url: str
    owner: str
    repo: str
    repo_type: str  # github, gitlab, bitbucket
    last_synced: Optional[str] = None  # ISO format datetime
    last_commit_hash: Optional[str] = None
    sync_status: SyncStatus = SyncStatus.PENDING
    sync_interval_minutes: int = 60  # Default sync interval
    document_count: int = 0
    embedding_count: int = 0
    error_message: Optional[str] = None
    next_sync: Optional[str] = None  # ISO format datetime
    enabled: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    access_token: Optional[str] = None  # Stored securely, not exposed in API
    # Retry tracking
    retry_count: int = 0
    last_retry: Optional[str] = None
    # Sync history (last N entries)
    sync_history: List[Dict[str, Any]] = field(default_factory=list)
    total_syncs: int = 0
    successful_syncs: int = 0
    failed_syncs: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary, excluding sensitive fields"""
        result = asdict(self)
        # Don't expose access token in API responses
        result.pop('access_token', None)
        return result

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SyncMetadata':
        """Create from dictionary"""
        # Handle sync_status enum conversion
        if 'sync_status' in data and isinstance(data['sync_status'], str):
            try:
                data['sync_status'] = SyncStatus(data['sync_status'])
            except ValueError:
                data['sync_status'] = SyncStatus.PENDING

        # Handle missing fields for backward compatibility
        defaults = {
            'retry_count': 0,
            'last_retry': None,
            'sync_history': [],
            'total_syncs': 0,
            'successful_syncs': 0,
            'failed_syncs': 0,
        }
        for key, default_value in defaults.items():
            if key not in data:
                data[key] = default_value

        return cls(**data)

    def add_history_entry(self, entry: SyncHistoryEntry, max_entries: int = 50):
        """Add a history entry, keeping only the most recent entries"""
        self.sync_history.insert(0, entry.to_dict())
        if len(self.sync_history) > max_entries:
            self.sync_history = self.sync_history[:max_entries]


class SyncMetadataStore:
    """Persistent storage for sync metadata"""

    def __init__(self, storage_dir: Optional[str] = None):
        if storage_dir is None:
            root_path = get_adalflow_default_root_path()
            storage_dir = os.path.join(root_path, "sync_metadata")

        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)
        self._lock = Lock()
        self._cache: Dict[str, SyncMetadata] = {}
        self._load_all()

    def _get_file_path(self, project_id: str) -> str:
        """Get the file path for a project's metadata"""
        safe_id = project_id.replace("/", "_").replace(":", "_")
        return os.path.join(self.storage_dir, f"{safe_id}.json")

    def _generate_project_id(self, owner: str, repo: str, repo_type: str) -> str:
        """Generate a unique project ID"""
        return f"{repo_type}_{owner}_{repo}"

    def _load_all(self):
        """Load all metadata from storage"""
        try:
            for filename in os.listdir(self.storage_dir):
                if filename.endswith('.json'):
                    filepath = os.path.join(self.storage_dir, filename)
                    try:
                        with open(filepath, 'r') as f:
                            data = json.load(f)
                            metadata = SyncMetadata.from_dict(data)
                            project_id = self._generate_project_id(
                                metadata.owner, metadata.repo, metadata.repo_type
                            )
                            self._cache[project_id] = metadata
                    except Exception as e:
                        logger.error(f"Error loading sync metadata from {filepath}: {e}")
        except FileNotFoundError:
            pass
        except Exception as e:
            logger.error(f"Error loading sync metadata: {e}")

    def save(self, metadata: SyncMetadata) -> bool:
        """Save metadata to storage"""
        project_id = self._generate_project_id(
            metadata.owner, metadata.repo, metadata.repo_type
        )

        with self._lock:
            try:
                # Update timestamps
                now = datetime.utcnow().isoformat()
                if metadata.created_at is None:
                    metadata.created_at = now
                metadata.updated_at = now

                # Save to file
                filepath = self._get_file_path(project_id)
                with open(filepath, 'w') as f:
                    json.dump(asdict(metadata), f, indent=2, default=str)

                # Update cache
                self._cache[project_id] = metadata
                logger.debug(f"Saved sync metadata for {project_id}")
                return True
            except Exception as e:
                logger.error(f"Error saving sync metadata for {project_id}: {e}")
                return False

    def get(self, owner: str, repo: str, repo_type: str) -> Optional[SyncMetadata]:
        """Get metadata for a project"""
        project_id = self._generate_project_id(owner, repo, repo_type)
        return self._cache.get(project_id)

    def get_all(self) -> List[SyncMetadata]:
        """Get all metadata"""
        return list(self._cache.values())

    def delete(self, owner: str, repo: str, repo_type: str) -> bool:
        """Delete metadata for a project"""
        project_id = self._generate_project_id(owner, repo, repo_type)

        with self._lock:
            try:
                # Remove from cache
                if project_id in self._cache:
                    del self._cache[project_id]

                # Remove file
                filepath = self._get_file_path(project_id)
                if os.path.exists(filepath):
                    os.remove(filepath)

                logger.info(f"Deleted sync metadata for {project_id}")
                return True
            except Exception as e:
                logger.error(f"Error deleting sync metadata for {project_id}: {e}")
                return False

    def get_projects_needing_sync(self) -> List[SyncMetadata]:
        """Get all projects that need synchronization"""
        now = datetime.utcnow()
        projects = []
        config = get_sync_config()

        for metadata in self._cache.values():
            if not metadata.enabled:
                continue

            if metadata.sync_status == SyncStatus.IN_PROGRESS:
                continue

            # Check retry backoff for failed syncs
            if metadata.sync_status == SyncStatus.FAILED and metadata.retry_count > 0:
                if metadata.retry_count >= config["max_retries"]:
                    # Max retries reached, skip until manual intervention
                    continue

                if metadata.last_retry:
                    try:
                        last_retry = datetime.fromisoformat(metadata.last_retry)
                        # Exponential backoff: base_delay * 2^retry_count
                        backoff_seconds = config["retry_base_delay_seconds"] * (2 ** metadata.retry_count)
                        next_retry = last_retry + timedelta(seconds=backoff_seconds)
                        if now < next_retry:
                            continue
                    except ValueError:
                        pass

            # Check if it's time for next sync
            if metadata.next_sync:
                try:
                    next_sync_time = datetime.fromisoformat(metadata.next_sync)
                    if now >= next_sync_time:
                        projects.append(metadata)
                except ValueError:
                    # Invalid datetime, schedule for sync
                    projects.append(metadata)
            else:
                # Never synced before
                projects.append(metadata)

        return projects


class IndexSyncManager:
    """Manages the actual synchronization of repository indexes"""

    def __init__(self, metadata_store: SyncMetadataStore):
        self.metadata_store = metadata_store
        self._sync_lock = Lock()

    def _get_remote_commit_hash(self, repo_path: str) -> Optional[str]:
        """Get the latest commit hash from the remote repository"""
        try:
            # Fetch from remote without pulling
            subprocess.run(
                ["git", "fetch", "origin"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=60
            )

            # Get the latest commit hash from origin/main or origin/master
            for branch in ["origin/main", "origin/master", "origin/HEAD"]:
                result = subprocess.run(
                    ["git", "rev-parse", branch],
                    cwd=repo_path,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                if result.returncode == 0:
                    return result.stdout.strip()

            return None
        except Exception as e:
            logger.error(f"Error getting remote commit hash: {e}")
            return None

    def _get_local_commit_hash(self, repo_path: str) -> Optional[str]:
        """Get the current local commit hash"""
        try:
            result = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode == 0:
                return result.stdout.strip()
            return None
        except Exception as e:
            logger.error(f"Error getting local commit hash: {e}")
            return None

    def _pull_latest_changes(self, repo_path: str) -> bool:
        """Pull the latest changes from the remote repository"""
        try:
            result = subprocess.run(
                ["git", "pull", "origin"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=120
            )
            return result.returncode == 0
        except Exception as e:
            logger.error(f"Error pulling latest changes: {e}")
            return False

    def _get_changed_files(self, repo_path: str, old_commit: str, new_commit: str) -> List[str]:
        """Get list of files changed between two commits"""
        try:
            result = subprocess.run(
                ["git", "diff", "--name-only", old_commit, new_commit],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=60
            )
            if result.returncode == 0:
                return [f.strip() for f in result.stdout.strip().split('\n') if f.strip()]
            return []
        except Exception as e:
            logger.error(f"Error getting changed files: {e}")
            return []

    def check_for_updates(self, metadata: SyncMetadata) -> Dict[str, Any]:
        """
        Check if a repository has updates without actually syncing.

        Returns:
            Dict with 'has_updates', 'remote_commit', 'changed_files' keys
        """
        root_path = get_adalflow_default_root_path()
        repo_path = os.path.join(root_path, "repos", metadata.repo)

        if not os.path.exists(repo_path):
            return {
                "has_updates": True,
                "remote_commit": None,
                "changed_files": [],
                "reason": "Repository not cloned"
            }

        remote_commit = self._get_remote_commit_hash(repo_path)
        local_commit = self._get_local_commit_hash(repo_path)

        if not remote_commit:
            return {
                "has_updates": False,
                "remote_commit": None,
                "changed_files": [],
                "reason": "Could not fetch remote commit"
            }

        has_updates = (
            remote_commit != local_commit or
            remote_commit != metadata.last_commit_hash
        )

        changed_files = []
        if has_updates and local_commit and remote_commit:
            changed_files = self._get_changed_files(repo_path, local_commit, remote_commit)

        return {
            "has_updates": has_updates,
            "remote_commit": remote_commit,
            "local_commit": local_commit,
            "changed_files": changed_files,
            "reason": "Updates available" if has_updates else "Up to date"
        }

    async def sync_project(
        self,
        metadata: SyncMetadata,
        force: bool = False,
        triggered_by: str = "scheduler"
    ) -> Dict[str, Any]:
        """
        Synchronize a project's index.

        Args:
            metadata: The project's sync metadata
            force: If True, force re-indexing even if no changes detected
            triggered_by: What triggered this sync (scheduler, manual, webhook)

        Returns:
            Dict with sync results
        """
        from api.data_pipeline import read_all_documents, transform_documents_and_save_to_db
        from api.config import is_ollama_embedder

        project_id = f"{metadata.repo_type}_{metadata.owner}_{metadata.repo}"
        logger.info(f"Starting sync for project: {project_id} (triggered by: {triggered_by})")

        start_time = datetime.utcnow()

        # Update status to in_progress
        metadata.sync_status = SyncStatus.IN_PROGRESS
        metadata.error_message = None
        self.metadata_store.save(metadata)

        root_path = get_adalflow_default_root_path()
        repo_path = os.path.join(root_path, "repos", metadata.repo)
        db_path = os.path.join(root_path, "databases", f"{metadata.repo}.pkl")

        config = get_sync_config()

        try:
            # Check for updates
            update_info = self.check_for_updates(metadata)

            if not force and not update_info["has_updates"]:
                logger.info(f"No updates for {project_id}, skipping sync")
                metadata.sync_status = SyncStatus.COMPLETED
                metadata.next_sync = (
                    datetime.utcnow() + timedelta(minutes=metadata.sync_interval_minutes)
                ).isoformat()
                metadata.retry_count = 0  # Reset retry count on success
                self.metadata_store.save(metadata)
                return {
                    "success": True,
                    "skipped": True,
                    "reason": "No updates detected"
                }

            # Pull latest changes
            if os.path.exists(repo_path):
                logger.info(f"Pulling latest changes for {project_id}")
                if not self._pull_latest_changes(repo_path):
                    raise Exception("Failed to pull latest changes")
            else:
                # Repository doesn't exist, need to clone
                logger.info(f"Repository not found, needs initial clone for {project_id}")
                from api.data_pipeline import download_repo
                download_repo(
                    metadata.repo_url,
                    repo_path,
                    metadata.repo_type,
                    metadata.access_token
                )

            # Read and index documents
            logger.info(f"Reading documents for {project_id}")
            is_ollama = is_ollama_embedder()
            documents = read_all_documents(repo_path, is_ollama_embedder=is_ollama)

            if not documents:
                raise Exception("No documents found in repository")

            # Transform and save to database
            logger.info(f"Indexing {len(documents)} documents for {project_id}")

            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            db = await loop.run_in_executor(
                None,
                transform_documents_and_save_to_db,
                documents,
                db_path,
                is_ollama
            )

            transformed_docs = db.get_transformed_data(key="split_and_embed")

            # Calculate duration
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()

            # Update metadata
            new_commit = update_info.get("remote_commit") or self._get_local_commit_hash(repo_path)
            metadata.last_synced = datetime.utcnow().isoformat()
            metadata.last_commit_hash = new_commit
            metadata.sync_status = SyncStatus.COMPLETED
            metadata.document_count = len(documents)
            metadata.embedding_count = len(transformed_docs) if transformed_docs else 0
            metadata.error_message = None
            metadata.next_sync = (
                datetime.utcnow() + timedelta(minutes=metadata.sync_interval_minutes)
            ).isoformat()
            metadata.retry_count = 0  # Reset retry count on success
            metadata.total_syncs += 1
            metadata.successful_syncs += 1

            # Add history entry
            history_entry = SyncHistoryEntry(
                timestamp=end_time.isoformat(),
                status="completed",
                commit_hash=new_commit,
                document_count=len(documents),
                embedding_count=metadata.embedding_count,
                duration_seconds=duration,
                triggered_by=triggered_by
            )
            metadata.add_history_entry(history_entry)

            self.metadata_store.save(metadata)

            logger.info(f"Sync completed for {project_id}: {len(documents)} docs, "
                       f"{metadata.embedding_count} embeddings in {duration:.1f}s")

            return {
                "success": True,
                "skipped": False,
                "document_count": len(documents),
                "embedding_count": metadata.embedding_count,
                "commit_hash": new_commit,
                "duration_seconds": duration
            }

        except Exception as e:
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()

            logger.error(f"Sync failed for {project_id}: {e}")
            metadata.sync_status = SyncStatus.FAILED
            metadata.error_message = str(e)
            metadata.retry_count += 1
            metadata.last_retry = datetime.utcnow().isoformat()
            metadata.total_syncs += 1
            metadata.failed_syncs += 1

            # Calculate next sync with backoff
            if metadata.retry_count < config["max_retries"]:
                backoff_seconds = config["retry_base_delay_seconds"] * (2 ** metadata.retry_count)
                metadata.next_sync = (
                    datetime.utcnow() + timedelta(seconds=backoff_seconds)
                ).isoformat()
            else:
                # Max retries reached, use normal interval
                metadata.next_sync = (
                    datetime.utcnow() + timedelta(minutes=metadata.sync_interval_minutes)
                ).isoformat()

            # Add history entry
            history_entry = SyncHistoryEntry(
                timestamp=end_time.isoformat(),
                status="failed",
                error_message=str(e),
                duration_seconds=duration,
                triggered_by=triggered_by
            )
            metadata.add_history_entry(history_entry)

            self.metadata_store.save(metadata)

            return {
                "success": False,
                "error": str(e),
                "retry_count": metadata.retry_count,
                "max_retries": config["max_retries"]
            }


class SyncScheduler:
    """
    Background scheduler for periodic index synchronization.

    Uses asyncio for background task management instead of APScheduler
    to minimize external dependencies.
    """

    def __init__(self, check_interval_seconds: Optional[int] = None):
        """
        Initialize the sync scheduler.

        Args:
            check_interval_seconds: How often to check for projects needing sync.
                                  If None, uses DEEPWIKI_SYNC_CHECK_INTERVAL env var.
        """
        config = get_sync_config()
        self.check_interval = check_interval_seconds or config["check_interval_seconds"]
        self.default_sync_interval = config["default_interval_minutes"]
        self.auto_register = config["auto_register"]

        self.metadata_store = SyncMetadataStore()
        self.sync_manager = IndexSyncManager(self.metadata_store)
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._manual_sync_queue: asyncio.Queue = asyncio.Queue()

    async def start(self):
        """Start the background scheduler"""
        if self._running:
            logger.warning("Scheduler is already running")
            return

        self._running = True

        # Auto-register projects from wiki cache if enabled
        if self.auto_register:
            await self._auto_register_projects()

        self._task = asyncio.create_task(self._run_scheduler())
        logger.info(f"Sync scheduler started (check interval: {self.check_interval}s)")

    async def stop(self):
        """Stop the background scheduler"""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Sync scheduler stopped")

    async def _auto_register_projects(self):
        """Auto-register projects from wiki cache directory"""
        try:
            root_path = get_adalflow_default_root_path()
            wiki_cache_dir = os.path.join(root_path, "wikicache")

            if not os.path.exists(wiki_cache_dir):
                return

            registered = 0
            for filename in os.listdir(wiki_cache_dir):
                if not filename.startswith("deepwiki_cache_") or not filename.endswith(".json"):
                    continue

                try:
                    # Parse filename: deepwiki_cache_{repo_type}_{owner}_{repo}_{language}.json
                    parts = filename.replace("deepwiki_cache_", "").replace(".json", "").split('_')
                    if len(parts) >= 4:
                        repo_type = parts[0]
                        owner = parts[1]
                        language = parts[-1]
                        repo = "_".join(parts[2:-1])

                        # Check if already registered
                        existing = self.metadata_store.get(owner, repo, repo_type)
                        if existing:
                            continue

                        # Construct repo URL
                        if repo_type == "github":
                            repo_url = f"https://github.com/{owner}/{repo}"
                        elif repo_type == "gitlab":
                            repo_url = f"https://gitlab.com/{owner}/{repo}"
                        elif repo_type == "bitbucket":
                            repo_url = f"https://bitbucket.org/{owner}/{repo}"
                        else:
                            continue

                        # Register the project
                        self.add_project(
                            repo_url=repo_url,
                            owner=owner,
                            repo=repo,
                            repo_type=repo_type,
                            enabled=True
                        )
                        registered += 1
                        logger.info(f"Auto-registered project from wiki cache: {owner}/{repo}")

                except Exception as e:
                    logger.warning(f"Error parsing wiki cache file {filename}: {e}")

            if registered > 0:
                logger.info(f"Auto-registered {registered} projects from wiki cache")

        except Exception as e:
            logger.error(f"Error in auto-registration: {e}")

    async def _run_scheduler(self):
        """Main scheduler loop"""
        while self._running:
            try:
                # Check for manual sync requests
                try:
                    while True:
                        item = self._manual_sync_queue.get_nowait()
                        metadata, triggered_by = item
                        await self.sync_manager.sync_project(
                            metadata, force=True, triggered_by=triggered_by
                        )
                except asyncio.QueueEmpty:
                    pass

                # Check for scheduled syncs
                projects = self.metadata_store.get_projects_needing_sync()

                for metadata in projects:
                    if not self._running:
                        break

                    try:
                        await self.sync_manager.sync_project(metadata, triggered_by="scheduler")
                    except Exception as e:
                        logger.error(f"Error syncing project {metadata.owner}/{metadata.repo}: {e}")

                # Wait before next check
                await asyncio.sleep(self.check_interval)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
                await asyncio.sleep(self.check_interval)

    def add_project(
        self,
        repo_url: str,
        owner: str,
        repo: str,
        repo_type: str = "github",
        sync_interval_minutes: Optional[int] = None,
        access_token: Optional[str] = None,
        enabled: bool = True
    ) -> SyncMetadata:
        """
        Add a project for periodic synchronization.

        Args:
            repo_url: Full URL of the repository
            owner: Repository owner/organization
            repo: Repository name
            repo_type: Type of repository (github, gitlab, bitbucket)
            sync_interval_minutes: How often to sync (in minutes). Uses default if None.
            access_token: Optional access token for private repositories
            enabled: Whether sync is enabled for this project

        Returns:
            SyncMetadata for the added project
        """
        if sync_interval_minutes is None:
            sync_interval_minutes = self.default_sync_interval

        # Check if project already exists
        existing = self.metadata_store.get(owner, repo, repo_type)
        if existing:
            # Update existing metadata
            existing.repo_url = repo_url
            existing.sync_interval_minutes = sync_interval_minutes
            existing.enabled = enabled
            if access_token:
                existing.access_token = access_token
            self.metadata_store.save(existing)
            logger.info(f"Updated sync settings for {owner}/{repo}")
            return existing

        # Create new metadata
        metadata = SyncMetadata(
            repo_url=repo_url,
            owner=owner,
            repo=repo,
            repo_type=repo_type,
            sync_interval_minutes=sync_interval_minutes,
            access_token=access_token,
            enabled=enabled,
            sync_status=SyncStatus.PENDING
        )

        self.metadata_store.save(metadata)
        logger.info(f"Added project for sync: {owner}/{repo}")
        return metadata

    def remove_project(self, owner: str, repo: str, repo_type: str) -> bool:
        """Remove a project from periodic synchronization"""
        return self.metadata_store.delete(owner, repo, repo_type)

    def get_project_status(self, owner: str, repo: str, repo_type: str) -> Optional[Dict[str, Any]]:
        """Get sync status for a project"""
        metadata = self.metadata_store.get(owner, repo, repo_type)
        if metadata:
            return metadata.to_dict()
        return None

    def get_all_projects(self) -> List[Dict[str, Any]]:
        """Get sync status for all projects"""
        return [m.to_dict() for m in self.metadata_store.get_all()]

    def get_project_history(
        self,
        owner: str,
        repo: str,
        repo_type: str,
        limit: int = 50
    ) -> Optional[List[Dict[str, Any]]]:
        """Get sync history for a project"""
        metadata = self.metadata_store.get(owner, repo, repo_type)
        if metadata:
            return metadata.sync_history[:limit]
        return None

    async def trigger_sync(
        self,
        owner: str,
        repo: str,
        repo_type: str,
        triggered_by: str = "manual"
    ) -> Dict[str, Any]:
        """
        Manually trigger a sync for a project.

        Args:
            owner: Repository owner
            repo: Repository name
            repo_type: Repository type
            triggered_by: What triggered the sync (manual, webhook, etc.)

        Returns:
            Sync result dictionary
        """
        metadata = self.metadata_store.get(owner, repo, repo_type)
        if not metadata:
            return {"success": False, "error": "Project not found"}

        return await self.sync_manager.sync_project(
            metadata, force=True, triggered_by=triggered_by
        )

    def update_project_settings(
        self,
        owner: str,
        repo: str,
        repo_type: str,
        sync_interval_minutes: Optional[int] = None,
        enabled: Optional[bool] = None
    ) -> Optional[Dict[str, Any]]:
        """Update sync settings for a project"""
        metadata = self.metadata_store.get(owner, repo, repo_type)
        if not metadata:
            return None

        if sync_interval_minutes is not None:
            metadata.sync_interval_minutes = sync_interval_minutes

        if enabled is not None:
            metadata.enabled = enabled
            # Reset retry count when re-enabling
            if enabled:
                metadata.retry_count = 0

        # Recalculate next sync time
        if metadata.enabled and metadata.last_synced:
            try:
                last_sync = datetime.fromisoformat(metadata.last_synced)
                metadata.next_sync = (
                    last_sync + timedelta(minutes=metadata.sync_interval_minutes)
                ).isoformat()
            except ValueError:
                pass

        self.metadata_store.save(metadata)
        return metadata.to_dict()

    def reset_project_retries(self, owner: str, repo: str, repo_type: str) -> Optional[Dict[str, Any]]:
        """Reset retry count for a failed project"""
        metadata = self.metadata_store.get(owner, repo, repo_type)
        if not metadata:
            return None

        metadata.retry_count = 0
        metadata.last_retry = None
        if metadata.sync_status == SyncStatus.FAILED:
            metadata.sync_status = SyncStatus.PENDING
            metadata.next_sync = datetime.utcnow().isoformat()

        self.metadata_store.save(metadata)
        return metadata.to_dict()

    def check_for_updates(self, owner: str, repo: str, repo_type: str) -> Dict[str, Any]:
        """Check if a project has updates without syncing"""
        metadata = self.metadata_store.get(owner, repo, repo_type)
        if not metadata:
            return {"error": "Project not found"}

        return self.sync_manager.check_for_updates(metadata)

    def get_stats(self) -> Dict[str, Any]:
        """Get scheduler statistics"""
        projects = self.metadata_store.get_all()

        status_counts = {
            "pending": 0,
            "in_progress": 0,
            "completed": 0,
            "failed": 0,
            "disabled": 0
        }

        total_syncs = 0
        successful_syncs = 0
        failed_syncs = 0

        for p in projects:
            if not p.enabled:
                status_counts["disabled"] += 1
            else:
                status_counts[p.sync_status.value] += 1

            total_syncs += p.total_syncs
            successful_syncs += p.successful_syncs
            failed_syncs += p.failed_syncs

        config = get_sync_config()

        return {
            "scheduler_running": self._running,
            "total_projects": len(projects),
            "status_counts": status_counts,
            "check_interval_seconds": self.check_interval,
            "default_sync_interval_minutes": self.default_sync_interval,
            "max_retries": config["max_retries"],
            "auto_register_enabled": self.auto_register,
            "total_syncs": total_syncs,
            "successful_syncs": successful_syncs,
            "failed_syncs": failed_syncs,
            "success_rate": (successful_syncs / total_syncs * 100) if total_syncs > 0 else 0
        }


# Global scheduler instance
_scheduler: Optional[SyncScheduler] = None


def get_scheduler() -> SyncScheduler:
    """Get the global scheduler instance"""
    global _scheduler
    if _scheduler is None:
        _scheduler = SyncScheduler()
    return _scheduler


async def start_scheduler():
    """Start the global scheduler"""
    scheduler = get_scheduler()
    await scheduler.start()


async def stop_scheduler():
    """Stop the global scheduler"""
    global _scheduler
    if _scheduler:
        await _scheduler.stop()
