import json
import os
import re
from pathlib import Path
from typing import TYPE_CHECKING, Any, Dict, List, Union

from api.clients import (
    AnthropicBedrockClient,
    AzureAIClient,
    BedrockClient,
    DashscopeClient,
    GoogleEmbedderClient,
    GoogleGenAIClient,
    LiteLLMClient,
    OllamaClient,
    OpenAIClient,
    OpenRouterClient,
)
from api.logger import get_logger

if TYPE_CHECKING:
    from adalflow import Embedder


logger = get_logger(__name__)


# Get API keys from environment variables
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
LITELLM_API_KEY = os.environ.get("LITELLM_API_KEY")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_SESSION_TOKEN = os.environ.get("AWS_SESSION_TOKEN")
AWS_REGION = os.environ.get("AWS_REGION")
AWS_ROLE_ARN = os.environ.get("AWS_ROLE_ARN")

# Set keys in environment (in case they're needed elsewhere in the code)
if OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
if LITELLM_API_KEY:
    os.environ["LITELLM_API_KEY"] = LITELLM_API_KEY
if GOOGLE_API_KEY:
    os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
if OPENROUTER_API_KEY:
    os.environ["OPENROUTER_API_KEY"] = OPENROUTER_API_KEY
if AWS_ACCESS_KEY_ID:
    os.environ["AWS_ACCESS_KEY_ID"] = AWS_ACCESS_KEY_ID
if AWS_SECRET_ACCESS_KEY:
    os.environ["AWS_SECRET_ACCESS_KEY"] = AWS_SECRET_ACCESS_KEY
if AWS_SESSION_TOKEN:
    os.environ["AWS_SESSION_TOKEN"] = AWS_SESSION_TOKEN
if AWS_REGION:
    os.environ["AWS_REGION"] = AWS_REGION
if AWS_ROLE_ARN:
    os.environ["AWS_ROLE_ARN"] = AWS_ROLE_ARN

# Wiki authentication settings
raw_auth_mode = os.environ.get("DEEPWIKI_AUTH_MODE", "False")
WIKI_AUTH_MODE = raw_auth_mode.lower() in ["true", "1", "t"]
WIKI_AUTH_CODE = os.environ.get("DEEPWIKI_AUTH_CODE", "")

# Embedder settings
EMBEDDER_TYPE = os.environ.get("DEEPWIKI_EMBEDDER_TYPE", "openai").lower()

# Get configuration directory from environment variable, or use default if not set
CONFIG_DIR = os.environ.get("DEEPWIKI_CONFIG_DIR", None)

# Client class mapping
CLIENT_CLASSES = {
    GoogleGenAIClient.__name__: GoogleGenAIClient,
    GoogleEmbedderClient.__name__: GoogleEmbedderClient,
    OpenAIClient.__name__: OpenAIClient,
    LiteLLMClient.__name__: LiteLLMClient,
    OpenRouterClient.__name__: OpenRouterClient,
    OllamaClient.__name__: OllamaClient,
    BedrockClient.__name__: BedrockClient,
    AzureAIClient.__name__: AzureAIClient,
    DashscopeClient.__name__: DashscopeClient,
    AnthropicBedrockClient.__name__: AnthropicBedrockClient,
}


_DEFAULT_PROVIDER_MAP = {
    "google": GoogleGenAIClient,
    "openai": OpenAIClient,
    "litellm": LiteLLMClient,
    "openrouter": OpenRouterClient,
    "ollama": OllamaClient,
    "bedrock": BedrockClient,
    "azure": AzureAIClient,
    "dashscope": DashscopeClient,
    "anthropic": AnthropicBedrockClient,
}


def replace_env_placeholders(
    config: Union[Dict[str, Any], List[Any], str, Any],
) -> Union[Dict[str, Any], List[Any], str, Any]:
    """
    Recursively replace placeholders like "${ENV_VAR}" in string values
    within a nested configuration structure (dicts, lists, strings)
    with environment variable values. Logs a warning if a placeholder is not found.
    """
    pattern = re.compile(r"\$\{([A-Z0-9_]+)\}")

    def replacer(match: re.Match[str]) -> str:
        env_var_name = match.group(1)
        original_placeholder = match.group(0)
        env_var_value = os.environ.get(env_var_name)
        if env_var_value is None:
            logger.warning(
                f"Environment variable placeholder '{original_placeholder}' was not found in the environment. "
                f"The placeholder string will be used as is."
            )
            return original_placeholder
        return env_var_value

    if isinstance(config, dict):
        return {k: replace_env_placeholders(v) for k, v in config.items()}
    elif isinstance(config, list):
        return [replace_env_placeholders(item) for item in config]
    elif isinstance(config, str):
        return pattern.sub(replacer, config)
    else:
        # Handles numbers, booleans, None, etc.
        return config


