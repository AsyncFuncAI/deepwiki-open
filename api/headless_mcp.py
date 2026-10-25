"""stdio MCP server for codeWiki; run over the existing SSH connection."""
import argparse
from contextlib import redirect_stdout
from pathlib import Path
import sys


def create_server(roots,storage_root,wiki_root=None):
    # Third-party import output must never enter the JSON-RPC stdio stream.
    with redirect_stdout(sys.stderr):
        from mcp.server import MCPServer
        from api.headless_search import load_state,hybrid_search as search,answer
        from api.reindex import reindex_root
        from api.structural_index import lookup
        from api.headless_wiki import generate_wiki,wiki_status,read_wiki_page
    server=MCPServer("codeWiki",version="0.1.0",log_level="WARNING",
        instructions="Search the configured code indexes for source evidence. Cite repository, path and line ranges. "
        "Reindex only when the user requests an update; it changes saved indexes but never source checkouts.")

    read_only=any(getattr(root,'read_only',False) for root in roots)
    # Read-only deployments do not advertise index/wiki mutation or local SDK analysis.
    write_tool=server.tool if not read_only else lambda:lambda function:function

    def select(repo_ids):
        if repo_ids is None:return roots
        if not repo_ids:raise ValueError("repo_ids must not be empty")
        known={root.id:root for root in roots}
        if any(name not in known for name in repo_ids):raise ValueError("Unknown repository ID; use list_repositories")
        return [known[name] for name in dict.fromkeys(repo_ids)]

    @server.tool()
    def list_repositories() -> dict:
        """List configured source roots, active file/chunk counts and indexed Git commits. No model call."""
        with redirect_stdout(sys.stderr):
            entries=[]
            for root in roots:
                state=load_state(root,storage_root)
                entries.append({"id":root.id,"source":("repo:"+root.id) if root.read_only else str(root.path),"files":len(state["files"]),
                    "chunks":sum(r["chunks"] for r in state["files"].values()),
                    "commits":state.get("portable_commits",state["repositories"]),"generation":state["generation"]})
            return {"repositories":entries}

    @server.tool()
    def search_code(query: str,top_k: int=8,repo_ids: list[str] | None=None) -> dict:
        """Combine exact symbols and semantic excerpts with bounded definition context and citations. Embeds only the query."""
        with redirect_stdout(sys.stderr):
            return {"query":query,"sources":search(select(repo_ids),storage_root,query,top_k)}

    @server.tool()
    def find_symbol(name: str,limit: int=8,repo_ids: list[str] | None=None) -> dict:
        """Find exact definitions with function/definition context and provenance. No model call."""
        with redirect_stdout(sys.stderr):
            return {"sources":lookup(select(repo_ids),storage_root,name,"symbol",limit)}

    @server.tool()
    def search_exact(text: str,limit: int=8,repo_ids: list[str] | None=None) -> dict:
        """Find exact source text and line citations in saved snapshots. No model call."""
        with redirect_stdout(sys.stderr):
            return {"sources":lookup(select(repo_ids),storage_root,text,"keyword",limit)}

    @server.tool()
    def find_relations(name: str,limit: int=8,repo_ids: list[str] | None=None) -> dict:
        """Find calls/includes/Make prerequisites by exact spelling. Syntax/literal evidence is unresolved, not compiler-derived."""
        with redirect_stdout(sys.stderr):
            return {"relationships":lookup(select(repo_ids),storage_root,name,"relations",limit)}

    @server.tool()
    def trace_relationships(name: str,depth: int=1,limit: int=24,repo_ids: list[str] | None=None) -> dict:
        """Trace bounded caller/callee or build evidence across roots. Links are unresolved name/path candidates."""
        from api.relationship_context import relationship_context
        with redirect_stdout(sys.stderr):
            return relationship_context(select(repo_ids),storage_root,name,depth,limit)

    @server.tool()
    def read_definition(repository_id: str,name: str,file_path: str,definition_line: int,window_start: int | None=None,max_lines: int=120,generation: str | None=None) -> dict:
        """Read a bounded definition window with next/previous line links. Pass generation to reject stale continuation."""
        from api.definition_context import definition_window
        with redirect_stdout(sys.stderr):
            return definition_window(select([repository_id])[0],storage_root,name,file_path,definition_line,window_start,max_lines,generation)

    @server.tool()
    async def ask_code(question: str,top_k: int=8,repo_ids: list[str] | None=None) -> dict:
        """Ask the configured generation model a source-grounded code question, returning cited excerpts."""
        with redirect_stdout(sys.stderr):
            return await answer(select(repo_ids),storage_root,question,top_k)

    @write_tool()
    def reindex_repositories(repo_ids: list[str] | None=None) -> dict:
        """Update indexes from saved Git commit checkpoints. Call only for an explicit user indexing/update request."""
        with redirect_stdout(sys.stderr):
            return {"repositories":[reindex_root(root,storage_root) for root in select(repo_ids)]}

    @server.tool()
    def list_wiki_pages() -> dict:
        """List generated wiki topics and whether they predate the active source indexes. No model call."""
        with redirect_stdout(sys.stderr):
            return wiki_status(roots,storage_root,wiki_root)

    @server.tool()
    def get_wiki_page(topic: str) -> dict:
        """Read a previously generated wiki page and its source references. No model call."""
        with redirect_stdout(sys.stderr):
            return read_wiki_page(roots,storage_root,topic,wiki_root)

    @write_tool()
    async def generate_wiki_pages(topics: list[str],top_k: int=8) -> dict:
        """Generate/publish cited wiki topics on explicit request; requires separate wiki-source and answer-source approval flags."""
        with redirect_stdout(sys.stderr):
            return await generate_wiki(roots,storage_root,topics,output_dir=wiki_root,top_k=top_k)

    @server.tool()
    def list_build_variants() -> dict:
        """List explicit compiler profiles, targets and build-metadata provenance. No build or model call."""
        from api.compiler_analysis import list_profiles
        return list_profiles()

    @write_tool()
    def analyze_c_translation_unit(repository_id: str,file_path: str,variant: str | None=None) -> dict:
        """Libclang call bindings, definitions, includes and inactive preprocessor ranges for an indexed C file/profile. Partial diagnostics are explicit. Never executes builds."""
        from api.compiler_analysis import analyze
        with redirect_stdout(sys.stderr):
            return analyze(select([repository_id])[0],storage_root,file_path,variant)

    @server.tool()
    def find_compiler_symbol(name: str,variant: str | None=None,limit: int=24,repo_ids: list[str] | None=None) -> dict:
        """Find compiler-bound symbols/calls in already analyzed translation units; report exact coverage and unresolved cross-unit linking."""
        from api.compiler_analysis import find_compiler_symbol as lookup_compiler
        with redirect_stdout(sys.stderr):
            return lookup_compiler(select(repo_ids),storage_root,name,variant,limit)

    return server


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--env-file",type=Path,default=Path(".env"))
    parser.add_argument("--storage-root",type=Path,help="Override DEEPWIKI_DATA_DIR from .env")
    args=parser.parse_args(argv)
    with redirect_stdout(sys.stderr):
        from dotenv import load_dotenv
        load_dotenv(args.env_file,override=False)
        from api.headless import load_env_roots
        from api.config import configs
        configs["text_splitter"]={"split_by":"token","chunk_size":1000,"chunk_overlap":150}
        configs["embedder_google"]["batch_size"]=100
        from api.headless_settings import runtime_paths
        storage,wiki,_=runtime_paths(args.env_file,args.storage_root)
        roots=load_env_roots(args.env_file,storage)
        server=create_server(roots,storage,wiki)
    server.run(transport="stdio")


if __name__=="__main__":main()
