from adalflow import GoogleGenAIClient, OllamaClient
from adalflow.components.model_client.openai_client import OpenAIClient
import os

# Configuration for the isolated API
configs = {
    "embedder": {
        "batch_size": 500,
        "model_client": OpenAIClient,
        "model_kwargs": {
            "model": "text-embedding-3-small",
            "dimensions": 256,
            "encoding_format": "float",
        },
    },
    "retriever": {
        "top_k": 20,
    },
    "generator": {
        "model_client": GoogleGenAIClient,
        "model_kwargs": {
            "model": "gemini-2.5-flash-preview-04-17",
            "temperature": 0.7,
            "top_p": 0.8,
        },
    },
    "embedder_ollama": {
        "model_client": OllamaClient,
        "model_kwargs": {
            "model": "nomic-embed-text"
        },
    },
    "generator_ollama": {
        "model_client": OllamaClient,
        "model_kwargs": {
            "model": "qwen3:1.7b",
            "options": {
                "temperature": 0.7,
                "top_p": 0.8,
            }
        },
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
            "./logs/", "./log/", "./tmp/", "./temp/",
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

# Get API keys from environment variables
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')

# Set keys in environment (in case they're needed elsewhere in the code)
if OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
if GOOGLE_API_KEY:
    os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
