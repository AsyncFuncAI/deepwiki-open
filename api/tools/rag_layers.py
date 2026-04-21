"""
RAG Layered Query System for Wiki Page Generation

This module provides layered RAG query functionality for generating
high-quality wiki pages with comprehensive context.

Features:
- Multi-layer RAG queries (core content, architecture, context)
- Document deduplication and ranking
- Parallel page generation with shared RAG instance
- Enhanced wiki structure conversion
"""

import logging
import json
import asyncio
from typing import List, Optional, Dict, Any, Callable

from fastapi import WebSocket
from pydantic import BaseModel, Field

from .wiki_exceptions import (
    WikiGenerationError,
    ValidationError,
    RAGIndexError,
    PageGenerationError
)
from .wiki_validator import WikiStructureValidator
from .wiki_resources import RAGContext, WebSocketGuard

logger = logging.getLogger(__name__)


class WikiPageGenerationRequest(BaseModel):
    """Request model for wiki page generation through WebSocket"""
    request_type: str = "wiki_page_generation"
    repo_url: str
    repo_type: str = "github"
    access_token: Optional[str] = None
    language: str = "zh"
    wiki_structure: Dict[str, Any]
    max_concurrent_pages: Optional[int] = 5


class WikiPageGenerator:
    """Wiki Page Generator"""
    
    def __init__(
        self,
        rag_factory: Optional[Callable] = None,  # Dependency injection: RAG factory function
        llm_service_factory: Optional[Callable] = None,  # Dependency injection: LLMService factory function
        configs: Optional[Dict] = None  # Dependency injection: configurations
    ):
        # Delay import to avoid circular dependencies
        self.rag_factory = rag_factory or self._default_rag_factory
        self.llm_service_factory = llm_service_factory or self._default_llm_factory
        self.configs = configs or self._load_configs()
        
        # Validator
        self.validator = WikiStructureValidator()
        
        # Status
        self.generated_pages = {}
        self.failed_pages = {}
    
    @staticmethod
    def _default_rag_factory(provider, model):
        """Default RAG factory function"""
        from api.rag import RAG
        return RAG(provider=provider, model=model)
    
    @staticmethod
    def _default_llm_factory():
        """Default LLMService factory function"""
        from api.llm import LLMService
        return LLMService()
    
    @staticmethod
    def _load_configs():
        """Default configurations loading function"""
        from api.config import configs
        return configs
    
    async def generate(
        self, 
        websocket: WebSocket, 
        request: WikiPageGenerationRequest
    ):
        """Main generation process - with resource management"""
        
        # Validate input
        try:
            self.validator.validate_wiki_structure(request.wiki_structure)
        except ValidationError as e:
            # Send error message to client
            await self._send_error(websocket, str(e))
            # Raise exception
            raise
        
        # Use resource manager to ensure cleanup
        async with WebSocketGuard(websocket) as ws:
            try:
                # Convert structure
                compatible_structure = convert_enhanced_to_legacy_format(
                    request.wiki_structure
                )
                pages = compatible_structure.get("pages", [])
                
                if len(pages) == 0:
                    raise ValidationError("No pages found in wiki structure")
                
                # Validate and build RAG index (with resource management)
                default_provider = self.configs.get("default_provider", "openai")
                
                async with RAGContext(default_provider, None) as shared_rag:
                    # Prepare RAG
                    try:
                        shared_rag.prepare_retriever(
                            request.repo_url,
                            request.repo_type,
                            request.access_token
                        )
                    except Exception as e:
                        raise RAGIndexError(f"Failed to build RAG index: {e}")
                    
                    # Prepare prompts
                    page_requests = await _prepare_page_prompts(
                        ws, pages, request, shared_rag
                    )
                    
                    # Parallel generation
                    llm_service = self.llm_service_factory()
                    results = await _parallel_generate_pages(
                        ws, page_requests, request, llm_service
                    )
                    
                    # Process results
                    self.generated_pages, self.failed_pages = \
                        await _process_generation_results(ws, results, page_requests)
                    
                    # Retry failed pages
                    if self.failed_pages:
                        self.generated_pages, self.failed_pages = \
                            await _retry_failed_pages(
                                ws, self.failed_pages, page_requests, 
                                self.generated_pages, llm_service
                            )
                    
                    # Send final results
                    await _send_final_results(
                        ws, self.generated_pages, self.failed_pages,
                        compatible_structure, request, page_requests
                    )
                
                # RAG resources are automatically cleaned up here
                
            except (ValidationError, RAGIndexError, PageGenerationError):
                # Error message has already been sent, raise again
                raise
            except Exception as e:
                # Other exceptions
                await self._send_error(
                    ws, 
                    f"Unexpected error in wiki generation: {str(e)}"
                )
                raise WikiGenerationError(f"Wiki generation failed: {e}")
    
    async def _send_error(self, websocket: WebSocket, message: str):
        """Send error message to WebSocket"""
        try:
            if websocket.client_state.name != 'DISCONNECTED':
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": message
                }))
        except Exception as e:
            logger.error(f"Failed to send error message: {e}")


