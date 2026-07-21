from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
import importlib
import logging
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence, Tuple

from adalflow.core.component import DataComponent
from adalflow.components.data_process import TextSplitter
from adalflow.core.types import Document

logger = logging.getLogger(__name__)

_DEFINITION_TYPE_KEYWORDS = frozenset(
    (
        "function",
        "method",
        "class",
        "interface",
        "struct",
        "enum",
        "trait",
        "impl",
        "module",
        "namespace",
        "type",
    )
)

# Language-specific queries for identifying definitions
_DEFINITION_QUERIES = {
    "python": """
        (class_definition) @definition
        (function_definition) @definition
    """,
    "javascript": """
        (class_declaration) @definition
        (function_declaration) @definition
        (method_definition) @definition
        (arrow_function) @definition
    """,
    "typescript": """
        (class_declaration) @definition
        (function_declaration) @definition
        (method_definition) @definition
        (interface_declaration) @definition
        (type_alias_declaration) @definition
        (enum_declaration) @definition
    """,
    "tsx": """
        (class_declaration) @definition
        (function_declaration) @definition
        (method_definition) @definition
        (interface_declaration) @definition
        (type_alias_declaration) @definition
        (enum_declaration) @definition
    """,
    "java": """
        (class_declaration) @definition
        (interface_declaration) @definition
        (enum_declaration) @definition
        (method_declaration) @definition
        (constructor_declaration) @definition
    """,
    "cpp": """
        (class_specifier) @definition
        (struct_specifier) @definition
        (enum_specifier) @definition
        (function_definition) @definition
    """,
    "rust": """
        (struct_item) @definition
        (enum_item) @definition
        (function_item) @definition
        (impl_item) @definition
        (trait_item) @definition
        (mod_item) @definition
    """,
    "go": """
        (type_declaration) @definition
        (function_declaration) @definition
        (method_declaration) @definition
    """,
}

_NON_DEFINITION_KEYWORDS = frozenset(
    (
        "call",
        "argument",
        "parameter",
        "pointer",
        "reference",
        "expression",
        "access",
        "template",
    )
)
_EXT_TO_LANGUAGE: Dict[str, str] = {
    "py": "python",
    "js": "javascript",
    "jsx": "javascript",
    "ts": "typescript",
    "tsx": "tsx",
    "java": "java",
    "c": "c",
    "h": "c",
    "cpp": "cpp",
    "hpp": "cpp",
    "cc": "cpp",
    "cs": "c_sharp",
    "go": "go",
    "rs": "rust",
    "php": "php",
    "rb": "ruby",
    "swift": "swift",
    "kt": "kotlin",
    "kts": "kotlin",
    "scala": "scala",
    "lua": "lua",
    "sh": "bash",
}


@dataclass(frozen=True)
class CodeSplitterConfig:
    chunk_size_lines: int = 200
    chunk_overlap_lines: int = 20
    min_chunk_lines: int = 5
    max_recursion_depth: int = 256
    enabled: bool = True


def _safe_import_tree_sitter() -> Tuple[Optional[Callable[..., Any]], Optional[Callable[..., Any]]]:
    """Safely import and return the `get_parser` and `get_language` functions from tree_sitter_languages."""
    try:
        # The module name used by tree-sitter-languages on most installs
        mod = importlib.import_module("tree_sitter_languages")
        get_parser = getattr(mod, "get_parser", None)
        get_language = getattr(mod, "get_language", None)
        return get_parser, get_language
    except ImportError:
        logger.debug("`tree_sitter_languages` not found. Tree-sitter parsing will be unavailable.")

    return None, None


_BLOCK_LIKE_NODE_TYPES = frozenset(
    ("block", "declaration_list", "class_body", "statement_block", "member_specialization_list")
)


