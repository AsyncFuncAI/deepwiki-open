import logging
import os
from typing import List, Optional
from urllib.parse import unquote

import google.generativeai as genai
from adalflow.components.model_client.ollama_client import OllamaClient
from adalflow.core.types import ModelType
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from api.config import get_model_config
from api.data_pipeline import count_tokens, get_file_content
from api.openai_client import OpenAIClient
from api.openrouter_client import OpenRouterClient
from api.rag import RAG

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get API keys from environment variables
google_api_key = os.environ.get('GOOGLE_API_KEY')

# Configure Google Generative AI
if google_api_key:
    genai.configure(api_key=google_api_key)
else:
    logger.warning("GOOGLE_API_KEY not found in environment variables")

# Initialize FastAPI app
app = FastAPI(
    title="Simple Chat API",
    description="Simplified API for streaming chat completions"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Models for the API
class ChatMessage(BaseModel):
    """
    Represents a single message in a chat conversation.

    Attributes:
        role (str): The role of the message sender, typically 'user' or 'assistant'.
        content (str): The textual content of the message.
    """
    role: str  # 'user' or 'assistant'
    content: str

class ChatCompletionRequest(BaseModel):
    """
    Defines the request structure for initiating a chat completion stream.

    This model includes all necessary information to process a chat request,
    such as repository details, conversation history, file context, access tokens,
    and model/provider preferences.

    Attributes:
        repo_url (str): The URL of the code repository to be used as context for the chat.
        messages (List[ChatMessage]): A list of `ChatMessage` objects representing the
                                      conversation history.
        filePath (Optional[str]): An optional path to a specific file within the
                                  repository. If provided, its content might be
                                  included in the prompt or used to focus the RAG.
        token (Optional[str]): A personal access token for accessing private repositories.
        type (Optional[str]): The type of the repository (e.g., 'github', 'gitlab',
                              'bitbucket'). Defaults to "github".
        provider (str): The LLM provider to use (e.g., "google", "openai",
                        "openrouter", "ollama"). Defaults to "google".
        model (Optional[str]): The specific model name for the chosen provider.
                               If None, a default model for the provider may be used.
        language (Optional[str]): The preferred language for the response (e.g., 'en', 'ja').
                                  Defaults to "en".
        excluded_dirs (Optional[str]): A comma-separated string of directory paths
                                       to exclude during RAG processing. Paths are
                                       URL-decoded.
        excluded_files (Optional[str]): A comma-separated string of file patterns
                                        (glob-style) to exclude during RAG processing.
                                        Patterns are URL-decoded.
    """
    repo_url: str = Field(..., description="URL of the repository to query")
    messages: List[ChatMessage] = Field(..., description="List of chat messages")
    filePath: Optional[str] = Field(None, description="Optional path to a file in the repository to include in the prompt")
    token: Optional[str] = Field(None, description="Personal access token for private repositories")
    type: Optional[str] = Field("github", description="Type of repository (e.g., 'github', 'gitlab', 'bitbucket')")
    
    # model parameters
    provider: str = Field("google", description="Model provider (google, openai, openrouter, ollama)")
    model: Optional[str] = Field(None, description="Model name for the specified provider")
    
    language: Optional[str] = Field("en", description="Language for content generation (e.g., 'en', 'ja', 'zh', 'es', 'kr', 'vi')")
    excluded_dirs: Optional[str] = Field(None, description="Comma-separated list of directories to exclude from processing")
    excluded_files: Optional[str] = Field(None, description="Comma-separated list of file patterns to exclude from processing")

@app.post("/chat/completions/stream")
async def chat_completions_stream(request: ChatCompletionRequest) -> StreamingResponse:
    """
    Handles streaming chat completions based on repository context and user queries.

    This endpoint orchestrates the entire RAG (Retrieval Augmented Generation)
    and chat process. It:
    1. Initializes a RAG instance for the request.
    2. Prepares a retriever for the specified repository, handling custom exclusions.
    3. Validates the incoming chat messages.
    4. Builds conversation history for the RAG memory.
    5. Detects and manages "Deep Research" requests, modifying prompts accordingly.
    6. Retrieves relevant documents using RAG if the input isn't too large.
    7. Fetches specific file content if `filePath` is provided.
    8. Constructs a detailed prompt incorporating system instructions, conversation
       history, file content (if any), and RAG context (if any).
    9. Calls the appropriate LLM provider (Google, Ollama, OpenRouter, OpenAI)
       to generate a streaming response.
    10. Includes a fallback mechanism to retry without RAG context if a token
        limit error occurs.

    Args:
        request (ChatCompletionRequest): The request object containing all necessary
                                         parameters for the chat completion.

    Returns:
        StreamingResponse: A FastAPI `StreamingResponse` that streams the generated
                           chat completion back to the client.

    Raises:
        HTTPException:
            - 400 (Bad Request): If no messages are provided or if the last message
                                 is not from the user.
            - 500 (Internal Server Error): If there's an error preparing the retriever,
                                         or any other unhandled exception occurs during
                                         the streaming process.
    """
    try:
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
            request_rag = RAG(provider=request.provider, model=request.model)

            # Extract custom file filter parameters if provided
            excluded_dirs = None
            excluded_files = None
            if request.excluded_dirs:
                excluded_dirs = [unquote(dir_path) for dir_path in request.excluded_dirs.split('\n') if dir_path.strip()]
                logger.info(f"Using custom excluded directories: {excluded_dirs}")
            if request.excluded_files:
                excluded_files = [unquote(file_pattern) for file_pattern in request.excluded_files.split('\n') if file_pattern.strip()]
                logger.info(f"Using custom excluded files: {excluded_files}")

            request_rag.prepare_retriever(request.repo_url, request.type, request.token, excluded_dirs, excluded_files)
            logger.info(f"Retriever prepared for {request.repo_url}")
        except Exception as e:
            logger.error(f"Error preparing retriever: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error preparing retriever: {str(e)}")

        # Validate request
        if not request.messages or len(request.messages) == 0:
            raise HTTPException(status_code=400, detail="No messages provided")

        last_message = request.messages[-1]
        if last_message.role != "user":
            raise HTTPException(status_code=400, detail="Last message must be from the user")

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
                    retrieved_documents = request_rag(rag_query, language=request.language)

                    if retrieved_documents and retrieved_documents[0].documents:
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
        language_code = request.language or "en"
        language_name = {
            "en": "English",
            "ja": "Japanese (日本語)",
            "zh": "Mandarin Chinese (中文)",
            "es": "Spanish (Español)",
            "kr": "Korean (한국어)",
            "vi": "Vietnamese (Tiếng Việt)"
        }.get(language_code, "English")

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
IMPORTANT:You MUST respond in {language_name} language.
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

- Format your response with proper markdown including headings, lists, and code blocks WITHIN your answer
- For code analysis, organize your response with clear sections
- Think step by step and structure your answer logically
- Start with the most relevant information that directly addresses the user's query
- Be precise and technical when discussing code
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
            # Initialize Google Generative AI model
            model = genai.GenerativeModel(
                model_name=model_config["model"],
                generation_config={
                    "temperature": model_config["temperature"],
                    "top_p": model_config["top_p"],
                    "top_k": model_config["top_k"]
                }
            )

        # Create a streaming response
        async def response_stream():
            """
            Asynchronously generates and streams the chat response.

            This inner function is responsible for making the actual call to the
            selected LLM provider (Google, Ollama, OpenRouter, OpenAI) and
            yielding chunks of the response as they are received. It also
            implements a fallback mechanism: if a token limit error occurs with
            the full context, it retries the call with a simplified prompt
            (omitting RAG context).

            Yields:
                str: Chunks of the generated text from the LLM. If an error occurs,
                     it may yield an error message string.
            """
            try:
                if request.provider == "ollama":
                    # Get the response and handle it properly using the previously created api_kwargs
                    response = await model.acall(api_kwargs=api_kwargs, model_type=ModelType.LLM)
                    # Handle streaming response from Ollama
                    async for chunk in response:
                        text = getattr(chunk, 'response', None) or getattr(chunk, 'text', None) or str(chunk)
                        if text and not text.startswith('model=') and not text.startswith('created_at='):
                            text = text.replace('<think>', '').replace('</think>', '')
                            yield text
                elif request.provider == "openrouter":
                    try:
                        # Get the response and handle it properly using the previously created api_kwargs
                        logger.info("Making OpenRouter API call")
                        response = await model.acall(api_kwargs=api_kwargs, model_type=ModelType.LLM)
                        # Handle streaming response from OpenRouter
                        async for chunk in response:
                            yield chunk
                    except Exception as e_openrouter:
                        logger.error(f"Error with OpenRouter API: {str(e_openrouter)}")
                        yield f"\nError with OpenRouter API: {str(e_openrouter)}\n\nPlease check that you have set the OPENROUTER_API_KEY environment variable with a valid API key."
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
                                        yield text
                    except Exception as e_openai:
                        logger.error(f"Error with Openai API: {str(e_openai)}")
                        yield f"\nError with Openai API: {str(e_openai)}\n\nPlease check that you have set the OPENAI_API_KEY environment variable with a valid API key."
                else: # Default to Google provider
                    # Generate streaming response
                    response = model.generate_content(prompt, stream=True)
                    # Stream the response
                    for chunk in response:
                        if hasattr(chunk, 'text'):
                            yield chunk.text

            except Exception as e_outer:
                logger.error(f"Error in streaming response: {str(e_outer)}", exc_info=True)
                error_message = str(e_outer)

                # Check for token limit errors
                if "maximum context length" in error_message.lower() or \
                   "token limit" in error_message.lower() or \
                   "too many tokens" in error_message.lower() or \
                   "context_length_exceeded" in error_message.lower():
                    # If we hit a token limit error, try again without context
                    logger.warning("Token limit exceeded, retrying without context")
                    try:
                        # Create a simplified prompt without context
                        # This system_prompt is defined in the outer scope of chat_completions_stream
                        simplified_prompt = f"/no_think {system_prompt}\n\n"
                        if conversation_history: # conversation_history from outer scope
                            simplified_prompt += f"<conversation_history>\n{conversation_history}</conversation_history>\n\n"

                        # Include file content in the fallback prompt if it was retrieved
                        if request.filePath and file_content: # file_content from outer scope
                            simplified_prompt += f"<currentFileContent path=\"{request.filePath}\">\n{file_content}\n</currentFileContent>\n\n"

                        simplified_prompt += "<note>Answering without retrieval augmentation due to input size constraints.</note>\n\n"
                        simplified_prompt += f"<query>\n{query}\n</query>\n\nAssistant: " # query from outer scope

                        if request.provider == "ollama":
                            simplified_prompt += " /no_think"
                            # model and model_kwargs are from the outer scope
                            fallback_api_kwargs = model.convert_inputs_to_api_kwargs(
                                input=simplified_prompt, model_kwargs=model_kwargs, model_type=ModelType.LLM
                            )
                            fallback_response = await model.acall(api_kwargs=fallback_api_kwargs, model_type=ModelType.LLM)
                            async for chunk in fallback_response:
                                text = getattr(chunk, 'response', None) or getattr(chunk, 'text', None) or str(chunk)
                                if text and not text.startswith('model=') and not text.startswith('created_at='):
                                    text = text.replace('<think>', '').replace('</think>', '')
                                    yield text
                        elif request.provider == "openrouter":
                            try:
                                fallback_api_kwargs = model.convert_inputs_to_api_kwargs(
                                    input=simplified_prompt, model_kwargs=model_kwargs, model_type=ModelType.LLM
                                )
                                logger.info("Making fallback OpenRouter API call")
                                fallback_response = await model.acall(api_kwargs=fallback_api_kwargs, model_type=ModelType.LLM)
                                async for chunk in fallback_response:
                                    yield chunk
                            except Exception as e_fallback_openrouter:
                                logger.error(f"Error with OpenRouter API fallback: {str(e_fallback_openrouter)}")
                                yield f"\nError with OpenRouter API fallback: {str(e_fallback_openrouter)}\n\nPlease check that you have set the OPENROUTER_API_KEY environment variable with a valid API key."
                        elif request.provider == "openai":
                            try:
                                fallback_api_kwargs = model.convert_inputs_to_api_kwargs(
                                    input=simplified_prompt, model_kwargs=model_kwargs, model_type=ModelType.LLM
                                )
                                logger.info("Making fallback OpenAI API call")
                                fallback_response = await model.acall(api_kwargs=fallback_api_kwargs, model_type=ModelType.LLM)
                                async for chunk in fallback_response: # Assuming response is stream of text or objects with text
                                    choices = getattr(chunk, "choices", [])
                                    if len(choices) > 0:
                                        delta = getattr(choices[0], "delta", None)
                                        if delta is not None:
                                            text_content = getattr(delta, "content", None)
                                            if text_content is not None:
                                                yield text_content
                            except Exception as e_fallback_openai:
                                logger.error(f"Error with OpenAI API fallback: {str(e_fallback_openai)}")
                                yield f"\nError with OpenAI API fallback: {str(e_fallback_openai)}\n\nPlease check that you have set the OPENAI_API_KEY environment variable with a valid API key."
                        else: # Default to Google provider for fallback
                            # model_config is from outer scope
                            fallback_model_instance = genai.GenerativeModel(
                                model_name=model_config["model"], # model_config from outer scope
                                generation_config={
                                    "temperature": model_config["temperature"],
                                    "top_p": model_config["top_p"],
                                    "top_k": model_config["top_k"]
                                }
                            )
                            fallback_response = fallback_model_instance.generate_content(simplified_prompt, stream=True)
                            for chunk in fallback_response:
                                if hasattr(chunk, 'text'):
                                    yield chunk.text
                    except Exception as e2_fallback_generic:
                        logger.error(f"Error in fallback streaming response: {str(e2_fallback_generic)}", exc_info=True)
                        yield f"\nI apologize, but your request is too large for me to process, even after simplification. Please try a shorter query or break it into smaller parts."
                else:
                    # For other errors, return the error message
                    yield f"\nError: {error_message}"

        # Return streaming response
        return StreamingResponse(response_stream(), media_type="text/event-stream")

    except HTTPException: # Re-raise HTTPExceptions directly to be handled by FastAPI
        raise
    except Exception as e_handler: # Catch any other unexpected errors
        error_msg = f"Critical error in chat completion stream handler: {str(e_handler)}"
        logger.error(error_msg, exc_info=True)
        # It's tricky to return a StreamingResponse with an error message if the stream hasn't started.
        # If error happens before stream starts, HTTPException is better.
        # If it happens within the stream, the stream itself should yield error messages.
        # This current placement will catch errors before response_stream() is even returned.
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/")
async def root():
    """
    Root endpoint for the Simple Chat API.

    Provides a basic status message indicating that the API is running and
    directs users to the API documentation.

    Returns:
        dict: A dictionary with "status" and "message" keys.
    """
    return {"status": "API is running", "message": "Navigate to /docs for API documentation"}
