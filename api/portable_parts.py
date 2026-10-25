"""Non-executable SQLite source/vector parts for transferable datasets."""
from contextlib import closing
import json
from pathlib import Path
import sqlite3
from types import SimpleNamespace
import numpy as np
from adalflow.core.types import Document

APP_ID=1129794353


def metadata(document):
    allowed={'id','text','parent_doc_id','order','estimated_num_tokens'}
    value={key:getattr(document,key) for key in allowed if hasattr(document,key)}
    meta=dict(document.meta_data or {});meta.pop('source_root',None)
    value['meta_data']=meta
    return json.dumps(value,ensure_ascii=False)


def save_part(filename,items,chunks):
    filename=Path(filename)
    if filename.exists():raise ValueError('Refusing to replace an existing portable part')
    with closing(sqlite3.connect(filename)) as db:
        db.execute('PRAGMA application_id='+str(APP_ID))
        db.executescript('CREATE TABLE documents(payload TEXT NOT NULL); CREATE TABLE chunks(payload TEXT NOT NULL,vector BLOB NOT NULL,dimensions INTEGER NOT NULL);')
        db.executemany('INSERT INTO documents VALUES(?)',((metadata(doc),) for doc in items))
        for chunk in chunks:
            vector=np.asarray(chunk.vector,dtype='<f4')
            if vector.ndim!=1 or len(vector)==0 or not np.isfinite(vector).all() or np.linalg.norm(vector)==0:raise ValueError('Invalid portable vector')
            db.execute('INSERT INTO chunks VALUES(?,?,?)',(metadata(chunk),vector.tobytes(),len(vector)))
        db.commit()


def load_part(filename):
    uri=Path(filename).resolve().as_uri()+'?mode=ro'
    with closing(sqlite3.connect(uri,uri=True)) as db:
        db.execute('PRAGMA trusted_schema=OFF');db.execute('PRAGMA query_only=ON')
        if db.execute('PRAGMA application_id').fetchone()[0]!=APP_ID:raise ValueError('Unrecognized portable chunk part')
        kinds=dict(db.execute("SELECT name,type FROM sqlite_master WHERE name IN ('documents','chunks')"))
        if kinds!={'documents':'table','chunks':'table'}:raise ValueError('Invalid portable document tables')
        items=[Document(**json.loads(payload)) for payload, in db.execute('SELECT payload FROM documents')]
        chunks=[]
        for payload,blob,dimension in db.execute('SELECT payload,vector,dimensions FROM chunks'):
            if not isinstance(dimension,int) or dimension<1 or len(blob)!=dimension*4:raise ValueError('Invalid vector dimensions')
            vector=np.frombuffer(blob,dtype='<f4').copy()
            if not np.isfinite(vector).all() or np.linalg.norm(vector)==0:raise ValueError('Invalid portable vector')
            chunks.append(Document(**json.loads(payload),vector=vector))
    return SimpleNamespace(items=items,get_transformed_data=lambda key:chunks if key=='split_and_embed' else [])
