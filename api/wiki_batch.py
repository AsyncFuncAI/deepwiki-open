"""Resumable feature wiki queue over saved snapshots; no source embeddings or builds."""
import argparse
import asyncio
from contextlib import closing
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import time

def write_json(path,value):
    temporary=path.with_suffix(path.suffix+'.tmp')
    temporary.write_text(json.dumps(value,indent=2));temporary.replace(path)


def page_groups(paths,max_files=24):
    """Partition all saved paths into bounded directory-based feature groups."""
    def walk(names,directory):
        if len(names)<=max_files:return [(directory,names)]
        own=[];children={}
        prefix=directory+'/' if directory else ''
        for name in names:
            suffix=name[len(prefix):]
            if '/' not in suffix:own.append(name)
            else:children.setdefault(suffix.split('/')[0],[]).append(name)
        # Combine small sibling modules at their common parent instead of
        # generating one page for every tiny platform/include directory.
        large={}
        for child,entries in children.items():
            if len(entries)<=8:own.extend(entries)
            else:large[child]=entries
        own.sort();result=[]
        for offset in range(0,len(own),max_files):
            label=directory or 'root'
            if len(own)>max_files:label+=' / group '+str(offset//max_files+1)
            result.append((label,own[offset:offset+max_files]))
        for child,entries in sorted(large.items()):result+=walk(entries,prefix+child)
        return result
    if not paths:return []
    return walk(sorted(paths),'')


def make_plan(roots,storage,variant):
    from api.headless_wiki import index_versions
    from api.structural_index import compile_structure
    items=[];counts={}
    for root in roots:
        directory=compile_structure(root,storage)
        with closing(sqlite3.connect(directory/'structure.sqlite3')) as db:
            paths=[row[0] for row in db.execute('SELECT path FROM files ORDER BY path')]
        from api.headless_search import load_state
        if set(paths)!=set(load_state(root,storage)['files']):raise ValueError('Structural file inventory differs from active source manifest')
        counts[root.id]=len(paths)
        for area,files in page_groups(paths):
            identity=hashlib.sha256((root.id+'\0'+area+'\0'+'\n'.join(files)).encode()).hexdigest()[:16]
            items.append({'id':identity,'repository_id':root.id,'area':area or 'root','files':files,
                          'topic':root.id+' — '+(area or 'root')+' subsystem and feature guide'})
    def priority(item):
        path=item['area'];repo=item['repository_id']
        return (0 if 'unitedbuild' in repo else 1 if 'mng_plane' in repo else 3 if '/import/' in '/'+path+'/' else 2,path)
    items.sort(key=priority)
    return {'version':1,'index_generations':index_versions(roots,storage),'build_variant':variant,
            'model':os.getenv('CLINE_MODEL'),'provider':os.getenv('DEEPWIKI_PROVIDER'),'source_files':counts,'items':items,'coverage_policy':'Every indexed file belongs to one feature group; excerpts are bounded and do not establish exhaustive behavioral coverage.'}


def redact(text):
    # Preserve line numbering while withholding literal embedded credentials.
    text=re.sub(r'(?im)^([^\n]*(?:password|passwd|api_key|access_token|secret_key|private_key)\s*[:=]\s*).*$' ,r'\1[REDACTED]',text)
    return re.sub(r'-----BEGIN [^-]*PRIVATE KEY-----.*?-----END [^-]*PRIVATE KEY-----',
                  lambda match:'\n'.join('[REDACTED]' for _ in match[0].splitlines()),text,flags=re.S)


def evidence(item,root,storage):
    from api.structural_index import compile_structure
    directory=compile_structure(root,storage);hits=[];inventory=[]
    with closing(sqlite3.connect(directory/'structure.sqlite3')) as db:
        for path in item['files']:
            row=db.execute('SELECT id,text FROM files WHERE path=?',(path,)).fetchone()
            if not row:raise ValueError('Planned indexed source is missing')
            fid,text=row;lines=text.splitlines()
            symbols=list(db.execute("SELECT name,start_line FROM symbols WHERE file_id=? AND kind IN ('function','class','struct','typedef') ORDER BY start_line",(fid,)))
            inventory.append({'path':path,'lines':len(lines),'symbols':[name for name,_ in symbols[:16]]})
            anchors=[symbols[0][1] if symbols else 1]
            preferred=next((line for name,line in symbols if re.search(r'(main|init|create|handle|configure|setup)',name,re.I) and line>anchors[0]+24),None)
            if preferred:anchors.append(preferred)
            elif symbols and symbols[-1][1]>anchors[0]+24:anchors.append(symbols[-1][1])
            elif len(lines)>48:anchors.append(max(1,len(lines)//2))
            for anchor in anchors:
                start=max(1,anchor-3);end=min(len(lines),start+23)
                if not lines:continue
                selected=lines[start-1:end];bounded=[];size=0
                for line in selected:
                    shortened=line[:300];cost=len(shortened)+1
                    if bounded and size+cost>1000:break
                    bounded.append(shortened);size+=cost
                end=start+len(bounded)-1
                raw='\n'.join(bounded);clean=redact(raw)
                hits.append({'repository_id':root.id,'file_path':path,'start_line':start,'end_line':end,
                             'text':clean,'generation':directory.name,'quality':'saved_snapshot_bounded_excerpt',
                             'truncated':start>1 or end<len(lines) or any(len(line)>300 for line in selected),
                             'credentials_redacted':clean!=raw})
    if not hits:raise ValueError('Feature group has no nonempty source evidence')
    return hits,inventory


def error_state(exc):
    code=getattr(exc,'status_code',None);message=str(exc)
    if code==402 or (code in {400,403,429} and re.search(r'(credit|budget|balance|insufficient|payment|spend|exhaust)',message,re.I)):
        return 'budget_exhausted'
    if code==429:return 'rate_limited'
    return 'failed'


def safe_error(exc):
    message=str(exc)
    for name in ('CLINE_API_KEY','GOOGLE_API_KEY'):
        if os.getenv(name):message=message.replace(os.environ[name],'[REDACTED]')
    return message[:600]


async def run(roots,storage,wiki,job,plan,generate=None,answerer=None):
    from api.headless_wiki import generate_wiki,index_versions,wiki_status,render_page
    from api.headless_search import answer_from_sources
    generate=generate or generate_wiki;answerer=answerer or answer_from_sources
    if index_versions(roots,storage)!=plan['index_generations']:raise ValueError('Source generations changed; explicitly refresh the wiki plan before resuming')
    if os.getenv('CLINE_MODEL')!=plan.get('model') or os.getenv('DEEPWIKI_PROVIDER')!=plan.get('provider'):raise ValueError('Generation provider/model changed; explicitly refresh the wiki plan')
    if os.getenv('DEEPWIKI_BUILD_VARIANT','')!=plan['build_variant']:raise ValueError('Build variant changed; explicitly refresh the wiki plan')
    state_file=job/'status.json'
    old=json.loads(state_file.read_text()) if state_file.exists() else {}
    completed=dict(old.get('completed',{}));by_id={root.id:root for root in roots}
    initial=wiki_status(roots,storage,wiki)
    if initial.get('stale'):raise ValueError('Existing wiki is stale; explicit refresh required')
    published={page['topic']:page for page in initial.get('pages',[])}
    state={'version':1,'status':'running','pid':os.getpid(),'started':time.time(),'updated':time.time(),
           'total':len(plan['items']),'completed':completed,'completed_count':len(completed),'index_generations':plan['index_generations'],
           'generation_model':os.getenv('CLINE_MODEL'),'build_variant':plan['build_variant'],'source_embedding_calls':0}
    def save(**fields):
        state.update(fields,updated=time.time(),completed_count=len(completed));write_json(state_file,state)
    (job/'responses').mkdir(exist_ok=True)
    try:
        for item in plan['items']:
            if item['id'] in completed:continue
            response_file=job/'responses'/(item['id']+'.json')
            if item['topic'] in published:
                completed[item['id']]={'reconciled_after_restart':True};save();continue
            save(current_id=item['id'],current_topic=item['topic'],phase='preparing')
            async def page_answer(_roots,_storage,question,_top_k,_progress):
                if response_file.exists():return json.loads(response_file.read_text())
                hits,inventory=evidence(item,by_id[item['repository_id']],storage)
                question+=' Cover responsibilities, public interfaces, observed control/data flow, dependencies, configuration and failure handling where supported. Organize by feature, not a file-by-file paraphrase. The selected variant is '+plan['build_variant']+'. Do not infer active compilation or runtime behavior. This is a directory feature group; describe gaps from bounded excerpts. The scoped indexed-file inventory is: '+json.dumps(inventory)+'. Do not imply whole-repository coverage.'
                save(phase='generating')
                started=time.time();result=await answerer(question,hits)
                result['coverage']={'planned_files':item['files'],'excerpt_files':sorted({hit['file_path'] for hit in hits}),'exhaustive_behavior':False,'group_id':item['id']}
                result['generation_seconds']=round(time.time()-started,2)
                # Persist a paid draft before publication, so crashes never require buying it again.
                write_json(response_file,result);render_page(item['topic'],result)
                return result
            result=await generate(roots,storage,[item['topic']],wiki,top_k=48,answerer=page_answer)
            response=json.loads(response_file.read_text())
            completed[item['id']]={'generation':result['generation'],'usage':response.get('usage'),'finished':time.time()}
            total_cost=sum((entry.get('usage') or {}).get('cost',0) or 0 for entry in completed.values())
            save(phase='published',reported_generation_cost=total_cost)
            print(json.dumps({'completed':len(completed),'total':len(plan['items']),'topic':item['topic'],'reported_generation_cost':total_cost}),flush=True)
        save(status='complete',phase='complete',current_id=None,current_topic=None)
    except Exception as exc:
        save(status=error_state(exc),error=safe_error(exc),error_type=type(exc).__name__,http_status=getattr(exc,'status_code',None))
        print(json.dumps({'status':state['status'],'completed':len(completed),'error_type':type(exc).__name__}),flush=True)
        return 2
    return 0


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--env-file',type=Path,default=Path('.env'))
    parser.add_argument('--job-dir',type=Path)
    parser.add_argument('--plan-only',action='store_true')
    args=parser.parse_args(argv)
    from dotenv import load_dotenv
    load_dotenv(args.env_file)
    from api.headless import load_env_roots
    from api.headless_settings import runtime_paths,require_writable
    from api.config import configs
    configs['text_splitter']={'split_by':'token','chunk_size':1000,'chunk_overlap':150};configs['embedder_google']['batch_size']=100
    storage,wiki,_=runtime_paths(args.env_file);roots=load_env_roots(args.env_file,storage);require_writable(roots)
    job=(args.job_dir or wiki/'batch').expanduser().resolve()
    if any(job.is_relative_to(root.path) for root in roots):raise ValueError('Wiki job must be outside sources')
    job.mkdir(parents=True,exist_ok=True)
    with (job/'run.lock').open('a') as lock:
        try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:raise SystemExit('Wiki batch is already running; no duplicate started')
        plan_file=job/'plan.json'
        if plan_file.exists():plan=json.loads(plan_file.read_text())
        else:
            plan=make_plan(roots,storage,os.getenv('DEEPWIKI_BUILD_VARIANT',''));write_json(plan_file,plan)
        if args.plan_only:
            print(json.dumps({'pages':len(plan['items']),'source_files':plan['source_files'],'job_dir':str(job)}));return 0
        if os.getenv('DEEPWIKI_PROVIDER')!='cline' or os.getenv('CLINE_BASE_URL','').rstrip('/')!='https://api.cline.bot/api/v1':
            raise ValueError('Batch requires the explicitly authorized Cline destination')
        if not all(os.getenv(key,'false').lower()=='true' for key in ('DEEPWIKI_ALLOW_SOURCE_EXCERPTS','DEEPWIKI_ALLOW_WIKI_SOURCE_EXCERPTS')):
            raise ValueError('Source-excerpt approvals are required')
        os.environ['CLINE_MAX_RETRIES']='0'
        return asyncio.run(run(roots,storage,wiki,job,plan))


if __name__=='__main__':raise SystemExit(main())
