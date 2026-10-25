"""Headless indexing of explicit local scan roots (no HTTP server or GUI)."""

import argparse
from contextlib import redirect_stdout
from dataclasses import dataclass
import hashlib
import json
import os
import shlex
from pathlib import Path
import re
import sys
from typing import Callable


FILTERS = ("excluded_dirs", "excluded_files", "included_dirs", "included_files")


@dataclass(frozen=True)
class ScanRoot:
    id: str
    path: Path
    filters: dict[str, list[str]]
    portable: bool = False
    read_only: bool = False

    def storage_path(self, storage_root: Path) -> Path:
        if self.portable:return storage_root/'repositories'/self.id
        # A moved root or changed file selection must not reuse a stale index.
        identity = json.dumps(
            {"path": str(self.path), "filters": self.filters}, sort_keys=True
        )
        digest = hashlib.sha256(identity.encode()).hexdigest()[:16]
        return storage_root / f"{self.id}-{digest}"


def load_manifest(filename: Path) -> list[ScanRoot]:
    """Validate all entries before starting any indexing work."""
    data = json.loads(filename.read_text(encoding="utf-8"))
    return validate_manifest(data, filename.resolve().parent)


def validate_manifest(data: dict, base_dir: Path) -> list[ScanRoot]:
    if not isinstance(data, dict) or set(data) != {"repositories"}:
        raise ValueError("Manifest must contain only a repositories list")
    entries = data["repositories"]
    if not isinstance(entries, list) or not entries:
        raise ValueError("repositories must be a non-empty list")
    roots = []
    ids = set()
    for entry in entries:
        if not isinstance(entry, dict) or set(entry) - {"id", "path", *FILTERS}:
            raise ValueError("Each repository needs id, path, and optional file filters")
        repo_id = entry.get("id")
        if not isinstance(repo_id, str) or not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}", repo_id):
            raise ValueError("Repository id must be 1-64 letters, digits, underscores or hyphens")
        if repo_id in ids:
            raise ValueError(f"Duplicate repository id: {repo_id}")
        ids.add(repo_id)
        raw_path = entry.get("path")
        if not isinstance(raw_path, str) or not raw_path.strip():
            raise ValueError(f"Missing local path for {repo_id}")
        candidate = Path(raw_path).expanduser()
        path = (base_dir / candidate).resolve(strict=True)
        if not path.is_dir():
            raise ValueError(f"Scan root is not a directory: {path}")
        if any(path.is_relative_to(r.path) or r.path.is_relative_to(path) for r in roots):
            raise ValueError(f"Overlapping scan roots: {path}")
        filters = {}
        for key in FILTERS:
            value = entry.get(key, [])
            if not isinstance(value, list) or any(not isinstance(v, str) for v in value):
                raise ValueError(f"{key} must be a list of strings")
            filters[key] = sorted(set(value))
        roots.append(ScanRoot(repo_id, path, filters))
    return roots


