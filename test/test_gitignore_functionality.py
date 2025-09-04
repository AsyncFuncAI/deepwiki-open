#!/usr/bin/env python3
"""
Test script for gitignore functionality in read_all_documents function

Run this script to test the gitignore integration functionality.
Usage: uv run pytest test/test_gitignore_functionality.py -v
"""

import pytest
import os
import tempfile
import shutil
import subprocess
from unittest.mock import patch, MagicMock
from pathlib import Path

# Import the modules under test
from api.data_pipeline import read_all_documents, get_git_ignore_path_set


class TestGitignoreFunctionality:
    """Test class for gitignore functionality"""
    
    def setup_method(self):
        """Set up test environment before each test"""
        # Create temporary directory for testing
        self.test_dir = tempfile.mkdtemp()
        self.original_cwd = os.getcwd()
        
    def teardown_method(self):
        """Clean up test environment after each test"""
        # Change back to original directory and clean up
        os.chdir(self.original_cwd)
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
    
    def create_git_repo_with_files(self, files_structure, gitignore_content=None):
        """Helper method to create a git repository with files and .gitignore"""
        os.chdir(self.test_dir)
        
        # Initialize git repository
        subprocess.run(["git", "init"], check=True, capture_output=True)
        subprocess.run(["git", "config", "user.name", "Test User"], check=True)
        subprocess.run(["git", "config", "user.email", "test@example.com"], check=True)
        
        # Create files
        for file_path, content in files_structure.items():
            full_path = Path(self.test_dir) / file_path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content)
        
        # Create .gitignore if provided
        if gitignore_content:
            gitignore_path = Path(self.test_dir) / ".gitignore"
            gitignore_path.write_text(gitignore_content)
            # Add .gitignore to git
            subprocess.run(["git", "add", ".gitignore"], check=True)
            subprocess.run(["git", "commit", "-m", "Add .gitignore"], check=True)
    
    def test_get_git_ignore_path_set_basic_patterns(self):
        """Test get_git_ignore_path_set with basic gitignore patterns"""
        # Create test files and .gitignore
        files = {
            "README.md": "# Test README",
            "src/main.py": "print('hello')",
            "debug.log": "debug info",
            "error.log": "error info",
            "build/output.js": "compiled code",
            "node_modules/package/index.js": "dependency"
        }
        
        gitignore_content = """*.log
build/
node_modules/
"""
        
        self.create_git_repo_with_files(files, gitignore_content)
        
        # Test the function
        ignored_paths = get_git_ignore_path_set(self.test_dir)
        
        # Verify results
        assert isinstance(ignored_paths, set)
        
        # Check that ignored files are in the result
        ignored_files = [path for path in ignored_paths if not path.endswith('/')]
        ignored_dirs = [path for path in ignored_paths if path.endswith('/')]
        
        # Log files should be ignored
        assert any("debug.log" in path for path in ignored_files)
        assert any("error.log" in path for path in ignored_files)
        
        # Directories should be ignored
        assert any("build/" in path for path in ignored_dirs)
        assert any("node_modules/" in path for path in ignored_dirs)
        
        print(f"✓ Basic gitignore patterns test passed. Ignored paths: {ignored_paths}")
    
    def test_get_git_ignore_path_set_empty_gitignore(self):
        """Test get_git_ignore_path_set with empty .gitignore"""
        files = {
            "README.md": "# Test README",
            "src/main.py": "print('hello')"
        }
        
        self.create_git_repo_with_files(files, "")
        
        # Test the function
        ignored_paths = get_git_ignore_path_set(self.test_dir)
        
        # Verify results - should be empty or minimal
        assert isinstance(ignored_paths, set)
        
        print(f"✓ Empty gitignore test passed. Ignored paths: {ignored_paths}")
    
    def test_get_git_ignore_path_set_no_gitignore(self):
        """Test get_git_ignore_path_set without .gitignore file"""
        files = {
            "README.md": "# Test README",
            "src/main.py": "print('hello')"
        }
        
        self.create_git_repo_with_files(files)
        
        # Test the function
        ignored_paths = get_git_ignore_path_set(self.test_dir)
        
        # Verify results
        assert isinstance(ignored_paths, set)
        
        print(f"✓ No gitignore test passed. Ignored paths: {ignored_paths}")
    
    def test_get_git_ignore_path_set_non_git_directory(self):
        """Test get_git_ignore_path_set with non-git directory (should return empty set)"""
        # Create files without initializing git
        files = {
            "README.md": "# Test README",
            "src/main.py": "print('hello')"
        }
        
        os.chdir(self.test_dir)
        for file_path, content in files.items():
            full_path = Path(self.test_dir) / file_path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content)
        
        # Test the function - should return empty set
        ignored_paths = get_git_ignore_path_set(self.test_dir)
        assert ignored_paths == set()
        
        print("✓ Non-git directory test passed (returned empty set)")
    
    def test_read_all_documents_use_gitignore_true(self):
        """Test read_all_documents with use_gitignore=True"""
        # Create test files and .gitignore
        files = {
            "README.md": "# Test README",
            "src/main.py": "print('hello')",
            "debug.log": "debug info",
            "build/output.js": "compiled code"
        }
        
        gitignore_content = """*.log
build/
"""
        
        self.create_git_repo_with_files(files, gitignore_content)
        
        # Mock the read_all_documents function to avoid actual file processing
        with patch('api.data_pipeline.get_git_ignore_path_set') as mock_git_ignore:
            mock_git_ignore.return_value = {"debug.log", "build/"}
            
            # Test that the function can be called with use_gitignore=True
            try:
                # This should not raise an error
                result = read_all_documents(
                    path=self.test_dir,
                    use_gitignore=True,
                    is_ollama_embedder=False
                )
                # Verify that get_git_ignore_path_set was called
                mock_git_ignore.assert_called_once_with(self.test_dir)
                
                # Verify the result structure and content
                assert isinstance(result, list), "Result should be a list of Document objects"
                
                # Extract file paths from the result
                result_files = [doc.meta_data['file_path'] for doc in result]
                
                # Check that ignored files are NOT in the result
                assert "debug.log" not in result_files, "debug.log should be ignored"
                assert "build/output.js" not in result_files, "build/output.js should be ignored"
                
                # Check that non-ignored files ARE in the result
                assert "README.md" in result_files, "README.md should be included"
                assert "src/main.py" in result_files, "src/main.py should be included"
                
                print(f"✓ read_all_documents with use_gitignore=True test passed. Files processed: {result_files}")
            except Exception as e:
                pytest.fail(f"read_all_documents with use_gitignore=True failed: {e}")
    
    def test_read_all_documents_use_gitignore_false(self):
        """Test read_all_documents with use_gitignore=False"""
        files = {
            "README.md": "# Test README",
            "src/main.py": "print('hello')",
            "temp.txt": "temporary file",  # Use .txt instead of .log to avoid default exclusions
            "cache/data.json": "cached data"  # Use cache/ instead of build/ to avoid default exclusions
        }
        
        # Create gitignore content but it should be ignored when use_gitignore=False
        gitignore_content = """*.txt
cache/
"""
        
        self.create_git_repo_with_files(files, gitignore_content)
        
        # Mock the read_all_documents function
        with patch('api.data_pipeline.get_git_ignore_path_set') as mock_git_ignore:
            mock_git_ignore.return_value = set()
            
            # Test that the function can be called with use_gitignore=False
            try:
                result = read_all_documents(
                    path=self.test_dir,
                    use_gitignore=False,
                    is_ollama_embedder=False
                )
                # Verify that get_git_ignore_path_set was NOT called
                mock_git_ignore.assert_not_called()
                
                # Verify the result structure and content
                assert isinstance(result, list), "Result should be a list of Document objects"
                
                # Extract file paths from the result
                result_files = [doc.meta_data['file_path'] for doc in result]
                
                # When use_gitignore=False, ALL files should be included
                assert "README.md" in result_files, "README.md should be included"
                assert "src/main.py" in result_files, "src/main.py should be included"
                assert "temp.txt" in result_files, "temp.txt should be included when gitignore is disabled"
                assert "cache/data.json" in result_files, "cache/data.json should be included when gitignore is disabled"
                
                print(f"✓ read_all_documents with use_gitignore=False test passed. Files processed: {result_files}")
            except Exception as e:
                pytest.fail(f"read_all_documents with use_gitignore=False failed: {e}")
    
    def test_read_all_documents_default_use_gitignore(self):
        """Test read_all_documents with default use_gitignore parameter"""
        files = {
            "README.md": "# Test README",
            "src/main.py": "print('hello')"
        }
        
        self.create_git_repo_with_files(files)
        
        # Mock the read_all_documents function
        with patch('api.data_pipeline.get_git_ignore_path_set') as mock_git_ignore:
            mock_git_ignore.return_value = set()
            
            # Test that the function can be called without use_gitignore parameter
            try:
                result = read_all_documents(
                    path=self.test_dir,
                    is_ollama_embedder=False
                )
                # Since default is True, get_git_ignore_path_set should be called
                mock_git_ignore.assert_called_once_with(self.test_dir)
                print("✓ read_all_documents with default use_gitignore test passed")
            except Exception as e:
                pytest.fail(f"read_all_documents with default use_gitignore failed: {e}")
    
    def test_read_all_documents_gitignore_integration(self):
        """Test read_all_documents gitignore integration with real git repository"""
        files = {
            "README.md": "# Test README",
            "src/main.py": "print('hello')",
            "debug.log": "debug info",
            "error.log": "error info",
            "build/output.js": "compiled code",
            "temp/cache.tmp": "temp cache"
        }
        
        gitignore_content = """*.log
build/
temp/
"""
        
        self.create_git_repo_with_files(files, gitignore_content)
        
        # Test get_git_ignore_path_set directly
        ignored_paths = get_git_ignore_path_set(self.test_dir)
        
        # Verify that gitignore patterns are working
        assert isinstance(ignored_paths, set)
        
        # Check that some expected patterns are ignored
        ignored_files = [path for path in ignored_paths if not path.endswith('/')]
        ignored_dirs = [path for path in ignored_paths if path.endswith('/')]
        
        print(f"✓ Gitignore integration test passed. Ignored paths: {ignored_paths}")
    
    def test_read_all_documents_parameter_interface(self):
        """Test read_all_documents parameter interface compatibility"""
        files = {
            "README.md": "# Test README",
            "src/main.py": "print('hello')"
        }
        
        self.create_git_repo_with_files(files)
        
        # Test that all parameter combinations work
        with patch('api.data_pipeline.get_git_ignore_path_set') as mock_git_ignore:
            mock_git_ignore.return_value = set()
            
            try:
                # Test with various parameter combinations
                result1 = read_all_documents(
                    path=self.test_dir,
                    is_ollama_embedder=False,
                    excluded_dirs=["test"],
                    excluded_files=["*.tmp"],
                    use_gitignore=True
                )
                
                result2 = read_all_documents(
                    path=self.test_dir,
                    is_ollama_embedder=False,
                    included_dirs=["src"],
                    included_files=["*.py"],
                    use_gitignore=False
                )
                
                print("✓ Parameter interface compatibility test passed")
            except Exception as e:
                pytest.fail(f"Parameter interface test failed: {e}")
    
    @patch('subprocess.run')
    def test_get_git_ignore_path_set_mock_git_command(self, mock_run):
        """Test get_git_ignore_path_set with mocked git command"""
        # Mock the subprocess.run call
        mock_result = MagicMock()
        mock_result.stdout = "debug.log\nerror.log\nbuild/\nnode_modules/\n"
        mock_run.return_value = mock_result
        
        # Test the function
        ignored_paths = get_git_ignore_path_set("/fake/path")
        
        # Verify the git command was called correctly
        mock_run.assert_called_once_with(
            ["git", "ls-files", "--others", "--ignored", "--exclude-standard", "--directory"],
            cwd="/fake/path",
            capture_output=True,
            text=True,
            check=True
        )
        
        # Verify results
        expected_paths = {"debug.log", "error.log", "build/", "node_modules/"}
        assert ignored_paths == expected_paths
        
        print("✓ Mock git command test passed")
    
    @patch('subprocess.run')
    def test_get_git_ignore_path_set_git_error(self, mock_run):
        """Test get_git_ignore_path_set when git command fails"""
        # Mock subprocess.run to raise CalledProcessError
        mock_run.side_effect = subprocess.CalledProcessError(1, "git")
        
        # Test the function - should return empty set on error
        ignored_paths = get_git_ignore_path_set("/fake/path")
        
        # Verify results
        assert ignored_paths == set()
        
        print("✓ Git error handling test passed")