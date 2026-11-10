import re

from api.services.wiki.content import (
    RepoUrlContext,
    generate_file_url,
    post_process_wiki_content,
)

GITHUB = RepoUrlContext(
    type="github",
    repo_url="https://github.com/AsyncFuncAI/deepwiki-open",
    default_branch="main",
)
BASE = "https://github.com/AsyncFuncAI/deepwiki-open/blob/main"


# --------------------------------------------------------------------------- #
# generate_file_url
# --------------------------------------------------------------------------- #
def test_generate_file_url_github():
    assert generate_file_url("README.md", GITHUB) == f"{BASE}/README.md"


def test_generate_file_url_gitlab():
    ctx = RepoUrlContext("gitlab", "https://gitlab.com/o/r", "dev")
    assert generate_file_url("a/b.py", ctx) == "https://gitlab.com/o/r/-/blob/dev/a/b.py"


def test_generate_file_url_bitbucket():
    ctx = RepoUrlContext("bitbucket", "https://bitbucket.org/o/r", "main")
    assert generate_file_url("a/b.py", ctx) == "https://bitbucket.org/o/r/src/main/a/b.py"


def test_generate_file_url_local_returns_bare_path():
    ctx = RepoUrlContext("local", None, "main")
    assert generate_file_url("a/b.py", ctx) == "a/b.py"


# --------------------------------------------------------------------------- #
# post_process_wiki_content
# --------------------------------------------------------------------------- #
def test_resolves_citation_for_file_in_filepaths():  # case 1
    out = post_process_wiki_content("text [README.md:1-27]().", ["README.md"], GITHUB)
    assert f"[README.md:1-27]({BASE}/README.md#L1-L27)" in out
    assert "]()" not in out


def test_resolves_generic_citation_not_in_filepaths():  # case 2
    path = "src/i18n.ts"
    out = post_process_wiki_content(
        f"see [{path}:67-111]().", ["src/utils/getRepoUrl.tsx"], GITHUB
    )
    assert f"[{path}:67-111]({BASE}/{path}#L67-L111)" in out
    assert "]()" not in out


def test_strips_redundant_empty_parens_after_link():  # case 3
    path = "src/app/page.tsx"
    text = f"x [{path}]({BASE}/{path})()"
    assert post_process_wiki_content(text, [], GITHUB) == f"x [{path}]({BASE}/{path})"


def test_resolves_sources_prefix_bare_filename():  # variant 2
    full = "src/i18n.ts"
    out = post_process_wiki_content("flow [Sources: i18n.ts:1-10]().", [full], GITHUB)
    assert f"Sources: [{full}:1-10]({BASE}/{full}#L1-L10)" in out
    assert "]()" not in out


def test_unknown_bare_filename_left_untouched():
    # not_exist.tsx not a basename of any filePath -> the citation stays unresolved.
    # (The <details> block is still prepended because filePaths is non-empty.)
    text = "[Sources: not_exist.tsx:1-47]()"
    out = post_process_wiki_content(text, ["src/app/page.tsx"], GITHUB)
    assert "[Sources: not_exist.tsx:1-47]()" in out


def test_rebuilds_details_block_when_missing():
    out = post_process_wiki_content("# Title", ["README.md"], GITHUB)
    assert out.startswith("<details>")
    assert f"[README.md]({BASE}/README.md)" in out


def test_local_repo_citations_not_resolved():
    ctx = RepoUrlContext("local", None, "main")
    assert "[a/b.py:1-2]()" in post_process_wiki_content("[a/b.py:1-2]()", ["a/b.py"], ctx)


def test_escapes_brackets_in_dynamic_route_path():
    path = "src/app/[owner]/[repo]/page.tsx"
    out = post_process_wiki_content(f"[{path}:10]()", [path], GITHUB)
    assert "src/app/\\[owner\\]/\\[repo\\]/page.tsx:10](" in out


def test_single_line_citation():
    out = post_process_wiki_content("[README.md:15]()", ["README.md"], GITHUB)
    assert f"[README.md:15]({BASE}/README.md#L15)" in out


def test_whole_file_citation_no_lines():
    out = post_process_wiki_content("[README.md]()", ["README.md"], GITHUB)
    assert f"[README.md]({BASE}/README.md)" in out


def _link_destinations(markdown: str) -> list[str]:
    """CommonMark destinations in `](url)`. A raw space or `)` ends the URL."""
    return re.findall(r"\]\(([^)\s]*)\)", markdown)


def test_route_group_parentheses_stay_inside_the_link():
    # Next.js route groups are directories named "(marketing)". A raw ")" ends
    # the Markdown destination, so the link never reaches page.tsx.
    path = "src/app/(marketing)/page.tsx"
    out = post_process_wiki_content(f"[{path}:10]()", [path], GITHUB)
    encoded = "src/app/%28marketing%29/page.tsx"
    assert f"[{path}:10]({BASE}/{encoded}#L10)" in out
    assert all("(" not in dest and ")" not in dest for dest in _link_destinations(out))
    assert any(dest.endswith(f"/{encoded}#L10") for dest in _link_destinations(out))


def test_space_in_file_name_is_percent_encoded():
    path = "docs/My Notes.md"
    out = post_process_wiki_content(f"See [{path}]().", [path], GITHUB)
    encoded = "docs/My%20Notes.md"
    assert f"[{path}]({BASE}/{encoded})" in out
    assert all(" " not in dest for dest in _link_destinations(out))


def test_web_hosts_encode_parentheses_without_changing_link_text():
    path = "src/app/(marketing)/page.tsx"
    encoded = "src/app/%28marketing%29/page.tsx"
    contexts = (
        RepoUrlContext("github", "https://github.com/o/r", "main"),
        RepoUrlContext("gitlab", "https://gitlab.com/o/r", "main"),
        RepoUrlContext("bitbucket", "https://bitbucket.org/o/r", "main"),
    )

    for ctx in contexts:
        out = post_process_wiki_content(f"[{path}]()", [path], ctx)
        assert f"[{path}](" in out
        assert f"/{encoded})" in out


def test_already_encoded_path_is_not_double_encoded():
    path = "docs/My%20Notes%20%28draft%29.md"
    assert generate_file_url(path, GITHUB) == f"{BASE}/{path}"


def test_stray_percent_sign_is_encoded():
    assert generate_file_url("docs/100%.md", GITHUB) == f"{BASE}/docs/100%25.md"


def test_local_paths_are_not_percent_encoded():
    ctx = RepoUrlContext("local", None, "main")
    path = "src/app/(marketing)/page.tsx"
    assert generate_file_url(path, ctx) == path
