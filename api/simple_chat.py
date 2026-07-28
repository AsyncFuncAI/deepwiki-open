import asyncio
import logging
from typing import Callable
from functools import partial

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from api.chat import ChatStreamer, prompt_builder, is_token_limit_error
from api.config import get_model_config, configs
from api.data_pipeline import count_tokens, get_file_content
from api.rag import RAG, MAX_INPUT_TOKENS
from api.prompts import (
    DEEP_RESEARCH_FIRST_ITERATION_PROMPT,
    DEEP_RESEARCH_FINAL_ITERATION_PROMPT,
    DEEP_RESEARCH_INTERMEDIATE_ITERATION_PROMPT,
    SIMPLE_CHAT_SYSTEM_PROMPT
)
from api.schemas import ChatCompletionRequest

# Configure logging
from api.logging_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)


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


@app.post("/chat/completions/stream")
async def chat_completions_stream(request: ChatCompletionRequest):
    """Stream a chat completion response directly using Google Generative AI"""
    try:
        # Check if request contains very large input
        input_too_large = False
        if request.messages and len(request.messages) > 0:
            last_message = request.messages[-1]
            if hasattr(last_message, 'content') and last_message.content:
                tokens = count_tokens(last_message.content, embedder_type=request.provider)
                logger.info(f"Request size: {tokens} tokens")
                if tokens > MAX_INPUT_TOKENS:
                    logger.warning(f"Request exceeds recommended token limit ({tokens} > {MAX_INPUT_TOKENS})")
                    input_too_large = True

        # Create a new RAG instance for this request
        try:
            # async do RAG initialization
            request_rag = await asyncio.to_thread(
                RAG,
                provider=request.provider,
                model=request.model,
            )

            # Extract custom file filter parameters if provided
            if request.excluded_dirs:
                logger.info(f"Using custom excluded directories: {request.excluded_dirs}")
            if request.excluded_files:
                logger.info(f"Using custom excluded files: {request.excluded_files}")
            if request.included_dirs:
                logger.info(f"Using custom included directories: {request.included_dirs}")
            if request.included_files:
                logger.info(f"Using custom included files: {request.included_files}")

            await request_rag.aprepare_retriever(
                request.repo_url,
                request.type,
                request.token,
                excluded_dirs=request.excluded_dirs,
                excluded_files=request.excluded_files,
                included_dirs=request.included_dirs,
                included_files=request.included_files,
            )
            logger.info(f"Retriever prepared for {request.repo_url}")
        except ValueError as e:
            if "No valid documents with embeddings found" in str(e):
                logger.error(f"No valid embeddings found: {str(e)}")
                raise HTTPException(status_code=500, detail="No valid document embeddings found. This may be due to embedding size inconsistencies or API errors during document processing. Please try again or check your repository content.")
            else:
                logger.error(f"ValueError preparing retriever: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error preparing retriever: {str(e)}")
        except Exception as e:
            logger.error(f"Error preparing retriever: {str(e)}")
            # Check for specific embedding-related errors
            if "All embeddings should be of the same size" in str(e):
                raise HTTPException(status_code=500, detail="Inconsistent embedding sizes detected. Some documents may have failed to embed properly. Please try again.")
            else:
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
        is_deep_research = last_message.mode == "deep_research"

        # Count research iterations if this is a Deep Research request
        if is_deep_research:
            logger.info("Deep Research request detected - iteration %d",request.research_iteration)

            # Check if this is a continuation request
            if "continue" in last_message.content.lower() and "research" in last_message.content.lower():
                # Find the original topic from the first user message
                original_topic = None
                for msg in request.messages:
                    if msg.role == "user" and "continue" not in msg.content.lower():
                        original_topic = msg.content.strip()
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
                    retrieved_documents = await request_rag.acall(rag_query, language=request.language)

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
        language_code = request.language or configs["lang_config"]["default"]
        supported_langs = configs["lang_config"]["supported_languages"]
        language_name = supported_langs.get(language_code, "English")

        # Create system prompt
        if is_deep_research:
            # Check if this is the first iteration
            is_first_iteration = request.research_iteration == 1

            # Check if this is the final iteration
            is_final_iteration = request.research_iteration >= 5

            if is_first_iteration:
                system_prompt = DEEP_RESEARCH_FIRST_ITERATION_PROMPT.format(
                    repo_type=repo_type,
                    repo_url=repo_url,
                    repo_name=repo_name,
                    language_name=language_name
                )
            elif is_final_iteration:
                system_prompt = DEEP_RESEARCH_FINAL_ITERATION_PROMPT.format(
                    repo_type=repo_type,
                    repo_url=repo_url,
                    repo_name=repo_name,
                    language_name=language_name
                )
            else:
                system_prompt = DEEP_RESEARCH_INTERMEDIATE_ITERATION_PROMPT.format(
                    repo_type=repo_type,
                    repo_url=repo_url,
                    repo_name=repo_name,
                    research_iteration=request.research_iteration,
                    language_name=language_name
                )
        else:
            system_prompt = SIMPLE_CHAT_SYSTEM_PROMPT.format(
                repo_type=repo_type,
                repo_url=repo_url,
                repo_name=repo_name,
                language_name=language_name
            )

        # Fetch file content if provided
        file_content = ""
        if request.filePath:
            try:
                file_content = await asyncio.to_thread(
                    get_file_content,
                    repo_url=request.repo_url,
                    file_path=request.filePath,
                    repo_type=request.type,
                    access_token=request.token,
                )
                logger.info(f"Successfully retrieved content for file: {request.filePath}")
            except Exception as e:
                logger.error(f"Error retrieving file content: {str(e)}")
                # Continue without file content if there's an error

        # Format conversation history
        conversation_history = ""
        for turn_id, turn in request_rag.memory().items():
            if not isinstance(turn_id, int) and hasattr(turn, 'user_query') and hasattr(turn, 'assistant_response'):
                conversation_history += f"<turn>\n<user>{turn.user_query.query_str}</user>\n<assistant>{turn.assistant_response.response_str}</assistant>\n</turn>\n"

        async def stream_and_fallback(
                streamer: ChatStreamer,
                prompt_func: Callable[[], str],
                simplified_prompt_func: Callable[[], str],
        ):
            try:
                async for chunk in streamer.respond_stream(prompt_func()):
                    yield chunk
            except Exception as e:
                if is_token_limit_error(e):
                    logger.warning("Token limit exceeded, retrying without context")
                    try:
                        async for chunk in streamer.respond_stream(simplified_prompt_func()):
                            yield chunk
                    except Exception as e2:
                        logger.error("Error in fallback streaming response: %s", str(e2))
                        yield (
                            f"\nI apologize, but your request is too large for me to process. "
                            f"Please try a shorter query or break it into smaller parts."
                        )
                else:
                    error_str = f"Error with {streamer.provider} API: {e}"
                    logger.error(error_str, exc_info=True)
                    if streamer.error_hint:
                        error_str += f"\n\n{streamer.error_hint}"
                    yield "\n" + error_str

        model_config = get_model_config(request.provider, request.model)["model_kwargs"]
        chat_streamer = ChatStreamer.create(
            provider=request.provider,
            model=request.model,
            model_config=model_config,
        )
        prompt_kwargs = dict(
            system_prompt=system_prompt,
            query=query,
            conversation_history=conversation_history,
            file_path=request.filePath,
            file_content=file_content,
            context=context_text,
        )

        prompt_func = partial(
            prompt_builder,
            **prompt_kwargs,
            simplify=False,
        )
        simplified_prompt_func = partial(
            prompt_builder,
            **prompt_kwargs,
            simplify=True,
        )

        # Return streaming response
        return StreamingResponse(stream_and_fallback(
            streamer=chat_streamer,
            prompt_func=prompt_func,
            simplified_prompt_func=simplified_prompt_func,
        ), media_type="text/event-stream")

    except HTTPException:
        raise
    except Exception as e_handler:
        error_msg = f"Error in streaming chat completion: {str(e_handler)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@app.get("/")
async def root():
    """Root endpoint to check if the API is running"""
    return {"status": "API is running", "message": "Navigate to /docs for API documentation"}
