import adalflow as adal
from adalflow.core.types import Document, List
from adalflow.components.data_process import TextSplitter, ToEmbeddings
import os
import subprocess
import json
import tiktoken
import logging
import base64
import re
import glob
import xattr
from adalflow.utils import get_adalflow_default_root_path
from adalflow.core.db import LocalDB
from api.config import configs, DEFAULT_EXCLUDED_DIRS, DEFAULT_EXCLUDED_FILES
from api.ollama_patch import OllamaDocumentProcessor
from urllib.parse import urlparse, urlunparse, quote
import hashlib
from typing import Dict, Any
import requests
from requests.exceptions import RequestException

from api.tools.embedder import get_embedder

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_file_attributes(file_path: str) -> Dict[str, Any]:
    """
    Extracts extended file attributes (xattr) from a local file.
    
    Args:
        file_path (str): Path to the file to extract attributes from
        
    Returns:
        Dict[str, Any]: Dictionary of attribute names and their values
    """
    attributes = {}
    try:
        # Get list of all attribute names for the file
        attr_names = xattr.listxattr(file_path)
        
        # For each attribute, get its value and add to the dictionary
        for attr_name in attr_names:
            try:
                # Get the attribute value
                attr_value = xattr.getxattr(file_path, attr_name)
                
                # Try to decode as UTF-8 string if possible
                try:
                    attr_value = attr_value.decode('utf-8')
                except (UnicodeDecodeError, AttributeError):
                    # If not decodable as UTF-8, use as is
                    pass
                    
                # Add to attributes dictionary
                attributes[attr_name] = attr_value
            except (OSError, IOError) as e:
                logger.warning(f"Error reading attribute {attr_name} from {file_path}: {e}")
                
        logger.debug(f"Extracted {len(attributes)} attributes from {file_path}")
    except (OSError, IOError) as e:
        logger.warning(f"Error listing attributes for {file_path}: {e}")
        
    return attributes

# No need for a separate get_repo_structure function
# We're using the existing get_local_repo_structure function in api.py

# Maximum token limit for OpenAI embedding models
MAX_EMBEDDING_TOKENS = 8192

def count_tokens(text: str, is_ollama_embedder: bool = None) -> int:
    """
    Count the number of tokens in a text string using tiktoken.

    Args:
        text (str): The text to count tokens for.
        is_ollama_embedder (bool, optional): Whether using Ollama embeddings.
                                           If None, will be determined from configuration.

    Returns:
        int: The number of tokens in the text.
    """
    try:
        # Determine if using Ollama embedder if not specified
        if is_ollama_embedder is None:
            from api.config import is_ollama_embedder as check_ollama
            is_ollama_embedder = check_ollama()

        if is_ollama_embedder:
            encoding = tiktoken.get_encoding("cl100k_base")
        else:
            encoding = tiktoken.encoding_for_model("text-embedding-3-small")

        return len(encoding.encode(text))
    except Exception as e:
        # Fallback to a simple approximation if tiktoken fails
        logger.warning(f"Error counting tokens with tiktoken: {e}")
        # Rough approximation: 4 characters per token
        return len(text) // 4

