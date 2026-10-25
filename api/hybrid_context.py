"""Enrich ranked source evidence with bounded, explicitly unresolved relationships."""
from api.relationship_context import relationship_context


def overlaps(left,right):
    return (left["repository_id"]==right["repository_id"] and left["file_path"]==right["file_path"]
        and left.get("start_line") is not None and right.get("start_line") is not None
        and left["start_line"]<=right["end_line"] and right["start_line"]<=left["end_line"])


def reference(hit):
    return {key:hit[key] for key in ("id","repository_id","file_path","start_line","end_line","definition_end_line","name","kind","quality","resolution","generation","conditional_context","conditional_context_truncated","conditional_context_quality","build_variant") if key in hit}


def enrich_relationships(roots,storage_root,hits,names,top_k,progress=None,preserve_roots=False):
    hits=[dict(hit) for hit in hits]
    extras=[]
    seeds=list(dict.fromkeys([*names,*[hit["symbol"] for hit in hits if hit.get("symbol")]]))[:2]
    for seed in seeds:
        graph=relationship_context(roots,storage_root,seed,depth=1,limit=min(24,max(8,top_k*2)),progress=progress)
        definitions={node["id"]:node for node in graph["definitions"]}
        files={node["id"]:node for node in graph["files"]}
        for edge in graph["relationships"][:4]:
            target=next((hit for hit in [*hits,*extras] if overlaps(hit,edge)),None)
            if target is None:
                target=dict(edge,match_types=["relationship"])
                extras.append(target)
            target.setdefault("relationships",[])
            evidence={key:edge[key] for key in ("source","target","kind","quality","resolution","details","repository_id","file_path","start_line","end_line","conditional_context","conditional_context_truncated","conditional_context_quality","build_variant") if key in edge}
            evidence["definition_candidates"]=[reference(definitions[i]) for i in edge["target_definition_candidates"] if i in definitions]
            evidence["file_candidates"]=[reference(files[i]) for i in edge["target_file_candidates"] if i in files]
            if evidence not in target["relationships"] and len(target["relationships"])<4:
                target["relationships"].append(evidence)
            target["relationship_context_truncated"]=target.get("relationship_context_truncated",False) or graph["truncated"]
            target["match_types"]=sorted(set(target.get("match_types",[])+["relationship"]))
            for identity in [*edge["target_definition_candidates"],*edge["target_file_candidates"]]:
                node=definitions.get(identity) or files.get(identity)
                if node is None or any(overlaps(node,old) for old in [*hits,*extras]):continue
                extras.append(dict(node,match_types=["relationship_candidate"],relationship_context_truncated=graph["truncated"]))
    # Preserve the strongest ranked evidence and reserve a few slots for linked
    # source, rather than letting expansion replace all semantic discovery.
    protected=min(top_k,len({hit["repository_id"] for hit in hits})) if preserve_roots else 0
    reserved=min(len(extras),top_k//3,top_k-protected)
    ranked=[*hits[:top_k-reserved],*extras[:reserved],*hits[top_k-reserved:]]
    output=[];remaining=48000
    for hit in ranked:
        if any(overlaps(hit,old) for old in output):continue
        if remaining==0:
            if output:output[-1]["context_truncated"]=True
            break
        hit=dict(hit)
        if len(hit["text"])>remaining:
            hit["text"]=hit["text"][:remaining]
            hit["truncated"]=True;hit["text_truncated"]=True
        remaining-=len(hit["text"])
        output.append(hit)
        if len(output)>=top_k:break
    return output
