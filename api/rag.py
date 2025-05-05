from typing import Any, List, Tuple, Dict
from uuid import uuid4
import logging
import re
import adalflow as adal
from dataclasses import dataclass, field

# Create our own implementation of the conversation classes
@dataclass
class UserQuery:
    query_str: str

@dataclass
class AssistantResponse:
    response_str: str

@dataclass
class DialogTurn:
    id: str
    user_query: UserQuery
    assistant_response: AssistantResponse

class CustomConversation:
    """Custom implementation of Conversation to fix the list assignment index out of range error"""

    def __init__(self):
        self.dialog_turns = []

    def append_dialog_turn(self, dialog_turn):
        """Safely append a dialog turn to the conversation"""
        if not hasattr(self, 'dialog_turns'):
            self.dialog_turns = []
        self.dialog_turns.append(dialog_turn)

# Import other adalflow components
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
        # Use our custom implementation instead of the original Conversation class
        self.current_conversation = CustomConversation()

    def call(self) -> Dict:
        """Return the conversation history as a dictionary."""
        all_dialog_turns = {}
        try:
            # Check if dialog_turns exists and is a list
            if hasattr(self.current_conversation, 'dialog_turns'):
                if self.current_conversation.dialog_turns:
                    logger.info(f"Memory content: {len(self.current_conversation.dialog_turns)} turns")
                    for i, turn in enumerate(self.current_conversation.dialog_turns):
                        if hasattr(turn, 'id') and turn.id is not None:
                            all_dialog_turns[turn.id] = turn
                            logger.info(f"Added turn {i+1} with ID {turn.id} to memory")
                        else:
                            logger.warning(f"Skipping invalid turn object in memory: {turn}")
                else:
                    logger.info("Dialog turns list exists but is empty")
            else:
                logger.info("No dialog_turns attribute in current_conversation")
                # Try to initialize it
                self.current_conversation.dialog_turns = []
        except Exception as e:
            logger.error(f"Error accessing dialog turns: {str(e)}")
            # Try to recover
            try:
                self.current_conversation = CustomConversation()
                logger.info("Recovered by creating new conversation")
            except Exception as e2:
                logger.error(f"Failed to recover: {str(e2)}")

        logger.info(f"Returning {len(all_dialog_turns)} dialog turns from memory")
        return all_dialog_turns

    def add_dialog_turn(self, user_query: str, assistant_response: str) -> bool:
        """
        Add a dialog turn to the conversation history.

        Args:
            user_query: The user's query
            assistant_response: The assistant's response

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Create a new dialog turn using our custom implementation
            dialog_turn = DialogTurn(
                id=str(uuid4()),
                user_query=UserQuery(query_str=user_query),
                assistant_response=AssistantResponse(response_str=assistant_response),
            )

            # Make sure the current_conversation has the append_dialog_turn method
            if not hasattr(self.current_conversation, 'append_dialog_turn'):
                logger.warning("current_conversation does not have append_dialog_turn method, creating new one")
                # Initialize a new conversation if needed
                self.current_conversation = CustomConversation()

            # Ensure dialog_turns exists
            if not hasattr(self.current_conversation, 'dialog_turns'):
                logger.warning("dialog_turns not found, initializing empty list")
                self.current_conversation.dialog_turns = []

            # Safely append the dialog turn
            self.current_conversation.dialog_turns.append(dialog_turn)
            logger.info(f"Successfully added dialog turn, now have {len(self.current_conversation.dialog_turns)} turns")
            return True

        except Exception as e:
            logger.error(f"Error adding dialog turn: {str(e)}")
            # Try to recover by creating a new conversation
            try:
                self.current_conversation = CustomConversation()
                dialog_turn = DialogTurn(
                    id=str(uuid4()),
                    user_query=UserQuery(query_str=user_query),
                    assistant_response=AssistantResponse(response_str=assistant_response),
                )
                self.current_conversation.dialog_turns.append(dialog_turn)
                logger.info("Recovered from error by creating new conversation")
                return True
            except Exception as e2:
                logger.error(f"Failed to recover from error: {str(e2)}")
                return False

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

    def __init__(self, use_s3: bool = False, local_ollama: bool = False):  # noqa: F841 - use_s3 is kept for compatibility
        """
        Initialize the RAG component.

        Args:
            use_s3: Whether to use S3 for database storage (default: False)
            local_ollama: Whether to use local Ollama for embedding (default: False)
        """
        super().__init__()

        self.local_ollama = local_ollama

        # Initialize components
        self.memory = Memory()

        if self.local_ollama:
            embedder_config = configs["embedder_ollama"]
            generator_config = configs["generator_ollama"]
        else:
            embedder_config = configs["embedder"]
            generator_config = configs["generator"]

        # --- Initialize Embedder ---
        self.embedder = adal.Embedder(
            model_client=embedder_config["model_client"](),
            model_kwargs=embedder_config["model_kwargs"],
        )

        # Patch: ensure query embedding is always single string for Ollama
        def single_string_embedder(query):
            # Accepts either a string or a list, always returns embedding for a single string
            if isinstance(query, list):
                if len(query) != 1:
                    raise ValueError("Ollama embedder only supports a single string")
                query = query[0]
            return self.embedder(input=query)
        self.query_embedder = single_string_embedder
        
        self.initialize_db_manager()

        # Set up the output parser
        data_parser = adal.DataClassParser(data_class=RAGAnswer, return_data_class=True)

        # Format instructions to ensure proper output structure
        format_instructions = data_parser.get_output_format_str() + """

IMPORTANT FORMATTING RULES:
1. DO NOT include your thinking or reasoning process in the output
2. Provide only the final, polished answer
3. DO NOT include ```markdown fences at the beginning or end of your answer
4. DO NOT wrap your response in any kind of fences
5. Start your response directly with the content
6. The content will already be rendered as markdown
7. Do not use backslashes before special characters like [ ] { } in your answer
8. When listing tags or similar items, write them as plain text without escape characters
9. For pipe characters (|) in text, write them directly without escaping them"""

        # Set up the main generator
        self.generator = adal.Generator(
            template=RAG_TEMPLATE,
            prompt_kwargs={
                "output_format_str": format_instructions,
                "conversation_history": self.memory(),
                "system_prompt": system_prompt,
                "contexts": None,
            },
            model_client=generator_config["model_client"](),  # Use selected generator config
            model_kwargs=generator_config["model_kwargs"],    # Use selected generator config
            output_processors=data_parser,
        )


    def initialize_db_manager(self):
        """Initialize the database manager with local storage"""
        self.db_manager = DatabaseManager()
        self.transformed_docs = []

    def prepare_retriever(self, repo_url_or_path: str, access_token: str = None, local_ollama: bool = False):
        """
        Prepare the retriever for a repository.
        Will load database from local storage if available.

        Args:
            repo_url_or_path: URL or local path to the repository
            access_token: Optional access token for private repositories
            local_ollama: Optional flag to use local Ollama for embedding
        """
        self.initialize_db_manager()
        self.repo_url_or_path = repo_url_or_path
        self.transformed_docs = self.db_manager.prepare_database(repo_url_or_path, access_token, local_ollama=local_ollama)
        logger.info(f"Loaded {len(self.transformed_docs)} documents for retrieval")

        retreive_embedder = self.query_embedder if local_ollama else self.embedder
        self.retriever = FAISSRetriever(
            **configs["retriever"],
            embedder=retreive_embedder,
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
