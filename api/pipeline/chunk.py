"""Text chunking for DeepWiki Single Provider."""

import logging
from typing import List, Dict

logger = logging.getLogger(__name__)


class TextChunker:
    """Simple text chunker for code documentation.

    No complex splitting strategies - just split by tokens with overlap.
    """

    def __init__(
        self,
        chunk_size: int = 500,
        overlap: int = 100,
    ):
        """Initialize chunker.

        Args:
            chunk_size: Target chunk size in words (approximation)
            overlap: Overlap between chunks in words
        """
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_files(self, files: List[Dict[str, str]]) -> List[Dict[str, any]]:
        """Chunk files into smaller segments.

        Args:
            files: List of {path, content} dictionaries

        Returns:
            List of chunks with metadata
        """
        all_chunks = []

        for file_data in files:
            path = file_data['path']
            content = file_data['content']

            # Skip empty files
            if not content.strip():
                continue

            # Split content into chunks
            chunks = self._split_text(content)

            for i, chunk_text in enumerate(chunks):
                all_chunks.append({
                    'text': chunk_text,
                    'file': path,
                    'chunk_id': i,
                    'source': f"{path}#chunk{i}",
                })

        logger.info(f"Created {len(all_chunks)} chunks from {len(files)} files")
        return all_chunks

    def _split_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks.

        Args:
            text: Text to split

        Returns:
            List of chunk strings
        """
        # Simple word-based splitting (approximation of token splitting)
        words = text.split()

        if len(words) <= self.chunk_size:
            return [text]

        chunks = []
        start = 0

        while start < len(words):
            end = start + self.chunk_size
            chunk_words = words[start:end]
            chunks.append(' '.join(chunk_words))

            # Move forward with overlap
            start += self.chunk_size - self.overlap

        return chunks