async def handle_wiki_page_generation(websocket: WebSocket, request_data: Dict[str, Any]):
    """
    Public entry function - keep backward compatibility
    
    Internal use WikiPageGenerator class, but external interface remains unchanged
    """
    try:
        # Parse request
        request = WikiPageGenerationRequest(**request_data)
        
        # Create generator instance (using default dependencies)
        generator = WikiPageGenerator()
        
        # Execute generation
        await generator.generate(websocket, request)
        
    except WikiGenerationError:
        # Business exception, already handled
        logger.info("Wiki generation failed with handled error")
    except Exception as e:
        # Unexpected exception
        logger.error(f"Unexpected error in wiki generation: {e}", exc_info=True)
        try:
            if websocket.client_state.name != 'DISCONNECTED':
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"Internal server error: {str(e)}"
                }))
                await websocket.close()
        except:
            pass


async def _prepare_page_prompts(
    websocket: WebSocket, 
    pages: List[Dict[str, Any]], 
    request: WikiPageGenerationRequest,
    shared_rag
) -> List[Dict[str, Any]]:
    """Prepare prompts for all pages using layered RAG queries"""
    await websocket.send_text(json.dumps({
        "type": "progress",
        "stage": "Preparing prompts",
        "progress": 20,
        "message": "Preparing prompts and context for all pages..."
    }))
    
    page_requests = []
    for page in pages:
        try:
            # Construct layered RAG queries
            layered_queries = construct_layered_rag_queries(
                page=page,
                wiki_structure=request.wiki_structure,
                repo_name=request.repo_url.split("/")[-1] if "/" in request.repo_url else request.repo_url
            )
            
            # Execute layered queries
            retrieved_documents = await execute_layered_rag_queries(
                queries=layered_queries,
                shared_rag=shared_rag,
                language=request.language,
                max_docs_per_query=20
            )
            
            # Format retrieved documents as context
            context_text = _format_documents_as_context(retrieved_documents)
            
            # Build complete prompt
            prompt = _build_page_prompt(page, request, context_text)
            
            page_requests.append({
                "page": page,
                "prompt": prompt
            })
            
        except Exception as e:
            logger.error(f"Error preparing prompt for page '{page['title']}': {str(e)}")
            page_requests.append({
                "page": page,
                "prompt": f"Generate a simple wiki page for {page['title']}. Error occurred during preparation: {str(e)}"
            })
    
    return page_requests


def _format_documents_as_context(retrieved_documents: List) -> str:
    """Format retrieved documents as context text"""
    context_text = ""
    if retrieved_documents:
        docs_by_file = {}
        for doc in retrieved_documents:
            file_path = doc.meta_data.get('file_path', 'unknown')
            if file_path not in docs_by_file:
                docs_by_file[file_path] = []
            docs_by_file[file_path].append(doc)
        
        context_parts = []
        for file_path, docs in docs_by_file.items():
            header = f"## File Path: {file_path}\n\n"
            content = "\n\n".join([doc.text for doc in docs])
            context_parts.append(f"{header}{content}")
        
        context_text = "\n\n" + "-" * 10 + "\n\n".join(context_parts)
    
    return context_text


