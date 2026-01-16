"""Wiki page generation for DeepWiki Single Provider."""

import logging
from typing import List, Dict
from pathlib import Path
import fnmatch

logger = logging.getLogger(__name__)


class PageGenerator:
    """Generate wiki pages using LLM with RAG context.

    KEY CONSTRAINTS:
    - Generate ONE page at a time
    - Respect token budget per page
    - Use retrieval context + matched files
    - Fail gracefully on per-page errors
    """

    def __init__(
        self,
        llm_client,
        embedder_client,
        max_context_tokens: int = 6000,
    ):
        """Initialize page generator.

        Args:
            llm_client: GPTOSSClient instance
            embedder_client: BGEM3Client instance
            max_context_tokens: Max tokens for context (approx)
        """
        self.llm = llm_client
        self.embedder = embedder_client
        self.max_context_tokens = max_context_tokens
        self._chunk_embeddings = None
        self._chunks = None

    def prepare_embeddings(self, chunks: List[Dict[str, any]]):
        """Pre-compute embeddings for all chunks.

        Args:
            chunks: List of chunks from chunker
        """
        logger.info(f"Computing embeddings for {len(chunks)} chunks")

        texts = [chunk['text'] for chunk in chunks]
        embeddings = self.embedder.embed(texts)

        self._chunks = chunks
        self._chunk_embeddings = embeddings

        logger.info("Embeddings prepared")

    def generate_page(
        self,
        page_plan: Dict[str, any],
        files: List[Dict[str, str]],
    ) -> str:
        """Generate a single wiki page.

        Args:
            page_plan: Page plan from planner {page, files, description}
            files: All repository files

        Returns:
            Generated markdown content
        """
        page_name = page_plan['page']
        logger.info(f"Generating page: {page_name}")

        try:
            # Match files based on plan
            matched_files = self._match_files(page_plan['files'], files)

            if not matched_files:
                logger.warning(f"No files matched for {page_name}")
                return self._generate_empty_page(page_plan)

            # Get relevant context via retrieval
            context = self._build_context(
                page_plan=page_plan,
                matched_files=matched_files,
            )

            # Generate page content
            content = self._generate_content(
                page_plan=page_plan,
                context=context,
            )

            logger.info(f"Generated {page_name} ({len(content)} chars)")
            return content

        except Exception as e:
            logger.error(f"Failed to generate {page_name}: {e}")
            return self._generate_error_page(page_plan, str(e))

    def _match_files(
        self,
        patterns: List[str],
        files: List[Dict[str, str]],
    ) -> List[Dict[str, str]]:
        """Match files based on glob patterns.

        Args:
            patterns: List of glob patterns
            files: All repository files

        Returns:
            Matched files
        """
        matched = []

        for file_data in files:
            path = file_data['path']
            for pattern in patterns:
                if fnmatch.fnmatch(path, pattern):
                    matched.append(file_data)
                    break

        logger.debug(f"Matched {len(matched)} files from {len(patterns)} patterns")
        return matched

    def _build_context(
        self,
        page_plan: Dict[str, any],
        matched_files: List[Dict[str, str]],
    ) -> str:
        """Build context for page generation using RAG.

        Args:
            page_plan: Page plan
            matched_files: Files matched for this page

        Returns:
            Context string (truncated to budget)
        """
        # Use page description as query for retrieval
        query = page_plan['description']

        # Retrieve relevant chunks
        if self._chunk_embeddings:
            relevant_chunks = self._retrieve_chunks(query, top_k=10)
        else:
            relevant_chunks = []

        # Build context from matched files + retrieved chunks
        context_parts = []

        # Add file summaries
        context_parts.append("=== Relevant Files ===\n")
        for file_data in matched_files[:10]:  # Limit to 10 files
            path = file_data['path']
            content = file_data['content'][:2000]  # Truncate long files
            context_parts.append(f"\n--- {path} ---\n{content}\n")

        # Add retrieved chunks
        if relevant_chunks:
            context_parts.append("\n=== Retrieved Context ===\n")
            for chunk in relevant_chunks:
                context_parts.append(f"\n[{chunk['source']}]\n{chunk['text'][:1000]}\n")

        full_context = ''.join(context_parts)

        # Truncate to token budget (rough approximation: 4 chars = 1 token)
        max_chars = self.max_context_tokens * 4
        if len(full_context) > max_chars:
            full_context = full_context[:max_chars] + "\n\n... (truncated)"

        return full_context

    def _retrieve_chunks(self, query: str, top_k: int = 10) -> List[Dict[str, any]]:
        """Retrieve most relevant chunks for query.

        Args:
            query: Query text
            top_k: Number of chunks to retrieve

        Returns:
            List of relevant chunks
        """
        if not self._chunk_embeddings or not self._chunks:
            return []

        # Embed query
        query_embedding = self.embedder.embed([query])[0]

        # Compute cosine similarities
        import numpy as np
        query_vec = np.array(query_embedding)
        chunk_vecs = np.array(self._chunk_embeddings)

        # Normalize vectors
        query_norm = query_vec / (np.linalg.norm(query_vec) + 1e-10)
        chunk_norms = chunk_vecs / (np.linalg.norm(chunk_vecs, axis=1, keepdims=True) + 1e-10)

        # Compute similarities
        similarities = chunk_norms @ query_norm

        # Get top-k indices
        top_indices = np.argsort(similarities)[-top_k:][::-1]

        # Return top chunks
        return [self._chunks[i] for i in top_indices]

    def _generate_content(
        self,
        page_plan: Dict[str, any],
        context: str,
    ) -> str:
        """Generate markdown content using LLM.

        Args:
            page_plan: Page plan
            context: Context string

        Returns:
            Markdown content
        """
        system_prompt = """You are a technical documentation writer for GitHub wikis.

Your task is to write a clear, comprehensive wiki page based on code context.

Guidelines:
- Write in markdown format
- Include code examples where relevant
- Use headers (##, ###) to organize sections
- Add inline code with backticks
- Create code blocks with ```language
- Be concise but thorough
- Focus on what the code does, not how to read the source

DO NOT:
- Make assumptions about missing information
- Write speculative content
- Include placeholder text like "TODO"
"""

        user_prompt = f"""Write a wiki page: {page_plan['page']}

Description: {page_plan['description']}

Context from repository:
{context}

Generate the complete markdown content for this page."""

        response = self.llm.chat_with_system(
            system=system_prompt,
            user=user_prompt,
            temperature=0.5,
            max_tokens=4000,
        )

        return response

    def _generate_empty_page(self, page_plan: Dict[str, any]) -> str:
        """Generate placeholder for pages with no matched files.

        Args:
            page_plan: Page plan

        Returns:
            Placeholder markdown
        """
        return f"""# {page_plan['page']}

{page_plan['description']}

*No matching files found for this page.*
"""

    def _generate_error_page(self, page_plan: Dict[str, any], error: str) -> str:
        """Generate error page on generation failure.

        Args:
            page_plan: Page plan
            error: Error message

        Returns:
            Error markdown
        """
        return f"""# {page_plan['page']}

{page_plan['description']}

*Error generating this page: {error}*
"""
