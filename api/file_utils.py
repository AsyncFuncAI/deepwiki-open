import requests
from urllib.parse import urlparse, quote
import base64
import logging

logger = logging.getLogger(__name__)

def get_azure_devops_file_content(repo_url: str, file_path: str, access_token: str, branch: str = "main") -> str:
    """
    Retrieves the content of a file from an Azure DevOps repository.

    Args:
        repo_url (str): The Azure DevOps repo URL (e.g., "https://dev.azure.com/org/project/_git/repo")
        file_path (str): File path within the repository (e.g., "src/main.py")
        access_token (str): Azure DevOps personal access token
        branch (str, optional): Branch name (default: "main")

    Returns:
        str: File content

    Raises:
        ValueError: If anything fails
    """
    try:
        parsed_url = urlparse(repo_url)
        if not parsed_url.scheme or not parsed_url.netloc:
            raise ValueError("Not a valid Azure DevOps repository URL")

        # Extract organization, project, and repo name
        path_parts = parsed_url.path.strip("/").split("/")
        if len(path_parts) < 4 or path_parts[2] != "_git":
            raise ValueError("Invalid Azure DevOps URL format — expected https://dev.azure.com/org/project/_git/repo")

        organization = path_parts[0]
        project = path_parts[1]
        repo = path_parts[3]

        # Build API URL
        encoded_file_path = quote(file_path, safe='')
        api_url = (
            f"https://dev.azure.com/{organization}/{project}/_apis/git/repositories/{repo}/items"
            f"?path=/{encoded_file_path}&versionDescriptor.version={branch}&includeContent=true&api-version=7.0"
        )

        # Azure DevOps uses Basic Auth with PAT as username (empty) and password (the token)
        pat_bytes = f":{access_token}".encode("utf-8")
        pat_base64 = base64.b64encode(pat_bytes).decode("utf-8")
        headers = {
            "Authorization": f"Basic {pat_base64}"
        }

        logger.info(f"Fetching file content from Azure DevOps API: {api_url}")
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()
        return response.text

    except Exception as e:
        raise ValueError(f"Failed to get file content: {str(e)}")