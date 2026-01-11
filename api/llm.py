import os
import logging
import asyncio
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


class LLMService:
    """Service Layer for managing LLM API calls with multi-provider support.

    Supports load balancing across multiple API keys for each provider.
    Compatible with all adalflow.ModelClient implementations.
    """
    
    # Singleton instance
    _instance = None
    
    def __new__(cls, default_provider: str = "google"):
        if cls._instance is None:
            cls._instance = super(LLMService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self, default_provider: str = "google"):
        """
        Initialize the LLM service
        
        Args:
            default_provider: The default provider to use (google/openai/openrouter/azure/bedrock/dashscope/ollama)
        """
        if self._initialized:
            return
            
        # Load from configuration
        from api.config import configs
        
        self.default_provider = default_provider
        self.configs = configs
        
        # Initialize all API keys for all providers
        self._init_all_provider_keys()
        
        # Initialize the client instance cache for each provider
        self.client_cache = {}
        
        # Usage statistics grouped by provider
        self.provider_key_usage = {}
        self.provider_key_last_used = {}
        
        for provider in self.api_keys_by_provider:
            keys = self.api_keys_by_provider[provider]
            self.provider_key_usage[provider] = {str(k): 0 for k in keys}
            self.provider_key_last_used[provider] = {str(k): 0 for k in keys}
        
        # Thread pool for concurrent requests
        self.thread_pool = ThreadPoolExecutor(max_workers=20)
        
        self._initialized = True
        logger.info(f"LLMService initialized with default provider: {default_provider}")
    
    def _init_all_provider_keys(self):
        """Load all API keys for all providers from the configuration"""
        self.api_keys_by_provider = self.configs.get("api_keys", {})
        
        # For backward compatibility, keep self.api_keys pointing to the keys of the default provider
        self.api_keys = self.api_keys_by_provider.get(self.default_provider, [])
        
        logger.info(f"Loaded API keys for providers: {list(self.api_keys_by_provider.keys())}")
        for provider, keys in self.api_keys_by_provider.items():
            logger.info(f"  {provider}: {len(keys)} key(s)")
    
    def _get_client(self, provider: str, api_key: Optional[str] = None):
        """
        Get the client instance for the specified provider
        
        Args:
            provider: Provider name
            api_key: Optional API key (for different keys when load balancing)
        
        Returns:
            ModelClient Instance
        """
        from api.config import get_model_config
        
        # Generate cache key
        cache_key = f"{provider}_{api_key[:8] if api_key else 'default'}"
        
        if cache_key in self.client_cache:
            logger.debug(f"Using cached client for {provider}")
            return self.client_cache[cache_key]
        
        logger.info(f"Creating new client for provider: {provider}")
        
        # Get model config
        model_config = get_model_config(provider)
        model_client_class = model_config["model_client"]
        
        # Initialize client for different providers
        if provider == "openai":
            client = model_client_class(api_key=api_key)
        elif provider == "google":
            # Google client reads key from environment variables
            if api_key:
                os.environ["GOOGLE_API_KEY"] = api_key
            client = model_client_class()
        elif provider == "openrouter":
            client = model_client_class(api_key=api_key)
        elif provider == "azure":
            client = model_client_class()  # Azure reads key from environment variables
        elif provider == "bedrock":
            client = model_client_class()  # Bedrock uses AWS credentials
        elif provider == "dashscope":
            if api_key:
                os.environ["DASHSCOPE_API_KEY"] = api_key
            client = model_client_class()
        elif provider == "ollama":
            client = model_client_class()  # Ollama local service
        else:
            raise ValueError(f"Unsupported provider: {provider}")
        
        self.client_cache[cache_key] = client
        logger.info(f"Client created and cached for {provider}")
        return client
    
    def get_next_api_key(self, provider: Optional[str] = None) -> Optional[str]:
        """
        Get the next available API key for the specified provider (load balancing)
        
        Args:
            provider: Provider name, default uses self.default_provider
        
        Returns:
            API key or None (for providers that do not require a key)
        """
        provider = provider or self.default_provider
        
        keys = self.api_keys_by_provider.get(provider, [])
        if not keys:
            # Some providers (e.g. ollama, bedrock) do not require an API key
            logger.debug(f"No API keys configured for provider: {provider}")
            return None
        
        if len(keys) == 1:
            return keys[0]
        
        # Load balancing logic: select the key with the least usage and the least recently used
        current_time = time.time()
        best_key = min(
            keys,
            key=lambda k: (
                self.provider_key_usage[provider][str(k)],
                self.provider_key_last_used[provider][str(k)]
            )
        )
        
        # 更新统计
        best_key_str = str(best_key)
        self.provider_key_usage[provider][best_key_str] += 1
        self.provider_key_last_used[provider][best_key_str] = current_time
        
        logger.debug(f"Selected API key for {provider}: {best_key[:8]}...{best_key[-4:]}")
        return best_key
    
    def reset_key_usage_stats(self, provider: Optional[str] = None):
        """
        Reset key usage statistics.
        
        Args:
            provider: Provider name to reset stats for, or None to reset all
        """
        if provider:
            if provider in self.provider_key_usage:
                self.provider_key_usage[provider] = {str(k): 0 for k in self.api_keys_by_provider[provider]}
                self.provider_key_last_used[provider] = {str(k): 0 for k in self.api_keys_by_provider[provider]}
                logger.info(f"Key usage statistics reset for provider: {provider}")
        else:
            for prov in self.provider_key_usage:
                self.provider_key_usage[prov] = {str(k): 0 for k in self.api_keys_by_provider[prov]}
                self.provider_key_last_used[prov] = {str(k): 0 for k in self.api_keys_by_provider[prov]}
            logger.info("Key usage statistics reset for all providers")
    
    def direct_invoke(
        self,
        prompt: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
                     temperature: Optional[float] = None, 
                     max_tokens: Optional[int] = None,
                     stream: bool = False, 
        api_key: Optional[str] = None
    ):
        """
        Unified synchronous/streaming call interface
        
        Args:
            prompt: User prompt
            provider: Provider name (higher priority than default_provider during initialization)
            model: Model name
            temperature: Temperature parameter
            max_tokens: Maximum token count
            stream: Whether to stream output
            api_key: Specified API key (if not specified, use load balancing)
            
        Returns:
            Non-streaming: Dict[str, Any] containing response content
            Streaming: Stream object can be iterated
        """
        from api.config import get_model_config
        from adalflow.core.types import ModelType
        
        # Determine provider
        provider = provider or self.default_provider
        
        # Get API key
        if not api_key:
            api_key = self.get_next_api_key(provider)
        
        # Get client
        client = self._get_client(provider, api_key)
        
        # Get model config
        model_config = get_model_config(provider, model)
        model_kwargs = model_config["model_kwargs"].copy()
        
        # Override parameters
        if temperature is not None:
            model_kwargs["temperature"] = temperature
        if max_tokens is not None:
            model_kwargs["max_tokens"] = max_tokens
        model_kwargs["stream"] = stream
        
        # Generate request_id
        request_id = str(uuid.uuid4())
        
        logger.info(f"[{request_id}] Provider: {provider}, Model: {model_kwargs.get('model', 'N/A')}, Stream: {stream}")
        if api_key:
            logger.info(f"[{request_id}] Using API key: {api_key[:8]}...{api_key[-4:]}")
        
        try:
            # Convert input to API parameters
            api_kwargs = client.convert_inputs_to_api_kwargs(
                input=prompt,
                model_kwargs=model_kwargs,
                model_type=ModelType.LLM
            )
            
            # Call client
            response = client.call(api_kwargs=api_kwargs, model_type=ModelType.LLM)
            
            # If streaming, return directly
            if stream:
                logger.info(f"[{request_id}] Returning stream response")
                return response
            
            # Non-streaming, parse response
            parsed_response = client.parse_chat_completion(response)
            
            content = parsed_response.raw_response if hasattr(parsed_response, 'raw_response') else str(parsed_response)
            logger.info(f"[{request_id}] Response received: {len(str(content))} characters")
                
            return {
                "content": content,
                "model": model_kwargs.get("model", "N/A"),
                "provider": provider,
                "request_id": request_id,
                "api_key_used": f"{api_key[:8]}...{api_key[-4:]}" if api_key else "N/A"
            }
                
        except Exception as e:
            logger.error(f"[{request_id}] Error: {str(e)}", exc_info=True)
            raise RuntimeError(f"API call failed for provider {provider}: {str(e)}")
    
    def direct_invoke_with_system(
        self,
        prompt: str,
        system_message: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
                              temperature: Optional[float] = None,
                              max_tokens: Optional[int] = None,
                              stream: bool = False,
        api_key: Optional[str] = None
    ):
        """
        Call with system message (adapting to adalflow's messages format)
        
        Args:
            prompt: User prompt
            system_message: System message
            provider: Provider name
            model: Model name
            temperature: Temperature parameter
            max_tokens: Maximum token count
            stream: Whether to stream output
            api_key: Specified API key
            
        Returns:
            Non-streaming: Dict[str, Any]
            Streaming: Stream object
        """
        from api.config import get_model_config
        from adalflow.core.types import ModelType
        
        # Determine provider
        provider = provider or self.default_provider
        
        # Get API key
        if not api_key:
            api_key = self.get_next_api_key(provider)
        
        # Get client
        client = self._get_client(provider, api_key)
        
        # Get model config
        model_config = get_model_config(provider, model)
        model_kwargs = model_config["model_kwargs"].copy()
        
        # Override parameters
        if temperature is not None:
            model_kwargs["temperature"] = temperature
        if max_tokens is not None:
            model_kwargs["max_tokens"] = max_tokens
        model_kwargs["stream"] = stream
        
        # Generate request_id
        request_id = str(uuid.uuid4())
        
        logger.info(f"[{request_id}] Provider: {provider}, Model: {model_kwargs.get('model', 'N/A')}, With system message, Stream: {stream}")
        
        try:
            # Build messages format input
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ]
        
            # Convert input to API parameters
            api_kwargs = client.convert_inputs_to_api_kwargs(
                input=messages,
                model_kwargs=model_kwargs,
                model_type=ModelType.LLM
            )
            
            # Call client
            response = client.call(api_kwargs=api_kwargs, model_type=ModelType.LLM)
            
            # If streaming, return directly
            if stream:
                logger.info(f"[{request_id}] Returning stream response")
                return response
            
            # Non-streaming, parse response
            parsed_response = client.parse_chat_completion(response)
            
            content = parsed_response.raw_response if hasattr(parsed_response, 'raw_response') else str(parsed_response)
            logger.info(f"[{request_id}] Response received: {len(str(content))} characters")
                
            return {
                "content": content,
            "model": model_kwargs.get("model", "N/A"),
            "provider": provider,
                "request_id": request_id,
            "api_key_used": f"{api_key[:8]}...{api_key[-4:]}" if api_key else "N/A"
            }
            
        except Exception as e:
            logger.error(f"[{request_id}] Error: {str(e)}", exc_info=True)
            raise RuntimeError(f"API call failed for provider {provider}: {str(e)}")
    
    async def async_invoke_stream(
        self,
        prompt: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        api_key: Optional[str] = None
    ):
        """
        Asynchronous streaming call
        
        Args:
            prompt: User prompt
            provider: Provider name
            model: Model name
            temperature: Temperature parameter
            max_tokens: Maximum token count
            api_key: Specified API key
        
        Yields:
            str: Text content of each chunk
        """
        from api.config import get_model_config
        from adalflow.core.types import ModelType
        
        provider = provider or self.default_provider
        
        if not api_key:
            api_key = self.get_next_api_key(provider)
        
        client = self._get_client(provider, api_key)
        
        # Get model config
        model_config = get_model_config(provider, model)
        model_kwargs = model_config["model_kwargs"].copy()
        
        if temperature is not None:
            model_kwargs["temperature"] = temperature
        if max_tokens is not None:
            model_kwargs["max_tokens"] = max_tokens
        model_kwargs["stream"] = True
        
        request_id = str(uuid.uuid4())
        logger.info(f"[{request_id}] Async stream - Provider: {provider}, Model: {model_kwargs.get('model', 'N/A')}")
        
        try:
            # Convert input
            api_kwargs = client.convert_inputs_to_api_kwargs(
                input=prompt,
                model_kwargs=model_kwargs,
                model_type=ModelType.LLM
            )
            
            # Asynchronous call
            response = await client.acall(api_kwargs=api_kwargs, model_type=ModelType.LLM)
            
            # Handle different provider's streaming response format
            if provider == "google":
                for chunk in response:
                    if hasattr(chunk, 'text'):
                        yield chunk.text
            elif provider in ["openai", "openrouter", "azure"]:
                async for chunk in response:
                    if hasattr(chunk, 'choices') and len(chunk.choices) > 0:
                        delta = chunk.choices[0].delta
                        if hasattr(delta, 'content') and delta.content:
                            yield delta.content
            elif provider == "ollama":
                async for chunk in response:
                    text = getattr(chunk, 'response', None) or getattr(chunk, 'text', None)
                    if text:
                        yield text
            elif provider == "bedrock":
                # Bedrock may not support streaming, return complete response
                yield str(response)
            elif provider == "dashscope":
                async for text in response:
                    if text:
                        yield text
            else:
                logger.warning(f"Unknown provider {provider}, attempting generic streaming")
                async for chunk in response:
                    yield str(chunk)
                
        except Exception as e:
            logger.error(f"[{request_id}] Async stream error: {str(e)}", exc_info=True)
            raise RuntimeError(f"Async stream failed for provider {provider}: {str(e)}")

    def parallel_invoke(
        self, 
        requests: List[Dict[str, Any]], 
                       max_concurrent_per_key: int = 3,
                       max_total_concurrent: int = 10,
        timeout: float = 60.0
    ) -> List[Dict[str, Any]]:
        """
        Parallel invoke multiple requests using available API keys.
        
        Args:
            requests: List of request dictionaries, each containing:
                - prompt: User prompt text
                - system_message: (optional) System message
                - provider: (optional) Provider name
                - model: (optional) Model name
                - temperature: (optional) Temperature parameter
                - max_tokens: (optional) Maximum generation tokens
                - api_key: (optional) Specific API key to use
            max_concurrent_per_key: Maximum concurrent requests per API key
            max_total_concurrent: Maximum total concurrent requests
            timeout: Timeout for each request in seconds
            
        Returns:
            List of response dictionaries in the same order as input requests
        """
        if not requests:
            raise ValueError("Requests list cannot be empty")
        
        logger.info(f"Starting parallel invoke for {len(requests)} requests")
        logger.info(f"Max concurrent per key: {max_concurrent_per_key}, Max total: {max_total_concurrent}")
        
        # Prepare request functions
        def execute_single_request(request_data, index):
            try:
                # Extract parameters from request
                prompt = request_data.get("prompt")
                if not prompt:
                    return {
                        "index": index,
                        "error": "Missing prompt in request",
                        "request_data": request_data
                    }
                
                system_message = request_data.get("system_message")
                provider = request_data.get("provider")
                model = request_data.get("model")
                temperature = request_data.get("temperature")
                max_tokens = request_data.get("max_tokens")
                api_key = request_data.get("api_key")
                
                # Call appropriate method
                if system_message:
                    result = self.direct_invoke_with_system(
                        prompt=prompt,
                        system_message=system_message,
                        provider=provider,
                        model=model,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        api_key=api_key
                    )
                else:
                    result = self.direct_invoke(
                        prompt=prompt,
                        provider=provider,
                        model=model,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        api_key=api_key
                    )
                
                result["index"] = index
                result["request_data"] = request_data
                return result
                
            except Exception as e:
                logger.error(f"Error in request {index}: {str(e)}")
                return {
                    "index": index,
                    "error": str(e),
                    "request_data": request_data
                }
        
        # Execute requests in parallel using ThreadPoolExecutor
        results = [None] * len(requests)
        
        # Limit concurrent requests
        max_workers = min(max_total_concurrent, len(requests))
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tasks
            future_to_index = {
                executor.submit(execute_single_request, req, idx): idx
                for idx, req in enumerate(requests)
            }
            
            # Collect results
            completed = 0
            for future in as_completed(future_to_index, timeout=timeout):
                try:
                    result = future.result()
                    index = result.get("index", future_to_index[future])
                    results[index] = result
                    completed += 1
                    
                    if completed % 5 == 0 or completed == len(requests):
                        logger.info(f"Completed {completed}/{len(requests)} requests")
                        
                except Exception as e:
                    index = future_to_index[future]
                    logger.error(f"Request {index} failed: {str(e)}")
                    results[index] = {
                        "index": index,
                        "error": str(e),
                        "request_data": requests[index]
                    }
        
        logger.info(f"Parallel invoke completed. {completed}/{len(requests)} requests finished")
        return results
    
    def batch_invoke_same_prompt(
        self, 
        prompt: str, 
                                count: int,
                                system_message: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
                                temperature: Optional[float] = None,
                                max_tokens: Optional[int] = None,
                                max_concurrent_per_key: int = 3,
        max_total_concurrent: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Batch invoke the same prompt multiple times for comparison or ensemble purposes.
        
        Args:
            prompt: User prompt text
            count: Number of times to invoke the same prompt
            system_message: (optional) System message
            provider: (optional) Provider name
            model: (optional) Model name
            temperature: (optional) Temperature parameter
            max_tokens: (optional) Maximum generation tokens
            max_concurrent_per_key: Maximum concurrent requests per API key
            max_total_concurrent: Maximum total concurrent requests
            
        Returns:
            List of response dictionaries
        """
        if count <= 0:
            raise ValueError("Count must be positive")
        
        logger.info(f"Batch invoking same prompt {count} times")
        
        # Create request list
        requests = []
        for i in range(count):
            request_data = {"prompt": prompt}
            if system_message:
                request_data["system_message"] = system_message
            if provider:
                request_data["provider"] = provider
            if model:
                request_data["model"] = model
            if temperature is not None:
                request_data["temperature"] = temperature
            if max_tokens:
                request_data["max_tokens"] = max_tokens
            
            requests.append(request_data)
        
        return self.parallel_invoke(
            requests=requests,
            max_concurrent_per_key=max_concurrent_per_key,
            max_total_concurrent=max_total_concurrent
        )
    
    def get_api_keys_status(self, provider: Optional[str] = None) -> Dict[str, Any]:
        """
        Get status information about API keys.
        
        Args:
            provider: Specific provider to get status for, or None for all providers
        
        Returns:
            Dictionary containing API keys status and usage statistics
        """
        if provider:
            if provider not in self.api_keys_by_provider:
                return {"error": f"Provider {provider} not found"}
            
            keys = self.api_keys_by_provider[provider]
            return {
                    "provider": provider,
                    "total_keys": len(keys),
                    "api_keys": [f"{key[:8]}...{key[-4:]}" if len(key) > 12 else key for key in keys],
                    "key_usage_count": {
                        f"{key[:8]}...{key[-4:]}" if len(key) > 12 else key: self.provider_key_usage[provider].get(str(key), 0)
                        for key in keys
                    },
                    "key_last_used": {
                        f"{key[:8]}...{key[-4:]}" if len(key) > 12 else key: self.provider_key_last_used[provider].get(str(key), 0)
                        for key in keys
                    }
                }
        else:
            # Return status for all providers
            status = {}
            for prov in self.api_keys_by_provider:
                keys = self.api_keys_by_provider[prov]
                status[prov] = {
                    "total_keys": len(keys),
                    "key_usage_count": {
                        f"{key[:8]}...{key[-4:]}" if len(key) > 12 else key: self.provider_key_usage[prov].get(str(key), 0)
                        for key in keys
                    }
                }
            return status

    def update_default_provider(self, provider: str) -> None:
        """
        Update the default provider.
        
        Args:
            provider: The new default provider name
        """
        if provider not in self.api_keys_by_provider:
            raise ValueError(f"Provider {provider} not configured")
        
        self.default_provider = provider
        self.api_keys = self.api_keys_by_provider.get(provider, [])
        logger.info(f"Default provider updated to {provider}")

