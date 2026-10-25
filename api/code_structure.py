"""Local source syntax extraction. Relationships are evidence, not resolved execution."""
import ast
from pathlib import Path
import re


def parse_source(filename,text):
    suffix=Path(filename).suffix.lower()
    if suffix in {".c",".h"}:return parse_c(text)
    if suffix==".py":return parse_python(text)
    if suffix==".sh":return parse_shell(text)
    return parse_make(text)


def parse_c(text):
    from tree_sitter import Language,Parser
    import tree_sitter_c
    data=text.encode()
    language=Language(tree_sitter_c.language())
    parser=Parser(language)
    tree=parser.parse(data)
    symbols=[];edges=[]
    quality="syntax_with_errors" if tree.root_node.has_error else "parsed_syntax"
    def value(node):return data[node.start_byte:node.end_byte].decode(errors="replace") if node else ""
    def decl_name(node):
        if node is None:return ""
        if node.type in {"identifier","type_identifier","field_identifier"}:return value(node)
        child=node.child_by_field_name("declarator")
        if child:return decl_name(child)
        for child in node.named_children:
            name=decl_name(child)
            if name:return name
        return ""
    def add_symbol(node,name,kind,container):
        if name:
            end=node.end_point.row+(1 if node.end_point.column else 0)
            symbols.append((name,kind,node.start_point.row+1,max(node.start_point.row+1,end),container,quality))
    stack=[(tree.root_node,"")]
    while stack:
        node,container=stack.pop()
        if node.type=="function_definition":
            name=decl_name(node.child_by_field_name("declarator"))
            add_symbol(node,name,"function",container);container=name
        elif node.type in {"struct_specifier","union_specifier","enum_specifier"}:
            add_symbol(node,value(node.child_by_field_name("name")),node.type.removesuffix("_specifier"),container)
        elif node.type in {"preproc_def","preproc_function_def"}:
            add_symbol(node,value(node.child_by_field_name("name")),"macro",container)
        elif node.type=="type_definition":
            add_symbol(node,decl_name(node.child_by_field_name("declarator")),"typedef",container)
        elif node.type=="declaration" and not container:
            for declarator in node.children_by_field_name("declarator"):
                kind="function_declaration" if "function_declarator" in str(declarator) else "global"
                add_symbol(node,decl_name(declarator),kind,container)
        if node.type=="call_expression":
            target=value(node.child_by_field_name("function"))
            edges.append((container,target,"call_syntax",node.start_point.row+1,quality,"Unresolved call syntax; macro expansion, pointers and build variants are not evaluated"))
        elif node.type=="preproc_include":
            target=value(node.child_by_field_name("path"))
            edges.append((container,target,"include",node.start_point.row+1,quality,"Include spelling only; include paths are not compiler-resolved"))
        elif node.type in {"preproc_if","preproc_ifdef","preproc_elif"}:
            condition=value(node.child_by_field_name("condition") or node.child_by_field_name("name"))
            edges.append((container,condition,"conditional_compilation",node.start_point.row+1,quality,"Build variant not selected"))
        stack.extend((child,container) for child in reversed(node.named_children))
    return symbols,edges,quality


def parse_python(text):
    symbols=[];edges=[]
    try:tree=ast.parse(text)
    except (SyntaxError,ValueError):
        for number,line in enumerate(text.splitlines(),1):
            match=re.match(r"\s*(?:async\s+)?(def|class)\s+([A-Za-z_]\w*)",line)
            if match:symbols.append((match[2],"function" if match[1]=="def" else "class",number,number,"","heuristic_python_parse_failed"))
        return symbols,edges,"heuristic_python_parse_failed"
    class Visitor(ast.NodeVisitor):
        container=""
        def visit_FunctionDef(self,node):
            self.definition(node,"function")
        visit_AsyncFunctionDef=visit_FunctionDef
        def visit_ClassDef(self,node):self.definition(node,"class")
        def definition(self,node,kind):
            qualified=self.container+"."+node.name if self.container else node.name
            symbols.append((node.name,kind,node.lineno,node.end_lineno,self.container,"parsed_syntax"))
            previous=self.container;self.container=qualified;self.generic_visit(node);self.container=previous
        def visit_Call(self,node):
            target=ast.unparse(node.func)
            edges.append((self.container,target,"call_syntax",node.lineno,"parsed_syntax","Dynamic Python dispatch is unresolved"))
            self.generic_visit(node)
        def visit_Import(self,node):
            for alias in node.names:edges.append((self.container,alias.name,"import",node.lineno,"parsed_syntax","Import spelling; module resolution not executed"))
        def visit_ImportFrom(self,node):
            prefix="."*node.level+(node.module or "")
            for alias in node.names:edges.append((self.container,prefix+"."+alias.name,"import",node.lineno,"parsed_syntax","Import spelling; module resolution not executed"))
    Visitor().visit(tree)
    return symbols,edges,"parsed_syntax"


def parse_shell(text):
    symbols=[];edges=[];container=""
    for number,line in enumerate(text.splitlines(),1):
        if line.lstrip().startswith("#"):continue
        match=re.match(r"\s*(?:function\s+)?([A-Za-z_]\w*)\s*\(\s*\)\s*\{",line)
        if not match:match=re.match(r"\s*function\s+([A-Za-z_]\w*)\s*\{",line)
        if match:
            container=match[1];symbols.append((container,"shell_function",number,number,"","heuristic"))
        for script in re.findall(r"(?:^|[\s;])(?:sh\s+|bash\s+)?([A-Za-z0-9_./-]+\.sh)\b",line):
            edges.append(("",script,"script_reference",number,"heuristic","Literal script reference; function scope and execution not established"))
    return symbols,edges,"heuristic"


def parse_make(text):
    symbols=[];edges=[];targets=[];pending="";start=0
    for number,line in enumerate(text.splitlines(),1):
        if not pending:start=number
        pending+=line.rstrip("\\")
        if line.endswith("\\"):
            pending+=" ";continue
        logical=pending;pending=""
        if not logical.strip() or logical.lstrip().startswith("#"):continue
        if logical.startswith("\t"):
            if "$(MAKE)" in logical or re.search(r"\bmake\b",logical):
                for target in targets:edges.append((target,logical.strip(),"make_invocation",start,"heuristic","Recipe recorded, never executed; variables unresolved"))
            for script in re.findall(r"([A-Za-z0-9_./-]+\.sh)\b",logical):
                for target in targets:edges.append((target,script,"script_reference",start,"heuristic","Recipe reference, never executed"))
            continue
        include=re.match(r"\s*(?:-?include|sinclude)\s+(.+)",logical)
        if include:
            for name in include[1].split():edges.append(("",name,"make_include",start,"heuristic","Make expansion not evaluated"))
            continue
        variable=re.match(r"\s*([A-Za-z_]\w*)\s*([:+?]?=)",logical)
        if variable:
            symbols.append((variable[1],"make_variable",start,number,"","heuristic"));continue
        target=re.match(r"\s*([^:=]+?)\s*::?\s*(.*)",logical)
        if target:
            targets=target[1].split()
            for name in targets:
                symbols.append((name,"make_target",start,number,"","heuristic"))
                for prerequisite in target[2].split("#",1)[0].split():
                    if prerequisite!="|":edges.append((name,prerequisite,"make_prerequisite",start,"heuristic","Literal spelling; variable/pattern expansion not evaluated"))
    return symbols,edges,"heuristic"