def _build_page_prompt(
    page: Dict[str, Any], 
    request: WikiPageGenerationRequest, 
    context_text: str
) -> str:
    """Build complete prompt for page generation"""
    language_map = {
        'en': 'English',
        'ja': 'Japanese (日本語)',
        'zh': 'Mandarin Chinese (中文)',
        'es': 'Spanish (Español)',
        'kr': 'Korean (한국어)',
        'vi': 'Vietnamese (Tiếng Việt)'
    }
    
    prompt = f"""Generate comprehensive wiki page content for "{page['title']}" in the repository {request.repo_url}.

This page should focus on the following files:
{chr(10).join(f"- {path}" for path in page.get('filePaths', []))}

IMPORTANT: Generate the content in {language_map.get(request.language, 'English')} language.

Include:
- Clear introduction explaining what "{page['title']}" does
- Explanation of purpose and functionality
- Code snippets when helpful (less than 20 lines)
- At least one Mermaid diagram [Flow or Sequence] (use "graph TD" for vertical orientation)
- Proper markdown formatting with code blocks and headings
- Source links to relevant files
- Explanation of how this component/feature integrates with the overall architecture

### Mermaid Diagrams:
1. MANDATORY: Include AT LEAST ONE relevant Mermaid diagram, most people prefer sequence diagrams if applicable.
2. CRITICAL: All diagrams MUST follow strict vertical orientation:
   - Use "graph TD" (top-down) directive for flow diagrams
   - NEVER use "graph LR" (left-right)
   - Maximum node width should be 3-4 words
   - Example:
     ```mermaid
     graph TD
       A[Start Process] --> B[Middle Step] --> C[End Result]
     ```

Use proper markdown formatting for code blocks and include a vertical Mermaid diagram."""

    if context_text.strip():
        prompt += f"\n\n<START_OF_CONTEXT>\n{context_text}\n<END_OF_CONTEXT>"
    
    return prompt


async def _parallel_generate_pages(
    websocket: WebSocket,
    page_requests: List[Dict[str, Any]],
    request: WikiPageGenerationRequest,
    llm_service  # Dependency injection: LLMService
):
    """Use LLMService to generate pages in parallel"""
    await websocket.send_text(json.dumps({
        "type": "progress",
        "stage": "Parallel generation",
        "progress": 30,
        "message": f"Starting parallel generation using LLMService for {len(page_requests)} pages (max concurrent: {request.max_concurrent_pages})..."
    }))
    
    try:
        # Use injected llm_service instead of creating a new instance
        
        # Optimize concurrency settings
        actual_max_concurrent = min(request.max_concurrent_pages or 5, len(page_requests), 10)
        max_concurrent_per_key = min(3, actual_max_concurrent)
        
        logger.info(f"🚀 Starting parallel generation with optimized settings:")
        logger.info(f"  - Total pages: {len(page_requests)}")
        logger.info(f"  - Max concurrent total: {actual_max_concurrent}")
        logger.info(f"  - Max concurrent per key: {max_concurrent_per_key}")
        logger.info(f"  - Timeout: 900 seconds (15 minutes)")
        
        # Prepare parallel requests
        parallel_requests = []
        for req in page_requests:
            parallel_requests.append({
                "prompt": req["prompt"],
                "model_name": "gpt-4.1",
                "temperature": 0.2,
                "max_tokens": 65535
            })
        
        # Execute parallel generation
        results = llm_service.parallel_invoke(
            requests=parallel_requests,
            max_concurrent_per_key=max_concurrent_per_key,
            max_total_concurrent=actual_max_concurrent,
            timeout=900.0
        )
        
        logger.info(f"✅ Parallel generation completed successfully")
        logger.info(f"  - Results count: {len(results)}")
        logger.info(f"  - Expected count: {len(page_requests)}")
        
        if len(results) != len(page_requests):
            logger.warning(f"⚠️  Results count mismatch: got {len(results)}, expected {len(page_requests)}")
        
        return results
        
    except Exception as e:
        logger.error(f"Error in parallel generation: {str(e)}")
        
        if 'results' in locals() and results:
            logger.warning(f"Partial failure in parallel generation. Processing {len(results)} results despite error: {str(e)}")
            return results
        else:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"并行生成过程中发生错误: {str(e)}"
            }))
            await websocket.close()
            raise


