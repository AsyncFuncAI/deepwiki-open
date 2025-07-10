"""Google AI Embeddings ModelClient integration."""

import os
import logging
import backoff
from typing import Dict, Any, Optional, List, Sequence

from adalflow.core.model_client import ModelClient
from adalflow.core.types import ModelType, EmbedderOutput

try:
    import google.generativeai as genai
    from google.generativeai.types.text_types import EmbeddingDict, BatchEmbeddingDict
except ImportError:
    raise ImportError("google-generativeai is required. Install it with 'pip install google-generativeai'")

log = logging.getLogger(__name__)


class GoogleEmbedderClient(ModelClient):
    __doc__ = r"""A component wrapper for Google AI Embeddings API client.

    This client provides access to Google's embedding models through the Google AI API.
    It supports text embeddings for various tasks including semantic similarity,
    retrieval, and classification.

    Args:
        api_key (Optional[str]): Google AI API key. Defaults to None.
            If not provided, will use the GOOGLE_API_KEY environment variable.
        env_api_key_name (str): Environment variable name for the API key.
            Defaults to "GOOGLE_API_KEY".

    Example:
        ```python
        from api.google_embedder_client import GoogleEmbedderClient
        import adalflow as adal

        client = GoogleEmbedderClient()
        embedder = adal.Embedder(
            model_client=client,
            model_kwargs={
                "model": "text-embedding-004",
                "task_type": "SEMANTIC_SIMILARITY"
            }
        )
        ```

    References:
        - Google AI Embeddings: https://ai.google.dev/gemini-api/docs/embeddings
        - Available models: text-embedding-004, embedding-001
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        env_api_key_name: str = "GOOGLE_API_KEY",
    ):
        """Initialize Google AI Embeddings client.
        
        Args:
            api_key: Google AI API key. If not provided, uses environment variable.
            env_api_key_name: Name of environment variable containing API key.
        """
        super().__init__()
        self._api_key = api_key
        self._env_api_key_name = env_api_key_name
        self._initialize_client()

    def _initialize_client(self):
        """Initialize the Google AI client with API key."""
        api_key = self._api_key or os.getenv(self._env_api_key_name)
        if not api_key:
            raise ValueError(
                f"Environment variable {self._env_api_key_name} must be set"
            )
        genai.configure(api_key=api_key)

    def parse_embedding_response(self, response) -> EmbedderOutput:
        """Parse Google AI embedding response to EmbedderOutput format.
        
        Args:
            response: Google AI embedding response (EmbeddingDict or BatchEmbeddingDict)
            
        Returns:
            EmbedderOutput with parsed embeddings
        """
        try:
            from adalflow.core.types import Embedding
            
            embedding_data = []
            
            if isinstance(response, dict):
                if 'embedding' in response:
                    embedding_value = response['embedding']
                    if isinstance(embedding_value, list) and len(embedding_value) > 0:
                        # Check if it's a single embedding (list of floats) or batch (list of lists)
                        if isinstance(embedding_value[0], (int, float)):
                            # Single embedding response: {'embedding': [float, ...]}
                            embedding_data = [Embedding(embedding=embedding_value, index=0)]
                        else:
                            # Batch embeddings response: {'embedding': [[float, ...], [float, ...], ...]}
                            embedding_data = [
                                Embedding(embedding=emb_list, index=i) 
                                for i, emb_list in enumerate(embedding_value)
                            ]
                    else:
                        log.warning(f"Empty or invalid embedding data: {embedding_value}")
                        embedding_data = []
                elif 'embeddings' in response:
                    # Alternative batch format: {'embeddings': [{'embedding': [float, ...]}, ...]}
                    embedding_data = [
                        Embedding(embedding=item['embedding'], index=i) 
                        for i, item in enumerate(response['embeddings'])
                    ]
                else:
                    log.warning(f"Unexpected response structure: {response.keys()}")
                    embedding_data = []
            elif hasattr(response, 'embeddings'):
                # Custom batch response object from our implementation
                embedding_data = [
                    Embedding(embedding=emb, index=i) 
                    for i, emb in enumerate(response.embeddings)
                ]
            else:
                log.warning(f"Unexpected response type: {type(response)}")
                embedding_data = []
            
            return EmbedderOutput(
                data=embedding_data,
                error=None,
                raw_response=response
            )
        except Exception as e:
            log.error(f"Error parsing Google AI embedding response: {e}")
            return EmbedderOutput(
                data=[],
                error=str(e),
                raw_response=response
            )

    def convert_inputs_to_api_kwargs(
        self,
        input: Optional[Any] = None,
        model_kwargs: Dict = {},
        model_type: ModelType = ModelType.UNDEFINED,
    ) -> Dict:
        """Convert inputs to Google AI API format.
        
        Args:
            input: Text input(s) to embed
            model_kwargs: Model parameters including model name and task_type
            model_type: Should be ModelType.EMBEDDER for this client
            
        Returns:
            Dict: API kwargs for Google AI embedding call
        """
        if model_type != ModelType.EMBEDDER:
            raise ValueError(f"GoogleEmbedderClient only supports EMBEDDER model type, got {model_type}")
        
        # Ensure input is a list
        if isinstance(input, str):
            content = [input]
        elif isinstance(input, Sequence):
            content = list(input)
        else:
            raise TypeError("input must be a string or sequence of strings")
        
        final_model_kwargs = model_kwargs.copy()
        
        # Handle single vs batch embedding
        if len(content) == 1:
            final_model_kwargs["content"] = content[0]
        else:
            final_model_kwargs["contents"] = content
            
        # Set default task type if not provided
        if "task_type" not in final_model_kwargs:
            final_model_kwargs["task_type"] = "SEMANTIC_SIMILARITY"
            
        # Set default model if not provided
        if "model" not in final_model_kwargs:
            final_model_kwargs["model"] = "text-embedding-004"
            
        return final_model_kwargs

    @backoff.on_exception(
        backoff.expo,
        (Exception,),  # Google AI may raise various exceptions
        max_time=5,
    )
    def call(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        """Call Google AI embedding API.
        
        Args:
            api_kwargs: API parameters
            model_type: Should be ModelType.EMBEDDER
            
        Returns:
            Google AI embedding response
        """
        if model_type != ModelType.EMBEDDER:
            raise ValueError(f"GoogleEmbedderClient only supports EMBEDDER model type")
            
        log.info(f"Google AI Embeddings API kwargs: {api_kwargs}")
        
        try:
            # Use embed_content for single text or batch embedding
            if "content" in api_kwargs:
                # Single embedding
                response = genai.embed_content(**api_kwargs)
            elif "contents" in api_kwargs:
                # Batch embedding - Google AI supports batch natively
                contents = api_kwargs.pop("contents")
                response = genai.embed_content(content=contents, **api_kwargs)
            else:
                raise ValueError("Either 'content' or 'contents' must be provided")
                
            return response
            
        except Exception as e:
            log.error(f"Error calling Google AI Embeddings API: {e}")
            raise

    async def acall(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        """Async call to Google AI embedding API.
        
        Note: Google AI Python client doesn't have async support yet,
        so this falls back to synchronous call.
        """
        # Google AI client doesn't have async support yet
        return self.call(api_kwargs, model_type)