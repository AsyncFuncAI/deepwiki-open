import pytest
import dataclasses
from adalflow.core.types import Document
from unittest.mock import MagicMock, patch
from api.code_splitter import (
    TreeSitterCodeSplitter,
    CodeAwareSplitter,
    CodeSplitterConfig,
    _split_lines_with_overlap,
)
from adalflow.components.data_process import TextSplitter


class TestTreeSitterCodeSplitter:
    """Test suite for TreeSitterCodeSplitter with recursive splitting."""

    @pytest.fixture
    def splitter(self):
        return TreeSitterCodeSplitter(
            chunk_size_lines=13,
            chunk_overlap_lines=0,
            min_chunk_lines=3,
            enabled=True,
        )

    def test_small_python_function(self, splitter):
        """Test that small functions are kept intact."""
        code = '''def hello_world():
    """A simple function."""
    print("Hello, World!")
    return True
'''
        doc = Document(
            text=code,
            meta_data={"file_path": "test.py", "type": "py", "is_code": True},
        )
        
        result = splitter.split_document(doc)
        
        assert len(result) == 1
        assert "def hello_world" in result[0].text
        assert result[0].meta_data["chunk_index"] == 0
        assert result[0].meta_data["chunk_total"] == 1

    def test_large_class_with_methods(self, splitter):
        """Test recursive splitting of a large class into methods."""
        code = '''class Calculator:
    """A calculator class with multiple methods."""
    
    def __init__(self):
        self.result = 0
    
    def add(self, a, b):
        """Add two numbers."""
        result = a + b
        self.result = result
        return result
    
    def subtract(self, a, b):
        """Subtract two numbers."""
        result = a - b
        self.result = result
        return result
    
    def multiply(self, a, b):
        """Multiply two numbers."""
        result = a * b
        self.result = result
        return result
    
    def divide(self, a, b):
        """Divide two numbers."""
        if b == 0:
            raise ValueError("Cannot divide by zero")
        result = a / b
        self.result = result
        return result
'''
        doc = Document(
            text=code,
            meta_data={"file_path": "calc.py", "type": "py", "is_code": True},
        )
        
        result = splitter.split_document(doc)
        
        # Should split into multiple chunks (methods)
        assert len(result) > 1
        
        # Each chunk should have metadata
        for chunk in result:
            assert "chunk_index" in chunk.meta_data
            assert "chunk_total" in chunk.meta_data
            assert "chunk_start_line" in chunk.meta_data

    def test_nested_classes(self, splitter):
        """Test recursive splitting with nested class structures."""
        code = '''class OuterClass:
    """Outer class with nested class."""
    
    def outer_method(self):
        """Method in outer class."""
        return "outer"
    
    class InnerClass:
        """Inner class."""
        
        def inner_method_one(self):
            """First inner method."""
            return "inner1"
        
        def inner_method_two(self):
            """Second inner method."""
            return "inner2"
        
        def inner_method_three(self):
            """Third inner method."""
            return "inner3"
'''
        doc = Document(
            text=code,
            meta_data={"file_path": "nested.py", "type": "py", "is_code": True},
        )
        
        result = splitter.split_document(doc)
        
        # Should recursively split nested structures
        assert len(result) > 1

    def test_fallback_to_line_splitting(self, splitter):
        """Test fallback to line-based splitting when no semantic structure found."""
        code = '''# This is a very long comment block
# Line 2
# Line 3
# Line 4
# Line 5
# Line 6
# Line 7
# Line 8
# Line 9
# Line 10
# Line 11
# Line 12
# Line 13
# Line 14
# Line 15
'''
        doc = Document(
            text=code,
            meta_data={"file_path": "comments.py", "type": "py", "is_code": True},
        )
        
        result = splitter.split_document(doc)
        
        # Should fall back to line-based splitting
        assert len(result) >= 1

    def test_min_chunk_lines_filter(self, splitter):
        """Test that chunks smaller than min_chunk_lines are filtered out."""
        # This code has only 1 line, which is less than min_chunk_lines=3
        code = '''x = 1
'''
        doc = Document(
            text=code,
            meta_data={"file_path": "tiny.py", "type": "py", "is_code": True},
        )
        
        result = splitter.split_document(doc)
        
        # When no semantic nodes are found and all chunks are filtered out,
        # the fallback returns the original document as a safety measure
        assert len(result) == 1
        assert result[0].text == code

    def test_javascript_code(self, splitter):
        """Test splitting JavaScript code with a complex structure and scattered members."""
        code = '''class UserService {
    constructor() {
        this.users = [];
    }

    addUser(user) {
        this.users.push(user);
        return user;
    }

    removeUser(userId) {
        const index = this.users.findIndex(u => u.id === userId);
        if (index !== -1) {
            this.users.splice(index, 1);
        }
    }

    getUser(userId) {
        return this.users.find(u => u.id === userId);
    }
}
'''
        doc = Document(
            text=code,
            meta_data={"file_path": "service.js", "type": "js", "is_code": True},
        )
        
        result = splitter.split_document(doc)
        
        # Should split into parent shell + methods
        assert len(result) >= 4
        
        # Verify that the class header is preserved in the parent shell
        parent_shell = next((c for c in result if "class UserService" in c.text), None)
        assert parent_shell is not None
        
        # Verify methods are extracted as separate chunks
        assert any("constructor()" in c.text for c in result)
        assert any("addUser" in c.text for c in result)
        assert any("removeUser" in c.text for c in result)
        assert any("getUser" in c.text for c in result)

    def test_large_function_with_nested_functions(self, splitter):
        """Test that large functions with nested functions preserve parent context."""
        # Use a function larger than chunk_size_lines (13) to trigger recursive splitting
        code = '''def large_parent_function():
    # code part 1: initialization
    x = 10
    y = 20
    print("Initializing...")

    def nested_function_1():
        """First nested function."""
        print("Nested 1")
        return 1

    # code part 2: intermediate logic
    z = x + y
    print(f"Intermediate result: {z}")

    def nested_function_2():
        """Second nested function."""
        print("Nested 2")
        return 2

    # code part 3: final logic
    result = z + nested_function_1() + nested_function_2()
    print(f"Final result: {result}")
    return result
'''
        doc = Document(
            text=code,
            meta_data={"file_path": "nested.py", "type": "py", "is_code": True},
        )
        
        result = splitter.split_document(doc)
        
        # Should split into parent shell + 2 nested functions
        assert len(result) >= 3
        
        # Find the parent shell chunk
        parent_shell = next((c for c in result if "def large_parent_function" in c.text), None)
        assert parent_shell is not None
        assert "# code part 1" in parent_shell.text
        assert "# code part 2" in parent_shell.text
        assert "# code part 3" in parent_shell.text
        
        # Verify nested functions are also present as separate chunks
        assert any("def nested_function_1" in c.text for c in result)
        assert any("def nested_function_2" in c.text for c in result)

    def test_deeply_nested_complex_structure(self, splitter):
        """Test recursive splitting of a deeply nested complex structure."""
        code = '''class DatabaseManager:
    """Top-level class for managing database operations."""
    
    DEFAULT_TIMEOUT = 30
    
    def __init__(self, connection_string):
        self.conn = connection_string
        self.active = True
        print(f"Connecting to {connection_string}...")

    def process_data(self, data):
        """A large method with nested logic and functions."""
        print("Starting data processing...")
        
        def validate_input(item):
            """Nested validation function."""
            print(f"Validating {item}")
            return item is not None
            
        def transform_item(item):
            """Nested transformation function."""
            # Part 1 of transformation
            print("Transforming part 1")
            
            def deep_nested_util():
                """Deeply nested utility."""
                return "util_result"
                
            # Part 2 of transformation
            return f"transformed_{item}_{deep_nested_util()}"

        results = []
        for d in data:
            if validate_input(d):
                results.append(transform_item(d))
        
        print("Data processing complete.")
        return results

    class InternalCache:
        """Nested class for internal caching."""
        
        def __init__(self):
            self.cache = {}
            
        def get_item(self, key):
            """Method in nested class."""
            return self.cache.get(key)
            
        def set_item(self, key, value):
            """Another method in nested class with its own nested logic."""
            print(f"Caching {key}")
            
            def compute_hash(v):
                """Nested function in nested class method."""
                return hash(v)
                
            self.cache[key] = (value, compute_hash(value))
'''
        doc = Document(
            text=code,
            meta_data={"file_path": "manager.py", "type": "py", "is_code": True},
        )
        
        result = splitter.split_document(doc)
        
        # Should split into many chunks due to deep nesting and size
        assert len(result) >= 5
        
        # Verify top-level class shell
        manager_shell = next((c for c in result if "class DatabaseManager" in c.text), None)
        assert manager_shell is not None
        assert "DEFAULT_TIMEOUT = 30" in manager_shell.text
        
        # Verify InternalCache shell (it's a container node)
        cache_shell = next((c for c in result if "class InternalCache" in c.text), None)
        assert cache_shell is not None
        
        # Verify deep nested functions are captured as separate chunks
        assert any("def validate_input" in c.text for c in result)
        assert any("def transform_item" in c.text for c in result)
        assert any("def deep_nested_util" in c.text for c in result)
        assert any("def compute_hash" in c.text for c in result)
        
        # Verify shell context for process_data
        process_data_shell = next((c for c in result if "def process_data" in c.text), None)
        assert process_data_shell is not None
        assert "results = []" in process_data_shell.text
        assert "return results" in process_data_shell.text

    def test_recursion_depth_limit(self, splitter, caplog):
        """Test that recursion depth limit is respected and falls back to line splitting."""
        # Set a very low depth limit for testing
        splitter.config = CodeSplitterConfig(
            chunk_size_lines=5,
            chunk_overlap_lines=0,
            min_chunk_lines=1,
            max_recursion_depth=1
        )
        
        code = '''def level_0():
    def level_1():
        def level_2():
            def level_3():
                print("Deep")
                print("Nesting")
                print("To")
                print("Trigger")
                print("Limit")
'''
        doc = Document(
            text=code,
            meta_data={"file_path": "deep.py", "type": "py", "is_code": True},
        )
        
        # This should trigger the limit at level 2 because level 0 is depth 0, level 1 is depth 1
        with caplog.at_level("WARNING"):
            result = splitter.split_document(doc)
        
        assert len(result) >= 1
        assert "Max recursion depth (1) reached" in caplog.text
        
    def test_unsupported_language_fallback(self, splitter):
        """Test fallback for unsupported file types."""
        code = '''Some random text
that is not code
but should still
be processed
line by line
if it's long enough
to exceed the chunk size
and needs splitting
into multiple parts
for proper handling
and processing later
in the pipeline
'''
        doc = Document(
            text=code,
            meta_data={"file_path": "test.xyz", "type": "xyz", "is_code": True},
        )
        
        result = splitter.split_document(doc)
        
        # Should fall back to line-based splitting
        assert len(result) >= 1

    def test_chunk_overlap(self):
        """Test that chunk overlap is applied correctly during fallback splitting."""
        splitter = TreeSitterCodeSplitter(
            chunk_size_lines=10,
            chunk_overlap_lines=2,
            min_chunk_lines=1,
        )
        # Create code that will be split by the fallback mechanism
        lines = [f"# Line {i + 1}\n" for i in range(15)]
        code = "".join(lines)
        
        doc = Document(
            text=code,
            meta_data={"file_path": "long.py", "type": "py", "is_code": True},
        )
        
        result = splitter.split_document(doc)
        
        # Should have two chunks with overlap
        assert len(result) == 2
        # Check that chunk 1 overlaps with chunk 0
        chunk0_lines = result[0].text.splitlines()
        chunk1_lines = result[1].text.splitlines()
        
        # The last 2 lines of chunk 0 should be the first 2 lines of chunk 1
        assert chunk0_lines[-2:] == chunk1_lines[:2]
        assert chunk1_lines[0] == "# Line 9"

    def test_disabled_splitter(self):
        """Test that disabled splitter returns original document."""
        splitter = TreeSitterCodeSplitter(enabled=False)
        
        code = "def test(): pass"
        doc = Document(
            text=code,
            meta_data={"file_path": "test.py", "type": "py", "is_code": True},
        )
        
        result = splitter.split_document(doc)
        
        assert len(result) == 1
        assert result[0].text == code

    def test_non_code_document(self, splitter):
        """Test that non-code documents are returned unchanged."""
        text = "This is a markdown document."
        doc = Document(
            text=text,
            meta_data={"file_path": "README.md", "type": "md", "is_code": False},
        )
        
        result = splitter.split_document(doc)
        
        assert len(result) == 1
        assert result[0].text == text

    def test_try_get_parser_none(self, splitter):
        """Test _try_get_parser when _get_parser is None."""
        splitter._get_parser = None
        assert splitter._try_get_parser("py") is None

    def test_split_code_text_root_none(self, splitter):
        """Test _split_code_text when tree.root_node is None."""
        mock_parser = MagicMock()
        mock_tree = MagicMock()
        mock_tree.root_node = None
        mock_parser.parse.return_value = mock_tree
        
        with patch.object(splitter, '_try_get_parser', return_value=mock_parser):
            text = "some text"
            meta = {"is_code": True}
            # Should fall back to line splitting
            result = splitter._split_code_text(text, meta, "py")
            assert len(result) >= 1
            assert result[0].text == text

    def test_split_code_text_empty_docs(self, splitter):
        """Test _split_code_text when nodes are found but recursion returns no docs."""
        mock_parser = MagicMock()
        mock_tree = MagicMock()
        mock_node = MagicMock()
        mock_tree.root_node = mock_node
        mock_parser.parse.return_value = mock_tree
        
        # Mock _iter_definition_like_nodes to yield one node
        # and _split_node_recursively to return empty list
        with patch('api.code_splitter._iter_definition_like_nodes', return_value=[mock_node]):
            with patch.object(splitter, '_split_node_recursively', return_value=[]):
                with patch.object(splitter, '_try_get_parser', return_value=mock_parser):
                    text = "some text"
                    meta = {"is_code": True}
                    result = splitter._split_code_text(text, meta, "py")
                    # Should hit the "if not docs" block and fall back to line split
                    assert len(result) >= 1
                    assert result[0].text == text

    def test_try_get_parser_internal_exception(self, splitter):
        """Test _try_get_parser when the parser factory raises an exception."""
        mock_get_parser = MagicMock(side_effect=Exception("Parser failure"))
        splitter._get_parser = mock_get_parser
        
        # Should catch exception and return None after trying candidates
        assert splitter._try_get_parser("py") is None
        assert mock_get_parser.called

    def test_split_code_text_parse_exception(self, splitter):
        """Test _split_code_text when parser.parse raises an exception."""
        mock_parser = MagicMock()
        mock_parser.parse.side_effect = Exception("Parsing crash")
        
        with patch.object(splitter, '_try_get_parser', return_value=mock_parser):
            text = "def crash(): pass"
            meta = {"is_code": True}
            # Should catch exception and fall back to line splitting
            result = splitter._split_code_text(text, meta, "py")
            assert len(result) >= 1
            assert result[0].text == text

    def test_split_node_recursively_invalid_node(self, splitter):
        """Test _split_node_recursively with a corrupt node that raises AttributeError."""
        # A mock with empty spec will raise AttributeError on any attribute access
        mock_node = MagicMock(spec=[])
        
        meta = {"is_code": True}
        text_bytes = b"def test(): pass"
        # Should catch AttributeError and return empty list
        result = splitter._split_node_recursively(mock_node, text_bytes, meta, depth=0)
        assert result == []

