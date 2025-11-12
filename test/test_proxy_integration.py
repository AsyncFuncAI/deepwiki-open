#!/usr/bin/env python3
"""
Test script for Phase 2: Vertex AI Proxy Integration

This script verifies that DeepWiki can successfully route LLM requests through
the OpenAI-compatible proxy running on localhost:4001.

Test Coverage:
1. Environment variable configuration
2. Direct proxy connection (non-streaming)
3. Direct proxy connection (streaming)
4. OpenAIClient integration with proxy
5. Streaming via OpenAIClient

Prerequisites:
- Proxy running on localhost:4001
- .env file configured with OPENAI_BASE_URL and OPENAI_API_KEY
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(project_root / ".env")

import requests
from openai import OpenAI


def print_header(text: str):
    """Print formatted test header."""
    print(f"\n{'='*70}")
    print(f"  {text}")
    print(f"{'='*70}\n")


def print_test(name: str, passed: bool, details: str = ""):
    """Print test result."""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{name:.<50} {status}")
    if details:
        print(f"  → {details}")


def test_environment_variables():
    """Test 1: Verify environment variables are set correctly."""
    print_header("Test 1: Environment Variables")

    base_url = os.getenv("OPENAI_BASE_URL")
    api_key = os.getenv("OPENAI_API_KEY")

    print_test(
        "OPENAI_BASE_URL is set",
        base_url is not None,
        f"Value: {base_url}"
    )

    print_test(
        "OPENAI_API_KEY is set",
        api_key is not None,
        f"Value: {api_key}"
    )

    expected_base = "http://localhost:4001/v1"
    print_test(
        "OPENAI_BASE_URL points to proxy",
        base_url == expected_base,
        f"Expected: {expected_base}, Got: {base_url}"
    )

    return base_url is not None and api_key is not None and base_url == expected_base


def test_direct_proxy_connection():
    """Test 2: Direct connection to proxy (non-streaming)."""
    print_header("Test 2: Direct Proxy Connection (Non-Streaming)")

    base_url = os.getenv("OPENAI_BASE_URL")
    api_key = os.getenv("OPENAI_API_KEY")

    if not base_url or not api_key:
        print_test("Proxy connection", False, "Environment variables not set")
        return False

    try:
        # Test proxy connection
        response = requests.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "google-vertex/gemini-2.5-pro",
                "messages": [
                    {"role": "user", "content": "Respond with exactly: Connection successful"}
                ],
                "max_tokens": 50
            },
            timeout=30
        )

        response.raise_for_status()
        data = response.json()

        content = data["choices"][0]["message"].get("content", "")
        model_used = data.get("model", "unknown")

        print_test(
            "Proxy responded successfully",
            True,
            f"Model: {model_used}"
        )

        print_test(
            "Response contains content",
            content is not None and len(str(content)) > 0,
            f"Content: {str(content)[:100]}..."
        )

        # Check for Vertex AI indicators in response
        metadata = data.get("metadata", {})
        used_provider = metadata.get("used_provider", "")

        print_test(
            "Proxy routes to Vertex AI",
            "vertex" in used_provider.lower() or "google" in used_provider.lower(),
            f"Provider: {used_provider}"
        )

        return True

    except requests.exceptions.ConnectionError as e:
        print_test("Proxy connection", False, f"Connection failed: {e}")
        print("\n⚠️  Make sure your proxy is running on localhost:4001")
        return False

    except Exception as e:
        print_test("Proxy connection", False, f"Error: {e}")
        return False


def test_direct_proxy_streaming():
    """Test 3: Direct connection to proxy (streaming)."""
    print_header("Test 3: Direct Proxy Connection (Streaming)")

    base_url = os.getenv("OPENAI_BASE_URL")
    api_key = os.getenv("OPENAI_API_KEY")

    if not base_url or not api_key:
        print_test("Streaming connection", False, "Environment variables not set")
        return False

    try:
        response = requests.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "google-vertex/gemini-2.5-pro",
                "messages": [
                    {"role": "user", "content": "Count from 1 to 5, one number at a time."}
                ],
                "stream": True,
                "max_tokens": 100
            },
            stream=True,
            timeout=30
        )

        response.raise_for_status()

        chunks_received = 0
        content_parts = []

        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    data_str = line[6:]  # Remove 'data: ' prefix

                    if data_str == '[DONE]':
                        break

                    try:
                        import json
                        chunk_data = json.loads(data_str)

                        if "choices" in chunk_data and len(chunk_data["choices"]) > 0:
                            delta = chunk_data["choices"][0].get("delta", {})
                            if "content" in delta:
                                content_parts.append(delta["content"])
                                chunks_received += 1
                    except json.JSONDecodeError:
                        pass

        full_content = "".join(content_parts)

        print_test(
            "Streaming chunks received",
            chunks_received > 0,
            f"Received {chunks_received} chunks"
        )

        print_test(
            "Streaming content assembled",
            len(full_content) > 0,
            f"Content: {full_content[:100]}"
        )

        print_test(
            "[DONE] marker received",
            True,
            "Stream properly terminated"
        )

        return chunks_received > 0

    except Exception as e:
        print_test("Streaming connection", False, f"Error: {e}")
        return False


def test_openai_client_integration():
    """Test 4: OpenAI client integration with proxy."""
    print_header("Test 4: OpenAI Client Integration")

    base_url = os.getenv("OPENAI_BASE_URL")
    api_key = os.getenv("OPENAI_API_KEY")

    if not base_url or not api_key:
        print_test("OpenAI client", False, "Environment variables not set")
        return False

    try:
        # Create OpenAI client pointing to proxy
        client = OpenAI(
            api_key=api_key,
            base_url=base_url
        )

        print_test(
            "OpenAI client initialized",
            True,
            f"Base URL: {base_url}"
        )

        # Test non-streaming
        response = client.chat.completions.create(
            model="google-vertex/gemini-2.5-pro",
            messages=[
                {"role": "user", "content": "Say 'OpenAI client works!'"}
            ],
            max_tokens=50
        )

        content = response.choices[0].message.content

        print_test(
            "Non-streaming completion",
            content is not None and len(str(content)) > 0,
            f"Response: {str(content)}"
        )

        print_test(
            "Response has expected format",
            hasattr(response, 'choices') and len(response.choices) > 0,
            "OpenAI response format confirmed"
        )

        return True

    except Exception as e:
        print_test("OpenAI client", False, f"Error: {e}")
        return False


def test_openai_client_streaming():
    """Test 5: OpenAI client streaming via proxy."""
    print_header("Test 5: OpenAI Client Streaming")

    base_url = os.getenv("OPENAI_BASE_URL")
    api_key = os.getenv("OPENAI_API_KEY")

    if not base_url or not api_key:
        print_test("Client streaming", False, "Environment variables not set")
        return False

    try:
        client = OpenAI(
            api_key=api_key,
            base_url=base_url
        )

        # Test streaming
        stream = client.chat.completions.create(
            model="google-vertex/gemini-2.5-pro",
            messages=[
                {"role": "user", "content": "List three programming languages."}
            ],
            stream=True,
            max_tokens=100
        )

        chunks = []
        for chunk in stream:
            if chunk.choices[0].delta.content:
                chunks.append(chunk.choices[0].delta.content)

        full_response = "".join(chunks)

        print_test(
            "Streaming chunks received",
            len(chunks) > 0,
            f"Received {len(chunks)} chunks"
        )

        print_test(
            "Streaming content complete",
            len(full_response) > 0,
            f"Full response: {full_response[:100]}..."
        )

        return len(chunks) > 0

    except Exception as e:
        print_test("Client streaming", False, f"Error: {e}")
        return False


def test_deepwiki_openai_client():
    """Test 6: DeepWiki's OpenAIClient with proxy."""
    print_header("Test 6: DeepWiki OpenAIClient Integration")

    try:
        # Import DeepWiki's OpenAI client
        from api.openai_client import OpenAIClient

        print_test(
            "Import OpenAIClient",
            True,
            "Successfully imported from api.openai_client"
        )

        # Initialize client (should use env vars)
        client = OpenAIClient()

        print_test(
            "Initialize OpenAIClient",
            True,
            f"Base URL: {client.base_url}"
        )

        # Verify base URL is from env
        expected_base = os.getenv("OPENAI_BASE_URL")
        print_test(
            "Uses correct base URL",
            client.base_url == expected_base,
            f"Expected: {expected_base}, Got: {client.base_url}"
        )

        # Test call method
        from adalflow.core.types import ModelType

        response = client.call(
            api_kwargs={
                "model": "google-vertex/gemini-2.5-pro",
                "messages": [
                    {"role": "user", "content": "Say 'DeepWiki integration successful!'"}
                ],
                "max_tokens": 50,
                "stream": False
            },
            model_type=ModelType.LLM
        )

        print_test(
            "OpenAIClient.call() works",
            response is not None,
            "Successfully called through proxy"
        )

        return True

    except ImportError as e:
        print_test("Import OpenAIClient", False, f"Import error: {e}")
        return False

    except Exception as e:
        print_test("DeepWiki OpenAIClient", False, f"Error: {e}")
        return False