def download_repo(repo_url: str, type: str = "github", access_token: str = None) -> str:
    """
    Downloads a repository to a local directory.

    Args:
        repo_url (str): URL of the repository to download
        type (str): Type of repository (github, gitlab, bitbucket, azure)
        access_token (str, optional): Personal access token for private repositories

    Returns:
        str: Path to the local directory containing the repository
    """
    try:
        # Log the repository URL and type for debugging
        logger.info(f"Downloading repository from {repo_url} of type {type}")
        
        # Create a unique directory name based on the repo URL
        repo_hash = hashlib.md5(repo_url.encode()).hexdigest()
        local_path = os.path.join(get_adalflow_default_root_path(), "repos", repo_hash)
        logger.info(f"Generated local path: {local_path} (hash: {repo_hash})")

        # Check if the repository already exists locally
        if os.path.exists(local_path):
            logger.info(f"Repository already exists at {local_path}")
            return local_path

        # Create the directory if it doesn't exist
        os.makedirs(local_path, exist_ok=True)
        logger.info(f"Created directory for repository at {local_path}")

        # Prepare the clone URL with access token if provided
        clone_url = repo_url
        if access_token:
            parsed = urlparse(repo_url)
            # Determine the repository type and format the URL accordingly
            if type == "github":
                # Format: https://{token}@github.com/owner/repo.git
                clone_url = urlunparse((parsed.scheme, f"{access_token}@{parsed.netloc}", parsed.path, '', '', ''))
            elif type == "gitlab":
                # Format: https://oauth2:{token}@gitlab.com/owner/repo.git
                clone_url = urlunparse((parsed.scheme, f"oauth2:{access_token}@{parsed.netloc}", parsed.path, '', '', ''))
            elif type == "bitbucket":
                # Format: https://{token}@bitbucket.org/owner/repo.git
                clone_url = urlunparse((parsed.scheme, f"{access_token}@{parsed.netloc}", parsed.path, '', '', ''))
            elif type == "azure":
                # Format for Azure DevOps: https://organization@dev.azure.com/organization/project/_git/repo.git
                # For Azure DevOps, we need to ensure the URL is in the correct format for git clone
                # Extract the organization name from the path
                path_parts = parsed.path.strip('/').split('/')
                organization = path_parts[0] if path_parts else ""
                
                # The path should end with .git
                path = parsed.path
                
                # Use the organization name as the username with the PAT as password
                clone_url = urlunparse((parsed.scheme, f"{organization}:{access_token}@{parsed.netloc}", path, '', '', ''))
                
                # Log the URL format (without exposing the token)
                sanitized_url = urlunparse((parsed.scheme, f"{organization}:***TOKEN***@{parsed.netloc}", path, '', '', ''))
                logger.info(f"Azure DevOps clone URL format (sanitized): {sanitized_url}")
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
        # Return the local path instead of the command output
        return local_path

    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode('utf-8')
        # Sanitize error message to remove any tokens
        if access_token and access_token in error_msg:
            error_msg = error_msg.replace(access_token, "***TOKEN***")
        raise ValueError(f"Error during cloning: {error_msg}")
    except Exception as e:
        raise ValueError(f"An unexpected error occurred: {str(e)}")

# Alias for backward compatibility
download_github_repo = download_repo