def _iter_definition_like_nodes(root_node: Any) -> Iterable[Any]:
    for child in getattr(root_node, "children", []):
        if not getattr(child, "is_named", False):
            continue
        node_type = getattr(child, "type", "")

        # Prioritize recursing into block-like nodes to find actual definitions
        if node_type in _BLOCK_LIKE_NODE_TYPES:
            yield from _iter_definition_like_nodes(child)
            continue

        # Split node type into words to avoid partial matches on keywords.
        lowered_parts = set(node_type.lower().replace("_", " ").split())

        # If this node itself is a definition, yield it
        if not lowered_parts.isdisjoint(_DEFINITION_TYPE_KEYWORDS) and lowered_parts.isdisjoint(
            _NON_DEFINITION_KEYWORDS
        ):
            yield child


def _split_lines_with_overlap(
    lines: List[str], *, chunk_size_lines: int, chunk_overlap_lines: int
) -> List[Tuple[List[str], int]]:
    if chunk_size_lines <= 0:
        return [(lines, 0)]

    overlap = max(0, min(chunk_overlap_lines, chunk_size_lines - 1))
    chunks: List[Tuple[List[str], int]] = []
    start = 0
    n = len(lines)

    while start < n:
        end = min(n, start + chunk_size_lines)
        chunks.append((lines[start:end], start))
        if end >= n:
            break
        start = end - overlap

    return chunks


def _slice_text_by_bytes_preencoded(text_bytes: bytes, start_byte: int, end_byte: int) -> str:
    return text_bytes[start_byte:end_byte].decode("utf-8", errors="replace")


def _byte_offset_to_line_preencoded(text_bytes: bytes, byte_offset: int) -> int:
    prefix = text_bytes[:max(0, byte_offset)]
    return prefix.count(b"\n") + 1


