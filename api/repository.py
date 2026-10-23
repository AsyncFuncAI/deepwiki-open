import hashlib
import ipaddress
import os
import socket
import subprocess
from functools import wraps
from collections.abc import Callable
from urllib.parse import quote, urlparse, urlunparse

from git import Repo as GitRepo, GIT_OK, GitCommandError

from api.logger import get_logger
from api.utils import deepwiki_root

logger = get_logger(__name__)


CLONE_REPO_ROOT = os.path.join(deepwiki_root(), "repo")


def _allowed_local_roots() -> list[str]:
    """Base directories under which a caller-supplied local repository path
    is permitted.

    Defaults to the deepwiki data/clone root. Operators who legitimately
    keep local repositories elsewhere can add roots via
    DEEPWIKI_ALLOWED_LOCAL_ROOTS (os.pathsep-separated). This is the
    allowlist for every consumer of Repo.save_path (file reads, structure
    listing, and RAG indexing), which must not be able to reach arbitrary
    paths on the server's filesystem.
    """
    roots = [deepwiki_root()]
    extra = os.environ.get("DEEPWIKI_ALLOWED_LOCAL_ROOTS", "")
    roots.extend(p for p in extra.split(os.pathsep) if p.strip())
    return [os.path.realpath(r) for r in roots]


def _resolve_allowed_local_path(path: str) -> str:
    """Resolve *path* and return it only if it stays within an allowed root.

    Raises ValueError otherwise, blocking absolute paths outside the
    allowlist as well as `..`/symlink traversal out of it.
    """
    resolved = os.path.realpath(path)
    for root in _allowed_local_roots():
        if resolved == root or resolved.startswith(root + os.sep):
            return resolved
    raise ValueError(
        "Local repository path is not within an allowed root. Set "
        "DEEPWIKI_ALLOWED_LOCAL_ROOTS to permit additional locations."
    )


def _exception_cleanup(func: Callable) -> Callable:
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except (subprocess.CalledProcessError, GitCommandError) as e:
            err_msg: str | bytes = e.stderr
            if isinstance(err_msg, bytes):
                err_msg = err_msg.decode("utf-8")
            token = kwargs.get("access_token", None)
            if token:
                token_mask = "***TOKEN***"
                err_msg = err_msg.replace(token, token_mask)
                encoded_token = quote(token, safe="")
                err_msg = err_msg.replace(encoded_token, token_mask)
            raise ValueError(err_msg)

    return wrapper


@_exception_cleanup
def _clone_from_gitlab(
    remote_url: str,
    local_path: str,
    *,
    access_token: str | None = None,
    **kwargs,
) -> GitRepo:
    if access_token:
        parsed = urlparse(remote_url)
        access_token = quote(access_token, safe="")

        remote_url = urlunparse(
            (
                parsed.scheme,
                f"oauth2:{access_token}@{parsed.netloc}",
                parsed.path,
                "",
                "",
                "",
            )
        )
    return GitRepo.clone_from(url=remote_url, to_path=local_path, **kwargs)


@_exception_cleanup
def _clone_from_github(
    remote_url: str,
    local_path: str,
    *,
    access_token: str | None = None,
    **kwargs,
) -> GitRepo:
    if access_token:
        parsed = urlparse(remote_url)

        remote_url = urlunparse(
            (
                parsed.scheme,
                f"{access_token}@{parsed.netloc}",
                parsed.path,
                "",
                "",
                "",
            )
        )
    return GitRepo.clone_from(url=remote_url, to_path=local_path, **kwargs)


@_exception_cleanup
def _clone_from_bitbucket(
    remote_url: str,
    local_path: str,
    *,
    access_token: str | None = None,
    **kwargs,
) -> GitRepo:
    if access_token:
        parsed = urlparse(remote_url)
        # Bitbucket has two token formats with different auth schemes:
        #   - HTTP access tokens (prefix "ATCTT") use x-bitbucket-api-token-auth
        #   - App passwords (deprecated, EOL June 2026) use x-token-auth
        # Detect by token prefix so existing app password users keep working.
        auth_scheme = (
            "x-bitbucket-api-token-auth"
            if access_token.startswith("ATCTT")
            else "x-token-auth"
        )
        access_token = quote(access_token, safe="")

        remote_url = urlunparse(
            (
                parsed.scheme,
                f"{auth_scheme}:{access_token}@{parsed.netloc}",
                parsed.path,
                "",
                "",
                "",
            )
        )
    return GitRepo.clone_from(url=remote_url, to_path=local_path, **kwargs)


