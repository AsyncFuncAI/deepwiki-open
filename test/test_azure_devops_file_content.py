import pytest
import os
import sys
from unittest.mock import patch, Mock

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from api.data_pipeline import get_azure_devops_file_content, get_file_content


class TestAzureDevOpsFileContent:

    def test_get_file_content_dispatches_to_azure_devops(self):
        with patch('api.data_pipeline.get_azure_devops_file_content') as mock_ado:
            mock_ado.return_value = "file content"
            result = get_file_content(
                "https://dev.azure.com/org/project/_git/repo",
                "src/main.py",
                repo_type="azure_devops",
                access_token="test-token"
            )
            mock_ado.assert_called_once_with(
                "https://dev.azure.com/org/project/_git/repo",
                "src/main.py",
                "test-token"
            )
            assert result == "file content"

    @patch('api.data_pipeline.requests.get')
    def test_get_azure_devops_file_content_modern_url(self, mock_get):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = "print('hello')"
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        result = get_azure_devops_file_content(
            "https://dev.azure.com/myorg/myproject/_git/myrepo",
            "src/main.py",
            "my-pat-token"
        )
        assert result == "print('hello')"

        call_url = mock_get.call_args[0][0]
        assert "dev.azure.com/myorg/myproject/_apis/git/repositories/myrepo/items" in call_url
        assert "path=src/main.py" in call_url

    def test_get_azure_devops_file_content_invalid_url(self):
        with pytest.raises(ValueError, match="Not a valid Azure DevOps"):
            get_azure_devops_file_content(
                "https://github.com/owner/repo",
                "file.py"
            )

    @patch('api.data_pipeline.requests.get')
    def test_get_azure_devops_file_content_uses_basic_auth(self, mock_get):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = "content"
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        get_azure_devops_file_content(
            "https://dev.azure.com/org/project/_git/repo",
            "file.py",
            "my-token"
        )

        actual_headers = mock_get.call_args
        assert "Basic" in str(actual_headers)
