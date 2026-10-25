"""Bounded cross-file syntax neighborhoods, with explicitly unresolved links."""
from contextlib import closing
from collections import deque
import posixpath
import sqlite3

from api.structural_index import compile_structure,lookup,validate,excerpt


def definition_id(hit):
    return f"{hit['repository_id']}:{hit['file_path']}:{hit['start_line']}:{hit['kind']}:{hit['name']}"


def file_candidates(roots,storage_root,target,source_path,limit,progress=None):
    """Return indexed-path spelling candidates, never access the live source tree."""
    spelling=target.strip('"<>')
    if not spelling or any(char in spelling for char in ('$','*','?','\n','\r')):return []
    # Import names and indirect calls are intentionally not converted to paths.
    suffix='/'+spelling
    hits=[]
    for root in roots:
        directory=compile_structure(root,storage_root,progress)
        relative=posixpath.normpath(posixpath.join(posixpath.dirname(source_path),spelling))
        with closing(sqlite3.connect(f"file:{directory/'structure.sqlite3'}?mode=ro",uri=True)) as db:
            rows=db.execute("SELECT path,text,quality FROM files WHERE path=? OR path=? OR substr(path,-length(?))=? ORDER BY CASE WHEN path=? THEN 0 ELSE 1 END,path LIMIT ?",(spelling,relative,suffix,suffix,relative,limit))
            for path,text,quality in rows:
                hit=dict(repository_id=root.id,file_path=path,kind="file",name=path,quality=quality,generation=directory.name,resolution="indexed_path_spelling_candidate",**excerpt(text,1,max(1,len(text.splitlines())),30))
                from api.c_conditions import annotate_conditions
                hits.append(annotate_conditions(root,storage_root,hit,directory))
    groups=[[h for h in hits if h['repository_id']==root.id] for root in roots]
    return [group[n] for n in range(limit) for group in groups if n<len(group)][:limit]


def relationship_context(roots,storage_root,name,depth=1,limit=24,progress=None):
    validate(name,limit)
    if type(depth) is not int or not 1<=depth<=3:raise ValueError("depth must be between 1 and 3")
    queue=deque([(name,0)]);visited=set();definitions={};relations={};files={}
    truncated=False
    characters=0
    def bounded(hit):
        nonlocal characters,truncated
        hit=dict(hit)
        remaining=max(0,48000-characters)
        if len(hit["text"])>remaining:
            hit["text"]=hit["text"][:remaining]
            hit["truncated"]=True;hit["text_truncated"]=True;truncated=True
        characters+=len(hit["text"])
        return hit
    # A shared evidence budget bounds the returned source text and graph size.
    def room():return len(definitions)+len(relations)+len(files)<limit
    def add_definitions(query,source=None):
        nonlocal truncated
        per_name=min(4,max(1,limit//4))
        selected=[root for root in roots if root.id==source["repository_id"]] if source else roots
        candidates=lookup(selected,storage_root,query,"symbol",per_name+1,progress,source["file_path"] if source else None)
        if len(candidates)>per_name:truncated=True
        candidates=candidates[:per_name]
        ids=[]
        for hit in candidates:
            identity=definition_id(hit)
            if identity not in definitions:
                if not room():truncated=True;break
                definitions[identity]=dict(bounded(hit),id=identity,resolution="name_candidate_unresolved")
            ids.append(identity)
        return ids
    while queue:
        query,level=queue.popleft()
        if query in visited:continue
        if len(visited)>=limit or not room():truncated=True;break
        visited.add(query)
        add_definitions(query)
        if level>=depth:continue
        evidence=lookup(roots,storage_root,query,"relations",min(50,limit+1),progress)
        for hit in evidence:
            identity=(hit['repository_id'],hit['file_path'],hit['start_line'],hit['source'],hit['target'],hit['kind'])
            if identity in relations:continue
            if not room():truncated=True;break
            edge=dict(bounded(hit),depth=level+1,source_definition_candidates=[],target_definition_candidates=[],target_file_candidates=[])
            relations[identity]=edge
            for endpoint,key in ((hit['source'],'source_definition_candidates'),(hit['target'],'target_definition_candidates')):
                if not endpoint or len(endpoint)>512:continue
                if hit['kind'] in {'call_syntax','make_prerequisite','make_invocation'} or key=='source_definition_candidates':
                    ids=add_definitions(endpoint,hit if key=='source_definition_candidates' else None)
                    if key=='source_definition_candidates':
                        ids=[i for i in ids if definitions[i]['repository_id']==hit['repository_id'] and definitions[i]['file_path']==hit['file_path']]
                    edge[key]=ids
                    if level+1<depth and endpoint not in visited:queue.append((endpoint,level+1))
            if hit['kind'] in {'include','make_include','make_prerequisite','script_reference'}:
                for candidate in file_candidates(roots,storage_root,hit['target'],hit['file_path'],min(50,limit+1),progress):
                    key=(candidate['repository_id'],candidate['file_path'])
                    if key not in files:
                        if not room():truncated=True;break
                        files[key]=dict(bounded(candidate),id=f"{key[0]}:{key[1]}")
                    edge['target_file_candidates'].append(files[key]['id'])
    return {"query":name,"depth":depth,"limit":limit,"truncated":truncated,"visited_names":sorted(visited),
        "definitions":list(definitions.values()),"relationships":list(relations.values()),"files":list(files.values()),
        "resolution":"Syntax and spelling candidates only; no compiler, dynamic-dispatch or build-variant resolution"}
