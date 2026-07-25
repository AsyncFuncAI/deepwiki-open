import base64
import json
from urllib.parse import quote, urlparse

import requests
from requests.exceptions import RequestException

from api.logger import get_logger

logger = get_logger(__name__)


def _get_github_file_content(
    repo_url: str, file_path: str, access_token: str = None
) -> str:
    """
    Retrieves the content of a file from a GitHub repository using the GitHub API.
    Supports both public GitHub (github.com) and GitHub Enterprise (custom domains).

    Args:
        repo_url (str): The URL of the GitHub repository
                       (e.g., "https://github.com/username/repo" or "https://github.company.com/username/repo")
        file_path (str): The path to the file within the repository (e.g., "src/main.py")
        access_token (str, optional): GitHub personal access token for private repositories

    Returns:
        str: The content of the file as a string

    Raises:
        ValueError: If the file cannot be fetched or if the URL is not a valid GitHub URL
    """
    try:
        # Parse the repository URL to support both github.com and enterprise GitHub
        parsed_url = urlparse(repo_url)
        if not parsed_url.scheme or not parsed_url.netloc:
            raise ValueError("Not a valid GitHub repository URL")

        # Check if it's a GitHub-like URL structure
        path_parts = parsed_url.path.strip("/").split("/")
        if len(path_parts) < 2:
            raise ValueError(
                "Invalid GitHub URL format - expected format: https://domain/owner/repo"
            )

        owner = path_parts[-2]
        repo = path_parts[-1].replace(".git", "")

        # Determine the API base URL
        if parsed_url.netloc == "github.com":
            # Public GitHub
            api_base = "https://api.github.com"
        else:
            # GitHub Enterprise - API is typically at https://domain/api/v3/
            api_base = f"{parsed_url.scheme}://{parsed_url.netloc}/api/v3"

        # Use GitHub API to get file content
        # The API endpoint for getting file content is: /repos/{owner}/{repo}/contents/{path}
        api_url = f"{api_base}/repos/{owner}/{repo}/contents/{file_path}"

        # Fetch file content from GitHub API
        headers = {}
        if access_token:
            headers["Authorization"] = f"token {access_token}"
        logger.info(f"Fetching file content from GitHub API: {api_url}")
        try:
            response = requests.get(api_url, headers=headers)
            response.raise_for_status()
        except RequestException as e:
            raise ValueError(f"Error fetching file content: {e}")
        try:
            content_data = response.json()
        except json.JSONDecodeError:
            raise ValueError("Invalid response from GitHub API")

        # Check if we got an error response
        if "message" in content_data and "documentation_url" in content_data:
            raise ValueError(f"GitHub API error: {content_data['message']}")

        # GitHub API returns file content as base64 encoded string
        if "content" in content_data and "encoding" in content_data:
            if content_data["encoding"] == "base64":
                # The content might be split into lines, so join them first
                content_base64 = content_data["content"].replace("\n", "")
                content = base64.b64decode(content_base64).decode("utf-8")
                return content
            else:
                raise ValueError(f"Unexpected encoding: {content_data['encoding']}")
        else:
            raise ValueError("File content not found in GitHub API response")

    except Exception as e:
        raise ValueError(f"Failed to get file content: {str(e)}")


def _get_gitlab_file_content(
    repo_url: str, file_path: str, access_token: str = None
) -> str:
    """
    Retrieves the content of a file from a GitLab repository (cloud or self-hosted).

    Args:
        repo_url (str): The GitLab repo URL (e.g., "https://gitlab.com/username/repo" or "http://localhost/group/project")
        file_path (str): File path within the repository (e.g., "src/main.py")
        access_token (str, optional): GitLab personal access token

    Returns:
        str: File content

    Raises:
        ValueError: If anything fails
    """
    try:
        # Parse and validate the URL
        parsed_url = urlparse(repo_url)
        if not parsed_url.scheme or not parsed_url.netloc:
            raise ValueError("Not a valid GitLab repository URL")

        gitlab_domain = f"{parsed_url.scheme}://{parsed_url.netloc}"
        if parsed_url.port not in (None, 80, 443):
            gitlab_domain += f":{parsed_url.port}"
        path_parts = parsed_url.path.strip("/").split("/")
        if len(path_parts) < 2:
            raise ValueError(
                "Invalid GitLab URL format — expected something like https://gitlab.domain.com/group/project"
            )

        # Build project path and encode for API
        project_path = "/".join(path_parts).replace(".git", "")
        encoded_project_path = quote(project_path, safe="")

        # Encode file path
        encoded_file_path = quote(file_path, safe="")

        # Try to get the default branch from the project info
        default_branch = None
        try:
            project_info_url = f"{gitlab_domain}/api/v4/projects/{encoded_project_path}"
            project_headers = {}
            if access_token:
                project_headers["PRIVATE-TOKEN"] = access_token

            project_response = requests.get(project_info_url, headers=project_headers)
            if project_response.status_code == 200:
                project_data = project_response.json()
                default_branch = project_data.get("default_branch", "main")
                logger.info(f"Found default branch: {default_branch}")
            else:
                logger.warning(
                    f"Could not fetch project info, using 'main' as default branch"
                )
                default_branch = "main"
        except Exception as e:
            logger.warning(
                f"Error fetching project info: {e}, using 'main' as default branch"
            )
            default_branch = "main"

        api_url = f"{gitlab_domain}/api/v4/projects/{encoded_project_path}/repository/files/{encoded_file_path}/raw?ref={default_branch}"
        # Fetch file content from GitLab API
        headers = {}
        if access_token:
            headers["PRIVATE-TOKEN"] = access_token
        logger.info(f"Fetching file content from GitLab API: {api_url}")
        try:
            response = requests.get(api_url, headers=headers)
            response.raise_for_status()
            content = response.text
        except RequestException as e:
            raise ValueError(f"Error fetching file content: {e}")

        # Check for GitLab error response (JSON instead of raw file)
        if content.startswith("{") and '"message":' in content:
            try:
                error_data = json.loads(content)
                if "message" in error_data:
                    raise ValueError(f"GitLab API error: {error_data['message']}")
            except json.JSONDecodeError:
                pass

        return content

    except Exception as e:
        raise ValueError(f"Failed to get file content: {str(e)}")


