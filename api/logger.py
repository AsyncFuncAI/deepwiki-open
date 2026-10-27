import json
import logging
import logging.config
import os
from pathlib import Path
from typing import Any

__all__ = ["get_logger", "setup_logging"]


def get_logger(name: str | None = None) -> logging.Logger:
    """Get a logger instance with a specific name in `deepwiki` namespace.

    Parameters
    ----------
    name: Optional[str]
        The name of the logger. default=None.

    Returns
    -------
    logging.Logger
        A logger instance with the specific name.

    """
    logger = logging.getLogger("deepwiki")
    if name:
        logger = logger.getChild(name)

    return logger


def _default_log_config(
    path: str | None = None,
    max_bytes: int = 10485760,  # 10MB
    backup_count: int = 5,
) -> dict[str, Any]:
    handlers: dict[str, dict[str, str | int]] = {
        "stdout": {
            "class": "logging.StreamHandler",
            "level": "INFO",
            "formatter": "default",
            "stream": "ext://sys.stdout",
        },
    }
    if path is not None:
        log_dir = os.path.dirname(path)
        if log_dir:
            os.makedirs(log_dir, exist_ok=True)

        handlers["ps_file"] = {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "INFO",
            "formatter": "default",
            "filename": path,
            "maxBytes": max_bytes,
            "backupCount": backup_count,
            "encoding": "utf-8",
        }
    loggers = {
        "deepwiki": {
            "handlers": list(handlers.keys()),
            "level": "INFO",
            "propagate": False,
        },
    }

    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s - %(levelname)s - %(name)s - %(filename)s:%(lineno)d - %(message)s",
            },
        },
        "handlers": handlers,
        "loggers": loggers,
    }


def _ensure_handler_dirs(log_cfg: dict[str, Any]) -> None:
    """Create parent directories for any file-based handlers in the config."""
    for handler in log_cfg.get("handlers", {}).values():
        if filename := handler.get("filename"):
            log_dir = os.path.dirname(filename)
            if log_dir:
                os.makedirs(log_dir, exist_ok=True)


def setup_logging() -> None:
    cfg_path = os.path.join(os.getcwd(), "log_cfg.json")
    if os.path.isfile(cfg_path):
        print(f"loading config from {cfg_path}")
        with open(cfg_path, "r") as f:
            log_cfg = json.load(f)
        _ensure_handler_dirs(log_cfg)
    else:
        log_file = os.getenv(
            "LOG_FILE_PATH",
            (Path(__file__).parent / "logs" / "application.log").as_posix(),
        )
        log_cfg = _default_log_config(
            log_file,
            max_bytes=int(os.getenv("LOG_MAX_SIZE", "10")) * 1024 * 1024,
            backup_count=int(os.getenv("LOG_BACKUP_COUNT", "5")),
        )

    logging.config.dictConfig(log_cfg)
