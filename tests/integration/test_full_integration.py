#!/usr/bin/env python3
"""Full integration test for Google AI embeddings."""

import json
import os
import sys


def test_config_loading():
    """Test that configurations load properly."""
    print("🔧 Testing configuration loading...")

    try:
        from api.config import configs, CLIENT_CLASSES

        # Check if Google embedder config exists
        if "embedder_google" in configs:
            print("✅ embedder_google configuration found")
            google_config = configs["embedder_google"]
            print(
                f"📋 Google config: {json.dumps(google_config, indent=2, default=str)}"
            )
        else:
            print("❌ embedder_google configuration not found")
            return False

        # Check if GoogleEmbedderClient is in CLIENT_CLASSES
        if "GoogleEmbedderClient" in CLIENT_CLASSES:
            print("✅ GoogleEmbedderClient found in CLIENT_CLASSES")
        else:
            print("❌ GoogleEmbedderClient not found in CLIENT_CLASSES")
            return False

        return True

    except Exception as e:
        print(f"❌ Error loading configuration: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_embedder_selection():
    """Test embedder selection mechanism."""
    print("\n🔧 Testing embedder selection...")

    try:
        from api.config import get_embedder_type, is_google_embedder, get_embedder

        # Test default embedder type
        current_type = get_embedder_type()
        print(f"📋 Current embedder type: {current_type}")

        # Test is_google_embedder function
        is_google = is_google_embedder()
        print(f"📋 Is Google embedder: {is_google}")

        # Test get_embedder with google type
        print("🧪 Testing get_embedder with embedder_type='google'...")
        embedder = get_embedder(embedder_type="google")
        print(f"✅ Google embedder created: {type(embedder)}")

        return True

    except Exception as e:
        print(f"❌ Error testing embedder selection: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_google_embedder_with_env():
    """Test Google embedder with environment variable."""
    print("\n🔧 Testing with DEEPWIKI_EMBEDDER_TYPE=google...")

    # Set environment variable
    original_value = os.environ.get("DEEPWIKI_EMBEDDER_TYPE")
    os.environ["DEEPWIKI_EMBEDDER_TYPE"] = "google"

    try:
        # Reload config module to pick up new env var
        import importlib
        import api.config

        importlib.reload(api.config)

        from api.config import (
            EMBEDDER_TYPE,
            get_embedder_type,
            get_embedder_config,
            get_embedder,
        )

        print(f"📋 EMBEDDER_TYPE: {EMBEDDER_TYPE}")
        print(f"📋 get_embedder_type(): {get_embedder_type()}")

        # Test getting embedder config
        config = get_embedder_config()
        print(
            f"📋 Current embedder config client: {config.get('client_class', 'Unknown')}"
        )

        # Test creating embedder
        embedder = get_embedder()
        print(f"✅ Embedder created with google env var: {type(embedder)}")

        return True

    except Exception as e:
        print(f"❌ Error testing with environment variable: {e}")
        import traceback

        traceback.print_exc()
        return False

    finally:
        # Restore original environment variable
        if original_value is not None:
            os.environ["DEEPWIKI_EMBEDDER_TYPE"] = original_value
        elif "DEEPWIKI_EMBEDDER_TYPE" in os.environ:
            del os.environ["DEEPWIKI_EMBEDDER_TYPE"]


def main():
    """Run all integration tests."""
    print("🚀 Starting Google AI Embeddings Integration Tests")
    print("=" * 60)

    tests = [
        test_config_loading,
        test_embedder_selection,
        test_google_embedder_with_env,
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        try:
            if test():
                passed += 1
                print("✅ PASSED")
            else:
                print("❌ FAILED")
        except Exception as e:
            print(f"❌ FAILED with exception: {e}")
        print("-" * 40)

    print(f"\n📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All integration tests passed!")
        return True
    else:
        print("💥 Some tests failed!")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
