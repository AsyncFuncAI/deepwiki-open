import requests
import json
import sys
import time

def test_multi_repo_initialize(repositories, local_ollama=False, language="en"):
    """
    Test the multi-repository initialization endpoint.
    
    Args:
        repositories (list): List of repository dictionaries with repo_url, access_token (optional), and description (optional)
        local_ollama (bool): Whether to use local Ollama for embedding and generation
        language (str): Language code for response
    """
    # Define the API endpoint
    url = "http://localhost:8001/multi_repo/initialize"
    
    # Define the request payload
    payload = {
        "repositories": repositories,
        "local_ollama": local_ollama,
        "language": language
    }
    
    print(f"Testing multi-repository initialization with {len(repositories)} repositories:")
    for i, repo in enumerate(repositories):
        print(f"  Repository {i+1}: {repo['repo_url']}")
    
    try:
        # Make the API call
        response = requests.post(url, json=payload)
        
        # Check if the request was successful
        if response.status_code == 200:
            result = response.json()
            print("\nInitialization successful:")
            print(f"  Status: {result.get('status')}")
            print(f"  Message: {result.get('message')}")
            
            # Check if there were any failures
            failures = result.get('failures')
            if failures:
                print("\nFailures:")
                for failure in failures:
                    print(f"  {failure}")
        else:
            print(f"\nError: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"\nException: {str(e)}")

def test_multi_repo_query(repositories, query, local_ollama=False, use_openrouter=False, openrouter_model="openai/gpt-4o", language="en"):
    """
    Test the multi-repository query endpoint.
    
    Args:
        repositories (list): List of repository dictionaries with repo_url, access_token (optional), and description (optional)
        query (str): The query to send
        local_ollama (bool): Whether to use local Ollama for embedding and generation
        use_openrouter (bool): Whether to use OpenRouter for generation
        openrouter_model (str): OpenRouter model to use
        language (str): Language code for response
    """
    # Define the API endpoint
    url = "http://localhost:8001/multi_repo/query"
    
    # Define the request payload
    payload = {
        "repositories": repositories,
        "query": query,
        "local_ollama": local_ollama,
        "use_openrouter": use_openrouter,
        "language": language
    }
    
    # Add OpenRouter model if using OpenRouter
    if use_openrouter:
        payload["openrouter_model"] = openrouter_model
    
    print(f"Testing multi-repository query with {len(repositories)} repositories:")
    for i, repo in enumerate(repositories):
        print(f"  Repository {i+1}: {repo['repo_url']}")
    print(f"  Query: {query}")
    
    try:
        # Make the API call
        response = requests.post(url, json=payload)
        
        # Check if the request was successful
        if response.status_code == 200:
            result = response.json()
            print("\nQuery successful:")
            print(f"  Answer: {result.get('answer')[:200]}...")  # Show first 200 chars of answer
        else:
            print(f"\nError: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"\nException: {str(e)}")

def test_multi_repo_chat_stream(repositories, query, local_ollama=False, use_openrouter=False, openrouter_model="openai/gpt-4o", language="en"):
    """
    Test the multi-repository chat stream endpoint.
    
    Args:
        repositories (list): List of repository dictionaries with repo_url, access_token (optional), and description (optional)
        query (str): The query to send
        local_ollama (bool): Whether to use local Ollama for embedding and generation
        use_openrouter (bool): Whether to use OpenRouter for generation
        openrouter_model (str): OpenRouter model to use
        language (str): Language code for response
    """
    # Define the API endpoint
    url = "http://localhost:8001/multi_repo/chat/completions/stream"
    
    # Define the request payload
    payload = {
        "repositories": repositories,
        "messages": [
            {
                "role": "user",
                "content": query
            }
        ],
        "local_ollama": local_ollama,
        "use_openrouter": use_openrouter,
        "language": language
    }
    
    # Add OpenRouter model if using OpenRouter
    if use_openrouter:
        payload["openrouter_model"] = openrouter_model
    
    print(f"Testing multi-repository chat stream with {len(repositories)} repositories:")
    for i, repo in enumerate(repositories):
        print(f"  Repository {i+1}: {repo['repo_url']}")
    print(f"  Query: {query}")
    print("\nResponse:")
    
    try:
        # Make the API call with streaming
        with requests.post(url, json=payload, stream=True) as response:
            if response.status_code == 200:
                # Process the streaming response
                for chunk in response.iter_content(chunk_size=1024):
                    if chunk:
                        print(chunk.decode('utf-8'), end='')
                print("\n\nStream completed.")
            else:
                print(f"\nError: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"\nException: {str(e)}")

if __name__ == "__main__":
    # Define test repositories
    test_repos = [
        {
            "repo_url": "https://github.com/AsyncFuncAI/deepwiki-open",
            "description": "Documentation wiki generator"
        },
        {
            "repo_url": "https://github.com/SylphAI-Inc/AdalFlow",
            "description": "Backend library for DeepWiki"
        }
    ]
    
    # Get command line arguments
    if len(sys.argv) < 2:
        print("Usage: python test_multi_repo.py <command> [query]")
        print("Commands: initialize, query, chat")
        sys.exit(1)
    
    command = sys.argv[1]
    query = sys.argv[2] if len(sys.argv) > 2 else "How do these repositories interact with each other?"
    
    if command == "initialize":
        test_multi_repo_initialize(test_repos)
    elif command == "query":
        test_multi_repo_query(test_repos, query)
    elif command == "chat":
        test_multi_repo_chat_stream(test_repos, query)
    else:
        print(f"Unknown command: {command}")
        print("Available commands: initialize, query, chat")
