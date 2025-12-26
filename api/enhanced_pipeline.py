"""
Enhanced data pipeline with AST chunking support.
This patch integrates AST chunking into the existing adalflow pipeline.
"""

import os
from typing import List, Dict, Any, Optional
import logging

from adalflow.core.document import Document
from adalflow.core.db import LocalDB
import adalflow as adal

from .ast_integration import ASTTextSplitter, EnhancedRAGRetriever
from .config import get_embedder_config, get_embedder_type
from .data_pipeline import get_embedder, OllamaDocumentProcessor, ToEmbeddings

logger = logging.getLogger(__name__)


def prepare_enhanced_data_pipeline(embedder_type: str = None, 
                                 is_ollama_embedder: bool = None,
                                 use_ast_chunking: bool = True) -> adal.Sequential:
    """
    Prepare enhanced data pipeline with optional AST chunking support.
    
    Args:
        embedder_type: The embedder type ('openai', 'google', 'ollama')
        is_ollama_embedder: DEPRECATED. Use embedder_type instead
        use_ast_chunking: Whether to use AST-based chunking
    
    Returns:
        Sequential pipeline with splitter and embedder
    """
    # Load configuration
    configs = get_embedder_config()
    
    # Handle legacy parameter
    if is_ollama_embedder is not None:
        embedder_type = 'ollama' if is_ollama_embedder else None
    
    # Determine embedder type if not specified
    if embedder_type is None:
        embedder_type = get_embedder_type()

    # Choose splitter based on configuration
    if use_ast_chunking and configs.get("text_splitter", {}).get("split_by") == "ast":
        # Use AST splitter
        splitter_config = configs["text_splitter"]
        splitter = ASTTextSplitter(**splitter_config)
        logger.info("Using AST-based text splitting")
    else:
        # Use traditional text splitter
        from adalflow.core.text_splitter import TextSplitter
        splitter = TextSplitter(**configs["text_splitter"])
        logger.info("Using traditional text splitting")

    # Get embedder configuration and instance
    embedder_config = get_embedder_config()
    embedder = get_embedder(embedder_type=embedder_type)

    # Choose appropriate processor based on embedder type
    if embedder_type == 'ollama':
        # Use Ollama document processor for single-document processing
        embedder_transformer = OllamaDocumentProcessor(embedder=embedder)
    else:
        # Use batch processing for OpenAI and Google embedders
        batch_size = embedder_config.get("batch_size", 500)
        embedder_transformer = ToEmbeddings(
            embedder=embedder, batch_size=batch_size
        )

    # Create sequential pipeline
    data_transformer = adal.Sequential(
        splitter, embedder_transformer
    )
    
    return data_transformer


def transform_documents_and_save_to_enhanced_db(
    documents: List[Document], 
    db_path: str, 
    embedder_type: str = None, 
    is_ollama_embedder: bool = None,
    use_ast_chunking: bool = None
) -> LocalDB:
    """
    Enhanced document transformation with AST chunking support.
    
    Args:
        documents: List of Document objects
        db_path: Path to the local database file
        embedder_type: The embedder type ('openai', 'google', 'ollama')
        is_ollama_embedder: DEPRECATED. Use embedder_type instead
        use_ast_chunking: Whether to use AST chunking (auto-detected if None)
    
    Returns:
        LocalDB instance with processed documents
    """
    # Auto-detect AST chunking preference if not specified
    if use_ast_chunking is None:
        configs = get_embedder_config()
        use_ast_chunking = configs.get("text_splitter", {}).get("split_by") == "ast"
    
    # Get the enhanced data transformer
    data_transformer = prepare_enhanced_data_pipeline(
        embedder_type=embedder_type,
        is_ollama_embedder=is_ollama_embedder,
        use_ast_chunking=use_ast_chunking
    )

    # Save the documents to a local database
    db = LocalDB()
    db.register_transformer(transformer=data_transformer, key="split_and_embed")
    db.load(documents)
    db.transform(key="split_and_embed")
    
    # Ensure directory exists and save
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    db.save_state(filepath=db_path)
    
    # Log chunking statistics
    _log_chunking_stats(db, use_ast_chunking)
    
    return db


def _log_chunking_stats(db: LocalDB, used_ast: bool):
    """Log statistics about the chunking process."""
    try:
        documents = db.get_transformed_data("split_and_embed")
        if not documents:
            return
        
        total_chunks = len(documents)
        
        if used_ast:
            # Analyze AST chunk types
            chunk_types = {}
            languages = {}
            
            for doc in documents:
                chunk_type = doc.meta_data.get('chunk_type', 'unknown')
                language = doc.meta_data.get('language', 'unknown')
                
                chunk_types[chunk_type] = chunk_types.get(chunk_type, 0) + 1
                languages[language] = languages.get(language, 0) + 1
            
            logger.info(f"AST chunking created {total_chunks} chunks")
            logger.info(f"Chunk types: {dict(chunk_types)}")
            logger.info(f"Languages: {dict(languages)}")
            
            # Log function and class statistics
            function_chunks = chunk_types.get('function', 0)
            class_chunks = chunk_types.get('class', 0)
            
            if function_chunks > 0:
                logger.info(f"Found {function_chunks} function chunks")
            if class_chunks > 0:
                logger.info(f"Found {class_chunks} class chunks")
        else:
            logger.info(f"Traditional chunking created {total_chunks} chunks")
            
    except Exception as e:
        logger.error(f"Error logging chunking stats: {e}")


