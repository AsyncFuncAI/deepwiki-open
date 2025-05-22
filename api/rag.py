import logging
import re
from dataclasses import dataclass
from typing import Any, List, Tuple, Dict
from uuid import uuid4

import adalflow as adal


# Create our own implementation of the conversation classes
@dataclass
class UserQuery:
    """
    Represents a user's query in a conversation.

    Attributes:
        query_str (str): The text of the user's query.
    """
    query_str: str

@dataclass
class AssistantResponse:
    """
    Represents an assistant's response in a conversation.

    Attributes:
        response_str (str): The text of the assistant's response.
    """
    response_str: str

@dataclass
class DialogTurn:
    """
    Represents a single turn in a dialog, consisting of a user query and an assistant response.

    Attributes:
        id (str): A unique identifier for this dialog turn.
        user_query (UserQuery): The user's query part of the turn.
        assistant_response (AssistantResponse): The assistant's response part of the turn.
    """
    id: str
    user_query: UserQuery
    assistant_response: AssistantResponse

class CustomConversation:
    """
    A custom implementation of a conversation manager.

    This class is designed to manage a list of dialog turns and provides a
    safer way to append turns, specifically addressing potential issues like
    'list assignment index out of range' errors by ensuring the dialog_turns
    list is initialized.

    Attributes:
        dialog_turns (List[DialogTurn]): A list to store the sequence of dialog turns.
    """

    def __init__(self):
        """Initializes a new CustomConversation with an empty list of dialog turns."""
        self.dialog_turns: List[DialogTurn] = []

    def append_dialog_turn(self, dialog_turn: DialogTurn):
        """
        Safely appends a new dialog turn to the conversation history.

        This method ensures that the `dialog_turns` attribute exists and is a list
        before attempting to append a new turn.

        Args:
            dialog_turn (DialogTurn): The dialog turn to add to the conversation.
        """
        if not hasattr(self, 'dialog_turns') or self.dialog_turns is None:
            self.dialog_turns = []
        self.dialog_turns.append(dialog_turn)

# Import other adalflow components
from adalflow.components.retriever.faiss_retriever import FAISSRetriever
from api.config import configs
from api.data_pipeline import DatabaseManager

# Configure logging
logger = logging.getLogger(__name__)

# Maximum token limit for embedding models
MAX_INPUT_TOKENS = 7500  # Safe threshold below the typical 8192 token limit for some embedding models.

class Memory(adal.core.component.DataComponent):
    """
    Manages the conversation history using a list of dialog turns.

    This component stores and retrieves the dialog turns that constitute the
    ongoing conversation. It uses a `CustomConversation` object internally
    to handle the storage and appending of turns safely.

    Attributes:
        current_conversation (CustomConversation): An instance of `CustomConversation`
                                                   that holds the dialog turns.
    """

    def __init__(self):
        """Initializes the Memory component with a new CustomConversation."""
        super().__init__()
        # Use our custom implementation instead of the original Conversation class
        self.current_conversation = CustomConversation()

    def call(self) -> Dict[str, DialogTurn]:
        """
        Retrieves the current conversation history.

        Returns:
            Dict[str, DialogTurn]: A dictionary where keys are dialog turn IDs and
                                   values are `DialogTurn` objects. Returns an empty
                                   dictionary if the conversation is empty or if errors
                                   occur during retrieval (errors are logged).
        """
        all_dialog_turns: Dict[str, DialogTurn] = {}
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
        Adds a new dialog turn to the conversation history.

        A `DialogTurn` object is created from the provided user query and assistant
        response, assigned a unique ID, and then appended to the
        `current_conversation`. Includes error handling and recovery attempts.

        Args:
            user_query (str): The text of the user's query.
            assistant_response (str): The text of the assistant's response.

        Returns:
            bool: `True` if the dialog turn was successfully added (or if recovery
                  was successful after an initial error), `False` otherwise.
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