class TestCodeAwareSplitter:
    """Test suite for CodeAwareSplitter integration."""

    @pytest.fixture
    def code_aware_splitter(self):
        text_splitter = TextSplitter(split_by="word", chunk_size=100, chunk_overlap=10)
        code_splitter = TreeSitterCodeSplitter(
            chunk_size_lines=10,
            chunk_overlap_lines=2,
            min_chunk_lines=3,
        )
        return CodeAwareSplitter(
            text_splitter=text_splitter,
            code_splitter=code_splitter,
        )

    def test_code_document_routing(self, code_aware_splitter):
        """Test that code documents are routed to code splitter."""
        code = '''def hello():
    print("Hello")
    return True
'''
        doc = Document(
            text=code,
            meta_data={"file_path": "test.py", "type": "py", "is_code": True},
        )
        
        result = code_aware_splitter([doc])
        
        assert len(result) >= 1

    def test_text_document_routing(self, code_aware_splitter):
        """Test that text documents are routed to text splitter."""
        text = "This is a regular text document that should be processed by the text splitter."
        doc = Document(
            text=text,
            meta_data={"file_path": "README.md", "type": "md", "is_code": False},
        )
        
        result = code_aware_splitter([doc])
        
        assert len(result) >= 1

    def test_serialization(self, code_aware_splitter):
        """Test that CodeAwareSplitter can be serialized and deserialized."""
        serialized = code_aware_splitter.to_dict()
        
        assert "text_splitter" in serialized
        assert "code_splitter_config" in serialized
        
        # Test deserialization
        restored = CodeAwareSplitter.from_dict(serialized)
        
        assert restored is not None
        assert isinstance(restored, CodeAwareSplitter)