def read_all_documents(path: str, is_ollama_embedder: bool = None, excluded_dirs: List[str] = None, excluded_files: List[str] = None,
                      included_dirs: List[str] = None, included_files: List[str] = None):
    """
    Recursively reads all documents in a directory and its subdirectories.

    Args:
        path (str): The root directory path.
        is_ollama_embedder (bool, optional): Whether using Ollama embeddings for token counting.
                                           If None, will be determined from configuration.
        excluded_dirs (List[str], optional): List of directories to exclude from processing.
            Overrides the default configuration if provided.
        excluded_files (List[str], optional): List of file patterns to exclude from processing.
            Overrides the default configuration if provided.
        included_dirs (List[str], optional): List of directories to include exclusively.
            When provided, only files in these directories will be processed.
        included_files (List[str], optional): List of file patterns to include exclusively.
            When provided, only files matching these patterns will be processed.

    Returns:
        list: A list of Document objects with metadata.
    """
    documents = []
    # File extensions to look for, prioritizing code files
    code_extensions = [".py", ".js", ".ts", ".java", ".cpp", ".c", ".h", ".hpp", ".go", ".rs",
                       ".jsx", ".tsx", ".html", ".css", ".php", ".swift", ".cs"]
    doc_extensions = [".md", ".txt", ".rst", ".json", ".yaml", ".yml"]

    # Determine filtering mode: inclusion or exclusion
    use_inclusion_mode = (included_dirs is not None and len(included_dirs) > 0) or (included_files is not None and len(included_files) > 0)

    if use_inclusion_mode:
        # Inclusion mode: only process specified directories and files
        final_included_dirs = set(included_dirs) if included_dirs else set()
        final_included_files = set(included_files) if included_files else set()

        logger.info(f"Using inclusion mode")
        logger.info(f"Included directories: {list(final_included_dirs)}")
        logger.info(f"Included files: {list(final_included_files)}")

        # Convert to lists for processing
        included_dirs = list(final_included_dirs)
        included_files = list(final_included_files)
        excluded_dirs = []
        excluded_files = []
    else:
        # Exclusion mode: use default exclusions plus any additional ones
        final_excluded_dirs = set(DEFAULT_EXCLUDED_DIRS)
        final_excluded_files = set(DEFAULT_EXCLUDED_FILES)

        # Add any additional excluded directories from config
        if "file_filters" in configs and "excluded_dirs" in configs["file_filters"]:
            final_excluded_dirs.update(configs["file_filters"]["excluded_dirs"])

        # Add any additional excluded files from config
        if "file_filters" in configs and "excluded_files" in configs["file_filters"]:
            final_excluded_files.update(configs["file_filters"]["excluded_files"])

        # Add any explicitly provided excluded directories and files
        if excluded_dirs is not None:
            final_excluded_dirs.update(excluded_dirs)

        if excluded_files is not None:
            final_excluded_files.update(excluded_files)

        # Convert back to lists for compatibility
        excluded_dirs = list(final_excluded_dirs)
        excluded_files = list(final_excluded_files)
        included_dirs = []
        included_files = []

        logger.info(f"Using exclusion mode")
        logger.info(f"Excluded directories: {excluded_dirs}")
        logger.info(f"Excluded files: {excluded_files}")

    logger.info(f"Reading documents from {path}")

    def should_process_file(file_path: str, use_inclusion: bool, included_dirs: List[str], included_files: List[str],
                           excluded_dirs: List[str], excluded_files: List[str]) -> bool:
        """
        Determine if a file should be processed based on inclusion/exclusion rules.

        Args:
            file_path (str): The file path to check
            use_inclusion (bool): Whether to use inclusion mode
            included_dirs (List[str]): List of directories to include
            included_files (List[str]): List of files to include
            excluded_dirs (List[str]): List of directories to exclude
            excluded_files (List[str]): List of files to exclude

        Returns:
            bool: True if the file should be processed, False otherwise
        """
        file_path_parts = os.path.normpath(file_path).split(os.sep)
        file_name = os.path.basename(file_path)

        if use_inclusion:
            # Inclusion mode: file must be in included directories or match included files
            is_included = False

            # Check if file is in an included directory
            if included_dirs:
                for included in included_dirs:
                    clean_included = included.strip("./").rstrip("/")
                    if clean_included in file_path_parts:
                        is_included = True
                        break

            # Check if file matches included file patterns
            if not is_included and included_files:
                for included_file in included_files:
                    if file_name == included_file or file_name.endswith(included_file):
                        is_included = True
                        break

            # If no inclusion rules are specified for a category, allow all files from that category
            if not included_dirs and not included_files:
                is_included = True
            elif not included_dirs and included_files:
                # Only file patterns specified, allow all directories
                pass  # is_included is already set based on file patterns
            elif included_dirs and not included_files:
                # Only directory patterns specified, allow all files in included directories
                pass  # is_included is already set based on directory patterns

            return is_included
        else:
            # Exclusion mode: file must not be in excluded directories or match excluded files
            is_excluded = False

            # Check if file is in an excluded directory
            for excluded in excluded_dirs:
                clean_excluded = excluded.strip("./").rstrip("/")
                if clean_excluded in file_path_parts:
                    is_excluded = True
                    break

            # Check if file matches excluded file patterns
            if not is_excluded:
                for excluded_file in excluded_files:
                    if file_name == excluded_file:
                        is_excluded = True
                        break

            return not is_excluded

    # Process code files first
    for ext in code_extensions:
        files = glob.glob(f"{path}/**/*{ext}", recursive=True)
        for file_path in files:
            # Check if file should be processed based on inclusion/exclusion rules
            if not should_process_file(file_path, use_inclusion_mode, included_dirs, included_files, excluded_dirs, excluded_files):
                continue

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    relative_path = os.path.relpath(file_path, path)

                    # Determine if this is an implementation file
                    is_implementation = (
                        not relative_path.startswith("test_")
                        and not relative_path.startswith("app_")
                        and "test" not in relative_path.lower()
                    )

                    # Check token count
                    token_count = count_tokens(content, is_ollama_embedder)
                    if token_count > MAX_EMBEDDING_TOKENS * 10:
                        logger.warning(f"Skipping large file {relative_path}: Token count ({token_count}) exceeds limit")
                        continue
                        
                    # Extract file attributes
                    file_attrs = get_file_attributes(file_path)
                    
                    # Prepare metadata
                    metadata = {
                        "file_path": relative_path,
                        "type": ext[1:],
                        "is_code": True,
                        "is_implementation": is_implementation,
                        "title": relative_path,
                        "token_count": token_count,
                    }
                    
                    # Add file attributes to metadata
                    if file_attrs:
                        metadata["file_attributes"] = file_attrs
                        logger.info(f"Added {len(file_attrs)} file attributes to {relative_path}")

                    doc = Document(
                        text=content,
                        meta_data=metadata,
                    )
                    documents.append(doc)
            except Exception as e:
                logger.error(f"Error reading {file_path}: {e}")

    # Then process documentation files
    for ext in doc_extensions:
        files = glob.glob(f"{path}/**/*{ext}", recursive=True)
        for file_path in files:
            # Check if file should be processed based on inclusion/exclusion rules
            if not should_process_file(file_path, use_inclusion_mode, included_dirs, included_files, excluded_dirs, excluded_files):
                continue

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    relative_path = os.path.relpath(file_path, path)

                    # Check token count
                    token_count = count_tokens(content, is_ollama_embedder)
                    if token_count > MAX_EMBEDDING_TOKENS:
                        logger.warning(f"Skipping large file {relative_path}: Token count ({token_count}) exceeds limit")
                        continue
                        
                    # Extract file attributes
                    file_attrs = get_file_attributes(file_path)
                    
                    # Prepare metadata
                    metadata = {
                        "file_path": relative_path,
                        "type": ext[1:],
                        "is_code": False,
                        "is_implementation": False,
                        "title": relative_path,
                        "token_count": token_count,
                    }
                    
                    # Add file attributes to metadata
                    if file_attrs:
                        metadata["file_attributes"] = file_attrs
                        logger.info(f"Added {len(file_attrs)} file attributes to {relative_path}")

                    doc = Document(
                        text=content,
                        meta_data=metadata,
                    )
                    documents.append(doc)
            except Exception as e:
                logger.error(f"Error reading {file_path}: {e}")

    logger.info(f"Found {len(documents)} documents")
    return documents

