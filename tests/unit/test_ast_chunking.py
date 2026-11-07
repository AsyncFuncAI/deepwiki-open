from adalflow.core.types import Document

from api import enable_ast
from api.ast_integration import ASTTextSplitter
from api.rag import pipeline


def test_ast_splitter_creates_semantic_chunks_with_line_metadata():
    document = Document(
        text=(
            "class Calculator:\n"
            "    def add(self, left, right):\n"
            "        return left + right\n\n"
            "    def multiply(self, left, right):\n"
            "        return left * right\n"
        ),
        meta_data={"file_path": "calculator.py"},
    )

    chunks = ASTTextSplitter(
        chunk_size=2000,
        min_chunk_size=1,
        overlap_lines=0,
    ).call([document])

    assert chunks
    assert all(chunk.meta_data["start_line"] > 0 for chunk in chunks)
    assert any(chunk.meta_data["chunk_type"] == "class" for chunk in chunks)


def test_ast_environment_flag_selects_ast_config(monkeypatch):
    monkeypatch.setenv("DEEPWIKI_AST_CHUNKING", "true")

    splitter = pipeline._prepare_text_splitter(
        {"split_by": "word", "chunk_size": 350, "chunk_overlap": 100}
    )

    assert isinstance(splitter, ASTTextSplitter)
    assert splitter.chunk_size == 2000


def test_ast_toggle_preserves_embedder_settings(tmp_path, monkeypatch):
    embedder_config = tmp_path / "embedder.json"
    ast_config = tmp_path / "embedder.ast.json"
    backup_config = tmp_path / "embedder.json.backup"
    embedder_config.write_text(
        '{"embedder": {"client_class": "OpenAIClient"}, '
        '"text_splitter": {"split_by": "word"}}',
        encoding="utf-8",
    )
    ast_config.write_text(
        '{"text_splitter": {"split_by": "ast"}, '
        '"fallback": {"split_by": "word"}}',
        encoding="utf-8",
    )
    monkeypatch.setattr(enable_ast, "EMBEDDER_CONFIG", embedder_config)
    monkeypatch.setattr(enable_ast, "AST_CONFIG", ast_config)
    monkeypatch.setattr(enable_ast, "BACKUP_CONFIG", backup_config)

    assert enable_ast.enable_ast_chunking()
    enabled = enable_ast._load_config(embedder_config)
    assert enabled["text_splitter"]["split_by"] == "ast"
    assert enabled["embedder"]["client_class"] == "OpenAIClient"

    assert enable_ast.disable_ast_chunking()
    disabled = enable_ast._load_config(embedder_config)
    assert disabled["text_splitter"]["split_by"] == "word"
    assert disabled["embedder"]["client_class"] == "OpenAIClient"
    assert not backup_config.exists()