class TreeSitterCodeSplitter:
    def __init__(
        self,
        *,
        chunk_size_lines: int = 200,
        chunk_overlap_lines: int = 20,
        min_chunk_lines: int = 5,
        max_recursion_depth: int = 256,
        enabled: bool = True,
    ) -> None:
        self.config = CodeSplitterConfig(
            chunk_size_lines=chunk_size_lines,
            chunk_overlap_lines=chunk_overlap_lines,
            min_chunk_lines=min_chunk_lines,
            max_recursion_depth=max_recursion_depth,
            enabled=enabled,
        )
        self._get_parser, self._get_language = _safe_import_tree_sitter()

    def split_document(self, doc: Document) -> List[Document]:
        if not self.config.enabled:
            return [doc]

        meta = getattr(doc, "meta_data", {}) or {}
        if not meta.get("is_code"):
            return [doc]

        file_type = (meta.get("type") or "").lower().lstrip(".")
        return self._split_code_text(doc.text or "", meta, file_type)

    def _get_language_name_candidates(self, file_type: str) -> List[str]:
        mapped = _EXT_TO_LANGUAGE.get(file_type)
        candidates: List[str] = []
        if mapped:
            candidates.append(mapped)
        if file_type and file_type not in candidates:
            candidates.append(file_type)
        return candidates

    def _try_get_parser(self, file_type: str) -> Any:
        if self._get_parser is None:
            return None

        for name in self._get_language_name_candidates(file_type):
            try:
                return self._get_parser(name)
            except Exception as e:
                logger.debug("Failed to get parser for language '%s': %s", name, e)
                continue
        return None

    def _split_code_text(self, text: str, meta: Dict[str, Any], file_type: str) -> List[Document]:
        parser = self._try_get_parser(file_type)
        if parser is None:
            return self._fallback_line_split(text, meta)

        text_bytes = text.encode("utf-8", errors="replace")
        try:
            tree = parser.parse(text_bytes)
        except Exception as e:
            logger.warning("Tree-sitter parsing failed for file_type '%s', falling back. Error: %s", file_type, e)
            return self._fallback_line_split(text, meta)

        root = getattr(tree, "root_node", None)
        if root is None:
            return self._fallback_line_split(text, meta)

        # Try symbolic query first
        nodes = []
        if self._get_language:
            for name in self._get_language_name_candidates(file_type):
                query_scm = _DEFINITION_QUERIES.get(name)
                if query_scm:
                    try:
                        lang = self._get_language(name)
                        query = lang.query(query_scm)
                        captures = query.captures(root)
                        # Filter for top-level or direct child definitions found by query
                        # Tree-sitter query returns all matches in the tree.
                        # We want the ones that are "top-level" relative to our current splitting scope.
                        nodes = [node for node, tag in captures if tag == "definition"]
                        if nodes:
                            logger.debug("Found %d definition nodes for '%s' using symbolic query.", len(nodes), name)
                            break
                    except Exception as e:
                        logger.debug("Symbolic query failed for language '%s': %s", name, e)

        # Fallback to heuristic if no nodes found via query
        if not nodes:
            nodes = list(_iter_definition_like_nodes(root))

        if not nodes:
            return self._fallback_line_split(text, meta)

        docs: List[Document] = []
        for node in nodes:
            node_docs = self._split_node_recursively(node, text_bytes, meta, depth=0)
            docs.extend(node_docs)

        if not docs:
            return self._fallback_line_split(text, meta)
        else:
            return self._add_chunk_metadata(docs)

    def _split_node_recursively(self, node: Any, text_bytes: bytes, meta: Dict[str, Any], depth: int) -> List[Document]:
        try:
            start_b = int(getattr(node, "start_byte"))
            end_b = int(getattr(node, "end_byte"))
        except (AttributeError, ValueError, TypeError) as e:
            logger.debug("Could not extract byte offsets from node: %s", e)
            return []

        snippet = _slice_text_by_bytes_preencoded(text_bytes, start_b, end_b)
        start_line = _byte_offset_to_line_preencoded(text_bytes, start_b)
        snippet_lines = snippet.splitlines(True)

        # If node fits in chunk size, return it as-is (no min_chunk_lines filter for semantic nodes)
        if len(snippet_lines) <= self.config.chunk_size_lines:
            return [self._make_chunk_doc(snippet, meta, start_line)]

        # Check recursion depth limit
        if depth >= self.config.max_recursion_depth:
            logger.warning("Max recursion depth (%d) reached for node at line %d, falling back to line-based splitting.", 
                           self.config.max_recursion_depth, start_line)
            return self._line_split_snippet(snippet, snippet_lines, meta, start_line)

        # Node is too large, try to split by child nodes
        child_nodes = list(_iter_definition_like_nodes(node))
        if child_nodes:
            docs: List[Document] = []
            
            # Extract parent node WITHOUT child nodes to preserve its context.
            # This is crucial for both container nodes (like classes) and other large
            # nodes (like functions) that are split due to containing nested definitions.
            parent_parts = []
            current_pos = start_b
            
            for child in child_nodes:
                child_start = int(getattr(child, "start_byte"))
                child_end = int(getattr(child, "end_byte"))
                
                # Add text before this child (header, members, etc.)
                if child_start > current_pos:
                    part = _slice_text_by_bytes_preencoded(text_bytes, current_pos, child_start)
                    parent_parts.append(part)
                
                # Skip the child node itself
                current_pos = child_end
            
            # Add any remaining text after last child (closing braces, etc.)
            if current_pos < end_b:
                part = _slice_text_by_bytes_preencoded(text_bytes, current_pos, end_b)
                parent_parts.append(part)
            
            # Create parent chunk only if it has meaningful content (not just whitespace)
            parent_text = "".join(parent_parts)
            if parent_text.strip():  # Only add if there's non-whitespace content
                docs.append(self._make_chunk_doc(parent_text, meta, start_line))
            
            # Then recursively process child nodes (no min_chunk_lines filter)
            for child in child_nodes:
                child_docs = self._split_node_recursively(child, text_bytes, meta, depth + 1)
                docs.extend(child_docs)
            
            return docs

        # No child nodes found, fall back to line-based splitting
        return self._line_split_snippet(snippet, snippet_lines, meta, start_line)

    def _line_split_snippet(self, snippet: str, snippet_lines: List[str], meta: Dict[str, Any], start_line: int) -> List[Document]:
        docs: List[Document] = []
        for sub, sub_start_idx in _split_lines_with_overlap(
            snippet_lines,
            chunk_size_lines=self.config.chunk_size_lines,
            chunk_overlap_lines=self.config.chunk_overlap_lines,
        ):
            sub_text = "".join(sub)
            docs.append(self._make_chunk_doc(sub_text, meta, start_line + sub_start_idx))
        return docs

    def _add_chunk_metadata(self, docs: List[Document]) -> List[Document]:
        for i, d in enumerate(docs):
            d.meta_data["chunk_index"] = i
            d.meta_data["chunk_total"] = len(docs)
        return docs

    def _fallback_line_split(self, text: str, meta: Dict[str, Any]) -> List[Document]:
        lines = text.splitlines(True)
        docs: List[Document] = []
        for sub, start_idx in _split_lines_with_overlap(
            lines,
            chunk_size_lines=self.config.chunk_size_lines,
            chunk_overlap_lines=self.config.chunk_overlap_lines,
        ):
            sub_text = "".join(sub)
            if len(sub) < self.config.min_chunk_lines:
                continue
            start_line = 1 + start_idx
            docs.append(self._make_chunk_doc(sub_text, meta, start_line))

        if not docs:
            return [Document(text=text, meta_data=deepcopy(meta))]
        else:
            return self._add_chunk_metadata(docs)

    def _make_chunk_doc(self, chunk_text: str, meta: Dict[str, Any], start_line: int) -> Document:
        new_meta = deepcopy(meta)
        new_meta["chunk_start_line"] = start_line
        file_path = new_meta.get("file_path")
        if file_path:
            new_meta["title"] = str(file_path)
        return Document(text=chunk_text, meta_data=new_meta)


