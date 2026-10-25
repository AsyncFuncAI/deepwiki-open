"""Relationship-aware retrieval stays bounded, cited and explicit about ambiguity."""
import asyncio
import json
import unittest
from unittest.mock import patch

from api.headless_search import hybrid_search,answer
from api.hybrid_context import enrich_relationships
from api.headless_index import index_directory
from api.reindex import ReindexError,reindex_root
from tests import test_relationship_context as fixtures


class HybridContextTests(unittest.TestCase):
    setUp=fixtures.ContextTests.setUp

    def entry(self):
        return {"repository_id":"repo0","file_path":"main.c","start_line":2,"end_line":2,"text":"int entry(void) { return helper(); }","score":1.0}

    def test_hybrid_links_duplicate_cross_root_callees_without_resolving_dispatch(self):
        with patch('api.headless_search.search',return_value=[self.entry()]):
            hits=hybrid_search(self.roots,self.storage,'entry',6)
        host=next(h for h in hits if h.get('relationships'))
        relation=next(e for e in host['relationships'] if e['target']=='helper')
        self.assertEqual({r['repository_id'] for r in relation['definition_candidates']},{'repo0','repo1'})
        self.assertEqual(relation['resolution'],'unresolved_syntax_or_literal')
        candidates=[h for h in hits if 'relationship_candidate' in h['match_types']]
        self.assertEqual({h['repository_id'] for h in candidates},{'repo0','repo1'})
        self.assertTrue(all(h['start_line'] and h['file_path'] for h in hits))
        self.assertLessEqual(len(hits),6)

    def test_natural_language_uses_definition_found_by_semantic_evidence(self):
        with patch('api.headless_search.search',return_value=[self.entry()]):
            hits=hybrid_search(self.roots,self.storage,'How does the entry point work?',6)
        self.assertTrue(any(h.get('relationships') for h in hits))

    def test_small_result_budget_keeps_primary_evidence_and_labels_candidate_links(self):
        with patch('api.headless_search.search',return_value=[self.entry()]):
            hits=hybrid_search(self.roots,self.storage,'entry',1)
        self.assertEqual(len(hits),1)
        self.assertEqual(hits[0]['file_path'],'main.c')
        self.assertTrue(hits[0]['relationships'])
        self.assertTrue(all(r['resolution']=='name_candidate_unresolved' for e in hits[0]['relationships'] for r in e['definition_candidates']))

    def test_deleted_definition_is_not_a_hybrid_relationship_candidate(self):
        with patch('api.headless_search.search',return_value=[self.entry()]):
            hybrid_search(self.roots,self.storage,'entry',6)
            (self.roots[1].path/'other.c').unlink();reindex_root(self.roots[1],self.storage)
            hits=hybrid_search(self.roots,self.storage,'entry',6)
        self.assertFalse(any(h['repository_id']=='repo1' for h in hits))
        self.assertFalse(any(r['repository_id']=='repo1' for h in hits for e in h.get('relationships',[]) for r in e['definition_candidates']))

    def test_concurrent_index_publication_rejects_mixed_context(self):
        root=self.roots[0]
        def change(roots,storage,hits,*args):
            path=index_directory(root,storage)/'state.json'
            state=json.loads(path.read_text());state['generation']='new-generation';path.write_text(json.dumps(state))
            return hits
        with patch('api.headless_search.search',return_value=[self.entry()]),patch('api.hybrid_context.enrich_relationships',side_effect=change):
            with self.assertRaisesRegex(ReindexError,'changed during retrieval'):
                hybrid_search(self.roots,self.storage,'entry',6)

    def test_total_context_text_limit_does_not_add_empty_citations(self):
        hits=[dict(self.entry(),file_path=f'{i}.c',text='x'*30000) for i in range(3)]
        result=enrich_relationships(self.roots,self.storage,hits,[],4)
        self.assertLessEqual(sum(len(h['text']) for h in result),48000)
        self.assertTrue(all(h['text'] for h in result))
        self.assertTrue(result[-1]['context_truncated'])

    @patch.dict('os.environ',{'DEEPWIKI_ALLOW_SOURCE_EXCERPTS':'true'})
    def test_offline_answer_prompt_preserves_relationship_uncertainty(self):
        class FakeStreamer:
            model_kwargs={}
            async def respond_stream(self,prompt):
                assert 'not compiler-resolved calls' in prompt
                assert 'name_candidate_unresolved' in prompt
                assert 'definition_candidates' in prompt
                assert 'repo1' in prompt
                yield 'The helper name has multiple candidate definitions [1].'
        with patch('api.headless_search.search',return_value=[self.entry()]),patch('api.headless_search.get_model_config',return_value={'model_kwargs':{'model':'fixture'}}),patch('api.chat.ChatStreamer.create',return_value=FakeStreamer()):
            result=asyncio.run(answer(self.roots,self.storage,'entry',6))
        self.assertIn('[1]',result['answer'])
        self.assertTrue(result['sources'][0]['relationships'])

    def test_broad_repository_question_keeps_smaller_root_evidence(self):
        # Use indexed paths so context expansion can still inspect the real cache.
        dense=[dict(self.entry(),start_line=i,end_line=i) for i in range(1,5)]
        other={'repository_id':'repo1','file_path':'other.c','start_line':1,'end_line':1,'text':'int helper(void) { return 0; }','score':0.1}
        with patch('api.headless_search.search',return_value=[*dense,other]) as semantic:
            hits=hybrid_search(self.roots,self.storage,'Compare build behavior across repositories',3)
        self.assertTrue(semantic.call_args.kwargs['all_roots'])
        self.assertEqual({h['repository_id'] for h in hits},{'repo0','repo1'})

    def test_expansion_does_not_displace_broad_root_representatives(self):
        first=dict(self.entry(),symbol='entry')
        other={'repository_id':'repo1','file_path':'other.c','start_line':1,'end_line':1,'text':'int helper(void) { return 0; }','score':0.1}
        with patch('api.headless_search.search',return_value=[first,other]):
            hits=hybrid_search(self.roots,self.storage,'Explain entry across repositories',2)
        self.assertEqual({h['repository_id'] for h in hits},{'repo0','repo1'})

    def test_explicit_filename_survives_irrelevant_semantic_results(self):
        with patch('api.headless_search.search',return_value=[self.entry()]):
            hits=hybrid_search(self.roots,self.storage,'Explain `other.c` across repositories',2)
        target=next(h for h in hits if h['file_path']=='other.c')
        self.assertIn('filename',target['match_types'])
        self.assertIn('helper',target['text'])

    def test_unknown_filename_does_not_invent_or_read_a_source_path(self):
        with patch('api.headless_search.search',return_value=[self.entry()]):
            hits=hybrid_search(self.roots,self.storage,'Explain `missing.sh`',2)
        self.assertFalse(any(h['file_path']=='missing.sh' for h in hits))

    def test_common_filename_does_not_crowd_out_another_requested_file(self):
        many=[dict(self.entry(),start_line=n,end_line=n) for n in (100,200,300)]
        other=dict(self.entry(),repository_id='repo1',file_path='other.c',start_line=1,end_line=1)
        def lookup(roots,storage,name,mode,*args):
            return (many if name=='main.c' else [other]) if mode=='filename' else []
        with patch('api.headless_search.search',return_value=[]),patch('api.structural_index.lookup',side_effect=lookup):
            hits=hybrid_search(self.roots,self.storage,'Compare `main.c` and `other.c`',2)
        self.assertEqual({h['file_path'] for h in hits},{'main.c','other.c'})


    def test_plain_filename_survives_irrelevant_semantic_results(self):
        with patch('api.headless_search.search',return_value=[self.entry()]):
            hits=hybrid_search(self.roots,self.storage,'Explain other.c',2)
        self.assertTrue(any(h['file_path']=='other.c' and 'filename' in h['match_types'] for h in hits))


    def test_named_file_keeps_identifier_window_beyond_first_excerpt(self):
        import sqlite3
        from api.structural_index import compile_structure
        directory=compile_structure(self.roots[1],self.storage)
        with sqlite3.connect(directory/'structure.sqlite3') as db:
            db.execute("UPDATE files SET text=? WHERE path='other.c'",('\n'*200+'int helper(void) { return 0; }\n',))
        with patch('api.headless_search.search',return_value=[]):
            hits=hybrid_search(self.roots,self.storage,'Explain other.c `helper`',4)
        self.assertTrue(any(h['file_path']=='other.c' and h['start_line']>120 and 'helper' in h['text'] for h in hits))
