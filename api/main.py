import uvicorn
import os
import sys
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from api.logging_config import setup_logging

# Configure logging
setup_logging()
logger = logging.getLogger(__name__)

# Add the current directory to the path so we can import the api package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Check for required environment variables - only require OPENAI_API_KEY since using LiteLLM
required_env_vars = ['OPENAI_API_KEY']
missing_vars = [var for var in required_env_vars if not os.environ.get(var)]
if missing_vars:
    logger.warning(f"Missing environment variables: {', '.join(missing_vars)}")
    logger.warning("Some functionality may not work correctly without these variables.")

# Only configure Google Generative AI if GOOGLE_API_KEY is available
# Since user is using LiteLLM, this is optional
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
if GOOGLE_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)
        logger.info("Google API configured")
    except ImportError:
        logger.warning("google.generativeai not available, skipping Google API configuration")
else:
    logger.info("GOOGLE_API_KEY not provided - using LiteLLM unified interface")

if __name__ == "__main__":
    # Force API to use port 8001, ignore Cloud Run's PORT variable
    # Cloud Run's PORT is meant for the frontend service
    port = int(os.environ.get("API_PORT", 8001))
    
    # Import the app here to ensure environment variables are set first
    from api.api import app

    logger.info(f"Starting Streaming API on port {port}")

    # Run the FastAPI app with uvicorn
    # Disable reload in production/Docker environment
    is_development = os.environ.get("NODE_ENV") != "production"
    
    if is_development:
        # Prevent infinite logging loop caused by file changes triggering log writes
        logging.getLogger("watchfiles.main").setLevel(logging.WARNING)

    logger.info(f"Starting uvicorn server on 0.0.0.0:{port}")
    
    uvicorn.run(
        "api.api:app",
        host="0.0.0.0",
        port=port,
        reload=is_development,
        log_level="info"
    )
