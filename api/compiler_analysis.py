"""Libclang analysis of saved C snapshots under explicit, versioned build profiles.

No build script, compilation-database command, compiler plugin or recipe is run.
Compiler binding describes one translation unit/profile, not runtime dispatch.
"""
from contextlib import closing
import ctypes
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3

from api.headless_index import index_directory,write_json
from api.headless_search import load_state
from api.reindex import ReindexError,lock_index
from api.structural_index import compile_structure
from clang.cindex import SourceRange


class SourceRangeList(ctypes.Structure):
    _fields_=[("count",ctypes.c_uint),("ranges",ctypes.POINTER(SourceRange))]



def profiles():
    filename=os.getenv('DEEPWIKI_COMPILER_PROFILES')
    if not filename:return {'version':1,'profiles':[]}
    value=json.loads(Path(filename).expanduser().read_text())
    if value.get('version')!=1 or not isinstance(value.get('profiles'),list):
        raise ValueError('Expected compiler profiles version 1')
    ids=[p['id'] for p in value['profiles']]
    if len(ids)!=len(set(ids)):raise ValueError('Duplicate compiler profile IDs')
    seen=set()
    for profile in value['profiles']:
        aliases=profile.get('aliases',[])
        if not isinstance(aliases,list) or any(not isinstance(a,str) or not a for a in aliases):raise ValueError('Invalid compiler profile aliases')
        for name in [profile['id'],*aliases]:
            key=(profile['repository_id'],name)
            if key in seen:raise ValueError('Ambiguous compiler profile alias')
            seen.add(key)
    return value


def profile_matches(profile,variant):
    return profile['id']==variant or variant in profile.get('aliases',[])


def list_profiles():
    value=profiles()
    return {'profiles':[{k:v for k,v in p.items() if k not in {'directory_includes','directory_evidence'}} for p in value['profiles']],'default':os.getenv('DEEPWIKI_BUILD_VARIANT')}


def select_profile(root,variant):
    variant=variant or os.getenv('DEEPWIKI_BUILD_VARIANT')
    choices=[p for p in profiles()['profiles'] if profile_matches(p,variant) and p['repository_id']==root.id]
    if len(choices)!=1:raise ValueError('Select a configured build variant for this repository')
    profile=choices[0]
    for evidence in profile.get('configuration_evidence',[]):
        path=Path(evidence['path'])
        if hashlib.sha256(path.read_bytes()).hexdigest()!=evidence['sha256']:
            raise ReindexError('Build metadata changed; refresh compiler profiles before analysis')
    return profile


def prepare_snapshot(root,storage,state):
    directory=index_directory(root,storage)/'compiler-snapshots'/state['generation']
    with lock_index(root.storage_path(storage)):
        if (directory/'ready.json').exists():return directory/'source'
        source=directory/'source';source.mkdir(parents=True,exist_ok=True)
        # compile_structure must be called before this lock (same per-root lock).
        from api.headless_settings import cache_directory
        structure=cache_directory(root,storage)/'structure-v1'/state['generation']
        with closing(sqlite3.connect(f'file:{structure/"structure.sqlite3"}?mode=ro',uri=True)) as conn:
            count=0
            for name,text in conn.execute('SELECT path,text FROM files ORDER BY path'):
                if Path(name).suffix.lower() not in {'.c','.h'}:continue
                target=(source/name).resolve()
                if not target.is_relative_to(source.resolve()):raise ReindexError('Invalid saved C source path')
                target.parent.mkdir(parents=True,exist_ok=True);target.write_text(text,encoding='utf-8');count+=1
        write_json(directory/'ready.json',{'generation':state['generation'],'files':count})
        return source


