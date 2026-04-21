"""
Wiki Generation Exceptions

Custom exceptions for wiki page generation functionality.
All exceptions inherit from WikiGenerationError for unified error handling.
"""

from typing import Dict, Any, Optional


class WikiGenerationError(Exception):
    """Base exception for wiki generation"""
    pass


class ValidationError(WikiGenerationError):
    """Input validation failure"""
    pass


class RAGIndexError(WikiGenerationError):
    """RAG index construction failure"""
    pass


class PageGenerationError(WikiGenerationError):
    """Page generation failure"""
    
    def __init__(self, message: str, failed_pages: Optional[Dict] = None):
        super().__init__(message)
        self.failed_pages = failed_pages or {}

