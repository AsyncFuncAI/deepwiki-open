import os
import json
import logging
import re
from pathlib import Path
from typing import List, Union, Dict, Any

logger = logging.getLogger(__name__)

from api.openai_client import OpenAIClient
from api.openrouter_client import OpenRouterClient
from api.bedrock_client import BedrockClient
from api.azureai_client import AzureAIClient
from api.dashscope_client import DashscopeClient
from adalflow import GoogleGenAIClient, OllamaClient

# Get API keys from environment variables
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY')
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.environ.get('AWS_REGION')
AWS_ROLE_ARN = os.environ.get('AWS_ROLE_ARN')

# Set keys in environment (in case they're needed elsewhere in the code)
if OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
if GOOGLE_API_KEY:
    os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
if OPENROUTER_API_KEY:
    os.environ["OPENROUTER_API_KEY"] = OPENROUTER_API_KEY
if AWS_ACCESS_KEY_ID:
    os.environ["AWS_ACCESS_KEY_ID"] = AWS_ACCESS_KEY_ID
if AWS_SECRET_ACCESS_KEY:
    os.environ["AWS_SECRET_ACCESS_KEY"] = AWS_SECRET_ACCESS_KEY
if AWS_REGION:
    os.environ["AWS_REGION"] = AWS_REGION
if AWS_ROLE_ARN:
    os.environ["AWS_ROLE_ARN"] = AWS_ROLE_ARN

# Wiki authentication settings
raw_auth_mode = os.environ.get('DEEPWIKI_AUTH_MODE', 'False')
WIKI_AUTH_MODE = raw_auth_mode.lower() in ['true', '1', 't']
WIKI_AUTH_CODE = os.environ.get('DEEPWIKI_AUTH_CODE', '')

# Get configuration directory from environment variable, or use default if not set
CONFIG_DIR = os.environ.get('DEEPWIKI_CONFIG_DIR', None)

# Client class mapping
CLIENT_CLASSES = {
    "GoogleGenAIClient": GoogleGenAIClient,
    "OpenAIClient": OpenAIClient,
    "OpenRouterClient": OpenRouterClient,
    "OllamaClient": OllamaClient,
    "BedrockClient": BedrockClient,
    "AzureAIClient": AzureAIClient,
    "DashscopeClient": DashscopeClient
}

def replace_env_placeholders(config: Union[Dict[str, Any], List[Any], str, Any]) -> Union[Dict[str, Any], List[Any], str, Any]:
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

        with open(config_path, 'r', encoding='utf-8') as f:
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
                provider_config["model_client"] = CLIENT_CLASSES[provider_config["client_class"]]
            # Fall back to default mapping based on provider_id
            elif provider_id in ["google", "openai", "openrouter", "ollama", "bedrock", "azure", "dashscope"]:
                default_map = {
                    "google": GoogleGenAIClient,
                    "openai": OpenAIClient,
                    "openrouter": OpenRouterClient,
                    "ollama": OllamaClient,
                    "bedrock": BedrockClient,
                    "azure": AzureAIClient,
                    "dashscope": DashscopeClient
                }
                provider_config["model_client"] = default_map[provider_id]
            else:
                logger.warning(f"Unknown provider or client class: {provider_id}")

    return generator_config

# Load embedder configuration
def load_embedder_config():
    embedder_config = load_json_config("embedder.json")

    # Process client classes
    for key in ["embedder", "embedder_ollama"]:
        if key in embedder_config and "client_class" in embedder_config[key]:
            class_name = embedder_config[key]["client_class"]
            if class_name in CLIENT_CLASSES:
                embedder_config[key]["model_client"] = CLIENT_CLASSES[class_name]

    return embedder_config

def get_embedder_config():
    """
    Get the current embedder configuration.

    Returns:
        dict: The embedder configuration with model_client resolved
    """
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
            "ru": "Русский (Russian)"
        },
        "default": "en"
    }

    loaded_config = load_json_config("lang.json") # Let load_json_config handle path and loading

    if not loaded_config:
        return default_config

    if "supported_languages" not in loaded_config or "default" not in loaded_config:
        logger.warning("Language configuration file 'lang.json' is malformed. Using default language configuration.")
        return default_config

    return loaded_config

# Default excluded directories and files
DEFAULT_EXCLUDED_DIRS: List[str] = [
    # Virtual environments and package managers
    "./.venv/", "./venv/", "./env/", "./virtualenv/",
    "./node_modules/", "./bower_components/", "./jspm_packages/",
    # Version control
    "./.git/", "./.svn/", "./.hg/", "./.bzr/",
    # Cache and compiled files
    "./__pycache__/", "./.pytest_cache/", "./.mypy_cache/", "./.ruff_cache/", "./.coverage/",
    # Build and distribution
    "./dist/", "./build/", "./out/", "./target/", "./bin/", "./obj/",
    # Documentation
    "./docs/", "./_docs/", "./site-docs/", "./_site/",
    # IDE specific
    "./.idea/", "./.vscode/", "./.vs/", "./.eclipse/", "./.settings/",
    # Logs and temporary files
    "./logs/", "./log/", "./tmp/", "./temp/",
]

DEFAULT_EXCLUDED_FILES: List[str] = [
    "yarn.lock", "pnpm-lock.yaml", "npm-shrinkwrap.json", "poetry.lock",
    "Pipfile.lock", "requirements.txt.lock", "Cargo.lock", "composer.lock",
    ".lock", ".DS_Store", "Thumbs.db", "desktop.ini", "*.lnk", ".env",
    ".env.*", "*.env", "*.cfg", "*.ini", ".flaskenv", ".gitignore",
    ".gitattributes", ".gitmodules", ".github", ".gitlab-ci.yml",
    ".prettierrc", ".eslintrc", ".eslintignore", ".stylelintrc",
    ".editorconfig", ".jshintrc", ".pylintrc", ".flake8", "mypy.ini",
    "pyproject.toml", "tsconfig.json", "webpack.config.js", "babel.config.js",
    "rollup.config.js", "jest.config.js", "karma.conf.js", "vite.config.js",
    "next.config.js", "*.min.js", "*.min.css", "*.bundle.js", "*.bundle.css",
    "*.map", "*.gz", "*.zip", "*.tar", "*.tgz", "*.rar", "*.7z", "*.iso",
    "*.dmg", "*.img", "*.msix", "*.appx", "*.appxbundle", "*.xap", "*.ipa",
    "*.deb", "*.rpm", "*.msi", "*.exe", "*.dll", "*.so", "*.dylib", "*.o",
    "*.obj", "*.jar", "*.war", "*.ear", "*.jsm", "*.class", "*.pyc", "*.pyd",
    "*.pyo", "__pycache__", "*.a", "*.lib", "*.lo", "*.la", "*.slo", "*.dSYM",
    "*.egg", "*.egg-info", "*.dist-info", "*.eggs", "node_modules",
    "bower_components", "jspm_packages", "lib-cov", "coverage", "htmlcov",
    ".nyc_output", ".tox", "dist", "build", "bld", "out", "bin", "target",
    "packages/*/dist", "packages/*/build", ".output"
]

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
    for key in ["embedder", "embedder_ollama", "retriever", "text_splitter"]:
        if key in embedder_config:
            configs[key] = embedder_config[key]

# Update repository configuration
if repo_config:
    for key in ["file_filters", "repository"]:
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