def prepare_data_pipeline(is_ollama_embedder: bool = None):
    """
    Creates and returns the data transformation pipeline.

    Args:
        is_ollama_embedder (bool, optional): Whether to use Ollama for embedding.
                                           If None, will be determined from configuration.

    Returns:
        adal.Sequential: The data transformation pipeline
    """
    from api.config import get_embedder_config, is_ollama_embedder as check_ollama

    # Determine if using Ollama embedder if not specified
    if is_ollama_embedder is None:
        is_ollama_embedder = check_ollama()

    splitter = TextSplitter(**configs["text_splitter"])
    embedder_config = get_embedder_config()

    embedder = get_embedder()

    if is_ollama_embedder:
        # Use Ollama document processor for single-document processing
        embedder_transformer = OllamaDocumentProcessor(embedder=embedder)
    else:
        # Use batch processing for other embedders
        batch_size = embedder_config.get("batch_size", 500)
        embedder_transformer = ToEmbeddings(
            embedder=embedder, batch_size=batch_size
        )

    data_transformer = adal.Sequential(
        splitter, embedder_transformer
    )  # sequential will chain together splitter and embedder
    return data_transformer

def transform_documents_and_save_to_db(
    documents: List[Document], db_path: str, is_ollama_embedder: bool = None
) -> LocalDB:
    """
    Transforms a list of documents and saves them to a local database.

    Args:
        documents (list): A list of `Document` objects.
        db_path (str): The path to the local database file.
        is_ollama_embedder (bool, optional): Whether to use Ollama for embedding.
                                           If None, will be determined from configuration.
    """
    # Get the data transformer
    data_transformer = prepare_data_pipeline(is_ollama_embedder)

    # Save the documents to a local database
    db = LocalDB()
    db.register_transformer(transformer=data_transformer, key="split_and_embed")
    db.load(documents)
    db.transform(key="split_and_embed")
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    db.save_state(filepath=db_path)
    return db

