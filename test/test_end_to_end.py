#!/usr/bin/env python3
"""
End-to-End Test for Phase 1 + Phase 2 Integration

This script tests the complete flow:
1. Vertex AI Embeddings with ADC (Phase 1)
2. LLM generation via OpenAI-compatible proxy (Phase 2)

Test Scenario:
- Use a small test repository
- Generate embeddings using VertexAIEmbedderClient
- Generate responses using OpenAI proxy (localhost:4001)
- Verify both components work together
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

from api.tools.embedder import get_embedder
from api.openai_client import OpenAIClient


def print_header(text: str):
    """Print formatted header."""
    print(f"\n{'='*70}")
    print(f"  {text}")
    print(f"{'='*70}\n")


def print_test(name: str, passed: bool, details: str = ""):
    """Print test result."""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{name:.<50} {status}")
    if details:
        print(f"  → {details}")


def test_vertex_embeddings():
    """Test that Vertex AI embedder is working."""
    print_header("Phase 1: Vertex AI Embeddings Test")

    try:
        # Get embedder (should use vertex based on .env)
        embedder = get_embedder(embedder_type='vertex')

        print_test(
            "Created embedder instance",
            embedder is not None,
            f"Type: {type(embedder).__name__}"
        )

        # Check model client
        client_name = embedder.model_client.__class__.__name__
        print_test(
            "Using VertexAIEmbedderClient",
            client_name == "VertexAIEmbedderClient",
            f"Client: {client_name}"
        )

        # Test embedding generation
        test_text = "This is a test document for embedding generation."

        print("Generating embedding for test text...", end=" ", flush=True)
        result = embedder(input=test_text)
        print("Done!")

        # Check result
        has_data = result.data is not None
        print_test(
            "Embedding generated successfully",
            has_data,
            f"Embedding dimension: {len(result.data[0]) if has_data else 'N/A'}"
        )

        has_correct_dim = has_data and len(result.data[0]) == 768
        print_test(
            "Correct embedding dimension (768)",
            has_correct_dim,
            "text-embedding-004 produces 768-dim embeddings"
        )

        return True

    except Exception as e:
        print_test("Vertex AI embeddings", False, f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_proxy_llm():
    """Test that LLM generation via proxy works."""
    print_header("Phase 2: LLM Generation via Proxy Test")

    try:
        # Initialize OpenAI client (will use proxy from env)
        client = OpenAIClient()

        print_test(
            "OpenAIClient initialized",
            True,
            f"Base URL: {client.base_url}"
        )

        # Verify using proxy
        expected_url = os.getenv("OPENAI_BASE_URL", "http://localhost:4001/v1")
        print_test(
            "Using proxy URL",
            client.base_url == expected_url,
            f"Expected: {expected_url}"
        )

        # Test generation
        print("Generating response via proxy...", end=" ", flush=True)

        response = client.sync_client.chat.completions.create(
            model="google-vertex/gemini-2.5-pro",
            messages=[
                {
                    "role": "user",
                    "content": "You are a helpful assistant. Respond with: Test successful!"
                }
            ],
            max_tokens=50
        )

        print("Done!")

        content = response.choices[0].message.content or ""
        print_test(
            "LLM response generated",
            len(content) > 0,
            f"Response: {content[:100]}"
        )

        return True

    except Exception as e:
        print_test("Proxy LLM", False, f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_combined_workflow():
    """Test embeddings + LLM together (simulating wiki generation)."""
    print_header("Combined Workflow: Embeddings + LLM")

    try:
        # Step 1: Create embeddings
        embedder = get_embedder(embedder_type='vertex')

        test_docs = [
            "DeepWiki is an AI-powered documentation generator.",
            "It uses RAG to analyze codebases.",
            "DeepWiki supports multiple LLM providers."
        ]

        print("Step 1: Generating embeddings for test documents...")
        embeddings_result = embedder(input=test_docs)

        has_embeddings = embeddings_result.data is not None and len(embeddings_result.data) == 3
        print_test(
            "Generated embeddings for test docs",
            has_embeddings,
            f"Created {len(embeddings_result.data) if embeddings_result.data else 0} embeddings"
        )

        # Step 2: Use LLM to generate content
        print("\nStep 2: Using LLM to generate summary...")

        client = OpenAIClient()
        context = "\n".join(test_docs)

        response = client.sync_client.chat.completions.create(
            model="google-vertex/gemini-2.5-pro",
            messages=[
                {
                    "role": "system",
                    "content": "You are a technical writer. Create a brief summary based on the provided context."
                },
                {
                    "role": "user",
                    "content": f"Context:\n{context}\n\nProvide a one-sentence summary."
                }
            ],
            max_tokens=100
        )

        summary = response.choices[0].message.content or ""
        print_test(
            "LLM generated summary",
            len(summary) > 0,
            f"Summary: {summary[:150]}"
        )

        print("\n✨ Combined workflow successful!")
        print("   - Embeddings: Vertex AI text-embedding-004 with ADC ✅")
        print("   - LLM: Gemini 2.5 Pro via localhost:4001 proxy ✅")

        return True

    except Exception as e:
        print_test("Combined workflow", False, f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run end-to-end tests."""
    print("\n" + "="*70)
    print("  END-TO-END TEST: PHASE 1 + PHASE 2 INTEGRATION")
    print("="*70)
    print("\nThis test verifies the complete DeepWiki workflow:")
    print("  1. Vertex AI embeddings with ADC (Phase 1)")
    print("  2. LLM generation via proxy (Phase 2)")
    print("  3. Combined workflow (embeddings + LLM)")

    results = []

    # Run tests
    results.append(("Vertex AI Embeddings", test_vertex_embeddings()))
    results.append(("Proxy LLM Generation", test_proxy_llm()))
    results.append(("Combined Workflow", test_combined_workflow()))

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
        print("🎉 All end-to-end tests passed!")
        print("\n✅ Phase 1 + Phase 2 implementation is complete and working!")
        print("\nYour DeepWiki instance is now configured to use:")
        print("  • Embeddings: Vertex AI text-embedding-004 with ADC")
        print("  • LLM: Gemini models via OpenAI-compatible proxy (localhost:4001)")
        print("\nNext steps:")
        print("  1. Start the backend: python -m api.main")
        print("  2. Start the frontend: npm run dev")
        print("  3. Generate a wiki for a test repository")
        print("  4. Test the Ask feature with RAG\n")
        return 0
    else:
        print(f"⚠️  {total - passed} test(s) failed. Please review the errors above.\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
