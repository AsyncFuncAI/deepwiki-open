#!/usr/bin/env python3
"""
Focused test script for the _extract_repo_name_from_url method

Run this script to test only the repository name extraction functionality.
Usage: python test_extract_repo_name.py
"""

import os
import re

import pytest

from api.repository import CLONE_REPO_ROOT, Repo

# The name now ends with a 10-hex-char digest of the full canonical identity
# (type + host + path), appended to stop different repositories from
# colliding on the same clone/index storage key (see
# test_extract_repo_name_avoids_collisions below). Tests check the
# human-readable prefix and the digest's shape, not an exact legacy string.
_DIGEST_SUFFIX_RE = re.compile(r"^[0-9a-f]{10}$")


def _prefix_and_digest(name: str) -> tuple[str, str]:
    prefix, _, digest = name.rpartition("_")
    assert _DIGEST_SUFFIX_RE.match(digest), f"{name!r} has no digest suffix"
    return prefix, digest


class TestExtractRepoNameFromUrl:
    """Comprehensive tests for the _extract_repo_name_from_url method"""

    @pytest.mark.parametrize(
        "repo_url, prefix",
        [
            ("https://github.com/owner/repo", "owner_repo"),
            ("https://github.com/owner/repo.git", "owner_repo"),
            ("https://github.com/owner/repo/", "owner_repo"),
            ("https://github.com/repo", "repo"),
        ],
    )
    def test_extract_repo_name_github_standard_url(self, repo_url, prefix):
        # Test standard GitHub URL
        repo = Repo(repo_url=repo_url, repo_type="github")
        assert _prefix_and_digest(repo.name)[0] == prefix
        assert not repo.is_local

    @pytest.mark.parametrize(
        "repo_url, prefix",
        [
            ("https://gitlab.com/owner/repo", "owner_repo"),
            ("https://gitlab.com/group/subgroup/repo", "subgroup_repo"),
        ],
    )
    def test_extract_repo_name_gitlab_urls(self, repo_url, prefix):
        """Test repository name extraction from GitLab URLs"""

        repo = Repo(repo_url=repo_url, repo_type="gitlab")
        assert _prefix_and_digest(repo.name)[0] == prefix
        assert not repo.is_local

    def test_extract_repo_name_bitbucket_urls(self):
        """Test repository name extraction from Bitbucket URLs"""
        repo = Repo(repo_url="https://bitbucket.org/owner/repo", repo_type="bitbucket")
        assert _prefix_and_digest(repo.name)[0] == "owner_repo"
        assert not repo.is_local

    @pytest.mark.parametrize(
        "repo_url, name",
        [
            ("/home/user/projects/my-repo", "my-repo"),
            ("/var/repos/project.git", "project.git"),
            ("my-repo", "my-repo"),
        ],
    )
    def test_extract_repo_name_local_paths(self, repo_url, name):
        """Test repository name extraction from local paths.

        Local paths are not digested: they never shared this class's
        collision problem because `save_path` returns the literal
        filesystem path, not a derived storage key.
        """
        repo = Repo(repo_url=repo_url, repo_type="local")
        assert repo.name == name
        assert repo.is_local

    def test_extract_repo_name_is_deterministic(self):
        """Re-deriving the name for the same URL must give the same key,
        so an already-indexed repository's cache is found on a later call."""
        a = Repo(repo_url="https://github.com/owner/repo", repo_type="github").name
        b = Repo(repo_url="https://github.com/owner/repo", repo_type="github").name
        assert a == b

    @pytest.mark.parametrize(
        "url_a, type_a, url_b, type_b",
        [
            # Same owner/repo, different host entirely.
            (
                "https://github.com/acme/widget",
                "github",
                "https://gitlab.com/acme/widget",
                "gitlab",
            ),
            # GitLab subgroup path whose last two segments match a
            # different top-level owner/repo pair.
            (
                "https://gitlab.com/acme/widget",
                "gitlab",
                "https://gitlab.com/some/other/group/acme/widget",
                "gitlab",
            ),
        ],
    )
    def test_extract_repo_name_avoids_collisions(self, url_a, type_a, url_b, type_b):
        """Regression for the cache-confusion bug: two distinct repositories
        whose last two URL path segments match (across different hosts, or
        across a GitLab subgroup path vs. a top-level owner/repo) must not
        derive the same storage key."""
        name_a = Repo(repo_url=url_a, repo_type=type_a).name
        name_b = Repo(repo_url=url_b, repo_type=type_b).name
        assert name_a != name_b


@pytest.mark.parametrize(
    "url, repo_type, prefix",
    [
        (
            "https://github.com/owner/repo",
            "github",
            "owner_repo",
        ),
        (
            "https://github.com/AsyncFuncAI/deepwiki-open",
            "github",
            "AsyncFuncAI_deepwiki-open",
        ),
    ],
)
def test_save_dir(url, repo_type, prefix):
    save_path = Repo(repo_url=url, repo_type=repo_type).save_path
    assert os.path.dirname(save_path) == CLONE_REPO_ROOT
    assert _prefix_and_digest(os.path.basename(save_path))[0] == prefix
