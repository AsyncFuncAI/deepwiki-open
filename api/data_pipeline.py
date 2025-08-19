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
import requests
from requests.exceptions import RequestException

from api.tools.embedder import get_embedder
from api.config import get_embedder_config

# Configure logging
logger = logging.getLogger(__name__)

# Maximum token limit for OpenAI embedding models
MAX_EMBEDDING_TOKENS = 8192

def validate_repository_access(repo_url: str, access_token: str = None, type: str = "github") -> tuple[bool, str]:
    """
    Validate if repository exists and is accessible with provided credentials.
    
    Args:
        repo_url: Repository URL to validate
        access_token: Optional access token for private repositories
        type: Repository type (github, gitlab, bitbucket)
    
    Returns:
        tuple: (is_valid, error_message)
    """
    try:
        parsed_url = urlparse(repo_url)
        
        if type == "github":
            # Extract owner/repo from path
            path_parts = parsed_url.path.strip('/').split('/')
            if len(path_parts) < 2:
                return False, "Invalid GitHub repository URL format. Expected: owner/repo"
            
            owner, repo = path_parts[0], path_parts[1].replace('.git', '')
            
            # Determine API base URL
            if parsed_url.netloc == "github.com":
                api_base = "https://api.github.com"
            else:
                api_base = f"{parsed_url.scheme}://{parsed_url.netloc}/api/v3"
            
            # Build API URL
            api_url = f"{api_base}/repos/{owner}/{repo}"
            
            # Set headers
            headers = {"Accept": "application/vnd.github.v3+json"}
            if access_token:
                headers["Authorization"] = f"token {access_token}"
            
            # Make API call
            response = requests.get(api_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                return True, "Repository access validated successfully"
            elif response.status_code == 404:
                if access_token:
                    return False, "Repository not found or access token invalid. Please check the repository URL and token permissions."
                else:
                    return False, "Repository not found or private. If this is a private repository, please provide an access token."
            elif response.status_code == 401:
                return False, "Unauthorized access. Please check your access token."
            elif response.status_code == 403:
                return False, "Access forbidden. Token may be expired or lack necessary permissions."
            else:
                return False, f"Repository validation failed with status {response.status_code}"
                
        elif type == "gitlab":
            # Similar validation for GitLab
            path_parts = parsed_url.path.strip('/').split('/')
            if len(path_parts) < 2:
                return False, "Invalid GitLab repository URL format"
            
            # Build GitLab API URL
            project_path = quote('/'.join(path_parts), safe='')
            api_url = f"{parsed_url.scheme}://{parsed_url.netloc}/api/v4/projects/{project_path}"
            
            headers = {}
            if access_token:
                headers["PRIVATE-TOKEN"] = access_token
            
            response = requests.get(api_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                return True, "GitLab repository access validated successfully"
            elif response.status_code in [401, 403, 404]:
                return False, "GitLab repository validation failed. Check URL and token."
            else:
                return False, f"GitLab validation failed with status {response.status_code}"
                
        elif type == "bitbucket":
            # Similar validation for Bitbucket
            path_parts = parsed_url.path.strip('/').split('/')
            if len(path_parts) < 2:
                return False, "Invalid Bitbucket repository URL format"
            
            workspace, repo_slug = path_parts[0], path_parts[1].replace('.git', '')
            api_url = f"https://api.bitbucket.org/2.0/repositories/{workspace}/{repo_slug}"
            
            headers = {}
            if access_token:
                headers["Authorization"] = f"Bearer {access_token}"
            
            response = requests.get(api_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                return True, "Bitbucket repository access validated successfully"
            elif response.status_code in [401, 403, 404]:
                return False, "Bitbucket repository validation failed. Check URL and token."
            else:
                return False, f"Bitbucket validation failed with status {response.status_code}"
        
        return False, f"Unsupported repository type: {type}"
        
    except requests.RequestException as e:
        return False, f"Network error during repository validation: {str(e)}"
    except Exception as e:
        return False, f"Repository validation error: {str(e)}"

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

def download_repo(repo_url: str, local_path: str, type: str = "github", access_token: str = None) -> str:
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
        # Validate repository access first
        is_valid, validation_message = validate_repository_access(repo_url, access_token, type)
        if not is_valid:
            logger.error(f"Repository validation failed: {validation_message}")
            raise ValueError(f"Repository access validation failed: {validation_message}")
        
        logger.info(f"Repository validation successful: {validation_message}")
        
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
                # Format: https://{token}@{domain}/owner/repo.git
                # Works for both github.com and enterprise GitHub domains
                clone_url = urlunparse((parsed.scheme, f"{access_token}@{parsed.netloc}", parsed.path, '', '', ''))
            elif type == "gitlab":
                # Format: https://oauth2:{token}@gitlab.com/owner/repo.git
                clone_url = urlunparse((parsed.scheme, f"oauth2:{access_token}@{parsed.netloc}", parsed.path, '', '', ''))
            elif type == "bitbucket":
                # Format: https://x-token-auth:{token}@bitbucket.org/owner/repo.git
                clone_url = urlunparse((parsed.scheme, f"x-token-auth:{access_token}@{parsed.netloc}", parsed.path, '', '', ''))

            logger.info("Using access token for authentication")

        # Clone the repository
        logger.info(f"Cloning repository from {repo_url} to {local_path}")
        # We use repo_url in the log to avoid exposing the token in logs
        result = subprocess.run(
            ["git", "clone", "--depth=1", "--single-branch", clone_url, local_path],
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
        
        # Test the embedder immediately to verify it works
        try:
            logger.info(f"Testing embedder with API key present: {bool(os.environ.get('OPENAI_API_KEY'))}")
            test_doc = [{"text": "test embedding"}]
            logger.info("About to test embedder...")
            # Don't actually run this test here - just log that we're setting it up
        except Exception as e:
            logger.error(f"Error setting up embedder: {e}")

    data_transformer = adal.Sequential(
        splitter, embedder_transformer
    )  # sequential will chain together splitter and embedder
    
    # Debug logging for transformer components
    logger.info(f"Created data transformer with embedder: {type(embedder.model_client).__name__}")
    logger.info(f"Embedder config: {embedder_config}")
    
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
    
    # Transform with error handling
    try:
        logger.info(f"Starting transformation with {len(documents)} documents")
        
        # Check documents before transformation
        try:
            transformed_docs = db.fetch_transformed_items(key="split_and_embed") if hasattr(db, 'fetch_transformed_items') else db.get_transformed_data(key="split_and_embed")
            if transformed_docs:
                logger.info(f"Found {len(transformed_docs)} pre-existing transformed documents - skipping transform")
            else:
                logger.info("No pre-existing transformed documents - running transformation")
        except Exception as e:
            logger.info(f"Error checking for pre-existing transformed docs: {e}")
            logger.info("No pre-existing transformed documents - running transformation")
            transformed_docs = None
            
            # Ensure environment variables are loaded before transformation
            from dotenv import load_dotenv
            load_dotenv()
            
            # Check if environment variables are available during transform
            openai_key_present = bool(os.environ.get('OPENAI_API_KEY'))
            logger.info(f"OPENAI_API_KEY available during transform: {openai_key_present}")
            
            if not openai_key_present:
                raise ValueError("OPENAI_API_KEY environment variable not found. Cannot proceed with embedding generation.")
            
            # DEBUGGING: Manual pipeline execution instead of db.transform()
            logger.info("=== MANUAL PIPELINE DEBUGGING ===")
            
            # Get the original documents
            original_docs = documents
            logger.info(f"Starting with {len(original_docs)} original documents")
            
            # Step 1: Run splitter manually
            splitter = TextSplitter(**configs["text_splitter"])
            logger.info("Running text splitter...")
            split_docs = splitter(original_docs)
            logger.info(f"Text splitter produced {len(split_docs)} chunks")
            
            # Step 2: Run embedder manually
            embedder = get_embedder()
            embedder_config = get_embedder_config()
            batch_size = embedder_config.get("batch_size", 500)
            embedder_transformer = ToEmbeddings(embedder=embedder, batch_size=batch_size)
            
            logger.info(f"Running ToEmbeddings with batch_size={batch_size}...")
            logger.info(f"OPENAI_API_KEY present: {bool(os.environ.get('OPENAI_API_KEY'))}")
            
            try:
                logger.info(f"About to call ToEmbeddings with {len(split_docs)} split documents")
                
                # FIXED APPROACH: Use direct embedder instead of broken ToEmbeddings
                logger.info("=== USING DIRECT EMBEDDER APPROACH ===")
                
                # Extract text from all documents and filter out oversized texts
                texts = []
                valid_docs = []
                
                for doc in split_docs:
                    text_length = len(doc.text)
                    if text_length > MAX_EMBEDDING_TOKENS * 4:  # Rough token estimate (4 chars per token)
                        logger.warning(f"Skipping text with {text_length} characters (too long for embedding)")
                        continue
                    texts.append(doc.text)
                    valid_docs.append(doc)
                
                logger.info(f"Extracted {len(texts)} valid texts for embedding (filtered from {len(split_docs)} total)")
                
                # Process in smaller batches to avoid API limits
                BATCH_SIZE = 10  # Very conservative batch size for OpenAI with large texts
                embedded_docs = []
                
                for batch_start in range(0, len(texts), BATCH_SIZE):
                    batch_end = min(batch_start + BATCH_SIZE, len(texts))
                    batch_texts = texts[batch_start:batch_end]
                    batch_docs = valid_docs[batch_start:batch_end]
                    
                    logger.info(f"Processing batch {batch_start//BATCH_SIZE + 1}: texts {batch_start} to {batch_end-1}")
                    logger.info(f"First text length: {len(batch_texts[0])} chars")
                    
                    try:
                        # Get embeddings for this batch
                        embedder_result = embedder(batch_texts)
                        logger.info(f"Batch embedder returned: {type(embedder_result)}")
                        
                        if hasattr(embedder_result, 'data') and embedder_result.data:
                            logger.info(f"Got {len(embedder_result.data)} embeddings for batch")
                            
                            # Create documents with vectors for this batch
                            for i, (doc, embedding_obj) in enumerate(zip(batch_docs, embedder_result.data)):
                                # Create a copy of the document with the embedding
                                new_doc = Document(text=doc.text, vector=embedding_obj.embedding)
                                new_doc.id = doc.id if hasattr(doc, 'id') else None
                                new_doc.meta_data = doc.meta_data if hasattr(doc, 'meta_data') else {}
                                embedded_docs.append(new_doc)
                                
                                # Log first few for verification
                                global_idx = batch_start + i
                                if global_idx < 3:
                                    logger.info(f"Document {global_idx}: vector_length={len(new_doc.vector)}")
                        else:
                            raise ValueError(f"Direct embedder did not return valid embeddings for batch {batch_start//BATCH_SIZE + 1}")
                    except Exception as e:
                        logger.error(f"Error processing batch {batch_start//BATCH_SIZE + 1}: {e}")
                        # Continue with next batch instead of failing completely
                        continue
                
                logger.info(f"✓ Successfully created {len(embedded_docs)} documents with embeddings")
                
                # DEBUG: Check embeddings before storing
                for i, doc in enumerate(embedded_docs[:3]):
                    vector_present = hasattr(doc, 'vector') and doc.vector is not None
                    vector_len = len(doc.vector) if vector_present else 0
                    logger.info(f"Before storage - Document {i}: vector_present={vector_present}, vector_length={vector_len}")
                
                logger.info("=== END DIRECT EMBEDDER APPROACH ===")
                
                # Store the embedded documents using LocalDB's proper method
                logger.info(f"Attempting to store {len(embedded_docs)} documents in database")
                
                # Use the standard LocalDB transform method but manually set the result
                try:
                    # Debug: Check LocalDB structure before storage
                    logger.info(f"LocalDB attributes: {dir(db)}")
                    logger.info(f"LocalDB has _transformed_data: {hasattr(db, '_transformed_data')}")
                    logger.info(f"LocalDB has set_transformed_data: {hasattr(db, 'set_transformed_data')}")
                    
                    # Use the proper LocalDB API to store transformed data
                    logger.info("Using proper LocalDB transformed_items storage")
                    
                    # Store the data using the LocalDB's internal transformed_items structure
                    if not hasattr(db, 'transformed_items'):
                        db.transformed_items = {}
                    db.transformed_items["split_and_embed"] = embedded_docs
                    
                    # Debug: Check what keys are now in the database
                    logger.info(f"transformed_items keys: {list(db.transformed_items.keys())}")
                    
                    # Manually save the database to persist the data
                    db.save_state(filepath=db_path)
                    logger.info("Database saved to disk")
                    
                    # Force a fresh database load to verify persistence
                    db_reloaded = LocalDB(db_path)
                    logger.info(f"Reloaded DB has transformed_items: {hasattr(db_reloaded, 'transformed_items')}")
                    
                    # Check if the reloaded database has the transformed data structure
                    if hasattr(db_reloaded, 'transformed_items'):
                        logger.info(f"Reloaded DB transformed_items keys: {list(db_reloaded.transformed_items.keys())}")
                    else:
                        logger.error("Reloaded DB has no transformed_items attribute")
                    
                    # Try to get the transformed data using the proper API
                    try:
                        reloaded_docs = db_reloaded.fetch_transformed_items(key="split_and_embed")
                        if reloaded_docs:
                            logger.info(f"Verification: Successfully persisted {len(reloaded_docs)} documents")
                            # Replace the original db with the reloaded one to ensure consistency
                            db = db_reloaded
                        else:
                            logger.error("Verification failed: No documents found after database reload")
                            # Still proceed with the original database since we have the data in memory
                            logger.info("Continuing with original database (data exists in memory)")
                    except Exception as get_error:
                        logger.error(f"Error getting transformed data: {get_error}")
                        # Still proceed with the original database since we have the data in memory
                        logger.info("Continuing with original database (data exists in memory)")
                        
                except Exception as e:
                    logger.error(f"Error storing documents in database: {e}")
                    raise
                    
                logger.info("Manually stored embedded documents in database")
                
                # DEBUG: Check embeddings after storing and retrieving
                try:
                    retrieved_docs = db.fetch_transformed_items(key="split_and_embed") if hasattr(db, 'fetch_transformed_items') else db.get_transformed_data(key="split_and_embed")
                    if retrieved_docs:
                        for i, doc in enumerate(retrieved_docs[:3]):
                            vector_present = hasattr(doc, 'vector') and doc.vector is not None
                            vector_len = len(doc.vector) if vector_present else 0
                            logger.info(f"After retrieval - Document {i}: vector_present={vector_present}, vector_length={vector_len}")
                    else:
                        logger.error("No documents retrieved from database after storage!")
                except Exception as e:
                    logger.error(f"Error retrieving documents for debug: {e}")
                    logger.info("Continuing with stored documents in memory")
                
            except Exception as e:
                logger.error(f"ToEmbeddings failed: {e}")
                import traceback
                logger.error(f"ToEmbeddings traceback: {traceback.format_exc()}")
                raise
            
            logger.info("=== END MANUAL PIPELINE DEBUGGING ===")
            
            # db.transform(key="split_and_embed")
            
            # Check the results immediately after transform
            try:
                transformed_docs = db.fetch_transformed_items(key="split_and_embed") if hasattr(db, 'fetch_transformed_items') else db.get_transformed_data(key="split_and_embed")
                logger.info(f"After transformation: {len(transformed_docs) if transformed_docs else 0} documents")
            except Exception as e:
                logger.error(f"Error fetching transformed docs: {e}")
                transformed_docs = None
            
            if transformed_docs:
                # Check first few documents for embeddings
                for i, doc in enumerate(transformed_docs[:3]):
                    has_vector = hasattr(doc, 'vector') and doc.vector and len(doc.vector) > 0
                    vector_len = len(doc.vector) if hasattr(doc, 'vector') and doc.vector else 0
                    logger.info(f"Document {i}: has_vector={has_vector}, vector_length={vector_len}")
            
        logger.info("Transformation completed successfully")
    except Exception as e:
        logger.error(f"Error during transformation: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise
    
    # The database has already been saved and reloaded during the direct embedder approach
    # Just ensure the directory exists and return the verified database
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    return db

def get_github_file_content(repo_url: str, file_path: str, access_token: str = None) -> str:
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
        path_parts = parsed_url.path.strip('/').split('/')
        if len(path_parts) < 2:
            raise ValueError("Invalid GitHub URL format - expected format: https://domain/owner/repo")

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
                default_branch = project_data.get('default_branch', 'main')
                logger.info(f"Found default branch: {default_branch}")
            else:
                logger.warning(f"Could not fetch project info, using 'main' as default branch")
                default_branch = 'main'
        except Exception as e:
            logger.warning(f"Error fetching project info: {e}, using 'main' as default branch")
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
                default_branch = repo_data.get('mainbranch', {}).get('name', 'main')
                logger.info(f"Found default branch: {default_branch}")
            else:
                logger.warning(f"Could not fetch repository info, using 'main' as default branch")
                default_branch = 'main'
        except Exception as e:
            logger.warning(f"Error fetching repository info: {e}, using 'main' as default branch")
            default_branch = 'main'

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


def get_file_content(repo_url: str, file_path: str, type: str = "github", access_token: str = None) -> str:
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
                # Extract the repository name from the URL
                repo_name = self._extract_repo_name_from_url(repo_url_or_path, repo_type)
                logger.info(f"Extracted repo name: {repo_name}")

                save_repo_dir = os.path.join(root_path, "repos", repo_name)

                # Check if the repository directory already exists and is not empty
                if not (os.path.exists(save_repo_dir) and os.listdir(save_repo_dir)):
                    # Only download if the repository doesn't exist or is empty
                    download_repo(repo_url_or_path, save_repo_dir, repo_type, access_token)
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
                    # Check if documents actually have valid embeddings
                    valid_docs = [doc for doc in documents if hasattr(doc, 'vector') and doc.vector and len(doc.vector) > 0]
                    if valid_docs:
                        logger.info(f"Loaded {len(valid_docs)} documents with valid embeddings from existing database")
                        return valid_docs
                    else:
                        logger.warning(f"Database has {len(documents)} documents but none have valid embeddings, will regenerate")
                        # Remove the corrupted database file
                        try:
                            os.remove(self.repo_paths["save_db_file"])
                            logger.info("Removed database file with empty embeddings")
                        except Exception as remove_e:
                            logger.error(f"Could not remove database file: {remove_e}")
                        # Continue to create a new database
            except Exception as e:
                error_str = str(e)
                # Check for common serialization errors that indicate database corruption
                if ("ToEmbeddings" in error_str and "missing" in error_str) or \
                   ("embedder" in error_str) or \
                   ("OpenAIClient" in error_str and "from_dict" in error_str):
                    logger.warning(f"Database contains incompatible embedder serialization, will regenerate: {e}")
                    # Remove the corrupted database file to force regeneration
                    try:
                        os.remove(self.repo_paths["save_db_file"])
                        logger.info("Removed corrupted database file, will create new one")
                    except Exception as remove_e:
                        logger.error(f"Could not remove corrupted database file: {remove_e}")
                else:
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
