"""Translate portable on-disk references to local runtime paths."""
import copy
import hashlib
import json
from pathlib import Path
import subprocess
from api.headless_settings import inside


def read_state(directory,root):
    state=json.loads((directory/'state.json').read_text())
    if not state.get('portable_format'):return state
    if state.get('portable_format')!=1 or state['repository_id']!=root.id:raise ValueError('Unsupported portable state')
    nonempty=lambda values:{key:value for key,value in values.items() if value}
    if nonempty(state.get('selection_filters',{}))!=nonempty(root.filters):raise ValueError('Source filters changed; explicit portable reconciliation required')
    owners={}
    for key,layout in state['repository_layout'].items():
        if layout['kind']=='nested':owners[key]=str(inside(root.path,layout['path']))
        elif layout['kind']=='containing':
            if root.read_only:
                source=root.path
                for _ in Path(layout['scope']).parts:source=source.parent
            else:
                result=subprocess.run(['git','-C',str(root.path),'rev-parse','--show-toplevel'],capture_output=True,text=True)
                if result.returncode:raise ValueError('Mapped source is not in a Git checkout')
                source=Path(result.stdout.strip()).resolve()
            owners[key]=str(source)
        else:raise ValueError('Invalid portable repository layout')
    if root.read_only:state['portable_commits']=dict(state['repositories'])
    state['repositories']={owners[key]:sha for key,sha in state['repositories'].items()}
    for name,record in state['files'].items():
        inside(root.path,name)
        if Path(record['part']).suffix!='.sqlite3':raise ValueError('Portable datasets accept SQLite parts only')
        record['part']=str(inside(directory,record['part']))
        record['repository']=owners[record['repository']]
        record['git_path']=(root.path/name).relative_to(record['repository']).as_posix()
    state['source']=str(root.path)
    return state


def disk_state(directory,state,root):
    if not getattr(root,'portable',False):return state
    saved=copy.deepcopy(state);owners={};layout={}
    for owner in state['repositories']:
        path=Path(owner)
        if root.path.is_relative_to(path):entry={'kind':'containing','scope':root.path.relative_to(path).as_posix()}
        elif path.is_relative_to(root.path):entry={'kind':'nested','path':path.relative_to(root.path).as_posix()}
        else:raise ValueError('Checkpoint repository escapes source scope')
        key='git-'+hashlib.sha256(json.dumps(entry,sort_keys=True).encode()).hexdigest()[:12]
        owners[owner]=key;layout[key]=entry
    saved.pop('portable_commits',None)
    saved.update(portable_format=1,selection_filters=root.filters,repository_id=root.id,source='repo:'+root.id,repository_layout=layout,
                 repositories={owners[path]:sha for path,sha in state['repositories'].items()})
    for name,record in saved['files'].items():
        path=Path(record['part']).resolve()
        if not path.is_relative_to(directory.resolve()):raise ValueError('Chunk reference escapes portable index')
        record['part']=path.relative_to(directory.resolve()).as_posix()
        record['repository']=owners[record['repository']]
    return saved