def load_env_roots(filename: Path, storage_root=None) -> list[ScanRoot]:
    """Read scan settings only; unrelated .env settings are left untouched.

    Supports one-line values with optional shell-style quoting and comments.
    Environment variables override file values. No variable interpolation or
    shell execution is performed.
    """
    from api.headless_settings import runtime_paths
    data,_,read_only=runtime_paths(filename,storage_root)
    if (data/'catalog.json').exists():
        from api.portable_data import catalog_roots
        return catalog_roots(data,filename,read_only)
    keys = {"DEEPWIKI_SCAN_ROOT", "DEEPWIKI_SCAN_FOLDERS"}
    settings = {}
    if filename.exists():
        for line in filename.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("export "):
                line = line[7:].lstrip()
            key, separator, value = line.partition("=")
            key = key.strip()
            if not separator or key not in keys:
                continue
            # JSON arrays may be unquoted or enclosed in single quotes.
            value = value.strip()
            if value.startswith("["):
                settings[key] = value
            else:
                words = shlex.split(value, comments=True)
                if len(words) != 1:
                    raise ValueError(f"{key} must be a single value; quote paths containing spaces")
                settings[key] = words[0]
    settings.update({key: os.environ[key] for key in keys if key in os.environ})
    raw_root = settings.get("DEEPWIKI_SCAN_ROOT", "")
    if not raw_root.strip():
        raise ValueError("Set DEEPWIKI_SCAN_ROOT in .env or the environment")
    base = (filename.resolve().parent / Path(raw_root).expanduser()).resolve(strict=True)
    folders = json.loads(settings.get("DEEPWIKI_SCAN_FOLDERS", "[]"))
    if not isinstance(folders, list) or not folders:
        raise ValueError("DEEPWIKI_SCAN_FOLDERS must be a non-empty JSON list of relative folder paths")
    entries = []
    for folder in folders:
        if not isinstance(folder, str) or not folder.strip() or Path(folder).is_absolute():
            raise ValueError("Scan folders must be non-empty relative paths")
        path = (base / folder).resolve(strict=True)
        if not path.is_relative_to(base):
            raise ValueError("Scan folder resolves outside DEEPWIKI_SCAN_ROOT")
        relative = path.relative_to(base).as_posix()
        name = re.sub(r"[^a-zA-Z0-9_-]", "_", relative).strip("_") or "repo"
        repo_id = name[:48] + "-" + hashlib.sha256(relative.encode()).hexdigest()[:8]
        entries.append({"id": repo_id, "path": str(path)})
    roots=validate_manifest({"repositories": entries}, base)
    if read_only:
        from dataclasses import replace
        roots=[replace(root,read_only=True) for root in roots]
    return roots