async def _process_generation_results(
    websocket: WebSocket,
    results: List,
    page_requests: List[Dict[str, Any]]
) -> tuple:
    """Process generation results and separate successful/failed pages"""
    await websocket.send_text(json.dumps({
        "type": "progress",
        "stage": "处理结果",
        "progress": 90,
        "message": "正在处理生成结果..."
    }))
    
    if not results:
        logger.error("Results variable not found, parallel generation may have failed completely")
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "并行生成未产生任何结果"
        }))
        await websocket.close()
        return {}, {}
    
    generated_pages = {}
    failed_pages = {}
    
    logger.info(f"📊 Processing {len(results)} results...")
    
    for i, result in enumerate(results):
        if i >= len(page_requests):
            logger.warning(f"Result index {i} exceeds page_requests length {len(page_requests)}")
            continue
            
        page = page_requests[i]["page"]
        
        if result is None:
            error_msg = "No result returned"
            failed_pages[page["id"]] = {
                "title": page["title"],
                "error": error_msg,
                "content": f"内容生成失败：{error_msg}"
            }
            logger.error(f"❌ Page {page['title']}: {error_msg}")
            
        elif isinstance(result, dict) and result.get("error"):
            error_msg = result.get("error", "Unknown error")
            failed_pages[page["id"]] = {
                "title": page["title"],
                "error": error_msg,
                "content": f"内容生成失败：{error_msg}"
            }
            logger.error(f"❌ Page {page['title']}: {error_msg}")
            
        elif result and isinstance(result, dict) and result.get("content"):
            content = _clean_content(result["content"])
            
            if not content or len(content) < 50:
                logger.warning(f"⚠️  Generated content too short for page '{page['title']}': {len(content)} chars")
                content = f"# {page['title']}\n\n生成的内容过短，可能存在问题。请稍后重试。"
            
            generated_pages[page["id"]] = {
                **page,
                "content": content
            }
            logger.info(f"✅ Page {page['title']}: {len(content)} chars generated")
            
        else:
            error_msg = "Empty or invalid content returned"
            failed_pages[page["id"]] = {
                "title": page["title"],
                "error": error_msg,
                "content": f"内容生成失败：{error_msg}"
            }
            logger.warning(f"⚠️  Page {page['title']}: {error_msg}")
    
    # Log statistics
    total_requested = len(page_requests)
    total_successful = len(generated_pages)
    total_failed = len(failed_pages)
    
    logger.info(f"📊 Processing completed:")
    logger.info(f"  - Total requested: {total_requested}")
    logger.info(f"  - Successfully generated: {total_successful}")
    logger.info(f"  - Failed: {total_failed}")
    logger.info(f"  - Success rate: {total_successful/total_requested*100:.1f}%")
    
    if total_successful == 0:
        logger.error("❌ No pages were generated successfully")
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "所有页面生成均失败，请检查网络连接和API配置"
        }))
        await websocket.close()
        return {}, {}
    elif total_failed > 0:
        logger.warning(f"⚠️  Partial success: {total_successful}/{total_requested} pages generated successfully")
    
    return generated_pages, failed_pages