def get_github_file_content(repo_url: str, file_path: str, access_token: str = None) -> str:
    """
    Retrieves the content of a file from a GitHub repository using the GitHub API.

    Args:
        repo_url (str): The URL of the GitHub repository (e.g., "https://github.com/username/repo")
        file_path (str): The path to the file within the repository (e.g., "src/main.py")
        access_token (str, optional): GitHub personal access token for private repositories

    Returns:
        str: The content of the file as a string

    Raises:
        ValueError: If the file cannot be fetched or if the URL is not a valid GitHub URL
    """
    try:
        # Extract owner and repo name from GitHub URL
        if not (repo_url.startswith("https://github.com/") or repo_url.startswith("http://github.com/")):
            raise ValueError("Not a valid GitHub repository URL")

        parts = repo_url.rstrip('/').split('/')
        if len(parts) < 5:
            raise ValueError("Invalid GitHub URL format")

        owner = parts[-2]
        repo = parts[-1].replace(".git", "")

        # Use GitHub API to get file content
        # The API endpoint for getting file content is: /repos/{owner}/{repo}/contents/{path}
        api_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{file_path}"

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

def get_gitlab_file_content(repo_url: str, file_path: str, access_token: str = None) -> str:
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
            raise ValueError("Invalid GitLab URL format — expected something like https://gitlab.domain.com/group/project")

        # Build project path and encode for API
        project_path = "/".join(path_parts).replace(".git", "")
        encoded_project_path = quote(project_path, safe='')

        # Encode file path
        encoded_file_path = quote(file_path, safe='')

        # Default to 'main' branch if not specified
        default_branch = 'main'

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

def get_bitbucket_file_content(repo_url: str, file_path: str, access_token: str = None) -> str:
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
        if not (repo_url.startswith("https://bitbucket.org/") or repo_url.startswith("http://bitbucket.org/")):
            raise ValueError("Not a valid Bitbucket repository URL")

        parts = repo_url.rstrip('/').split('/')
        if len(parts) < 5:
            raise ValueError("Invalid Bitbucket URL format")

        owner = parts[-2]
        repo = parts[-1].replace(".git", "")

        # Use Bitbucket API to get file content
        # The API endpoint for getting file content is: /2.0/repositories/{owner}/{repo}/src/{branch}/{path}
        api_url = f"https://api.bitbucket.org/2.0/repositories/{owner}/{repo}/src/main/{file_path}"

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
                raise ValueError("File not found on Bitbucket. Please check the file path and repository.")
            elif response.status_code == 401:
                raise ValueError("Unauthorized access to Bitbucket. Please check your access token.")
            elif response.status_code == 403:
                raise ValueError("Forbidden access to Bitbucket. You might not have permission to access this file.")
            elif response.status_code == 500:
                raise ValueError("Internal server error on Bitbucket. Please try again later.")
            else:
                response.raise_for_status()
                content = response.text
            return content
        except RequestException as e:
            raise ValueError(f"Error fetching file content: {e}")

    except Exception as e:
        raise ValueError(f"Failed to get file content: {str(e)}")


