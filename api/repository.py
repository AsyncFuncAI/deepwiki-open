import os
import subprocess
from urllib.parse import quote, urlparse, urlunparse

from api.logger import get_logger
from api.utils import deepwiki_root

logger = get_logger(__name__)


CLONE_REPO_ROOT = os.path.join(deepwiki_root(), "repo")


def download_repo(
    repo_url: str, local_path: str, repo_type: str = None, access_token: str = None
) -> str:
    """
    Downloads a Git repository (GitHub, GitLab, or Bitbucket) to a specified local path.

    Args:
        repo_type(str): Type of repository
        repo_url (str): The URL of the Git repository to clone.
        local_path (str): The local directory where the repository will be cloned.
        access_token (str, optional): Access token for private repositories.

    Returns:
        str: The output message from the `git` command.
    """
    try:
        # Check if Git is installed
        logger.info(f"Preparing to clone repository to {local_path}")
        subprocess.run(
            ["git", "--version"],
            check=True,
            capture_output=True,
        )

        # Check if repository already exists
        if os.path.exists(local_path) and os.listdir(local_path):
            # Directory exists and is not empty
            logger.warning(
                f"Repository already exists at {local_path}. Using existing repository."
            )
            return f"Using existing repository at {local_path}"

        # Ensure the local path exists
        os.makedirs(local_path, exist_ok=True)

        # Prepare the clone URL with access token if provided
        clone_url = repo_url
        if access_token:
            parsed = urlparse(repo_url)
            # URL-encode the token to handle special characters
            encoded_token = quote(access_token, safe="")
            # Determine the repository type and format the URL accordingly
            if repo_type == "github":
                # Format: https://{token}@{domain}/owner/repo.git
                # Works for both github.com and enterprise GitHub domains
                clone_url = urlunparse(
                    (
                        parsed.scheme,
                        f"{encoded_token}@{parsed.netloc}",
                        parsed.path,
                        "",
                        "",
                        "",
                    )
                )
            elif repo_type == "gitlab":
                # Format: https://oauth2:{token}@gitlab.com/owner/repo.git
                clone_url = urlunparse(
                    (
                        parsed.scheme,
                        f"oauth2:{encoded_token}@{parsed.netloc}",
                        parsed.path,
                        "",
                        "",
                        "",
                    )
                )
            elif repo_type == "bitbucket":
                # Bitbucket has two token formats with different auth schemes:
                #   - HTTP access tokens (prefix "ATCTT") use x-bitbucket-api-token-auth
                #   - App passwords (deprecated, EOL June 2026) use x-token-auth
                # Detect by token prefix so existing app password users keep working.
                if access_token.startswith("ATCTT"):
                    auth_scheme = "x-bitbucket-api-token-auth"
                else:
                    auth_scheme = "x-token-auth"
                # Format: https://{auth_scheme}:{token}@bitbucket.org/owner/repo.git
                clone_url = urlunparse(
                    (
                        parsed.scheme,
                        f"{auth_scheme}:{encoded_token}@{parsed.netloc}",
                        parsed.path,
                        "",
                        "",
                        "",
                    )
                )

            logger.info("Using access token for authentication")

        # Clone the repository
        logger.info(f"Cloning repository from {repo_url} to {local_path}")
        # We use repo_url in the log to avoid exposing the token in logs
        result = subprocess.run(
            ["git", "clone", "--depth=1", "--single-branch", clone_url, local_path],
            check=True,
            capture_output=True,
        )

        logger.info("Repository cloned successfully")
        return result.stdout.decode("utf-8")

    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode("utf-8")
        # Sanitize error message to remove any tokens (both raw and URL-encoded)
        if access_token:
            # Remove raw token
            error_msg = error_msg.replace(access_token, "***TOKEN***")
            # Also remove URL-encoded token to prevent leaking encoded version
            encoded_token = quote(access_token, safe="")
            error_msg = error_msg.replace(encoded_token, "***TOKEN***")
        raise ValueError(f"Error during cloning: {error_msg}")
    except Exception as e:
        raise ValueError(f"An unexpected error occurred: {str(e)}")


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
                repo_name = f"{owner}_{repo}"
            else:
                repo_name = url_parts[-1].replace(".git", "")
        else:
            # This is a local repository
            repo_name = os.path.basename(repo_url)
        return repo_name

    def download(self, force: bool = False) -> None:
        if force or (not self.downloaded and not self.is_local):
            os.makedirs(self.save_path, exist_ok=True)
            download_repo(
                self.repo_url, self.save_path, self.repo_type, self.access_token
            )

    @property
    def save_path(self) -> str:
        if self.is_local:
            return self.repo_url
        return os.path.join(self.root_path, self.name)

    @property
    def downloaded(self) -> bool:
        return os.path.exists(self.save_path) and bool(os.listdir(self.save_path))