def create_enhanced_retriever(db: LocalDB, 
                            embedder_type: str = None) -> EnhancedRAGRetriever:
    """
    Create an enhanced retriever with AST-aware capabilities.
    
    Args:
        db: LocalDB instance with processed documents
        embedder_type: The embedder type used
    
    Returns:
        EnhancedRAGRetriever instance
    """
    # Get base retriever from database
    base_retriever = db.get_retriever()  # This would need to be implemented in LocalDB
    
    # Create enhanced retriever
    enhanced_retriever = EnhancedRAGRetriever(base_retriever)
    
    return enhanced_retriever


# Configuration utilities
def switch_to_ast_chunking():
    """Switch the system to use AST chunking."""
    import json
    import shutil
    
    # Backup current config
    embedder_config_path = "api/config/embedder.json"
    backup_path = f"{embedder_config_path}.backup"
    
    if os.path.exists(embedder_config_path):
        shutil.copy2(embedder_config_path, backup_path)
        logger.info(f"Backed up current config to {backup_path}")
    
    # Copy AST config
    ast_config_path = "api/config/embedder.ast.json"
    if os.path.exists(ast_config_path):
        shutil.copy2(ast_config_path, embedder_config_path)
        logger.info("Switched to AST chunking configuration")
    else:
        logger.error(f"AST config file not found: {ast_config_path}")


def switch_to_text_chunking():
    """Switch back to traditional text chunking."""
    import json
    
    embedder_config_path = "api/config/embedder.json"
    backup_path = f"{embedder_config_path}.backup"
    
    if os.path.exists(backup_path):
        shutil.copy2(backup_path, embedder_config_path)
        logger.info("Switched back to text chunking configuration")
    else:
        # Create default text config
        default_config = {
            "text_splitter": {
                "split_by": "word",
                "chunk_size": 350,
                "chunk_overlap": 100
            }
        }
        
        with open(embedder_config_path, 'w') as f:
            json.dump(default_config, f, indent=2)
        
        logger.info("Created default text chunking configuration")


def get_chunking_mode() -> str:
    """Get current chunking mode."""
    try:
        configs = get_embedder_config()
        split_by = configs.get("text_splitter", {}).get("split_by", "word")
        return "ast" if split_by == "ast" else "text"
    except Exception:
        return "text"  # Default fallback


# Example usage for testing
def test_ast_chunking():
    """Test function to demonstrate AST chunking capabilities."""
    
    # Sample Python code for testing
    sample_code = '''
import os
import sys
from typing import List, Dict

class DataProcessor:
    """A class for processing data."""
    
    def __init__(self, config: Dict):
        self.config = config
        self.data = []
    
    def load_data(self, file_path: str) -> List[Dict]:
        """Load data from file."""
        with open(file_path, 'r') as f:
            return json.load(f)
    
    def process_data(self, data: List[Dict]) -> List[Dict]:
        """Process the loaded data."""
        processed = []
        for item in data:
            processed_item = self._process_item(item)
            processed.append(processed_item)
        return processed
    
    def _process_item(self, item: Dict) -> Dict:
        """Process a single item."""
        return {**item, 'processed': True}

def main():
    """Main function."""
    processor = DataProcessor({'debug': True})
    data = processor.load_data('data.json')
    result = processor.process_data(data)
    print(f"Processed {len(result)} items")

if __name__ == "__main__":
    main()
'''
    
    # Create test document
    test_doc = Document(
        text=sample_code,
        id="test_python_file",
        meta_data={'file_path': 'test.py'}
    )
    
    # Test AST chunking
    from .ast_integration import ASTTextSplitter
    
    ast_splitter = ASTTextSplitter(
        split_by="ast",
        chunk_size=2000,
        min_chunk_size=100
    )
    
    chunks = ast_splitter.call([test_doc])
    
    print(f"\nAST Chunking Results:")
    print(f"Created {len(chunks)} chunks from test file")
    
    for i, chunk in enumerate(chunks):
        chunk_type = chunk.meta_data.get('chunk_type', 'unknown')
        chunk_name = chunk.meta_data.get('chunk_name', 'unnamed')
        print(f"\nChunk {i+1}: {chunk_type} - {chunk_name}")
        print(f"Lines {chunk.meta_data.get('start_line', 0)}-{chunk.meta_data.get('end_line', 0)}")
        print(f"Content preview: {chunk.text[:100]}...")


if __name__ == "__main__":
    test_ast_chunking()