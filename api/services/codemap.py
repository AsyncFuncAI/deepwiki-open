"""Codemap generation pipeline.

Produces a structured, source-grounded "codemap" for a user's usage/how-to question
using a two-call LLM flow:

  1. skeleton  — analyze code + generate the initial codemap (sections, steps, citations)
  2. enrich    — fill in per-section prose guides and mermaid diagrams

Results are streamed to the client as newline-delimited JSON (NDJSON) events so the UI
can render the three-phase progress (analyzing -> initial codemap -> diagrams/guides).
"""

import asyncio
import json
import os
import re
from collections.abc import AsyncIterator, Callable

from api.chat import ChatStreamer, prompt_builder
from api.config import get_model_config
from api.logger import get_logger
from api.prompts import CODEMAP_ENRICH_PROMPT, CODEMAP_SKELETON_PROMPT
from api.rag import RAG
from api.schemas import CodeMap, CodeMapRequest

logger = get_logger(__name__)


def _event(**payload) -> str:
    """Serialize one NDJSON event line."""
    return json.dumps(payload, ensure_ascii=False) + "\n"


def _phase(phase: str, status: str, **extra) -> str:
    return _event(type="phase", phase=phase, status=status, **extra)


async def _collect_stream(streamer: ChatStreamer, prompt: str) -> str:
    """Run a streaming completion to the end and return the full text."""
    parts: list[str] = []
    async for chunk in streamer.respond_stream(prompt):
        parts.append(chunk)
    return "".join(parts)


async def _generate_json(
    streamer_factory: Callable[[], ChatStreamer],
    prompt: str,
    attempts: int = 3,
) -> dict:
    """Collect a completion and parse JSON, retrying on malformed output.

    A fresh streamer is used per attempt so nondeterministic JSON glitches from
    smaller local models get another chance to come out valid.
    """
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        raw = await _collect_stream(streamer_factory(), prompt)
        try:
            return _extract_json(raw)
        except Exception as e:  # noqa: BLE001
            last_error = e
            logger.warning("JSON parse attempt %d/%d failed: %s", attempt, attempts, e)
    raise ValueError(
        f"Model did not return valid JSON after {attempts} attempts: {last_error}"
    )


def _repair_json(candidate: str) -> str:
    """Fix a few common LLM JSON glitches (trailing commas, stray quote+space
    before a key such as ``" "id":``)."""
    repaired = re.sub(r",\s*([}\]])", r"\1", candidate)  # trailing commas
    repaired = re.sub(r'"\s+"(\w+)"\s*:', r'"\1":', repaired)  # `" "key":` -> `"key":`
    return repaired


def _extract_json(text: str) -> dict:
    """Best-effort extraction of a single JSON object from model output.

    Handles ```json fences and leading/trailing prose by scanning for the first
    balanced top-level object, with a light repair pass for common glitches.
    """
    if not text:
        raise ValueError("Empty model response")

    # Strip common code fences.
    cleaned = text.strip()
    if cleaned.startswith("```"):
        # remove opening fence (```json or ```) and trailing fence
        cleaned = cleaned.split("\n", 1)[-1]
        if cleaned.rstrip().endswith("```"):
            cleaned = cleaned.rstrip()[:-3]

    # Isolate the first balanced top-level object (ignoring braces inside strings).
    start = cleaned.find("{")
    if start == -1:
        raise ValueError("No JSON object found in model response")
    depth = 0
    in_str = False
    escape = False
    candidate = cleaned[start:]
    for i in range(start, len(cleaned)):
        ch = cleaned[i]
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                candidate = cleaned[start : i + 1]
                break

    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return json.loads(_repair_json(candidate))  # may still raise -> caller retries


def _format_context(documents: list) -> str:
    """Group retrieved chunks by file and annotate each with its real line range."""
    docs_by_file: dict[str, list] = {}
    for doc in documents:
        file_path = doc.meta_data.get("file_path", "unknown")
        docs_by_file.setdefault(file_path, []).append(doc)

    context_parts = []
    for file_path, docs in docs_by_file.items():
        chunk_texts = []
        for doc in docs:
            start_line = doc.meta_data.get("start_line")
            end_line = doc.meta_data.get("end_line")
            if start_line and end_line:
                chunk_texts.append(f"[lines {start_line}-{end_line}]\n{doc.text}")
            else:
                chunk_texts.append(doc.text)
        header = f"## File Path: {file_path}\n\n"
        context_parts.append(header + "\n\n".join(chunk_texts))

    return "\n\n" + ("-" * 10) + "\n\n".join(context_parts)


def local_repo_dir(repo_url: str, repo_type: str | None) -> str:
    """Resolve the on-disk directory of a cloned/local repository."""
    from adalflow.utils import get_adalflow_default_root_path

    repo_url = repo_url.strip()
    if repo_url.startswith("http://") or repo_url.startswith("https://"):
        parts = repo_url.rstrip("/").split("/")
        if repo_type in ("github", "gitlab", "bitbucket") and len(parts) >= 5:
            name = f"{parts[-2]}_{parts[-1].replace('.git', '')}"
        else:
            name = parts[-1].replace(".git", "")
        return os.path.join(get_adalflow_default_root_path(), "repos", name)
    return repo_url  # already a local path


