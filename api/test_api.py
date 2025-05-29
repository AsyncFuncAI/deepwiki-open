import requests
import json
import sys
import pytest

@pytest.fixture
def repo_url():
    """A pytest fixture for the repository URL."""
    return "https://example.com/dummy_repo.git"

def test_streaming_endpoint(repo_url, query="What is a stream?", file_path=None):
    """
    Test the streaming endpoint with a given repository URL and query.
    
    Args:
        repo_url (str): The GitHub repository URL
        query (str): The query to send
        file_path (str, optional): Path to a file in the repository
    """
    # Define the API endpoint
    url = "http://localhost:8000/chat/completions/stream"
    
    # Define the request payload
    payload = {
        "repo_url": repo_url,
        "messages": [
            {
                "role": "user",
                "content": query
            }
        ],
        "filePath": file_path
    }
    
    print(f"Testing streaming endpoint with:")
    print(f"  Repository: {repo_url}")
    print(f"  Query: {query}")
    if file_path:
        print(f"  File Path: {file_path}")
    print("\nResponse:")
    
    try:
        # Make the request with streaming enabled
        response = requests.post(url, json=payload, stream=True)
        
        # Check if the request was successful
        if response.status_code != 200:
            print(f"Error: {response.status_code}")
            try:
                error_data = json.loads(response.content)
                print(f"Error details: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"Error content: {response.content}")
            return
        
        # Process the streaming response
        for chunk in response.iter_content(chunk_size=None):
            if chunk:
                print(chunk.decode('utf-8'), end='', flush=True)
        
        print("\n\nStreaming completed successfully.")
    
    except Exception as e:
        print(f"Error: {str(e)}")
