"""
Test token-aware batching in VertexAIEmbedderClient
"""

import sys
import os
from pathlib import Path

# Add api directory to path
api_dir = Path(__file__).parent.parent / "api"
sys.path.insert(0, str(api_dir))

from dotenv import load_dotenv
load_dotenv()

from vertexai_embedder_client import VertexAIEmbedderClient


def test_token_estimation():
    """Test the token estimation helper"""
    client = VertexAIEmbedderClient()

    # Test with known text
    text = "This is a test text" * 100  # ~1900 chars
    estimated = client._estimate_tokens(text)

    print(f"✅ Token estimation: {len(text)} chars → ~{estimated} tokens")
    assert estimated > 0, "Token estimation should return positive number"


def test_batch_splitting():
    """Test that large batches are split correctly"""
    client = VertexAIEmbedderClient()

    # Create test texts of varying sizes
    # Each text is ~5000 chars (~1250 tokens)
    large_text = "x" * 5000
    texts = [large_text] * 20  # 20 texts * 1250 tokens = 25,000 tokens (exceeds 18K limit)

    batches = client._split_into_token_limited_batches(texts, max_tokens=18000)

    print(f"\n✅ Batch splitting test:")
    print(f"   Input: {len(texts)} texts (~{len(texts) * 1250} tokens total)")
    print(f"   Output: {len(batches)} batches")

    for i, batch in enumerate(batches):
        batch_tokens = sum(client._estimate_tokens(t) for t in batch)
        print(f"   Batch {i+1}: {len(batch)} texts, ~{batch_tokens} tokens")
        assert batch_tokens <= 18000, f"Batch {i+1} exceeds token limit!"

    assert len(batches) > 1, "Large input should be split into multiple batches"
    print(f"\n✅ All batches are under the 18,000 token limit!")


def test_single_large_text():
    """Test that a single text exceeding limit goes into its own batch"""
    client = VertexAIEmbedderClient()

    # Create a text larger than the limit (should be auto-truncated by Vertex AI)
    huge_text = "x" * 100000  # ~25,000 tokens
    normal_text = "y" * 1000   # ~250 tokens

    texts = [normal_text, huge_text, normal_text]
    batches = client._split_into_token_limited_batches(texts)

    print(f"\n✅ Single large text test:")
    print(f"   Input: 3 texts (1 normal, 1 huge, 1 normal)")
    print(f"   Output: {len(batches)} batches")

    for i, batch in enumerate(batches):
        print(f"   Batch {i+1}: {len(batch)} texts")

    # Huge text should be isolated in its own batch
    assert len(batches) == 3, "Should have 3 batches (normal, huge, normal)"
    print(f"\n✅ Large text correctly isolated!")


if __name__ == "__main__":
    print("=" * 60)
    print("Testing Token-Aware Batching in VertexAIEmbedderClient")
    print("=" * 60)

    try:
        test_token_estimation()
        test_batch_splitting()
        test_single_large_text()

        print("\n" + "=" * 60)
        print("🎉 All tests passed!")
        print("=" * 60)
        print("\nThe fix should prevent token limit errors.")
        print("Try generating embeddings again and check the logs for:")
        print('  - "split into X token-limited batches"')
        print('  - "Processing batch Y/X: N texts, ~Z tokens"')

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