class TestCodeSplitterConfig:
    """Test suite for CodeSplitterConfig."""

    def test_default_config(self):
        """Test default configuration values."""
        config = CodeSplitterConfig()
        
        assert config.chunk_size_lines == 200
        assert config.chunk_overlap_lines == 20
        assert config.min_chunk_lines == 5
        assert config.max_recursion_depth == 256
        assert config.enabled is True

    def test_custom_config(self):
        """Test custom configuration values."""
        config = CodeSplitterConfig(
            chunk_size_lines=100,
            chunk_overlap_lines=10,
            min_chunk_lines=3,
            max_recursion_depth=128,
            enabled=False,
        )
        
        assert config.chunk_size_lines == 100
        assert config.chunk_overlap_lines == 10
        assert config.min_chunk_lines == 3
        assert config.max_recursion_depth == 128
        assert config.enabled is False

    def test_config_immutability(self):
        """Test that config is frozen (immutable)."""
        config = CodeSplitterConfig()
        
        with pytest.raises(dataclasses.FrozenInstanceError):
            config.chunk_size_lines = 300
        
        with pytest.raises(dataclasses.FrozenInstanceError):
            config.max_recursion_depth = 512


class TestHelperFunctions:
    """Test suite for internal helper functions."""

    def test_safe_import_tree_sitter_error(self):
        """Test _safe_import_tree_sitter when importlib raises ImportError."""
        with patch("importlib.import_module", side_effect=ImportError("module not found")):
            from api.code_splitter import _safe_import_tree_sitter
            get_parser, get_language = _safe_import_tree_sitter()
            assert get_parser is None
            assert get_language is None

    def test_split_lines_with_overlap_zero_chunk_size(self):
        """Test _split_lines_with_overlap with chunk_size_lines=0."""
        lines = ["line1", "line2", "line3"]
        result = _split_lines_with_overlap(lines, chunk_size_lines=0, chunk_overlap_lines=5)
        assert len(result) == 1
        assert result[0] == (lines, 0)
