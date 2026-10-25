"""Export/import self-contained codeWiki datasets without model calls or secrets."""
from collections import Counter,defaultdict
import copy
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import tempfile

from api.headless_settings import inside,settings


def digest(path):
    value=hashlib.sha256()
    with Path(path).open('rb') as source:
        for block in iter(lambda:source.read(1024*1024),b''):value.update(block)
    return value.hexdigest()


def catalog_roots(data,env_file,read_only):
    from api.headless import ScanRoot,validate_manifest
    catalog=json.loads((data/'catalog.json').read_text())
    if catalog.get('version')!=1:raise ValueError('Unsupported portable catalog version')
    values=settings(env_file);mapping=json.loads(values.get('DEEPWIKI_SOURCE_PATHS') or '{}')
    if not isinstance(mapping,dict):raise ValueError('DEEPWIKI_SOURCE_PATHS must be an object')
    ids={r['id'] for r in catalog['repositories']}
    if set(mapping)-ids:raise ValueError('Source mapping contains unknown repository IDs')
    base=values.get('DEEPWIKI_SCAN_ROOT');entries=[]
    for item in catalog['repositories']:
        repo_id=item['id']
        if not isinstance(repo_id,str) or not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}',repo_id):raise ValueError('Invalid portable repository ID')
        if item['index']!=f'repositories/{repo_id}/index':raise ValueError('Unexpected portable index layout')
        inside(data,item['index'])
        if read_only:path=data.parent/'.codewiki-unmounted'/repo_id
        else:
            raw=mapping.get(repo_id)
            if raw is None:
                if not base:raise ValueError('Writable dataset requires DEEPWIKI_SOURCE_PATHS or DEEPWIKI_SCAN_ROOT')
                raw=str(Path(base)/item['relative_source_path'])
            if not isinstance(raw,str):raise ValueError('Invalid mapped source path')
            path=(Path(env_file).resolve().parent/Path(raw).expanduser()).resolve()
        entries.append(dict(id=repo_id,path=str(path),**item.get('filters',{})))
    if len(entries)!=len(ids):raise ValueError('Duplicate portable repository ID')
    if read_only:return [ScanRoot(e['id'],Path(e['path']),{k:v for k,v in e.items() if k not in {'id','path'}},True,True) for e in entries]
    from dataclasses import replace
    return [replace(root,portable=True) for root in validate_manifest({'repositories':entries},Path(env_file).resolve().parent)]


def _without_secrets(value):
    if isinstance(value,dict):
        if any(re.search(r'(api.?key|password|secret|credential|access.?token)',key,re.I) for key in value):raise ValueError('Secret-like configuration cannot be exported')
        for child in value.values():_without_secrets(child)
    elif isinstance(value,list):
        for child in value:_without_secrets(child)


def export_dataset(roots,storage,destination,wiki_root=None,progress=None):
    from api.headless_index import index_directory,write_json
    from api.headless_search import load_state
    from api.portable_state import disk_state
    from api.portable_parts import save_part
    from api.saved_index import load_saved_part
    from api.reindex import text_hash
    from dataclasses import replace
    destination=Path(destination).expanduser().resolve();storage=Path(storage).resolve()
    if destination.exists():raise ValueError('Export destination must not exist')
    if any(destination.is_relative_to(root.path) for root in roots):raise ValueError('Export must be outside source trees')
    destination.parent.mkdir(parents=True,exist_ok=True)
    staging=Path(tempfile.mkdtemp(prefix='.'+destination.name+'-',dir=destination.parent))
    try:
        snapshots={root.id:load_state(root,storage) for root in roots}
        source_base=Path(os.path.commonpath([str(root.path.parent) for root in roots]))
        previous_catalog=json.loads((storage/'catalog.json').read_text()) if (storage/'catalog.json').exists() else {'repositories':[]}
        source_names={r['id']:r['relative_source_path'] for r in previous_catalog['repositories']}
        catalog={'version':1,'kind':'codewiki-portable','repositories':[]}
        for root in roots:
            state=snapshots[root.id];_without_secrets(state['configuration'])
            directory=staging/'repositories'/root.id/'index';(directory/'parts').mkdir(parents=True)
            groups=defaultdict(set)
            for name,record in state['files'].items():inside(root.path,name);groups[record['part']].add(name)
            copied=copy.deepcopy(state);copied['portable_format']=1;counts=Counter()
            for number,(part,names) in enumerate(sorted(groups.items()),1):
                db=load_saved_part(part)
                items=[doc for doc in db.items if doc.meta_data['file_path'] in names]
                chunks=[doc for doc in db.get_transformed_data(key='split_and_embed') if doc.meta_data['file_path'] in names]
                raw={d.meta_data['file_path']:d.text for d in items}
                for name in names:
                    if state['files'][name]['chunks'] and (name not in raw or text_hash(raw[name])!=state['files'][name]['hash']):raise ValueError('Source snapshot hash mismatch')
                target=directory/'parts'/f'{number:06d}.sqlite3';save_part(target,items,chunks)
                for chunk in chunks:counts[chunk.meta_data['file_path']]+=1
                for name in names:copied['files'][name]['part']=str(target);copied['files'][name]['signature']=None
                if progress:progress({'phase':'export','id':root.id,'parts_done':number,'parts_total':len(groups)})
                del db,items,chunks
            if any(counts[name]!=record['chunks'] for name,record in state['files'].items()):raise ValueError('Portable chunk count mismatch')
            saved=disk_state(directory,copied,replace(root,portable=True))
            write_json(directory/'state.json',saved)
            (directory/'generations').mkdir();write_json(directory/'generations'/(saved['generation']+'.json'),saved)
            manifest={'id':root.id,'source':'repo:'+root.id,'state':'ready','configuration':saved['configuration'],
                      'selected_files':len(saved['files']),'indexed_files':len(saved['files']),'chunks':sum(counts.values()),'skipped':[],
                      'parts':[{'path':p.relative_to(directory).as_posix()} for p in sorted((directory/'parts').glob('*.sqlite3'))]}
            write_json(directory/'manifest.json',manifest)
            relative=source_names.get(root.id,root.path.relative_to(source_base).as_posix())
            catalog['repositories'].append({'id':root.id,'index':directory.relative_to(staging).as_posix(),
                'relative_source_path':relative,'filters':root.filters,'configuration':saved['configuration'],
                'generation':state['generation'],'files':len(state['files']),'chunks':sum(counts.values())})
        wiki_root=Path(wiki_root) if wiki_root else storage/'wiki';pointer=wiki_root/'codewiki-current.json'
        if pointer.exists():
            wiki=json.loads(pointer.read_text())
            if wiki.get('kind')!='codewiki-wiki' or wiki.get('state')!='ready':raise ValueError('Invalid published wiki')
            if not re.fullmatch(r'[a-zA-Z0-9_-]+',wiki['generation']):raise ValueError('Invalid wiki generation')
            source=inside(wiki_root,'generations/'+wiki['generation']);target=staging/'wiki'/'generations'/wiki['generation'];target.mkdir(parents=True)
            for name in [*[p['file'] for p in wiki['pages']],'index.md']:
                page=inside(source,name)
                if not page.is_file() or page.is_symlink():raise ValueError('Invalid wiki page')
                output=inside(target,name);output.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(page,output)
            wiki['directory']='generations/'+wiki['generation']
            write_json(target/'manifest.json',wiki);write_json(staging/'wiki'/'codewiki-current.json',wiki)
        write_json(staging/'catalog.json',catalog)
        files=[{'path':path.relative_to(staging).as_posix(),'bytes':path.stat().st_size,'sha256':digest(path)} for path in sorted(staging.rglob('*')) if path.is_file()]
        write_json(staging/'bundle.json',{'kind':'codewiki-portable-bundle','version':1,'files':files})
        if any(load_state(root,storage)['generation']!=snapshots[root.id]['generation'] for root in roots):raise ValueError('Source index changed during export; retry')
        os.replace(staging,destination)
        return {'status':'ready','directory':str(destination),'repositories':len(roots),'files':sum(r['files'] for r in catalog['repositories']),'chunks':sum(r['chunks'] for r in catalog['repositories']),'embedding_calls':0}
    except Exception:
        shutil.rmtree(staging);raise


