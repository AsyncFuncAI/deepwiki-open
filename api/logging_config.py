import logging
import os
from pathlib import Path

def setup_logging(format: str = None):
    """
    Configure logging for the application.
    Reads LOG_LEVEL and LOG_FILE_PATH from environment (defaults: INFO, logs/application.log).
    Ensures log directory exists, and configures both file and console handlers.
    """
    # Determine log directory and default file path
    base_dir = Path(__file__).parent
    log_dir = base_dir / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    default_log_file = log_dir / "application.log"

    # Get log level and file path from environment
    log_level_str = os.environ.get("LOG_LEVEL", "INFO").upper()
    log_level = getattr(logging, log_level_str, logging.INFO)
    log_file_path = os.environ.get("LOG_FILE_PATH", str(default_log_file))

    # Configure logging handlers and format
    logging.basicConfig(
        level=log_level,
        format=format or "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler(log_file_path),
            logging.StreamHandler()
        ],
        force=True
    )

    # Initial debug message to confirm configuration
    logger = logging.getLogger(__name__)
    logger.debug(f"Log level set to {log_level_str}, log file: {log_file_path}")