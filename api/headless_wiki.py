"""Versioned headless wiki pages grounded in configured active source indexes."""
import json
import os
from pathlib import Path
import re
import shutil
import time
import uuid

from api.config import get_model_config
from api.citations import citation_numbers
from api.headless_index import write_json
from api.headless_search import answer,load_state
from api.reindex import ReindexError


def index_versions(roots,storage_root):
    return {root.id:load_state(root,storage_root)["generation"] for root in roots}


def page_name(topic):
    import hashlib
    slug=re.sub(r"[^a-z0-9]+","-",topic.lower()).strip("-")[:70] or "topic"
    return slug+"-"+hashlib.sha256(topic.encode()).hexdigest()[:8]+".md"


def source_reference(source):
    return {key:source.get(key) for key in ("repository_id","file_path","start_line","end_line","score")}


def render_page(topic,result):
    body=result.get("answer","").strip()
    sources=result.get("sources",[])
    if not body or not sources:raise ReindexError("Wiki page needs an answer and source references")
    references=citation_numbers(body)
    if not references or any(n<1 or n>len(sources) for n in references):
        raise ReindexError("Wiki answer has missing or invalid source citations")
    heading=" ".join(topic.split())
    citations="\n".join(
        f"{i}. `{source['repository_id']}:{source['file_path']}:{source.get('start_line')}-{source.get('end_line')}`"
        for i,source in enumerate(sources,1))
    return f"# {heading}\n\n{body}\n\n## Sources\n\n{citations}\n"


async def _generate_wiki(roots,storage_root,topics,output_dir=None,top_k=8,progress=None,answerer=None):
    from api.headless_settings import require_writable
    require_writable(roots)
    if not topics or any(not isinstance(t,str) or not t.strip() for t in topics):
        raise ValueError("Provide at least one nonempty wiki topic")
    topics=list(dict.fromkeys(t.strip() for t in topics))
    if not 1<=top_k<=50:raise ValueError("top_k must be between 1 and 50")
    if os.getenv("DEEPWIKI_ALLOW_SOURCE_EXCERPTS","false").lower()!="true":
        raise ReindexError("Wiki generation requires explicit approval to send retrieved source excerpts to the generation provider")
    if os.getenv("DEEPWIKI_ALLOW_WIKI_SOURCE_EXCERPTS","false").lower()!="true":
        raise ReindexError("Wiki source export requires separate approval; DEEPWIKI_ALLOW_WIKI_SOURCE_EXCERPTS is disabled")
    output=(Path(output_dir) if output_dir else storage_root/"wiki").expanduser().resolve()
    if any(output.is_relative_to(root.path.resolve()) for root in roots):
        raise ValueError("Wiki output must be outside source trees")
    pointer=output/"codewiki-current.json"
    if pointer.exists() and json.loads(pointer.read_text()).get("kind")!="codewiki-wiki":
        raise ValueError("Output has an unrelated current file; choose another wiki output directory")
    versions=index_versions(roots,storage_root)
    retained=[]
    if pointer.exists():
        previous=json.loads(pointer.read_text())
        if previous.get("state")!="ready":raise ReindexError("Invalid published wiki manifest")
        retained=[page for page in previous["pages"] if page["topic"] not in topics]
        if retained and previous["index_generations"]!=versions:
            raise ReindexError("Existing wiki pages are stale; include their topics to refresh them before adding pages")
    provider=os.getenv("DEEPWIKI_PROVIDER") or "google"
    model=get_model_config(provider)["model_kwargs"]["model"]
    generation=uuid.uuid4().hex
    directory=output/"generations"/generation
    directory.mkdir(parents=True,exist_ok=False)
    manifest={"kind":"codewiki-wiki","version":1,"generation":generation,"state":"building",
              "index_generations":versions,"provider":provider,"model":model,"pages":[]}
    for page in retained:
        source=(output/"generations"/previous["generation"]/page["file"]).resolve()
        expected=(output/"generations"/previous["generation"]).resolve()
        if not expected.is_relative_to(output) or not source.is_relative_to(expected):
            raise ReindexError("Wiki page resolves outside the generated artifact directory")
        target=(directory/page["file"]).resolve()
        if not target.is_relative_to(directory):raise ReindexError("Invalid retained wiki page path")
        target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
        manifest["pages"].append(page)
    for number,topic in enumerate(topics,1):
        question=("Write a concise source-grounded wiki page about: "+topic+
                  ". Explain observed behavior, identify the relevant repositories/files, cite excerpt numbers, "
                  "and explicitly distinguish unresolved behavior or inference.")
        result=await (answerer or answer)(roots,storage_root,question,top_k,progress)
        page=render_page(topic,result)
        if index_versions(roots,storage_root)!=versions:
            raise ReindexError("Source index changed during wiki generation; previous wiki preserved")
        filename=page_name(topic)
        (directory/filename).write_text(page,encoding="utf-8")
        manifest["pages"].append({"topic":topic,"file":filename,
                                  "sources":[source_reference(s) for s in result["sources"]],
                                  "usage":result.get("usage"),"coverage":result.get("coverage")})
        write_json(directory/"progress.json",manifest)
        if progress:progress({"phase":"wiki","pages_done":number,"pages_total":len(topics)})
    if index_versions(roots,storage_root)!=versions:
        raise ReindexError("Source index changed before publication; previous wiki preserved")
    index_page="# codeWiki\n\n"+"\n".join(f"- [{p['topic'].replace(']','')}](./{p['file']})" for p in manifest["pages"])+"\n"
    (directory/"index.md").write_text(index_page,encoding="utf-8")
    manifest.update(state="ready",finished=time.time(),directory=str(directory))
    write_json(directory/"manifest.json",manifest)
    # Only this final atomic pointer moves the visible wiki to the new generation.
    write_json(pointer,manifest)
    return {"status":"ready","pages":len(manifest["pages"]),"generated_pages":len(topics),"retained_pages":len(retained),"generation":generation,
            "directory":str(directory),"index":str(directory/"index.md"),"manifest":str(pointer)}