class CodeAwareSplitter(DataComponent):
    def __init__(
        self,
        *,
        text_splitter: TextSplitter,
        code_splitter: TreeSitterCodeSplitter,
    ) -> None:
        super().__init__()
        self._text_splitter = text_splitter
        self._code_splitter = code_splitter

    def __call__(self, documents: Sequence[Document]) -> Sequence[Document]:
        output: List[Document] = []
        for doc in documents:
            meta = getattr(doc, "meta_data", {}) or {}
            file_path = meta.get("file_path") or meta.get("title") or "<unknown>"
            is_code = bool(meta.get("is_code"))
            logger.info("Splitting document: %s (is_code=%s)", file_path, is_code)
            if is_code:
                chunks = self._code_splitter.split_document(doc)
                logger.info("Split result: %s -> %d chunks (code)", file_path, len(chunks))
                output.extend(chunks)
            else:
                logger.info("TextSplitter start: %s", file_path)
                chunks = list(self._text_splitter([doc]))
                logger.info("TextSplitter result: %s -> %d chunks", file_path, len(chunks))
                output.extend(chunks)
        return output

    def to_dict(self) -> Dict[str, Any]:
        return {
            "text_splitter": self._text_splitter.to_dict() if hasattr(self._text_splitter, "to_dict") else None,
            "code_splitter_config": {
                "chunk_size_lines": self._code_splitter.config.chunk_size_lines,
                "chunk_overlap_lines": self._code_splitter.config.chunk_overlap_lines,
                "min_chunk_lines": self._code_splitter.config.min_chunk_lines,
                "max_recursion_depth": self._code_splitter.config.max_recursion_depth,
                "enabled": self._code_splitter.config.enabled,
            }
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "CodeAwareSplitter":
        text_splitter_data = data.get("text_splitter")
        text_splitter = TextSplitter.from_dict(text_splitter_data) if text_splitter_data else TextSplitter()
        code_config = data.get("code_splitter_config", {})
        code_splitter = TreeSitterCodeSplitter(**code_config)
        return cls(text_splitter=text_splitter, code_splitter=code_splitter)
