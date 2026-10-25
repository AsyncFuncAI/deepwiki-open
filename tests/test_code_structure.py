"""Syntax evidence and immutable structural-cache regression tests."""
import json
import unittest
from unittest.mock import patch

from api.code_structure import parse_source
from api.structural_index import compile_structure,lookup
from api.reindex import reindex_root
from tests import test_headless_search as fixtures
from tests.test_reindex import git


class ParserTests(unittest.TestCase):
    def test_c_function_pointer_macro_and_include_remain_unresolved(self):
        text='#include "header.h"\n#define APPLY(x) helper(x)\n#ifdef ENABLED\nint worker(int x) { return APPLY(x) + callback(x); }\n#endif\n'
        symbols,edges,quality=parse_source('fixture.c',text)
        self.assertIn(('worker','function',4,4,'',quality),symbols)
        self.assertTrue(any(s[0]=='APPLY' and s[1]=='macro' for s in symbols))
        self.assertTrue(any(e[:3]==('worker','callback','call_syntax') for e in edges))
        self.assertTrue(any(e[1]=='"header.h"' and e[2]=='include' for e in edges))
        self.assertTrue(any(e[1]=='ENABLED' and e[2]=='conditional_compilation' for e in edges))
        self.assertFalse(any(e[2]=='resolved_call' for e in edges))

    def test_c_multiline_definition_has_full_context(self):
        symbols,_,_=parse_source('f.h','int call(void) {\n return 2;\n}\n')
        self.assertEqual(symbols[0][2:4],(1,3))

    def test_python_qualified_calls_and_parse_failure(self):
        symbols,edges,quality=parse_source('f.py','class A:\n def run(self):\n  return client.send()\n')
        self.assertIn(('run','function',2,3,'A','parsed_syntax'),symbols)
        self.assertTrue(any(e[:3]==('A.run','client.send','call_syntax') for e in edges))
        symbols,_,quality=parse_source('legacy.py','def old(:\n pass\n')
        self.assertEqual(quality,'heuristic_python_parse_failed')
        self.assertEqual(symbols[0][0],'old')

    def test_make_prerequisites_continuations_and_recipes_are_literal(self):
        symbols,edges,quality=parse_source('Makefile','FILES := main.c\ninclude common.mk\nall: first \\\n second # explanation\n\t$(MAKE) -C child\n\t./build.sh\n')
        self.assertEqual(quality,'heuristic')
        self.assertTrue(any(s[:2]==('all','make_target') for s in symbols))
        self.assertTrue(any(e[:3]==('all','first','make_prerequisite') for e in edges))
        self.assertFalse(any(e[1]=='explanation' for e in edges))
        self.assertTrue(any(e[2]=='make_invocation' for e in edges))
        self.assertTrue(any(e[1]=='./build.sh' for e in edges))

    def test_shell_does_not_guess_function_scope(self):
        symbols,edges,quality=parse_source('f.sh','build() {\n ./inner.sh\n}\n./outer.sh\n')
        self.assertEqual(symbols[0][:2],('build','shell_function'))
        self.assertTrue(all(e[0]=='' and e[4]=='heuristic' for e in edges))


