import logging
import os
from typing import List, Optional, Dict, Any
from urllib.parse import unquote

# Import model clients
from adalflow.components.model_client.ollama_client import OllamaClient
from adalflow.core.types import ModelType
from fastapi import WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel, Field

from api.config import get_model_config, configs
from api.data_pipeline import count_tokens, get_file_content
from api.openai_client import OpenAIClient
from api.openrouter_client import OpenRouterClient
from api.azure_openai_client import AzureOpenAIClient
from api.rag import RAG

# Optional import for Google Generative AI
try:
    import google.generativeai as genai
    GOOGLE_AI_AVAILABLE = True
except ImportError:
    GOOGLE_AI_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
# Unified logging setup
from api.logging_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)

# Get API keys from environment variables
google_api_key = os.environ.get('GOOGLE_API_KEY')
azure_openai_api_key = os.environ.get('AZURE_OPENAI_API_KEY')
azure_openai_endpoint = os.environ.get('AZURE_OPENAI_ENDPOINT') or os.environ.get('AZURE_OPENAI_API_BASE')

# Check if Azure OpenAI is configured
AZURE_OPENAI_AVAILABLE = bool(azure_openai_api_key and azure_openai_endpoint)

# Configure Google Generative AI if available
if GOOGLE_AI_AVAILABLE and google_api_key:
    genai.configure(api_key=google_api_key)
else:
    logger.warning("GOOGLE_API_KEY not found in environment variables")

# Models for the API
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatCompletionRequest(BaseModel):
    """
    Model for requesting a chat completion.
    """
    repo_url: str = Field(..., description="URL of the repository to query")
    messages: List[ChatMessage] = Field(..., description="List of chat messages")
    filePath: Optional[str] = Field(None, description="Optional path to a file in the repository to include in the prompt")
    token: Optional[str] = Field(None, description="Personal access token for private repositories")
    type: Optional[str] = Field("github", description="Type of repository (e.g., 'github', 'gitlab', 'bitbucket')")

    # model parameters
    provider: str = Field("azure", description="Model provider (azure, openai, openrouter, ollama, google)")
    model: Optional[str] = Field(None, description="Model name for the specified provider")

    language: Optional[str] = Field("en", description="Language for content generation (e.g., 'en', 'ja', 'zh', 'es', 'kr', 'vi')")
    excluded_dirs: Optional[str] = Field(None, description="Comma-separated list of directories to exclude from processing")
    excluded_files: Optional[str] = Field(None, description="Comma-separated list of file patterns to exclude from processing")
    included_dirs: Optional[str] = Field(None, description="Comma-separated list of directories to include exclusively")
    included_files: Optional[str] = Field(None, description="Comma-separated list of file patterns to include exclusively")

