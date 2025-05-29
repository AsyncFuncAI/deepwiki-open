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
from typing import Optional 
from api.config import configs, DEFAULT_EXCLUDED_DIRS, DEFAULT_EXCLUDED_FILES
from api.ollama_patch import OllamaDocumentProcessor
from urllib.parse import urlparse, urlunparse, quote

logger = logging.getLogger(__name__)

MAX_EMBEDDING_TOKENS = 8192
# _ADALFLOW_DEFAULT_KEY = "__adal__DEFAULT_KEY__" # Removed this, will use literal directly

def _get_effective_chunk_setting(param_value: Optional[bool]) -> bool:
    if param_value is None:
        return configs.get('fine_tuning_data_prep_default', False)
    return param_value

def count_tokens(text: str, local_ollama: bool = False) -> int:
    try:
        if local_ollama:
            encoding = tiktoken.get_encoding("cl100k_base")
        else:
            encoding = tiktoken.encoding_for_model("text-embedding-3-small")
        return len(encoding.encode(text))
    except Exception as e:
        logger.warning(f"Error counting tokens with tiktoken: {e}")
        return len(text) // 4

def download_repo(repo_url: str, local_path: str, type: str = "github", access_token: str = None) -> str:
    try:
        logger.info(f"Preparing to clone repository to {local_path}")
        subprocess.run(["git", "--version"], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if os.path.exists(local_path) and os.listdir(local_path):
            logger.warning(f"Repository already exists at {local_path}. Using existing repository.")
            return f"Using existing repository at {local_path}"
        os.makedirs(local_path, exist_ok=True)
        clone_url = repo_url
        if access_token:
            parsed = urlparse(repo_url)
            if type == "github":
                clone_url = urlunparse((parsed.scheme, f"{access_token}@{parsed.netloc}", parsed.path, '', '', ''))
            elif type == "gitlab":
                clone_url = urlunparse((parsed.scheme, f"oauth2:{access_token}@{parsed.netloc}", parsed.path, '', '', ''))
            elif type == "bitbucket":
                clone_url = urlunparse((parsed.scheme, f"{access_token}@{parsed.netloc}", parsed.path, '', '', ''))
            logger.info("Using access token for authentication")
        logger.info(f"Cloning repository from {repo_url} to {local_path}")
        result = subprocess.run(["git", "clone", clone_url, local_path], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        logger.info("Repository cloned successfully")
        return result.stdout.decode("utf-8")
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode('utf-8')
        if access_token and access_token in error_msg:
            error_msg = error_msg.replace(access_token, "***TOKEN***")
        raise ValueError(f"Error during cloning: {error_msg}")
    except Exception as e:
        raise ValueError(f"An unexpected error occurred: {str(e)}")

download_github_repo = download_repo

def read_all_documents(path: str, local_ollama: bool = False, excluded_dirs: List[str] = None, excluded_files: List[str] = None,
                      included_dirs: List[str] = None, included_files: List[str] = None, chunk_for_fine_tuning: Optional[bool] = None):
    chunk_for_fine_tuning = _get_effective_chunk_setting(chunk_for_fine_tuning)
    documents = []
    code_extensions = [".py", ".js", ".ts", ".java", ".cpp", ".c", ".h", ".hpp", ".go", ".rs",
                       ".jsx", ".tsx", ".html", ".css", ".php", ".swift", ".cs"]
    doc_extensions = [".md", ".txt", ".rst", ".json", ".yaml", ".yml"]
    use_inclusion_mode = (included_dirs is not None and len(included_dirs) > 0) or \
                         (included_files is not None and len(included_files) > 0)

    if use_inclusion_mode:
        final_included_dirs = set(included_dirs) if included_dirs else set()
        final_included_files = set(included_files) if included_files else set()
        logger.info(f"Using inclusion mode")
        logger.info(f"Included directories: {list(final_included_dirs)}")
        logger.info(f"Included files: {list(final_included_files)}")
        included_dirs, included_files = list(final_included_dirs), list(final_included_files)
        excluded_dirs, excluded_files = [], []
    else:
        final_excluded_dirs = set(DEFAULT_EXCLUDED_DIRS)
        if "file_filters" in configs and "excluded_dirs" in configs["file_filters"]:
            final_excluded_dirs.update(configs["file_filters"]["excluded_dirs"])
        if excluded_dirs is not None: final_excluded_dirs.update(excluded_dirs)
        
        final_excluded_files = set(DEFAULT_EXCLUDED_FILES)
        if "file_filters" in configs and "excluded_files" in configs["file_filters"]:
            final_excluded_files.update(configs["file_filters"]["excluded_files"])
        if excluded_files is not None: final_excluded_files.update(excluded_files)

        excluded_dirs, excluded_files = list(final_excluded_dirs), list(final_excluded_files)
        included_dirs, included_files = [], []
        logger.info(f"Using exclusion mode")
        logger.info(f"Excluded directories: {excluded_dirs}")
        logger.info(f"Excluded files: {excluded_files}")

    logger.info(f"Reading documents from {path}")

    def should_process_file(file_path: str, use_inclusion: bool, included_dirs: List[str], included_files: List[str],
                           excluded_dirs: List[str], excluded_files: List[str]) -> bool:
        #if not included_dirs and not included_files: is_included = True # This line seems to be dead code in inclusion mode
        file_name = os.path.basename(file_path)
        if use_inclusion:
            is_included = False
            if included_dirs:
                for included in included_dirs:
                    if included.strip("./").rstrip("/") in file_path_parts: is_included = True; break
            if not is_included and included_files:
                for included_file in included_files:
                    if file_name == included_file or file_name.endswith(included_file): is_included = True; break
            if not included_dirs and not included_files: is_included = True
            return is_included
        else:
            is_excluded = False
            for excluded in excluded_dirs:
                if excluded.strip("./").rstrip("/") in file_path_parts: is_excluded = True; break
            if not is_excluded:
                for excluded_file in excluded_files:
                    if file_name == excluded_file: is_excluded = True; break
            return not is_excluded

    for ext_list in [code_extensions, doc_extensions]:
        is_code = (ext_list == code_extensions)
        for ext in ext_list:
            files = glob.glob(f"{path}/**/*{ext}", recursive=True)
            for file_path in files:
                if not should_process_file(file_path, use_inclusion_mode, included_dirs, included_files, excluded_dirs, excluded_files):
                    continue
                try:
                    with open(file_path, "r", encoding="utf-8") as f: content = f.read()
                    relative_path = os.path.relpath(file_path, path)
                    is_implementation = is_code and not (relative_path.startswith("test_") or \
                                                          relative_path.startswith("app_") or \
                                                          "test" in relative_path.lower())
                    token_count = count_tokens(content, local_ollama)
                    
                    current_token_limit = (MAX_EMBEDDING_TOKENS * 10) if is_code else MAX_EMBEDDING_TOKENS
                    if chunk_for_fine_tuning: current_token_limit = float('inf')

                    if token_count > current_token_limit:
                        logger.warning(f"Skipping large file {relative_path}: Token count ({token_count}) exceeds limit ({current_token_limit})")
                        continue
                    doc = Document(text=content, meta_data={"file_path": relative_path, "type": ext[1:], 
                                                            "is_code": is_code, "is_implementation": is_implementation, 
                                                            "title": relative_path, "token_count": token_count})
                    documents.append(doc)
                except Exception as e: logger.error(f"Error reading {file_path}: {e}")
    logger.info(f"Found {len(documents)} documents")
    return documents

def prepare_data_pipeline(local_ollama: bool = False, chunk_for_fine_tuning: Optional[bool] = None):
    chunk_for_fine_tuning = _get_effective_chunk_setting(chunk_for_fine_tuning)
    if chunk_for_fine_tuning: return adal.Sequential()
    splitter = TextSplitter(**configs["text_splitter"])
    if local_ollama:
        embedder = adal.Embedder(model_client=configs["embedder_ollama"]["model_client"](), 
                                 model_kwargs=configs["embedder_ollama"]["model_kwargs"])
        embedder_transformer = OllamaDocumentProcessor(embedder=embedder)
    else:
        embedder = adal.Embedder(model_client=configs["embedder"]["model_client"](), 
                                 model_kwargs=configs["embedder"]["model_kwargs"])
        embedder_transformer = ToEmbeddings(embedder=embedder, batch_size=configs["embedder"]["batch_size"])
    return adal.Sequential(splitter, embedder_transformer)

def transform_documents_and_save_to_db(documents: List[Document], db_path: str, local_ollama: bool = False, 
                                     chunk_for_fine_tuning: Optional[bool] = None) -> LocalDB:
    chunk_for_fine_tuning = _get_effective_chunk_setting(chunk_for_fine_tuning)
    data_transformer = prepare_data_pipeline(local_ollama, chunk_for_fine_tuning)
    db = LocalDB(); db.load(documents)
    if not chunk_for_fine_tuning:
        db.register_transformer(transformer=data_transformer, key="split_and_embed")
        db.transform(key="split_and_embed")
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    db.save_state(filepath=db_path)
    return db

def get_file_content_from_api(api_url: str, headers: dict) -> str:
    curl_cmd = ["curl", "-s", "-L"] 
    for key, value in headers.items():
        curl_cmd.extend(["-H", f"{key}: {value}"])
    curl_cmd.append(api_url)
    logger.info(f"Fetching file content from API: {api_url}")
    result = subprocess.run(curl_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return result.stdout.decode("utf-8")

def get_github_file_content(repo_url: str, file_path: str, access_token: str = None) -> str:
    try:
        if not (repo_url.startswith("https://github.com/") or repo_url.startswith("http://github.com/")):
            raise ValueError("Not a valid GitHub repository URL")
        parts = repo_url.rstrip('/').split('/')
        if len(parts) < 5: raise ValueError("Invalid GitHub URL format")
        owner, repo = parts[-2], parts[-1].replace(".git", "")
        api_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{file_path}"
        headers = {"Accept": "application/vnd.github.v3.raw"} 
        if access_token: headers["Authorization"] = f"token {access_token}"
        
        try:
            return get_file_content_from_api(api_url, headers)
        except subprocess.CalledProcessError as e:
            logger.warning(f"Raw fetch failed for {api_url}, trying JSON API. Error: {e.stderr.decode('utf-8')}")
            json_headers = {"Accept": "application/vnd.github.v3+json"}
            if access_token: json_headers["Authorization"] = f"token {access_token}"
            
            json_content_str = get_file_content_from_api(api_url, json_headers)
            content_data = json.loads(json_content_str)

            if "message" in content_data and "documentation_url" in content_data:
                raise ValueError(f"GitHub API error: {content_data['message']}")
            if "download_url" in content_data and content_data["download_url"] is not None:
                return get_file_content_from_api(content_data["download_url"], {}) 
            elif "content" in content_data and "encoding" in content_data and content_data["encoding"] == "base64":
                content_base64 = content_data["content"].replace("\n", "")
                return base64.b64decode(content_base64).decode("utf-8")
            else:
                raise ValueError("File content not found in GitHub API response (no download_url or direct content).")

    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode('utf-8')
        if access_token and access_token in error_msg: error_msg = error_msg.replace(access_token, "***TOKEN***")
        raise ValueError(f"Error fetching file content: {error_msg}")
    except json.JSONDecodeError: raise ValueError("Invalid JSON response from GitHub API")
    except Exception as e: raise ValueError(f"Failed to get file content: {str(e)}")

def get_gitlab_file_content(repo_url: str, file_path: str, access_token: str = None) -> str:
    try:
        parsed_url = urlparse(repo_url)
        if not parsed_url.scheme or not parsed_url.netloc: raise ValueError("Not a valid GitLab repository URL")
        gitlab_domain = f"{parsed_url.scheme}://{parsed_url.netloc}"
        if parsed_url.port not in (None, 80, 443): gitlab_domain += f":{parsed_url.port}"
        path_parts = parsed_url.path.strip("/").split("/")
        if len(path_parts) < 2: raise ValueError("Invalid GitLab URL format")
        project_path = quote("/".join(path_parts).replace(".git", ""), safe='')
        encoded_file_path = quote(file_path, safe='')
        api_url = f"{gitlab_domain}/api/v4/projects/{project_path}/repository/files/{encoded_file_path}/raw?ref=main" 
        headers = {}
        if access_token: headers["PRIVATE-TOKEN"] = access_token
        content = get_file_content_from_api(api_url, headers)
        try:
            json_error = json.loads(content)
            if isinstance(json_error, dict) and "message" in json_error:
                raise ValueError(f"GitLab API error: {json_error['message']}")
        except json.JSONDecodeError:
            pass 
        return content
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode('utf-8')
        if access_token and access_token in error_msg: error_msg = error_msg.replace(access_token, "***TOKEN***")
        raise ValueError(f"Error fetching file content from GitLab: {error_msg}")
    except Exception as e: raise ValueError(f"Failed to get file content from GitLab: {str(e)}")


def get_bitbucket_file_content(repo_url: str, file_path: str, access_token: str = None) -> str:
    try:
        if not (repo_url.startswith("https://bitbucket.org/") or repo_url.startswith("http://bitbucket.org/")):
            raise ValueError("Not a valid Bitbucket repository URL")
        parts = repo_url.rstrip('/').split('/')
        if len(parts) < 5: raise ValueError("Invalid Bitbucket URL format")
        owner, repo = parts[-2], parts[-1].replace(".git", "")
        api_url = f"https://api.bitbucket.org/2.0/repositories/{owner}/{repo}/src/main/{file_path}" 
        headers = {}
        if access_token: headers["Authorization"] = f"Bearer {access_token}"
        return get_file_content_from_api(api_url, headers)
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode('utf-8')
        if "Not Found" in error_msg or e.returncode == 404 : raise ValueError("File not found on Bitbucket.")
        if "Unauthorized" in error_msg or e.returncode == 401: raise ValueError("Unauthorized access to Bitbucket.")
        if "Forbidden" in error_msg or e.returncode == 403: raise ValueError("Forbidden access to Bitbucket.")
        if access_token and access_token in error_msg: error_msg = error_msg.replace(access_token, "***TOKEN***")
        raise ValueError(f"Error fetching file content from Bitbucket: {error_msg}")
    except Exception as e: raise ValueError(f"Failed to get file content from Bitbucket: {str(e)}")

def get_file_content(repo_url: str, file_path: str, type: str = "github", access_token: str = None) -> str:
    if type == "github": return get_github_file_content(repo_url, file_path, access_token)
    elif type == "gitlab": return get_gitlab_file_content(repo_url, file_path, access_token)
    elif type == "bitbucket": return get_bitbucket_file_content(repo_url, file_path, access_token)
    else: raise ValueError("Unsupported repository type. Only GitHub, GitLab, and Bitbucket are supported.")

class DatabaseManager:
    def __init__(self):
        self.db = None
        self.repo_url_or_path = None
        self.repo_paths = None

    def prepare_database(self, repo_url_or_path: str, type: str = "github", access_token: str = None, local_ollama: bool = False,
                       excluded_dirs: List[str] = None, excluded_files: List[str] = None,
                       included_dirs: List[str] = None, included_files: List[str] = None, chunk_for_fine_tuning: Optional[bool] = None) -> tuple[List[Document], str]:
        chunk_for_fine_tuning = _get_effective_chunk_setting(chunk_for_fine_tuning)
        self.reset_database(); self._create_repo(repo_url_or_path, type, access_token)
        return self.prepare_db_index(local_ollama=local_ollama, excluded_dirs=excluded_dirs, excluded_files=excluded_files,
                                   included_dirs=included_dirs, included_files=included_files, chunk_for_fine_tuning=chunk_for_fine_tuning)

    def reset_database(self):
        self.db, self.repo_url_or_path, self.repo_paths = None, None, None

    def _create_repo(self, repo_url_or_path: str, type: str = "github", access_token: str = None) -> None:
        logger.info(f"Preparing repo storage for {repo_url_or_path}...")
        try:
            root_path = get_adalflow_default_root_path(); os.makedirs(root_path, exist_ok=True)
            if repo_url_or_path.startswith("https://") or repo_url_or_path.startswith("http://"):
                repo_name = repo_url_or_path.split("/")[-1].replace(".git", "")
                save_repo_dir = os.path.join(root_path, "repos", repo_name)
                if not (os.path.exists(save_repo_dir) and os.listdir(save_repo_dir)):
                    download_repo(repo_url_or_path, save_repo_dir, type, access_token)
                else: logger.info(f"Repository already exists at {save_repo_dir}. Using existing repository.")
            else: 
                repo_name = os.path.basename(repo_url_or_path)
                save_repo_dir = repo_url_or_path
            save_db_file = os.path.join(root_path, "databases", f"{repo_name}.pkl")
            os.makedirs(save_repo_dir, exist_ok=True); os.makedirs(os.path.dirname(save_db_file), exist_ok=True)
            self.repo_paths = {"save_repo_dir": save_repo_dir, "save_db_file": save_db_file}
            self.repo_url_or_path = repo_url_or_path
            logger.info(f"Repo paths: {self.repo_paths}")
        except Exception as e: logger.error(f"Failed to create repository structure: {e}"); raise

    def prepare_db_index(self, local_ollama: bool = False, excluded_dirs: List[str] = None, excluded_files: List[str] = None,
                        included_dirs: List[str] = None, included_files: List[str] = None, chunk_for_fine_tuning: Optional[bool] = None) -> tuple[List[Document], str]:
        chunk_for_fine_tuning = _get_effective_chunk_setting(chunk_for_fine_tuning)
        status_message = ""
        db_file_existed_initially = False
        if self.repo_paths: # Ensure repo_paths is not None
            db_file_existed_initially = os.path.exists(self.repo_paths["save_db_file"])

        if db_file_existed_initially:
            logger.info("Attempting to load data from existing database...")
            try:
                self.db = LocalDB.load_state(self.repo_paths["save_db_file"])
                if chunk_for_fine_tuning:
                    raw_documents = self.db.get_documents("__adal__DEFAULT_KEY__") # Use string literal for DEFAULT_KEY
                    if raw_documents:
                        logger.info(f"Loaded {len(raw_documents)} raw documents from cache for fine-tuning.")
                        return raw_documents, "loaded_raw_from_cache"
                    else: 
                        logger.info("No raw documents found in cache for fine-tuning. Reprocessing for fine-tuning.")
                        status_message = "reprocessed_data_fine_tuning"
                else: # RAG mode
                    transformed_documents = self.db.get_transformed_data(key="split_and_embed")
                    if transformed_documents:
                        logger.info(f"Loaded {len(transformed_documents)} transformed documents from cache for RAG.")
                        return transformed_documents, "loaded_transformed_from_cache"
                    else: 
                        logger.info("No transformed documents found in cache for RAG. Reprocessing for RAG.")
                        status_message = "reprocessed_data_rag"
            except Exception as e:
                logger.error(f"Error loading or processing existing database: {e}. Reprocessing.")
                if chunk_for_fine_tuning:
                    status_message = "reprocessed_data_fine_tuning" # Or consider a specific error status
                else:
                    status_message = "reprocessed_data_rag" # Or consider a specific error status
        
        # This block is reached if:
        # 1. DB file did not exist initially.
        # 2. DB file existed, but no suitable data was found (e.g., raw needed, only transformed existed or vice-versa, or DB empty).
        # 3. DB file existed, but an error occurred during loading.
        
        if not status_message: # If status_message wasn't set by a cache miss scenario above
            if db_file_existed_initially: # Should not happen if logic above is complete, but as a fallback
                 logger.warning("DB existed but no suitable data type found and no specific reprocess status set. Defaulting to reprocessing status.")
                 status_message = "reprocessed_data_fine_tuning" if chunk_for_fine_tuning else "reprocessed_data_rag"
            else: # DB file did not exist
                status_message = "initial_processing_fine_tuning" if chunk_for_fine_tuning else "initial_processing_rag"

        logger.info(f"Processing from source with intent: {status_message}")
        
        documents = read_all_documents(self.repo_paths["save_repo_dir"], local_ollama=local_ollama, 
                                   excluded_dirs=excluded_dirs, excluded_files=excluded_files,
                                   included_dirs=included_dirs, included_files=included_files, 
                                   chunk_for_fine_tuning=chunk_for_fine_tuning)
        self.db = transform_documents_and_save_to_db(documents, self.repo_paths["save_db_file"], 
                                                 local_ollama=local_ollama, chunk_for_fine_tuning=chunk_for_fine_tuning)
        logger.info(f"Total documents processed/loaded: {len(documents)}")
        
        # The actual documents to return are based on chunk_for_fine_tuning
        final_docs_to_return = documents if chunk_for_fine_tuning else self.db.get_transformed_data(key="split_and_embed")
        if final_docs_to_return is None and not chunk_for_fine_tuning : # get_transformed_data could return None
             final_docs_to_return = [] # Ensure we always return a list

        logger.info(f"Total final documents returned: {len(final_docs_to_return)}. Status: {status_message}")
        return final_docs_to_return, status_message

    def prepare_retriever(self, repo_url_or_path: str, type: str = "github", access_token: str = None):
        # This method now needs to handle the tuple return from prepare_database
        # For now, it's just a pass-through, but its callers might need adjustment if they expect only documents.
        # However, prepare_database itself calls prepare_db_index, so this method's signature or usage might need review.
        # For this task, we focus on prepare_db_index.
        docs, status = self.prepare_database(repo_url_or_path, type, access_token)
        return docs # Compatibility: returning only docs. Callers of prepare_retriever might need update.
