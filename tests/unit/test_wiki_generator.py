"""
Unit tests for Wiki Page Generator

Tests for WikiPageGenerator class and related components.
"""
import os
import sys
from pathlib import Path

# Add project root to Python path
# __file__ is in tests/unit/, so we need to go up 2 levels to reach project root
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
print(f"project_root: {project_root}, __file__: {__file__}")
sys.path.insert(0, project_root)

# Load environment variables from .env file
from dotenv import load_dotenv

env_path = Path(project_root) / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print(f"✅ Loaded environment variables from: {env_path}")
else:
    print(f"⚠️  Warning: .env file not found at {env_path}")
    print("   Please create a .env file with OPENAI_API_KEYS and OPENAI_BASE_URL")
    sys.exit(1)

import pytest
from unittest.mock import AsyncMock, Mock, MagicMock, patch
from api.tools.rag_layers import WikiPageGenerator, WikiPageGenerationRequest
from api.tools.wiki_exceptions import ValidationError, RAGIndexError, WikiGenerationError
from api.tools.wiki_validator import WikiStructureValidator
from api.tools.wiki_resources import RAGContext, WebSocketGuard


@pytest.mark.asyncio
async def test_validation_failure():
    """Test input validation failure"""
    generator = WikiPageGenerator()
    websocket = AsyncMock()
    websocket.client_state.name = 'CONNECTED'
    
    # Invalid wiki structure
    request = WikiPageGenerationRequest(
        repo_url="https://github.com/test/repo",
        wiki_structure={"invalid": "structure"}  # Missing pages field
    )
    
    with pytest.raises(ValidationError):
        await generator.generate(websocket, request)
    
    # Verify error message was sent
    assert websocket.send_text.called


@pytest.mark.asyncio
async def test_validation_empty_pages():
    """Test empty pages list validation"""
    generator = WikiPageGenerator()
    websocket = AsyncMock()
    websocket.client_state.name = 'CONNECTED'
    
    request = WikiPageGenerationRequest(
        repo_url="https://github.com/test/repo",
        wiki_structure={"pages": []}  # Empty pages list
    )
    
    with pytest.raises(ValidationError):
        await generator.generate(websocket, request)


@pytest.mark.asyncio
async def test_validation_missing_page_fields():
    """Test page missing required fields"""
    generator = WikiPageGenerator()
    websocket = AsyncMock()
    websocket.client_state.name = 'CONNECTED'
    
    request = WikiPageGenerationRequest(
        repo_url="https://github.com/test/repo",
        wiki_structure={
            "pages": [
                {"title": "Test Page"}  # Missing id field
            ]
        }
    )
    
    with pytest.raises(ValidationError):
        await generator.generate(websocket, request)


@pytest.mark.asyncio
async def test_resource_cleanup_rag_context():
    """Test RAG resource cleanup"""
    rag_context = RAGContext("openai", None)
    
    # Simulate exception
    with pytest.raises(Exception):
        async with rag_context as rag:
            raise Exception("Test error")
    
    # Verify resources were cleaned up
    assert rag_context.rag is None


@pytest.mark.asyncio
async def test_websocket_guard():
    """Test WebSocket guard"""
    websocket = AsyncMock()
    websocket.client_state.name = 'CONNECTED'
    
    guard = WebSocketGuard(websocket)
    
    async with guard as ws:
        assert ws == websocket
    
    # Verify WebSocket was closed
    assert websocket.close.called


@pytest.mark.asyncio
async def test_websocket_guard_keep_open():
    """Test WebSocket guard keep open"""
    websocket = AsyncMock()
    websocket.client_state.name = 'CONNECTED'
    
    guard = WebSocketGuard(websocket)
    guard.keep_open()
    
    async with guard as ws:
        assert ws == websocket
    
    # Verify WebSocket was not closed
    assert not websocket.close.called


