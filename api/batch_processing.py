from typing import List, Dict, Any
import logging
import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from api.rag import RAG

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Define request models
class BatchQueryRequest(BaseModel):
    repo_url: str
    queries: List[str]
    github_token: str = None
    gitlab_token: str = None

class BatchQueryResponse(BaseModel):
    results: List[Dict[str, Any]]

# Global RAG instance
rag_instance = None

@router.post("/batch", response_model=BatchQueryResponse)
async def process_batch_queries(request: BatchQueryRequest, background_tasks: BackgroundTasks):
    """
    Process a batch of queries in parallel using RAG.
    
    Args:
        request: BatchQueryRequest containing repo_url and list of queries
        
    Returns:
        BatchQueryResponse with results for each query
    """
    global rag_instance
    
    try:
        # Initialize RAG if not already done
        if rag_instance is None:
            logger.info("Initializing RAG instance")
            rag_instance = RAG()
        
        # Prepare the retriever with the repository
        logger.info(f"Preparing retriever for {request.repo_url}")
        rag_instance.prepare_retriever(
            repo_url_or_path=request.repo_url,
            access_token=request.github_token if "github.com" in request.repo_url else request.gitlab_token
        )
        
        # Process queries in parallel
        logger.info(f"Processing batch of {len(request.queries)} queries")
        results = await rag_instance.batch_call(request.queries)
        
        # Format results
        formatted_results = []
        for i, (response, _) in enumerate(results):
            formatted_results.append({
                "query": request.queries[i],
                "answer": response.answer,
                "rationale": response.rationale
            })
        
        return BatchQueryResponse(results=formatted_results)
        
    except Exception as e:
        logger.error(f"Error processing batch queries: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing batch queries: {str(e)}")
