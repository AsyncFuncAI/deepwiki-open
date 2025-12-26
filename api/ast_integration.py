"""
Integration layer for AST chunking with existing data pipeline.
This bridges the AST chunker with the current adalflow TextSplitter interface.
"""

from typing import List, Dict, Any, Union
import logging
from pathlib import Path

from adalflow.core.component import Component
from adalflow.core.document import Document

from .ast_chunker import ASTChunker, CodeChunk

logger = logging.getLogger(__name__)


class ASTTextSplitter(Component):
    """
    AST-aware text splitter that integrates with adalflow pipeline.
    Provides both AST chunking for code files and fallback text chunking.
    """
    
    def __init__(self, 
                 split_by: str = "ast",
                 chunk_size: int = 2000,
                 chunk_overlap: int = 100,
                 min_chunk_size: int = 100,
                 overlap_lines: int = 5,
                 preserve_structure: bool = True,
                 fallback_to_text: bool = True):
        """
        Initialize AST text splitter.
        
        Args:
            split_by: Splitting strategy - "ast", "word", "character"
            chunk_size: Maximum tokens per chunk
            chunk_overlap: Token overlap between chunks (for text mode)
            min_chunk_size: Minimum tokens per chunk
            overlap_lines: Lines of overlap for AST chunks
            preserve_structure: Whether to keep code structures together
            fallback_to_text: Fall back to text splitting for non-code files
        """
        super().__init__()
        self.split_by = split_by
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        self.overlap_lines = overlap_lines
        self.preserve_structure = preserve_structure
        self.fallback_to_text = fallback_to_text
        
        # Initialize AST chunker
        self.ast_chunker = ASTChunker(
            max_chunk_size=chunk_size,
            min_chunk_size=min_chunk_size,
            overlap_lines=overlap_lines,
            preserve_structure=preserve_structure
        )
        
        # Initialize text chunker for fallback
        if fallback_to_text:
            from adalflow.core.text_splitter import TextSplitter
            self.text_splitter = TextSplitter(
                split_by="word" if split_by == "ast" else split_by,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap
            )
    
    def call(self, documents: List[Document]) -> List[Document]:
        """
        Split documents using AST-aware chunking.
        
        Args:
            documents: Input documents to split
            
        Returns:
            List of document chunks
        """
        result_docs = []
        
        for doc in documents:
            try:
                if self.split_by == "ast":
                    chunks = self._ast_split_document(doc)
                else:
                    # Use traditional text splitting
                    chunks = self.text_splitter.call([doc])
                
                result_docs.extend(chunks)
                
            except Exception as e:
                logger.error(f"Error splitting document {doc.id}: {e}")
                if self.fallback_to_text and hasattr(self, 'text_splitter'):
                    # Fallback to text splitting
                    chunks = self.text_splitter.call([doc])
                    result_docs.extend(chunks)
                else:
                    # Keep original document if all else fails
                    result_docs.append(doc)
        
        return result_docs
    
    def _ast_split_document(self, document: Document) -> List[Document]:
        """Split a single document using AST chunking."""
        # Extract file path from document metadata
        file_path = document.meta_data.get('file_path', '')
        if not file_path:
            file_path = document.meta_data.get('source', 'unknown')
        
        # Use AST chunker
        code_chunks = self.ast_chunker.chunk_file(file_path, document.text)
        
        # Convert CodeChunk objects to Document objects
        result_docs = []
        for i, chunk in enumerate(code_chunks):
            # Create enhanced metadata
            enhanced_metadata = document.meta_data.copy()
            enhanced_metadata.update({
                'chunk_id': i,
                'chunk_type': chunk.chunk_type,
                'chunk_name': chunk.name,
                'start_line': chunk.start_line,
                'end_line': chunk.end_line,
                'dependencies': chunk.dependencies,
                'file_path': chunk.file_path,
                'original_doc_id': document.id
            })
            
            # Create new document
            chunk_doc = Document(
                text=chunk.content,
                id=f"{document.id}_chunk_{i}",
                meta_data=enhanced_metadata
            )
            
            result_docs.append(chunk_doc)
        
        return result_docs
    
    def get_chunk_metadata(self, chunk_doc: Document) -> Dict[str, Any]:
        """Extract chunk-specific metadata for enhanced retrieval."""
        return {
            'chunk_type': chunk_doc.meta_data.get('chunk_type', 'unknown'),
            'chunk_name': chunk_doc.meta_data.get('chunk_name'),
            'start_line': chunk_doc.meta_data.get('start_line', 0),
            'end_line': chunk_doc.meta_data.get('end_line', 0),
            'dependencies': chunk_doc.meta_data.get('dependencies', []),
            'file_path': chunk_doc.meta_data.get('file_path', ''),
            'language': self._detect_language(chunk_doc.meta_data.get('file_path', ''))
        }
    
    def _detect_language(self, file_path: str) -> str:
        """Detect programming language from file extension."""
        ext = Path(file_path).suffix.lower()
        
        language_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.jsx': 'javascript',
            '.tsx': 'typescript',
            '.java': 'java',
            '.kt': 'kotlin',
            '.cpp': 'cpp',
            '.cc': 'cpp',
            '.cxx': 'cpp',
            '.c': 'c',
            '.h': 'c',
            '.hpp': 'cpp',
            '.rs': 'rust',
            '.go': 'go',
            '.rb': 'ruby',
            '.php': 'php',
            '.cs': 'csharp',
            '.swift': 'swift',
            '.md': 'markdown',
            '.rst': 'restructuredtext',
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.toml': 'toml',
            '.xml': 'xml',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.sass': 'sass'
        }
        
        return language_map.get(ext, 'text')