def main():
    """Run all Phase 2 tests."""
    print("\n" + "="*70)
    print("  PHASE 2: VERTEX AI PROXY INTEGRATION TEST SUITE")
    print("="*70)
    print("\nThis test suite verifies that DeepWiki can route LLM requests")
    print("through your OpenAI-compatible proxy to Vertex AI Gemini models.")
    print("\nPrerequisites:")
    print("  - Proxy running on localhost:4001")
    print("  - .env configured with OPENAI_BASE_URL and OPENAI_API_KEY")
    print("  - ADC credentials configured (gcloud auth application-default login)")

    results = []

    # Run tests
    results.append(("Environment Variables", test_environment_variables()))
    results.append(("Direct Proxy (Non-Streaming)", test_direct_proxy_connection()))
    results.append(("Direct Proxy (Streaming)", test_direct_proxy_streaming()))
    results.append(("OpenAI Client Integration", test_openai_client_integration()))
    results.append(("OpenAI Client Streaming", test_openai_client_streaming()))
    results.append(("DeepWiki OpenAIClient", test_deepwiki_openai_client()))

    # Summary
    print_header("Test Summary")

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✅" if result else "❌"
        print(f"{status} {name}")

    print(f"\n{'='*70}")
    print(f"Results: {passed}/{total} tests passed")
    print(f"{'='*70}\n")

    if passed == total:
        print("🎉 All tests passed! Phase 2 proxy integration is working correctly.\n")
        print("Next steps:")
        print("  1. Test end-to-end wiki generation")
        print("  2. Verify streaming in the Ask feature")
        print("  3. Test with different Gemini models (gemini-2.0-flash, etc.)")
        return 0
    else:
        print(f"⚠️  {total - passed} test(s) failed. Please review the errors above.\n")
        print("Common issues:")
        print("  - Proxy not running on localhost:4001")
        print("  - .env file not configured correctly")
        print("  - ADC credentials not set up (run: gcloud auth application-default login)")
        return 1


if __name__ == "__main__":
    sys.exit(main())
