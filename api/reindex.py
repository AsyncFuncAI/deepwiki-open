"""Forward-only Git checkpoints and immutable changed-file index generations."""
from collections import Counter, defaultdict
from contextlib import contextmanager, redirect_stdout
import copy
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import uuid

from adalflow.core.db import LocalDB
from api.saved_index import load_saved_part
from api.config import iterate_files
from api.headless_index import index_configuration, index_directory, write_json
from api.rag.pipeline import read_all_documents, transform_documents_and_save_to_db


class ReindexError(ValueError):
    pass


def git(repo, *args, allowed=(0,)):
    result = subprocess.run(["git", "-C", str(repo), *args], capture_output=True)
    if result.returncode not in allowed:
        raise ReindexError(f"Git {args[0]} failed in {repo}; verify repository/history availability")
    return result


def text_hash(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def signature(path):
    st = path.stat()
    return [st.st_size, st.st_mtime_ns, st.st_ctime_ns, st.st_ino]


def read_text(path):
    before = signature(path)
    with path.open(encoding="utf-8", errors="replace") as source:
        text = source.read()
    if signature(path) != before:
        raise ReindexError(f"Source changed during reading: {path}")
    return text


def snapshot(root):
    files = sorted(iterate_files(str(root.path), **root.filters))
    stats = {}
    for name in files:
        path = root.path / name
        if path.resolve().is_relative_to(root.path):
            stats[name] = signature(path)
    containing = git(root.path, "rev-parse", "--show-toplevel").stdout.decode().strip()
    repos = {str(Path(containing).resolve())}
    seen = set()
    for name in stats:
        directory = (root.path / name).parent
        while directory.is_relative_to(root.path) and directory not in seen:
            seen.add(directory)
            if (directory / ".git").exists():
                repos.add(str(directory.resolve()))
            if directory == root.path:
                break
            directory = directory.parent
    commits = {repo: git(repo, "rev-parse", "HEAD").stdout.decode().strip() for repo in sorted(repos)}
    owners = {}
    for name in stats:
        path = root.path / name
        repo = max((r for r in repos if path.is_relative_to(r)), key=len)
        owners[name] = (repo, path.relative_to(repo).as_posix())
    dirty = set()
    for repo in repos:
        tracked = git(repo, "diff", "--name-only", "-z", "HEAD", "--").stdout
        untracked = git(repo, "ls-files", "--others", "--exclude-standard", "-z").stdout
        dirty_names = {os.fsdecode(n) for n in (tracked + untracked).split(b"\0") if n}
        dirty.update(name for name, (owner, git_path) in owners.items() if owner == repo and git_path in dirty_names)
    return {"stats":stats, "commits":commits, "owners":owners, "dirty":dirty}


@contextmanager
def lock_index(directory):
    import fcntl
    directory.mkdir(parents=True, exist_ok=True)
    with (directory / ".reindex.lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise ReindexError("Another index update is already running for this root")
        try:
            yield
        finally:
            fcntl.flock(lock, fcntl.LOCK_UN)


def validate_chunks(chunks):
    if any(getattr(d, "vector", None) is None or len(d.vector) == 0 for d in chunks):
        raise ReindexError("Index contains missing vectors")


def adopt_initial(root, directory, snap, progress):
    manifest_path = directory / "manifest.json"
    if not manifest_path.exists():
        raise ReindexError("No compatible initial index; run initial indexing for this root first")
    manifest = json.loads(manifest_path.read_text())
    if manifest["state"] != "ready" or manifest.get("skipped"):
        raise ReindexError("Initial index must be complete before adopting commit checkpoints")
    if manifest["configuration"] != index_configuration():
        raise ReindexError("Embedding or selection configuration changed; targeted rebuild required")
    records = {}
    for number, part in enumerate(manifest["parts"], 1):
        db = load_saved_part(part["path"])
        chunks = db.get_transformed_data(key="split_and_embed")
        validate_chunks(chunks)
        if len(chunks) != part["chunks"] or len(db.items) != part["files"]:
            raise ReindexError("Saved part does not match its recorded counts")
        counts = Counter(d.meta_data["file_path"] for d in chunks)
        for doc in db.items:
            name = doc.meta_data["file_path"]
            if Path(name).is_absolute() or ".." in Path(name).parts or name in records:
                raise ReindexError("Invalid or duplicate path in saved initial index")
            digest = text_hash(doc.text)
            record = {"hash":digest, "part":part["path"], "chunks":counts[name], "signature":None}
            if name in snap["stats"] and text_hash(read_text(root.path / name)) == digest:
                record["signature"] = snap["stats"][name]
            if name in snap["owners"]:
                record["repository"], record["git_path"] = snap["owners"][name]
            records[name] = record
        if progress and (number % 10 == 0 or number == len(manifest["parts"])):
            progress({"id":root.id,"phase":"adopt_baseline","parts":number,"total_parts":len(manifest["parts"])})
        del chunks, db
    if len(records) != manifest["indexed_files"]:
        raise ReindexError("Initial source count mismatch")
    # Provisional until all mismatched indexed/worktree content is reconciled below.
    return {"version":1,"configuration":manifest["configuration"],"source":str(root.path),
            "repositories":snap["commits"],"files":records,"generation":None}


def validate_history(state, snap):
    if set(state["repositories"]) != set(snap["commits"]):
        raise ReindexError("Repository boundaries changed; explicit baseline reconciliation is required")
    changes = set()
    for repo, old in state["repositories"].items():
        new = snap["commits"][repo]
        result = git(repo,"merge-base","--is-ancestor",old,new,allowed=(0,1,128))
        if result.returncode:
            raise ReindexError(f"Saved commit is missing or history diverged in {repo}; checkpoint unchanged")
        if old != new:
            changed = git(repo,"diff","--name-only","-z","--no-renames",old,new,"--").stdout
            names = {os.fsdecode(n) for n in changed.split(b"\0") if n}
            changes.update(name for name, (owner,path) in snap["owners"].items() if owner==repo and path in names)
    return changes


def content_reuse_key(digest,name,configuration):
    if configuration.get("chunk_strategy"):
        from api.syntax_chunks import chunk_language
        return digest,chunk_language(name)
    return digest


def save_file_part(root, name, text, directory, old_by_hash):
    digest = text_hash(text)
    key = hashlib.sha256((name + "\0" + digest).encode()).hexdigest()
    part = directory / "updates" / (key + (".sqlite3" if getattr(root,"portable",False) else ".pkl"))
    part.parent.mkdir(exist_ok=True)
    if part.exists():
        db = load_saved_part(str(part))
    else:
        temporary = part.with_suffix(".pkl.building")
        previous = old_by_hash.get(content_reuse_key(digest,name,index_configuration()))
        if previous:
            old_name, record = previous
            old_db = load_saved_part(record["part"])
            items = [copy.deepcopy(d) for d in old_db.items if d.meta_data["file_path"] == old_name]
            chunks = [copy.deepcopy(d) for d in old_db.get_transformed_data(key="split_and_embed") if d.meta_data["file_path"]==old_name]
            for d in items + chunks:
                d.meta_data = dict(d.meta_data, file_path=name,title=name,repository_id=root.id,source_root=str(root.path))
            if index_configuration().get("chunk_strategy"):
                from api.syntax_chunks import SyntaxTextSplitter
                from api.config import configs
                regenerated=SyntaxTextSplitter(**configs["text_splitter"])(items)
                vectors={(d.meta_data["char_start"],d.meta_data["char_end"]):d.vector for d in chunks}
                for chunk in regenerated:
                    span=(chunk.meta_data["char_start"],chunk.meta_data["char_end"])
                    if span not in vectors:raise ReindexError("Rename chunk layout changed; explicit reconciliation required")
                    chunk.vector=vectors[span]
                chunks=regenerated
            db = LocalDB(items=items,transformed_items={"split_and_embed":chunks})
            db.save_state(str(temporary))
        elif not text.strip():
            db = LocalDB(items=[],transformed_items={"split_and_embed":[]})
            db.save_state(str(temporary))
        else:
            docs = read_all_documents(str(root.path),file_paths=[name],full_source=True)
            if len(docs)!=1 or text_hash(docs[0].text)!=digest:
                raise ReindexError("Source changed before embedding")
            docs[0].meta_data.update(repository_id=root.id,source_root=str(root.path))
            strategy=index_configuration().get("chunk_strategy")
            if strategy:docs[0].meta_data["chunk_strategy"]=strategy
            with redirect_stdout(sys.stderr):
                db = transform_documents_and_save_to_db(docs,str(temporary))
        chunks = db.get_transformed_data(key="split_and_embed")
        validate_chunks(chunks)
        if text.strip() and not chunks:
            raise ReindexError("No chunks returned for nonempty changed source")
        if getattr(root,'portable',False):
            from api.portable_parts import save_part
            sql_temp=part.with_suffix('.sqlite3.building')
            sql_temp.unlink(missing_ok=True)
            save_part(sql_temp,db.items,chunks)
            sql_temp.replace(part);temporary.unlink(missing_ok=True)
        else:temporary.replace(part)
    chunks = db.get_transformed_data(key="split_and_embed")
    validate_chunks(chunks)
    return {"hash":digest,"part":str(part),"chunks":len(chunks)}


def publish_state(directory, state, root=None):
    if root is not None:
        from api.portable_state import disk_state
        state=disk_state(directory,state,root)
    generation = directory / "generations" / (state["generation"] + ".json")
    generation.parent.mkdir(exist_ok=True)
    write_json(generation,state)
    # Single atomic publication point: file ownership and Git watermarks move together.
    write_json(directory / "state.json",state)


def reindex_root(root, storage_root, progress=None):
    from api.headless_settings import require_writable
    require_writable([root])
    directory = index_directory(root,storage_root)
    with lock_index(root.storage_path(storage_root)):
        snap = snapshot(root)
        state_path = directory / "state.json"
        adopted = not state_path.exists()
        from api.portable_state import read_state
        state = adopt_initial(root,directory,snap,progress) if adopted else read_state(directory,root)
        if state.get("version")!=1 or state["source"]!=str(root.path) or state["configuration"]!=index_configuration():
            raise ReindexError("Index configuration changed; explicit reconciliation is required")
        commit_changes = validate_history(state,snap)
        old_files = state["files"]
        files = copy.deepcopy(old_files)
        deleted = set(files)-set(snap["stats"])
        for name in deleted:
            del files[name]
        candidates = commit_changes | snap["dirty"] | {
            name for name, stat in snap["stats"].items()
            if name not in old_files or old_files[name].get("signature")!=stat
        }
        old_by_hash = {content_reuse_key(r["hash"],name,state["configuration"]):(name,r) for name,r in old_files.items()}
        indexed = 0
        reused = 0
        for number,name in enumerate(sorted(candidates),1):
            if name not in snap["stats"]:
                continue
            text = read_text(root.path/name)
            digest = text_hash(text)
            previous = old_files.get(name)
            if previous and previous["hash"]==digest:
                files[name] = copy.deepcopy(previous)
            else:
                files[name] = save_file_part(root,name,text,directory,old_by_hash)
                indexed += 1
                reused += int(content_reuse_key(digest,name,state["configuration"]) in old_by_hash)
            files[name]["signature"] = snap["stats"][name]
            if progress:
                progress({"id":root.id,"phase":"update","candidates_done":number,"candidates_total":len(candidates),"indexed":indexed})
        for name,record in files.items():
            record["repository"],record["git_path"] = snap["owners"][name]
            record["dirty"] = name in snap["dirty"]
        after = snapshot(root)
        if after["stats"]!=snap["stats"] or after["commits"]!=snap["commits"] or after["dirty"]!=snap["dirty"]:
            raise ReindexError("Sources changed during update; previous checkpoint preserved, retry safely")
        commits = [{"repository":repo,"from_commit":state["repositories"][repo],"to_commit":sha} for repo,sha in snap["commits"].items()]
        changed = adopted or indexed or deleted or files!=old_files or state["repositories"]!=snap["commits"]
        if changed:
            state.update(files=files,repositories=snap["commits"],generation=uuid.uuid4().hex,updated=time.time())
            publish_state(directory,state,root)
        return {"id":root.id,"status":"ready","baseline_adopted":adopted,"indexed_files":indexed,
                "reused_files":reused,"deleted_files":len(deleted),"files":len(files),
                "chunks":sum(r["chunks"] for r in files.values()),"dirty_files":len(snap["dirty"]),
                "commits":commits,"state":str(state_path),"generation":state["generation"]}


def iter_active_chunks(state):
    """Read immutable parts, suppressing replaced/deleted file versions."""
    by_part = defaultdict(set)
    for name,record in state["files"].items():
        by_part[record["part"]].add(name)
    for part,names in by_part.items():
        db = load_saved_part(part)
        for chunk in db.get_transformed_data(key="split_and_embed"):
            if chunk.meta_data["file_path"] in names:
                yield chunk
