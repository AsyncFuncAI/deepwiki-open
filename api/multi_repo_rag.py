from typing import Any, List, Tuple, Dict, Optional
import logging
import adalflow as adal
from dataclasses import dataclass, field
from uuid import uuid4
import re

from api.rag import RAG, RAGAnswer, Memory, system_prompt
from api.data_pipeline import DatabaseManager
from adalflow.components.retriever.faiss_retriever import FAISSRetriever
from api.config import configs

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class RepoInfo:
    """Information about a repository."""
    repo_url: str
    access_token: Optional[str] = None
    description: Optional[str] = None
    
    def __str__(self):
        return f"Repository: {self.repo_url}"

class MultiRepoRAG(adal.Component):
    """RAG implementation that supports multiple repositories.
    
    This class extends the functionality of the RAG class to support
    querying across multiple repositories.
    """

    def __init__(self, local_ollama: bool = False):
        """
        Initialize the MultiRepoRAG component.

        Args:
            local_ollama: Whether to use local Ollama for embedding (default: False)
        """
        super().__init__()

        self.local_ollama = local_ollama
        self.repos = []  # List of RepoInfo objects
        self.rag_instances = {}  # Map of repo_url to RAG instance
        self.memory = Memory()  # Shared memory for all repositories
        
        # Initialize embedder configuration based on local_ollama flag
        if self.local_ollama:
            embedder_config = configs["embedder_ollama"]
            generator_config = configs["generator_ollama"]
        else:
            embedder_config = configs["embedder"]
            generator_config = configs["generator"]

        # Initialize embedder
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

        # Enhanced system prompt for multi-repository context
        multi_repo_system_prompt = system_prompt + """

MULTI-REPOSITORY CONTEXT:
- You are analyzing multiple repositories that are part of a larger system
- Each piece of context will indicate which repository it comes from
- When answering, consider how these repositories interact with each other
- Highlight connections between repositories when relevant
- Explain how data flows between different components across repositories
- Identify shared interfaces, APIs, or dependencies between repositories
"""

        # Set up the main generator
        self.generator = adal.Generator(
            template="""<START_OF_SYS_PROMPT>
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
Repository: {{context.meta_data.get('repository', 'unknown')}}
File Path: {{context.meta_data.get('file_path', 'unknown')}}
Content: {{context.text}}
{% endfor %}
<END_OF_CONTEXT>
{% endif %}
<START_OF_USER_PROMPT>
{{input_str}}
<END_OF_USER_PROMPT>
""",
            prompt_kwargs={
                "output_format_str": format_instructions,
                "conversation_history": self.memory(),
                "system_prompt": multi_repo_system_prompt,
                "contexts": None,
            },
            model_client=generator_config["model_client"](),
            model_kwargs=generator_config["model_kwargs"],
            output_processors=data_parser,
        )
        
        # Combined documents from all repositories
        self.all_transformed_docs = []
        # Combined retriever for all repositories
        self.combined_retriever = None

    def add_repository(self, repo_url: str, access_token: str = None, description: str = None) -> bool:
        """
        Add a repository to the multi-repository RAG.
        
        Args:
            repo_url: URL or local path to the repository
            access_token: Optional access token for private repositories
            description: Optional description of the repository's role in the system
            
        Returns:
            bool: True if the repository was added successfully, False otherwise
        """
        try:
            # Check if repository is already added
            if repo_url in [repo.repo_url for repo in self.repos]:
                logger.info(f"Repository {repo_url} is already added")
                return True
                
            # Create a new RAG instance for this repository
            rag_instance = RAG(local_ollama=self.local_ollama)
            rag_instance.prepare_retriever(repo_url, access_token, self.local_ollama)
            
            # Add repository info
            repo_info = RepoInfo(repo_url=repo_url, access_token=access_token, description=description)
            self.repos.append(repo_info)
            self.rag_instances[repo_url] = rag_instance
            
            # Add repository metadata to transformed documents
            for doc in rag_instance.transformed_docs:
                doc.meta_data['repository'] = repo_url
                self.all_transformed_docs.append(doc)
                
            logger.info(f"Added repository {repo_url} with {len(rag_instance.transformed_docs)} documents")
            
            # Rebuild the combined retriever
            self._build_combined_retriever()
            
            return True
        except Exception as e:
            logger.error(f"Error adding repository {repo_url}: {str(e)}")
            return False
            
    def _build_combined_retriever(self):
        """Build a combined retriever for all repositories."""
        if not self.all_transformed_docs:
            logger.warning("No documents available to build combined retriever")
            return
            
        logger.info(f"Building combined retriever with {len(self.all_transformed_docs)} documents")
        
        # Use the appropriate embedder based on local_ollama flag
        retrieve_embedder = self.query_embedder if self.local_ollama else self.embedder
        
        # Create a new FAISS retriever with all documents
        self.combined_retriever = FAISSRetriever(
            **configs["retriever"],
            embedder=retrieve_embedder,
            documents=self.all_transformed_docs,
            document_map_func=lambda doc: doc.vector,
        )
        
        logger.info("Combined retriever built successfully")

    def call(self, query: str, language: str = "en") -> Tuple[Any, List]:
        """
        Process a query using RAG across all repositories.
        
        Args:
            query: The user's query
            language: Language code for response (e.g., 'en', 'ja', 'zh', 'es', 'kr', 'vi')
            
        Returns:
            Tuple of (RAGAnswer, retrieved_documents)
        """
        try:
            if not self.combined_retriever:
                logger.error("No combined retriever available. Add repositories first.")
                error_response = RAGAnswer(
                    rationale="No repositories added.",
                    answer="Please add at least one repository before querying."
                )
                return error_response, []
                
            # Retrieve documents from all repositories
            retrieved_documents = self.combined_retriever(query)
            
            # Fill in the documents
            retrieved_documents[0].documents = [
                self.all_transformed_docs[doc_index]
                for doc_index in retrieved_documents[0].doc_indices
            ]
            
            # Get language name for the prompt
            language_name = {
                "en": "English",
                "ja": "Japanese (日本語)",
                "zh": "Mandarin Chinese (中文)",
                "es": "Spanish (Español)",
                "kr": "Korean (한국어)",
                "vi": "Vietnamese (Tiếng Việt)"
            }.get(language, "English")
            
            # Prepare generation parameters
            prompt_kwargs = {
                "input_str": f"[RESPOND IN {language_name.upper()}] {query}",
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
            logger.error(f"Error in MultiRepoRAG call: {str(e)}")
            
            # Create error response
            error_response = RAGAnswer(
                rationale="Error occurred while processing the query.",
                answer=f"I apologize, but I encountered an error while processing your question. Please try again or rephrase your question."
            )
            return error_response, []
