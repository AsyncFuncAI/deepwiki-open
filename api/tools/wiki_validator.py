"""
Wiki Structure Validator

Validates wiki structure input to ensure data integrity before processing.
"""

from typing import Dict, Any
from .wiki_exceptions import ValidationError


class WikiStructureValidator:
    """验证 wiki 结构的有效性"""
    
    @staticmethod
    def validate_wiki_structure(structure: Dict[str, Any]) -> None:
        """
        验证 wiki 结构，失败时抛出 ValidationError
        
        Args:
            structure: Wiki 结构字典
            
        Raises:
            ValidationError: 如果结构无效
        """
        if not isinstance(structure, dict):
            raise ValidationError("wiki_structure must be a dictionary")
        
        # 验证必需字段
        if "pages" not in structure:
            raise ValidationError("Missing required field: pages")
        
        pages = structure.get("pages", [])
        if not isinstance(pages, list):
            raise ValidationError("'pages' must be a list")
        
        if len(pages) == 0:
            raise ValidationError("'pages' list cannot be empty")
        
        # 验证每个页面的结构
        for idx, page in enumerate(pages):
            if not isinstance(page, dict):
                raise ValidationError(f"Page at index {idx} must be a dictionary")
            
            required_page_fields = ["id", "title"]
            for field in required_page_fields:
                if field not in page:
                    raise ValidationError(
                        f"Page at index {idx} missing required field: {field}"
                    )
            
            # 验证字段类型
            if not isinstance(page.get("id"), str):
                raise ValidationError(f"Page at index {idx} 'id' must be a string")
            
            if not isinstance(page.get("title"), str):
                raise ValidationError(f"Page at index {idx} 'title' must be a string")
        
        # 验证可选的 sections 字段
        if "sections" in structure:
            sections = structure["sections"]
            if not isinstance(sections, list):
                raise ValidationError("'sections' must be a list")
            
            # 验证每个 section 的结构
            for idx, section in enumerate(sections):
                if not isinstance(section, dict):
                    raise ValidationError(f"Section at index {idx} must be a dictionary")
                
                if "id" not in section:
                    raise ValidationError(f"Section at index {idx} missing required field: id")
                
                if "pages" in section:
                    section_pages = section["pages"]
                    if not isinstance(section_pages, list):
                        raise ValidationError(
                            f"Section at index {idx} 'pages' must be a list"
                        )