def read_repo_file(repo_url: str, repo_type: str | None, file_path: str) -> str:
    """Read a file from the cloned/local repository, guarding against traversal."""
    repo_dir = os.path.realpath(local_repo_dir(repo_url, repo_type))
    target = os.path.realpath(os.path.join(repo_dir, file_path))
    if os.path.commonpath([repo_dir, target]) != repo_dir:
        raise ValueError("Resolved path escapes the repository directory")
    if not os.path.isfile(target):
        raise FileNotFoundError(file_path)
    with open(target, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def _locate_snippet(text: str, snippet: str) -> tuple[int, int] | None:
    """Find the 1-based line range of ``snippet`` inside ``text``.

    LLM-provided line numbers are unreliable, but the snippet is copied verbatim,
    so the true location is recovered by searching the real file.
    """
    snippet = snippet.strip("\n")
    if not snippet:
        return None
    pos = text.find(snippet)
    if pos != -1:
        start = text.count("\n", 0, pos) + 1
        return start, start + snippet.count("\n")
    # Fallback: anchor on the first non-blank line of the snippet.
    first = next((ln.strip() for ln in snippet.splitlines() if ln.strip()), "")
    if first:
        idx = text.find(first)
        if idx != -1:
            start = text.count("\n", 0, idx) + 1
            return start, start + snippet.count("\n")
    return None


def _ground_citations(codemap: CodeMap, repo_dir: str) -> None:
    """Overwrite each citation's line range with the true snippet location in the
    cloned source file, so the code viewer highlights the right lines."""
    file_cache: dict[str, str | None] = {}
    for section in codemap.sections:
        for step in section.steps:
            cit = step.citation
            if not cit or not cit.snippet or not cit.file_path:
                continue
            if cit.file_path not in file_cache:
                path = os.path.join(repo_dir, cit.file_path)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        file_cache[cit.file_path] = f.read()
                except (OSError, UnicodeDecodeError):
                    file_cache[cit.file_path] = None
            text = file_cache[cit.file_path]
            if not text:
                continue
            loc = _locate_snippet(text, cit.snippet)
            if loc:
                cit.start_line, cit.end_line = loc


async def generate_codemap(request: CodeMapRequest) -> AsyncIterator[str]:
    """Generate a codemap, yielding NDJSON progress + result events."""
    repo_url = request.repo_url
    repo_name = repo_url.rstrip("/").split("/")[-1] if "/" in repo_url else repo_url
    repo_type = request.type

    prompt_fmt = {
        "repo_type": repo_type,
        "repo_url": repo_url,
        "repo_name": repo_name,
        "language_name": request.language or "en",
    }

    # ---- Phase 1a: analyzing code (RAG retrieval) ---------------------------------
    yield _phase("analyzing", "start")
    rag = await asyncio.to_thread(RAG, provider=request.provider, model=request.model)
    await rag.aprepare_retriever(
        request.repo_url,
        request.type,
        request.token,
        excluded_files=request.excluded_files,
        excluded_dirs=request.excluded_dirs,
        included_files=request.included_files,
        included_dirs=request.included_dirs,
    )
    retrieved = await rag.acall(request.question, language=request.language or "en")
    documents = retrieved[0].documents if retrieved and retrieved[0].documents else []
    logger.info("Codemap retrieval returned %d chunks", len(documents))
    context_text = _format_context(documents) if documents else ""
    yield _phase("analyzing", "done", chunk_count=len(documents))

    model_config = get_model_config(request.provider, request.model)["model_kwargs"]

    def _new_streamer() -> ChatStreamer:
        return ChatStreamer.create(
            provider=request.provider,
            model=request.model,
            model_config=model_config,
        )

    # ---- Phase 1b: initial codemap skeleton ---------------------------------------
    yield _phase("initial_codemap", "start")
    skeleton_prompt = prompt_builder(
        system_prompt=CODEMAP_SKELETON_PROMPT.format(**prompt_fmt),
        query=request.question,
        context=context_text,
    )
    try:
        skeleton = CodeMap.model_validate(
            await _generate_json(_new_streamer, skeleton_prompt)
        )
    except Exception as e:  # noqa: BLE001
        logger.error("Failed to parse codemap skeleton: %s", e)
        yield _event(type="error", stage="initial_codemap", message=str(e))
        return
    yield _phase("initial_codemap", "done", section_count=len(skeleton.sections))

    # ---- Phase 2: diagrams and guides ---------------------------------------------
    yield _phase("diagrams", "start")
    enrich_query = (
        f"{request.question}\n\n<SKELETON>\n"
        f"{skeleton.model_dump_json()}\n</SKELETON>"
    )
    enrich_prompt = prompt_builder(
        system_prompt=CODEMAP_ENRICH_PROMPT.format(**prompt_fmt),
        query=enrich_query,
        context=context_text,
    )
    final = skeleton
    try:
        final = CodeMap.model_validate(
            await _generate_json(_new_streamer, enrich_prompt, attempts=2)
        )
        yield _phase("diagrams", "done")
    except Exception as e:  # noqa: BLE001
        # Non-fatal: fall back to the skeleton (no diagrams/guides) so the user
        # still gets a usable codemap.
        logger.warning("Diagram/guide enrichment failed, using skeleton: %s", e)
        yield _phase("diagrams", "done", degraded=True)

    # Ground citation line numbers against the real source (LLM line numbers are
    # guesses; the verbatim snippet is authoritative).
    repo_dir = (getattr(rag.db_manager, "repo_paths", None) or {}).get("save_repo_dir")
    if repo_dir:
        _ground_citations(final, repo_dir)

    yield _event(type="codemap", data=final.model_dump())
    yield _event(type="done")