def get_file_content(repo_url: str, file_path: str, type: str = "github", access_token: str = None):
    """
    Retrieves the content of a file from a Git repository (GitHub, GitLab, Bitbucket, or Azure DevOps).

    Args:
        repo_url (str): The URL of the repository
        file_path (str): The path to the file within the repository
        type (str): The type of repository (github, gitlab, bitbucket, azure)
        access_token (str, optional): Access token for private repositories

    Returns:
        str: The content of the file as a string

    Raises:
        ValueError: If the file cannot be fetched or if the URL is not valid
    """
    try:
        if type == "github":
            return get_github_file_content(repo_url, file_path, access_token)
        elif type == "gitlab":
            return get_gitlab_file_content(repo_url, file_path, access_token)
        elif type == "bitbucket":
            return get_bitbucket_file_content(repo_url, file_path, access_token)
        elif type == "azure":
            from api.azuredevops_client import get_azuredevops_file_content
            # For Azure DevOps, we need to decode the URL since it might contain encoded spaces
            decoded_repo_url = repo_url
            logger.info(f"Original Azure DevOps URL: {repo_url}")
            
            try:
                # If the URL is already decoded, this won't change it
                # If it's encoded (like with %20 for spaces), this will decode it
                from urllib.parse import unquote
                
                # Check if the URL is double-encoded (contains %25 which is the encoded form of %)
                if "%25" in repo_url:
                    # First decode to convert %25 to %
                    temp_url = unquote(repo_url)
                    logger.info(f"First decode step: {temp_url}")
                    
                    # Then decode again to convert % encoded characters
                    decoded_repo_url = unquote(temp_url)
                    logger.info(f"Double-decoded Azure DevOps URL: {decoded_repo_url}")
                else:
                    decoded_repo_url = unquote(repo_url)
                    logger.info(f"Decoded Azure DevOps URL: {decoded_repo_url}")
                
                # Ensure the URL contains dev.azure.com
                if "dev.azure.com" not in decoded_repo_url:
                    logger.error(f"URL does not appear to be an Azure DevOps URL: {decoded_repo_url}")
                    raise ValueError(f"Invalid Azure DevOps URL: {decoded_repo_url}")
                    
                # Verify the URL format is correct for Azure DevOps
                if "_git" not in decoded_repo_url:
                    logger.error(f"Azure DevOps URL missing '_git' segment: {decoded_repo_url}")
                    raise ValueError(f"Invalid Azure DevOps URL format, missing '_git' segment: {decoded_repo_url}")
            except Exception as e:
                logger.error(f"Failed to process Azure DevOps URL: {str(e)}")
                raise ValueError(f"Failed to process Azure DevOps URL: {str(e)}")
            
            logger.info(f"Processing Azure DevOps repository with URL: {decoded_repo_url}")
            logger.info(f"Fetching file: {file_path} from Azure DevOps repository")
            return get_azuredevops_file_content(decoded_repo_url, file_path, access_token)
        else:
            raise ValueError(f"Unsupported repository type: {type}")
    except Exception as e:
        raise ValueError(f"Error getting file content: {str(e)}")


