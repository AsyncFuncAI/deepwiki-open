"""Opt-in syntax chunks with lossless source offsets and linked oversized spans."""
from bisect import bisect_right
import hashlib
import os
from pathlib import Path
import re

from adalflow.core.component import Component
from adalflow.core.types import Document
import tiktoken
from api.code_structure import parse_source


def chunk_strategy():
    strategy=os.getenv('DEEPWIKI_CHUNK_STRATEGY','token').strip()
    if strategy not in {'token','syntax-v1'}:raise ValueError('DEEPWIKI_CHUNK_STRATEGY must be token or syntax-v1')
    return strategy


class SyntaxTextSplitter(Component):
    def __init__(self,split_by='token',chunk_size=1000,chunk_overlap=150,**kwargs):
        super().__init__()
        if split_by!='token' or chunk_size<1 or not 0<=chunk_overlap<chunk_size:
            raise ValueError('Syntax chunks require token splitting with 0 <= overlap < size')
        self.chunk_size=chunk_size;self.chunk_overlap=chunk_overlap

    def call(self,documents):
        if not isinstance(documents,list) or any(not isinstance(doc,Document) for doc in documents):
            raise TypeError('Expected a list of Documents')
        encoding=tiktoken.get_encoding('cl100k_base')
        count=lambda text:len(encoding.encode(text,disallowed_special=()))
        output=[]
        for doc in documents:
            if not isinstance(doc.text,str):raise ValueError('Source text must be a string')
            text=doc.text;meta=doc.meta_data or {};path=meta.get('file_path','')
            offsets=[0]+[match.end() for match in re.finditer('\n',text)]
            symbols=[];quality='token_fallback_no_definition_parser';conditions=None
            if Path(path).suffix.lower() in {'.c','.h','.py'}:
                symbols,_,quality=parse_source(path,text)
                if quality!='parsed_syntax':symbols=[]
            if Path(path).suffix.lower() in {'.c','.h'}:
                from api.c_conditions import parse_conditions
                conditions=parse_conditions(text)
            decorated={}
            if Path(path).suffix.lower()=='.py' and quality=='parsed_syntax':
                import ast
                for node in ast.walk(ast.parse(text)):
                    if isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef,ast.ClassDef)) and node.decorator_list:
                        decorated[node.lineno]=min(item.lineno for item in node.decorator_list)
            definitions=[]
            for name,kind,start,end,container,_ in symbols:
                if kind not in {'function','class'}:continue
                start=decorated.get(start,start)
                begin=offsets[min(start-1,len(offsets)-1)]
                finish=offsets[end] if end<len(offsets) else len(text)
                identity=hashlib.sha256(f"{meta.get('repository_id','')}:{path}:{container}:{name}:{start}:{kind}".encode()).hexdigest()
                definitions.append(dict(id=identity,name=name,kind=kind,start_line=start,end_line=end,begin=begin,finish=finish))
            outer=[];cursor=0
            for definition in sorted(definitions,key=lambda d:(d['begin'],-d['finish'])):
                if definition['begin']<cursor:continue
                if definition['begin']>cursor:outer.append((cursor,definition['begin'],None))
                outer.append((definition['begin'],definition['finish'],definition));cursor=definition['finish']
            if cursor<len(text):outer.append((cursor,len(text),None))
            source_hash=hashlib.sha256(text.encode()).hexdigest()
            order=0
            for begin,finish,definition in outer:
                windows=[];cursor=begin
                whole_fits=count(text[begin:finish])<=self.chunk_size
                while cursor<finish:
                    if whole_fits:end=finish
                    else:
                        low=cursor+1;high=min(finish,cursor+self.chunk_size*8);end=cursor
                        while low<=high:
                            middle=(low+high)//2
                            if count(text[cursor:middle])<=self.chunk_size:end=middle;low=middle+1
                            else:high=middle-1
                        if end==cursor:raise ValueError('A source character exceeds the token budget')
                        if end<finish:
                            newline=text.rfind('\n',cursor,end)
                            if newline>=cursor:end=newline+1
                    windows.append((cursor,end))
                    if end==finish:break
                    if count(text[cursor:end])<=self.chunk_overlap:
                        cursor=end
                        continue
                    # Find a character-aligned suffix within the token overlap.
                    low=cursor+1;high=end;following=end
                    while low<=high:
                        middle=(low+high)//2
                        if count(text[middle:end])<=self.chunk_overlap:following=middle;high=middle-1
                        else:low=middle+1
                    cursor=max(cursor+1,following)
                ids=[hashlib.sha256((str(meta.get('repository_id',''))+':'+path+':'+source_hash+':syntax-v1:'+str(a)+':'+str(b)).encode()).hexdigest() for a,b in windows]
                for piece,(a,b) in enumerate(windows):
                    selected=dict(meta,chunk_strategy='syntax-v1',char_start=a,char_end=b,
                        start_line=bisect_right(offsets,a),end_line=bisect_right(offsets,max(a,b-1)),
                        syntax_quality=quality,piece_index=piece,piece_count=len(windows),
                        previous_piece_id=ids[piece-1] if piece else None,next_piece_id=ids[piece+1] if piece+1<len(ids) else None)
                    if definition:selected.update(definition_id=definition['id'],definition_name=definition['name'],definition_kind=definition['kind'],definition_start_line=definition['start_line'],definition_end_line=definition['end_line'])
                    nested=[{key:d[key] for key in ('id','name','kind','start_line','end_line')} for d in definitions if d['begin']<b and a<d['finish']]
                    selected.update(definition_symbols=nested[:16],definition_symbols_truncated=len(nested)>16)
                    if conditions is not None:
                        guards=[dict(g,scope='covers_excerpt' if g['start_line']<=selected['start_line'] and g['end_line']>=selected['end_line'] else 'overlaps_excerpt') for g in conditions['guards'] if g['start_line']<=selected['end_line'] and selected['start_line']<=g['end_line']]
                        selected.update(conditional_context=guards[:16],conditional_context_truncated=len(guards)>16,conditional_context_quality=conditions['quality'],build_variant='unselected')
                    output.append(Document(text=text[a:b],meta_data=selected,id=ids[piece],parent_doc_id=str(doc.id),order=order,vector=[],estimated_num_tokens=count(text[a:b])))
                    order+=1
        return output