# Load JSON configuration file
def load_json_config(filename):
    try:
        # If environment variable is set, use the directory specified by it
        if CONFIG_DIR:
            config_path = Path(CONFIG_DIR) / filename
        else:
            # Otherwise use default directory
            config_path = Path(__file__).parent / "config" / filename

        logger.info(f"Loading configuration from {config_path}")

        if not config_path.exists():
            logger.warning(f"Configuration file {config_path} does not exist")
            return {}

        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
            config = replace_env_placeholders(config)
            return config
    except Exception as e:
        logger.error(f"Error loading configuration file {filename}: {str(e)}")
        return {}


# Load generator model configuration
def load_generator_config():
    generator_config = load_json_config("generator.json")

    # Add client classes to each provider
    if "providers" in generator_config:
        for provider_id, provider_config in generator_config["providers"].items():
            # Try to set client class from client_class
            if provider_config.get("client_class") in CLIENT_CLASSES:
                provider_config["model_client"] = CLIENT_CLASSES[
                    provider_config["client_class"]
                ]
            # Fall back to default mapping based on provider_id
            elif provider_id in _DEFAULT_PROVIDER_MAP:
                provider_config["model_client"] = _DEFAULT_PROVIDER_MAP[provider_id]
            else:
                logger.warning(f"Unknown provider or client class: {provider_id}")

    return generator_config


# Load embedder configuration
def load_embedder_config():
    embedder_config = load_json_config("embedder.json")

    # Process client classes
    for key in ["embedder", "embedder_ollama", "embedder_google", "embedder_bedrock"]:
        if key in embedder_config and "client_class" in embedder_config[key]:
            class_name = embedder_config[key]["client_class"]
            if class_name in CLIENT_CLASSES:
                embedder_config[key]["model_client"] = CLIENT_CLASSES[class_name]

    return embedder_config


def get_embedder_config():
    """
    Get the current embedder configuration based on DEEPWIKI_EMBEDDER_TYPE.

    Returns:
        dict: The embedder configuration with model_client resolved
    """
    embedder_type = EMBEDDER_TYPE
    if embedder_type == "bedrock" and "embedder_bedrock" in configs:
        return configs.get("embedder_bedrock", {})
    elif embedder_type == "google" and "embedder_google" in configs:
        return configs.get("embedder_google", {})
    elif embedder_type == "ollama" and "embedder_ollama" in configs:
        return configs.get("embedder_ollama", {})
    else:
        return configs.get("embedder", {})


def is_ollama_embedder():
    """
    Check if the current embedder configuration uses OllamaClient.

    Returns:
        bool: True if using OllamaClient, False otherwise
    """
    embedder_config = get_embedder_config()
    if not embedder_config:
        return False

    # Check if model_client is OllamaClient
    model_client = embedder_config.get("model_client")
    if model_client:
        return model_client.__name__ == "OllamaClient"

    # Fallback: check client_class string
    client_class = embedder_config.get("client_class", "")
    return client_class == "OllamaClient"


def is_google_embedder():
    """
    Check if the current embedder configuration uses GoogleEmbedderClient.

    Returns:
        bool: True if using GoogleEmbedderClient, False otherwise
    """
    embedder_config = get_embedder_config()
    if not embedder_config:
        return False

    # Check if model_client is GoogleEmbedderClient
    model_client = embedder_config.get("model_client")
    if model_client:
        return model_client.__name__ == "GoogleEmbedderClient"

    # Fallback: check client_class string
    client_class = embedder_config.get("client_class", "")
    return client_class == "GoogleEmbedderClient"


def is_bedrock_embedder():
    """
    Check if the current embedder configuration uses BedrockClient.

    Returns:
        bool: True if using BedrockClient, False otherwise
    """
    embedder_config = get_embedder_config()
    if not embedder_config:
        return False

    model_client = embedder_config.get("model_client")
    if model_client:
        return model_client.__name__ == "BedrockClient"

    client_class = embedder_config.get("client_class", "")
    return client_class == "BedrockClient"


