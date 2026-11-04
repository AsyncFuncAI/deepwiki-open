from typing import Sequence, List
from copy import deepcopy
from tqdm import tqdm
import logging
import adalflow as adal
from adalflow.core.types import Document
from adalflow.core.component import DataComponent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class OllamaDocumentProcessor(DataComponent):
    """
    Process documents for Ollama embeddings by processing one document at a time.
    Adalflow Ollama Client does not support batch embedding, so we need to process each document individually.
    """
    def __init__(self, embedder: adal.Embedder) -> None:
        super().__init__()
        self.embedder = embedder

    def __call__(self, documents: Sequence[Document]) -> Sequence[Document]:
        output = deepcopy(documents)
        logger.info(f"Processing {len(output)} documents individually for Ollama embeddings")

        for i, doc in enumerate(tqdm(output, desc="Processing documents for Ollama embeddings")):
            try:
                # Get embedding for a single document
                result = self.embedder(input=doc.text)
                if result.data and len(result.data) > 0:
                    # Assign the embedding to the document
                    output[i].vector = result.data[0].embedding
                else:
                    logger.warning(f"Failed to get embedding for document {i}")
            except Exception as e:
                logger.error(f"Error processing document {i}: {e}")

        return output