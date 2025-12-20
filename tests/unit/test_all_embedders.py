#!/usr/bin/env python3
"""
Comprehensive test suite for all embedder types (OpenAI, Google, Ollama).
This test file validates the embedder system before any modifications are made.
"""

import os
import sys
import logging
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add the project root to the Python path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Set up environment
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Simple test framework without pytest
class TestRunner:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failures = []
    
    def run_test(self, test_func, test_name=None):
        """Run a single test function."""
        if test_name is None:
            test_name = test_func.__name__
        
        self.tests_run += 1
        try:
            logger.info(f"Running test: {test_name}")
            test_func()
            self.tests_passed += 1
            logger.info(f"✅ {test_name} PASSED")
            return True
        except Exception as e:
            self.tests_failed += 1
            self.failures.append((test_name, str(e)))
            logger.error(f"❌ {test_name} FAILED: {e}")
            return False
    
    def run_test_class(self, test_class):
        """Run all test methods in a test class."""
        instance = test_class()
        test_methods = [getattr(instance, method) for method in dir(instance) 
                       if method.startswith('test_') and callable(getattr(instance, method))]
        
        for test_method in test_methods:
            test_name = f"{test_class.__name__}.{test_method.__name__}"
            self.run_test(test_method, test_name)
    
    def run_parametrized_test(self, test_func, parameters, test_name_base=None):
        """Run a test function with multiple parameter sets."""
        if test_name_base is None:
            test_name_base = test_func.__name__
        
        for i, param in enumerate(parameters):
            test_name = f"{test_name_base}[{param}]"
            self.run_test(lambda: test_func(param), test_name)
    
    def summary(self):
        """Print test summary."""
        logger.info(f"\n📊 Test Summary:")
        logger.info(f"Tests run: {self.tests_run}")
        logger.info(f"Passed: {self.tests_passed}")
        logger.info(f"Failed: {self.tests_failed}")
        
        if self.failures:
            logger.error("\n❌ Failed tests:")
            for test_name, error in self.failures:
                logger.error(f"  - {test_name}: {error}")
        
        return self.tests_failed == 0

class TestEmbedderConfiguration:
    """Test embedder configuration system."""
    
    def test_config_loading(self):
        """Test that all embedder configurations load properly."""
        from api.config import configs, CLIENT_CLASSES
        
        # Check all embedder configurations exist
        assert 'embedder' in configs, "OpenAI embedder config missing"
        assert 'embedder_google' in configs, "Google embedder config missing"
        assert 'embedder_ollama' in configs, "Ollama embedder config missing"
        assert 'embedder_bedrock' in configs, "Bedrock embedder config missing"
        
        # Check client classes are available
        assert 'OpenAIClient' in CLIENT_CLASSES, "OpenAIClient missing from CLIENT_CLASSES"
        assert 'GoogleEmbedderClient' in CLIENT_CLASSES, "GoogleEmbedderClient missing from CLIENT_CLASSES"
        assert 'OllamaClient' in CLIENT_CLASSES, "OllamaClient missing from CLIENT_CLASSES"
        assert 'BedrockClient' in CLIENT_CLASSES, "BedrockClient missing from CLIENT_CLASSES"
    
    def test_embedder_type_detection(self):
        """Test embedder type detection functions."""
        from api.config import get_embedder_type, is_ollama_embedder, is_google_embedder, is_bedrock_embedder
        
        # Default type should be detected
        current_type = get_embedder_type()
        assert current_type in ['openai', 'google', 'ollama', 'bedrock'], f"Invalid embedder type: {current_type}"
        
        # Boolean functions should work
        is_ollama = is_ollama_embedder()
        is_google = is_google_embedder()
        is_bedrock = is_bedrock_embedder()
        assert isinstance(is_ollama, bool), "is_ollama_embedder should return boolean"
        assert isinstance(is_google, bool), "is_google_embedder should return boolean"
        assert isinstance(is_bedrock, bool), "is_bedrock_embedder should return boolean"
        
        # Only one should be true at a time (unless using openai default)
        if current_type == 'bedrock':
            assert is_bedrock and not is_ollama and not is_google
        elif current_type == 'ollama':
            assert is_ollama and not is_google and not is_bedrock
        elif current_type == 'google':
            assert is_google and not is_ollama and not is_bedrock
        else:  # openai
            assert not is_ollama and not is_google and not is_bedrock

    def test_get_embedder_config(self, embedder_type=None):
        """Test getting embedder config for each type."""
        from api.config import get_embedder_config
        
        if embedder_type:
            # Mock the EMBEDDER_TYPE for testing
            with patch('api.config.EMBEDDER_TYPE', embedder_type):
                config = get_embedder_config()
                assert isinstance(config, dict), f"Config for {embedder_type} should be dict"
                assert 'model_client' in config or 'client_class' in config, f"No client specified for {embedder_type}"
        else:
            # Test current configuration
            config = get_embedder_config()
            assert isinstance(config, dict), "Config should be dict"
            assert 'model_client' in config or 'client_class' in config, "No client specified"


