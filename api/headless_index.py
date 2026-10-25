"""Memory-bounded initial indexing with independently saved LocalDB parts."""
from contextlib import redirect_stdout
import hashlib
import json
from pathlib import Path
import sys
import time

from api.config import configs, get_embedder_config, get_embedder_type, iterate_files
from api.rag.pipeline import read_all_documents, transform_documents_and_save_to_db
from adalflow.core.db import LocalDB
from api.saved_index import load_saved_part


def write_json(path, value):
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=2))
    temporary.replace(path)


def index_configuration():
    embedder_config = get_embedder_config()
    identity = {
        "provider": get_embedder_type(), "embedding": embedder_config["model_kwargs"],
        "splitter": configs["text_splitter"], "extensions": configs.get("scan_extensions"),
        "filenames": configs.get("scan_filenames"), "format": 1,
    }
    from api.syntax_chunks import chunk_strategy
    if chunk_strategy()!='token':
        from importlib.metadata import version
        identity["chunk_strategy"]=chunk_strategy()
        identity["syntax_parser"]={"tree_sitter":version("tree-sitter"),"tree_sitter_c":version("tree-sitter-c"),"python_ast":list(sys.version_info[:2])}
    return identity


def index_directory(root, storage_root):
    if getattr(root,'portable',False):return root.storage_path(storage_root)/'index'
    identity = index_configuration()
    fingerprint = hashlib.sha256(json.dumps(identity, sort_keys=True).encode()).hexdigest()[:16]
    return root.storage_path(storage_root) / ("parts-" + fingerprint)


def build_root(root, storage_root, progress=None):
    """Build all selected source files; reuse identical saved parts on retry."""
    from api.headless_settings import require_writable
    require_writable([root])
    files = sorted(iterate_files(str(root.path), **root.filters))
    files = [name for name in files if (root.path / name).resolve().is_relative_to(root.path)]
    identity = index_configuration()
    output = index_directory(root, storage_root)
    output.mkdir(parents=True, exist_ok=True)
    groups = []; batch = []; size = 0
    for name in files:
        current_size = (root.path / name).stat().st_size
        if batch and (size + current_size > 2_000_000 or len(batch) >= 50):
            groups.append(batch); batch = []; size = 0
        batch.append(name); size += current_size
    if batch:
        groups.append(batch)
    manifest = {"id": root.id, "source": str(root.path), "state": "indexing", "configuration": identity,
                "selected_files": len(files), "indexed_files": 0, "chunks": 0, "parts": [], "skipped": []}
    for group_no, group in enumerate(groups):
        docs = read_all_documents(str(root.path), file_paths=group, full_source=True)
        read_names = {doc.meta_data["file_path"] for doc in docs}
        manifest["skipped"].extend(name for name in group if name not in read_names)
        digest = hashlib.sha256()
        digest.update(json.dumps(identity,sort_keys=True).encode())
        for doc in docs:
            digest.update(doc.meta_data["file_path"].encode()); digest.update(b"\0")
            digest.update(doc.text.encode()); digest.update(b"\0")
            doc.meta_data["repository_id"] = root.id
            doc.meta_data["source_root"] = str(root.path)
            if identity.get("chunk_strategy"):doc.meta_data["chunk_strategy"]=identity["chunk_strategy"]
        part = output / (digest.hexdigest() + ".pkl")
        if part.exists():
            db = load_saved_part(str(part))
        else:
            temporary = part.with_suffix(".pkl.building")
            with redirect_stdout(sys.stderr):
                db = transform_documents_and_save_to_db(docs,str(temporary))
            chunks = db.get_transformed_data(key="split_and_embed")
            if docs and not chunks:
                raise ValueError("Embedding pipeline returned no chunks")
            if any(getattr(chunk,"vector",None) is None or len(chunk.vector)==0 for chunk in chunks):
                raise ValueError("Embedding pipeline returned missing vectors")
            temporary.replace(part)
        chunks = db.get_transformed_data(key="split_and_embed")
        if any(getattr(chunk,"vector",None) is None or len(chunk.vector)==0 for chunk in chunks):
            raise ValueError("Saved part contains missing embeddings")
        manifest["parts"].append({"path":str(part),"files":len(docs),"chunks":len(chunks)})
        manifest["indexed_files"] += len(docs); manifest["chunks"] += len(chunks)
        write_json(output / "progress.json",manifest)
        if progress:
            progress({"id":root.id,"parts_done":group_no+1,"parts_total":len(groups),
                      "files_done":manifest["indexed_files"],"files_total":len(files),"chunks":manifest["chunks"]})
        del db, chunks, docs
    manifest["state"] = "ready" if not manifest["skipped"] else "partial"
    manifest["finished"] = time.time()
    if not manifest["chunks"]:
        raise ValueError("No source chunks indexed")
    write_json(output / "manifest.json",manifest)
    return manifest, output / "manifest.json"
