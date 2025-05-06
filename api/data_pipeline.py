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
from api.config import configs
from api.ollama_patch import OllamaDocumentProcessor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Maximum token limit for OpenAI embedding models
MAX_EMBEDDING_TOKENS = 8192

def count_tokens(text: str, local_ollama: bool = False) -> int:
    """
    Count the number of tokens in a text string using tiktoken.

    Args:
        text (str): The text to count tokens for.
        local_ollama (bool, optional): Whether using local Ollama embeddings. Default is False.

    Returns:
        int: The number of tokens in the text.
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

def download_repo(repo_url: str, local_path: str, access_token: str = None):
    """
    Downloads a Git repository (GitHub, GitLab, or Bitbucket) to a specified local path.

    Args:
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
            # Determine the repository type and format the URL accordingly
            if "github.com" in repo_url:
                # Format: https://{token}@github.com/owner/repo.git
                clone_url = repo_url.replace("https://", f"https://{access_token}@")
            elif "gitlab.com" in repo_url:
                # Format: https://oauth2:{token}@gitlab.com/owner/repo.git
                clone_url = repo_url.replace("https://", f"https://oauth2:{access_token}@")
            elif "bitbucket.org" in repo_url:
                # Format: https://{token}@bitbucket.org/owner/repo.git
                clone_url = repo_url.replace("https://", f"https://{access_token}@")
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

# Alias for backward compatibility
download_github_repo = download_repo

