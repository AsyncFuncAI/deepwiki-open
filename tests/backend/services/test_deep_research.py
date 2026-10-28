from dataclasses import dataclass

from api.services.deep_research import (
    is_continue_research_prompt,
    latest_research_topic,
)


@dataclass
class Message:
    role: str
    content: str


def test_continuation_uses_latest_completed_research_topic():
    messages = [
        Message("user", "Question A"),
        Message("assistant", "Answer A"),
        Message("user", "Question B"),
        Message("assistant", "Plan for B"),
        Message("user", "Continue the research"),
    ]

    assert latest_research_topic(messages) == "Question B"


def test_continuation_prompt_match_is_exact_and_case_insensitive():
    assert is_continue_research_prompt("  continue the research  ")
    assert not is_continue_research_prompt("How can I continue research on this?")


def test_no_topic_returns_none_when_only_continuation_is_present():
    assert latest_research_topic([Message("user", "Continue the research")]) is None


def test_latest_user_question_wins_and_is_trimmed():
    messages = [
        Message("user", "Question A"),
        Message("assistant", "Answer A"),
        Message("user", "  Question B  "),
    ]

    assert latest_research_topic(messages) == "Question B"