def get_embedder_type():
    """
    Get the current embedder type based on configuration.

    Returns:
        str: 'bedrock', 'ollama', 'google', or 'openai' (default)
    """
    if is_bedrock_embedder():
        return "bedrock"
    elif is_ollama_embedder():
        return "ollama"
    elif is_google_embedder():
        return "google"
    else:
        return "openai"


# Load repository and file filters configuration
def load_repo_config():
    return load_json_config("repo.json")


# Load language configuration
def load_lang_config():
    default_config = {
        "supported_languages": {
            "en": "English",
            "ja": "Japanese (日本語)",
            "zh": "Mandarin Chinese (中文)",
            "zh-tw": "Traditional Chinese (繁體中文)",
            "es": "Spanish (Español)",
            "kr": "Korean (한국어)",
            "vi": "Vietnamese (Tiếng Việt)",
            "pt-br": "Brazilian Portuguese (Português Brasileiro)",
            "fr": "Français (French)",
            "ru": "Русский (Russian)",
        },
        "default": "en",
    }

    loaded_config = load_json_config(
        "lang.json"
    )  # Let load_json_config handle path and loading

    if not loaded_config:
        return default_config

    if "supported_languages" not in loaded_config or "default" not in loaded_config:
        logger.warning(
            "Language configuration file 'lang.json' is malformed. Using default language configuration."
        )
        return default_config

    return loaded_config


# Initialize empty configuration
configs = {}

# Load all configuration files
generator_config = load_generator_config()
embedder_config = load_embedder_config()
repo_config = load_repo_config()
lang_config = load_lang_config()

# Update configuration
if generator_config:
    configs["default_provider"] = generator_config.get("default_provider", "google")
    configs["providers"] = generator_config.get("providers", {})

# Update embedder configuration
if embedder_config:
    for key in [
        "embedder",
        "embedder_ollama",
        "embedder_google",
        "embedder_bedrock",
        "retriever",
        "text_splitter",
    ]:
        if key in embedder_config:
            configs[key] = embedder_config[key]

# Update repository configuration
if repo_config:
    for key in ["file_filters", "repository", "code_extensions", "doc_extensions"]:
        if key in repo_config:
            configs[key] = repo_config[key]

# Update language configuration
if lang_config:
    configs["lang_config"] = lang_config


def get_model_config(provider="google", model=None):
    """
    Get configuration for the specified provider and model

    Parameters:
        provider (str): Model provider ('google', 'openai', 'openrouter', 'ollama', 'bedrock')
        model (str): Model name, or None to use default model

    Returns:
        dict: Configuration containing model_client, model and other parameters
    """
    # Get provider configuration
    if "providers" not in configs:
        raise ValueError("Provider configuration not loaded")

    provider_config = configs["providers"].get(provider)
    if not provider_config:
        raise ValueError(f"Configuration for provider '{provider}' not found")

    model_client = provider_config.get("model_client")
    if not model_client:
        raise ValueError(f"Model client not specified for provider '{provider}'")

    # If model not provided, use default model for the provider
    if not model:
        model = provider_config.get("default_model")
        if not model:
            raise ValueError(f"No default model specified for provider '{provider}'")

    # Get model parameters (if present)
    model_params = {}
    if model in provider_config.get("models", {}):
        model_params = provider_config["models"][model]
    else:
        default_model = provider_config.get("default_model")
        model_params = provider_config["models"][default_model]

    # Prepare base configuration
    result = {
        "model_client": model_client,
    }

    # Provider-specific adjustments
    if provider == "ollama":
        # Ollama uses a slightly different parameter structure
        if "options" in model_params:
            result["model_kwargs"] = {"model": model, **model_params["options"]}
        else:
            result["model_kwargs"] = {"model": model}
    else:
        # Standard structure for other providers
        result["model_kwargs"] = {"model": model, **model_params}

    return result


def _should_process_file(
    file_path: Path,
    use_inclusion: bool,
    included_dirs: list[str],
    included_files: list[str],
    excluded_dirs: list[str],
    excluded_files: list[str],
) -> bool:
    """Decide if a file passes the include/exclude rules (moved from rag.pipeline
    so the tree listing and the RAG indexer share one implementation)."""
    if isinstance(file_path, str):
        file_path = Path(file_path)
    file_path_parts = file_path.resolve().parts
    file_name = file_path_parts[-1]

    if use_inclusion:
        is_included = False
        if included_dirs:
            for included in included_dirs:
                clean_included = included.removeprefix("./").rstrip("/")
                if clean_included in file_path_parts:
                    is_included = True
                    break
        if not is_included and included_files:
            for included_file in included_files:
                if file_name == included_file or file_name.endswith(included_file):
                    is_included = True
                    break
        if not included_dirs and not included_files:
            is_included = True
        return is_included

    is_excluded = False
    if excluded_dirs:
        for excluded in excluded_dirs:
            clean_excluded = excluded.removeprefix("./").rstrip("/")
            if clean_excluded in file_path_parts:
                is_excluded = True
                break
    if not is_excluded and excluded_files:
        for excluded_file in excluded_files:
            if file_name == excluded_file:
                is_excluded = True
                break
    return not is_excluded


