import pytest

from api.config import iterate_files


def make_repo(root):
    (root / "README.md").write_text("")
    (root / "CHANGELOG.md").write_text("")
    (root / "yarn.lock").write_text("") # excluded

    folder = root / "folder"
    folder.mkdir(exist_ok=True)
    (folder / ".lock").write_text("")   # excluded
    (folder / "code.py").write_text("")

    ex_folder = root / ".venv"
    ex_folder.mkdir(exist_ok=True)
    (ex_folder / "file.txt").write_text("")
    (ex_folder / ".gitignore").write_text("")



def test_iterate_files_default_exclusive_mode(exclude_test_config, tmp_path):
    make_repo(tmp_path)

    files = set(iterate_files(root_dir=str(tmp_path)))
    assert files == {
        "README.md",
        "CHANGELOG.md",
        "folder/code.py",
    }

@pytest.mark.parametrize(
    "included_dirs",
    [
        ["folder"],
        ["./folder"],
    ]
)
def test_iterate_files_included_dirs(exclude_test_config, tmp_path, included_dirs):
    make_repo(tmp_path)
    files = set(iterate_files(root_dir=str(tmp_path), included_dirs=included_dirs))
    assert files == {"folder/code.py"}


def test_iterate_files_included_files(exclude_test_config, tmp_path):
    make_repo(tmp_path)
    files = set(iterate_files(root_dir=str(tmp_path), included_files=["README.md"]))
    assert files == {"README.md"}


@pytest.mark.parametrize(
    "excluded_dirs",
    [
        ["folder"],
        ["./folder"],
    ]
)
def test_iterate_files_excluded_dirs(exclude_test_config, tmp_path, excluded_dirs):
    make_repo(tmp_path)
    files = set(iterate_files(root_dir=str(tmp_path), excluded_dirs=excluded_dirs))
    assert files == {"README.md", "CHANGELOG.md"}