def read_all_documents(path: str, local_ollama: bool = False):
    """
    Recursively reads all documents in a directory and its subdirectories.

    Args:
        path (str): The root directory path.
        local_ollama (bool): Whether to use local Ollama for token counting. Default is False.

    Returns:
        list: A list of Document objects with metadata.
    """
    documents = []
    # File extensions to look for, prioritizing code files
    code_extensions = [".py", ".js", ".ts", ".java", ".cpp", ".c", ".go", ".rs",
                      ".jsx", ".tsx", ".html", ".css", ".php", ".swift", ".cs"]
    doc_extensions = [".md", ".txt", ".rst", ".json", ".yaml", ".yml"]

    # Get excluded files and directories from config
    excluded_dirs = configs.get("file_filters", {}).get("excluded_dirs", [".venv", "node_modules"])
    excluded_files = configs.get("file_filters", {}).get("excluded_files", ["package-lock.json"])

    logger.info(f"Reading documents from {path}")

    # Process code files first
    for ext in code_extensions:
        files = glob.glob(f"{path}/**/*{ext}", recursive=True)
        for file_path in files:
            # Skip excluded directories and files
            is_excluded = False
            if any(excluded in file_path for excluded in excluded_dirs):
                is_excluded = True
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
                    if token_count > MAX_EMBEDDING_TOKENS:
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
            if any(excluded in file_path for excluded in excluded_dirs):
                is_excluded = True
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
    Creates and returns the data transformation pipeline.
    
    Args:
        local_ollama (bool): Whether to use local Ollama for embedding (default: False)
    
    Returns:
        adal.Sequential: The data transformation pipeline
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
    Transforms a list of documents and saves them to a local database.

    Args:
        documents (list): A list of `Document` objects.
        db_path (str): The path to the local database file.
        local_ollama (bool): Whether to use local Ollama for embedding (default: False)
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

    Args:
        repo_url (str): The URL of the GitLab repository (e.g., "https://gitlab.com/username/repo")
        file_path (str): The path to the file within the repository (e.g., "src/main.py")
        access_token (str, optional): GitLab personal access token for private repositories

    Returns:
        str: The content of the file as a string

    Raises:
        ValueError: If the file cannot be fetched or if the URL is not a valid GitLab URL
    """
    try:
        # Extract owner and repo name from GitLab URL
        if not (repo_url.startswith("https://gitlab.com/") or repo_url.startswith("http://gitlab.com/")):
            raise ValueError("Not a valid GitLab repository URL")

        parts = repo_url.rstrip('/').split('/')
        if len(parts) < 5:
            raise ValueError("Invalid GitLab URL format")

        # For GitLab, the URL format can be:
        # - https://gitlab.com/username/repo
        # - https://gitlab.com/group/subgroup/repo
        # We need to extract the project path with namespace

        # Remove the domain part
        path_parts = parts[3:]
        # Join the remaining parts to get the project path with namespace
        project_path = '/'.join(path_parts).replace(".git", "")
        # URL encode the path for API use
        encoded_project_path = project_path.replace('/', '%2F')

        # Use GitLab API to get file content
        # The API endpoint for getting file content is: /api/v4/projects/{encoded_project_path}/repository/files/{encoded_file_path}/raw
        encoded_file_path = file_path.replace('/', '%2F')
        api_url = f"https://gitlab.com/api/v4/projects/{encoded_project_path}/repository/files/{encoded_file_path}/raw?ref=main"

        # Prepare curl command with authentication if token is provided
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

        # GitLab API returns the raw file content directly
        content = result.stdout.decode("utf-8")

        # Check if we got an error response (GitLab returns JSON for errors)
        if content.startswith('{') and '"message":' in content:
            try:
                error_data = json.loads(content)
                if "message" in error_data:
                    # Try with 'master' branch if 'main' failed
                    api_url = f"https://gitlab.com/api/v4/projects/{encoded_project_path}/repository/files/{encoded_file_path}/raw?ref=master"
                    logger.info(f"Retrying with master branch: {api_url}")

                    # Prepare curl command for retry
                    curl_cmd = ["curl", "-s"]
                    if access_token:
                        curl_cmd.extend(["-H", f"PRIVATE-TOKEN: {access_token}"])
                    curl_cmd.append(api_url)

                    result = subprocess.run(
                        curl_cmd,
                        check=True,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                    )
                    content = result.stdout.decode("utf-8")

                    # Check again for error
                    if content.startswith('{') and '"message":' in content:
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


def get_file_content(repo_url: str, file_path: str, access_token: str = None) -> str:
    """
    Retrieves the content of a file from a Git repository (GitHub or GitLab).

    Args:
        repo_url (str): The URL of the repository
        file_path (str): The path to the file within the repository
        access_token (str, optional): Access token for private repositories

    Returns:
        str: The content of the file as a string

    Raises:
        ValueError: If the file cannot be fetched or if the URL is not valid
    """
    if "github.com" in repo_url:
        return get_github_file_content(repo_url, file_path, access_token)
    elif "gitlab.com" in repo_url:
        return get_gitlab_file_content(repo_url, file_path, access_token)
    elif "bitbucket.org" in repo_url:
        return get_bitbucket_file_content(repo_url, file_path, access_token)
    else:
        raise ValueError("Unsupported repository URL. Only GitHub and GitLab are supported.")

class DatabaseManager:
    """
    Manages the creation, loading, transformation, and persistence of LocalDB instances.
    """

    def __init__(self):
        self.db = None
        self.repo_url_or_path = None
        self.repo_paths = None

    def prepare_database(self, repo_url_or_path: str, access_token: str = None, local_ollama: bool = False) -> List[Document]:
        """
        Create a new database from the repository.

        Args:
            repo_url_or_path (str): The URL or local path of the repository
            access_token (str, optional): Access token for private repositories
            local_ollama (bool): Whether to use local Ollama for embedding (default: False)

        Returns:
            List[Document]: List of Document objects
        """
        self.reset_database()
        self._create_repo(repo_url_or_path, access_token)
        return self.prepare_db_index(local_ollama=local_ollama)

    def reset_database(self):
        """
        Reset the database to its initial state.
        """
        self.db = None
        self.repo_url_or_path = None
        self.repo_paths = None

    def _create_repo(self, repo_url_or_path: str, access_token: str = None) -> None:
        """
        Download and prepare all paths.
        Paths:
        ~/.adalflow/repos/{repo_name} (for url, local path will be the same)
        ~/.adalflow/databases/{repo_name}.pkl

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
                if "github.com" in repo_url_or_path:
                    # GitHub URL format: https://github.com/owner/repo
                    repo_name = repo_url_or_path.split("/")[-1].replace(".git", "")
                elif "gitlab.com" in repo_url_or_path:
                    # GitLab URL format: https://gitlab.com/owner/repo or https://gitlab.com/group/subgroup/repo
                    # Use the last part of the URL as the repo name
                    repo_name = repo_url_or_path.split("/")[-1].replace(".git", "")
                elif "bitbucket.org" in repo_url_or_path:
                    # Bitbucket URL format: https://bitbucket.org/owner/repo
                    repo_name = repo_url_or_path.split("/")[-1].replace(".git", "")
                else:
                    # Generic handling for other Git URLs
                    repo_name = repo_url_or_path.split("/")[-1].replace(".git", "")

                save_repo_dir = os.path.join(root_path, "repos", repo_name)

                # Check if the repository directory already exists and is not empty
                if not (os.path.exists(save_repo_dir) and os.listdir(save_repo_dir)):
                    # Only download if the repository doesn't exist or is empty
                    download_repo(repo_url_or_path, save_repo_dir, access_token)
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

    def prepare_db_index(self, local_ollama: bool = False) -> List[Document]:
        """
        Prepare the indexed database for the repository.
        
        Args:
            local_ollama (bool): Whether to use local Ollama for embedding (default: False)
            
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
        documents = read_all_documents(self.repo_paths["save_repo_dir"], local_ollama=local_ollama)
        self.db = transform_documents_and_save_to_db(
            documents, self.repo_paths["save_db_file"], local_ollama=local_ollama
        )
        logger.info(f"Total documents: {len(documents)}")
        transformed_docs = self.db.get_transformed_data(key="split_and_embed")
        logger.info(f"Total transformed documents: {len(transformed_docs)}")
        return transformed_docs

    def prepare_retriever(self, repo_url_or_path: str, access_token: str = None):
        """
        Prepare the retriever for a repository.
        This is a compatibility method for the isolated API.

        Args:
            repo_url_or_path (str): The URL or local path of the repository
            access_token (str, optional): Access token for private repositories

        Returns:
            List[Document]: List of Document objects
        """
        return self.prepare_database(repo_url_or_path, access_token)