def test_validator_valid_structure():
    """Test validator - valid structure"""
    validator = WikiStructureValidator()
    
    valid_structure = {
        "pages": [
            {"id": "page1", "title": "Page 1"},
            {"id": "page2", "title": "Page 2"}
        ],
        "sections": [
            {"id": "section1", "pages": ["page1", "page2"]}
        ]
    }
    
    # Should not throw exception
    validator.validate_wiki_structure(valid_structure)


def test_validator_invalid_structure():
    """Test validator - invalid structure"""
    validator = WikiStructureValidator()
    
    invalid_structure = {
        "pages": "not a list"  # Should be a list
    }
    
    with pytest.raises(ValidationError):
        validator.validate_wiki_structure(invalid_structure)


def test_validator_missing_pages():
    """Test validator - missing pages field"""
    validator = WikiStructureValidator()
    
    invalid_structure = {
        "sections": []
    }
    
    with pytest.raises(ValidationError) as exc_info:
        validator.validate_wiki_structure(invalid_structure)
    
    assert "pages" in str(exc_info.value)


@pytest.mark.asyncio
async def test_generator_dependency_injection():
    """Test dependency injection"""
    mock_rag_factory = Mock(return_value=Mock())
    mock_llm_factory = Mock(return_value=Mock())
    mock_configs = {"default_provider": "test"}
    
    generator = WikiPageGenerator(
        rag_factory=mock_rag_factory,
        llm_service_factory=mock_llm_factory,
        configs=mock_configs
    )
    
    assert generator.rag_factory == mock_rag_factory
    assert generator.llm_service_factory == mock_llm_factory
    assert generator.configs == mock_configs


@pytest.mark.asyncio
async def test_generator_default_factories():
    """Test default factory functions"""
    generator = WikiPageGenerator()
    
    # Test default RAG factory
    rag = generator._default_rag_factory("openai", None)
    assert rag is not None
    
    # Test default LLM factory
    llm_service = generator._default_llm_factory()
    assert llm_service is not None
    
    # Test default config loading
    configs = generator._load_configs()
    assert configs is not None
    assert isinstance(configs, dict)


