from typing import Sequence, List
from copy import deepcopy
from tqdm import tqdm
import logging
import adalflow as adal
from adalflow.core.types import Document
from adalflow.core.component import DataComponent

# Configure logging
# BasicConfig should ideally be called only once at the application entry point.
# If other modules also call it, it might lead to unexpected logging behavior.
# For a library module like this, it's often better to just get the logger
# and let the application configure logging.
# However, following the existing pattern in the codebase for now.
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class OllamaDocumentProcessor(DataComponent):
    """
    Processes documents to generate embeddings using an Ollama embedder.

    This processor iterates through a sequence of documents and generates an
    embedding for each document's text content individually. This is necessary
    because, as noted, the Adalflow Ollama client might not support batch embedding,
    or this class provides a workaround for such limitations.

    Attributes:
        embedder (adal.Embedder): An instance of an Adalflow embedder configured
            to use an Ollama model (or any embedder that processes single text inputs).
    """
    def __init__(self, embedder: adal.Embedder) -> None:
        """
        Initializes the OllamaDocumentProcessor.

        Args:
            embedder (adal.Embedder): The Adalflow embedder instance that will be
                used to generate embeddings for each document. This embedder should
                be pre-configured with the desired Ollama model.
        """
        super().__init__()
        self.embedder = embedder

    def __call__(self, documents: Sequence[Document]) -> Sequence[Document]:
        """
        Generates embeddings for a sequence of documents.

        Each document in the input sequence is processed individually. The text
        content of the document is passed to the configured `embedder`, and the
        resulting embedding vector is assigned to the `vector` attribute of the
        document. The original documents are modified in place (after a deepcopy
        of the input sequence).

        Args:
            documents (Sequence[Document]): A sequence of Adalflow `Document` objects
                to be processed. Each document is expected to have a `text` attribute.

        Returns:
            Sequence[Document]: The same sequence of `Document` objects, but with
                their `vector` attributes populated with the generated embeddings.
                If an error occurs during embedding for a specific document, its
                `vector` attribute may not be set, and a warning/error is logged.
        """
        output = deepcopy(documents) # Work on a copy to avoid modifying the original list structure if it's part of a larger pipeline state
        logger.info(f"Processing {len(output)} documents individually for Ollama embeddings")

        for i, doc in enumerate(tqdm(output, desc="Processing documents for Ollama embeddings")):
            try:
                # Get embedding for a single document's text content
                embedding_result = self.embedder(input=doc.text) # Assuming embedder returns an EmbedderOutput or similar structure

                if embedding_result and embedding_result.data and len(embedding_result.data) > 0:
                    # Assign the embedding vector to the document
                    # Assuming the first element in result.data contains the embedding
                    # and has an 'embedding' attribute.
                    doc.vector = embedding_result.data[0].embedding
                else:
                    logger.warning(f"Failed to get embedding for document {i} (ID: {doc.id if hasattr(doc, 'id') else 'N/A'}). No data in result.")
            except Exception as e:
                logger.error(f"Error processing document {i} (ID: {doc.id if hasattr(doc, 'id') else 'N/A'}): {e}", exc_info=True)
                # Optionally, set doc.vector to None or a specific error indicator if needed downstream
                # doc.vector = None

        return output