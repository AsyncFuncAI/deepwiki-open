"""
Wiki Generation Resource Managers

Context managers for ensuring proper resource cleanup during wiki generation.
"""

import logging
from typing import Optional
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class RAGContext:
    """RAG resource context manager to ensure proper resource cleanup"""
    
    def __init__(self, provider: str, model: Optional[str] = None):
        self.provider = provider
        self.model = model
        self.rag = None
    
    async def __aenter__(self):
        """Enter context and create RAG instance"""
        from api.rag import RAG
        self.rag = RAG(provider=self.provider, model=self.model)
        return self.rag
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Exit context and cleanup RAG resources"""
        if self.rag:
            try:
                # If RAG has cleanup method, call it
                if hasattr(self.rag, 'cleanup'):
                    if hasattr(self.rag.cleanup, '__call__'):
                        # Check if it's an async method
                        if hasattr(self.rag.cleanup, '__code__'):
                            import inspect
                            if inspect.iscoroutinefunction(self.rag.cleanup):
                                await self.rag.cleanup()
                            else:
                                self.rag.cleanup()
                        else:
                            await self.rag.cleanup()
                # Clear reference
                self.rag = None
            except Exception as e:
                logger.error(f"Error cleaning up RAG resources: {e}")
        return False  # Don't suppress exceptions


class WebSocketGuard:
    """WebSocket connection guard to ensure proper connection closure"""
    
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.should_close = True
    
    async def __aenter__(self):
        """Enter context and return WebSocket"""
        return self.websocket
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Exit context and close WebSocket if needed"""
        if self.should_close:
            try:
                if self.websocket.client_state.name != 'DISCONNECTED':
                    await self.websocket.close()
            except Exception as e:
                logger.error(f"Error closing WebSocket: {e}")
        return False  # Don't suppress exceptions
    
    def keep_open(self):
        """Mark as not needing automatic closure"""
        self.should_close = False

