import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Load environment variables from .env file
# ruff: noqa: E402
load_dotenv()
# ruff: noqa: E402

from api.logger import get_logger, setup_logging
from api.routers import auth, chat, codemap, repo, system, wiki

# Configure logging
setup_logging()
logger = get_logger(__name__)

# Configure watchfiles logger to show file paths
watchfiles_logger = logging.getLogger("watchfiles.main")
watchfiles_logger.setLevel(logging.DEBUG)  # Enable DEBUG to see file paths

# Apply watchfiles monkey patch BEFORE uvicorn import
is_development = os.environ.get("NODE_ENV") != "production"
if is_development:
    import watchfiles

    current_dir = os.path.dirname(os.path.abspath(__file__))
    logs_dir = os.path.join(current_dir, "logs")

    original_watch = watchfiles.watch

    def patched_watch(*args, **kwargs):
        # Only watch the api directory but exclude logs subdirectory
        # Instead of watching the entire api directory, watch specific subdirectories
        api_subdirs = []
        for item in os.listdir(current_dir):
            item_path = os.path.join(current_dir, item)
            if os.path.isdir(item_path) and item != "logs":
                api_subdirs.append(item_path)
            elif os.path.isfile(item_path) and item.endswith(".py"):
                api_subdirs.append(item_path)

        return original_watch(*api_subdirs, **kwargs)

    watchfiles.watch = patched_watch

app = FastAPI(
    title="Streaming API",
    description="API for streaming chat completions and wiki generation",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (
    system,
    auth,
    repo,
    wiki,
    chat,
    codemap,
):
    app.include_router(module.router)


@app.get("/")
async def root():
    """Root endpoint to check if the API is running and list available endpoints dynamically."""
    # Collect routes dynamically from the FastAPI app
    endpoints = {}
    for route in app.routes:
        if hasattr(route, "methods") and hasattr(route, "path"):
            # Skip docs and static routes
            if route.path in ["/openapi.json", "/docs", "/redoc", "/favicon.ico"]:
                continue
            # Group endpoints by first path segment
            path_parts = route.path.strip("/").split("/")
            group = path_parts[0].capitalize() if path_parts[0] else "Root"
            method_list = list(route.methods - {"HEAD", "OPTIONS"})
            for method in method_list:
                endpoints.setdefault(group, []).append(f"{method} {route.path}")

    # Optionally, sort endpoints for readability
    for group in endpoints:
        endpoints[group].sort()

    return {
        "message": "Welcome to Streaming API",
        "version": "1.0.0",
        "endpoints": endpoints,
    }


if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 8001))

    logger.info(f"Starting Streaming API on port {port}")

    # Run the FastAPI app with uvicorn
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=port,
        reload=is_development,
        reload_excludes=["**/logs/*", "**/__pycache__/*", "**/*.pyc"]
        if is_development
        else None,
    )
