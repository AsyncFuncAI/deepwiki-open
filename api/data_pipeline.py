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
from adalflow.utils import get_adalflow_default_root_path
from adalflow.core.db import LocalDB
from api.config import configs, DEFAULT_EXCLUDED_DIRS, DEFAULT_EXCLUDED_FILES
from api.ollama_patch import OllamaDocumentProcessor
from urllib.parse import urlparse, urlunparse, quote

# Configure logging
logger = logging.getLogger(__name__)

# MAX_EMBEDDING_TOKENS: Defines the maximum number of tokens supported by the
# primary embedding models (e.g., OpenAI's text-embedding-3-small).
# This is used to skip overly large documents that might cause errors or
# excessive processing time during embedding.
MAX_EMBEDDING_TOKENS = 8192

def count_tokens(text: str, local_ollama: bool = False) -> int:
    """
    Counts the number of tokens in a given text string using `tiktoken`.

    Selects the appropriate `tiktoken` encoding based on whether local Ollama
    embeddings are being used ("cl100k_base") or a default OpenAI model like
    "text-embedding-3-small". Falls back to a simple character-based
    approximation if `tiktoken` fails.

    Args:
        text (str): The input text string for which tokens need to be counted.
        local_ollama (bool, optional): If True, uses "cl100k_base" encoding
            suitable for many Ollama models. Otherwise, uses encoding for
            "text-embedding-3-small". Defaults to False.

    Returns:
        int: The estimated number of tokens in the text.
    """
    try:
        if local_ollama:
            encoding = tiktoken.get_encoding("cl100k_base")
        else:
            encoding = tiktoken.encoding_for_model("text-embedding-3-small")

        return len(encoding.encode(text))
    except Exception as e:
        # Fallback to a simple approximation if tiktoken fails
        logger.warning(f"Error counting tokens with tiktoken: {e}")
        # Rough approximation: 4 characters per token
        return len(text) // 4

def download_repo(repo_url: str, local_path: str, type: str = "github", access_token: Optional[str] = None) -> str:
    """
    Downloads a Git repository to a specified local path using `git clone`.

    Supports GitHub, GitLab, and Bitbucket repository types for constructing
    authenticated clone URLs if an access token is provided. If the target
    directory already exists and is not empty, it skips cloning and uses the
    existing repository.

    Args:
        repo_url (str): The URL of the Git repository to clone.
        local_path (str): The local directory where the repository will be cloned.
                          This directory will be created if it doesn't exist.
        type (str, optional): The type of the Git repository provider.
                              Supported values: "github", "gitlab", "bitbucket".
                              Defaults to "github". This affects how the access
                              token is embedded in the clone URL.
        access_token (Optional[str], optional): An access token for cloning
                                                private repositories. Defaults to None.

    Returns:
        str: A message indicating the outcome, either success (including path to
             existing repo) or the standard output from the `git clone` command.

    Raises:
        ValueError: If `git clone` fails (e.g., authentication error, repo not found),
                    or if an unexpected error occurs during the process. The error
                    message from git stderr is included, with tokens sanitized.
    """
    try:
        # Check if Git is installed
        logger.info(f"Preparing to clone repository to {local_path}")
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

# Alias for backward compatibility for any external callers if they used the old name.
download_github_repo = download_repo