class DatabaseManager:
    """
    Manages the creation, loading, transformation, and persistence of LocalDB instances.
    """

    def __init__(self):
        self.db = None
        self.repo_url_or_path = None
        self.repo_paths = None

    def prepare_database(self, repo_url_or_path: str, type: str = "github", access_token: str = None, is_ollama_embedder: bool = None,
                       excluded_dirs: List[str] = None, excluded_files: List[str] = None,
                       included_dirs: List[str] = None, included_files: List[str] = None) -> List[Document]:
        """
        Create a new database from the repository.

        Args:
            repo_url_or_path (str): The URL or local path of the repository
            access_token (str, optional): Access token for private repositories
            is_ollama_embedder (bool, optional): Whether to use Ollama for embedding.
                                               If None, will be determined from configuration.
            excluded_dirs (List[str], optional): List of directories to exclude from processing
            excluded_files (List[str], optional): List of file patterns to exclude from processing
            included_dirs (List[str], optional): List of directories to include exclusively
            included_files (List[str], optional): List of file patterns to include exclusively

        Returns:
            List[Document]: List of Document objects
        """
        self.reset_database()
        self._create_repo(repo_url_or_path, type, access_token)
        return self.prepare_db_index(is_ollama_embedder=is_ollama_embedder, excluded_dirs=excluded_dirs, excluded_files=excluded_files,
                                   included_dirs=included_dirs, included_files=included_files)

    def reset_database(self):
        """
        Reset the database to its initial state.
        """
        self.db = None
        self.repo_url_or_path = None
        self.repo_paths = None

    def _extract_repo_name_from_url(self, repo_url_or_path: str, repo_type: str) -> str:
        # Extract owner and repo name to create unique identifier
        url_parts = repo_url_or_path.rstrip('/').split('/')

        if repo_type in ["github", "gitlab", "bitbucket"] and len(url_parts) >= 5:
            # GitHub URL format: https://github.com/owner/repo
            # GitLab URL format: https://gitlab.com/owner/repo or https://gitlab.com/group/subgroup/repo
            # Bitbucket URL format: https://bitbucket.org/owner/repo
            owner = url_parts[-2]
            repo = url_parts[-1].replace(".git", "")
            repo_name = f"{owner}_{repo}"
        else:
            repo_name = url_parts[-1].replace(".git", "")
        return repo_name

    def _create_repo(self, repo_url_or_path: str, repo_type: str = "github", access_token: str = None) -> None:
        """
        Download and prepare all paths.
        Paths:
        ~/.adalflow/repos/{owner}_{repo_name} (for url, local path will be the same)
        ~/.adalflow/databases/{owner}_{repo_name}.pkl

        Args:
            repo_url_or_path (str): The URL or local path of the repository
            access_token (str, optional): Access token for private repositories
        """
        logger.info(f"Preparing repo storage for {repo_url_or_path}...")

        try:
            root_path = get_adalflow_default_root_path()

            os.makedirs(root_path, exist_ok=True)
            # url
            if repo_url_or_path.startswith("https://") or repo_url_or_path.startswith("http://"):
                # Extract repo name based on the URL format
                if type == "github":
                    # GitHub URL format: https://github.com/owner/repo
                    repo_name = repo_url_or_path.split("/")[-1].replace(".git", "")
                elif type == "gitlab":
                    # GitLab URL format: https://gitlab.com/owner/repo or https://gitlab.com/group/subgroup/repo
                    # Use the last part of the URL as the repo name
                    repo_name = repo_url_or_path.split("/")[-1].replace(".git", "")
                elif type == "bitbucket":
                    # Bitbucket URL format: https://bitbucket.org/owner/repo
                    repo_name = repo_url_or_path.split("/")[-1].replace(".git", "")
                elif type == "azure":
                    # Azure DevOps URL format: https://dev.azure.com/organization/project/_git/repo
                    # Find the part after _git/ in the URL
                    if "_git/" in repo_url_or_path:
                        repo_name = repo_url_or_path.split("_git/")[-1].replace(".git", "")
                    else:
                        # Fallback to the last part of the URL
                        repo_name = repo_url_or_path.split("/")[-1].replace(".git", "")
                else:
                    # Generic handling for other Git URLs
                    repo_name = repo_url_or_path.split("/")[-1].replace(".git", "")

                save_repo_dir = os.path.join(root_path, "repos", repo_name)

                # Check if the repository directory already exists and is not empty
                if not (os.path.exists(save_repo_dir) and os.listdir(save_repo_dir)):
                    # Only download if the repository doesn't exist or is empty
                    try:
                        # Use the download_repo function to get a local path
                        repo_path = download_repo(repo_url_or_path, type, access_token)
                        
                        # If the repo_path is different from save_repo_dir, copy the contents
                        if repo_path != save_repo_dir and os.path.exists(repo_path):
                            import shutil
                            # Create save_repo_dir if it doesn't exist
                            os.makedirs(save_repo_dir, exist_ok=True)
                            
                            # Copy contents from repo_path to save_repo_dir
                            for item in os.listdir(repo_path):
                                src = os.path.join(repo_path, item)
                                dst = os.path.join(save_repo_dir, item)
                                if os.path.isdir(src):
                                    shutil.copytree(src, dst, dirs_exist_ok=True)
                                else:
                                    shutil.copy2(src, dst)
                            logger.info(f"Copied repository from {repo_path} to {save_repo_dir}")
                    except Exception as e:
                        logger.error(f"Error downloading repository: {str(e)}")
                        raise ValueError(f"Failed to download repository: {str(e)}")
                else:
                    logger.info(f"Repository already exists at {save_repo_dir}. Using existing repository.")
            else:  # local path
                repo_name = os.path.basename(repo_url_or_path)
                save_repo_dir = repo_url_or_path

            save_db_file = os.path.join(root_path, "databases", f"{repo_name}.pkl")
            os.makedirs(save_repo_dir, exist_ok=True)
            os.makedirs(os.path.dirname(save_db_file), exist_ok=True)

            self.repo_paths = {
                "save_repo_dir": save_repo_dir,
                "save_db_file": save_db_file,
            }
            self.repo_url_or_path = repo_url_or_path
            logger.info(f"Repo paths: {self.repo_paths}")

        except Exception as e:
            logger.error(f"Failed to create repository structure: {e}")
            raise

    def prepare_db_index(self, is_ollama_embedder: bool = None, excluded_dirs: List[str] = None, excluded_files: List[str] = None,
                        included_dirs: List[str] = None, included_files: List[str] = None) -> List[Document]:
        """
        Prepare the indexed database for the repository.

        Args:
            is_ollama_embedder (bool, optional): Whether to use Ollama for embedding.
                                               If None, will be determined from configuration.
            excluded_dirs (List[str], optional): List of directories to exclude from processing
            excluded_files (List[str], optional): List of file patterns to exclude from processing
            included_dirs (List[str], optional): List of directories to include exclusively
            included_files (List[str], optional): List of file patterns to include exclusively

        Returns:
            List[Document]: List of Document objects
        """
        # check the database
        if self.repo_paths and os.path.exists(self.repo_paths["save_db_file"]):
            logger.info("Loading existing database...")
            try:
                self.db = LocalDB.load_state(self.repo_paths["save_db_file"])
                documents = self.db.get_transformed_data(key="split_and_embed")
                if documents:
                    logger.info(f"Loaded {len(documents)} documents from existing database")
                    return documents
            except Exception as e:
                logger.error(f"Error loading existing database: {e}")
                # Continue to create a new database

        # prepare the database
        logger.info("Creating new database...")
        documents = read_all_documents(
            self.repo_paths["save_repo_dir"],
            is_ollama_embedder=is_ollama_embedder,
            excluded_dirs=excluded_dirs,
            excluded_files=excluded_files,
            included_dirs=included_dirs,
            included_files=included_files
        )
        self.db = transform_documents_and_save_to_db(
            documents, self.repo_paths["save_db_file"], is_ollama_embedder=is_ollama_embedder
        )
        logger.info(f"Total documents: {len(documents)}")
        transformed_docs = self.db.get_transformed_data(key="split_and_embed")
        logger.info(f"Total transformed documents: {len(transformed_docs)}")
        return transformed_docs

    def prepare_retriever(self, repo_url_or_path: str, type: str = "github", access_token: str = None):
        """
        Prepare the retriever for a repository.
        This is a compatibility method for the isolated API.

        Args:
            repo_url_or_path (str): The URL or local path of the repository
            access_token (str, optional): Access token for private repositories

        Returns:
            List[Document]: List of Document objects
        """
        return self.prepare_database(repo_url_or_path, type, access_token)
