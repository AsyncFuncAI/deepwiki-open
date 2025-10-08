#!/usr/bin/env python3
"""
Test script to reproduce and fix Google embedder 'list' object has no attribute 'embedding' error.
"""

import os
import sys
import logging
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Set up environment
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_google_embedder_client():
    """Test the Google embedder client directly."""
    logger.info("Testing Google embedder client...")
    
    try:
        from api.google_embedder_client import GoogleEmbedderClient
        from adalflow.core.types import ModelType
        
        # Initialize the client
        client = GoogleEmbedderClient()
        
        # Test single embedding
        logger.info("Testing single embedding...")
        api_kwargs = client.convert_inputs_to_api_kwargs(
            input="Hello world",
            model_kwargs={"model": "text-embedding-004", "task_type": "SEMANTIC_SIMILARITY"},
            model_type=ModelType.EMBEDDER
        )
        
        response = client.call(api_kwargs, ModelType.EMBEDDER)
        logger.info(f"Single embedding response type: {type(response)}")
        logger.info(f"Single embedding response keys: {list(response.keys()) if isinstance(response, dict) else 'Not a dict'}")
        
        # Parse the response
        parsed = client.parse_embedding_response(response)
        logger.info(f"Parsed response data length: {len(parsed.data) if parsed.data else 0}")
        logger.info(f"Parsed response error: {parsed.error}")
        
        # Test batch embedding
        logger.info("Testing batch embedding...")
        api_kwargs = client.convert_inputs_to_api_kwargs(
            input=["Hello world", "Test embedding"],
            model_kwargs={"model": "text-embedding-004", "task_type": "SEMANTIC_SIMILARITY"},
            model_type=ModelType.EMBEDDER
        )
        
        response = client.call(api_kwargs, ModelType.EMBEDDER)
        logger.info(f"Batch embedding response type: {type(response)}")
        logger.info(f"Batch embedding response keys: {list(response.keys()) if isinstance(response, dict) else 'Not a dict'}")
        
        # Parse the response
        parsed = client.parse_embedding_response(response)
        logger.info(f"Parsed batch response data length: {len(parsed.data) if parsed.data else 0}")
        logger.info(f"Parsed batch response error: {parsed.error}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error testing Google embedder client: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_adalflow_embedder():
    """Test the AdalFlow embedder with Google client."""
    logger.info("Testing AdalFlow embedder with Google client...")
    
    try:
        import adalflow as adal
        from api.google_embedder_client import GoogleEmbedderClient
        
        # Create embedder
        client = GoogleEmbedderClient()
        embedder = adal.Embedder(
            model_client=client,
            model_kwargs={
                "model": "text-embedding-004",
                "task_type": "SEMANTIC_SIMILARITY"
            }
        )
        
        # Test embedding
        logger.info("Testing embedder with single input...")
        result = embedder("Hello world")
        logger.info(f"Embedder result type: {type(result)}")
        logger.info(f"Embedder result: {result}")
        
        if hasattr(result, 'data'):
            logger.info(f"Result data length: {len(result.data) if result.data else 0}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error testing AdalFlow embedder: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_document_processing():
    """Test document processing with Google embedder."""
    logger.info("Testing document processing with Google embedder...")
    
    try:
        from adalflow.core.types import Document
        from adalflow.components.data_process import ToEmbeddings
        from api.tools.embedder import get_embedder
        
        # Create some test documents
        docs = [
            Document(text="This is a test document.", meta_data={"file_path": "test1.txt"}),
            Document(text="Another test document here.", meta_data={"file_path": "test2.txt"})
        ]
        
        # Get the Google embedder
        embedder = get_embedder(embedder_type='google')
        logger.info(f"Embedder type: {type(embedder)}")
        
        # Process documents
        embedder_transformer = ToEmbeddings(embedder=embedder, batch_size=100)
        
        # Transform documents
        logger.info("Transforming documents...")
        transformed_docs = embedder_transformer(docs)
        
        logger.info(f"Transformed docs type: {type(transformed_docs)}")
        logger.info(f"Number of transformed docs: {len(transformed_docs)}")
        
        # Check the structure
        for i, doc in enumerate(transformed_docs):
            logger.info(f"Doc {i} type: {type(doc)}")
            logger.info(f"Doc {i} attributes: {dir(doc)}")
            if hasattr(doc, 'vector'):
                logger.info(f"Doc {i} vector type: {type(doc.vector)}")
                logger.info(f"Doc {i} vector length: {len(doc.vector) if doc.vector else 0}")
            else:
                logger.info(f"Doc {i} has no vector attribute")
        
        return transformed_docs
        
    except Exception as e:
        logger.error(f"Error testing document processing: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test function."""
    logger.info("Starting Google embedder tests...")
    
    # Test 1: Direct client test
    if not test_google_embedder_client():
        logger.error("Google embedder client test failed")
        return False
    
    # Test 2: AdalFlow embedder test
    if not test_adalflow_embedder():
        logger.error("AdalFlow embedder test failed")
        return False
    
    # Test 3: Document processing test
    result = test_document_processing()
    if result is False:
        logger.error("Document processing test failed")
        return False
    
    logger.info("All tests completed successfully!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)