from api.chat._prompts import prompt_builder
from api.chat._stream import ChatStreamer


def is_token_limit_error(exc: Exception) -> bool:
    error_message = str(exc).lower()
    return any(
        k in error_message
        for k in (
            "maximum context length",
            "token limit",
            "too many tokens",
        )
    )


__all__ = [
    "ChatStreamer",
    "prompt_builder",
    "is_token_limit_error",
]
