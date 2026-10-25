"""Local, generation-bound exact and syntax lookup over saved source documents."""
from contextlib import closing
from collections import defaultdict
import json
from pathlib import Path
import re
import shutil
import sqlite3
import uuid

from adalflow.core.db import LocalDB
from api.saved_index import load_saved_part
from api.code_structure import parse_source
from api.headless_index import index_directory,write_json
from api.headless_search import load_state
from api.reindex import ReindexError,lock_index,text_hash


def saved_sources(state,names):
    by_part=defaultdict(set)
    for name in names:by_part[state["files"][name]["part"]].add(name)
    for part,selected in by_part.items():
        db=load_saved_part(part)
        found=set()
        for doc in db.items:
            name=doc.meta_data["file_path"]
            if name not in selected:continue
            if name in found or text_hash(doc.text)!=state["files"][name]["hash"]:
                raise ReindexError("Saved structural source hash mismatch")
            found.add(name)
            yield name,doc.text
        for name in selected-found:
            if state["files"][name]["chunks"]:
                raise ReindexError("Saved structural source document is missing")
            # Whitespace-only update parts intentionally have no raw document.
            yield name,""


def compile_structure(root,storage_root,progress=None):
    state=load_state(root,storage_root)
    from api.headless_settings import cache_directory,cache_lock_directory
    base=cache_directory(root,storage_root)/"structure-v1"
    directory=base/state["generation"]
    with lock_index(cache_lock_directory(root,storage_root)):
        if (directory/"ready.json").exists():return directory
        directory.mkdir(parents=True,exist_ok=True)
        temporary=directory/(uuid.uuid4().hex+".building")
        previous=sorted((p for p in base.glob("*/structure.sqlite3") if (p.parent/"ready.json").exists()),key=lambda p:p.stat().st_mtime_ns,reverse=True)
        if previous:shutil.copyfile(previous[0],temporary)
        connection=sqlite3.connect(temporary)
        try:
            connection.executescript("""
                CREATE TABLE IF NOT EXISTS files(id INTEGER PRIMARY KEY,path TEXT UNIQUE,hash TEXT,text TEXT,quality TEXT);
                CREATE TABLE IF NOT EXISTS symbols(file_id INTEGER,name TEXT,kind TEXT,start_line INTEGER,end_line INTEGER,container TEXT,quality TEXT);
                CREATE INDEX IF NOT EXISTS symbol_name ON symbols(name);
                CREATE TABLE IF NOT EXISTS edges(file_id INTEGER,source TEXT,target TEXT,kind TEXT,line INTEGER,quality TEXT,details TEXT);
                CREATE INDEX IF NOT EXISTS edge_source ON edges(source);
                CREATE INDEX IF NOT EXISTS edge_target ON edges(target);
                CREATE VIRTUAL TABLE IF NOT EXISTS source_fts USING fts5(text,content='files',content_rowid='id',tokenize="unicode61 tokenchars '_'");
            """)
            existing={path:(row,digest) for row,path,digest in connection.execute("SELECT id,path,hash FROM files")}
            changed={name for name,record in state["files"].items() if name not in existing or existing[name][1]!=record["hash"]}
            removed=set(existing)-set(state["files"])
            for name in removed|changed.intersection(existing):
                row,_=existing[name]
                text=connection.execute("SELECT text FROM files WHERE id=?",(row,)).fetchone()[0]
                connection.execute("INSERT INTO source_fts(source_fts,rowid,text) VALUES('delete',?,?)",(row,text))
                connection.execute("DELETE FROM symbols WHERE file_id=?",(row,))
                connection.execute("DELETE FROM edges WHERE file_id=?",(row,))
                connection.execute("DELETE FROM files WHERE id=?",(row,))
            for number,(name,text) in enumerate(saved_sources(state,changed),1):
                symbols,edges,quality=parse_source(name,text)
                row=connection.execute("INSERT INTO files(path,hash,text,quality) VALUES(?,?,?,?)",(name,state["files"][name]["hash"],text,quality)).lastrowid
                connection.execute("INSERT INTO source_fts(rowid,text) VALUES(?,?)",(row,text))
                connection.executemany("INSERT INTO symbols VALUES(?,?,?,?,?,?,?)",[(row,*s) for s in symbols])
                connection.executemany("INSERT INTO edges VALUES(?,?,?,?,?,?,?)",[(row,*e) for e in edges])
                if progress and number%250==0:progress({"id":root.id,"phase":"compile_structure","parsed_files":number,"changed_files":len(changed)})
            connection.commit()
            counts={table:connection.execute("SELECT count(*) FROM "+table).fetchone()[0] for table in ("files","symbols","edges")}
            if counts["files"]!=len(state["files"]):raise ReindexError("Structural file count mismatch")
            connection.close()
            temporary.replace(directory/"structure.sqlite3")
            write_json(directory/"ready.json",dict(counts,generation=state["generation"],parsed_files=len(changed),removed_files=len(removed),format=1))
            return directory
        except Exception:
            connection.close()
            temporary.unlink(missing_ok=True)
            raise


