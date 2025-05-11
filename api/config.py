import os
from pathlib import Path

from api.model_config import ModelConfig, load_model_configs
import logging

# Directory containing configuration files
CONFIG_DIR = Path(__file__).parent / "config"

# Load all model configurations
embedders, generators = load_model_configs(CONFIG_DIR)

# Set default model providers and running modes
DEFAULT_EMBEDDER_NAME = "openai"
DEFAULT_GENERATOR_NAME = "google"

# Non-model related configurations
app_configs = {
    "retriever": {
        "top_k": 20,
    },
    "text_splitter": {
        "split_by": "word",
        "chunk_size": 350,
        "chunk_overlap": 100,
    },
    "file_filters": {
        "excluded_dirs": [
            "./.venv/", "./venv/", "./env/", "./virtualenv/",
            "./node_modules/", "./bower_components/", "./jspm_packages/",
            "./.git/", "./.svn/", "./.hg/", "./.bzr/",
            "./__pycache__/", "./.pytest_cache/", "./.mypy_cache/", "./.ruff_cache/", "./.coverage/",
            "./dist/", "./build/", "./out/", "./target/", "./bin/", "./obj/",
            "./docs/", "./_docs/", "./site-docs/", "./_site/",
            "./.idea/", "./.vscode/", "./.vs/", "./.eclipse/", "./.settings/",
            "./logs/", "./log/", "./tmp/", "./temp/", "./.eng",
        ],
        "excluded_files": [
            "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "npm-shrinkwrap.json",
            "poetry.lock", "Pipfile.lock", "requirements.txt.lock", "Cargo.lock", "composer.lock",
            ".lock", ".DS_Store", "Thumbs.db", "desktop.ini", "*.lnk",
            ".env", ".env.*", "*.env", "*.cfg", "*.ini", ".flaskenv",
            ".gitignore", ".gitattributes", ".gitmodules", ".github", ".gitlab-ci.yml",
            ".prettierrc", ".eslintrc", ".eslintignore", ".stylelintrc", ".editorconfig",
            ".jshintrc", ".pylintrc", ".flake8", "mypy.ini", "pyproject.toml",
            "tsconfig.json", "webpack.config.js", "babel.config.js", "rollup.config.js",
            "jest.config.js", "karma.conf.js", "vite.config.js", "next.config.js",
            "*.min.js", "*.min.css", "*.bundle.js", "*.bundle.css",
            "*.map", "*.gz", "*.zip", "*.tar", "*.tgz", "*.rar",
            "*.pyc", "*.pyo", "*.pyd", "*.so", "*.dll", "*.class", "*.exe", "*.o", "*.a",
            "*.jpg", "*.jpeg", "*.png", "*.gif", "*.ico", "*.svg", "*.webp",
            "*.mp3", "*.mp4", "*.wav", "*.avi", "*.mov", "*.webm",
            "*.csv", "*.tsv", "*.xls", "*.xlsx", "*.db", "*.sqlite", "*.sqlite3",
            "*.pdf", "*.docx", "*.pptx",
        ],
    },
    "repository": {
        # Maximum repository size in MB
        "size_limit_mb": 50000,
    },
}

def get_embedder_config(model_name: str = DEFAULT_EMBEDDER_NAME) -> ModelConfig:
    """
    Get the embedding model configuration object for the specified name.
    
    Args:
        model_type: generator type, openai by default
        
    Returns:
        ModelConfig: model config object
    
    Raises:
        KeyError: if the specified type does not exist
    """
    if model_name not in embedders:
        raise KeyError(f"Embedding model '{model_name}' does not exist")
    return embedders[model_name]

def get_generator_config(model_name: str = DEFAULT_GENERATOR_NAME) -> ModelConfig:
    """
    Get the generator model configuration object for the specified name.
    
    Args:
        model_type: generator type, google by default
        
    Returns:
        ModelConfig: model config object
    
    Raises:
        KeyError: if the specified type does not exist
    """
        
    if model_name not in generators:
        raise KeyError(f"Generator model '{model_name}' does not exist")
    return generators[model_name]


OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY')
EMBEDDER_NAME = os.environ.get('EMBEDDER_NAME', DEFAULT_EMBEDDER_NAME)
GENERATOR_NAME = os.environ.get('GENERATOR_NAME', DEFAULT_GENERATOR_NAME)

if OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
if GOOGLE_API_KEY:
    os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
if OPENROUTER_API_KEY:
    os.environ["OPENROUTER_API_KEY"] = OPENROUTER_API_KEY
if EMBEDDER_NAME:
    os.environ["EMBEDDER_NAME"] = EMBEDDER_NAME
if GENERATOR_NAME:
    os.environ["GENERATOR_NAME"] = GENERATOR_NAME

embedder_config = get_embedder_config(EMBEDDER_NAME)
generator_config = get_generator_config(GENERATOR_NAME)

