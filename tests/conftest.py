import pytest

@pytest.fixture
def exclude_test_config(monkeypatch):
    from api.config import configs

    original_excluded_dirs: list[str] = configs["file_filters"]["excluded_dirs"].copy()
    original_excluded_dirs.remove("./temp/")
    original_excluded_dirs.remove("./tmp/")
    original_excluded_files = configs["file_filters"]["excluded_files"]

    monkeypatch.setitem(
        configs,
        name="file_filters",
        value={
            "excluded_dirs": original_excluded_dirs,
            "excluded_files": original_excluded_files,
        },
    )
    yield configs