def read_all_documents(
    path: str,
    local_ollama: bool = False,
    excluded_dirs: Optional[List[str]] = None,
    excluded_files: Optional[List[str]] = None
) -> List[Document]:
    """
    Recursively reads all relevant documents from a specified directory path.

    It prioritizes code files (e.g., .py, .js) then documentation files (.md, .txt).
    Files and directories can be excluded based on provided lists, which supplement
    globally configured exclusions (DEFAULT_EXCLUDED_DIRS, DEFAULT_EXCLUDED_FILES,
    and exclusions from `api.config.configs`). Documents are skipped if their
    token count exceeds a certain threshold (MAX_EMBEDDING_TOKENS * 10 for code,
    MAX_EMBEDDING_TOKENS for docs).

    Args:
        path (str): The root directory from which to read documents.
        local_ollama (bool, optional): Flag to indicate if local Ollama token counting
                                       should be used. Defaults to False.
        excluded_dirs (Optional[List[str]], optional): A list of directory names to
                                                       explicitly exclude. These are added
                                                       to default and config exclusions.
                                                       Defaults to None.
        excluded_files (Optional[List[str]], optional): A list of file names/patterns
                                                        to explicitly exclude. These are
                                                        added to default and config
                                                        exclusions. Defaults to None.

    Returns:
        List[Document]: A list of `adalflow.core.types.Document` objects, each
                        containing the text content and metadata (file_path, type,
                        is_code, is_implementation, title, token_count).
    """
    documents: List[Document] = []
    # File extensions to look for, prioritizing code files
    code_extensions = [".py", ".js", ".ts", ".java", ".cpp", ".c", ".go", ".rs",
                       ".jsx", ".tsx", ".html", ".css", ".php", ".swift", ".cs"]
    doc_extensions = [".md", ".txt", ".rst", ".json", ".yaml", ".yml"]

    # Always start with default excluded directories and files
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

    logger.info(f"Using excluded directories: {excluded_dirs}")
    logger.info(f"Using excluded files: {excluded_files}")

    logger.info(f"Reading documents from {path}")

    # Process code files first
    for ext in code_extensions:
        files = glob.glob(f"{path}/**/*{ext}", recursive=True)
        for file_path in files:
            # Skip excluded directories and files
            is_excluded = False
            # Check if file is in an excluded directory
            file_path_parts = os.path.normpath(file_path).split(os.sep)
            for excluded in excluded_dirs:
                # Remove ./ prefix and trailing slash if present
                clean_excluded = excluded.strip("./").rstrip("/")
                # Check if the excluded directory is in the path components
                if clean_excluded in file_path_parts:
                    is_excluded = True
                    break
            if not is_excluded and any(os.path.basename(file_path) == excluded for excluded in excluded_files):
                is_excluded = True
            if is_excluded:
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
                    token_count = count_tokens(content, local_ollama)
                    if token_count > MAX_EMBEDDING_TOKENS * 10:
                        logger.warning(f"Skipping large file {relative_path}: Token count ({token_count}) exceeds limit")
                        continue

                    doc = Document(
                        text=content,
                        meta_data={
                            "file_path": relative_path,
                            "type": ext[1:],
                            "is_code": True,
                            "is_implementation": is_implementation,
                            "title": relative_path,
                            "token_count": token_count,
                        },
                    )
                    documents.append(doc)
            except Exception as e:
                logger.error(f"Error reading {file_path}: {e}")

    # Then process documentation files
    for ext in doc_extensions:
        files = glob.glob(f"{path}/**/*{ext}", recursive=True)
        for file_path in files:
            # Skip excluded directories and files
            is_excluded = False
            # Check if file is in an excluded directory
            file_path_parts = os.path.normpath(file_path).split(os.sep)
            for excluded in excluded_dirs:
                # Remove ./ prefix and trailing slash if present
                clean_excluded = excluded.strip("./").rstrip("/")
                # Check if the excluded directory is in the path components
                if clean_excluded in file_path_parts:
                    is_excluded = True
                    break
            if not is_excluded and any(os.path.basename(file_path) == excluded for excluded in excluded_files):
                is_excluded = True
            if is_excluded:
                continue

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    relative_path = os.path.relpath(file_path, path)

                    # Check token count
                    token_count = count_tokens(content, local_ollama)
                    if token_count > MAX_EMBEDDING_TOKENS:
                        logger.warning(f"Skipping large file {relative_path}: Token count ({token_count}) exceeds limit")
                        continue

                    doc = Document(
                        text=content,
                        meta_data={
                            "file_path": relative_path,
                            "type": ext[1:],
                            "is_code": False,
                            "is_implementation": False,
                            "title": relative_path,
                            "token_count": token_count,
                        },
                    )
                    documents.append(doc)
            except Exception as e:
                logger.error(f"Error reading {file_path}: {e}")

    logger.info(f"Found {len(documents)} documents")
    return documents

