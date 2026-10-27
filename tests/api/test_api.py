import json
import sys

import requests


def test_streaming_endpoint(repo_url, query):
    """
    Test the streaming endpoint with a given repository URL and query.

    Args:
        repo_url (str): The GitHub repository URL
        query (str): The query to send
    """
    # Define the API endpoint
    url = "http://localhost:8000/chat/completions/stream"

    # Define the request payload
    payload = {
        "repo_url": repo_url,
        "messages": [{"role": "user", "content": query}],
    }

    print("Testing streaming endpoint with:")
    print(f"  Repository: {repo_url}")
    print(f"  Query: {query}")
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
                print(chunk.decode("utf-8"), end="", flush=True)

        print("\n\nStreaming completed successfully.")

    except Exception as e:
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    # Get command line arguments
    if len(sys.argv) < 3:
        print("Usage: python test_api.py <repo_url> <query>")
        sys.exit(1)

    repo_url = sys.argv[1]
    query = sys.argv[2]

    test_streaming_endpoint(repo_url, query)
