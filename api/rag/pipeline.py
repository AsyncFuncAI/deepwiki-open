import os
from pathlib import Path

import adalflow as adal
import tiktoken
from adalflow.components.data_process import TextSplitter, ToEmbeddings
from adalflow.core.db import LocalDB
from adalflow.core.types import Document, List

from api.config import (
    configs,
    get_embedder,
    iterate_files,
)
from api.logger import get_logger
from api.repository import Repo

logger = get_logger(__name__)

# Maximum token limit for OpenAI embedding models
MAX_EMBEDDING_TOKENS = 8192


def count_tokens(
    text: str, embedder_type: str = None, is_ollama_embedder: bool = None
) -> int:
    """
    Count the number of tokens in a text string using tiktoken.

    Args:
        text (str): The text to count tokens for.
        embedder_type (str, optional): The embedder type ('openai', 'google', 'ollama', 'bedrock').
                                     If None, will be determined from configuration.
        is_ollama_embedder (bool, optional): DEPRECATED. Use embedder_type instead.
                                           If None, will be determined from configuration.

    Returns:
        int: The number of tokens in the text.
    """
    try:
        # Handle backward compatibility
        if embedder_type is None and is_ollama_embedder is not None:
            embedder_type = "ollama" if is_ollama_embedder else None

        # Determine embedder type if not specified
        if embedder_type is None:
            from api.config import get_embedder_type

            embedder_type = get_embedder_type()

        # Choose encoding based on embedder type
        if embedder_type == "ollama":
            # Ollama typically uses cl100k_base encoding
            encoding = tiktoken.get_encoding("cl100k_base")
        elif embedder_type == "google":
            # Google uses similar tokenization to GPT models for rough estimation
            encoding = tiktoken.get_encoding("cl100k_base")
        elif embedder_type == "bedrock":
            # Bedrock embedding models vary; use a common GPT-like encoding for rough estimation
            encoding = tiktoken.get_encoding("cl100k_base")
        else:  # OpenAI or default
            # Use OpenAI embedding model encoding
            encoding = tiktoken.encoding_for_model("text-embedding-3-small")

        return len(encoding.encode(text))
    except Exception as e:
        # Fallback to a simple approximation if tiktoken fails
        logger.warning(f"Error counting tokens with tiktoken: {e}")
        # Rough approximation: 4 characters per token
        return len(text) // 4