class TestEmbedderFactory:
    """Test the embedder factory function."""
    
    def test_get_embedder_with_explicit_type(self):
        """Test get_embedder with explicit embedder_type parameter."""
        from api.tools.embedder import get_embedder
        
        # Test Google embedder
        google_embedder = get_embedder(embedder_type='google')
        assert google_embedder is not None, "Google embedder should be created"

        # Test Bedrock embedder (mock boto3 to avoid hitting AWS credential providers)
        with patch("api.bedrock_client.boto3.Session") as mock_session_cls:
            mock_session = MagicMock()
            mock_session.client.return_value = MagicMock()
            mock_session_cls.return_value = mock_session
            bedrock_embedder = get_embedder(embedder_type='bedrock')
            assert bedrock_embedder is not None, "Bedrock embedder should be created"
        
        # Test OpenAI embedder
        openai_embedder = get_embedder(embedder_type='openai')
        assert openai_embedder is not None, "OpenAI embedder should be created"
        
        # Test Ollama embedder (may fail if Ollama not available, but should not crash)
        try:
            ollama_embedder = get_embedder(embedder_type='ollama')
            assert ollama_embedder is not None, "Ollama embedder should be created"
        except Exception as e:
            logger.warning(f"Ollama embedder creation failed (expected if Ollama not available): {e}")

    def test_get_embedder_with_legacy_params(self):
        """Test get_embedder with legacy boolean parameters."""
        from api.tools.embedder import get_embedder
        
        # Test with use_google_embedder=True
        google_embedder = get_embedder(use_google_embedder=True)
        assert google_embedder is not None, "Google embedder should be created with use_google_embedder=True"
        
        # Test with is_local_ollama=True
        try:
            ollama_embedder = get_embedder(is_local_ollama=True)
            assert ollama_embedder is not None, "Ollama embedder should be created with is_local_ollama=True"
        except Exception as e:
            logger.warning(f"Ollama embedder creation failed (expected if Ollama not available): {e}")

    def test_get_embedder_auto_detection(self):
        """Test get_embedder with automatic type detection."""
        from api.tools.embedder import get_embedder
        
        # Test auto-detection (should use current configuration)
        embedder = get_embedder()
        assert embedder is not None, "Auto-detected embedder should be created"


class TestEmbedderClients:
    """Test individual embedder clients."""

    def test_google_embedder_client(self):
        """Test Google embedder client directly."""
        if not os.getenv('GOOGLE_API_KEY'):
            logger.warning("Skipping Google embedder test - GOOGLE_API_KEY not available")
            return
            
        from api.google_embedder_client import GoogleEmbedderClient
        from adalflow.core.types import ModelType
        
        client = GoogleEmbedderClient()
        
        # Test single embedding
        api_kwargs = client.convert_inputs_to_api_kwargs(
            input="Hello world",
            model_kwargs={"model": "text-embedding-004", "task_type": "SEMANTIC_SIMILARITY"},
            model_type=ModelType.EMBEDDER
        )
        
        response = client.call(api_kwargs, ModelType.EMBEDDER)
        assert response is not None, "Google embedder should return response"
        
        # Parse the response
        parsed = client.parse_embedding_response(response)
        assert parsed.data is not None, "Parsed response should have data"
        assert len(parsed.data) > 0, "Should have at least one embedding"
        assert parsed.error is None, "Should not have errors"

    def test_openai_embedder_via_adalflow(self):
        """Test OpenAI embedder through AdalFlow."""
        if not os.getenv('OPENAI_API_KEY'):
            logger.warning("Skipping OpenAI embedder test - OPENAI_API_KEY not available")
            return
            
        import adalflow as adal
        from api.openai_client import OpenAIClient
        
        client = OpenAIClient()
        embedder = adal.Embedder(
            model_client=client,
            model_kwargs={"model": "text-embedding-3-small", "dimensions": 256}
        )
        
        result = embedder("Hello world")
        assert result is not None, "OpenAI embedder should return result"
        assert hasattr(result, 'data'), "Result should have data attribute"
        assert len(result.data) > 0, "Should have at least one embedding"


