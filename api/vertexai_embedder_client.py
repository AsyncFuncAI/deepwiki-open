"""
Vertex AI Embedder Client using Application Default Credentials (ADC).
Provides text embeddings via Google Cloud Vertex AI.
"""

import logging
import os
from typing import Any, Dict, List, Optional, Union

from google.auth import default
from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel, TextEmbeddingInput

from adalflow.core.model_client import ModelClient
from adalflow.core.types import ModelType, EmbedderOutput, Embedding

logger = logging.getLogger(__name__)

# Vertex AI token limits (conservative estimates to leave safety margin)
MAX_TOKENS_PER_REQUEST = 18000  # Under 20K limit for safety
APPROXIMATE_CHARS_PER_TOKEN = 4  # Conservative estimate for English text


class VertexAIEmbedderClient(ModelClient):
    """
    Google Cloud Vertex AI embedder client using ADC authentication.

    Supports:
    - text-embedding-004 (latest multilingual model)
    - text-embedding-005 (if available)
    - text-multilingual-embedding-002

    Authentication:
    - Uses Application Default Credentials (ADC)
    - No API keys required
    - Supports service accounts, workload identity, gcloud auth

    Environment Variables:
    - GOOGLE_CLOUD_PROJECT: GCP project ID (required)
    - GOOGLE_CLOUD_LOCATION: GCP region (default: us-central1)
    """

    def __init__(
        self,
        project_id: Optional[str] = None,
        location: Optional[str] = None,
    ):
        """
        Initialize Vertex AI embedder client with ADC.

        Args:
            project_id: GCP project ID. If None, reads from GOOGLE_CLOUD_PROJECT env var.
            location: GCP region. If None, reads from GOOGLE_CLOUD_LOCATION env var (default: us-central1).
        """
        super().__init__()

        # Get project and location
        self.project_id = project_id or os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = location or os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

        if not self.project_id:
            raise ValueError(
                "GOOGLE_CLOUD_PROJECT environment variable must be set, "
                "or project_id must be provided"
            )

        # Initialize Vertex AI with ADC
        self._initialize_vertex_ai()

        logger.info(
            f"Initialized VertexAIEmbedderClient with project={self.project_id}, "
            f"location={self.location}"
        )

    def _initialize_vertex_ai(self):
        """Initialize Vertex AI using Application Default Credentials."""
        try:
            # Verify ADC are available
            credentials, project = default()
            logger.info(f"ADC found for project: {project}")

            # Initialize Vertex AI SDK
            aiplatform.init(
                project=self.project_id,
                location=self.location,
                credentials=credentials
            )

            logger.info("Vertex AI initialized successfully with ADC")

        except Exception as e:
            logger.error(f"Failed to initialize Vertex AI with ADC: {e}")
            raise ValueError(
                f"Could not initialize Vertex AI with ADC. "
                f"Ensure you have valid credentials (gcloud auth application-default login). "
                f"Error: {e}"
            )

    def init_sync_client(self):
        """
        Initialize the synchronous Vertex AI embedding model.

        Returns:
            TextEmbeddingModel instance
        """
        # Model is initialized lazily in call() method
        return None

    def _estimate_tokens(self, text: str) -> int:
        """
        Estimate token count for a text string.

        Uses a simple character-based heuristic since we don't have access
        to the actual Vertex AI tokenizer.

        Args:
            text: Text to estimate tokens for

        Returns:
            Estimated token count
        """
        return len(text) // APPROXIMATE_CHARS_PER_TOKEN

    def _split_into_token_limited_batches(
        self,
        texts: List[str],
        max_tokens: int = MAX_TOKENS_PER_REQUEST
    ) -> List[List[str]]:
        """
        Split a list of texts into batches that respect token limits.

        Args:
            texts: List of text strings
            max_tokens: Maximum tokens per batch

        Returns:
            List of text batches, each under the token limit
        """
        batches = []
        current_batch = []
        current_tokens = 0

        for text in texts:
            estimated_tokens = self._estimate_tokens(text)

            # If single text exceeds limit, it will be auto-truncated by Vertex AI
            # Just add it to its own batch
            if estimated_tokens > max_tokens:
                if current_batch:
                    batches.append(current_batch)
                    current_batch = []
                    current_tokens = 0
                batches.append([text])
                continue

            # If adding this text would exceed limit, start new batch
            if current_tokens + estimated_tokens > max_tokens:
                if current_batch:
                    batches.append(current_batch)
                current_batch = [text]
                current_tokens = estimated_tokens
            else:
                current_batch.append(text)
                current_tokens += estimated_tokens

        # Add remaining texts
        if current_batch:
            batches.append(current_batch)

        return batches

    def parse_embedding_response(
        self, response: Any
    ) -> EmbedderOutput:
        """
        Parse Vertex AI embedding response into EmbedderOutput format.

        Args:
            response: List of TextEmbedding objects from Vertex AI, or EmbedderOutput

        Returns:
            EmbedderOutput with embeddings and metadata
        """
        try:
            # Check if response is already an EmbedderOutput (from recursive call)
            if isinstance(response, EmbedderOutput):
                return response

            # Check if response is None
            if response is None:
                logger.error("Received None as embedding response")
                return EmbedderOutput(
                    data=[],
                    error="Received None as embedding response from Vertex AI",
                    raw_response=None,
                )

            # Extract embeddings (response is a list of TextEmbedding objects)
            embedding_objects = []
            for idx, embedding_obj in enumerate(response):
                # TextEmbedding.values is the actual embedding vector
                if embedding_obj and hasattr(embedding_obj, 'values'):
                    embedding_objects.append(
                        Embedding(embedding=embedding_obj.values, index=idx)
                    )
                else:
                    logger.warning(f"Skipping invalid embedding object: {embedding_obj}")

            # Check if we got any valid embeddings
            if not embedding_objects:
                logger.error("No valid embeddings found in response")
                return EmbedderOutput(
                    data=[],
                    error="No valid embeddings found in response",
                    raw_response=response,
                )

            # Create EmbedderOutput
            output = EmbedderOutput(
                data=embedding_objects,
                error=None,
                raw_response=response,
            )

            return output

        except Exception as e:
            logger.error(f"Error parsing embedding response: {e}")
            return EmbedderOutput(
                data=[],
                error=str(e),
                raw_response=response,
            )

    def call(
        self,
        api_kwargs: Dict[str, Any] = {},
        model_type: Optional[str] = None
    ) -> EmbedderOutput:
        """
        Generate embeddings for input text(s).

        Args:
            api_kwargs: API parameters including:
                - input: Single text string or list of text strings
                - model_kwargs: Model parameters (model, task_type, auto_truncate)
            model_type: Type of model (should be EMBEDDER for embedding tasks)

        Returns:
            EmbedderOutput with embeddings
        """
        try:
            # Extract input and model_kwargs from api_kwargs
            input_data = api_kwargs.get("input")
            model_kwargs = api_kwargs.get("model_kwargs", {})

            if input_data is None:
                raise ValueError("Input data is required in api_kwargs")

            # Get model parameters
            model_name = model_kwargs.get("model", "text-embedding-004")
            task_type = model_kwargs.get("task_type", "SEMANTIC_SIMILARITY")
            auto_truncate = model_kwargs.get("auto_truncate", True)

            # Load the embedding model
            model = TextEmbeddingModel.from_pretrained(model_name)

            # Convert input to list if single string
            texts = [input_data] if isinstance(input_data, str) else input_data

            # Split texts into token-limited batches to avoid API errors
            text_batches = self._split_into_token_limited_batches(texts)
            total_batches = len(text_batches)

            logger.debug(
                f"Generating embeddings for {len(texts)} texts with model {model_name}, "
                f"split into {total_batches} token-limited batches"
            )

            # Process each batch and collect results
            all_embeddings = []

            for batch_idx, text_batch in enumerate(text_batches):
                batch_size = len(text_batch)
                estimated_tokens = sum(self._estimate_tokens(t) for t in text_batch)

                logger.debug(
                    f"Processing batch {batch_idx + 1}/{total_batches}: "
                    f"{batch_size} texts, ~{estimated_tokens} tokens"
                )

                # gemini-embedding-001 only accepts single input per request
                # Process one at a time instead of batching
                if model_name == "gemini-embedding-001":
                    batch_embeddings = []
                    for text in text_batch:
                        embedding_input = TextEmbeddingInput(text=text, task_type=task_type)
                        result = model.get_embeddings([embedding_input], auto_truncate=auto_truncate)
                        if result:
                            batch_embeddings.extend(result)
                else:
                    # Legacy models support batch processing
                    embedding_inputs = [
                        TextEmbeddingInput(text=text, task_type=task_type)
                        for text in text_batch
                    ]
                    batch_embeddings = model.get_embeddings(
                        embedding_inputs,
                        auto_truncate=auto_truncate
                    )

                if batch_embeddings:
                    all_embeddings.extend(batch_embeddings)

            # Use all collected embeddings
            embeddings = all_embeddings

            # Check if embeddings were generated
            if not embeddings:
                logger.error("No embeddings returned from Vertex AI")
                return EmbedderOutput(
                    data=[],
                    error="No embeddings returned from Vertex AI",
                    raw_response=None,
                )

            # Extract embedding vectors and wrap them in Embedding objects
            embedding_objects = []
            for idx, embedding_obj in enumerate(embeddings):
                if embedding_obj and hasattr(embedding_obj, 'values'):
                    # Create Embedding object with the vector
                    embedding_objects.append(
                        Embedding(embedding=embedding_obj.values, index=idx)
                    )
                else:
                    logger.warning(f"Skipping invalid embedding object: {embedding_obj}")

            # Check if we got any valid embeddings
            if not embedding_objects:
                logger.error("No valid embeddings extracted")
                return EmbedderOutput(
                    data=[],
                    error="No valid embeddings extracted from response",
                    raw_response=embeddings,
                )

            return EmbedderOutput(
                data=embedding_objects,
                error=None,
                raw_response=embeddings,
            )

        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return EmbedderOutput(
                data=[],
                error=str(e),
                raw_response=None,
            )

    async def acall(
        self,
        api_kwargs: Dict[str, Any] = {},
        model_type: Optional[str] = None
    ) -> EmbedderOutput:
        """
        Async version of call(). Vertex AI SDK doesn't have native async,
        so we just call the sync version.

        For production use, consider using asyncio.to_thread() to avoid blocking.

        Args:
            api_kwargs: API parameters (same as call())
            model_type: Type of model (same as call())

        Returns:
            EmbedderOutput with embeddings
        """
        # For now, just call sync version
        # TODO: Implement proper async with asyncio.to_thread() if needed
        return self.call(api_kwargs, model_type)

    def convert_inputs_to_api_kwargs(
        self,
        input: Union[str, List[str]],
        model_kwargs: Dict[str, Any] = {},
        model_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Convert inputs to API kwargs format.

        This is a helper method for the ModelClient interface.

        Args:
            input: Text or list of texts to embed
            model_kwargs: Model-specific parameters
            model_type: Type of model (not used for embeddings, but required by interface)

        Returns:
            Dictionary of API kwargs
        """
        return {
            "input": input,
            "model_kwargs": model_kwargs,
        }
