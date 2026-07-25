import asyncio
import os
from collections.abc import Sized
from uuid import uuid4

import adalflow as adal
from adalflow.components.retriever.faiss_retriever import FAISSRetriever
from adalflow.core.types import AssistantResponse, DialogTurn, UserQuery

from api.config import configs, get_embedder
from api.logger import get_logger
from api.rag.pipeline import DatabaseManager

logger = get_logger(__name__)

# Maximum concurrent RAG preparing count
_RAG_PREPARE_SEMAPHORE: asyncio.Semaphore | None = None


def _get_rag_semaphore() -> asyncio.Semaphore:
    global _RAG_PREPARE_SEMAPHORE
    if _RAG_PREPARE_SEMAPHORE is None:
        _RAG_PREPARE_SEMAPHORE = asyncio.Semaphore(
            int(os.environ.get("DEEPWIKI_MAX_CONCURRENT_RAG", "4"))
        )
    assert isinstance(_RAG_PREPARE_SEMAPHORE, asyncio.Semaphore)
    return _RAG_PREPARE_SEMAPHORE


def check_ollama_model_exists(model_name: str, ollama_host: str | None = None) -> bool:
    """
    Check if an Ollama model exists before attempting to use it.

    Args:
        model_name: Name of the model to check
        ollama_host: Ollama host URL, defaults to localhost:11434

    Returns:
        bool: True if model exists, False otherwise
    """
    import httpx
    import ollama

    if ollama_host is None:
        ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    try:
        # Remove /api prefix if present and add it back
        ollama_host = ollama_host.removesuffix("/api")
        ret: ollama.ListResponse = ollama.Client(host=ollama_host, timeout=5).list()
        is_available = any(model_name == model.model for model in ret.models)
        if is_available:
            logger.info("Ollama model '%s' is available", model_name)
        else:
            logger.warning(
                "Ollama model '%s' is not available. Available models: %s. ",
                model_name,
                str([model.model for model in ret.models]),
            )
        return is_available
    except (httpx.ConnectTimeout, ConnectionError) as e:
        logger.warning(f"Could not connect to Ollama to check models: {e}")
        return False
    except Exception as e:
        logger.warning(f"Error checking Ollama model availability: {e}")
        return False


class CustomConversation(list[DialogTurn]):
    """Custom implementation of Conversation to fix the list assignment index out of range error"""


class Memory(adal.core.component.DataComponent):
    """Simple conversation management with a list of dialog turns."""

    def __init__(self):
        super().__init__()
        # Use our custom implementation instead of the original Conversation class
        self.current_conversation = CustomConversation()

    def call(self) -> dict:
        """Return the conversation history as a dictionary."""
        all_dialog_turns = (
            {}
            if not self.current_conversation
            else {
                dialog_turn.id: dialog_turn for dialog_turn in self.current_conversation
            }
        )
        logger.info(f"Returning {len(all_dialog_turns)} dialog turns from memory")
        return all_dialog_turns

    def add_dialog_turn(self, user_query: str, assistant_response: str) -> None:
        """
        Add a dialog turn to the conversation history.

        Args:
            user_query: The user's query
            assistant_response: The assistant's response

        """
        # Create a new dialog turn using our custom implementation
        dialog_turn = DialogTurn(
            id=str(uuid4()),
            user_query=UserQuery(query_str=user_query),
            assistant_response=AssistantResponse(response_str=assistant_response),
        )

        # Safely append the dialog turn
        self.current_conversation.append(dialog_turn)
        logger.info(
            f"Successfully added dialog turn, now have {len(self.current_conversation)} turns"
        )


from dataclasses import dataclass, field


@dataclass
class RAGAnswer(adal.DataClass):
    rationale: str = field(
        default="", metadata={"desc": "Chain of thoughts for the answer."}
    )
    answer: str = field(
        default="",
        metadata={
            "desc": "Answer to the user query, formatted in markdown for beautiful rendering with react-markdown. DO NOT include ``` triple backticks fences at the beginning or end of your answer."
        },
    )

    __output_fields__ = ["rationale", "answer"]


