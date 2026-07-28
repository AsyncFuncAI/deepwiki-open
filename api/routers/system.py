from datetime import datetime

from fastapi import APIRouter

from api.config import configs
from api.logger import get_logger
from api.schemas import Model, ModelConfig, Provider

logger = get_logger(__name__)

router = APIRouter(tags=["system"])


@router.get("/health")
async def health_check():
    """Health check endpoint for Docker and monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "deepwiki-api",
    }


@router.get("/lang/config")
async def lang_config():
    return configs["lang_config"]


@router.get("/models/config", response_model=ModelConfig)
async def get_model_config():
    """
    Get available model providers and their models.

    This endpoint returns the configuration of available model providers and their
    respective models that can be used throughout the application.

    Returns:
        ModelConfig: A configuration object containing providers and their models
    """
    try:
        logger.info("Fetching model configurations")

        # Create providers from the config file
        providers = []
        default_provider = configs.get("default_provider", "google")

        # Add provider configuration based on config.py
        for provider_id, provider_config in configs["providers"].items():
            models = []
            # Add models from config
            for model_id in provider_config["models"].keys():
                # Get a more user-friendly display name if possible
                models.append(Model(id=model_id, name=model_id))

            # Add provider with its models
            providers.append(
                Provider(
                    id=provider_id,
                    name=f"{provider_id.capitalize()}",
                    supportsCustomModel=provider_config.get(
                        "supportsCustomModel", False
                    ),
                    models=models,
                )
            )

        # Create and return the full configuration
        config = ModelConfig(providers=providers, defaultProvider=default_provider)
        return config

    except Exception as e:
        logger.error(f"Error creating model configuration: {str(e)}")
        # Return some default configuration in case of error
        return ModelConfig(
            providers=[
                Provider(
                    id="google",
                    name="Google",
                    supportsCustomModel=True,
                    models=[Model(id="gemini-2.5-flash", name="Gemini 2.5 Flash")],
                )
            ],
            defaultProvider="google",
        )
