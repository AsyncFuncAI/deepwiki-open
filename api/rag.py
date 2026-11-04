from typing import Any, List, Tuple, Optional, Dict
from uuid import uuid4
import logging
import re
import adalflow as adal
from adalflow.core.types import (
    Conversation,
    DialogTurn,
    UserQuery,
    AssistantResponse,
)
from adalflow.components.retriever.faiss_retriever import FAISSRetriever
from api.config import configs
from api.data_pipeline import DatabaseManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Maximum token limit for embedding models
MAX_INPUT_TOKENS = 7500  # Safe threshold below 8192 token limit

class Memory(adal.core.component.DataComponent):
    """Simple conversation management with a list of dialog turns."""

    def __init__(self):
        super().__init__()
        self.current_conversation = Conversation()

    def call(self) -> Dict:
        """Return the conversation history as a dictionary."""
        all_dialog_turns = {}
        logger.info(f"Memory content: {self.current_conversation.dialog_turns}")
        for turn in self.current_conversation.dialog_turns:
            if hasattr(turn, 'id') and turn.id is not None:
                all_dialog_turns[turn.id] = turn
            else:
                logger.warning(f"Skipping invalid turn object in memory: {turn}")
        return all_dialog_turns

    def add_dialog_turn(self, user_query: str, assistant_response: str):
        """Add a dialog turn to the conversation history."""
        dialog_turn = DialogTurn(
            id=str(uuid4()),
            user_query=UserQuery(query_str=user_query),
            assistant_response=AssistantResponse(response_str=assistant_response),
        )
        self.current_conversation.append_dialog_turn(dialog_turn)

system_prompt = r"""
You are a code assistant which answers user questions on a Github Repo.
You will receive user query, relevant context, and past conversation history.

LANGUAGE DETECTION AND RESPONSE:
- Detect the language of the user's query
- Respond in the SAME language as the user's query

FORMAT YOUR RESPONSE USING MARKDOWN:
- Use proper markdown syntax for all formatting
- For code blocks, use triple backticks with language specification (```python, ```javascript, etc.)
- Use ## headings for major sections
- Use bullet points or numbered lists where appropriate
- Format tables using markdown table syntax when presenting structured data
- Use **bold** and *italic* for emphasis
- When referencing file paths, use `inline code` formatting

IMPORTANT FORMATTING RULES:
1. DO NOT include ```markdown fences at the beginning or end of your answer
2. Start your response directly with the content
3. The content will already be rendered as markdown, so just provide the raw markdown content

Think step by step and ensure your answer is well-structured and visually organized.
"""

# Template for RAG
RAG_TEMPLATE = r"""<START_OF_SYS_PROMPT>
{{system_prompt}}
{{output_format_str}}
<END_OF_SYS_PROMPT>
{# OrderedDict of DialogTurn #}
{% if conversation_history %}
<START_OF_CONVERSATION_HISTORY>
{% for key, dialog_turn in conversation_history.items() %}
{{key}}.
User: {{dialog_turn.user_query.query_str}}
You: {{dialog_turn.assistant_response.response_str}}
{% endfor %}
<END_OF_CONVERSATION_HISTORY>
{% endif %}
{% if contexts %}
<START_OF_CONTEXT>
{% for context in contexts %}
{{loop.index }}.
File Path: {{context.meta_data.get('file_path', 'unknown')}}
Content: {{context.text}}
{% endfor %}
<END_OF_CONTEXT>
{% endif %}
<START_OF_USER_PROMPT>
{{input_str}}
<END_OF_USER_PROMPT>
"""

from dataclasses import dataclass, field

@dataclass
class RAGAnswer(adal.DataClass):
    rationale: str = field(default="", metadata={"desc": "Chain of thoughts for the answer."})
    answer: str = field(default="", metadata={"desc": "Answer to the user query, formatted in markdown for beautiful rendering with react-markdown. DO NOT include ``` triple backticks fences at the beginning or end of your answer."})

    __output_fields__ = ["rationale", "answer"]

