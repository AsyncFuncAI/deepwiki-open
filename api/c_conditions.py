"""Lazy, content-keyed preprocessor branch evidence from indexed C snapshots."""
from contextlib import closing
import hashlib
from importlib.metadata import version
import json
from pathlib import Path
import sqlite3
import uuid

PARSER_ID=hashlib.sha256((version("tree-sitter")+":"+version("tree-sitter-c")+":1").encode()).hexdigest()[:12]


def parse_conditions(text):
    from tree_sitter import Language,Parser
    import tree_sitter_c
    data=text.encode();language=Language(tree_sitter_c.language());parser=Parser(language);tree=parser.parse(data)
    guards=[]
    quality="syntax_with_errors" if tree.root_node.has_error else "parsed_syntax"
    def value(node):return data[node.start_byte:node.end_byte].decode(errors="replace") if node else ""
    stack=[tree.root_node]
    while stack:
        node=stack.pop()
        if node.type in {"preproc_if","preproc_ifdef"}:
            end=next((child.start_point.row for child in reversed(node.children) if child.type=="#endif"),node.end_point.row+1)
            branch=node;prior=[]
            while branch is not None:
                alternative=branch.child_by_field_name("alternative")
                condition=branch.child_by_field_name("condition") or branch.child_by_field_name("name")
                directive=branch.children[0]
                kind=value(directive).removeprefix("#")
                expression=value(condition)
                if kind=="ifdef":expression="defined("+expression+")"
                elif kind=="ifndef":expression="!defined("+expression+")"
                first=(condition.end_point.row if condition else directive.end_point.row)+2
                last=alternative.start_point.row if alternative else end
                if first<=last:
                    guards.append({"group_line":node.start_point.row+1,"directive_line":branch.start_point.row+1,
                        "branch":kind,"condition":expression[:384] if expression else None,
                        "condition_text_truncated":len(expression)>384,
                        "excluded_prior_conditions":[item[:384] for item in prior[:8]],
                        "prior_conditions_truncated":len(prior)>8 or any(len(item)>384 for item in prior),
                        "start_line":first,"end_line":last,"quality":quality,"build_variant":"unselected"})
                if expression:prior.append(expression)
                branch=alternative
        stack.extend(reversed(node.named_children))
    return {"guards":sorted(guards,key=lambda item:(item['directive_line'],item['end_line'])),"quality":quality}


def annotate_conditions(root,storage_root,hit,directory=None):
    if Path(hit['file_path']).suffix.lower() not in {'.c','.h'}:return hit
    if directory is None:
        from api.structural_index import compile_structure
        directory=compile_structure(root,storage_root)
    with closing(sqlite3.connect(f"file:{directory/'structure.sqlite3'}?mode=ro",uri=True)) as db:
        row=db.execute("SELECT hash FROM files WHERE path=?",(hit['file_path'],)).fetchone()
    if row is None:return hit
    digest=row[0]
    from api.headless_settings import cache_lock_directory
    cache=cache_lock_directory(root,storage_root)/('conditions-v1-'+PARSER_ID)
    filename=cache/(digest+'.json')
    if filename.exists():result=json.loads(filename.read_text())
    else:
        with closing(sqlite3.connect(f"file:{directory/'structure.sqlite3'}?mode=ro",uri=True)) as db:
            text=db.execute("SELECT text FROM files WHERE path=?",(hit['file_path'],)).fetchone()[0]
        result=parse_conditions(text)
        cache.mkdir(parents=True,exist_ok=True)
        temporary=cache/(digest+'.'+uuid.uuid4().hex+'.tmp')
        try:
            temporary.write_text(json.dumps(result));temporary.replace(filename)
        finally:temporary.unlink(missing_ok=True)
    start=hit.get('start_line');end=hit.get('end_line')
    contexts=[]
    if start is not None and end is not None:
        for guard in result['guards']:
            if guard['start_line']<=end and start<=guard['end_line']:
                contexts.append(dict(guard,scope='covers_excerpt' if guard['start_line']<=start and guard['end_line']>=end else 'overlaps_excerpt'))
    hit.update(conditional_context=contexts[:16],conditional_context_truncated=len(contexts)>16,
        conditional_context_quality=result['quality'],build_variant='unselected')
    return hit