def safe_arguments(profile,root,snapshot,file_path):
    target=profile.get('target','')
    if target and not re.fullmatch(r'[A-Za-z0-9_.+-]+',target):raise ValueError('Invalid target triple')
    args=['-x','c','-std='+profile.get('standard','gnu11'),'-fsyntax-only','-nostdinc']
    if profile.get('standard','gnu11') not in {'c89','c99','c11','c17','gnu89','gnu99','gnu11','gnu17'}:raise ValueError('Unsupported C standard')
    if target:args+=['--target='+target]
    for name,value in profile.get('defines',{}).items():
        if not re.fullmatch(r'[A-Za-z_]\w*',name) or '\n' in str(value):raise ValueError('Invalid macro')
        args.append('-D'+name+'='+str(value))
    for name in profile.get('undefines',[]):
        if not re.fullmatch(r'[A-Za-z_]\w*',name):raise ValueError('Invalid undefine')
        args.append('-U'+name)
    unresolved=[]
    directory=Path(file_path).parent
    settings=profile.get('directory_includes',{})
    while str(directory) not in settings and str(directory)!='.':directory=directory.parent
    local=settings.get(str(directory),[])
    evidence=profile.get('directory_evidence',{}).get(str(directory))
    if evidence and hashlib.sha256(Path(evidence['path']).read_bytes()).hexdigest()!=evidence['sha256']:
        raise ReindexError('Translation-unit Make metadata changed; refresh compiler profiles')
    for name in [*profile.get('include_dirs',[]),*local]:
        path=Path(name)
        if path.is_absolute():
            if not path.resolve().is_relative_to(root.path.resolve()):raise ValueError('Project include directory escapes selected root')
            path=path.resolve().relative_to(root.path.resolve())
        path=(snapshot/path).resolve()
        if not path.is_relative_to(snapshot.resolve()):raise ValueError('Project include directory escapes snapshot')
        args+=['-I',str(path)]
    # Only explicitly configured SDK/sysroot headers may be read outside the snapshot.
    for name in profile.get('system_include_dirs',[]):
        path=Path(name).expanduser().resolve()
        if not path.is_absolute():raise ValueError('System include path must be absolute')
        args+=['-isystem',str(path)]
        if not path.is_dir():unresolved.append('Missing SDK include directory: '+str(path))
    if profile.get('sysroot'):args+=['--sysroot='+str(Path(profile['sysroot']).resolve())]
    return args,unresolved


def skipped_ranges(tu,filename):
    from clang.cindex import conf,TranslationUnit,File,SourceRange
    function=conf.lib.clang_getSkippedRanges
    function.argtypes=[TranslationUnit,File];function.restype=ctypes.POINTER(SourceRangeList)
    dispose=conf.lib.clang_disposeSourceRangeList
    dispose.argtypes=[ctypes.POINTER(SourceRangeList)];dispose.restype=None
    ranges=function(tu,tu.get_file(str(filename)))
    if not ranges:return []
    try:return [{'start_line':r.start.line,'end_line':r.end.line} for r in ranges.contents.ranges[:ranges.contents.count]]
    finally:dispose(ranges)