class StructureTests(unittest.TestCase):
    setUp=fixtures.SearchTests.setUp

    def test_saved_documents_do_not_reconstruct_embedding_pipeline(self):
        from api.saved_index import load_saved_part
        from api.headless_search import load_state
        from adalflow.core.db import LocalDB
        state=load_state(self.roots[0],self.storage)
        part=next(iter(state["files"].values()))["part"]
        with patch.object(LocalDB,"__setstate__",side_effect=AssertionError("Must not restore model clients")):
            db=load_saved_part(part)
        self.assertEqual(len(db.items),1)
        self.assertEqual(db.transformer_setups,{})

    def test_cache_uses_saved_snapshot_and_never_embeds(self):
        (self.roots[0].path/'same.c').write_text('int unindexed;')
        hits=lookup(self.roots,self.storage,'alpha')
        self.assertEqual(hits[0]['name'],'alpha')
        self.assertEqual(hits[0]['text'],'int alpha;')
        self.embedding.assert_not_called()
        with patch('api.structural_index.saved_sources',side_effect=AssertionError('Must reuse cache')):
            self.assertTrue(lookup(self.roots,self.storage,'alpha'))

    def test_same_name_in_two_roots_retains_both_provenances(self):
        for root in self.roots:
            (root.path/'same.c').write_text('int shared(void) { return 1; }')
            reindex_root(root,self.storage)
        hits=lookup(self.roots,self.storage,'shared',limit=2)
        self.assertEqual({h['repository_id'] for h in hits},{'alpha','beta'})

    def test_changed_deleted_and_unchanged_files_update_incrementally(self):
        root=self.roots[0]
        (root.path/'keep.c').write_text('int untouched;');reindex_root(root,self.storage)
        previous=compile_structure(root,self.storage)
        (root.path/'same.c').unlink();(root.path/'new.c').write_text('int replacement;')
        git(root.path,'add','.');git(root.path,'commit','-m','replace')
        reindex_root(root,self.storage)
        from api.code_structure import parse_source
        with patch('api.structural_index.parse_source',wraps=parse_source) as parser:
            directory=compile_structure(root,self.storage)
        self.assertNotEqual(directory,previous)
        self.assertEqual(parser.call_count,1)
        self.assertEqual(json.loads((directory/'ready.json').read_text())['removed_files'],1)
        self.assertFalse(lookup([root],self.storage,'alpha','keyword'))
        self.assertTrue(lookup([root],self.storage,'replacement','keyword'))
        self.assertTrue(lookup([root],self.storage,'untouched'))

    def test_failed_parse_preserves_previous_cache_and_can_retry(self):
        root=self.roots[0];previous=compile_structure(root,self.storage)
        (root.path/'same.c').write_text('int changed;');reindex_root(root,self.storage)
        with patch('api.structural_index.parse_source',side_effect=RuntimeError('parser failure')):
            with self.assertRaises(RuntimeError):compile_structure(root,self.storage)
        self.assertTrue((previous/'ready.json').exists())
        self.assertTrue(lookup([root],self.storage,'changed'))
        self.assertFalse(lookup([root],self.storage,'alpha'))

    def test_relations_and_definition_context_are_bounded(self):
        root=self.roots[0]
        (root.path/'same.c').write_text('int alpha(void) {\n'+(' // context\n'*150)+' return callee();\n}\n')
        reindex_root(root,self.storage)
        hit=lookup([root],self.storage,'alpha')[0]
        self.assertTrue(hit['truncated']);self.assertEqual(hit['end_line'],120)
        relation=lookup([root],self.storage,'callee','relations')[0]
        self.assertEqual(relation['source'],'alpha')
        self.assertEqual(relation['resolution'],'unresolved_syntax_or_literal')

    def test_exact_lookup_is_case_sensitive_and_fts_input_is_not_operator(self):
        root=self.roots[0]
        self.assertFalse(lookup([root],self.storage,'ALPHA','keyword'))
        self.assertFalse(lookup([root],self.storage,'alpha OR beta','keyword'))
        self.assertTrue(lookup([root],self.storage,'alpha','keyword'))
        for query in ('', 'x'*513):
            with self.assertRaises(ValueError):lookup([root],self.storage,query)

    def test_hybrid_finds_exact_symbol_missed_by_semantic_ranking(self):
        from api.headless_search import hybrid_search
        root=self.roots[0]
        (root.path/'definition.c').write_text('int wanted_symbol(void) {\n return helper();\n}\n')
        reindex_root(root,self.storage)
        unrelated={"repository_id":"beta","file_path":"same.c","start_line":1,"end_line":1,"score":1.0,"text":"int beta;"}
        with patch('api.headless_search.search',return_value=[unrelated]):
            hits=hybrid_search(self.roots,self.storage,'wanted_symbol',4)
        wanted=next(h for h in hits if h.get('symbol')=='wanted_symbol')
        self.assertIn('symbol',wanted['match_types'])
        self.assertEqual(wanted['end_line'],3)

    def test_hybrid_merges_overlapping_semantic_and_definition_hits(self):
        from api.headless_search import hybrid_search
        root=self.roots[0]
        (root.path/'same.c').write_text('int alpha(void) {\n return 1;\n}\n')
        reindex_root(root,self.storage)
        hit={"repository_id":"alpha","file_path":"same.c","start_line":2,"end_line":2,"score":1.0,"text":"return 1;"}
        with patch('api.headless_search.search',return_value=[hit]):
            hits=hybrid_search([root],self.storage,'alpha',4)
        self.assertEqual(len(hits),1)
        self.assertEqual(set(hits[0]['match_types']),{'symbol','semantic'})
