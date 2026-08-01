#!/usr/bin/env python3
"""
Focused test script for the _extract_repo_name_from_url method

Run this script to test only the repository name extraction functionality.
Usage: python test_extract_repo_name.py
"""

import os

import pytest

from api.repository import CLONE_REPO_ROOT, Repo


class TestExtractRepoNameFromUrl:
    """Comprehensive tests for the _extract_repo_name_from_url method"""

    @pytest.mark.parametrize(
        "repo_url, name",
        [
            ("https://github.com/owner/repo", "owner_repo"),
            ("https://github.com/owner/repo.git", "owner_repo"),
            ("https://github.com/owner/repo/", "owner_repo"),
            ("https://github.com/repo", "repo"),
        ],
    )
    def test_extract_repo_name_github_standard_url(self, repo_url, name):
        # Test standard GitHub URL
        repo = Repo(repo_url=repo_url, repo_type="github")
        assert repo.name == name
        assert not repo.is_local

    @pytest.mark.parametrize(
        "repo_url, name",
        [
            ("https://gitlab.com/owner/repo", "owner_repo"),
            ("https://gitlab.com/group/subgroup/repo", "subgroup_repo"),
        ],
    )
    def test_extract_repo_name_gitlab_urls(self, repo_url, name):
        """Test repository name extraction from GitLab URLs"""

        repo = Repo(repo_url=repo_url, repo_type="gitlab")
        assert repo.name == name
        assert not repo.is_local

    def test_extract_repo_name_bitbucket_urls(self):
        """Test repository name extraction from Bitbucket URLs"""
        repo = Repo(repo_url="https://bitbucket.org/owner/repo", repo_type="bitbucket")
        assert repo.name == "owner_repo"
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
        """Test repository name extraction from local paths"""
        repo = Repo(repo_url=repo_url, repo_type="local")
        assert repo.name == name
        assert repo.is_local


@pytest.mark.parametrize(
    "url, repo_type, target_path",
    [
        (
            "https://github.com/owner/repo",
            "github",
            os.path.join(CLONE_REPO_ROOT, "owner_repo"),
        ),
        (
            "https://github.com/AsyncFuncAI/deepwiki-open",
            "github",
            os.path.join(CLONE_REPO_ROOT, "AsyncFuncAI_deepwiki-open"),
        ),
    ],
)
def test_save_dir(url, repo_type, target_path):
    assert Repo(repo_url=url, repo_type=repo_type).save_path == target_path
