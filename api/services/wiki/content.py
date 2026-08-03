"""Citation/link post-processing for LLM-generated wiki markdown.

Python port of the frontend `postProcessWikiContent` (src/app/[owner]/[repo]/
page.tsx). Turns the various empty-parenthesis citation forms the model emits
into real repository links, and normalizes the "Relevant source files"
<details> block. Pure functions — unit-tested in test_wiki_content.py.

"""

import re
from dataclasses import dataclass
from urllib.parse import urlparse


@dataclass
class RepoUrlContext:
    """Everything needed to turn a repo-relative path into a web URL."""

    type: str  # 'local' | 'github' | 'gitlab' | 'bitbucket'
    repo_url: str | None
    default_branch: str


def generate_file_url(file_path: str, ctx: RepoUrlContext) -> str:
    """Build a host-specific web URL for a repository-relative file path.

    Returns the bare path unchanged for local repos or unresolved hosts.
    """
    if ctx.type == "local" or not ctx.repo_url:
        return file_path
    try:
        hostname = (urlparse(ctx.repo_url).hostname or "").lower()
    except ValueError:
        return file_path
    if "github" in hostname:
        return f"{ctx.repo_url}/blob/{ctx.default_branch}/{file_path}"
    if "gitlab" in hostname:
        return f"{ctx.repo_url}/-/blob/{ctx.default_branch}/{file_path}"
    if "bitbucket" in hostname:
        return f"{ctx.repo_url}/src/{ctx.default_branch}/{file_path}"
    return file_path


def _escape_label(s: str) -> str:
    """Backslash-escape '[' / ']' so paths render as plain Markdown link labels."""
    return re.sub(r"([\[\]])", r"\\\1", s)


def _line_anchor(url: str, start: str | None, end: str | None) -> str:
    """Host-specific line anchor for an already-resolved file URL."""
    if not start:
        return ""
    try:
        hostname = (urlparse(url).hostname or "").lower()
    except ValueError:
        hostname = ""
    if "github" in hostname:
        return f"#L{start}-L{end}" if end else f"#L{start}"
    if "gitlab" in hostname:
        return f"#L{start}-{end}" if end else f"#L{start}"
    if "bitbucket" in hostname:
        return f"#lines-{start}:{end}" if end else f"#lines-{start}"
    return ""


def _citation_link(
    path: str, start: str | None, end: str | None, ctx: RepoUrlContext
) -> str | None:
    """Resolve `path[:start[-end]]` to a Markdown link, or None if unresolvable."""
    url = generate_file_url(path, ctx)
    if url == path:  # local repo / unresolved host -> no web URL
        return None
    line_part = (f":{start}-{end}" if end else f":{start}") if start else ""
    anchor = _line_anchor(url, start, end)
    return f"[{_escape_label(path)}{line_part}]({url}{anchor})"


_DETAILS_RE = re.compile(
    r"<details>\s*<summary>\s*Relevant source files\s*</summary>[\s\S]*?</details>",
    re.IGNORECASE,
)
# 3. Generic: any `[repo/path.ext:line]()` (files not in filePaths).
_GENERIC_RE = re.compile(r"\[([^\[\]\s()]+?\.[A-Za-z0-9]+)(?::(\d+)(?:-(\d+))?)?\]\(\)")
# 4. `[Sources: path:line]()` — prefix inside the bracket and/or a bare filename.
_PREFIXED_RE = re.compile(
    r"\[(Sources?|Source):\s*([^\[\]\s():]+?)(?::(\d+)(?:-(\d+))?)?\]\(\)",
    re.IGNORECASE,
)
# 5. Redundant empty "()" left immediately after a completed link.
_STRAY_PARENS_RE = re.compile(r"(\]\([^)\s]+\))\(\)")


def post_process_wiki_content(
    content: str, file_paths: list[str], ctx: RepoUrlContext
) -> str:
    """Normalize the <details> block and resolve the citation forms into links."""
    processed = content

    # 1. Rebuild the <details> block from the known file list.
    if file_paths:
        links = "\n".join(
            f"- [{_escape_label(p)}]({generate_file_url(p, ctx)})" for p in file_paths
        )
        details_block = (
            "<details>\n"
            "<summary>Relevant source files</summary>\n\n"
            "The following files were used as context for generating this wiki page:\n\n"
            f"{links}\n"
            "</details>"
        )
        if _DETAILS_RE.search(processed):
            processed = _DETAILS_RE.sub(lambda _m: details_block, processed)
        else:
            processed = f"{details_block}\n\n{processed}"

    # 2. Resolve empty citations against the known filePaths (longest first).
    if file_paths:
        alternation = "|".join(
            re.escape(p) for p in sorted(file_paths, key=len, reverse=True)
        )
        citation_re = re.compile(
            r"\[(" + alternation + r")(?::(\d+)(?:-(\d+))?)?\]\(\)"
        )

        def _repl_known(m: re.Match) -> str:
            link = _citation_link(m.group(1), m.group(2), m.group(3), ctx)
            return link if link is not None else m.group(0)

        processed = citation_re.sub(_repl_known, processed)

    # 3. Resolve any remaining file-path-looking empty citations.
    def _repl_generic(m: re.Match) -> str:
        link = _citation_link(m.group(1), m.group(2), m.group(3), ctx)
        return link if link is not None else m.group(0)

    processed = _GENERIC_RE.sub(_repl_generic, processed)

    # 4. Resolve `[Sources: barename:line]()` via basename lookup.
    if file_paths:
        by_basename: dict[str, str] = {}
        for p in file_paths:
            base = p.rsplit("/", 1)[-1]
            by_basename.setdefault(base, p)

        def _repl_prefixed(m: re.Match) -> str:
            prefix, token, start, end = m.group(1), m.group(2), m.group(3), m.group(4)
            full_path = token if "/" in token else by_basename.get(token)
            if not full_path:
                return m.group(0)
            link = _citation_link(full_path, start, end, ctx)
            if link is None:
                return m.group(0)
            return f"{prefix}: {link}"

        processed = _PREFIXED_RE.sub(_repl_prefixed, processed)

    # 5. Strip a redundant empty "()" after a completed link.
    processed = _STRAY_PARENS_RE.sub(r"\1", processed)

    return processed
