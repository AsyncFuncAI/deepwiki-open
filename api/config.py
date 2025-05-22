import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Type

logger = logging.getLogger(__name__)

from api.openai_client import OpenAIClient
from api.openrouter_client import OpenRouterClient
from adalflow import GoogleGenAIClient, OllamaClient # type: ignore
# Assuming adalflow might not have stubs or is dynamically loaded,
# using type: ignore to suppress potential import errors in static analysis.

# API Keys: Loaded from environment variables. These are used to authenticate
# with various LLM and embedding service providers.
OPENAI_API_KEY: Optional[str] = os.environ.get('OPENAI_API_KEY')
GOOGLE_API_KEY: Optional[str] = os.environ.get('GOOGLE_API_KEY')
OPENROUTER_API_KEY: Optional[str] = os.environ.get('OPENROUTER_API_KEY')

# Ensure API keys, if found, are set in the environment. This can be helpful
# if libraries used internally rely on these specific environment variable names.
if OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
if GOOGLE_API_KEY:
    os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
if OPENROUTER_API_KEY:
    os.environ["OPENROUTER_API_KEY"] = OPENROUTER_API_KEY

# CONFIG_DIR: Specifies a custom directory for configuration files. If not set
# via the 'DEEPWIKI_CONFIG_DIR' environment variable, it defaults to None,
# in which case config files are loaded from a 'config' subdirectory relative
# to this script.
CONFIG_DIR: Optional[str] = os.environ.get('DEEPWIKI_CONFIG_DIR', None)

# CLIENT_CLASSES: A mapping from string identifiers (used in JSON configs)
# to actual client class objects for various LLM providers.
CLIENT_CLASSES: Dict[str, Type[Any]] = {
    "GoogleGenAIClient": GoogleGenAIClient,
    "OpenAIClient": OpenAIClient,
    "OpenRouterClient": OpenRouterClient,
    "OllamaClient": OllamaClient
}

# Load JSON configuration file
def load_json_config(filename: str) -> Dict[str, Any]:
    """
    Loads a JSON configuration file.

    The function determines the path to the configuration file based on the
    `CONFIG_DIR` environment variable. If `CONFIG_DIR` is set, it looks for
    `filename` in that directory. Otherwise, it defaults to looking in a
    'config' subdirectory relative to the current script's location.

    Args:
        filename (str): The name of the JSON configuration file (e.g., "generator.json").

    Returns:
        Dict[str, Any]: A dictionary containing the loaded JSON data. Returns an
                        empty dictionary if the file is not found or if any error
                        occurs during loading (errors are logged).
    """
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
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading configuration file {filename}: {str(e)}", exc_info=True)
        return {}

# Load generator model configuration
def load_generator_config() -> Dict[str, Any]:
    """
    Loads and processes the generator model configuration from "generator.json".

    This function loads the base configuration and then dynamically assigns the
    appropriate model client class (e.g., `GoogleGenAIClient`, `OpenAIClient`)
    to each provider defined in the configuration. It uses the `CLIENT_CLASSES`
    mapping for this purpose.

    Returns:
        Dict[str, Any]: The processed generator configuration dictionary.
                        Provider entries will have a "model_client" key populated
                        with the corresponding client class.
    """
    generator_config = load_json_config("generator.json")

    # Add client classes to each provider
    if "providers" in generator_config:
        for provider_id, provider_config in generator_config["providers"].items():
            # Try to set client class from client_class
            if provider_config.get("client_class") in CLIENT_CLASSES:
                provider_config["model_client"] = CLIENT_CLASSES[provider_config["client_class"]]
            # Fall back to default mapping based on provider_id
            elif provider_id in ["google", "openai", "openrouter", "ollama"]:
                default_map = {
                    "google": GoogleGenAIClient,
                    "openai": OpenAIClient,
                    "openrouter": OpenRouterClient,
                    "ollama": OllamaClient
                }
                provider_config["model_client"] = default_map[provider_id]
            else:
                logger.warning(f"Unknown provider or client class: {provider_id}")

    return generator_config