class TestDataPipelineFunctions:
    """Test data pipeline functions that use embedders."""
    
    def test_count_tokens(self, embedder_type=None):
        """Test token counting with different embedder types."""
        from api.data_pipeline import count_tokens
        
        test_text = "This is a test string for token counting."
        
        if embedder_type is not None:
            # Test with specific is_ollama_embedder value
            token_count = count_tokens(test_text, is_ollama_embedder=embedder_type)
            assert isinstance(token_count, int), "Token count should be an integer"
            assert token_count > 0, "Token count should be positive"
        else:
            # Test with all values
            for is_ollama in [None, True, False]:
                token_count = count_tokens(test_text, is_ollama_embedder=is_ollama)
                assert isinstance(token_count, int), "Token count should be an integer"
                assert token_count > 0, "Token count should be positive"

    def test_prepare_data_pipeline(self, is_ollama=None):
        """Test data pipeline preparation with different embedder types."""
        from api.data_pipeline import prepare_data_pipeline
        
        if is_ollama is not None:
            try:
                pipeline = prepare_data_pipeline(is_ollama_embedder=is_ollama)
                assert pipeline is not None, "Data pipeline should be created"
                assert hasattr(pipeline, '__call__'), "Pipeline should be callable"
            except Exception as e:
                # Some configurations might fail if services aren't available
                logger.warning(f"Pipeline creation failed (might be expected): {e}")
        else:
            # Test with all values
            for is_ollama_val in [None, True, False]:
                try:
                    pipeline = prepare_data_pipeline(is_ollama_embedder=is_ollama_val)
                    assert pipeline is not None, "Data pipeline should be created"
                    assert hasattr(pipeline, '__call__'), "Pipeline should be callable"
                except Exception as e:
                    logger.warning(f"Pipeline creation failed for is_ollama={is_ollama_val}: {e}")


class TestRAGIntegration:
    """Test RAG class integration with different embedders."""
    
    def test_rag_initialization(self):
        """Test RAG initialization with different embedder configurations."""
        from api.rag import RAG
        
        # Test with default configuration
        try:
            rag = RAG(provider="google", model="gemini-1.5-flash")
            assert rag is not None, "RAG should be initialized"
            assert hasattr(rag, 'embedder'), "RAG should have embedder"
            assert hasattr(rag, 'is_ollama_embedder'), "RAG should have is_ollama_embedder attribute"
        except Exception as e:
            logger.warning(f"RAG initialization failed (might be expected if keys missing): {e}")

    def test_rag_embedder_type_detection(self):
        """Test that RAG correctly detects embedder type."""
        from api.rag import RAG
        
        try:
            rag = RAG()
            # Should have the embedder type detection logic
            assert hasattr(rag, 'is_ollama_embedder'), "RAG should detect embedder type"
            assert isinstance(rag.is_ollama_embedder, bool), "is_ollama_embedder should be boolean"
        except Exception as e:
            logger.warning(f"RAG initialization failed: {e}")


class TestEnvironmentVariableHandling:
    """Test embedder selection via environment variables."""
    
    def test_embedder_type_env_var(self, embedder_type=None):
        """Test embedder selection via DEEPWIKI_EMBEDDER_TYPE environment variable."""
        import importlib
        import api.config
        
        if embedder_type:
            # Test specific embedder type
            self._test_single_embedder_type(embedder_type)
        else:
            # Test all embedder types
            for et in ['openai', 'google', 'ollama', 'bedrock']:
                self._test_single_embedder_type(et)
    
    def _test_single_embedder_type(self, embedder_type):
        """Test a single embedder type."""
        import importlib
        import api.config
        
        # Save original value
        original_value = os.environ.get('DEEPWIKI_EMBEDDER_TYPE')
        
        try:
            # Set environment variable
            os.environ['DEEPWIKI_EMBEDDER_TYPE'] = embedder_type
            
            # Reload config to pick up new env var
            importlib.reload(api.config)
            
            from api.config import EMBEDDER_TYPE, get_embedder_type
            
            assert EMBEDDER_TYPE == embedder_type, f"EMBEDDER_TYPE should be {embedder_type}"
            assert get_embedder_type() == embedder_type, f"get_embedder_type() should return {embedder_type}"
            
        finally:
            # Restore original value
            if original_value is not None:
                os.environ['DEEPWIKI_EMBEDDER_TYPE'] = original_value
            elif 'DEEPWIKI_EMBEDDER_TYPE' in os.environ:
                del os.environ['DEEPWIKI_EMBEDDER_TYPE']
            
            # Reload config to restore original state
            importlib.reload(api.config)