def prepare_data_pipeline(local_ollama: bool = False):
    """
    Creates and configures the data transformation pipeline for processing documents.

    The pipeline consists of:
    1. A `TextSplitter` to break down documents into smaller chunks, configured
       via `api.config.configs["text_splitter"]`.
    2. An embedding component:
        - If `local_ollama` is True, it uses an `OllamaDocumentProcessor` with an
          `adal.Embedder` configured for Ollama (from `configs["embedder_ollama"]`).
        - Otherwise, it uses `adalflow.components.data_process.ToEmbeddings` with an
          `adal.Embedder` configured for a remote service like OpenAI
          (from `configs["embedder"]`).

    Args:
        local_ollama (bool, optional): If True, configures the pipeline to use
                                       Ollama for embeddings. Defaults to False.

    Returns:
        adal.Sequential: An Adalflow sequential pipeline object ready to process
                         a list of `Document` objects.
    """
    splitter = TextSplitter(**configs["text_splitter"])

    if local_ollama:
        # Use Ollama embedder
        embedder = adal.Embedder(
            model_client=configs["embedder_ollama"]["model_client"](),
            model_kwargs=configs["embedder_ollama"]["model_kwargs"],
        )
        embedder_transformer = OllamaDocumentProcessor(embedder=embedder)
    else:
        # Use OpenAI embedder
        embedder = adal.Embedder(
            model_client=configs["embedder"]["model_client"](),
            model_kwargs=configs["embedder"]["model_kwargs"],
        )
        embedder_transformer = ToEmbeddings(
            embedder=embedder, batch_size=configs["embedder"]["batch_size"]
        )

    data_transformer = adal.Sequential(
        splitter, embedder_transformer
    )  # sequential will chain together splitter and embedder
    return data_transformer

