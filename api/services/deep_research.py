"""Helpers for keeping multi-iteration research tied to its current question."""

from collections.abc import Iterable
from typing import Protocol


CONTINUE_RESEARCH_PROMPT = "Continue the research"


class ChatMessageLike(Protocol):
    role: str
    content: str


def is_continue_research_prompt(content: str) -> bool:
    """Return whether content is the exact prompt emitted by the research client."""
    return content.strip().casefold() == CONTINUE_RESEARCH_PROMPT.casefold()


def latest_research_topic(messages: Iterable[ChatMessageLike]) -> str | None:
    """Find the current research question, ignoring older turns and continuation prompts."""
    for message in reversed(tuple(messages)):
        if message.role != "user" or is_continue_research_prompt(message.content):
            continue
        topic = message.content.strip()
        if topic:
            return topic
    return None
