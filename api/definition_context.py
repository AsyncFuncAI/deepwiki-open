"""Read linked windows of a definition from one immutable source generation."""
from contextlib import closing
import sqlite3
from api.structural_index import compile_structure,excerpt,validate
from api.reindex import ReindexError


def definition_window(root,storage_root,name,file_path,definition_line,window_start=None,max_lines=120,generation=None):
    validate(name,1)
    if type(definition_line) is not int or definition_line<1:raise ValueError("definition_line must be a positive source line")
    if type(max_lines) is not int or not 1<=max_lines<=120:raise ValueError("max_lines must be between 1 and 120")
    directory=compile_structure(root,storage_root)
    if generation is not None and generation!=directory.name:
        raise ReindexError("Source generation changed; repeat symbol lookup before following definition windows")
    with closing(sqlite3.connect(f"file:{directory/'structure.sqlite3'}?mode=ro",uri=True)) as db:
        rows=db.execute("SELECT f.text,s.start_line,s.end_line,s.kind,s.container,s.quality FROM symbols s JOIN files f ON f.id=s.file_id WHERE f.path=? AND s.name=? AND s.start_line=?",(file_path,name,definition_line)).fetchall()
    if not rows:raise ValueError("Definition not found in the selected indexed snapshot")
    if len(rows)>1:raise ValueError("Definition identity is ambiguous; inspect symbol results")
    text,start,end,kind,container,quality=rows[0]
    offset=start if window_start is None else window_start
    if type(offset) is not int or not start<=offset<=end:raise ValueError("window_start is outside the definition")
    selected=excerpt(text,offset,end,max_lines)
    result=dict(selected,repository_id=root.id,file_path=file_path,name=name,kind=kind,container=container,quality=quality,
        generation=directory.name,definition_start_line=start,
        previous_start_line=max(start,offset-max_lines) if offset>start else None,
        next_start_line=selected["end_line"]+1 if selected["end_line"]<end else None)

    from api.c_conditions import annotate_conditions
    return annotate_conditions(root,storage_root,result,directory)
