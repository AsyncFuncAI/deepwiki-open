import pytest
import re
import os

import git

from api.repository import Repo
from api.utils import deepwiki_root


def test_repo_is_local():
    repo = Repo(repo_url="./", repo_type="local")
    assert repo.is_local


def test_repo_save_path_rejects_local_path_outside_allowed_roots(monkeypatch):
    """A caller-supplied local path outside the allowlist must not resolve.

    Regression for the unauthenticated arbitrary-file-read/indexing bug:
    `repo_url="/"` previously made `save_path` return `/` unchanged, so any
    server-readable file was reachable through `/codemap/file` and the RAG
    indexer with no containment at all.
    """
    monkeypatch.delenv("DEEPWIKI_ALLOWED_LOCAL_ROOTS", raising=False)
    repo = Repo(repo_url="/", repo_type=None)
    assert repo.is_local
    with pytest.raises(ValueError, match="not within an allowed root"):
        repo.save_path


def test_repo_save_path_allows_local_path_within_deepwiki_root(monkeypatch, tmpdir):
    monkeypatch.delenv("DEEPWIKI_ALLOWED_LOCAL_ROOTS", raising=False)
    allowed_dir = os.path.join(deepwiki_root(), "local_repos", "project")
    os.makedirs(allowed_dir, exist_ok=True)
    repo = Repo(repo_url=allowed_dir, repo_type=None)
    assert repo.save_path == os.path.realpath(allowed_dir)


def test_repo_save_path_allows_extra_root_via_env_var(monkeypatch, tmpdir):
    monkeypatch.setenv("DEEPWIKI_ALLOWED_LOCAL_ROOTS", str(tmpdir))
    repo = Repo(repo_url=str(tmpdir), repo_type=None)
    assert repo.save_path == os.path.realpath(str(tmpdir))

    monkeypatch.delenv("DEEPWIKI_ALLOWED_LOCAL_ROOTS", raising=False)
    with pytest.raises(ValueError, match="not within an allowed root"):
        Repo(repo_url=str(tmpdir), repo_type=None).save_path


def test_repo_save_path_rejects_symlink_escape_from_allowed_root(monkeypatch, tmpdir):
    """A symlink inside an allowed root that points outside it must not be
    treated as in-bounds (realpath dereferences it before the containment
    check, which is the point)."""
    monkeypatch.delenv("DEEPWIKI_ALLOWED_LOCAL_ROOTS", raising=False)
    outside = os.path.join(str(tmpdir), "outside")
    os.makedirs(outside)
    alias = os.path.join(deepwiki_root(), "local_repos", "alias_to_outside")
    os.makedirs(os.path.dirname(alias), exist_ok=True)
    if os.path.islink(alias):
        os.remove(alias)
    os.symlink(outside, alias)
    try:
        with pytest.raises(ValueError, match="not within an allowed root"):
            Repo(repo_url=alias, repo_type=None).save_path
    finally:
        os.remove(alias)


def test_repo_is_remote(tmpdir):
    repo = Repo(
        repo_url="https://github.com/AsyncFuncAI/deepwiki-open",
        repo_type="github",
        root_path=tmpdir,
    )
    assert not repo.is_local
    assert not repo.downloaded


def test_repo_download_rejects_loopback_host(tmpdir, mocker):
    """Regression for the blind-SSRF-via-git-clone bug: a repo_url whose
    host resolves to a loopback/private/link-local address must be rejected
    before git ever attempts to connect, regardless of the labeled
    repo_type."""
    repo = Repo(
        repo_url="http://127.0.0.1:9999/internal/service.git",
        repo_type="github",
        root_path=tmpdir,
    )
    clone_spy = mocker.patch("git.Repo.clone_from")

    with pytest.raises(ValueError, match="disallowed address"):
        repo.download()
    clone_spy.assert_not_called()


def test_repo_download_rejects_unresolvable_host(tmpdir, mocker):
    repo = Repo(
        repo_url="http://this-host-does-not-exist.invalid/x.git",
        repo_type="github",
        root_path=tmpdir,
    )
    clone_spy = mocker.patch("git.Repo.clone_from")

    with pytest.raises(ValueError, match="Could not resolve"):
        repo.download()
    clone_spy.assert_not_called()


def test_repo_download_allows_public_host(tmpdir, mocker):
    repo = Repo(
        repo_url="https://github.com/AsyncFuncAI/deepwiki-open",
        repo_type="github",
        root_path=tmpdir,
    )
    # Public GitHub IP (140.82.0.0/16 range), mocked so this test has no
    # real network dependency.
    mocker.patch(
        "api.repository.socket.getaddrinfo",
        return_value=[(2, 1, 6, "", ("140.82.121.3", 0))],
    )
    clone_spy = mocker.patch("git.Repo.clone_from")

    repo.download()
    clone_spy.assert_called_once()


def test_repo_download_no_git(tmpdir, monkeypatch):
    repo = Repo(
        repo_url="https://github.com/AsyncFuncAI/deepwiki-open",
        repo_type="github",
        root_path=tmpdir,
    )
    from api import repository
    monkeypatch.setattr(repository, "GIT_OK", value=False)

    with pytest.raises(RuntimeError, match="Missing `git` in current environment"):
        repo.download()


def test_repo_download_path_exists(tmpdir, mocker):
    repo = Repo(
        repo_url="https://github.com/AsyncFuncAI/deepwiki-open",
        repo_type="github",
        root_path=tmpdir,
    )

    def touch_file(*args, **kwargs):
        tmp_file = os.path.join(repo.save_path, "touch")
        with open(tmp_file, "w") as f:
            f.write("")
    mocker.patch.object(git.Repo, "clone_from", return_value=None, side_effect=touch_file)

    repo.download()
    assert repo.downloaded
    assert os.path.exists(repo.save_path)


def test_repo_git_clone_message_masking(tmpdir, mocker):
    repo = Repo(
        repo_url="https://github.com/AsyncFuncAI/deepwiki-open",
        repo_type="github",
        root_path=tmpdir,
        access_token="123456789"
    )

    def raise_error(*args, **kwargs):
        raise git.GitCommandError(command="git clone", stderr="123456789 is not a valid token")

    mocker.patch.object(git.Repo, "clone_from", return_value=None, side_effect=raise_error)

    with pytest.raises(ValueError, match=re.escape("***TOKEN*** is not a valid token")):
        repo.download()


@pytest.mark.network
@pytest.mark.parametrize(
    "repo_url, repo_type",
    [
        ("https://github.com/AsyncFuncAI/deepwiki-open", "github"),
        ("https://gitlab.com/gitlab-org/gitlab-pages", "gitlab"),
    ]
)
def test_repo_download(repo_url, repo_type, tmpdir):
    repo = Repo(repo_url, repo_type, root_path=tmpdir)
    repo.download()

    assert repo.downloaded
