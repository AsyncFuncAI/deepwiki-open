from urllib.parse import unquote

import pytest
from fastapi.testclient import TestClient


def _export(repo_url: str):
    from api.main import app

    client = TestClient(app, raise_server_exceptions=False)
    return client.post(
        "/export/wiki",
        json={
            "repo_url": repo_url,
            "type": "local",
            "format": "markdown",
            "pages": [
                {
                    "id": "page-1",
                    "title": "P1",
                    "content": "body",
                    "filePaths": [],
                    "importance": "high",
                    "relatedPages": [],
                }
            ],
        },
    )


@pytest.mark.parametrize(
    "repo_url, repo_name",
    [
        ("https://github.com/owner/repo", "repo"),
        ("/home/user/项目", "项目"),
        ("/home/user/my repo", "my repo"),
    ],
)
def test_export_wiki_content_disposition(repo_url, repo_name):
    response = _export(repo_url)

    assert response.status_code == 200
    header = response.headers["content-disposition"]
    header.encode("ascii")
    assert header.startswith('attachment; filename="')
    encoded = header.split("filename*=UTF-8''", 1)[1]
    filename = unquote(encoded)
    assert filename.startswith(f"{repo_name}_wiki_")
    assert filename.endswith(".md")
