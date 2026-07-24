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
    SIMPLE_CHAT_SYSTEM_PROMPT,
)
from api.schemas import ChatCompletionRequest
from api.utils.research import research_chat

# Configure logging
from api.logger import get_logger

logger = get_logger(__name__)


# Initialize FastAPI app
app = FastAPI(
    title="Simple Chat API", description="Simplified API for streaming chat completions"
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
    """Stream a chat completion response directly using Google Generative AI"""  # Validate request
    if not request.messages or len(request.messages) == 0:
        raise HTTPException(status_code=400, detail="No messages provided")

    last_message = request.messages[-1]
    if last_message.role != "user":
        raise HTTPException(
            status_code=400, detail="Last message must be from the user"
        )

    try:
        async_respond = await research_chat(request=request)
        

    except ValueError as e:
        if "No valid documents with embeddings found" in str(e):
            raise HTTPException(
                status_code=500,
                detail="No valid document embeddings found. This may be due to embedding size inconsistencies or API errors during document processing. Please try again or check your repository content.",
            )
        else:
            raise HTTPException(
                status_code=500, detail=f"Error preparing retriever: {str(e)}"
            )
    except Exception as e:
        if "All embeddings should be of the same size" in str(e):
            raise HTTPException(
                status_code=500,
                detail="Inconsistent embedding sizes detected. Some documents may have failed to embed properly. Please try again.",
            )
        else:
            raise HTTPException(
                status_code=500, detail=f"Error preparing retriever: {str(e)}"
            )
        
    try:
        return StreamingResponse(
            async_respond,
            media_type="text/event-stream",
        )

    except Exception as e_handler:
        error_msg = f"Error in streaming chat completion: {str(e_handler)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@app.get("/")
async def root():
    """Root endpoint to check if the API is running"""
    return {
        "status": "API is running",
        "message": "Navigate to /docs for API documentation",
    }