def estimate_root_chunks(root,progress=None):
    """Count planned chunks locally; no model initialization or index writes."""
    from api.config import configs,iterate_files
    from api.rag.pipeline import read_all_documents,LineTrackingTextSplitter
    strategy=chunk_strategy()
    splitter=SyntaxTextSplitter(**configs['text_splitter']) if strategy=='syntax-v1' else LineTrackingTextSplitter(**configs['text_splitter'])
    files=sorted(iterate_files(str(root.path),**root.filters));chunks=0;read=0;skipped=[];tokens=0
    encoding=tiktoken.get_encoding('cl100k_base')
    for number,name in enumerate(files,1):
        if not (root.path/name).resolve().is_relative_to(root.path):continue
        docs=read_all_documents(str(root.path),file_paths=[name],full_source=True)
        if not docs:skipped.append(name);continue
        docs[0].meta_data.update(repository_id=root.id)
        pieces=splitter(docs);chunks+=len(pieces);read+=1
        tokens+=sum(len(encoding.encode(piece.text,disallowed_special=())) for piece in pieces)
        if progress and number%250==0:progress({'id':root.id,'phase':'estimate_chunks','files_done':number,'files_total':len(files),'chunks':chunks})
    return {'id':root.id,'strategy':strategy,'selected_files':len(files),'read_files':read,'chunks':chunks,'estimated_embedding_tokens':tokens,'skipped':skipped,'embedding_calls':0}


def chunk_language(path):
    suffix=Path(path).suffix.lower()
    return 'c' if suffix in {'.c','.h'} else 'python' if suffix=='.py' else 'plain'


def same_chunk_language(first,second):
    return chunk_language(first)==chunk_language(second)