class RAG(adal.Component):
    """RAG with one repo.
    If you want to load a new repos, call prepare_retriever(repo_url_or_path) first."""

    def __init__(self, provider="google", model=None, use_s3: bool = False):  # noqa: F841 - use_s3 is kept for compatibility
        """
        Initialize the RAG component.

        Args:
            provider: Model provider to use (google, openai, openrouter, ollama)
            model: Model name to use with the provider
            use_s3: Whether to use S3 for database storage (default: False)
        """
        super().__init__()

        self.provider = provider
        self.model = model

        # Import the helper functions
        from api.config import get_embedder_type

        # Determine embedder type based on current configuration
        self.embedder_type = get_embedder_type()
        self.is_ollama_embedder = (
            self.embedder_type == "ollama"
        )  # Backward compatibility

        # Check if Ollama model exists before proceeding
        if self.is_ollama_embedder:
            from api.config import get_embedder_config

            embedder_config = get_embedder_config()
            if embedder_config and embedder_config.get("model_kwargs", {}).get("model"):
                model_name = embedder_config["model_kwargs"]["model"]
                if not check_ollama_model_exists(model_name):
                    raise ValueError(
                        f"Ollama model '{model_name}' not found. Please run 'ollama pull {model_name}' to install it."
                    )

        # Initialize components
        self.memory = Memory()
        self.embedder = get_embedder(embedder_type=self.embedder_type)
        self.initialize_db_manager()

    def initialize_db_manager(self):
        """Initialize the database manager with local storage"""
        self.db_manager = DatabaseManager()
        self.transformed_docs = []

    def _validate_and_filter_embeddings(self, documents: list) -> list:
        """
        Validate embeddings and filter out documents with invalid or mismatched embedding sizes.

        Args:
            documents: List of documents with embeddings

        Returns:
            List of documents with valid embeddings of consistent size
        """
        if not documents:
            logger.warning("No documents provided for embedding validation")
            return []

        valid_documents = []
        embedding_sizes = {}

        # First pass: collect all embedding sizes and count occurrences
        for i, doc in enumerate(documents):
            if not hasattr(doc, "vector") or doc.vector is None:
                logger.warning(f"Document {i} has no embedding vector, skipping")
                continue

            try:
                if hasattr(doc.vector, "shape"):
                    embedding_size = (
                        doc.vector.shape[0]
                        if len(doc.vector.shape) == 1
                        else doc.vector.shape[-1]
                    )
                elif isinstance(doc.vector, Sized):
                    embedding_size = len(doc.vector)
                else:
                    logger.warning(
                        f"Document {i} has invalid embedding vector type: {type(doc.vector)}, skipping"
                    )
                    continue

                if embedding_size == 0:
                    logger.warning(f"Document {i} has empty embedding vector, skipping")
                    continue

                embedding_sizes[embedding_size] = (
                    embedding_sizes.get(embedding_size, 0) + 1
                )

            except Exception as e:
                logger.warning(
                    f"Error checking embedding size for document {i}: {str(e)}, skipping"
                )
                continue

        if not embedding_sizes:
            logger.error("No valid embeddings found in any documents")
            return []

        # Find the most common embedding size (this should be the correct one)
        target_size = max(embedding_sizes.keys(), key=lambda k: embedding_sizes[k])
        logger.info(
            f"Target embedding size: {target_size} (found in {embedding_sizes[target_size]} documents)"
        )

        # Log all embedding sizes found
        for size, count in embedding_sizes.items():
            if size != target_size:
                logger.warning(
                    f"Found {count} documents with incorrect embedding size {size}, will be filtered out"
                )

        # Second pass: filter documents with the target embedding size
        for i, doc in enumerate(documents):
            if not hasattr(doc, "vector") or doc.vector is None:
                continue

            try:
                if hasattr(doc.vector, "shape"):
                    embedding_size = (
                        doc.vector.shape[0]
                        if len(doc.vector.shape) == 1
                        else doc.vector.shape[-1]
                    )
                elif isinstance(doc.vector, Sized):
                    embedding_size = len(doc.vector)
                else:
                    continue

                if embedding_size == target_size:
                    valid_documents.append(doc)
                else:
                    # Log which document is being filtered out
                    file_path = getattr(doc, "meta_data", {}).get(
                        "file_path", f"document_{i}"
                    )
                    logger.warning(
                        f"Filtering out document '{file_path}' due to embedding size mismatch: {embedding_size} != {target_size}"
                    )

            except Exception as e:
                file_path = getattr(doc, "meta_data", {}).get(
                    "file_path", f"document_{i}"
                )
                logger.warning(
                    f"Error validating embedding for document '{file_path}': {str(e)}, skipping"
                )
                continue

        logger.info(
            f"Embedding validation complete: {len(valid_documents)}/{len(documents)} documents have valid embeddings"
        )

        if not valid_documents:
            logger.warning(
                "No documents with valid embeddings remained after filtering"
            )
        elif len(valid_documents) < len(documents):
            filtered_count = len(documents) - len(valid_documents)
            logger.warning(
                f"Filtered out {filtered_count} documents due to embedding issues"
            )

        return valid_documents

    def prepare_retriever(
        self,
        repo_url_or_path: str,
        type: str = "github",
        access_token: str | None = None,
        excluded_dirs: list[str] | None = None,
        excluded_files: list[str] | None = None,
        included_dirs: list[str] | None = None,
        included_files: list[str] | None = None,
    ):
        """
        Prepare the retriever for a repository.
        Will load database from local storage if available.

        Args:
            repo_url_or_path: URL or local path to the repository
            access_token: Optional access token for private repositories
            excluded_dirs: Optional list of directories to exclude from processing
            excluded_files: Optional list of file patterns to exclude from processing
            included_dirs: Optional list of directories to include exclusively
            included_files: Optional list of file patterns to include exclusively
        """
        self.initialize_db_manager()
        self.repo_url_or_path = repo_url_or_path
        self.transformed_docs = self.db_manager.prepare_database(
            repo_url_or_path,
            type,
            access_token,
            embedder_type=self.embedder_type,
            excluded_dirs=excluded_dirs,
            excluded_files=excluded_files,
            included_dirs=included_dirs,
            included_files=included_files,
        )
        logger.info(f"Loaded {len(self.transformed_docs)} documents for retrieval")

        # Validate and filter embeddings to ensure consistent sizes
        self.transformed_docs = self._validate_and_filter_embeddings(
            self.transformed_docs
        )

        if not self.transformed_docs:
            raise ValueError(
                "No valid documents with embeddings found. Cannot create retriever."
            )

        logger.info(
            f"Using {len(self.transformed_docs)} documents with valid embeddings for retrieval"
        )

        try:
            # Use the appropriate embedder for retrieval
            self.retriever = FAISSRetriever(
                **configs["retriever"],
                embedder=self.embedder,
                documents=self.transformed_docs,
                document_map_func=lambda doc: doc.vector,
            )
            logger.info("FAISS retriever created successfully")
        except Exception as e:
            logger.error(f"Error creating FAISS retriever: {str(e)}")
            # Try to provide more specific error information
            if "All embeddings should be of the same size" in str(e):
                logger.error(
                    "Embedding size validation failed. This suggests there are still inconsistent embedding sizes."
                )
                # Log embedding sizes for debugging
                sizes = []
                for i, doc in enumerate(
                    self.transformed_docs[:10]
                ):  # Check first 10 docs
                    if hasattr(doc, "vector") and doc.vector is not None:
                        try:
                            if isinstance(doc.vector, list):
                                size = len(doc.vector)
                            elif hasattr(doc.vector, "shape"):
                                size = (
                                    doc.vector.shape[0]
                                    if len(doc.vector.shape) == 1
                                    else doc.vector.shape[-1]
                                )
                            elif hasattr(doc.vector, "__len__"):
                                size = len(doc.vector)
                            else:
                                size = "unknown"
                            sizes.append(f"doc_{i}: {size}")
                        except Exception:
                            sizes.append(f"doc_{i}: error")
                logger.error(f"Sample embedding sizes: {', '.join(sizes)}")
            raise

    async def aprepare_retriever(
        self,
        repo_url_or_path: str,
        type: str = "github",
        access_token: str | None = None,
        excluded_dirs: list[str] | None = None,
        excluded_files: list[str] | None = None,
        included_dirs: list[str] | None = None,
        included_files: list[str] | None = None,
    ):
        """Async version of the original `prepare_retriever`.

        Reuse the synchronous `prepare_retriever` implementation, but runs it in
        a worker thread via `asyncio.to_thread` so that blocking operations (such
        as git.clone, file io, embedding calls) do not stall the outer event loop.
        Concurrency is bounded by a module-level semaphore, set by system variable
        'DEEPWIKI_MAX_CONCURRENT_RAG'.

        Args:
            repo_url_or_path: URL or local path to the repository
            access_token: Optional access token for private repositories
            excluded_dirs: Optional list of directories to exclude from processing
            excluded_files: Optional list of file patterns to exclude from processing
            included_dirs: Optional list of directories to include exclusively
            included_files: Optional list of file patterns to include exclusively
        """
        async with _get_rag_semaphore():
            return await asyncio.to_thread(
                self.prepare_retriever,
                repo_url_or_path,
                type=type,
                access_token=access_token,
                excluded_dirs=excluded_dirs,
                excluded_files=excluded_files,
                included_dirs=included_dirs,
                included_files=included_files,
            )

    def call(self, query: str, language: str = "en") -> tuple[list]:
        """
        Process a query using RAG.

        Args:
            query: The user's query

        Returns:
            Tuple of (RAGAnswer, retrieved_documents)
        """
        try:
            retrieved_documents = self.retriever(query)

            # Fill in the documents
            retrieved_documents[0].documents = [
                self.transformed_docs[doc_index]
                for doc_index in retrieved_documents[0].doc_indices
            ]

            return retrieved_documents

        except Exception:
            logger.exception("Error in RAG call.")

            # Create error response
            error_response = RAGAnswer(
                rationale="Error occurred while processing the query.",
                answer=f"I apologize, but I encountered an error while processing your question. Please try again or rephrase your question.",
            )
            return error_response, []

    async def acall(self, query: str, language: str = "en") -> tuple[list]:
        """Async version of the original `call` method."""
        return await asyncio.to_thread(self.call, query, language)
