"""
Quick test script to verify Vertex AI Embedder setup.
Run this after setting up ADC and environment variables.
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load environment variables from .env file
from dotenv import load_dotenv
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)


def test_imports():
    """Test that all required modules can be imported."""
    print("1. Testing imports...")

    try:
        from api.vertexai_embedder_client import VertexAIEmbedderClient
        print("   ✅ VertexAIEmbedderClient imported successfully")
    except ImportError as e:
        print(f"   ❌ Failed to import VertexAIEmbedderClient: {e}")
        return False

    try:
        from api.config import CLIENT_CLASSES, is_vertex_embedder, get_embedder_type
        print("   ✅ Config helpers imported successfully")
    except ImportError as e:
        print(f"   ❌ Failed to import config helpers: {e}")
        return False

    try:
        from api.tools.embedder import get_embedder
        print("   ✅ Embedder factory imported successfully")
    except ImportError as e:
        print(f"   ❌ Failed to import embedder factory: {e}")
        return False

    return True


def test_config_registration():
    """Test that VertexAI client is properly registered."""
    print("\n2. Testing configuration registration...")

    from api.config import CLIENT_CLASSES, configs

    if "VertexAIEmbedderClient" in CLIENT_CLASSES:
        print("   ✅ VertexAIEmbedderClient registered in CLIENT_CLASSES")
    else:
        print("   ❌ VertexAIEmbedderClient NOT found in CLIENT_CLASSES")
        return False

    if "embedder_vertex" in configs:
        print("   ✅ embedder_vertex config found")
        vertex_config = configs["embedder_vertex"]
        print(f"      - Client class: {vertex_config.get('client_class')}")
        print(f"      - Model: {vertex_config.get('model_kwargs', {}).get('model')}")
    else:
        print("   ❌ embedder_vertex config NOT found")
        return False

    return True


def test_environment_variables():
    """Test that required environment variables are set."""
    print("\n3. Testing environment variables...")

    embedder_type = os.getenv("DEEPWIKI_EMBEDDER_TYPE")
    if embedder_type:
        print(f"   ✅ DEEPWIKI_EMBEDDER_TYPE = {embedder_type}")
    else:
        print("   ⚠️  DEEPWIKI_EMBEDDER_TYPE not set (will default to 'openai')")

    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    if project_id:
        print(f"   ✅ GOOGLE_CLOUD_PROJECT = {project_id}")
    else:
        print("   ❌ GOOGLE_CLOUD_PROJECT not set (required for Vertex AI)")
        return False

    location = os.getenv("GOOGLE_CLOUD_LOCATION")
    if location:
        print(f"   ✅ GOOGLE_CLOUD_LOCATION = {location}")
    else:
        print("   ⚠️  GOOGLE_CLOUD_LOCATION not set (will default to 'us-central1')")

    # Check for ADC
    creds_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if creds_file:
        print(f"   ✅ GOOGLE_APPLICATION_CREDENTIALS = {creds_file}")
        if os.path.exists(creds_file):
            print("      ✅ Credentials file exists")
        else:
            print("      ❌ Credentials file does NOT exist!")
            return False
    else:
        print("   ℹ️  GOOGLE_APPLICATION_CREDENTIALS not set")
        print("      (Will use default ADC from gcloud auth application-default login)")

    return True


def test_adc_available():
    """Test that ADC credentials are available."""
    print("\n4. Testing ADC availability...")

    try:
        from google.auth import default
        credentials, project = default()
        print(f"   ✅ ADC found for project: {project}")
        print(f"      Credentials type: {type(credentials).__name__}")
        return True
    except Exception as e:
        print(f"   ❌ ADC not available: {e}")
        print("\n   To fix this, run:")
        print("   gcloud auth application-default login")
        return False


def test_client_initialization():
    """Test that VertexAI client can be initialized."""
    print("\n5. Testing VertexAI client initialization...")

    # Skip if environment variables not set
    if not os.getenv("GOOGLE_CLOUD_PROJECT"):
        print("   ⚠️  Skipping - GOOGLE_CLOUD_PROJECT not set")
        return True

    try:
        from api.vertexai_embedder_client import VertexAIEmbedderClient

        # Try to initialize (will use ADC)
        client = VertexAIEmbedderClient()
        print(f"   ✅ Client initialized successfully")
        print(f"      Project: {client.project_id}")
        print(f"      Location: {client.location}")
        return True

    except Exception as e:
        print(f"   ❌ Failed to initialize client: {e}")
        return False


def test_embedder_factory():
    """Test that embedder factory can create Vertex AI embedder."""
    print("\n6. Testing embedder factory...")

    # Skip if environment variables not set
    if not os.getenv("GOOGLE_CLOUD_PROJECT"):
        print("   ⚠️  Skipping - GOOGLE_CLOUD_PROJECT not set")
        return True

    try:
        from api.tools.embedder import get_embedder

        # Try to get vertex embedder
        embedder = get_embedder(embedder_type='vertex')
        print(f"   ✅ Embedder created successfully via factory")
        print(f"      Type: {type(embedder).__name__}")
        print(f"      Model client: {type(embedder.model_client).__name__}")
        return True

    except Exception as e:
        print(f"   ❌ Failed to create embedder: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 70)
    print("DeepWiki Vertex AI Embedder Setup Verification")
    print("=" * 70)

    results = []

    results.append(("Imports", test_imports()))
    results.append(("Config Registration", test_config_registration()))
    results.append(("Environment Variables", test_environment_variables()))
    results.append(("ADC Availability", test_adc_available()))
    results.append(("Client Initialization", test_client_initialization()))
    results.append(("Embedder Factory", test_embedder_factory()))

    print("\n" + "=" * 70)
    print("Test Summary")
    print("=" * 70)

    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name:.<50} {status}")

    all_passed = all(result[1] for result in results)

    print("=" * 70)

    if all_passed:
        print("🎉 All tests passed! Vertex AI Embedder is ready to use.")
        print("\nNext steps:")
        print("1. Set DEEPWIKI_EMBEDDER_TYPE=vertex in your .env file")
        print("2. Start the backend: python -m api.main")
        print("3. Start the frontend: npm run dev")
        return 0
    else:
        print("⚠️  Some tests failed. Please fix the issues above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