def index_roots(
    roots: list[ScanRoot], storage_root: Path, manager_factory: Callable,
) -> list[dict]:
    """Use the existing embedding pipeline independently for each scan root."""
    results = []
    for root in roots:
        try:
            manager = manager_factory(root_path=str(root.storage_path(storage_root)))
            documents = manager.prepare_database(
                repo_url_or_path=str(root.path), repo_type="local", **root.filters
            )
            if not documents:
                raise ValueError("No indexed chunks were produced")
            results.append({
                "id": root.id, "status": "ready", "chunks": len(documents),
                "database": manager.repo_paths["save_db_file"],
            })
        except Exception as exc:
            # Keep results useful without leaking provider credentials in errors.
            results.append({"id": root.id, "status": "error", "error_type": type(exc).__name__})
    return results


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path, nargs="?", help="Optional legacy JSON manifest; defaults to .env settings")
    parser.add_argument("--env-file", type=Path, default=Path(".env"), help="Scan configuration file (default: .env)")
    parser.add_argument("--storage-root", type=Path, help="Override DEEPWIKI_DATA_DIR from .env")
    parser.add_argument("--plan", action="store_true", help="Validate roots and print storage locations without indexing")
    parser.add_argument("--reindex", action="store_true", help="Update all roots from their last successfully indexed Git commits")
    parser.add_argument("--chunk-strategy", choices=["token","syntax-v1"], help="Override the .env chunk strategy for this command")
    queries = parser.add_mutually_exclusive_group()
    queries.add_argument("--export-data", type=Path, metavar="DIRECTORY", help="Export portable source/vector/wiki data without model calls")
    queries.add_argument("--import-data", type=Path, metavar="BUNDLE", help="Import a portable bundle into DEEPWIKI_DATA_DIR (must not exist)")
    queries.add_argument("--estimate-chunks", action="store_true", help="Count planned source chunks without embeddings or index writes")
    queries.add_argument("--query", help="Search active indexes across all configured roots")
    queries.add_argument("--hybrid", help="Combine exact symbols, semantic search and definition context")
    queries.add_argument("--ask", help="Answer a question using source-grounded retrieval")
    queries.add_argument("--wiki", action="append", metavar="TOPIC", help="Generate cited wiki topic pages; repeat for multiple topics")
    parser.add_argument("--wiki-output", type=Path, help="Wiki output folder outside source trees")
    queries.add_argument("--symbol", help="Find exact definitions in saved source snapshots")
    queries.add_argument("--keyword", help="Find exact text without a model call")
    queries.add_argument("--definition", help="Read a linked window of an indexed definition")
    parser.add_argument("--repository-id")
    parser.add_argument("--file-path")
    parser.add_argument("--definition-line", type=int)
    parser.add_argument("--window-start", type=int)
    parser.add_argument("--max-lines", type=int, default=120)
    parser.add_argument("--generation")
    queries.add_argument("--context", help="Trace bounded cross-file syntax and dependency evidence")
    parser.add_argument("--depth", type=int, default=1, help="Relationship context depth, 1 to 3")
    queries.add_argument("--compiler-file", help="Analyze an indexed C translation unit with libclang")
    queries.add_argument("--compiler-symbol", help="Find compiler-bound symbols in analyzed translation units")
    queries.add_argument("--build-variants", action="store_true", help="List configured compiler profiles")
    parser.add_argument("--build-variant", help="Compiler profile ID (or DEEPWIKI_BUILD_VARIANT)")
    queries.add_argument("--relations", help="Find literal/syntax relationships by exact name")
    parser.add_argument("--top-k", type=int, default=8)
    args = parser.parse_args(argv)
    if args.chunk_strategy is not None:os.environ["DEEPWIKI_CHUNK_STRATEGY"]=args.chunk_strategy
    if args.reindex and (args.query or args.hybrid or args.ask or args.wiki or args.symbol or args.keyword or args.relations or args.context or args.definition or args.estimate_chunks or args.compiler_file or args.build_variants or args.compiler_symbol or args.export_data or args.import_data):
        parser.error("Run --reindex separately before querying")
    if args.definition and (not args.repository_id or not args.file_path or args.definition_line is None):
        parser.error("--definition requires --repository-id, --file-path and --definition-line")
    try:
        from api.headless_settings import runtime_paths,require_writable
        storage_root,wiki_root,read_only=runtime_paths(args.env_file,args.storage_root,args.wiki_output)
        if args.import_data:
            from api.headless_settings import settings
            source_base=settings(args.env_file).get('DEEPWIKI_SCAN_ROOT')
            if source_base and storage_root.is_relative_to((args.env_file.resolve().parent/Path(source_base).expanduser()).resolve()):
                raise ValueError('Import storage must be outside source trees')
            with redirect_stdout(sys.stderr):
                from api.portable_data import import_dataset
                result=import_dataset(args.import_data,storage_root)
            print(json.dumps(result,indent=2));return 0
        roots = load_manifest(args.manifest) if args.manifest else load_env_roots(args.env_file,storage_root)
        if read_only and args.manifest:
            from dataclasses import replace
            roots=[replace(root,read_only=True) for root in roots]
        if args.reindex or args.wiki or not (args.plan or args.query or args.hybrid or args.ask or args.symbol or args.keyword or args.relations or args.context or args.definition or args.compiler_file or args.compiler_symbol or args.build_variants or args.export_data):
            require_writable(roots)
        if any(storage_root.is_relative_to(root.path) for root in roots):
            raise ValueError("Storage must be outside every scan root")
        if args.export_data:
            with redirect_stdout(sys.stderr):
                from dotenv import load_dotenv
                load_dotenv(args.env_file,override=False)
                from api.config import configs
                configs['text_splitter']={'split_by':'token','chunk_size':1000,'chunk_overlap':150};configs['embedder_google']['batch_size']=100
                from api.portable_data import export_dataset
                result=export_dataset(roots,storage_root,args.export_data,wiki_root,
                    lambda value:print(json.dumps(value),file=sys.stderr,flush=True))
            print(json.dumps(result,indent=2));return 0
        if args.plan:
            results = [{"id": r.id, "path": str(r.path), "storage": str(r.storage_path(storage_root))} for r in roots]
        else:
            # Import lazily so --plan/help work even before backend setup.
            with redirect_stdout(sys.stderr):
                from dotenv import load_dotenv

                load_dotenv(args.env_file, override=False)
                from api.reindex import reindex_root, ReindexError
                from api.headless_index import build_root
                from api.config import configs
                # Token-based chunks respect Google's 2048-token input limit.
                configs["text_splitter"] = {"split_by": "token", "chunk_size": 1000, "chunk_overlap": 150}
                configs["embedder_google"]["batch_size"] = 100
                results = []
                if args.query or args.hybrid or args.ask or args.wiki or args.symbol or args.keyword or args.relations or args.context or args.definition or args.estimate_chunks or args.compiler_file or args.build_variants or args.compiler_symbol:
                    import asyncio
                    from api.headless_search import search,hybrid_search,answer
                    progress = lambda value: print(json.dumps(value),file=sys.stderr,flush=True)
                    if args.compiler_symbol:
                        from api.compiler_analysis import find_compiler_symbol
                        payload=find_compiler_symbol(roots,storage_root,args.compiler_symbol,args.build_variant,args.top_k)
                    elif args.build_variants:
                        from api.compiler_analysis import list_profiles
                        payload=list_profiles()
                    elif args.compiler_file:
                        from api.compiler_analysis import analyze
                        selected=[root for root in roots if root.id==args.repository_id]
                        if len(selected)!=1:raise ValueError("--compiler-file requires a valid --repository-id")
                        payload=analyze(selected[0],storage_root,args.compiler_file,args.build_variant)
                    elif args.estimate_chunks:
                        from api.syntax_chunks import estimate_root_chunks
                        payload={"repositories":[estimate_root_chunks(root,progress) for root in roots]}
                    elif args.definition:
                        from api.definition_context import definition_window
                        selected=[root for root in roots if root.id==args.repository_id]
                        if not selected:raise ValueError("Unknown repository ID")
                        payload=definition_window(selected[0],storage_root,args.definition,args.file_path,args.definition_line,args.window_start,args.max_lines,args.generation)
                    elif args.context:
                        from api.relationship_context import relationship_context
                        payload=relationship_context(roots,storage_root,args.context,args.depth,args.top_k,progress)
                    elif args.symbol or args.keyword or args.relations:
                        from api.structural_index import lookup
                        mode="symbol" if args.symbol else "keyword" if args.keyword else "relations"
                        query=args.symbol or args.keyword or args.relations
                        payload={"query":query,"mode":mode,"sources":lookup(roots,storage_root,query,mode,args.top_k,progress)}
                    elif args.wiki:
                        from api.headless_wiki import generate_wiki
                        payload=asyncio.run(generate_wiki(roots,storage_root,args.wiki,wiki_root,args.top_k,progress))
                    elif args.hybrid:
                        payload={"query":args.hybrid,"sources":hybrid_search(roots,storage_root,args.hybrid,args.top_k,progress)}
                    elif args.ask:
                        payload=asyncio.run(answer(roots,storage_root,args.ask,args.top_k,progress))
                    else:
                        payload={"query":args.query,"sources":search(roots,storage_root,args.query,args.top_k,progress)}
                    print(json.dumps(payload,indent=2),file=sys.__stdout__)
                    return 0
                for root in roots:
                    try:
                        if args.reindex:
                            results.append(reindex_root(root,storage_root,
                                progress=lambda value: print(json.dumps(value),file=sys.stderr,flush=True)))
                            continue
                        manifest, filename = build_root(root, storage_root,
                            progress=lambda value: print(json.dumps(value), file=sys.stderr, flush=True))
                        results.append({"id":root.id,"status":manifest["state"],
                            "files":manifest["indexed_files"],"chunks":manifest["chunks"],
                            "manifest":str(filename),"skipped":manifest["skipped"]})
                    except Exception as exc:
                        error = {"id":root.id,"status":"error","error_type":type(exc).__name__}
                        if isinstance(exc, ReindexError):
                            error["error"] = str(exc)
                        results.append(error)
    except ImportError:
        print(json.dumps({"error": "Backend dependencies are missing; install api/pyproject.toml dependencies before indexing"}), file=sys.stderr)
        return 2
    except (OSError, ValueError) as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        return 2
    print(json.dumps({"repositories": results}, indent=2))
    return int(any(r.get("status") in {"error", "partial"} for r in results))


if __name__ == "__main__":
    sys.exit(main())