def _clean_content(content: str) -> str:
    """Clean generated content by removing markdown code fences"""
    if content:
        content = content.strip()
        if content.startswith("```markdown"):
            content = content[11:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
    return content


async def _retry_failed_pages(
    websocket: WebSocket,
    failed_pages: Dict,
    page_requests: List[Dict[str, Any]],
    generated_pages: Dict,
    llm_service  # Injected: LLMService dependency
) -> tuple:
    """Retry failed pages with more conservative settings"""
    
    total_failed = len(failed_pages)
    logger.info(f"🔄 开始重试 {total_failed} 个失败页面...")
    
    await websocket.send_text(json.dumps({
        "type": "progress",
        "stage": "重试失败页面",
        "progress": 92,
        "message": f"正在重试 {total_failed} 个失败页面..."
    }))
    
    await asyncio.sleep(5)
    
    retry_requests = []
    retry_page_mapping = {}
    
    for page_id, failed_page_info in failed_pages.items():
        for req in page_requests:
            if req["page"]["id"] == page_id:
                retry_requests.append({
                    "prompt": req["prompt"],
                    "model_name": "gpt-4.1",
                    "temperature": 0.2,
                    "max_tokens": 65535
                })
                retry_page_mapping[len(retry_requests) - 1] = {
                    "page_id": page_id,
                    "page": req["page"]
                }
                break
    
    if retry_requests:
        try:
            # Use injected llm_service
            retry_results = llm_service.parallel_invoke(
                requests=retry_requests,
                max_concurrent_per_key=1,
                max_total_concurrent=min(3, len(retry_requests)),
                timeout=900.0
            )
            
            retry_success_count = 0
            
            for i, result in enumerate(retry_results):
                if i not in retry_page_mapping:
                    continue
                    
                page_info = retry_page_mapping[i]
                page_id = page_info["page_id"]
                original_page = page_info["page"]
                
                if result and not result.get("error") and result.get("content"):
                    content = _clean_content(result["content"])
                    
                    if content and len(content) >= 50:
                        if page_id in failed_pages:
                            del failed_pages[page_id]
                        
                        generated_pages[page_id] = {
                            **original_page,
                            "content": content
                        }
                        
                        retry_success_count += 1
                        logger.info(f"✅ 重试成功：{original_page['title']} ({len(content)} chars)")
            
            logger.info(f"🔄 重试结果：{retry_success_count} 个页面重试成功")
            logger.info(f"📊 最终统计：{len(generated_pages)} 成功，{len(failed_pages)} 失败")
            
        except Exception as retry_error:
            logger.error(f"重试过程中发生错误：{str(retry_error)}")
    
    return generated_pages, failed_pages


async def _send_final_results(
    websocket: WebSocket,
    generated_pages: Dict,
    failed_pages: Dict,
    compatible_structure: Dict[str, Any],
    request: WikiPageGenerationRequest,
    page_requests: List[Dict[str, Any]]
):
    """Send final results through WebSocket"""
    await websocket.send_text(json.dumps({
        "type": "progress",
        "stage": "完成处理",
        "progress": 95,
        "message": "正在保存结果..."
    }))
    
    total_requested = len(page_requests)
    total_successful = len(generated_pages)
    total_failed = len(failed_pages)
    
    result = {
        "success": total_successful > 0,
        "partial_success": total_successful > 0 and total_failed > 0,
        "message": f"完成并行Wiki页面生成：{total_successful}/{total_requested} 页面成功",
        "warning": f"有 {total_failed} 个页面生成失败，但其余页面已成功生成" if total_failed > 0 else None,
        "wiki_structure": compatible_structure,
        "generated_pages": generated_pages,
        "failed_pages": failed_pages,
        "stats": {
            "total_requested": total_requested,
            "total_successful": total_successful,
            "total_failed": total_failed,
            "parallel_processing": True,
            "max_concurrency": min(request.max_concurrent_pages or 5, len(page_requests), 10),
            "performance_improvement": "预计提升10倍速度（从串行5分钟/页面到并行1-2分钟总时间）",
            "llm_service_used": True,
            "success_rate": f"{total_successful/total_requested*100:.1f}%"
        },
        "repo_url": request.repo_url,
        "structure_info": {
            "has_sections": bool(compatible_structure.get("sections")),
            "sections_count": len(compatible_structure.get("sections", [])),
            "root_sections_count": len(compatible_structure.get("rootSections", [])),
            "pages_with_parent": len([p for p in compatible_structure.get("pages", []) if p.get("parent_section")]),
            "hierarchical_structure": compatible_structure.get("sections") is not None,
            "structure_type": "hierarchical" if compatible_structure.get("sections") else "flat"
        }
    }
    
    # Log final structure statistics
    _log_final_structure(compatible_structure)
    
    # Prepare final message
    if total_failed == 0:
        final_message = f"✅ 所有Wiki页面生成成功！共 {total_successful} 个页面"
    else:
        final_message = f"Wiki页面生成完成：{total_successful}/{total_requested} 页面成功"
        if total_failed > 0:
            final_message += f"，{total_failed} 个页面失败"
    
    # Send completion message
    if websocket.client_state.name != 'DISCONNECTED':
        await websocket.send_text(json.dumps({
            "type": "completed",
            "stage": "完成",
            "progress": 100,
            "message": final_message,
            "result": result
        }))
    else:
        logger.warning("WebSocket connection is closed, cannot send completion message")
    
    # Close connection
    if websocket.client_state.name != 'DISCONNECTED':
        await websocket.close()


def _log_final_structure(compatible_structure: Dict[str, Any]):
    """Log final wiki structure statistics"""
    logger.info(f"📊 最终Wiki结构统计:")
    logger.info(f"  - 总页面数: {len(compatible_structure.get('pages', []))}")
    logger.info(f"  - 章节数: {len(compatible_structure.get('sections', []))}")
    logger.info(f"  - 根章节数: {len(compatible_structure.get('rootSections', []))}")
    logger.info(f"  - 层级结构: {'是' if compatible_structure.get('sections') else '否'}")
    
    if compatible_structure.get("sections"):
        logger.info(f"📝 章节结构详情:")
        for section in compatible_structure.get("sections", []):
            section_id = section.get("id", "unknown")
            section_title = section.get("title", "未命名")
            section_pages = section.get("pages", [])
            logger.info(f"  - {section_id}: {section_title} ({len(section_pages)} 页面)")
    
    pages_with_parent = [p for p in compatible_structure.get("pages", []) if p.get("parent_section")]
    if pages_with_parent:
        logger.info(f"📋 页面层级关系:")
        for page in pages_with_parent:
            page_title = page.get("title", "未命名")
            parent_section = page.get("parent_section", "unknown")
            logger.info(f"  - {page_title} → {parent_section}")
    else:
        logger.warning("⚠️  没有找到页面层级关系，结构可能是扁平的")


def convert_enhanced_to_legacy_format(enhanced_structure: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert enhanced wiki structure to legacy-compatible format while preserving hierarchy.
    
    Args:
        enhanced_structure: Enhanced wiki structure with sections and pages
        
    Returns:
        Legacy-compatible wiki structure
    """
    try:
        legacy_structure = {
            "id": enhanced_structure.get("id", "wiki"),
            "title": enhanced_structure.get("title", "项目文档"),
            "description": enhanced_structure.get("description", "自动生成的项目文档"),
            "pages": []
        }
        
        # Preserve sections and rootSections
        if "sections" in enhanced_structure and enhanced_structure["sections"]:
            legacy_structure["sections"] = enhanced_structure["sections"]
        
        if "rootSections" in enhanced_structure and enhanced_structure["rootSections"]:
            legacy_structure["rootSections"] = enhanced_structure["rootSections"]
        
        # Build page-to-section mapping
        page_to_section_map = {}
        if legacy_structure.get("sections"):
            for section in legacy_structure["sections"]:
                section_id = section.get("id")
                section_pages = section.get("pages", [])
                for page_id in section_pages:
                    page_to_section_map[page_id] = section_id
            
            logger.info(f"🔗 建立页面章节映射: {len(page_to_section_map)} 个页面有章节关联")
        
        # Convert pages while preserving hierarchy fields
        for page in enhanced_structure.get("pages", []):
            legacy_page = {
                "id": page.get("id", ""),
                "title": page.get("title", ""),
                "content": page.get("content", ""),
                "filePaths": page.get("filePaths", []),
                "importance": page.get("importance", "medium"),
                "relatedPages": page.get("relatedPages", [])
            }
            
            # Preserve hierarchy fields
            for field in ["parentId", "children", "isSection", "sections"]:
                if field in page:
                    legacy_page[field] = page[field]
            
            # Set parent_section from mapping
            page_id = page.get("id")
            if page_id in page_to_section_map:
                legacy_page["parent_section"] = page_to_section_map[page_id]
            elif "parent_section" in page:
                legacy_page["parent_section"] = page["parent_section"]
            
            legacy_structure["pages"].append(legacy_page)
        
        # Establish parent-child relationships between pages
        _establish_page_relationships(legacy_structure)
        
        # Fallback: create sections if none exist
        if not legacy_structure.get("sections") and legacy_structure.get("pages"):
            _create_fallback_sections(legacy_structure)
        
        # Log conversion statistics
        _log_conversion_statistics(legacy_structure)
        
        return legacy_structure
        
    except Exception as e:
        logger.error(f"Error converting to legacy format: {str(e)}")
        return {
            "id": "fallback_wiki",
            "title": "项目文档",
            "description": "生成过程中出现错误，返回基本结构",
            "pages": []
        }


def _establish_page_relationships(legacy_structure: Dict[str, Any]):
    """Establish parent-child relationships between pages within each section"""
    logger.info("🔗 开始建立页面间的父子关系...")
    
    # Group pages by section
    pages_by_section = {}
    for page in legacy_structure["pages"]:
        parent_section = page.get("parent_section")
        if parent_section:
            if parent_section not in pages_by_section:
                pages_by_section[parent_section] = []
            pages_by_section[parent_section].append(page)
    
    # Establish hierarchy within each section
    for section_id, section_pages in pages_by_section.items():
        if len(section_pages) > 1:
            high_importance_pages = [p for p in section_pages if p.get("importance") == "high"]
            other_pages = [p for p in section_pages if p.get("importance") != "high"]
            
            if high_importance_pages and other_pages:
                parent_page = high_importance_pages[0]
                parent_id = parent_page["id"]
                child_ids = []
                
                for child_page in other_pages:
                    child_page["parentId"] = parent_id
                    child_ids.append(child_page["id"])
                    logger.info(f"📌 设置页面层级关系: {child_page['title']} → {parent_page['title']}")
                
                parent_page["children"] = child_ids
                parent_page["isSection"] = True
                
                logger.info(f"📋 章节 {section_id} 建立层级关系:")
                logger.info(f"  - 父页面: {parent_page['title']} ({len(child_ids)} 个子页面)")
            
            elif len(section_pages) > 1:
                pages_sorted = sorted(section_pages, key=lambda p: p.get("title", ""))
                parent_page = pages_sorted[0]
                parent_id = parent_page["id"]
                child_pages = pages_sorted[1:]
                child_ids = []
                
                for child_page in child_pages:
                    child_page["parentId"] = parent_id
                    child_ids.append(child_page["id"])
                
                parent_page["children"] = child_ids
                parent_page["isSection"] = True


def _create_fallback_sections(legacy_structure: Dict[str, Any]):
    """Create fallback sections based on parent_section information"""
    legacy_structure["sections"] = []
    legacy_structure["rootSections"] = []
    
    pages_by_section = {}
    for page in legacy_structure["pages"]:
        parent_section = page.get("parent_section")
        if parent_section:
            if parent_section not in pages_by_section:
                pages_by_section[parent_section] = []
            pages_by_section[parent_section].append(page["id"])
    
    for section_id, page_ids in pages_by_section.items():
        section = {
            "id": section_id,
            "title": section_id.replace("-", " ").replace("_", " ").title(),
            "description": f"包含{len(page_ids)}个页面的章节",
            "pages": page_ids,
            "subsections": [],
            "parent_section": None
        }
        legacy_structure["sections"].append(section)
        legacy_structure["rootSections"].append(section_id)


def _log_conversion_statistics(legacy_structure: Dict[str, Any]):
    """Log conversion statistics"""
    pages_with_section = [p for p in legacy_structure.get("pages", []) if p.get("parent_section")]
    pages_with_parent = [p for p in legacy_structure.get("pages", []) if p.get("parentId")]
    pages_with_children = [p for p in legacy_structure.get("pages", []) if p.get("children")]
    total_pages = len(legacy_structure.get("pages", []))
    
    logger.info(f"✅ 转换完成：")
    logger.info(f"  - 保留了 {len(legacy_structure.get('sections', []))} 个章节")
    logger.info(f"  - 处理了 {total_pages} 个页面")
    logger.info(f"  - 其中 {len(pages_with_section)} 个页面有章节关联")
    logger.info(f"  - 其中 {len(pages_with_parent)} 个页面有父页面")
    logger.info(f"  - 其中 {len(pages_with_children)} 个页面有子页面")
    if total_pages > 0:
        logger.info(f"  - 章节关联率: {len(pages_with_section)/total_pages*100:.1f}%")
        logger.info(f"  - 层级关系覆盖率: {len(pages_with_parent)/total_pages*100:.1f}%")


async def execute_layered_rag_queries(
    queries: List[str],
    shared_rag,
    language: str = "zh",
    max_docs_per_query: int = 20
) -> List:
    """
    Execute layered RAG queries and merge results.
    
    Args:
        queries: List of queries to execute
        shared_rag: Shared RAG instance
        language: Language for queries
        max_docs_per_query: Maximum documents per query
        
    Returns:
        Merged and deduplicated document list
    """
    try:
        all_documents = []
        
        for i, query in enumerate(queries, 1):
            try:
                logger.info(f"Executing layer {i} query: {query}")
                retrieved_documents = shared_rag(query, language=language)
                
                if retrieved_documents and retrieved_documents[0].documents:
                    layer_docs = retrieved_documents[0].documents[:max_docs_per_query]
                    all_documents.extend(layer_docs)
                    logger.info(f"Layer {i} retrieved {len(layer_docs)} documents")
                else:
                    logger.warning(f"Layer {i} query returned no documents")
                    
            except Exception as e:
                logger.error(f"Error in layer {i} query: {str(e)}")
                continue
        
        # Deduplicate and rank
        final_documents = deduplicate_and_rank_documents(all_documents, max_docs=30)
        
        logger.info(f"Layered RAG completed: {len(queries)} queries → {len(all_documents)} total docs → {len(final_documents)} final docs")
        return final_documents
        
    except Exception as e:
        logger.error(f"Error in layered RAG execution: {str(e)}")
        return []


def construct_layered_rag_queries(
    page: Dict[str, Any],
    wiki_structure: Dict[str, Any],
    repo_name: str = "repository"
) -> List[str]:
    """
    Construct layered RAG queries focused on different dimensions.
    
    Args:
        page: Page information
        wiki_structure: Wiki structure information
        repo_name: Repository name
        
    Returns:
        List of focused queries
    """
    try:
        page_title = page.get("title", "")
        file_paths = page.get("filePaths", [])
        importance = page.get("importance", "medium")
        related_pages = page.get("relatedPages", [])
        parent_section = page.get("parent_section", "")
        is_section = page.get("isSection", False)
        
        # Find section info
        section_info = None
        if parent_section:
            sections = wiki_structure.get("sections", [])
            for section in sections:
                if section.get("id") == parent_section:
                    section_info = section
                    break
        
        queries = []
        
        # Layer 1: Core content query
        if file_paths:
            core_files = ", ".join(file_paths[:3])
            if is_section:
                core_query = f"Implementation details and core functionality in {core_files} for {page_title} section overview"
            else:
                core_query = f"Implementation details, code structure and core functionality in {core_files} for {page_title}"
            queries.append(core_query)
        else:
            if is_section:
                core_query = f"Core components and implementation overview for {page_title} section"
            else:
                core_query = f"Implementation and functionality details for {page_title}"
            queries.append(core_query)
        
        # Layer 2: Architecture query (based on importance)
        if importance == "high" or is_section:
            arch_query = f"Architecture integration, dependencies, and system interactions for {page_title}"
            queries.append(arch_query)
        elif importance == "medium":
            arch_query = f"Integration patterns and dependencies for {page_title}"
            queries.append(arch_query)
        
        # Layer 3: Context query
        context_parts = []
        
        if section_info:
            section_title = section_info.get("title", "")
            if section_title:
                context_parts.append(f"components in {section_title} section")
        
        if related_pages:
            related_titles = []
            for related_id in related_pages[:2]:
                for p in wiki_structure.get("pages", []):
                    if p.get("id") == related_id:
                        related_title = p.get("title", "")
                        if related_title:
                            related_titles.append(related_title)
                        break
            
            if related_titles:
                context_parts.append(f"related to {', '.join(related_titles)}")
        
        if page.get("parentId"):
            for p in wiki_structure.get("pages", []):
                if p.get("id") == page.get("parentId"):
                    parent_title = p.get("title", "")
                    if parent_title:
                        context_parts.append(f"sub-component of {parent_title}")
                    break
        
        if page.get("children"):
            child_count = len(page.get("children", []))
            context_parts.append(f"parent component with {child_count} child components")
        
        if context_parts:
            context_query = f"Context and background information for {page_title} " + " and ".join(context_parts)
            queries.append(context_query)
        
        # Add repository context
        optimized_queries = []
        for query in queries:
            optimized_query = f"{query} in {repo_name} repository"
            optimized_queries.append(optimized_query)
        
        logger.info(f"Generated {len(optimized_queries)} layered queries for '{page_title}':")
        for i, query in enumerate(optimized_queries, 1):
            logger.info(f"  Layer {i}: {query}")
            
        return optimized_queries
        
    except Exception as e:
        logger.error(f"Error constructing layered RAG queries for page '{page.get('title', '')}': {str(e)}")
        page_title = page.get("title", "")
        file_paths = page.get("filePaths", [])
        fallback_query = f"Implementation and details for {page_title}"
        if file_paths:
            fallback_query += f" in files {', '.join(file_paths[:2])}"
        return [fallback_query]


def deduplicate_and_rank_documents(all_documents: List, max_docs: int = 30) -> List:
    """
    Deduplicate and rank documents, returning the most relevant ones.
    
    Args:
        all_documents: All retrieved documents
        max_docs: Maximum number of documents to return
        
    Returns:
        Deduplicated and ranked document list
    """
    try:
        if not all_documents:
            return []
        
        # Hash-based deduplication
        seen_content = set()
        unique_documents = []
        
        for doc in all_documents:
            doc_id = None
            if hasattr(doc, 'text') and doc.text:
                # Use first 200 characters as unique identifier
                doc_id = hash(doc.text[:200])
            elif hasattr(doc, 'meta_data') and doc.meta_data:
                # Use file path and line number
                file_path = doc.meta_data.get('file_path', '')
                line_info = doc.meta_data.get('line_start', 0)
                doc_id = hash(f"{file_path}:{line_info}")
            
            if doc_id is not None and doc_id not in seen_content:
                seen_content.add(doc_id)
                unique_documents.append(doc)
        
        # Rank by document length (longer documents usually contain more information)
        ranked_documents = sorted(
            unique_documents, 
            key=lambda d: len(d.text) if hasattr(d, 'text') else 0, 
            reverse=True
        )
        
        result = ranked_documents[:max_docs]
        
        logger.info(f"Document deduplication: {len(all_documents)} → {len(unique_documents)} → {len(result)}")
        return result
        
    except Exception as e:
        logger.error(f"Error in document deduplication: {str(e)}")
        return all_documents[:max_docs]

