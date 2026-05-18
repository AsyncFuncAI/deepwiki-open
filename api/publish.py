"""
Opt-in publishing helpers for the looptech-ai/understand-quickly registry.

This module is self-contained. It uses the Python stdlib only (no extra
dependencies beyond what the rest of the API already pulls in) and is
imported lazily from ``api.api`` so that an unused publish path costs
nothing at import time.

The contract is documented at:
    https://github.com/looptech-ai/understand-quickly/blob/main/docs/integrations/protocol.md

DeepWiki emits a wiki graph in the ``generic@1`` format: pages are nodes
(``kind="wiki-page"``), and each ``relatedPages`` reference becomes an
edge (``kind="related"``).
"""

from __future__ import annotations

import json
import logging
import os
import re
import subprocess
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, Mapping, Optional, Tuple
from urllib import error as urllib_error
from urllib import request as urllib_request

logger = logging.getLogger(__name__)

TOOL_NAME = "deepwiki-open"
DEFAULT_TOOL_VERSION = "1.0.0"
DISPATCH_URL = (
    "https://api.github.com/repos/looptech-ai/understand-quickly/dispatches"
)


def derive_owner_repo(remote_url: Optional[str]) -> Optional[str]:
    """
    Parse a GitHub remote URL and return ``owner/repo``.

    Handles both HTTPS (``https://github.com/owner/repo(.git)``) and SSH
    (``git@github.com:owner/repo(.git)``) shapes. Returns ``None`` for
    anything we don't recognise — callers are expected to fall back to
    an explicit ``owner_repo`` argument or no-op.
    """
    if not remote_url:
        return None
    url = remote_url.strip()
    # SSH: git@github.com:owner/repo(.git)
    m = re.match(r"git@github\.com:([^/]+)/([^/]+?)(?:\.git)?/?$", url)
    if m:
        return f"{m.group(1)}/{m.group(2)}"
    # HTTPS / git: https://github.com/owner/repo(.git)
    m = re.match(
        r"^(?:https?|git)://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$", url
    )
    if m:
        return f"{m.group(1)}/{m.group(2)}"
    return None


def git_head_sha(repo_path: Optional[str] = None) -> Optional[str]:
    """
    Return the 40-hex SHA of HEAD in ``repo_path`` (or cwd), or ``None``
    if not a git checkout / git is unavailable.
    """
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=repo_path or None,
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
    except (OSError, subprocess.SubprocessError) as exc:  # pragma: no cover
        logger.debug("git rev-parse failed: %s", exc)
        return None
    if result.returncode != 0:
        return None
    sha = result.stdout.strip()
    if re.fullmatch(r"[0-9a-f]{40}", sha):
        return sha
    return None


def build_graph_payload(
    pages: Iterable[Mapping[str, Any]],
    *,
    repo_url: Optional[str] = None,
    tool_version: str = DEFAULT_TOOL_VERSION,
    commit: Optional[str] = None,
    generated_at: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Build a ``generic@1``-shaped graph from a list of WikiPage-like dicts.

    Each page becomes a node; each ``relatedPages`` reference becomes a
    directed edge ``page -> related_page`` with ``kind="related"``. File
    paths attached to a page are surfaced under ``data.filePaths`` so
    downstream tools can map nodes back to source files.
    """
    nodes = []
    edges = []
    page_ids = set()

    pages_list = list(pages)
    for page in pages_list:
        page_ids.add(page.get("id"))

    for page in pages_list:
        page_id = page.get("id")
        if not page_id:
            continue
        node: Dict[str, Any] = {
            "id": page_id,
            "kind": "wiki-page",
            "label": page.get("title", page_id),
        }
        data: Dict[str, Any] = {}
        file_paths = page.get("filePaths") or []
        if file_paths:
            data["filePaths"] = list(file_paths)
        importance = page.get("importance")
        if importance:
            data["importance"] = importance
        if data:
            node["data"] = data
        nodes.append(node)

        for related_id in page.get("relatedPages") or []:
            # Skip dangling refs so the graph stays internally consistent.
            if related_id not in page_ids:
                continue
            edges.append(
                {
                    "source": page_id,
                    "target": related_id,
                    "kind": "related",
                }
            )

    metadata: Dict[str, Any] = {
        "tool": TOOL_NAME,
        "tool_version": tool_version,
        "generated_at": generated_at
        or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    if commit:
        metadata["commit"] = commit
    if repo_url:
        metadata["repo_url"] = repo_url

    return {"nodes": nodes, "edges": edges, "metadata": metadata}


def dispatch_sync(
    id_: str,
    token: str,
    *,
    url: str = DISPATCH_URL,
    timeout: float = 10.0,
) -> Tuple[bool, Optional[str]]:
    """
    Fire a ``repository_dispatch`` ``sync-entry`` event at the registry.

    Returns ``(ok, error_message)``. Network / HTTP errors are caught and
    surfaced as a soft failure — the caller is expected to keep going.
    """
    body = json.dumps(
        {"event_type": "sync-entry", "client_payload": {"id": id_}}
    ).encode("utf-8")
    req = urllib_request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": f"{TOOL_NAME}/{DEFAULT_TOOL_VERSION}",
        },
    )
    try:
        with urllib_request.urlopen(req, timeout=timeout) as resp:
            status = getattr(resp, "status", 0) or resp.getcode()
            if 200 <= status < 300:
                return True, None
            return False, f"unexpected status {status}"
    except urllib_error.HTTPError as exc:
        return False, f"HTTP {exc.code}: {exc.reason}"
    except urllib_error.URLError as exc:
        return False, f"network error: {exc.reason}"
    except Exception as exc:  # pragma: no cover - defensive
        return False, str(exc)


def publish(
    payload: Mapping[str, Any],
    *,
    owner_repo: Optional[str] = None,
    token: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Best-effort publish path.

    Always returns a small status dict. Never raises — callers can wire
    this in next to a normal export and trust that a failure here will
    not knock over the parent request.

    ``payload`` is the full graph dict (used here only for log lines /
    sanity). ``owner_repo`` is an explicit ``owner/repo`` to register
    against; if omitted, no dispatch is attempted.
    """
    token = token or os.environ.get("UNDERSTAND_QUICKLY_TOKEN")
    if not token:
        msg = (
            "UNDERSTAND_QUICKLY_TOKEN not set; skipping repository_dispatch. "
            "The graph was still produced — register your repo with "
            "`npx @understand-quickly/cli add` and the nightly sync will "
            "pick it up."
        )
        logger.info("[understand-quickly] %s", msg)
        return {"dispatched": False, "reason": "no-token", "message": msg}

    if not owner_repo:
        msg = (
            "owner/repo could not be determined; skipping dispatch. "
            "Pass `repo` explicitly or set the git remote."
        )
        logger.info("[understand-quickly] %s", msg)
        return {"dispatched": False, "reason": "no-owner-repo", "message": msg}

    ok, err = dispatch_sync(owner_repo, token)
    if ok:
        logger.info(
            "[understand-quickly] dispatched sync-entry for %s", owner_repo
        )
        return {"dispatched": True, "id": owner_repo}

    msg = (
        f"dispatch failed for {owner_repo}: {err}. "
        "If this repo is not yet in the registry, register it with "
        "`npx @understand-quickly/cli add` or the wizard at "
        "https://looptech-ai.github.io/understand-quickly/add.html."
    )
    logger.warning("[understand-quickly] %s", msg)
    return {
        "dispatched": False,
        "reason": "dispatch-failed",
        "id": owner_repo,
        "error": err,
        "message": msg,
    }