class EnhancedRAGRetriever:
    """Enhanced retriever that uses AST chunk metadata for better results."""
    
    def __init__(self, base_retriever):
        """Initialize with base retriever (FAISS, etc.)."""
        self.base_retriever = base_retriever
    
    def retrieve(self, query: str, top_k: int = 5, 
                filter_by_type: List[str] = None,
                prefer_functions: bool = False,
                prefer_classes: bool = False) -> List[Document]:
        """
        Enhanced retrieval with AST-aware filtering.
        
        Args:
            query: Search query
            top_k: Number of results to return
            filter_by_type: Filter by chunk types (e.g., ['function', 'class'])
            prefer_functions: Boost function chunks in results
            prefer_classes: Boost class chunks in results
        """
        # Get base results
        base_results = self.base_retriever.retrieve(query, top_k * 2)  # Get more for filtering
        
        # Apply AST-aware filtering and ranking
        filtered_results = []
        
        for doc in base_results:
            chunk_type = doc.meta_data.get('chunk_type', 'unknown')
            
            # Apply type filter
            if filter_by_type and chunk_type not in filter_by_type:
                continue
            
            # Calculate boost score
            boost_score = 1.0
            if prefer_functions and chunk_type == 'function':
                boost_score = 1.5
            elif prefer_classes and chunk_type == 'class':
                boost_score = 1.5
            
            # Add boost to similarity score if available
            if hasattr(doc, 'similarity_score'):
                doc.similarity_score *= boost_score
            
            filtered_results.append(doc)
        
        # Sort by similarity score and return top_k
        if hasattr(filtered_results[0], 'similarity_score'):
            filtered_results.sort(key=lambda x: x.similarity_score, reverse=True)
        
        return filtered_results[:top_k]
    
    def retrieve_related_code(self, query: str, top_k: int = 5) -> Dict[str, List[Document]]:
        """
        Retrieve related code organized by type.
        
        Returns:
            Dictionary with keys: 'functions', 'classes', 'imports', 'modules'
        """
        all_results = self.base_retriever.retrieve(query, top_k * 4)
        
        organized_results = {
            'functions': [],
            'classes': [],
            'imports': [],
            'modules': [],
            'other': []
        }
        
        for doc in all_results:
            chunk_type = doc.meta_data.get('chunk_type', 'other')
            
            if chunk_type == 'function':
                organized_results['functions'].append(doc)
            elif chunk_type == 'class':
                organized_results['classes'].append(doc)
            elif chunk_type == 'import_block':
                organized_results['imports'].append(doc)
            elif chunk_type == 'module':
                organized_results['modules'].append(doc)
            else:
                organized_results['other'].append(doc)
        
        # Limit each category
        for key in organized_results:
            organized_results[key] = organized_results[key][:top_k//4 + 1]
        
        return organized_results


def create_ast_config() -> Dict[str, Any]:
    """Create default AST chunking configuration."""
    return {
        "text_splitter": {
            "split_by": "ast",
            "chunk_size": 2000,
            "chunk_overlap": 100,
            "min_chunk_size": 100,
            "overlap_lines": 5,
            "preserve_structure": True,
            "fallback_to_text": True
        },
        "retrieval": {
            "prefer_functions": True,
            "prefer_classes": True,
            "boost_code_chunks": 1.5
        }
    }