class TestIssuesIdentified:
    """Test the specific issues identified in the codebase."""
    
    def test_binary_assumptions_in_rag(self):
        """Test that RAG doesn't make binary assumptions about embedders."""
        from api.rag import RAG
        
        # The current implementation only considers is_ollama_embedder
        # This test documents the current behavior and will help verify fixes
        try:
            rag = RAG()
            
            # Current implementation only has is_ollama_embedder
            assert hasattr(rag, 'is_ollama_embedder'), "RAG should have is_ollama_embedder"
            
            # This is the issue: no explicit support for Google embedder detection
            # The fix should add proper embedder type detection
            
        except Exception as e:
            logger.warning(f"RAG test failed: {e}")

    def test_binary_assumptions_in_data_pipeline(self):
        """Test binary assumptions in data pipeline functions."""
        from api.data_pipeline import prepare_data_pipeline, count_tokens
        
        # These functions currently only consider is_ollama_embedder parameter
        # This test documents the issue and will verify fixes
        
        # count_tokens only considers ollama vs non-ollama
        token_count_ollama = count_tokens("test", is_ollama_embedder=True)
        token_count_other = count_tokens("test", is_ollama_embedder=False)
        
        assert isinstance(token_count_ollama, int)
        assert isinstance(token_count_other, int)
        
        # prepare_data_pipeline only accepts is_ollama_embedder parameter
        try:
            pipeline_ollama = prepare_data_pipeline(is_ollama_embedder=True)
            pipeline_other = prepare_data_pipeline(is_ollama_embedder=False)
            
            assert pipeline_ollama is not None
            assert pipeline_other is not None
        except Exception as e:
            logger.warning(f"Pipeline creation failed: {e}")


def run_all_tests():
    """Run all tests and return results."""
    logger.info("Running comprehensive embedder tests...")
    
    runner = TestRunner()
    
    # Test classes to run
    test_classes = [
        TestEmbedderConfiguration,
        TestEmbedderFactory,
        TestEmbedderClients,
        TestDataPipelineFunctions,
        TestRAGIntegration,
        TestEnvironmentVariableHandling,
        TestIssuesIdentified
    ]
    
    # Run all test classes
    for test_class in test_classes:
        logger.info(f"\n🧪 Running {test_class.__name__}...")
        runner.run_test_class(test_class)
    
    # Run parametrized tests manually
    logger.info("\n🧪 Running parametrized tests...")
    
    # Test embedder config with different types
    config_test = TestEmbedderConfiguration()
    for embedder_type in ['openai', 'google', 'ollama', 'bedrock']:
        runner.run_test(
            lambda et=embedder_type: config_test.test_get_embedder_config(et),
            f"TestEmbedderConfiguration.test_get_embedder_config[{embedder_type}]"
        )
    
    # Test token counting with different types
    pipeline_test = TestDataPipelineFunctions()
    for embedder_type in [None, True, False]:
        runner.run_test(
            lambda et=embedder_type: pipeline_test.test_count_tokens(et),
            f"TestDataPipelineFunctions.test_count_tokens[{embedder_type}]"
        )
    
    # Test pipeline preparation with different types
    for is_ollama in [None, True, False]:
        runner.run_test(
            lambda ol=is_ollama: pipeline_test.test_prepare_data_pipeline(ol),
            f"TestDataPipelineFunctions.test_prepare_data_pipeline[{is_ollama}]"
        )
    
    # Test environment variable handling
    env_test = TestEnvironmentVariableHandling()
    for embedder_type in ['openai', 'google', 'ollama', 'bedrock']:
        runner.run_test(
            lambda et=embedder_type: env_test.test_embedder_type_env_var(et),
            f"TestEnvironmentVariableHandling.test_embedder_type_env_var[{embedder_type}]"
        )
    
    return runner.summary()


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