# system_prompt: Defines the core instructions and persona for the RAG model.
# It guides the LLM on its role, how to process input (query, context, history),
# language handling, and crucially, the Markdown formatting rules for its output.
system_prompt = r"""
You are a code assistant which answers user questions on a Github Repo.
You will receive user query, relevant context, and past conversation history.

LANGUAGE DETECTION AND RESPONSE:
- Detect the language of the user's query
- Respond in the SAME language as the user's query
- IMPORTANT:If a specific language is requested in the prompt, prioritize that language over the query language

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

# RAG_TEMPLATE: A Jinja2 template string that structures the input prompt for the RAG's generator LLM.
# It combines the system prompt, conversation history (if any), retrieved context documents (if any),
# and the current user query into a single formatted string. Special tags like <START_OF_CONTEXT>
# are used to delineate different sections of the prompt.
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
    """
    Represents the structured output from the RAG (Retrieval Augmented Generation) system.

    This dataclass defines the expected fields in the LLM's response when processed
    by `adal.DataClassParser`. It includes both the final answer and the reasoning
    behind it.

    Attributes:
        rationale (str): A field intended to capture the chain of thought or reasoning
                         process that led to the answer. Defaults to an empty string.
                         Metadata description: "Chain of thoughts for the answer."
        answer (str): The final answer to the user's query. This answer is expected
                      to be formatted in Markdown for rendering. Crucially, it should
                      NOT include Markdown code fences (```) at the beginning or end.
                      Defaults to an empty string. Metadata description: "Answer to the
                      user query, formatted in markdown for beautiful rendering with
                      react-markdown. DO NOT include ``` triple backticks fences at the
                      beginning or end of your answer."
    """
    rationale: str = field(default="", metadata={"desc": "Chain of thoughts for the answer."})
    answer: str = field(default="", metadata={"desc": "Answer to the user query, formatted in markdown for beautiful rendering with react-markdown. DO NOT include ``` triple backticks fences at the beginning or end of your answer."})

    __output_fields__ = ["rationale", "answer"]

class RAG(adal.Component):
    """
    Implements a Retrieval Augmented Generation (RAG) pipeline for a single repository.

    This component integrates various sub-components like an embedder, retriever,
    memory, and a generator (LLM) to answer queries based on the content of a
    specified code repository. It can load repository data, create embeddings,
    retrieve relevant documents, and generate answers incorporating this context
    and conversation history.

    To use with a new repository, `prepare_retriever(repo_url_or_path)` must be
    called first to process and index the repository's content.
    """

    def __init__(self, provider: str = "google", model: Optional[str] = None, use_s3: bool = False):  # noqa: F841 - use_s3 is kept for compatibility but not actively used.
        """
        Initializes the RAG component and its sub-components.

        Sets up the embedder, memory, database manager, and the LLM generator
        based on the specified provider and model. It also configures a
        DataClassParser for structuring the LLM's output into `RAGAnswer`.

        Args:
            provider (str, optional): The name of the LLM provider to use
                                      (e.g., "google", "openai", "ollama").
                                      Defaults to "google".
            model (Optional[str], optional): The specific model name to use with the
                                             chosen provider. If None, a default model
                                             for the provider might be used (dependent
                                             on `api.config.get_model_config`).
                                             Defaults to None.
            use_s3 (bool, optional): Flag indicating whether to use S3 for database
                                     storage. Currently, this parameter is kept for
                                     compatibility but the implementation primarily
                                     uses local storage via `DatabaseManager`.
                                     Defaults to False.
        """
        super().__init__()

        self.provider = provider
        self.model = model
        self.local_ollama = provider == "ollama"

        # Initialize components
        self.memory = Memory()

        if self.local_ollama:
            embedder_config = configs["embedder_ollama"]
        else:
            embedder_config = configs["embedder"]
        
        # --- Initialize Embedder ---
        self.embedder = adal.Embedder(
            model_client=embedder_config["model_client"](),
            model_kwargs=embedder_config["model_kwargs"],
        )

        # Patch: ensure query embedding is always single string for Ollama
        def single_string_embedder(query: Union[str, List[str]]) -> Any:
            """
            Ensures that the input to the Ollama embedder is a single string.

            Ollama embedders might expect a single string input, while Adalflow's
            embedder interface might sometimes pass a list containing a single string.
            This wrapper handles that discrepancy.

            Args:
                query (Union[str, List[str]]): The input query, which can be a string
                                               or a list containing a single string.

            Returns:
                Any: The embedding result from the underlying embedder.

            Raises:
                ValueError: If the input is a list with more than one string,
                            as Ollama embedders typically handle one string at a time.
            """
            # Accepts either a string or a list, always returns embedding for a single string
            if isinstance(query, list):
                if len(query) != 1:
                    raise ValueError("Ollama embedder only supports a single string for embedding.")
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

        # Get model configuration based on provider and model
        from api.config import get_model_config
        generator_config = get_model_config(self.provider, self.model)

        # Set up the main generator
        self.generator = adal.Generator(
            template=RAG_TEMPLATE,
            prompt_kwargs={
                "output_format_str": format_instructions,
                "conversation_history": self.memory(),
                "system_prompt": system_prompt,
                "contexts": None,
            },
            model_client=generator_config["model_client"](),
            model_kwargs=generator_config["model_kwargs"],
            output_processors=data_parser,
        )


    def initialize_db_manager(self):
        """
        Initializes or re-initializes the database manager and document store.

        This method sets up a new `DatabaseManager` instance for handling
        local storage of processed documents and resets the `transformed_docs`
        list, preparing the RAG component for new data processing or retrieval tasks.
        """
        self.db_manager = DatabaseManager()
        self.transformed_docs: List[Any] = [] # Stores adal.Document objects

    def prepare_retriever(self, repo_url_or_path: str, type: str = "github", access_token: Optional[str] = None,
                      excluded_dirs: Optional[List[str]] = None, excluded_files: Optional[List[str]] = None):
        """
        Prepares the FAISS retriever for a given repository.

        This involves:
        1. Initializing the database manager.
        2. Using the `DatabaseManager` to load or create a database for the
           specified repository. This process includes cloning (if remote),
           parsing files, chunking text, and generating embeddings for documents.
           The processed documents (`adal.Document` objects with vectors) are stored.
        3. Initializing a `FAISSRetriever` with these processed documents and
           the appropriate embedder (handling Ollama's specific needs).

        Args:
            repo_url_or_path (str): The URL (e.g., GitHub URL) or local file system
                                    path to the repository.
            type (str, optional): The type of the repository, typically "github", "gitlab",
                                  or "local". Defaults to "github".
            access_token (Optional[str], optional): An access token for private
                                                    repositories. Defaults to None.
            excluded_dirs (Optional[List[str]], optional): A list of directory names
                                                           to exclude during processing.
                                                           Defaults to None.
            excluded_files (Optional[List[str]], optional): A list of file name patterns
                                                            (glob-style) to exclude.
                                                            Defaults to None.
        """
        self.initialize_db_manager() # Ensures a fresh start for docs
        self.repo_url_or_path = repo_url_or_path
        self.transformed_docs = self.db_manager.prepare_database(
            repo_url_or_path, 
            type, 
            access_token, 
            local_ollama=self.local_ollama,
            excluded_dirs=excluded_dirs,
            excluded_files=excluded_files
        )
        logger.info(f"Loaded {len(self.transformed_docs)} documents for retrieval")

        retreive_embedder = self.query_embedder if self.local_ollama else self.embedder
        self.retriever = FAISSRetriever(
            **configs["retriever"],
            embedder=retreive_embedder,
            documents=self.transformed_docs,
            document_map_func=lambda doc: doc.vector,
        )

    def call(self, query: str, language: str = "en") -> Tuple[RAGAnswer, List[Any]]:
        """
        Processes a user query using the RAG pipeline and generates an answer.

        This is the main method for interacting with the RAG component. It performs
        the following steps:
        1. Retrieves relevant document chunks from the indexed repository content
           based on the input query.
        2. Constructs a prompt for the generator LLM, including the system prompt,
           conversation history (from `Memory`), the retrieved context, and the
           user's query.
        3. Calls the generator LLM to produce an answer.
        4. Parses the LLM's output into a `RAGAnswer` object.
        5. Adds the current query and the generated answer to the conversation memory.

        Args:
            query (str): The user's input query string.
            language (str, optional): The language of the query, used for tailoring
                                      the response or system prompt if necessary.
                                      Defaults to "en". (Currently, `language` param
                                      is not directly used in the generator call in this snippet,
                                      but system_prompt has language detection instructions).

        Returns:
            Tuple[RAGAnswer, List[Any]]: A tuple where the first element is the
                                         `RAGAnswer` object containing the rationale
                                         and the markdown-formatted answer. The second
                                         element is a list of the retrieved documents
                                         (typically `adal.Document` objects) that were
                                         used as context. If an error occurs, a default
                                         error `RAGAnswer` is returned with an empty list
                                         of documents.
        """
        try:
            # Note: The original `retriever(query)` call returns a list containing one Adalflow `Response` object.
            # This `Response` object then has a `documents` attribute after they are filled.
            retriever_output = self.retriever(query) # This should be a list of Adalflow Response objects
            
            # Assuming retriever_output is a list with one Adalflow Response object
            if not retriever_output or not hasattr(retriever_output[0], 'doc_indices'):
                logger.error("Retriever did not return valid doc_indices.")
                raise ValueError("Retriever output is not in the expected format.")

            # Get the Adalflow Response object
            adal_response_obj = retrieved_output[0]

            # Fill in the documents based on doc_indices
            adal_response_obj.documents = [
                self.transformed_docs[doc_index]
                for doc_index in adal_response_obj.doc_indices
            ]
            
            retrieved_documents_for_context = adal_response_obj.documents
            
            # Generate an answer using the RAG pipeline
            # The generator's prompt_kwargs for 'contexts' and 'input_str' will be updated.
            rag_answer_obj: RAGAnswer = self.generator(
                contexts=retrieved_documents_for_context, # Pass the actual document objects
                input_str=query,
                # conversation_history is already set in __init__ from self.memory()
            )

            # Add the current turn to memory
            self.memory.add_dialog_turn(user_query=query, assistant_response=rag_answer_obj.answer)
            
            logger.info(f"RAG call successful. Answer: {rag_answer_obj.answer[:100]}...") # Log snippet of answer
            return rag_answer_obj, retrieved_documents_for_context

        except Exception as e:
            logger.error(f"Error in RAG call: {str(e)}", exc_info=True)

            # Create error response
            error_response = RAGAnswer(
                rationale="Error occurred while processing the query.",
                answer=f"I apologize, but I encountered an error while processing your question. Please try again or rephrase your question. Details: {str(e)}"
            )
            return error_response, []