class RAG(adal.Component):
    """RAG with one repo.
    If you want to load a new repos, call prepare_retriever(repo_url_or_path) first."""

    def __init__(self, use_s3: bool = False):
        """
        Initialize the RAG component.

        Args:
            use_s3: Whether to use S3 for database storage (default: False)
        """
        super().__init__()

        # Initialize components
        self.memory = Memory()

        self.embedder = adal.Embedder(
            model_client=configs["embedder"]["model_client"](),
            model_kwargs=configs["embedder"]["model_kwargs"],
        )

        self.initialize_db_manager()

        # Set up the output parser
        data_parser = adal.DataClassParser(data_class=RAGAnswer, return_data_class=True)

        # Format instructions to ensure proper output structure
        format_instructions = data_parser.get_output_format_str() + """

IMPORTANT FORMATTING RULES:
1. DO NOT include ```markdown fences at the beginning or end of your answer
2. DO NOT wrap your entire response in any kind of fences
3. Start your response directly with the content
4. The content will already be rendered as markdown
5. Do not use backslashes before special characters like [ ] { } in your answer
6. When listing tags or similar items, write them as plain text without escape characters
7. For pipe characters (|) in text, write them directly without escaping them"""

        # Set up the main generator
        self.generator = adal.Generator(
            template=RAG_TEMPLATE,
            prompt_kwargs={
                "output_format_str": format_instructions,
                "conversation_history": self.memory(),
                "system_prompt": system_prompt,
                "contexts": None,
            },
            model_client=configs["generator"]["model_client"](),
            model_kwargs=configs["generator"]["model_kwargs"],
            output_processors=data_parser,
        )

        # Maximum concurrent requests
        self.max_concurrent = configs.get("generator", {}).get("max_concurrent", 3)

    def initialize_db_manager(self):
        """Initialize the database manager with local storage"""
        self.db_manager = DatabaseManager()
        self.transformed_docs = []

    def prepare_retriever(self, repo_url_or_path: str, access_token: str = None):
        """
        Prepare the retriever for a repository.
        Will load database from local storage if available.

        Args:
            repo_url_or_path: URL or local path to the repository
            access_token: Optional access token for private repositories
        """
        self.initialize_db_manager()
        self.repo_url_or_path = repo_url_or_path
        self.transformed_docs = self.db_manager.prepare_database(repo_url_or_path, access_token)
        logger.info(f"Loaded {len(self.transformed_docs)} documents for retrieval")
        self.retriever = FAISSRetriever(
            **configs["retriever"],
            embedder=self.embedder,
            documents=self.transformed_docs,
            document_map_func=lambda doc: doc.vector,
        )

    def call(self, query: str) -> Tuple[Any, List]:
        """
        Process a query using RAG.

        Args:
            query: The user's query

        Returns:
            Tuple of (RAGAnswer, retrieved_documents)
        """
        try:
            retrieved_documents = self.retriever(query)

            # Fill in the documents
            retrieved_documents[0].documents = [
                self.transformed_docs[doc_index]
                for doc_index in retrieved_documents[0].doc_indices
            ]

            # Prepare generation parameters
            prompt_kwargs = {
                "input_str": query,
                "contexts": retrieved_documents[0].documents,
                "conversation_history": self.memory(),
            }

            # Generate response
            response = self.generator(prompt_kwargs=prompt_kwargs)

            final_response = response.data

            # Check if final_response is None and create a default response if needed
            if final_response is None:
                logger.warning("Generated response data is None, creating default response")
                final_response = RAGAnswer(
                    rationale="No response data was generated.",
                    answer="I couldn't find a specific answer to your question based on the repository content. Could you please rephrase your question or provide more details?"
                )

            # Post-process answer to remove markdown fences if present
            if hasattr(final_response, 'answer') and isinstance(final_response.answer, str):
                final_response.answer = re.sub(r'^```markdown\s*\n', '', final_response.answer)
                final_response.answer = re.sub(r'^```\w*\s*\n', '', final_response.answer)

            # Add to conversation memory
            self.memory.add_dialog_turn(user_query=query, assistant_response=final_response.answer)

            return final_response, retrieved_documents

        except Exception as e:
            logger.error(f"Error in RAG call: {str(e)}")

            # Create error response
            error_response = RAGAnswer(
                rationale="Error occurred while processing the query.",
                answer=f"I apologize, but I encountered an error while processing your question. Please try again or rephrase your question."
            )
            return error_response, []

    async def batch_call(self, queries: List[str]) -> List[Tuple[Any, List]]:
        """
        Process multiple queries in parallel using RAG.

        Args:
            queries: List of user queries

        Returns:
            List of tuples, each containing (RAGAnswer, retrieved_documents)
        """
        import asyncio
        from concurrent.futures import ThreadPoolExecutor

        logger.info(f"Processing batch of {len(queries)} queries with max concurrency of {self.max_concurrent}")

        # Create a thread pool with limited concurrency
        executor = ThreadPoolExecutor(max_workers=self.max_concurrent)
        loop = asyncio.get_event_loop()

        # Process queries in parallel with limited concurrency
        async def process_query(query):
            return await loop.run_in_executor(executor, self.call, query)

        # Create tasks for all queries
        tasks = [process_query(query) for query in queries]

        # Wait for all tasks to complete
        results = await asyncio.gather(*tasks)

        logger.info(f"Completed batch processing of {len(queries)} queries")
        return results