@pytest.mark.asyncio
async def test_handle_wiki_page_generation_integration():
    """
    Integration test: Test complete Wiki page generation flow
    
    This test requires:
    1. Valid API keys (loaded from .env)
    2. Local repository path or valid GitHub URL
    3. Simple wiki_structure
    """
    from api.tools.rag_layers import handle_wiki_page_generation
    import json
    
    # Create mock WebSocket
    websocket = AsyncMock()
    websocket.client_state.name = 'CONNECTED'
    
    # Store received messages
    sent_messages = []
    
    async def mock_send_text(message: str):
        """Mock sending message and record it"""
        try:
            msg_data = json.loads(message)
            sent_messages.append(msg_data)
            print(f"📤 发送消息: type={msg_data.get('type')}, "
                  f"message={msg_data.get('message', '')[:50]}...")
        except json.JSONDecodeError:
            print(f"📤 发送消息 (非JSON): {message[:100]}...")
    
    websocket.send_text = mock_send_text
    
    # Construct test request
    # Use local path (current project) as test repository
    request_data = {
        "request_type": "wiki_page_generation",
        "repo_url": project_root,  # Use local path
        "repo_type": "local",       # Specify as local repository
        "access_token": None,       # Local repository doesn't need token
        "language": "zh",           # Chinese
        "wiki_structure": {
            "title": "Test Wiki",
            "description": "Simple Wiki structure for testing",
            "pages": [
                {
                    "id": "test-page-1",
                    "title": "Project Overview",
                    "description": "Basic project introduction",
                    "importance": "high",
                    "filePaths": ["README.md"],  # Specify files to retrieve
                    "relatedPages": []
                }
            ],
            "sections": [
                {
                    "id": "section-1",
                    "title": "Basic Documentation",
                    "pages": ["test-page-1"]
                }
            ]
        },
        "max_concurrent_pages": 1  # Generate only 1 page to speed up test
    }
    
    print("\n" + "=" * 70)
    print("🧪 Starting integration test: handle_wiki_page_generation")
    print("=" * 70)
    print(f"📁 Repository path: {request_data['repo_url']}")
    print(f"📄 Pages to generate: {len(request_data['wiki_structure']['pages'])}")
    print("=" * 70 + "\n")
    
    try:
        # Call actual handler function
        await handle_wiki_page_generation(websocket, request_data)
        
        print("\n" + "=" * 70)
        print("✅ Wiki page generation completed")
        print("=" * 70)
        
        # Analyze received messages
        print(f"\n📊 Total messages received: {len(sent_messages)}:\n")
        
        for i, msg in enumerate(sent_messages, 1):
            msg_type = msg.get('type', 'unknown')
            print(f"{i}. Type: {msg_type}")
            
            if msg_type == 'status':
                print(f"   Status: {msg.get('message', '')}")
            elif msg_type == 'page_generated':
                page_id = msg.get('page_id', '')
                content_len = len(msg.get('content', ''))
                print(f"   Page ID: {page_id}")
                print(f"   Content length: {content_len} characters")
            elif msg_type == 'completed':
                result = msg.get('result', {})
                gen_pages = result.get('generated_pages', {})
                print(f"   Successfully generated: {len(gen_pages)} pages")
                
                # Show generated content preview
                for page_id, page_data in gen_pages.items():
                    content = page_data.get('content', '')
                    print(f"\n   Page [{page_id}] content preview:")
                    print(f"   {content[:200]}...")
            elif msg_type == 'error':
                print(f"   ❌ Error: {msg.get('message', '')}")
        
        # Verify at least one completion message was received
        completion_msgs = [m for m in sent_messages if m.get('type') == 'completed']
        assert len(completion_msgs) > 0, "Should receive at least one 'completed' message"
        
        print("\n" + "=" * 70)
        print("✅ Integration test passed")
        print("=" * 70 + "\n")
        
    except Exception as e:
        print("\n" + "=" * 70)
        print(f"❌ Test failed: {str(e)}")
        print("=" * 70)
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    """
    Support running test file directly (without pytest)
    Using pytest is the recommended way: pytest tests/unit/test_wiki_generator.py
    """
    import asyncio
    
    async def run_all_tests():
        """Run all test functions"""
        print("\n" + "=" * 60)
        print("Starting tests...")
        print("=" * 60 + "\n")
        
        test_functions = [
            ("test_validation_failure", test_validation_failure),
            ("test_validation_empty_pages", test_validation_empty_pages),
            ("test_validation_missing_page_fields", test_validation_missing_page_fields),
            ("test_resource_cleanup_rag_context", test_resource_cleanup_rag_context),
            ("test_websocket_guard", test_websocket_guard),
            ("test_websocket_guard_keep_open", test_websocket_guard_keep_open),
            ("test_validator_valid_structure", test_validator_valid_structure),
            ("test_validator_invalid_structure", test_validator_invalid_structure),
            ("test_validator_missing_pages", test_validator_missing_pages),
            ("test_generator_dependency_injection", test_generator_dependency_injection),
            ("test_generator_default_factories", test_generator_default_factories),
            # Note: Integration test requires real API keys and longer time, usually not run in unit tests
            # ("test_handle_wiki_page_generation_integration", test_handle_wiki_page_generation_integration),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in test_functions:
            try:
                print(f"Running test: {test_name}...", end=" ")
                if asyncio.iscoroutinefunction(test_func):
                    await test_func()
                else:
                    test_func()
                print("✅ PASSED")
                passed += 1
            except Exception as e:
                print(f"❌ FAILED: {e}")
                failed += 1
                import traceback
                traceback.print_exc()
        
        print("\n" + "=" * 60)
        print(f"Tests completed: {passed} passed, {failed} failed")
        print("=" * 60)
        
        if failed > 0:
            sys.exit(1)
    
    # Run all tests
    asyncio.run(run_all_tests())

