import adalflow as adal

from api.config import configs, is_azure_openai_configured, get_azure_openai_embedding_config
from api.azureai_client import AzureAIClient


def get_embedder() -> adal.Embedder:
    embedder_config = configs["embedder"]

    # --- Initialize Embedder ---
    model_client_class = embedder_config.get("model_client")
    if not model_client_class:
        # Fallback to client_class if model_client is not set
        client_class_name = embedder_config.get("client_class")
        if client_class_name == "AzureAIClient":
            model_client_class = AzureAIClient
        else:
            raise ValueError(f"Unknown client class: {client_class_name}")
    
    # Initialize model client with proper configuration
    if "initialize_kwargs" in embedder_config:
        model_client = model_client_class(**embedder_config["initialize_kwargs"])
    else:
        model_client = model_client_class()
        
    embedder = adal.Embedder(
        model_client=model_client,
        model_kwargs=embedder_config["model_kwargs"],
    )
    return embedder