# Load embedder configuration
def load_embedder_config() -> Dict[str, Any]:
    """
    Loads and processes the embedder configuration from "embedder.json".

    This function loads settings related to embedding models, including those
    for general use ("embedder") and specifically for Ollama ("embedder_ollama").
    It dynamically assigns the appropriate model client class to these embedder
    configurations based on the "client_class" field specified in the JSON
    and the `CLIENT_CLASSES` mapping.

    Returns:
        Dict[str, Any]: The processed embedder configuration dictionary. Embedder
                        entries (like "embedder", "embedder_ollama") will have
                        a "model_client" key populated if a valid "client_class"
                        was specified.
    """
    embedder_config = load_json_config("embedder.json")

    # Process client classes
    for key in ["embedder", "embedder_ollama"]:
        if key in embedder_config and "client_class" in embedder_config[key]:
            class_name = embedder_config[key]["client_class"]
            if class_name in CLIENT_CLASSES:
                embedder_config[key]["model_client"] = CLIENT_CLASSES[class_name]
            else:
                logger.warning(f"Unknown client class '{class_name}' specified for embedder config key '{key}'.")


    return embedder_config

# Load repository and file filters configuration
def load_repo_config() -> Dict[str, Any]:
    """
    Loads repository-specific configurations from "repo.json".

    This typically includes settings for file filtering (excluded directories
    and files) and other repository-related parameters.

    Returns:
        Dict[str, Any]: The repository configuration dictionary.
    """
    return load_json_config("repo.json")

# DEFAULT_EXCLUDED_DIRS: A list of directory patterns commonly excluded from
# code analysis and RAG processing. These are used as a baseline and can be
# supplemented by configurations in "repo.json" or runtime parameters.
# Patterns are typically relative paths (e.g., "./.venv/").
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

# Initialize empty configuration dictionary that will be populated.
configs: Dict[str, Any] = {}

# Load all individual configuration components.
generator_config = load_generator_config()
embedder_config = load_embedder_config()
repo_config = load_repo_config()

# Populate the main 'configs' dictionary.
# Start with generator configurations (providers and default provider).
if generator_config:
    configs["default_provider"] = generator_config.get("default_provider", "google")
    configs["providers"] = generator_config.get("providers", {})

# Add embedder-related configurations (embedder settings, retriever, text_splitter).
if embedder_config:
    for key in ["embedder", "embedder_ollama", "retriever", "text_splitter"]:
        if key in embedder_config:
            configs[key] = embedder_config[key]

# Add repository-specific configurations (file filters, etc.).
if repo_config:
    for key in ["file_filters", "repository"]: # Add other relevant keys from repo.json if any
        if key in repo_config:
            configs[key] = repo_config[key]

def get_model_config(provider: str = "google", model: Optional[str] = None) -> Dict[str, Any]:
    """
    Retrieves the configuration for a specific LLM provider and model.

    This function accesses the globally loaded `configs` dictionary. It fetches
    the configuration for the given `provider`, and then for the specified `model`
    within that provider. If `model` is None, it attempts to use the default
    model for that provider.

    The returned configuration includes the `model_client` class and `model_kwargs`
    (which contains the model name and any other parameters for the model).
    It handles provider-specific parameter structures, particularly for Ollama.

    Args:
        provider (str, optional): The name of the model provider (e.g., "google",
                                  "openai", "ollama"). Defaults to "google".
        model (Optional[str], optional): The specific model name. If None, the
                                         provider's default model is used.
                                         Defaults to None.

    Returns:
        Dict[str, Any]: A dictionary containing:
            - "model_client": The client class for the provider.
            - "model_kwargs": A dictionary of arguments for the model, including
                              the model name and other parameters.

    Raises:
        ValueError: If the provider configuration is not loaded, the specified
                    provider is not found, the model client is not specified for
                    the provider, or no default model is specified when `model`
                    is None.
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
