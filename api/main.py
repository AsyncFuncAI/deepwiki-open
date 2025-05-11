import uvicorn
import os
import sys
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Unified Logging Configuration ---
# Determine the project's base directory (assuming main.py is in 'api' subdirectory)
# Adjust if your structure is different, e.g., if main.py is at the root.
# This assumes 'api/main.py', so logs will be in 'api/logs/application.log'
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE_PATH = os.path.join(LOG_DIR, "application.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(lineno)d %(filename)s:%(funcName)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE_PATH),
        logging.StreamHandler()  # Also keep logging to console
    ],
    force=True  # Ensure this configuration takes precedence and clears any existing handlers
)

# Get a logger for this main module (optional, but good practice)
logger = logging.getLogger(__name__)

# Add the current directory to the path so we can import the api package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Check for required environment variables
required_env_vars = ['GOOGLE_API_KEY', 'OPENAI_API_KEY']
missing_vars = [var for var in required_env_vars if not os.environ.get(var)]
if missing_vars:
    logger.warning(f"Missing environment variables: {', '.join(missing_vars)}")
    logger.warning("Some functionality may not work correctly without these variables.")

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 8001))

    # Import the app here to ensure environment variables are set first
    from api.api import app

    logger.info(f"Starting Streaming API on port {port}")

    # Run the FastAPI app with uvicorn
    uvicorn.run(
        "api.api:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
