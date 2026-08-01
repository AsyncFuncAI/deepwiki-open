from api.schemas import ChatCompletionRequest


def test_chat_completion_request_split_path():
    request = ChatCompletionRequest(
        repo_url=",",
        messages=[],
        excluded_files="123\n456\n",
        excluded_dirs="123\n456\n",
        included_files="123\n456\n",
        included_dirs="123\n456\n",
    )

    assert isinstance(request.excluded_files, list)
    assert isinstance(request.excluded_dirs, list)
    assert isinstance(request.included_files, list)
    assert isinstance(request.included_dirs, list)

    for path in (
        request.included_files
        + request.included_dirs
        + request.excluded_files
        + request.excluded_dirs
    ):
        assert isinstance(path, str)