def validate(query,limit):
    if not isinstance(query,str) or not query.strip() or len(query)>512:raise ValueError("A nonempty lookup of at most 512 characters is required")
    if not 1<=limit<=50:raise ValueError("limit must be between 1 and 50")


def excerpt(text,start,end,budget=120):
    lines=text.splitlines();last=min(end,start+budget-1,len(lines))
    selected="\n".join(lines[start-1:last])
    text_truncated=len(selected)>24000
    return {"start_line":start,"end_line":last,"definition_end_line":end,"truncated":last<end or text_truncated,"text_truncated":text_truncated,"text":selected[:24000]}


def lookup(roots,storage_root,query,mode="symbol",limit=8,progress=None,file_path=None):
    validate(query,limit)
    if mode not in {"symbol","keyword","relations","filename"}:raise ValueError("Unknown structural lookup mode")
    hits=[]
    for root in roots:
        directory=compile_structure(root,storage_root,progress)
        with closing(sqlite3.connect(f"file:{directory/'structure.sqlite3'}?mode=ro",uri=True)) as connection:
            if mode=="symbol":
                rows=connection.execute("SELECT f.path,f.text,s.name,s.kind,s.start_line,s.end_line,s.container,s.quality FROM symbols s JOIN files f ON f.id=s.file_id WHERE (s.name=? OR (s.name=? AND s.container=?)) AND (? IS NULL OR f.path=?) ORDER BY f.path,s.start_line LIMIT ?",(query,query.rpartition(".")[2],query.rpartition(".")[0],file_path,file_path,limit))
                for path,text,name,kind,start,end,container,quality in rows:
                    hits.append(dict(repository_id=root.id,file_path=path,name=name,kind=kind,container=container,quality=quality,**excerpt(text,start,end)))
            elif mode=="filename":
                # Match saved paths or basenames literally; never open a user path.
                rows=connection.execute("SELECT path,text FROM files WHERE path=? OR substr(path,-length(?)-1)=? ORDER BY path LIMIT ?",(query,query,"/"+query,limit))
                for path,text in rows:
                    hits.append(dict(repository_id=root.id,file_path=path,kind="filename",**excerpt(text,1,len(text.splitlines()))))
            elif mode=="relations":
                rows=connection.execute("SELECT f.path,f.text,e.source,e.target,e.kind,e.line,e.quality,e.details FROM edges e JOIN files f ON f.id=e.file_id WHERE e.source=? OR e.target=? ORDER BY f.path,e.line LIMIT ?",(query,query,limit))
                for path,text,source,target,kind,line,quality,details in rows:
                    hits.append(dict(repository_id=root.id,file_path=path,source=source,target=target,kind=kind,quality=quality,details=details,resolution="unresolved_syntax_or_literal",**excerpt(text,line,line)))
            else:
                # Quote the whole phrase so user input cannot become FTS operators.
                phrase='"'+query.replace('"','""')+'"'
                rows=connection.execute("SELECT f.path,f.text FROM source_fts JOIN files f ON f.id=source_fts.rowid WHERE source_fts MATCH ? AND instr(f.text,?)>0 ORDER BY rank LIMIT ?",(phrase,query,limit))
                pattern=re.compile(r"(?<!\w)"+re.escape(query)+r"(?!\w)")
                for path,text in rows:
                    lines=text.splitlines()
                    for number,line in enumerate(lines,1):
                        if pattern.search(line):
                            hits.append(dict(repository_id=root.id,file_path=path,kind="exact_text",**excerpt(text,number,number)))
                            if sum(h["repository_id"]==root.id for h in hits)>=limit:break
                    if sum(h["repository_id"]==root.id for h in hits)>=limit:break
        for hit in hits:
            if hit["repository_id"]==root.id:
                hit.setdefault("generation",directory.name)
                from api.c_conditions import annotate_conditions
                annotate_conditions(root,storage_root,hit,directory)
    # Round-robin roots so duplicate names in an early root do not hide later roots.
    groups=[[hit for hit in hits if hit["repository_id"]==root.id] for root in roots]
    return [group[n] for n in range(limit) for group in groups if n<len(group)][:limit]