async def handle_websocket_chat(websocket: WebSocket):
    """
    Handle WebSocket connection for chat completions.
    This replaces the HTTP streaming endpoint with a WebSocket connection.
    """
    await websocket.accept()

    try:
        # Receive and parse the request data
        request_data = await websocket.receive_json()
        request = ChatCompletionRequest(**request_data)

        # Check if request contains very large input
        input_too_large = False
        if request.messages and len(request.messages) > 0:
            last_message = request.messages[-1]
            if hasattr(last_message, 'content') and last_message.content:
                tokens = count_tokens(last_message.content, request.provider == "ollama")
                logger.info(f"Request size: {tokens} tokens")
                if tokens > 8000:
                    logger.warning(f"Request exceeds recommended token limit ({tokens} > 7500)")
                    input_too_large = True

        # Create a new RAG instance for this request
        try:
            # Set a default provider if empty
            provider = request.provider
            if not provider or provider.strip() == "":
                provider = "google"  # Default to google if provider is empty
                logger.info(f"Empty provider detected, defaulting to: {provider}")
            
            request_rag = RAG(provider=provider, model=request.model)

            # Extract custom file filter parameters if provided
            excluded_dirs = None
            excluded_files = None
            included_dirs = None
            included_files = None

            if request.excluded_dirs:
                excluded_dirs = [unquote(dir_path) for dir_path in request.excluded_dirs.split('\n') if dir_path.strip()]
                logger.info(f"Using custom excluded directories: {excluded_dirs}")
            if request.excluded_files:
                excluded_files = [unquote(file_pattern) for file_pattern in request.excluded_files.split('\n') if file_pattern.strip()]
                logger.info(f"Using custom excluded files: {excluded_files}")
            if request.included_dirs:
                included_dirs = [unquote(dir_path) for dir_path in request.included_dirs.split('\n') if dir_path.strip()]
                logger.info(f"Using custom included directories: {included_dirs}")
            if request.included_files:
                included_files = [unquote(file_pattern) for file_pattern in request.included_files.split('\n') if file_pattern.strip()]
                logger.info(f"Using custom included files: {included_files}")

            request_rag.prepare_retriever(request.repo_url, request.type, request.token, excluded_dirs, excluded_files, included_dirs, included_files)
            logger.info(f"Retriever prepared for {request.repo_url}")
        except ValueError as e:
            if "No valid documents with embeddings found" in str(e):
                logger.error(f"No valid embeddings found: {str(e)}")
                await websocket.send_text("Error: No valid document embeddings found. This may be due to embedding size inconsistencies or API errors during document processing. Please try again or check your repository content.")
                await websocket.close()
                return
            else:
                logger.error(f"ValueError preparing retriever: {str(e)}")
                await websocket.send_text(f"Error preparing retriever: {str(e)}")
                await websocket.close()
                return
        except Exception as e:
            logger.error(f"Error preparing retriever: {str(e)}")
            # Check for specific embedding-related errors
            if "All embeddings should be of the same size" in str(e):
                await websocket.send_text("Error: Inconsistent embedding sizes detected. Some documents may have failed to embed properly. Please try again.")
            else:
                await websocket.send_text(f"Error preparing retriever: {str(e)}")
            await websocket.close()
            return

        # Validate request
        if not request.messages or len(request.messages) == 0:
            await websocket.send_text("Error: No messages provided")
            await websocket.close()
            return

        last_message = request.messages[-1]
        if last_message.role != "user":
            await websocket.send_text("Error: Last message must be from the user")
            await websocket.close()
            return

        # Process previous messages to build conversation history
        for i in range(0, len(request.messages) - 1, 2):
            if i + 1 < len(request.messages):
                user_msg = request.messages[i]
                assistant_msg = request.messages[i + 1]

                if user_msg.role == "user" and assistant_msg.role == "assistant":
                    request_rag.memory.add_dialog_turn(
                        user_query=user_msg.content,
                        assistant_response=assistant_msg.content
                    )

        # Check if this is a Deep Research request
        is_deep_research = False
        research_iteration = 1

        # Process messages to detect Deep Research requests
        for msg in request.messages:
            if hasattr(msg, 'content') and msg.content and "[DEEP RESEARCH]" in msg.content:
                is_deep_research = True
                # Only remove the tag from the last message
                if msg == request.messages[-1]:
                    # Remove the Deep Research tag
                    msg.content = msg.content.replace("[DEEP RESEARCH]", "").strip()

        # Count research iterations if this is a Deep Research request
        if is_deep_research:
            research_iteration = sum(1 for msg in request.messages if msg.role == 'assistant') + 1
            logger.info(f"Deep Research request detected - iteration {research_iteration}")

            # Check if this is a continuation request
            if "continue" in last_message.content.lower() and "research" in last_message.content.lower():
                # Find the original topic from the first user message
                original_topic = None
                for msg in request.messages:
                    if msg.role == "user" and "continue" not in msg.content.lower():
                        original_topic = msg.content.replace("[DEEP RESEARCH]", "").strip()
                        logger.info(f"Found original research topic: {original_topic}")
                        break

                if original_topic:
                    # Replace the continuation message with the original topic
                    last_message.content = original_topic
                    logger.info(f"Using original topic for research: {original_topic}")

        # Get the query from the last message
        query = last_message.content

        # Only retrieve documents if input is not too large
        context_text = ""
        retrieved_documents = None

        if not input_too_large:
            try:
                # If filePath exists, modify the query for RAG to focus on the file
                rag_query = query
                if request.filePath:
                    # Use the file path to get relevant context about the file
                    rag_query = f"Contexts related to {request.filePath}"
                    logger.info(f"Modified RAG query to focus on file: {request.filePath}")

                # Try to perform RAG retrieval
                try:
                    # This will use the actual RAG implementation
                    logger.info("About to call request_rag with query")
                    retrieved_documents = request_rag(rag_query, language=request.language)
                    logger.info(f"RAG call successful, result type: {type(retrieved_documents)}")
                    
                    # Debug the retrieved documents structure
                    if isinstance(retrieved_documents, tuple):
                        logger.info(f"Retrieved documents is a tuple of length {len(retrieved_documents)}")
                        for i, item in enumerate(retrieved_documents):
                            logger.info(f"Item {i} type: {type(item).__name__}")
                    elif isinstance(retrieved_documents, list):
                        logger.info(f"Retrieved documents is a list of length {len(retrieved_documents)}")
                        for i, item in enumerate(retrieved_documents):
                            logger.info(f"Item {i} type: {type(item).__name__}")
                    
                    # Check if we have documents
                    if retrieved_documents and hasattr(retrieved_documents[0], 'documents'):
                        # Format context for the prompt in a more structured way
                        documents = retrieved_documents[0].documents
                        logger.info(f"Retrieved {len(documents)} documents")

                        # Group documents by file path
                        docs_by_file = {}
                        for doc in documents:
                            file_path = doc.meta_data.get('file_path', 'unknown')
                            if file_path not in docs_by_file:
                                docs_by_file[file_path] = []
                            docs_by_file[file_path].append(doc)

                        # Format context text with file path grouping
                        context_parts = []
                        for file_path, docs in docs_by_file.items():
                            # Add file header with metadata
                            header = f"## File Path: {file_path}\n\n"
                            # Add document content
                            content = "\n\n".join([doc.text for doc in docs])

                            context_parts.append(f"{header}{content}")

                        # Join all parts with clear separation
                        context_text = "\n\n" + "-" * 10 + "\n\n".join(context_parts)
                    else:
                        logger.warning("No documents retrieved from RAG")
                except Exception as e:
                    logger.error(f"Error in RAG retrieval: {str(e)}")
                    # Continue without RAG if there's an error

            except Exception as e:
                logger.error(f"Error retrieving documents: {str(e)}")
                context_text = ""

        # Get repository information
        repo_url = request.repo_url
        repo_name = repo_url.split("/")[-1] if "/" in repo_url else repo_url

        # Determine repository type
        repo_type = request.type

        # Get language information
        language_code = request.language or configs["lang_config"]["default"]
        supported_langs = configs["lang_config"]["supported_languages"]
        language_name = supported_langs.get(language_code, "English")

        # Create system prompt
        if is_deep_research:
            # Check if this is the first iteration
            is_first_iteration = research_iteration == 1

            # Check if this is the final iteration
            is_final_iteration = research_iteration >= 5

            if is_first_iteration:
                system_prompt = f"""<role>
You are an expert code analyst examining the {repo_type} repository: {repo_url} ({repo_name}).
You are conducting a multi-turn Deep Research process to thoroughly investigate the specific topic in the user's query.
Your goal is to provide detailed, focused information EXCLUSIVELY about this topic.
IMPORTANT:You MUST respond in {language_name} language.
</role>

<guidelines>
- This is the first iteration of a multi-turn research process focused EXCLUSIVELY on the user's query
- Start your response with "## Research Plan"
- Outline your approach to investigating this specific topic
- If the topic is about a specific file or feature (like "Dockerfile"), focus ONLY on that file or feature
- Clearly state the specific topic you're researching to maintain focus throughout all iterations
- Identify the key aspects you'll need to research
- Provide initial findings based on the information available
- End with "## Next Steps" indicating what you'll investigate in the next iteration
- Do NOT provide a final conclusion yet - this is just the beginning of the research
- Do NOT include general repository information unless directly relevant to the query
- Focus EXCLUSIVELY on the specific topic being researched - do not drift to related topics
- Your research MUST directly address the original question
- NEVER respond with just "Continue the research" as an answer - always provide substantive research findings
- Remember that this topic will be maintained across all research iterations
</guidelines>

<style>
- Be concise but thorough
- Use markdown formatting to improve readability
- Cite specific files and code sections when relevant
</style>"""
            elif is_final_iteration:
                system_prompt = f"""<role>
You are an expert code analyst examining the {repo_type} repository: {repo_url} ({repo_name}).
You are in the final iteration of a Deep Research process focused EXCLUSIVELY on the latest user query.
Your goal is to synthesize all previous findings and provide a comprehensive conclusion that directly addresses this specific topic and ONLY this topic.
IMPORTANT:You MUST respond in {language_name} language.
</role>

<guidelines>
- This is the final iteration of the research process
- CAREFULLY review the entire conversation history to understand all previous findings
- Synthesize ALL findings from previous iterations into a comprehensive conclusion
- Start with "## Final Conclusion"
- Your conclusion MUST directly address the original question
- Stay STRICTLY focused on the specific topic - do not drift to related topics
- Include specific code references and implementation details related to the topic
- Highlight the most important discoveries and insights about this specific functionality
- Provide a complete and definitive answer to the original question
- Do NOT include general repository information unless directly relevant to the query
- Focus exclusively on the specific topic being researched
- NEVER respond with "Continue the research" as an answer - always provide a complete conclusion
- If the topic is about a specific file or feature (like "Dockerfile"), focus ONLY on that file or feature
- Ensure your conclusion builds on and references key findings from previous iterations
</guidelines>

<style>
- Be concise but thorough
- Use markdown formatting to improve readability
- Cite specific files and code sections when relevant
- Structure your response with clear headings
- End with actionable insights or recommendations when appropriate
</style>"""
            else:
                system_prompt = f"""<role>
You are an expert code analyst examining the {repo_type} repository: {repo_url} ({repo_name}).
You are currently in iteration {research_iteration} of a Deep Research process focused EXCLUSIVELY on the latest user query.
Your goal is to build upon previous research iterations and go deeper into this specific topic without deviating from it.
IMPORTANT:You MUST respond in {language_name} language.
</role>

<guidelines>
- CAREFULLY review the conversation history to understand what has been researched so far
- Your response MUST build on previous research iterations - do not repeat information already covered
- Identify gaps or areas that need further exploration related to this specific topic
- Focus on one specific aspect that needs deeper investigation in this iteration
- Start your response with "## Research Update {research_iteration}"
- Clearly explain what you're investigating in this iteration
- Provide new insights that weren't covered in previous iterations
- If this is iteration 3, prepare for a final conclusion in the next iteration
- Do NOT include general repository information unless directly relevant to the query
- Focus EXCLUSIVELY on the specific topic being researched - do not drift to related topics
- If the topic is about a specific file or feature (like "Dockerfile"), focus ONLY on that file or feature
- NEVER respond with just "Continue the research" as an answer - always provide substantive research findings
- Your research MUST directly address the original question
- Maintain continuity with previous research iterations - this is a continuous investigation
</guidelines>

<style>
- Be concise but thorough
- Focus on providing new information, not repeating what's already been covered
- Use markdown formatting to improve readability
- Cite specific files and code sections when relevant
</style>"""
        else:
            system_prompt = f"""<role>
You are an expert code analyst examining the {repo_type} repository: {repo_url} ({repo_name}).
You provide direct, concise, and accurate information about code repositories.
You NEVER start responses with markdown headers or code fences.
IMPORTANT: You MUST respond in {language_name} language.
</role>

<guidelines>
- Answer the user's question directly without ANY preamble or filler phrases
- DO NOT include any rationale, explanation, or extra comments.
- DO NOT start with preambles like "Okay, here's a breakdown" or "Here's an explanation"
- DO NOT start with markdown headers like "## Analysis of..." or any file path references
- DO NOT start with ```markdown code fences
- DO NOT end your response with ``` closing fences
- DO NOT start by repeating or acknowledging the question
- JUST START with the direct answer to the question

<example_of_what_not_to_do>
```markdown
## Analysis of `adalflow/adalflow/datasets/gsm8k.py`

This file contains...
```
</example_of_what_not_to_do>

<guidelines>
- Be precise and technical when discussing code
- Format your response with proper markdown including headings, lists, and code blocks WITHIN your answer
- For code analysis, organize your response with clear sections
- Think step by step and structure your answer logically
- Start with the most relevant information that directly addresses the user's query
- Your response language should be in the same language as the user's query
</guidelines>

<style>
- Use concise, direct language
- Prioritize accuracy over verbosity
- When showing code, include line numbers and file paths when relevant
- Use markdown formatting to improve readability
</style>"""

        # Fetch file content if provided
        file_content = ""
        if request.filePath:
            try:
                file_content = get_file_content(request.repo_url, request.filePath, request.type, request.token)
                logger.info(f"Successfully retrieved content for file: {request.filePath}")
            except Exception as e:
                logger.error(f"Error retrieving file content: {str(e)}")
                # Continue without file content if there's an error

        # Format conversation history
        conversation_history = ""
        for turn_id, turn in request_rag.memory().items():
            if not isinstance(turn_id, int) and hasattr(turn, 'user_query') and hasattr(turn, 'assistant_response'):
                conversation_history += f"<turn>\n<user>{turn.user_query.query_str}</user>\n<assistant>{turn.assistant_response.response_str}</assistant>\n</turn>\n"

        # Create the prompt with context
        prompt = f"/no_think {system_prompt}\n\n"

        if conversation_history:
            prompt += f"<conversation_history>\n{conversation_history}</conversation_history>\n\n"

        # Check if filePath is provided and fetch file content if it exists
        if file_content:
            # Add file content to the prompt after conversation history
            prompt += f"<currentFileContent path=\"{request.filePath}\">\n{file_content}\n</currentFileContent>\n\n"

        # Only include context if it's not empty
        CONTEXT_START = "<START_OF_CONTEXT>"
        CONTEXT_END = "<END_OF_CONTEXT>"
        if context_text.strip():
            prompt += f"{CONTEXT_START}\n{context_text}\n{CONTEXT_END}\n\n"
        else:
            # Add a note that we're skipping RAG due to size constraints or because it's the isolated API
            logger.info("No context available from RAG")
            prompt += "<note>Answering without retrieval augmentation.</note>\n\n"

        prompt += f"<query>\n{query}\n</query>\n\nAssistant: "

        model_config = get_model_config(request.provider, request.model)["model_kwargs"]

        if request.provider == "ollama":
            prompt += " /no_think"

            model = OllamaClient()
            model_kwargs = {
                "model": model_config["model"],
                "stream": True,
                "options": {
                    "temperature": model_config["temperature"],
                    "top_p": model_config["top_p"],
                    "num_ctx": model_config["num_ctx"]
                }
            }

            api_kwargs = model.convert_inputs_to_api_kwargs(
                input=prompt,
                model_kwargs=model_kwargs,
                model_type=ModelType.LLM
            )
        elif request.provider == "openrouter":
            logger.info(f"Using OpenRouter with model: {request.model}")

            # Check if OpenRouter API key is set
            if not os.environ.get("OPENROUTER_API_KEY"):
                logger.warning("OPENROUTER_API_KEY environment variable is not set, but continuing with request")
                # We'll let the OpenRouterClient handle this and return a friendly error message

            model = OpenRouterClient()
            model_kwargs = {
                "model": request.model,
                "stream": True,
                "temperature": model_config["temperature"],
                "top_p": model_config["top_p"]
            }

            api_kwargs = model.convert_inputs_to_api_kwargs(
                input=prompt,
                model_kwargs=model_kwargs,
                model_type=ModelType.LLM
            )
        elif request.provider == "azure":
            logger.info(f"Using Azure OpenAI protocol with model: {request.model}")

            # Check if Azure OpenAI credentials are set
            if not AZURE_OPENAI_AVAILABLE:
                logger.warning("Azure OpenAI credentials not found in environment variables, but continuing with request")
                # We'll handle this below by falling back to other providers

            # Initialize Azure OpenAI client
            model = AzureOpenAIClient()
            
            # Format the prompt as messages for Azure OpenAI
            # First create the system message with context
            system_content = system_prompt
            
            # Create the user message with the query
            user_content = query
            
            # Format messages for Azure OpenAI
            messages = [
                {"role": "system", "content": system_content},
            ]
            
            # Add conversation history if available
            if conversation_history:
                messages.append({"role": "user", "content": f"Previous conversation: {conversation_history}"})
            
            # Add context if available
            if context_text.strip():
                messages.append({"role": "user", "content": f"Context: {context_text}"})
                
            # Add file content if available
            if request.filePath and file_content:
                messages.append({"role": "user", "content": f"File content ({request.filePath}): {file_content}"})
            
            # Add the actual query
            messages.append({"role": "user", "content": user_content})
            
            logger.info(f"Formatted {len(messages)} messages for Azure OpenAI")
            
            # Set up model kwargs
            model_kwargs = {
                "model": request.model or "gpt-4",  # Default to GPT-4 if not specified
                "stream": True,
                "temperature": model_config.get("temperature", 0.7),
                "top_p": model_config.get("top_p", 0.8)
            }

            # For Azure OpenAI, we need to ensure the api_kwargs include both 'messages' and 'model'
            # The convert_inputs_to_api_kwargs method may not be handling this correctly
            api_kwargs = {
                "messages": messages,
                "model": request.model or "gpt-4",  # Ensure model is included
                "stream": True,
                "temperature": model_config.get("temperature", 0.7),
                "top_p": model_config.get("top_p", 0.8)
            }
            
            # Log the API kwargs for debugging
            logger.info(f"Azure OpenAI API kwargs: {api_kwargs.keys()}")
            
            # No need to use convert_inputs_to_api_kwargs as we're manually constructing the kwargs
        elif request.provider == "openai":
            logger.info(f"Using Openai protocol with model: {request.model}")

            # Check if an API key is set for Openai
            if not os.environ.get("OPENAI_API_KEY"):
                logger.warning("OPENAI_API_KEY environment variable is not set, but continuing with request")
                # We'll let the OpenAIClient handle this and return an error message

            # Initialize Openai client
            model = OpenAIClient()
            model_kwargs = {
                "model": request.model,
                "stream": True,
                "temperature": model_config["temperature"],
                "top_p": model_config["top_p"]
            }

            api_kwargs = model.convert_inputs_to_api_kwargs(
                input=prompt,
                model_kwargs=model_kwargs,
                model_type=ModelType.LLM
            )
        else:
            # Fall back to Google Generative AI if available
            if GOOGLE_AI_AVAILABLE and google_api_key:
                # Initialize Google Generative AI model
                logger.info("Using Google Generative AI for model generation")
                # Create safe generation config with defaults
                generation_config = {
                    "temperature": 0.7,
                    "top_p": 0.8,
                    "top_k": 40
                }
                
                # Update with available parameters from model_config
                if "temperature" in model_config:
                    generation_config["temperature"] = model_config["temperature"]
                if "top_p" in model_config:
                    generation_config["top_p"] = model_config["top_p"]
                    
                # Initialize the model with the safe configuration
                model = genai.GenerativeModel(
                    model_name=model_config["model"],
                    generation_config=generation_config
                )
            else:
                # Fall back to OpenAI if neither Azure nor Google is available
                logger.info("Falling back to OpenAI for model generation")
                model = OpenAIClient()
                model_kwargs = {
                    "model": request.model or "gpt-3.5-turbo",
                    "stream": True,
                    "temperature": model_config.get("temperature", 0.7),
                    "top_p": model_config.get("top_p", 0.8)
                }
                
                api_kwargs = model.convert_inputs_to_api_kwargs(
                    input=prompt,
                    model_kwargs=model_kwargs,
                    model_type=ModelType.LLM
                )

        # Process the response based on the provider
        try:
            if request.provider == "azure":
                # Get the response and handle it properly using the previously created api_kwargs
                logger.info("Making Azure OpenAI API call")
                response = await model.acall(api_kwargs=api_kwargs, model_type=ModelType.LLM)
                
                # The response is now the raw AsyncStream object from the OpenAI library
                logger.info("Processing Azure OpenAI streaming response")
                
                try:
                    # Iterate over the stream chunks
                    async for chunk in response:
                        # Log the chunk type
                        logger.debug(f"Received chunk type: {type(chunk).__name__}")
                        
                        # Debug the chunk structure
                        chunk_dict = {attr: getattr(chunk, attr) for attr in dir(chunk) if not attr.startswith('_') and not callable(getattr(chunk, attr))}
                        logger.debug(f"Chunk attributes: {list(chunk_dict.keys())}")
                        
                        # Skip chunks with no delta content
                        if not hasattr(chunk, 'choices') or not chunk.choices:
                            logger.debug("Skipping chunk with no choices")
                            continue
                            
                        # Log choices structure
                        logger.debug(f"Choices length: {len(chunk.choices)}")
                        
                        # Process each choice in the chunk
                        for i, choice in enumerate(chunk.choices):
                            choice_dict = {attr: getattr(choice, attr) for attr in dir(choice) if not attr.startswith('_') and not callable(getattr(choice, attr))}
                            logger.debug(f"Choice {i} attributes: {list(choice_dict.keys())}")
                            
                            # Extract content from delta if available
                            if hasattr(choice, 'delta'):
                                delta_dict = {attr: getattr(choice.delta, attr) for attr in dir(choice.delta) if not attr.startswith('_') and not callable(getattr(choice.delta, attr))}
                                logger.debug(f"Delta attributes: {list(delta_dict.keys())}")
                                
                                # Get content if available
                                if hasattr(choice.delta, 'content') and choice.delta.content is not None:
                                    content = choice.delta.content
                                    logger.debug(f"Sending content: {content[:20]}..." if len(content) > 20 else f"Sending content: {content}")
                                    await websocket.send_text(content)
                    
                    logger.info("Azure OpenAI streaming response completed successfully")
                except Exception as e:
                    logger.error(f"Error processing Azure OpenAI streaming response: {str(e)}")
                    
                    # Try to get the response directly if streaming failed
                    try:
                        # If response is a completed response rather than a stream
                        if hasattr(response, 'choices') and len(response.choices) > 0:
                            if hasattr(response.choices[0], 'message') and hasattr(response.choices[0].message, 'content'):
                                content = response.choices[0].message.content
                                if content:
                                    await websocket.send_text(content)
                    except Exception as recovery_error:
                        logger.error(f"Failed to recover response content: {str(recovery_error)}")
                
                # Explicitly close the WebSocket connection after the response is complete
                await websocket.close()
            elif request.provider == "ollama":
                # Get the response and handle it properly using the previously created api_kwargs
                response = await model.acall(api_kwargs=api_kwargs, model_type=ModelType.LLM)
                # Handle streaming response from Ollama
                async for chunk in response:
                    text = getattr(chunk, 'response', None) or getattr(chunk, 'text', None) or str(chunk)
                    if text and not text.startswith('model=') and not text.startswith('created_at='):
                        text = text.replace('<think>', '').replace('</think>', '')
                        await websocket.send_text(text)
                # Explicitly close the WebSocket connection after the response is complete
                await websocket.close()
            elif request.provider == "openrouter":
                try:
                    # Get the response and handle it properly using the previously created api_kwargs
                    logger.info("Making OpenRouter API call")
                    response = await model.acall(api_kwargs=api_kwargs, model_type=ModelType.LLM)
                    # Handle streaming response from OpenRouter
                    async for chunk in response:
                        await websocket.send_text(chunk)
                    # Explicitly close the WebSocket connection after the response is complete
                    await websocket.close()
                except Exception as e_openrouter:
                    logger.error(f"Error with OpenRouter API: {str(e_openrouter)}")
                    error_msg = f"\nError with OpenRouter API: {str(e_openrouter)}\n\nPlease check that you have set the OPENROUTER_API_KEY environment variable with a valid API key."
                    await websocket.send_text(error_msg)
                    # Close the WebSocket connection after sending the error message
                    await websocket.close()
            elif request.provider == "openai":
                try:
                    # Get the response and handle it properly using the previously created api_kwargs
                    logger.info("Making Openai API call")
                    response = await model.acall(api_kwargs=api_kwargs, model_type=ModelType.LLM)
                    # Handle streaming response from Openai
                    async for chunk in response:
                        choices = getattr(chunk, "choices", [])
                        if len(choices) > 0:
                            delta = getattr(choices[0], "delta", None)
                            if delta is not None:
                                text = getattr(delta, "content", None)
                                if text is not None:
                                    await websocket.send_text(text)
                    # Explicitly close the WebSocket connection after the response is complete
                    await websocket.close()
                except Exception as e_openai:
                    logger.error(f"Error with Openai API: {str(e_openai)}")
                    error_msg = f"\nError with Openai API: {str(e_openai)}\n\nPlease check that you have set the OPENAI_API_KEY environment variable with a valid API key."
                    await websocket.send_text(error_msg)
                    # Close the WebSocket connection after sending the error message
                    await websocket.close()
            else:
                # Generate streaming response
                response = model.generate_content(prompt, stream=True)
                # Stream the response
                for chunk in response:
                    if hasattr(chunk, 'text'):
                        await websocket.send_text(chunk.text)
                # Explicitly close the WebSocket connection after the response is complete
                await websocket.close()

        except Exception as e_outer:
            logger.error(f"Error in streaming response: {str(e_outer)}")
            error_message = str(e_outer)

            # Check for token limit errors
            if "maximum context length" in error_message or "token limit" in error_message or "too many tokens" in error_message:
                # If we hit a token limit error, try again without context
                logger.warning("Token limit exceeded, retrying without context")
                try:
                    # Create a simplified prompt without context
                    simplified_prompt = f"/no_think {system_prompt}\n\n"
                    if conversation_history:
                        simplified_prompt += f"<conversation_history>\n{conversation_history}</conversation_history>\n\n"

                    # Include file content in the fallback prompt if it was retrieved
                    if request.filePath and file_content:
                        simplified_prompt += f"<currentFileContent path=\"{request.filePath}\">\n{file_content}\n</currentFileContent>\n\n"

                    simplified_prompt += "<note>Answering without retrieval augmentation due to input size constraints.</note>\n\n"
                    simplified_prompt += f"<query>\n{query}\n</query>\n\nAssistant: "

                    if request.provider == "ollama":
                        simplified_prompt += " /no_think"

                        # Create new api_kwargs with the simplified prompt
                        fallback_api_kwargs = model.convert_inputs_to_api_kwargs(
                            input=simplified_prompt,
                            model_kwargs=model_kwargs,
                            model_type=ModelType.LLM
                        )
                        
                        # Get the response using the simplified prompt
                        fallback_response = await model.acall(api_kwargs=fallback_api_kwargs, model_type=ModelType.LLM)
                        
                        # Handle streaming fallback_response
                        async for chunk in fallback_response:
                            text = getattr(chunk, 'response', None) or getattr(chunk, 'text', None) or str(chunk)
                            if text and not text.startswith('model=') and not text.startswith('created_at='):
                                text = text.replace('<think>', '').replace('</think>', '')
                                await websocket.send_text(text)
                    elif request.provider == "azure" and AZURE_OPENAI_AVAILABLE:
                        # Initialize Azure OpenAI client for fallback
                        logger.info("Making fallback Azure OpenAI API call")
                        fallback_model = AzureOpenAIClient()
                        
                        # Format the simplified prompt as messages for Azure OpenAI
                        fallback_messages = [
                            {"role": "system", "content": system_prompt},
                        ]
                        
                        # Add conversation history if available
                        if conversation_history:
                            fallback_messages.append({"role": "user", "content": f"Previous conversation: {conversation_history}"})
                        
                        # Add file content if available
                        if request.filePath and file_content:
                            fallback_messages.append({"role": "user", "content": f"File content ({request.filePath}): {file_content}"})
                        
                        # Add the note about answering without retrieval augmentation
                        fallback_messages.append({"role": "user", "content": "Answering without retrieval augmentation due to input size constraints."})
                        
                        # Add the actual query
                        fallback_messages.append({"role": "user", "content": query})
                        
                        logger.info(f"Formatted {len(fallback_messages)} fallback messages for Azure OpenAI")
                        
                        # For Azure OpenAI, we need to ensure the api_kwargs include both 'messages' and 'model'
                        # The convert_inputs_to_api_kwargs method may not be handling this correctly
                        fallback_api_kwargs = {
                            "messages": fallback_messages,
                            "model": request.model or "gpt-4",  # Ensure model is included
                            "stream": True,
                            "temperature": 0.7,
                            "top_p": 0.8
                        }
                        
                        # Log the API kwargs for debugging
                        logger.info(f"Azure OpenAI fallback API kwargs: {fallback_api_kwargs.keys()}")
                        
                        # Get the response using the simplified prompt
                        fallback_response = await fallback_model.acall(api_kwargs=fallback_api_kwargs, model_type=ModelType.LLM)
                        
                        # The response is now the raw AsyncStream object from the OpenAI library
                        logger.info("Processing Azure OpenAI fallback streaming response")
                        
                        try:
                            # Iterate over the stream chunks
                            async for chunk in fallback_response:
                                # Log the chunk type
                                logger.info(f"Received fallback chunk type: {type(chunk).__name__}")
                                
                                # Debug the chunk structure
                                chunk_dict = {attr: getattr(chunk, attr) for attr in dir(chunk) if not attr.startswith('_') and not callable(getattr(chunk, attr))}
                                logger.info(f"Fallback chunk attributes: {list(chunk_dict.keys())}")
                                
                                # Skip chunks with no delta content
                                if not hasattr(chunk, 'choices') or not chunk.choices:
                                    logger.info("Skipping fallback chunk with no choices")
                                    continue
                                    
                                # Log choices structure
                                logger.info(f"Fallback choices length: {len(chunk.choices)}")
                                
                                # Process each choice in the chunk
                                for i, choice in enumerate(chunk.choices):
                                    choice_dict = {attr: getattr(choice, attr) for attr in dir(choice) if not attr.startswith('_') and not callable(getattr(choice, attr))}
                                    logger.info(f"Fallback choice {i} attributes: {list(choice_dict.keys())}")
                                    
                                    # Extract content from delta if available
                                    if hasattr(choice, 'delta'):
                                        delta_dict = {attr: getattr(choice.delta, attr) for attr in dir(choice.delta) if not attr.startswith('_') and not callable(getattr(choice.delta, attr))}
                                        logger.info(f"Fallback delta attributes: {list(delta_dict.keys())}")
                                        
                                        # Get content if available
                                        if hasattr(choice.delta, 'content') and choice.delta.content is not None:
                                            content = choice.delta.content
                                            logger.info(f"Sending fallback content: {content[:20]}..." if len(content) > 20 else f"Sending fallback content: {content}")
                                            await websocket.send_text(content)
                            
                            logger.info("Azure OpenAI fallback streaming response completed successfully")
                        except Exception as e:
                            logger.error(f"Error processing Azure OpenAI fallback streaming response: {str(e)}")
                            
                            # Try to get the response directly if streaming failed
                            try:
                                # If response is a completed response rather than a stream
                                if hasattr(fallback_response, 'choices') and len(fallback_response.choices) > 0:
                                    if hasattr(fallback_response.choices[0], 'message') and hasattr(fallback_response.choices[0].message, 'content'):
                                        content = fallback_response.choices[0].message.content
                                        if content:
                                            await websocket.send_text(content)
                            except Exception as recovery_error:
                                logger.error(f"Failed to recover fallback response content: {str(recovery_error)}")
                    elif GOOGLE_AI_AVAILABLE and google_api_key:
                        # Initialize Google Generative AI model as fallback
                        logger.info("Making fallback Google Generative AI call")
                        try:
                            # Get model config
                            model_config = get_model_config(request.provider, request.model)
                            
                            # Create safe generation config with defaults
                            generation_config = {
                                "temperature": 0.7,
                                "top_p": 0.8,
                                "top_k": 40
                            }
                            
                            # Update with available parameters if they exist
                            if isinstance(model_config, dict):
                                if "temperature" in model_config:
                                    generation_config["temperature"] = model_config["temperature"]
                                if "top_p" in model_config:
                                    generation_config["top_p"] = model_config["top_p"]
                            
                            # Initialize the model with the safe configuration
                            fallback_model = genai.GenerativeModel(
                                model_name=model_config.get("model", "gemini-pro"),
                                generation_config=generation_config
                            )
                            
                            # Get streaming response using simplified prompt
                            fallback_response = fallback_model.generate_content(simplified_prompt, stream=True)
                            # Stream the fallback response
                            for chunk in fallback_response:
                                if hasattr(chunk, 'text'):
                                    await websocket.send_text(chunk.text)
                        except Exception as e_google:
                            logger.error(f"Error with Google Generative AI fallback: {str(e_google)}")
                            error_msg = f"\nAll fallback options failed. Please try again with a shorter query or check your API configurations.\nLast error: {str(e_google)}"
                            await websocket.send_text(error_msg)
                    else:
                        # No fallback options available
                        error_msg = "\nNo fallback options available. Please check your API configurations and try again with a shorter query."
                        await websocket.send_text(error_msg)
                except Exception as e2:
                    logger.error(f"Error in fallback streaming response: {str(e2)}")
                    await websocket.send_text(f"\nI apologize, but your request is too large for me to process. Please try a shorter query or break it into smaller parts.")
                    # Close the WebSocket connection after sending the error message
                    await websocket.close()
            else:
                # For other errors, return the error message
                await websocket.send_text(f"\nError: {error_message}")
                # Close the WebSocket connection after sending the error message
                await websocket.close()

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"Error in WebSocket handler: {str(e)}")
        try:
            await websocket.send_text(f"Error: {str(e)}")
            await websocket.close()
        except:
            pass
