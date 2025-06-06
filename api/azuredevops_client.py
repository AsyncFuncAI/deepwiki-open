import os
import logging
import json
import base64
import subprocess
from urllib.parse import urlparse, urlunparse, quote

# Configure logging
logger = logging.getLogger(__name__)

def get_azuredevops_file_content(repo_url: str, file_path: str, access_token: str = None) -> str:
    """
    Retrieves the content of a file from an Azure DevOps repository using the Azure DevOps REST API.

    Args:
        repo_url (str): The URL of the Azure DevOps repository 
                       (e.g., "https://dev.azure.com/organization/project/_git/repo")
        file_path (str): The path to the file within the repository (e.g., "src/main.py")
        access_token (str, optional): Personal access token for Azure DevOps

    Returns:
        str: The content of the file as a string

    Raises:
        ValueError: If the file cannot be fetched or if the URL is not a valid Azure DevOps URL
    """
    logger.info(f"Fetching file content from Azure DevOps: {repo_url}, file: {file_path}")
    
    try:
        # Extract organization, project, and repo name from Azure DevOps URL
        if not (repo_url.startswith("https://dev.azure.com/") or repo_url.startswith("http://dev.azure.com/")):
            logger.error(f"Invalid Azure DevOps URL format: {repo_url}")
            raise ValueError(f"Not a valid Azure DevOps repository URL: {repo_url}")

        # Log the original URL for debugging
        logger.info(f"Processing Azure DevOps URL: {repo_url}")
        
        # Parse the URL using urlparse to handle URL encoding properly
        parsed_url = urlparse(repo_url)
        logger.info(f"Parsed URL - scheme: {parsed_url.scheme}, netloc: {parsed_url.netloc}, path: {parsed_url.path}")
        
        path_parts = parsed_url.path.strip('/').split('/')
        logger.info(f"Path parts: {path_parts}")
        
        # Find the organization (first part of the path)
        if not path_parts or len(path_parts) < 1:
            logger.error("Organization not found in URL path parts")
            raise ValueError("Organization not found in URL")
        organization = path_parts[0]
        logger.info(f"Extracted organization: {organization}")
        
        # Find the _git part to locate the repository name
        try:
            git_index = path_parts.index('_git')
            logger.info(f"Found _git at index {git_index}")
        except ValueError:
            logger.error("Could not find '_git' in the URL path")
            raise ValueError("Could not find '_git' in the URL path")
            
        # The repository is the part after _git
        if git_index + 1 >= len(path_parts):
            logger.error("Repository name not found in URL (no part after _git)")
            raise ValueError("Repository name not found in URL")
        repository = path_parts[git_index + 1]
        logger.info(f"Extracted repository: {repository}")
        
        # The project is everything between the organization and _git
        # For projects with spaces, this will be properly encoded in the URL
        if git_index <= 1:
            logger.error("Project name not found in URL (git_index <= 1)")
            raise ValueError("Project name not found in URL")
            
        # Use the project name as it appears in the URL (might contain URL encoding)
        project = path_parts[1]
        logger.info(f"Extracted project name: {project}")
        
        # For URLs with spaces in project names, we need to preserve the URL encoding
        # Use the original parsed path to construct the API URL
        project_path = parsed_url.path.split('/_git/')[0]
        logger.info(f"Project path from URL: {project_path}")
        
        organization_path = f"/{organization}"
        logger.info(f"Organization path: {organization_path}")
        
        project_relative_path = project_path[len(organization_path):].lstrip('/')
        logger.info(f"Project relative path: {project_relative_path}")

        # Use Azure DevOps REST API to get file content
        # The API endpoint for getting file content is:
        # https://dev.azure.com/{organization}/{project}/_apis/git/repositories/{repository}/items?path={path}&api-version=7.1
        
        # Encode the file path properly for the URL
        encoded_file_path = quote(file_path)
        logger.info(f"Encoded file path: {encoded_file_path}")
        
        # Construct the API URL with detailed logging - properly handle spaces in project path
        # We need to re-encode the project_relative_path for the API URL while preserving the spaces
        # This is tricky because we need to encode spaces as %20 but not re-encode already encoded characters
        from urllib.parse import quote
        
        # First, ensure project_relative_path has spaces (not %20)
        if '%20' in project_relative_path:
            project_relative_path = project_relative_path.replace('%20', ' ')
            logger.info(f"Normalized project path: {project_relative_path}")
        
        # Then encode it properly for the URL
        encoded_project_path = quote(project_relative_path)
        logger.info(f"Encoded project path: {encoded_project_path}")
        
        # Construct the final API URL
        api_url = f"https://dev.azure.com/{organization}/{encoded_project_path}/_apis/git/repositories/{repository}/items?path={encoded_file_path}&api-version=7.1&includeContent=true"
        logger.info(f"Constructed API URL: {api_url}")
        
        # Add verbose curl output for debugging
        curl_cmd = ["curl", "-v", "-s"]
        logger.info("Using verbose curl for detailed request/response information")
        
        # Prepare curl command with authentication if token is provided
        if access_token:
            # Azure DevOps uses Basic Auth with PAT as the password and empty username
            auth_string = f":{access_token}"
            encoded_auth = base64.b64encode(auth_string.encode()).decode()
            curl_cmd.extend(["-H", f"Authorization: Basic {encoded_auth}"])
            logger.info("Added authentication header to request")
        else:
            logger.warning("No access token provided for Azure DevOps API request")
            
        curl_cmd.append(api_url)

        logger.info(f"Executing curl command to fetch file content from Azure DevOps API")
        logger.info(f"Full API URL: {api_url}")
        
        # Execute the curl command with detailed output
        result = subprocess.run(
            curl_cmd,
            check=False,  # Don't raise exception on non-zero exit code, we'll handle errors manually
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Log the curl command exit code and stderr for debugging
        logger.info(f"Curl command exit code: {result.returncode}")
        if result.stderr:
            logger.info(f"Curl stderr output: {result.stderr}")
        
        # For Azure DevOps, the API returns the raw file content directly (not base64 encoded)
        content = result.stdout
        
        # Check if we got an error response (usually in JSON format)
        if content.startswith('{'):
            try:
                error_data = json.loads(content)
                logger.info(f"Received JSON response: {json.dumps(error_data, indent=2)}")
                
                if "message" in error_data:
                    error_message = error_data['message']
                    logger.error(f"Azure DevOps API error message: {error_message}")
                    raise ValueError(f"Azure DevOps API error: {error_message}")
                    
                if "value" in error_data and isinstance(error_data["value"], dict) and "content" in error_data["value"]:
                    # This is a successful response with content in the value field
                    logger.info("Successfully retrieved file content in JSON format")
                    return error_data["value"]["content"]
            except json.JSONDecodeError as e:
                # If it's not valid JSON but starts with '{', it might still be file content
                logger.warning(f"Response starts with '{{' but is not valid JSON: {e}")
                pass
        
        # Check for empty content
        if not content.strip():
            logger.error("Received empty response from Azure DevOps API")
            raise ValueError("Received empty response from Azure DevOps API")
                
        # If we get here, assume the content is the raw file content
        logger.info(f"Successfully retrieved file content, size: {len(content)} bytes")
        return content

    except subprocess.CalledProcessError as e:
        error_msg = e.stderr
        # Sanitize error message to remove any tokens
        if access_token and access_token in error_msg:
            error_msg = error_msg.replace(access_token, "[REDACTED]")
            
        logger.error(f"Subprocess error: {e.returncode}, Error message: {error_msg}")
        raise ValueError(f"Error fetching file content from Azure DevOps: {error_msg}")
        
    except Exception as e:
        logger.error(f"Unexpected error in get_azuredevops_file_content: {str(e)}")
        raise ValueError(f"Unexpected error accessing Azure DevOps: {str(e)}")

def clone_azuredevops_repo(repo_url: str, local_path: str, access_token: str = None) -> str:
    """
    Clones an Azure DevOps repository to a local path.
    Handles repositories with spaces in project names.

    Args:
        repo_url (str): The URL of the Azure DevOps repository
        local_path (str): The local directory where the repository will be cloned
        access_token (str, optional): Personal access token for Azure DevOps

    Returns:
        str: The output message from the git command
    """
    try:
        # Check if Git is installed
        logger.info(f"Preparing to clone Azure DevOps repository to {local_path}")
        subprocess.run(
            ["git", "--version"],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        # Check if repository already exists
        if os.path.exists(local_path) and os.listdir(local_path):
            # Directory exists and is not empty
            logger.warning(f"Repository already exists at {local_path}. Using existing repository.")
            return f"Using existing repository at {local_path}"

        # Ensure the local path exists
        os.makedirs(local_path, exist_ok=True)

        # Prepare the clone URL with access token if provided
        clone_url = repo_url
        
        # Handle spaces in project names for Azure DevOps URLs
        if " " in repo_url or "%20" in repo_url:
            logger.info("Azure DevOps URL contains spaces or encoded spaces, handling specially")
            parsed = urlparse(repo_url)
            
            # Extract components
            path = parsed.path
            
            # Handle spaces in path
            if " " in path or "%20" in path:
                # Normalize path to have spaces (not %20)
                if "%20" in path:
                    path = path.replace("%20", " ")
                    
                # Then encode it properly for git
                from urllib.parse import quote
                encoded_path = quote(path)
                logger.info(f"Original path: {path}")
                logger.info(f"Encoded path for git: {encoded_path}")
                
                # Reconstruct the URL
                clone_url = f"{parsed.scheme}://{parsed.netloc}{encoded_path}"
                logger.info(f"Reconstructed URL for git: {clone_url}")
        
        # Add authentication if token is provided
        if access_token:
            parsed = urlparse(clone_url)
            # Format: https://{username}:{token}@dev.azure.com/...
            # For Azure DevOps, we use an empty username with the PAT as the password
            clone_url = urlunparse((parsed.scheme, f":{access_token}@{parsed.netloc}", parsed.path, '', '', ''))
            logger.info("Using access token for authentication")

        # Clone the repository
        logger.info(f"Cloning repository from {repo_url} to {local_path}")
        # We use repo_url in the log to avoid exposing the token in logs
        result = subprocess.run(
            ["git", "clone", clone_url, local_path],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        logger.info("Repository cloned successfully")
        return result.stdout.decode("utf-8")

    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode('utf-8')
        # Sanitize error message to remove any tokens
        if access_token and access_token in error_msg:
            error_msg = error_msg.replace(access_token, "***TOKEN***")
        raise ValueError(f"Error during cloning: {error_msg}")
    except Exception as e:
        raise ValueError(f"An unexpected error occurred: {str(e)}")