def read_all_documents(
    path: str,
    embedder_type: str = None,
    is_ollama_embedder: bool = None,
    excluded_dirs: list[str] | None = None,
    excluded_files: list[str] | None = None,
    included_dirs: list[str] | None = None,
    included_files: list[str] | None = None,
):
    """
    Recursively reads all documents in a directory and its subdirectories.

    Args:
        path (str): The root directory path.
        embedder_type (str, optional): The embedder type ('openai', 'google', 'ollama').
                                     If None, will be determined from configuration.
        is_ollama_embedder (bool, optional): DEPRECATED. Use embedder_type instead.
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
    # Handle backward compatibility
    if embedder_type is None and is_ollama_embedder is not None:
        embedder_type = "ollama" if is_ollama_embedder else None
    documents = []
    code_extensions = configs.get("code_extensions", [])

    logger.info(f"Reading documents from {path}")

    # Single source of truth for which files to process (see config.iterate_files).
    for relative_path in iterate_files(
        path,
        excluded_dirs=excluded_dirs,
        excluded_files=excluded_files,
        included_dirs=included_dirs,
        included_files=included_files,
    ):
        file_path = Path(path) / relative_path
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Check token count
            token_count = count_tokens(content, embedder_type)
            if token_count > MAX_EMBEDDING_TOKENS * 10:
                logger.warning(
                    f"Skipping large file {relative_path}: Token count ({token_count}) exceeds limit"
                )
                continue

            file_ext = file_path.suffix.lower()
            is_code = file_ext in code_extensions
            # Determine if this is an implementation file
            if is_code:
                is_implementation = (
                    not relative_path.startswith("test_")
                    and not relative_path.startswith("app_")
                    and "test" not in relative_path.lower()
                )
            else:
                is_implementation = False

            doc = Document(
                text=content,
                meta_data={
                    "file_path": relative_path,
                    "type": file_ext,
                    "is_code": is_code,
                    "is_implementation": is_implementation,
                    "title": relative_path,
                    "token_count": token_count,
                },
            )
            documents.append(doc)
        except Exception as e:
            logger.error(f"Error reading {file_path}: {e}")

    logger.info(f"Found {len(documents)} documents")
    return documents


def get_repo_db(repo: Repo) -> str:
    if not repo.root_path:
        raise ValueError(f"Repo root path is empty: {repo}")
    save_db_file = os.path.join(repo.root_path, "databases", f"{repo.name}.pkl")
    return save_db_file


def repo_index_exist(repo: Repo) -> bool:
    return os.path.exists(get_repo_db(repo))


class LineTrackingTextSplitter(TextSplitter):
    """TextSplitter that annotates each chunk with its 1-based start/end line.

    adalflow's ``TextSplitter`` deep-copies the parent ``meta_data`` once and shares
    that single dict across every chunk of the same document, so we first give each
    chunk its own copy before writing per-chunk line numbers. Token chunks are exact
    substrings of the parent text, so each chunk is located with an order-preserving
    substring search to compute its line range.
    """

    def call(self, documents):
        parent_text = {doc.id: (doc.text or "") for doc in documents}
        split_docs = super().call(documents)

        chunks_by_parent = {}
        for chunk in split_docs:
            chunks_by_parent.setdefault(chunk.parent_doc_id, []).append(chunk)

        for parent_id, chunks in chunks_by_parent.items():
            text = parent_text.get(parent_id, "")
            cursor = 0
            for chunk in sorted(chunks, key=lambda c: c.order):
                # Each chunk needs its own meta_data copy (the parent shares one dict).
                chunk.meta_data = dict(chunk.meta_data or {})
                pos = text.find(chunk.text, cursor)
                if pos == -1:
                    pos = text.find(chunk.text)  # fall back to a global search
                if pos == -1:
                    continue  # leave line numbers unset if the chunk can't be located
                start_line = text.count("\n", 0, pos) + 1
                end_line = start_line + chunk.text.count("\n")
                chunk.meta_data["start_line"] = start_line
                chunk.meta_data["end_line"] = end_line
                cursor = pos + 1
        return split_docs


def prepare_data_pipeline(embedder_type: str = None, is_ollama_embedder: bool = None):
    """
    Creates and returns the data transformation pipeline.

    Args:
        embedder_type (str, optional): The embedder type ('openai', 'google', 'ollama').
                                     If None, will be determined from configuration.
        is_ollama_embedder (bool, optional): DEPRECATED. Use embedder_type instead.
                                           If None, will be determined from configuration.

    Returns:
        adal.Sequential: The data transformation pipeline
    """
    from api.config import get_embedder_config, get_embedder_type

    # Handle backward compatibility
    if embedder_type is None and is_ollama_embedder is not None:
        embedder_type = "ollama" if is_ollama_embedder else None

    # Determine embedder type if not specified
    if embedder_type is None:
        embedder_type = get_embedder_type()

    splitter = LineTrackingTextSplitter(**configs["text_splitter"])
    embedder_config = get_embedder_config()

    embedder = get_embedder(embedder_type=embedder_type)

    batch_size = embedder_config.get("batch_size", 500)
    embedder_transformer = ToEmbeddings(embedder=embedder, batch_size=batch_size)

    data_transformer = adal.Sequential(
        splitter, embedder_transformer
    )  # sequential will chain together splitter and embedder
    return data_transformer


def transform_documents_and_save_to_db(
    documents: List[Document],
    db_path: str,
    embedder_type: str = None,
    is_ollama_embedder: bool = None,
) -> LocalDB:
    """
    Transforms a list of documents and saves them to a local database.

    Args:
        documents (list): A list of `Document` objects.
        db_path (str): The path to the local database file.
        embedder_type (str, optional): The embedder type ('openai', 'google', 'ollama').
                                     If None, will be determined from configuration.
        is_ollama_embedder (bool, optional): DEPRECATED. Use embedder_type instead.
                                           If None, will be determined from configuration.
    """
    # Get the data transformer
    data_transformer = prepare_data_pipeline(embedder_type, is_ollama_embedder)

    # Save the documents to a local database
    db = LocalDB()
    db.register_transformer(transformer=data_transformer, key="split_and_embed")
    db.load(documents)
    db.transform(key="split_and_embed")
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    db.save_state(filepath=db_path)
    return db


class DatabaseManager:
    """
    Manages the creation, loading, transformation, and persistence of LocalDB instances.
    """

    def __init__(self):
        self.db = None
        self.repo_url_or_path = None
        self.repo_paths = None

    def prepare_database(
        self,
        repo_url_or_path: str,
        repo_type: str = None,
        access_token: str = None,
        embedder_type: str = None,
        is_ollama_embedder: bool = None,
        excluded_dirs: List[str] = None,
        excluded_files: List[str] = None,
        included_dirs: List[str] = None,
        included_files: List[str] = None,
    ) -> List[Document]:
        """
        Create a new database from the repository.

        Args:
            repo_type(str): Type of repository
            repo_url_or_path (str): The URL or local path of the repository
            access_token (str, optional): Access token for private repositories
            embedder_type (str, optional): Embedder type to use ('openai', 'google', 'ollama').
                                         If None, will be determined from configuration.
            is_ollama_embedder (bool, optional): DEPRECATED. Use embedder_type instead.
                                               If None, will be determined from configuration.
            excluded_dirs (List[str], optional): List of directories to exclude from processing
            excluded_files (List[str], optional): List of file patterns to exclude from processing
            included_dirs (List[str], optional): List of directories to include exclusively
            included_files (List[str], optional): List of file patterns to include exclusively

        Returns:
            List[Document]: List of Document objects
        """
        # Handle backward compatibility
        if embedder_type is None and is_ollama_embedder is not None:
            embedder_type = "ollama" if is_ollama_embedder else None

        self.reset_database()
        self._create_repo(repo_url_or_path, repo_type, access_token)
        return self.prepare_db_index(
            embedder_type=embedder_type,
            excluded_dirs=excluded_dirs,
            excluded_files=excluded_files,
            included_dirs=included_dirs,
            included_files=included_files,
        )

    def reset_database(self):
        """
        Reset the database to its initial state.
        """
        self.db = None
        self.repo_url_or_path = None
        self.repo_paths = None

    def _create_repo(
        self, repo_url_or_path: str, repo_type: str = None, access_token: str = None
    ) -> None:
        """
        Download and prepare all paths.
        Paths:
        ~/.adalflow/repos/{owner}_{repo_name} (for url, local path will be the same)
        ~/.adalflow/databases/{owner}_{repo_name}.pkl

        Args:
            repo_type(str): Type of repository
            repo_url_or_path (str): The URL or local path of the repository
            access_token (str, optional): Access token for private repositories
        """
        logger.info(f"Preparing repo storage for {repo_url_or_path}...")

        try:
            # Strip whitespace to handle URLs with leading/trailing spaces
            repo_url_or_path = repo_url_or_path.strip()
            repo = Repo(
                repo_url=repo_url_or_path,
                repo_type=repo_type,
                access_token=access_token,
            )
            logger.info(f"Extracted repo name: {repo.name}")
            if not repo.downloaded:
                repo.download()
            else:
                logger.info(
                    f"Repository already exists at {repo.save_path}. Using existing repository."
                )

            save_db_file = get_repo_db(repo)
            os.makedirs(os.path.dirname(save_db_file), exist_ok=True)

            self.repo_paths = {
                "save_repo_dir": repo.save_path,
                "save_db_file": save_db_file,
            }
            self.repo_url_or_path = repo_url_or_path
            logger.info(f"Repo paths: {self.repo_paths}")

        except Exception as e:
            logger.error(f"Failed to create repository structure: {e}")
            raise

    def prepare_db_index(
        self,
        embedder_type: str = None,
        is_ollama_embedder: bool = None,
        excluded_dirs: List[str] = None,
        excluded_files: List[str] = None,
        included_dirs: List[str] = None,
        included_files: List[str] = None,
    ) -> List[Document]:
        """
        Prepare the indexed database for the repository.

        Args:
            embedder_type (str, optional): Embedder type to use ('openai', 'google', 'ollama').
                                         If None, will be determined from configuration.
            is_ollama_embedder (bool, optional): DEPRECATED. Use embedder_type instead.
                                               If None, will be determined from configuration.
            excluded_dirs (List[str], optional): List of directories to exclude from processing
            excluded_files (List[str], optional): List of file patterns to exclude from processing
            included_dirs (List[str], optional): List of directories to include exclusively
            included_files (List[str], optional): List of file patterns to include exclusively

        Returns:
            List[Document]: List of Document objects
        """

        def _embedding_vector_length(doc: Document) -> int:
            vector = getattr(doc, "vector", None)
            if vector is None:
                return 0
            try:
                if hasattr(vector, "shape"):
                    if len(vector.shape) == 0:
                        return 0
                    return int(vector.shape[-1])
                if hasattr(vector, "__len__"):
                    return int(len(vector))
            except Exception:
                return 0
            return 0

        # Handle backward compatibility
        if embedder_type is None and is_ollama_embedder is not None:
            embedder_type = "ollama" if is_ollama_embedder else None
        # check the database
        if self.repo_paths and os.path.exists(self.repo_paths["save_db_file"]):
            logger.info("Loading existing database...")
            try:
                self.db = LocalDB.load_state(self.repo_paths["save_db_file"])
                documents = self.db.get_transformed_data(key="split_and_embed")
                if documents:
                    lengths = [_embedding_vector_length(doc) for doc in documents]
                    non_empty = sum(1 for n in lengths if n > 0)
                    empty = len(lengths) - non_empty
                    sample_sizes = sorted({n for n in lengths if n > 0})[:3]
                    logger.info(
                        "Loaded %s documents from existing database (embeddings: %s non-empty, %s empty; sample_dims=%s)",
                        len(documents),
                        non_empty,
                        empty,
                        sample_sizes,
                    )

                    if non_empty == 0:
                        logger.warning(
                            "Existing database contains no usable embeddings. Rebuilding embeddings..."
                        )
                    else:
                        return documents
            except Exception as e:
                logger.error(f"Error loading existing database: {e}")
                # Continue to create a new database

        # prepare the database
        logger.info("Creating new database...")
        documents = read_all_documents(
            self.repo_paths["save_repo_dir"],
            embedder_type=embedder_type,
            excluded_dirs=excluded_dirs,
            excluded_files=excluded_files,
            included_dirs=included_dirs,
            included_files=included_files,
        )
        self.db = transform_documents_and_save_to_db(
            documents, self.repo_paths["save_db_file"], embedder_type=embedder_type
        )
        logger.info(f"Total documents: {len(documents)}")
        transformed_docs = self.db.get_transformed_data(key="split_and_embed")
        logger.info(f"Total transformed documents: {len(transformed_docs)}")
        return transformed_docs

    def prepare_retriever(
        self, repo_url_or_path: str, repo_type: str = None, access_token: str = None
    ):
        """
        Prepare the retriever for a repository.
        This is a compatibility method for the isolated API.

        Args:
            repo_type(str): Type of repository
            repo_url_or_path (str): The URL or local path of the repository
            access_token (str, optional): Access token for private repositories

        Returns:
            List[Document]: List of Document objects
        """
        return self.prepare_database(repo_url_or_path, repo_type, access_token)