async def generate_wiki(roots,storage_root,topics,output_dir=None,top_k=8,progress=None,answerer=None):
    from api.headless_settings import require_writable
    from api.reindex import lock_index
    require_writable(roots)
    output=(Path(output_dir) if output_dir else storage_root/"wiki").expanduser().resolve()
    if any(output.is_relative_to(root.path.resolve()) for root in roots):
        raise ValueError("Wiki output must be outside source trees")
    # Serialize all publishers, including MCP, so retained pages cannot be lost.
    with lock_index(output):
        return await _generate_wiki(roots,storage_root,topics,output,top_k,progress,answerer)


def wiki_status(roots,storage_root,output_dir=None):
    output=(Path(output_dir) if output_dir else storage_root/"wiki").expanduser().resolve()
    pointer=output/"codewiki-current.json"
    if not pointer.exists():return {"status":"not_generated","pages":[]}
    manifest=json.loads(pointer.read_text())
    if manifest.get("kind")!="codewiki-wiki" or manifest.get("state")!="ready":
        raise ReindexError("Invalid published wiki manifest")
    return {"status":"ready","stale":manifest["index_generations"]!=index_versions(roots,storage_root),
            "generation":manifest["generation"],"pages":manifest["pages"]}


def read_wiki_page(roots,storage_root,topic,output_dir=None):
    output=(Path(output_dir) if output_dir else storage_root/"wiki").expanduser().resolve()
    status=wiki_status(roots,storage_root,output)
    if status["status"]!="ready":raise ReindexError("No wiki has been generated yet")
    pages=[page for page in status["pages"] if page["topic"]==topic]
    if not pages:raise ValueError("Unknown wiki topic; list available pages first")
    path=(output/"generations"/status["generation"]/pages[0]["file"]).resolve()
    expected=(output/"generations"/status["generation"]).resolve()
    if not expected.is_relative_to(output) or not path.is_relative_to(expected):
        raise ReindexError("Wiki page resolves outside the generated artifact directory")
    return {"topic":topic,"stale":status["stale"],"content":path.read_text(encoding="utf-8"),
            "sources":pages[0]["sources"],"generation":status["generation"]}
