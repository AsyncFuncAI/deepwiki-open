"""Dependency-free portable headless settings; environment overrides .env."""
import json
import os
from pathlib import Path
import shlex

KEYS={'DEEPWIKI_DATA_DIR','DEEPWIKI_WIKI_DIR','DEEPWIKI_READ_ONLY','DEEPWIKI_SOURCE_PATHS','DEEPWIKI_SCAN_ROOT','DEEPWIKI_CACHE_DIR'}


def settings(filename):
    values={}
    if Path(filename).exists():
        for line in Path(filename).read_text().splitlines():
            key,sep,value=line.removeprefix('export ').partition('=');key=key.strip()
            if sep and key in KEYS:
                if value.strip().startswith(('{','[')):
                    values[key]=value.strip();continue
                words=shlex.split(value.strip(),comments=True)
                values[key]=' '.join(words) if words else ''
    values.update({key:os.environ[key] for key in KEYS if key in os.environ})
    return values


def runtime_paths(env_file,storage_override=None,wiki_override=None):
    values=settings(env_file);base=Path(env_file).resolve().parent
    data=Path(storage_override or values.get('DEEPWIKI_DATA_DIR') or Path.home()/'.adalflow/headless').expanduser()
    data=(base/data).resolve()
    wiki=Path(wiki_override or values.get('DEEPWIKI_WIKI_DIR') or 'wiki').expanduser()
    wiki=(data/wiki).resolve()
    raw=values.get('DEEPWIKI_READ_ONLY','false').lower()
    if raw not in {'true','false'}:raise ValueError('DEEPWIKI_READ_ONLY must be true or false')
    return data,wiki,raw=='true'


def require_writable(roots):
    if any(getattr(root,'read_only',False) for root in roots):
        raise ValueError('Dataset is read-only; source updates and wiki generation are disabled')


def inside(base,relative):
    # Bundle paths are always portable POSIX relative names, never host paths.
    if not isinstance(relative,str) or not relative or '\\' in relative or ':' in relative:
        raise ValueError('Invalid portable relative path')
    path=Path(relative)
    if path.is_absolute() or '..' in path.parts:raise ValueError('Portable path escapes dataset')
    result=(Path(base)/path).resolve()
    if not result.is_relative_to(Path(base).resolve()):raise ValueError('Portable path escapes dataset')
    return result


def cache_directory(root,storage):
    from api.headless_index import index_directory
    explicit=os.getenv('DEEPWIKI_CACHE_DIR')
    if not root.read_only and not explicit:return index_directory(root,storage)
    import hashlib
    namespace=hashlib.sha256(str(Path(storage).resolve()).encode()).hexdigest()[:16]
    base=Path(explicit).expanduser().resolve() if explicit else Path.home()/'.cache/codewiki'
    return base/namespace/root.id/'index'


def cache_lock_directory(root,storage):
    if root.read_only or os.getenv('DEEPWIKI_CACHE_DIR'):return cache_directory(root,storage)
    return root.storage_path(storage)