def _assert_safe_remote_host(repo_url: str) -> None:
    """Reject a remote repository URL whose host resolves to a private,
    loopback, link-local, or otherwise reserved address.

    `_path_is_url` only checks the scheme; it does not constrain the host,
    so a caller could point the server-side `git clone` at an internal
    service (cloud metadata endpoint, internal admin panel, etc.) labeled
    as a GitHub/GitLab/Bitbucket URL. This is the server's own outbound
    connection, so it must not be allowed to reach internal network space.
    """
    host = urlparse(repo_url).hostname
    if not host:
        raise ValueError("Repository URL has no host")
    try:
        addrinfo = socket.getaddrinfo(host, None)
    except socket.gaierror as e:
        raise ValueError(f"Could not resolve repository host: {host}") from e
    for family, _, _, _, sockaddr in addrinfo:
        ip = ipaddress.ip_address(sockaddr[0])
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            raise ValueError(
                f"Repository host '{host}' resolves to a disallowed address: {ip}"
            )


def _path_is_url(path: str) -> bool:
    """Check if the given path is a URL, or local path string.

    Parameters
    ----------
    path: str
        The path to be checked

    Returns
    -------
    bool. True if is a URL, False otherwise
    """
    try:
        result = urlparse(path)
        return result.scheme in {"http", "https", "ftp"} and bool(result.netloc)
    except Exception:
        return False


class Repo:
    def __init__(
        self,
        repo_url: str,
        repo_type: str | None,
        root_path: str = CLONE_REPO_ROOT,
        access_token: str | None = None,
    ):
        """

        Parameters
        ----------
        repo_url
        repo_type
        root_path
        access_token : str, optional
            The access token to use when cloning repository from a private git service.
        """
        self.repo_url = repo_url
        self.repo_type = repo_type

        os.makedirs(root_path, exist_ok=True)
        self.root_path = root_path
        self.access_token = access_token

    @property
    def name(self):
        return self._extract_repo_name(self.repo_url, repo_type=self.repo_type)

    @property
    def is_local(self) -> bool:
        return not _path_is_url(self.repo_url)

    @staticmethod
    def _extract_repo_name(repo_url: str, repo_type: str | None) -> str:
        if _path_is_url(repo_url):
            url_parts = repo_url.rstrip("/").split("/")
            if repo_type in ["github", "gitlab", "bitbucket"] and len(url_parts) >= 5:
                # GitHub URL format: https://github.com/owner/repo
                # GitLab URL format: https://gitlab.com/owner/repo or https://gitlab.com/group/subgroup/repo
                # Bitbucket URL format: https://bitbucket.org/owner/repo
                owner = url_parts[-2]
                repo = url_parts[-1].replace(".git", "")
                human_prefix = f"{owner}_{repo}"
            else:
                human_prefix = url_parts[-1].replace(".git", "")

            # The owner/repo suffix alone drops the host and any subgroup
            # path segments beyond the last two, so two different
            # repositories (different host, or a GitLab subgroup path that
            # happens to share its last two segments with another repo)
            # could otherwise collide on the same clone directory and
            # embedding index. Append a digest of the full canonical
            # identity (type + host + full path) to make that practically
            # impossible, while keeping the prefix human-readable.
            parsed = urlparse(repo_url)
            canonical_path = parsed.path.rstrip("/")
            if canonical_path.endswith(".git"):
                canonical_path = canonical_path[: -len(".git")]
            identity = f"{repo_type}://{parsed.netloc}{canonical_path}"
            digest = hashlib.sha256(identity.encode("utf-8")).hexdigest()[:10]
            repo_name = f"{human_prefix}_{digest}"
        else:
            # This is a local repository
            repo_name = os.path.basename(repo_url)
        return repo_name

    def download(self, force: bool = False) -> None:
        if force or (not self.downloaded and not self.is_local):
            _assert_safe_remote_host(self.repo_url)
            os.makedirs(self.save_path, exist_ok=True)

            if not GIT_OK:
                raise RuntimeError("Missing `git` in current environment")

            kwargs = {
                "remote_url": self.repo_url,
                "local_path": self.save_path,
                "access_token": self.access_token,
                "multi_options": ["--depth=1", "--single-branch"],
            }

            if self.repo_type == "github":
                _clone_from_github(**kwargs)

            elif self.repo_type == "gitlab":
                _clone_from_gitlab(**kwargs)

            elif self.repo_type == "bitbucket":
                _clone_from_bitbucket(**kwargs)
            else:
                raise NotImplementedError(f"Unknown repo type: {self.repo_type}")

            logger.info("Repository %s cloned successfully", self.name)

    @property
    def save_path(self) -> str:
        if self.is_local:
            return _resolve_allowed_local_path(self.repo_url)
        return os.path.join(self.root_path, self.name)

    @property
    def downloaded(self) -> bool:
        return os.path.exists(self.save_path) and bool(os.listdir(self.save_path))

    def __repr__(self) -> str:
        return f"{self.repo_type}: {self.name}"