def iterate_files(
    root_dir: str,
    excluded_dirs: list[str] | None = None,
    excluded_files: list[str] | None = None,
    included_dirs: list[str] | None = None,
    included_files: list[str] | None = None,
) -> list[str]:
    """Walk ``root_dir`` and return repo-relative paths of the files worth
    processing, using the SAME rules the RAG indexer uses so the wiki-structure
    file tree matches what actually gets indexed:

    * restrict to the configured code/doc extensions;
    * exclusion mode: config ``file_filters`` excluded_dirs/files UNION the
      request-provided excluded_dirs/files;
    * inclusion mode (when included_dirs/files are given): only those.
    """
    use_inclusion = bool(included_dirs or included_files)
    if use_inclusion:
        inc_dirs = list(set(included_dirs or []))
        inc_files = list(set(included_files or []))
        exc_dirs: list[str] = []
        exc_files: list[str] = []
    else:
        file_filters = configs.get("file_filters", {})
        exc_dir_set = set(file_filters.get("excluded_dirs", []))
        exc_file_set = set(file_filters.get("excluded_files", []))
        if excluded_dirs:
            exc_dir_set.update(excluded_dirs)
        if excluded_files:
            exc_file_set.update(excluded_files)
        exc_dirs = list(exc_dir_set)
        exc_files = list(exc_file_set)
        inc_dirs = []
        inc_files = []

    extensions = tuple(
        configs.get("code_extensions", []) + configs.get("doc_extensions", [])
    )

    results: list[str] = []
    for p in Path(root_dir).rglob("*"):
        if not p.is_file():
            continue
        if extensions and p.suffix.lower() not in extensions:
            continue
        if _should_process_file(
            p, use_inclusion, inc_dirs, inc_files, exc_dirs, exc_files
        ):
            results.append(os.path.relpath(p, root_dir).replace(os.sep, "/"))
    return results


def get_embedder(
    is_local_ollama: bool = False,
    use_google_embedder: bool = False,
    embedder_type: str = None,
) -> "Embedder":
    """Get embedder based on configuration or parameters.

    Args:
        is_local_ollama: Legacy parameter for Ollama embedder
        use_google_embedder: Legacy parameter for Google embedder
        embedder_type: Direct specification of embedder type ('ollama', 'google', 'bedrock', 'openai')

    Returns:
        adal.Embedder: Configured embedder instance
    """
    # Determine which embedder config to use
    from adalflow import Embedder

    if embedder_type:
        if embedder_type == "ollama":
            embedder_config = configs["embedder_ollama"]
        elif embedder_type == "google":
            embedder_config = configs["embedder_google"]
        elif embedder_type == "bedrock":
            embedder_config = configs["embedder_bedrock"]
        else:  # default to openai
            embedder_config = configs["embedder"]
    elif is_local_ollama:
        embedder_config = configs["embedder_ollama"]
    elif use_google_embedder:
        embedder_config = configs["embedder_google"]
    else:
        # Auto-detect based on current configuration
        current_type = get_embedder_type()
        if current_type == "bedrock":
            embedder_config = configs["embedder_bedrock"]
        elif current_type == "ollama":
            embedder_config = configs["embedder_ollama"]
        elif current_type == "google":
            embedder_config = configs["embedder_google"]
        else:
            embedder_config = configs["embedder"]

    # --- Initialize Embedder ---
    model_client_class = embedder_config["model_client"]
    if "initialize_kwargs" in embedder_config:
        model_client = model_client_class(**embedder_config["initialize_kwargs"])
    else:
        model_client = model_client_class()

    # Create embedder with basic parameters
    embedder_kwargs = {
        "model_client": model_client,
        "model_kwargs": embedder_config["model_kwargs"],
    }

    embedder = Embedder(**embedder_kwargs)

    # Set batch_size as an attribute if available (not a constructor parameter)
    if "batch_size" in embedder_config:
        embedder.batch_size = embedder_config["batch_size"]
    return embedder
