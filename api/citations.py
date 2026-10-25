"""Validate numeric source citations, including grouped references outside code."""
import re


def citation_numbers(text):
    # Numeric array examples inside code are not source-reference markers.
    prose=re.sub(r"```.*?```|~~~.*?~~~", "", text, flags=re.DOTALL)
    prose=re.sub(r"`[^`]*`", "", prose)
    groups=re.findall(r"\[(\d+(?:\s*,\s*\d+)*)\]",prose)
    return [int(number) for group in groups for number in re.split(r"\s*,\s*",group)]