def transform_documents_and_save_to_db(
    documents: List[Document], db_path: str, local_ollama: bool = False
) -> LocalDB:
    """
    Transforms a list of documents using a data pipeline and saves them to a local DB.

    The process involves:
    1. Preparing a data transformation pipeline (text splitting and embedding)
       using `prepare_data_pipeline`.
    2. Initializing a `LocalDB` instance.
    3. Registering the transformer with the database.
    4. Loading the raw documents into the database.
    5. Applying the transformation.
    6. Saving the state of the database (including transformed documents) to the
       specified `db_path`.

    Args:
        documents (List[Document]): A list of `adalflow.core.types.Document` objects
                                    to be processed and saved.
        db_path (str): The file path where the local database state will be saved.
                       The directory for this path will be created if it doesn't exist.
        local_ollama (bool, optional): Flag passed to `prepare_data_pipeline` to
                                       determine the embedding model type.
                                       Defaults to False.

    Returns:
        LocalDB: The `LocalDB` instance containing the transformed and saved documents.
    """
    # Get the data transformer
    data_transformer = prepare_data_pipeline(local_ollama)

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
    Retrieves the content of a specific file from a GitHub repository via the GitHub API.

    This function constructs the appropriate GitHub API URL, makes a request using
    `curl` (potentially with an access token for authentication), and then parses
    the JSON response to extract and decode the Base64 encoded file content.

    Args:
        repo_url (str): The full URL of the GitHub repository (e.g.,
                        "https://github.com/username/repo").
        file_path (str): The path to the file within the repository
                         (e.g., "src/main.py").
        access_token (Optional[str], optional): A GitHub personal access token for
                                                accessing private repositories.
                                                Defaults to None.

    Returns:
        str: The decoded content of the file as a string.

    Raises:
        ValueError: If the provided `repo_url` is invalid, if the GitHub API
                    returns an error (e.g., file not found, authentication issue),
                    if the API response is not in the expected format, or if any
                    other error occurs during the process (e.g., `curl` command failure).
                    Access tokens in error messages from subprocesses are sanitized.
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

        # Prepare curl command with authentication if token is provided
        curl_cmd = ["curl", "-s"]
        if access_token:
            curl_cmd.extend(["-H", f"Authorization: token {access_token}"])
        curl_cmd.append(api_url)

        logger.info(f"Fetching file content from GitHub API: {api_url}")
        result = subprocess.run(
            curl_cmd,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        content_data = json.loads(result.stdout.decode("utf-8"))

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

    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode('utf-8')
        # Sanitize error message to remove any tokens
        if access_token and access_token in error_msg:
            error_msg = error_msg.replace(access_token, "***TOKEN***")
        raise ValueError(f"Error fetching file content: {error_msg}")
    except json.JSONDecodeError:
        raise ValueError("Invalid response from GitHub API")
    except Exception as e:
        raise ValueError(f"Failed to get file content: {str(e)}")

def get_gitlab_file_content(repo_url: str, file_path: str, access_token: str = None) -> str:
    """
    Retrieves the content of a file from a GitLab repository using the GitLab API.

    This function handles both cloud-hosted (gitlab.com) and self-hosted GitLab
    instances. It constructs the API URL for fetching raw file content,
    makes a request using `curl` (authenticating with an access token if provided),
    and returns the decoded file content.

    Args:
        repo_url (str): The URL of the GitLab repository (e.g.,
                        "https://gitlab.com/username/repo" or
                        "http://your.gitlab.instance/group/project").
        file_path (str): The path to the file within the repository (e.g., "src/main.py").
        access_token (Optional[str], optional): A GitLab personal access, project,
                                                or group access token with `read_api`
                                                scope. Defaults to None.

    Returns:
        str: The decoded content of the file as a string.

    Raises:
        ValueError: If the `repo_url` is invalid, the GitLab API returns an error
                    (e.g., file not found, authentication issue), or if any other
                    error occurs (e.g., `curl` command failure). Access tokens in
                    error messages are sanitized.
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
        curl_cmd = ["curl", "-s"]
        if access_token:
            curl_cmd.extend(["-H", f"PRIVATE-TOKEN: {access_token}"])
        curl_cmd.append(api_url)

        logger.info(f"Fetching file content from GitLab API: {api_url}")
        result = subprocess.run(
            curl_cmd,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        content = result.stdout.decode("utf-8")

        # Check for GitLab error response (JSON instead of raw file)
        if content.startswith("{") and '"message":' in content:
            try:
                error_data = json.loads(content)
                if "message" in error_data:
                    raise ValueError(f"GitLab API error: {error_data['message']}")
            except json.JSONDecodeError:
                # If it's not valid JSON, it's probably the file content
                pass

        return content

    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode('utf-8')
        # Sanitize error message to remove any tokens
        if access_token and access_token in error_msg:
            error_msg = error_msg.replace(access_token, "***TOKEN***")
        raise ValueError(f"Error fetching file content: {error_msg}")
    except Exception as e:
        raise ValueError(f"Failed to get file content: {str(e)}")

def get_bitbucket_file_content(repo_url: str, file_path: str, access_token: str = None) -> str:
    """
    Retrieves the content of a file from a Bitbucket repository via the Bitbucket API.

    Constructs the Bitbucket API URL for accessing raw file content at a specific
    branch (defaults to 'main'), executes a `curl` command (with Bearer token
    authentication if an access token is provided), and returns the file content.

    Args:
        repo_url (str): The URL of the Bitbucket repository (e.g.,
                        "https://bitbucket.org/username/repo").
        file_path (str): The path to the file within the repository (e.g., "src/main.py").
        access_token (Optional[str], optional): A Bitbucket personal access token or
                                                an app password with repository read
                                                permissions. Defaults to None.

    Returns:
        str: The decoded content of the file as a string.

    Raises:
        ValueError: If the `repo_url` is invalid, the Bitbucket API returns an HTTP error
                    (404 for not found, 401/403 for auth/permission issues, 500 for
                    server error), or if any other exception occurs (e.g., `curl` failure).
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

        # Prepare curl command with authentication if token is provided
        curl_cmd = ["curl", "-s"]
        if access_token:
            curl_cmd.extend(["-H", f"Authorization: Bearer {access_token}"])
        curl_cmd.append(api_url)

        logger.info(f"Fetching file content from Bitbucket API: {api_url}")
        result = subprocess.run(
            curl_cmd,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        # Bitbucket API returns the raw file content directly
        content = result.stdout.decode("utf-8")
        return content

    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode('utf-8')
        if e.returncode == 22:  # curl uses 22 to indicate an HTTP error occurred
            if "HTTP/1.1 404" in error_msg:
                raise ValueError("File not found on Bitbucket. Please check the file path and repository.")
            elif "HTTP/1.1 401" in error_msg:
                raise ValueError("Unauthorized access to Bitbucket. Please check your access token.")
            elif "HTTP/1.1 403" in error_msg:
                raise ValueError("Forbidden access to Bitbucket. You might not have permission to access this file.")
            elif "HTTP/1.1 500" in error_msg:
                raise ValueError("Internal server error on Bitbucket. Please try again later.")
            else:
                raise ValueError(f"Error fetching file content: {error_msg}")
    except Exception as e:
        raise ValueError(f"Failed to get file content: {str(e)}")


def get_file_content(repo_url: str, file_path: str, type: str = "github", access_token: str = None) -> str:
    """
    Retrieves the content of a file from a Git repository, dispatching to the
    appropriate provider-specific function (GitHub, GitLab, Bitbucket).

    Args:
        repo_url (str): The URL of the repository.
        file_path (str): The path to the file within the repository.
        type (str, optional): The type of the repository provider. Supported values:
                              "github", "gitlab", "bitbucket". Defaults to "github".
        access_token (Optional[str], optional): An access token for authenticating
                                                with the repository provider's API.
                                                Defaults to None.

    Returns:
        str: The content of the specified file as a string.

    Raises:
        ValueError: If the specified `type` is not supported, or if any errors
                    occur during the call to the provider-specific content
                    retrieval function (e.g., invalid URL, file not found,
                    authentication failure).
    """
    if type == "github":
        return get_github_file_content(repo_url, file_path, access_token)
    elif type == "gitlab":
        return get_gitlab_file_content(repo_url, file_path, access_token)
    elif type == "bitbucket":
        return get_bitbucket_file_content(repo_url, file_path, access_token)
    else:
        raise ValueError("Unsupported repository URL. Only GitHub and GitLab are supported.")

class DatabaseManager:
    """
    Manages the lifecycle of document databases for code repositories.

    This class handles the creation of local storage paths, downloading/locating
    repository code, processing documents within the repository, and managing
    the Adalflow `LocalDB` instance for storing and retrieving transformed
    (split and embedded) documents.

    Attributes:
        db (Optional[LocalDB]): The Adalflow local database instance. Initialized
                                to None.
        repo_url_or_path (Optional[str]): The URL or local file system path of the
                                          repository being managed. Initialized to None.
        repo_paths (Optional[Dict[str, str]]): A dictionary storing key paths related
                                               to the repository, such as where its
                                               code is stored (`save_repo_dir`) and
                                               where its database is persisted
                                               (`save_db_file`). Initialized to None.
    """

    def __init__(self):
        """Initializes a DatabaseManager with no active database or repository."""
        self.db: Optional[LocalDB] = None
        self.repo_url_or_path: Optional[str] = None
        self.repo_paths: Optional[Dict[str, str]] = None

    def prepare_database(
        self,
        repo_url_or_path: str,
        type: str = "github",
        access_token: Optional[str] = None,
        local_ollama: bool = False,
        excluded_dirs: Optional[List[str]] = None,
        excluded_files: Optional[List[str]] = None
    ) -> List[Document]:
        """
        Prepares a complete document database for a specified repository.

        This is a high-level method that orchestrates:
        1. Resetting any existing database state within the manager.
        2. Setting up the local directory structure for the repository's code
           and its database file (via `_create_repo`). This includes downloading
           the repository if it's remote and not already present.
        3. Preparing the database index (via `prepare_db_index`), which involves
           reading documents, transforming them (splitting and embedding), and
           saving them to a local persistent store.

        Args:
            repo_url_or_path (str): The URL (e.g., GitHub, GitLab) or local file
                                    system path of the repository.
            type (str, optional): The type of the repository if `repo_url_or_path`
                                  is a URL (e.g., "github", "gitlab", "bitbucket").
                                  Defaults to "github".
            access_token (Optional[str], optional): Access token for private remote
                                                    repositories. Defaults to None.
            local_ollama (bool, optional): If True, configures underlying processes
                                           to use Ollama for embeddings.
                                           Defaults to False.
            excluded_dirs (Optional[List[str]], optional): List of directory names
                                                           to exclude during document
                                                           processing.
            excluded_files (Optional[List[str]], optional): List of file name patterns
                                                            to exclude during document
                                                            processing.

        Returns:
            List[Document]: A list of transformed (split and embedded) documents
                            from the prepared database.
        """
        self.reset_database()
        self._create_repo(repo_url_or_path, type, access_token)
        return self.prepare_db_index(
            local_ollama=local_ollama,
            excluded_dirs=excluded_dirs,
            excluded_files=excluded_files
        )

    def reset_database(self):
        """
        Resets the internal state of the DatabaseManager.

        Sets `db`, `repo_url_or_path`, and `repo_paths` attributes to `None`,
        effectively clearing any loaded repository or database information.
        """
        self.db = None
        self.repo_url_or_path = None
        self.repo_paths = None

    def _create_repo(self, repo_url_or_path: str, type: str = "github", access_token: Optional[str] = None) -> None:
        """
        Sets up local directories for repository code and its database file.

        If `repo_url_or_path` is a URL, it determines the repository name, creates
        a directory structure like `~/.adalflow/repos/{repo_name}` for code and
        `~/.adalflow/databases/{repo_name}.pkl` for the database, and downloads
        the repository if it's not already present. If it's a local path, it uses
        that path for code and derives a database path.

        Args:
            repo_url_or_path (str): URL or local path of the repository.
            type (str, optional): Type of repository if URL (e.g., "github").
                                  Defaults to "github".
            access_token (Optional[str], optional): Access token for private remote
                                                    repositories. Defaults to None.

        Raises:
            Exception: If any error occurs during directory creation or repository
                       downloading.
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
                else:
                    # Generic handling for other Git URLs
                    repo_name = repo_url_or_path.split("/")[-1].replace(".git", "")

                save_repo_dir = os.path.join(root_path, "repos", repo_name)

                # Check if the repository directory already exists and is not empty
                if not (os.path.exists(save_repo_dir) and os.listdir(save_repo_dir)):
                    # Only download if the repository doesn't exist or is empty
                    download_repo(repo_url_or_path, save_repo_dir, type, access_token)
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

    def prepare_db_index(
        self,
        local_ollama: bool = False,
        excluded_dirs: Optional[List[str]] = None,
        excluded_files: Optional[List[str]] = None
    ) -> List[Document]:
        """
        Prepares or loads the indexed document database for the current repository.

        It first checks if a persisted database file exists at the path specified
        in `self.repo_paths["save_db_file"]`. If found, it attempts to load this
        database and its transformed documents.
        If the database doesn't exist or loading fails, it proceeds to:
        1. Read all documents from the repository's source code directory
           (using `read_all_documents`), applying specified exclusions.
        2. Transform these documents (splitting and embedding) and save the resulting
           database to the persistent file path (using
           `transform_documents_and_save_to_db`).

        Args:
            local_ollama (bool, optional): Flag indicating whether to use Ollama for
                                           embeddings. Passed to underlying functions.
                                           Defaults to False.
            excluded_dirs (Optional[List[str]], optional): List of directory names
                                                           to exclude. Passed to
                                                           `read_all_documents`.
            excluded_files (Optional[List[str]], optional): List of file patterns
                                                            to exclude. Passed to
                                                            `read_all_documents`.

        Returns:
            List[Document]: A list of the transformed (split and embedded)
                            `adalflow.core.types.Document` objects from the
                            database.
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
            local_ollama=local_ollama,
            excluded_dirs=excluded_dirs,
            excluded_files=excluded_files
        )
        self.db = transform_documents_and_save_to_db(
            documents, self.repo_paths["save_db_file"], local_ollama=local_ollama
        )
        logger.info(f"Total documents: {len(documents)}")
        transformed_docs = self.db.get_transformed_data(key="split_and_embed")
        logger.info(f"Total transformed documents: {len(transformed_docs)}")
        return transformed_docs

    def prepare_retriever(self, repo_url_or_path: str, type: str = "github", access_token: Optional[str] = None) -> List[Document]:
        """
        Prepares the database for a repository, primarily for retriever setup.

        Note: This method is described as a "compatibility method for the isolated API".
        It directly calls `prepare_database` with the provided arguments.
        The name suggests it's intended for contexts where a "retriever" is being
        set up, and this method ensures the underlying data for that retriever is ready.

        Args:
            repo_url_or_path (str): The URL or local path of the repository.
            type (str, optional): The type of the repository (e.g., "github").
                                  Defaults to "github".
            access_token (Optional[str], optional): Access token for private
                                                    repositories. Defaults to None.

        Returns:
            List[Document]: A list of transformed `Document` objects from the
                            prepared database, ready to be used by a retriever.
        """
        return self.prepare_database(repo_url_or_path, type, access_token)