def verify_bundle(bundle):
    bundle=Path(bundle).expanduser().resolve();manifest=json.loads((bundle/'bundle.json').read_text())
    if manifest.get('version')!=1 or manifest.get('kind')!='codewiki-portable-bundle':raise ValueError('Unsupported portable bundle')
    seen=set()
    for record in manifest['files']:
        name=record['path']
        if name in seen:raise ValueError('Duplicate bundle path')
        seen.add(name);path=inside(bundle,name)
        original=bundle/name
        if any(p.is_symlink() for p in [original,*original.parents] if p!=bundle.parent):raise ValueError('Bundle symlinks are not supported')
        if not path.is_file() or path.stat().st_size!=record['bytes'] or digest(path)!=record['sha256']:raise ValueError('Bundle checksum mismatch: '+name)
    if 'catalog.json' not in seen:raise ValueError('Bundle has no catalog')
    catalog=json.loads((bundle/'catalog.json').read_text())
    if catalog.get('kind')!='codewiki-portable' or catalog.get('version')!=1:raise ValueError('Invalid portable catalog')
    ids=set()
    for root in catalog['repositories']:
        if root['id'] in ids or not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}',root['id']):raise ValueError('Invalid portable repository identity')
        ids.add(root['id'])
        expected='repositories/'+root['id']+'/index'
        if root['index']!=expected:raise ValueError('Invalid portable index layout')
        state_name=expected+'/state.json'
        if state_name not in seen:raise ValueError('Missing portable state')
        state=json.loads(inside(bundle,state_name).read_text())
        if state.get('portable_format')!=1 or state.get('repository_id')!=root['id']:raise ValueError('Invalid portable state')
        _without_secrets(state['configuration'])
        parts=set()
        for name,record in state['files'].items():
            inside(bundle,name)
            if Path(record['part']).suffix!='.sqlite3':raise ValueError('Portable datasets accept SQLite parts only')
            part_name=(Path(expected)/record['part']).as_posix()
            inside(bundle,part_name)
            if part_name not in seen:raise ValueError('Portable state references a missing part')
            parts.add(part_name)
        for name in parts:
            with inside(bundle,name).open('rb') as source:
                if source.read(16)!=b'SQLite format 3'+bytes([0]):raise ValueError('Portable datasets accept SQLite parts only')
    return manifest


def import_dataset(bundle,destination):
    from api.headless_index import write_json
    manifest=verify_bundle(bundle);bundle=Path(bundle).resolve();destination=Path(destination).expanduser().resolve()
    if destination.exists():raise ValueError('Import destination must not exist; active data is never overwritten')
    destination.parent.mkdir(parents=True,exist_ok=True)
    staging=Path(tempfile.mkdtemp(prefix='.'+destination.name+'-',dir=destination.parent))
    try:
        for record in manifest['files']:
            source=inside(bundle,record['path']);target=inside(staging,record['path']);target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
        write_json(staging/'bundle.json',manifest)
        verify_bundle(staging)  # Detect corruption or changes while copying, before publication.
        os.replace(staging,destination)
    except Exception:
        shutil.rmtree(staging);raise
    return {'status':'ready','directory':str(destination),'embedding_calls':0,'default_mode':'read-only; configure source mappings for writable use'}
