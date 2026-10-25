"""Preprocessor spelling context is evidence, never evaluated build selection."""
import asyncio
import unittest
from unittest.mock import patch

from api.c_conditions import parse_conditions
from api.headless_search import hybrid_search,answer
from api.definition_context import definition_window
from api.reindex import reindex_root
from api.structural_index import lookup
from tests import test_relationship_context as fixtures


class ConditionParserTests(unittest.TestCase):
    def test_if_elif_else_excludes_prior_branches_and_retains_nested_guard(self):
        text='#ifdef OUTER\n#if FLAG == 1\nint one;\n#elif defined(ALT)\nint two;\n#else\nint three;\n#endif\n#endif\n'
        result=parse_conditions(text)
        guards=result['guards']
        self.assertEqual(result['quality'],'parsed_syntax')
        self.assertEqual([g['branch'] for g in guards],['ifdef','if','elif','else'])
        self.assertEqual(guards[0]['condition'],'defined(OUTER)')
        self.assertEqual(guards[1]['start_line'],3)
        self.assertEqual(guards[1]['end_line'],3)
        self.assertEqual(guards[2]['excluded_prior_conditions'],['FLAG == 1'])
        self.assertEqual(guards[3]['excluded_prior_conditions'],['FLAG == 1','defined(ALT)'])
        self.assertIsNone(guards[3]['condition'])
        self.assertTrue(all(g['build_variant']=='unselected' for g in guards))

    def test_ifndef_and_zero_are_not_evaluated(self):
        guards=parse_conditions('#ifndef OFF\nint value;\n#endif\n#if 0\nint dormant;\n#endif\n')['guards']
        self.assertEqual(guards[0]['condition'],'!defined(OFF)')
        self.assertEqual(guards[1]['condition'],'0')
        self.assertEqual(guards[1]['build_variant'],'unselected')

    def test_comments_strings_and_completed_guards_do_not_leak(self):
        text='/* #if FAKE\nint fake;\n#endif */\nconst char *s = "#ifdef STRING";\n#ifdef REAL\nint guarded;\n#endif\nint plain;\n'
        guards=parse_conditions(text)['guards']
        self.assertEqual(len(guards),1)
        self.assertEqual(guards[0]['start_line'],6)
        self.assertEqual(guards[0]['end_line'],6)

    def test_multiline_directive_body_starts_after_condition(self):
        guards=parse_conditions('#if defined(A) && \\\n defined(B)\nint both;\n#endif\n')['guards']
        self.assertEqual(guards[0]['start_line'],3)
        self.assertIn('defined(B)',guards[0]['condition'])

    def test_incomplete_syntax_is_labelled(self):
        self.assertEqual(parse_conditions('#if MISSING\nint incomplete;\n')['quality'],'syntax_with_errors')


class ConditionEvidenceTests(unittest.TestCase):
    setUp=fixtures.ContextTests.setUp

    def conditional_source(self):
        root=self.roots[0]
        (root.path/'variant.c').write_text('#ifdef FIRST\nint variant(void) { return helper(); }\n#else\nint variant(void) { return leaf(); }\n#endif\nint plain(void) { return 0; }\n')
        reindex_root(root,self.storage)
        return root

    def test_same_name_in_different_branches_and_unguarded_code_remain_distinct(self):
        root=self.conditional_source()
        hits=lookup([root],self.storage,'variant')
        self.assertEqual(len(hits),2)
        self.assertEqual(hits[0]['conditional_context'][0]['branch'],'ifdef')
        self.assertEqual(hits[1]['conditional_context'][0]['branch'],'else')
        self.assertNotEqual(hits[0]['start_line'],hits[1]['start_line'])
        self.assertFalse(lookup([root],self.storage,'plain')[0]['conditional_context'])
        self.assertTrue(all(h['build_variant']=='unselected' for h in hits))

    def test_cache_reuses_unchanged_hash_and_uses_indexed_snapshot(self):
        root=self.conditional_source()
        lookup([root],self.storage,'variant')
        (root.path/'variant.c').write_text('#ifdef UNINDEXED\nint variant(void){return 9;}\n#endif\n')
        with patch('api.c_conditions.parse_conditions',side_effect=AssertionError('Use cached indexed conditions')):
            hit=lookup([root],self.storage,'variant')[0]
        self.assertEqual(hit['conditional_context'][0]['condition'],'defined(FIRST)')
        reindex_root(root,self.storage)
        self.assertEqual(lookup([root],self.storage,'variant')[0]['conditional_context'][0]['condition'],'defined(UNINDEXED)')

    def test_internal_branch_overlaps_definition_and_covers_call_line(self):
        root=self.roots[0]
        (root.path/'internal.c').write_text('int internal(void) {\n#ifdef FEATURE\n return helper();\n#else\n return leaf();\n#endif\n}\n')
        reindex_root(root,self.storage)
        hit=lookup([root],self.storage,'internal')[0]
        self.assertTrue(all(g['scope']=='overlaps_excerpt' for g in hit['conditional_context']))
        edge=next(e for e in lookup([root],self.storage,'internal','relations') if e['target']=='helper')
        self.assertEqual(edge['conditional_context'][0]['scope'],'covers_excerpt')
        window=definition_window(root,self.storage,'internal','internal.c',1,window_start=3,max_lines=1)
        self.assertEqual(window['conditional_context'][0]['scope'],'covers_excerpt')

    def test_hybrid_candidate_references_preserve_guard_metadata(self):
        root=self.conditional_source()
        semantic={'repository_id':'repo0','file_path':'variant.c','start_line':2,'end_line':2,'text':'return helper();','score':1.0}
        with patch('api.headless_search.search',return_value=[semantic]):
            hits=hybrid_search(self.roots,self.storage,'variant',6)
        self.assertTrue(any(h.get('conditional_context') for h in hits))
        edges=[e for h in hits for e in h.get('relationships',[]) if e['file_path']=='variant.c']
        self.assertTrue(edges)
        self.assertTrue(all(e['build_variant']=='unselected' for e in edges))

    def test_guard_metadata_is_bounded(self):
        root=self.roots[0]
        text=''.join('#ifdef LEVEL'+str(i)+'\n' for i in range(20))+'int nested;\n'+('#endif\n'*20)
        (root.path/'nested.c').write_text(text);reindex_root(root,self.storage)
        hit=lookup([root],self.storage,'nested')[0]
        self.assertEqual(len(hit['conditional_context']),16)
        self.assertTrue(hit['conditional_context_truncated'])

    @patch.dict('os.environ',{'DEEPWIKI_ALLOW_SOURCE_EXCERPTS':'true'})
    def test_offline_answer_receives_guard_context_and_unselected_variant(self):
        self.conditional_source()
        semantic={'repository_id':'repo0','file_path':'variant.c','start_line':2,'end_line':2,'text':'return helper();','score':1.0}
        class FakeStreamer:
            model_kwargs={}
            async def respond_stream(self,prompt):
                assert 'conditional_context' in prompt
                assert 'defined(FIRST)' in prompt
                assert 'unselected' in prompt
                yield 'The definition depends on FIRST [1].'
        with patch('api.headless_search.search',return_value=[semantic]),patch('api.headless_search.get_model_config',return_value={'model_kwargs':{'model':'fixture'}}),patch('api.chat.ChatStreamer.create',return_value=FakeStreamer()):
            result=asyncio.run(answer(self.roots,self.storage,'variant',6))
        self.assertIn('[1]',result['answer'])