def analyze(root,storage,file_path,variant=None):
    from api.headless_settings import require_writable
    require_writable([root])
    from clang.cindex import Index,CursorKind,TranslationUnit
    from importlib.metadata import version
    profile=select_profile(root,variant)
    state=load_state(root,storage)
    if file_path not in state['files'] or Path(file_path).suffix.lower()!='.c':
        raise ValueError('Select an indexed C translation unit, not a live or external file')
    compile_structure(root,storage)
    snapshot=prepare_snapshot(root,storage,state)
    identity={'profile':profile,'generation':state['generation'],'file':file_path,'libclang':version('libclang'),'format':3}
    key=hashlib.sha256(json.dumps(identity,sort_keys=True).encode()).hexdigest()
    cache=index_directory(root,storage)/'compiler-v1';cache.mkdir(exist_ok=True)
    destination=cache/(key+'.json')
    if destination.exists():
        cached=json.loads(destination.read_text())
        if all(Path(d['path']).is_file() and hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()==d['sha256'] for d in cached.get('sdk_dependencies',[])):
            return cached
    args,unresolved=safe_arguments(profile,root,snapshot,file_path)
    # Deny filesystem fallthrough: absolute project includes also use saved bytes.
    permitted=[snapshot,*[Path(p).resolve() for p in profile.get('system_include_dirs',[])]]
    if profile.get('sysroot'):permitted.append(Path(profile['sysroot']).resolve())
    mappings=[{'type':'directory-remap','name':str(path),'external-contents':str(path)} for path in dict.fromkeys(permitted)]
    mappings.append({'type':'directory-remap','name':str(root.path.resolve()),'external-contents':str(snapshot)})
    overlay=cache/(key+'.vfs.json')
    with lock_index(root.storage_path(storage)):
        write_json(overlay,{'version':0,'fallthrough':False,'use-external-names':True,'roots':mappings})
    args+=['-ivfsoverlay',str(overlay)]
    # Variant rewrites are unsaved buffers; indexed/live sources remain unchanged.
    buffers=[]
    for change in profile.get('macro_overrides',[]):
        name=change['file'];macro=change['name'];value=str(change['value'])
        if name not in state['files'] or Path(name).suffix.lower() not in {'.c','.h'}:raise ValueError('Variant override must name an indexed C/header file')
        if not re.fullmatch(r'[A-Za-z_]\w*',macro) or not re.fullmatch(r'[A-Za-z0-9_()+! .|&-]+',value):raise ValueError('Invalid variant macro override')
        source=snapshot/name;text=source.read_text()
        text,count=re.subn(r'(?m)^\s*#\s*define\s+'+re.escape(macro)+r'\b[^\n]*', '#define '+macro+' '+value,text)
        if count!=1:raise ReindexError('Expected exactly one variant macro definition')
        buffers.append((str(source),text))
    tu=Index.create().parse(str(snapshot/file_path),args=args,unsaved_files=buffers,
                           options=TranslationUnit.PARSE_DETAILED_PROCESSING_RECORD)
    def location(cursor):
        loc=cursor.location
        if not loc.file:return None
        path=Path(str(loc.file)).resolve()
        if not path.is_relative_to(snapshot.resolve()):return None
        return {'repository_id':root.id,'file_path':str(path.relative_to(snapshot.resolve())),
                'line':loc.line,'column':loc.column,'usr':cursor.get_usr()}
    definitions=[];calls=[];stack=[(tu.cursor,'')]
    while stack:
        cursor,caller=stack.pop()
        loc=location(cursor)
        # Do not traverse SDK definitions or index their source content.
        if cursor.location.file and loc is None:continue
        if cursor.kind==CursorKind.FUNCTION_DECL and cursor.is_definition() and loc:
            caller=cursor.get_usr();definitions.append(dict(loc,name=cursor.spelling,end_line=cursor.extent.end.line,linkage=cursor.linkage.name))
        elif cursor.kind==CursorKind.CALL_EXPR and loc:
            referenced=cursor.referenced
            direct=referenced is not None and referenced.kind==CursorKind.FUNCTION_DECL
            definition=referenced.get_definition() if direct else None
            evidence=dict(loc,caller_usr=caller,name=cursor.spelling,
                          resolution='compiler_bound_declaration' if direct else 'unresolved_indirect_call',
                          target_usr=referenced.get_usr() if direct else None,
                          definition=location(definition) if definition else None)
            if evidence['definition']:evidence['resolution']='compiler_resolved_definition'
            calls.append(evidence)
        stack.extend((child,caller) for child in reversed(list(cursor.get_children())))
    diagnostics=[{'severity':d.severity,'message':d.spelling[:600],
                  'line':d.location.line,'file':str(d.location.file) if d.location.file else None} for d in tu.diagnostics]
    includes=[];sdk_dependencies=[]
    for inc in tu.get_includes():
        path=Path(str(inc.include)).resolve()
        if not path.is_relative_to(snapshot.resolve()) and path.is_file():
            sdk_dependencies.append({'path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
        includes.append({'file_path':str(path.relative_to(snapshot.resolve())) if path.is_relative_to(snapshot.resolve()) else None,
                         'external_sdk':not path.is_relative_to(snapshot.resolve()),'line':inc.location.line})
    result={'repository_id':root.id,'file_path':file_path,'generation':state['generation'],
            'profile_hash':hashlib.sha256(json.dumps(profile,sort_keys=True).encode()).hexdigest(),'sdk_dependencies':sdk_dependencies,
            'variant':profile['id'],'target':profile.get('target'),'compiler':'libclang '+version('libclang'),
            'build_compiler':profile.get('build_compiler'),'configuration_evidence':profile.get('configuration_evidence',[]),
            'macro_overrides':profile.get('macro_overrides',[]),'profile_completeness':profile.get('completeness','explicit'),
            'status':'partial' if unresolved or any(d['severity']>=3 for d in diagnostics) or profile.get('completeness')=='partial' else 'ready',
            'definitions':definitions,'calls':calls,'includes':includes,
            'inactive_ranges':skipped_ranges(tu,snapshot/file_path),'diagnostics':diagnostics[:100],
            'diagnostics_truncated':len(diagnostics)>100,'configuration_warnings':unresolved,
            'runtime_dispatch_proven':False,'limitations':profile.get('limitations',[])}
    if load_state(root,storage)['generation']!=state['generation']:raise ReindexError('Index changed during compiler analysis; retry')
    with lock_index(root.storage_path(storage)):
        write_json(destination,result)
    return result


def find_compiler_symbol(roots,storage,name,variant=None,limit=24):
    if not name or not 1<=limit<=100:raise ValueError('Provide symbol and a limit of 1 to 100')
    variant=variant or os.getenv('DEEPWIKI_BUILD_VARIANT')
    definitions=[];calls=[];coverage=[]
    for root in roots:
        state=load_state(root,storage);seen=set()
        try:profile=select_profile(root,variant)
        except ValueError:profile=None
        expected=hashlib.sha256(json.dumps(profile,sort_keys=True).encode()).hexdigest() if profile else None
        canonical=profile['id'] if profile else variant
        for path in (index_directory(root,storage)/'compiler-v1').glob('*.json'):
            if path.name.endswith('.vfs.json'):continue
            result=json.loads(path.read_text())
            if result['generation']!=state['generation'] or result['variant']!=canonical or result.get('profile_hash')!=expected:continue
            if any(not Path(d['path']).is_file() or hashlib.sha256(Path(d['path']).read_bytes()).hexdigest()!=d['sha256'] for d in result.get('sdk_dependencies',[])):continue
            seen.add(result['file_path'])
            definitions.extend(dict(d,variant=canonical,analysis_status=result['status']) for d in result['definitions'] if d['name']==name)
            calls.extend(dict(c,variant=canonical,analysis_status=result['status']) for c in result['calls'] if c['name']==name)
        coverage.append({'repository_id':root.id,'analyzed_translation_units':len(seen),
                         'selected_translation_units':sum(Path(p).suffix.lower()=='.c' for p in state['files'])})
    for call in calls:
        call['definition_candidates']=[d for d in definitions if d['usr']==call['target_usr'] and
            (d['linkage']=='EXTERNAL' or (d['repository_id']==call['repository_id'] and d['file_path']==call['file_path']))][:limit]
        call['link_status']='compiler_usr_candidate_not_linker_proof' if call['definition_candidates'] else 'not_found_in_analyzed_units'
    return {'symbol':name,'variant':variant,'definitions':definitions[:limit],'calls':calls[:limit],
            'coverage':coverage,'coverage_complete':all(c['analyzed_translation_units']==c['selected_translation_units'] for c in coverage),
            'truncated':len(definitions)>limit or len(calls)>limit,'runtime_dispatch_proven':False}


def enrich_compiler_context(roots,storage,hits,max_units=2):
    if all(getattr(root,'read_only',False) for root in roots) or os.getenv('DEEPWIKI_COMPILER_CONTEXT','false').lower()!='true':return hits
    variant=os.getenv('DEEPWIKI_BUILD_VARIANT');known={p['repository_id'] for p in profiles()['profiles'] if profile_matches(p,variant)}
    by_id={r.id:r for r in roots};done={}
    for hit in hits:
        key=(hit['repository_id'],hit['file_path'])
        if getattr(by_id.get(key[0]),'read_only',False) or key[0] not in known or Path(key[1]).suffix.lower()!='.c':continue
        if key not in done:
            if len(done)>=max_units:continue
            done[key]=analyze(by_id[key[0]],storage,key[1],variant)
        result=done[key];start=hit.get('start_line') or 1;end=hit.get('end_line') or start
        calls=[c for c in result['calls'] if c['file_path']==key[1] and start<=c['line']<=end]
        definitions=[d for d in result['definitions'] if d['file_path']==key[1] and d['line']<=end and start<=d['end_line']]
        hit['compiler_context']={k:result[k] for k in ('variant','target','status','compiler','generation','profile_completeness','runtime_dispatch_proven')}
        hit['compiler_context'].update(calls=calls[:12],definitions=definitions[:6],
             inactive_ranges=[r for r in result['inactive_ranges'] if r['start_line']<=end and start<=r['end_line']],
             evidence_truncated=len(calls)>12 or len(definitions)>6,
             diagnostics=result['diagnostics'][:4],limitations=result['limitations'],
             interpretation='Compiler binding for this explicit virtual variant; partial errors and missing build flags limit conclusions. Not runtime/linker proof.')
    return hits