def _get_bitbucket_file_content(
    repo_url: str, file_path: str, access_token: str = None
) -> str:
    """
    Retrieves the content of a file from a Bitbucket repository using the Bitbucket API.

    Args:
        repo_url (str): The URL of the Bitbucket repository (e.g., "https://bitbucket.org/username/repo")
        file_path (str): The path to the file within the repository (e.g., "src/main.py")
        access_token (str, optional): Bitbucket personal access token for private repositories

    Returns:
        str: The content of the file as a string
    """
    try:
        # Extract owner and repo name from Bitbucket URL
        if not (
            repo_url.startswith("https://bitbucket.org/")
            or repo_url.startswith("http://bitbucket.org/")
        ):
            raise ValueError("Not a valid Bitbucket repository URL")

        parts = repo_url.rstrip("/").split("/")
        if len(parts) < 5:
            raise ValueError("Invalid Bitbucket URL format")

        owner = parts[-2]
        repo = parts[-1].replace(".git", "")

        # Try to get the default branch from the repository info
        default_branch = None
        try:
            repo_info_url = f"https://api.bitbucket.org/2.0/repositories/{owner}/{repo}"
            repo_headers = {}
            if access_token:
                repo_headers["Authorization"] = f"Bearer {access_token}"

            repo_response = requests.get(repo_info_url, headers=repo_headers)
            if repo_response.status_code == 200:
                repo_data = repo_response.json()
                default_branch = repo_data.get("mainbranch", {}).get("name", "main")
                logger.info(f"Found default branch: {default_branch}")
            else:
                logger.warning(
                    f"Could not fetch repository info, using 'main' as default branch"
                )
                default_branch = "main"
        except Exception as e:
            logger.warning(
                f"Error fetching repository info: {e}, using 'main' as default branch"
            )
            default_branch = "main"

        # Use Bitbucket API to get file content
        # The API endpoint for getting file content is: /2.0/repositories/{owner}/{repo}/src/{branch}/{path}
        api_url = f"https://api.bitbucket.org/2.0/repositories/{owner}/{repo}/src/{default_branch}/{file_path}"

        # Fetch file content from Bitbucket API
        headers = {}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        logger.info(f"Fetching file content from Bitbucket API: {api_url}")
        try:
            response = requests.get(api_url, headers=headers)
            if response.status_code == 200:
                content = response.text
            elif response.status_code == 404:
                raise ValueError(
                    "File not found on Bitbucket. Please check the file path and repository."
                )
            elif response.status_code == 401:
                raise ValueError(
                    "Unauthorized access to Bitbucket. Please check your access token."
                )
            elif response.status_code == 403:
                raise ValueError(
                    "Forbidden access to Bitbucket. You might not have permission to access this file."
                )
            elif response.status_code == 500:
                raise ValueError(
                    "Internal server error on Bitbucket. Please try again later."
                )
            else:
                response.raise_for_status()
                content = response.text
            return content
        except RequestException as e:
            raise ValueError(f"Error fetching file content: {e}")

    except Exception as e:
        raise ValueError(f"Failed to get file content: {str(e)}")


def get_repo_content(
    repo_url: str, file_path: str, repo_type: str = None, access_token: str = None
) -> str:
    """
    Retrieves the content of a file from a Git repository (GitHub or GitLab).

    Args:
        repo_type (str): Type of repository
        repo_url (str): The URL of the repository
        file_path (str): The path to the file within the repository
        access_token (str, optional): Access token for private repositories

    Returns:
        str: The content of the file as a string

    Raises:
        ValueError: If the file cannot be fetched or if the URL is not valid
    """
    if repo_type == "github":
        return _get_github_file_content(repo_url, file_path, access_token)
    elif repo_type == "gitlab":
        return _get_gitlab_file_content(repo_url, file_path, access_token)
    elif repo_type == "bitbucket":
        return _get_bitbucket_file_content(repo_url, file_path, access_token)
    else:
        raise ValueError(
            "Unsupported repository type. Only GitHub, GitLab, and Bitbucket are supported."
        )
