"""
Periodic Index Synchronization Scheduler

This module provides background scheduling for automatic index synchronization,
allowing the system to periodically check for repository changes and update
the embeddings index accordingly.
"""

import os
import json
import logging
import asyncio
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Literal
from dataclasses import dataclass, field, asdict
from enum import Enum
from threading import Lock
from pathlib import Path

def get_adalflow_default_root_path():
    """Get the default adalflow root path. Lazy import to avoid issues."""
    try:
        from adalflow.utils import get_adalflow_default_root_path as _get_path
        return _get_path()
    except ImportError:
        # Fallback if adalflow is not installed
        import os
        return os.path.expanduser(os.path.join("~", ".adalflow"))

logger = logging.getLogger(__name__)


class SyncStatus(str, Enum):
    """Status of a sync operation"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    DISABLED = "disabled"


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
            data['sync_status'] = SyncStatus(data['sync_status'])
        return cls(**data)


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
                logger.info(f"Saved sync metadata for {project_id}")
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

        for metadata in self._cache.values():
            if not metadata.enabled:
                continue

            if metadata.sync_status == SyncStatus.IN_PROGRESS:
                continue

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
            result = subprocess.run(
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

    async def sync_project(self, metadata: SyncMetadata, force: bool = False) -> Dict[str, Any]:
        """
        Synchronize a project's index.

        Args:
            metadata: The project's sync metadata
            force: If True, force re-indexing even if no changes detected

        Returns:
            Dict with sync results
        """
        from api.data_pipeline import DatabaseManager, read_all_documents, transform_documents_and_save_to_db
        from api.config import is_ollama_embedder

        project_id = f"{metadata.repo_type}_{metadata.owner}_{metadata.repo}"
        logger.info(f"Starting sync for project: {project_id}")

        # Update status to in_progress
        metadata.sync_status = SyncStatus.IN_PROGRESS
        metadata.error_message = None
        self.metadata_store.save(metadata)

        root_path = get_adalflow_default_root_path()
        repo_path = os.path.join(root_path, "repos", metadata.repo)
        db_path = os.path.join(root_path, "databases", f"{metadata.repo}.pkl")

        try:
            # Check for updates
            update_info = self.check_for_updates(metadata)

            if not force and not update_info["has_updates"]:
                logger.info(f"No updates for {project_id}, skipping sync")
                metadata.sync_status = SyncStatus.COMPLETED
                metadata.next_sync = (
                    datetime.utcnow() + timedelta(minutes=metadata.sync_interval_minutes)
                ).isoformat()
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

            self.metadata_store.save(metadata)

            logger.info(f"Sync completed for {project_id}: {len(documents)} docs, {metadata.embedding_count} embeddings")

            return {
                "success": True,
                "skipped": False,
                "document_count": len(documents),
                "embedding_count": metadata.embedding_count,
                "commit_hash": new_commit
            }

        except Exception as e:
            logger.error(f"Sync failed for {project_id}: {e}")
            metadata.sync_status = SyncStatus.FAILED
            metadata.error_message = str(e)
            metadata.next_sync = (
                datetime.utcnow() + timedelta(minutes=metadata.sync_interval_minutes)
            ).isoformat()
            self.metadata_store.save(metadata)

            return {
                "success": False,
                "error": str(e)
            }


class SyncScheduler:
    """
    Background scheduler for periodic index synchronization.

    Uses asyncio for background task management instead of APScheduler
    to minimize external dependencies.
    """

    def __init__(self, check_interval_seconds: int = 60):
        """
        Initialize the sync scheduler.

        Args:
            check_interval_seconds: How often to check for projects needing sync
        """
        self.check_interval = check_interval_seconds
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
        self._task = asyncio.create_task(self._run_scheduler())
        logger.info("Sync scheduler started")

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

    async def _run_scheduler(self):
        """Main scheduler loop"""
        while self._running:
            try:
                # Check for manual sync requests
                try:
                    while True:
                        metadata = self._manual_sync_queue.get_nowait()
                        await self.sync_manager.sync_project(metadata, force=True)
                except asyncio.QueueEmpty:
                    pass

                # Check for scheduled syncs
                projects = self.metadata_store.get_projects_needing_sync()

                for metadata in projects:
                    if not self._running:
                        break

                    try:
                        await self.sync_manager.sync_project(metadata)
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
        sync_interval_minutes: int = 60,
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
            sync_interval_minutes: How often to sync (in minutes)
            access_token: Optional access token for private repositories
            enabled: Whether sync is enabled for this project

        Returns:
            SyncMetadata for the added project
        """
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

    async def trigger_sync(self, owner: str, repo: str, repo_type: str) -> Dict[str, Any]:
        """
        Manually trigger a sync for a project.

        Returns:
            Sync result dictionary
        """
        metadata = self.metadata_store.get(owner, repo, repo_type)
        if not metadata:
            return {"success": False, "error": "Project not found"}

        return await self.sync_manager.sync_project(metadata, force=True)

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

    def check_for_updates(self, owner: str, repo: str, repo_type: str) -> Dict[str, Any]:
        """Check if a project has updates without syncing"""
        metadata = self.metadata_store.get(owner, repo, repo_type)
        if not metadata:
            return {"error": "Project not found"}

        return self.sync_manager.check_for_updates(metadata)


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
