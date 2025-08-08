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

# Import Azure configuration functions
from api.config import is_azure_openai_configured, GOOGLE_API_KEY

# Check for required environment variables - bypass if Azure OpenAI is configured
use_azure_openai = is_azure_openai_configured()

if use_azure_openai:
    logger.info("Azure OpenAI configuration detected. Using Azure OpenAI for both text generation and embeddings.")
else:
    required_env_vars = ['GOOGLE_API_KEY', 'OPENAI_API_KEY']
    missing_vars = [var for var in required_env_vars if not os.environ.get(var)]
    if missing_vars:
        logger.warning(f"Missing environment variables: {', '.join(missing_vars)}")
        logger.warning("Some functionality may not work correctly without these variables.")

# Configure Google Generative AI (only if not using Azure OpenAI exclusively)
import google.generativeai as genai

if GOOGLE_API_KEY and not use_azure_openai:
    genai.configure(api_key=GOOGLE_API_KEY)
else:
    if not use_azure_openai:
        logger.warning("GOOGLE_API_KEY not configured")
    else:
        logger.info("Using Azure OpenAI instead of Google Generative AI")

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 8001))

    # Import the app here to ensure environment variables are set first
    from api.api import app

    logger.info(f"Starting Streaming API on port {port}")

    # Run the FastAPI app with uvicorn
    # Disable reload in production/Docker environment
    is_development = os.environ.get("NODE_ENV") != "production"
    
    if is_development:
        # Prevent infinite logging loop caused by file changes triggering log writes
        logging.getLogger("watchfiles.main").setLevel(logging.WARNING)

    uvicorn.run(
        "api.api:app",
        host="0.0.0.0",
        port=port,
        reload=is_development
    )
