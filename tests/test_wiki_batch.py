import asyncio
import json
import os
from types import SimpleNamespace
import unittest
from unittest.mock import patch
from tests import test_headless_search as fixtures
from api.wiki_batch import page_groups,make_plan,run,error_state,redact
from api.headless_wiki import wiki_status

class BatchTests(unittest.TestCase):
    def setUp(self):
        fixtures.SearchTests.setUp(self)
        context=patch.dict(os.environ,{'DEEPWIKI_ALLOW_SOURCE_EXCERPTS':'true','DEEPWIKI_ALLOW_WIKI_SOURCE_EXCERPTS':'true','DEEPWIKI_BUILD_VARIANT':'fixture','DEEPWIKI_PROVIDER':'google'})
        context.start();self.addCleanup(context.stop)
        self.wiki=self.storage/'wiki';self.job=self.base/'job';self.job.mkdir()
        self.plan=make_plan(self.roots,self.storage,'fixture')
    async def answer(self,question,hits):
        self.embedding.assert_not_called()
        return {'answer':'Observed feature [1].','sources':hits,'usage':{'cost':0.01}}
    def execute(self,**kwargs):return asyncio.run(run(self.roots,self.storage,self.wiki,self.job,self.plan,**kwargs))
    def test_partition_covers_each_file_once_and_limits_group_size(self):
        paths=[f'a/b/{n}.c' for n in range(61)]+['a/c/one.py','root.sh']
        groups=page_groups(paths,24);all_paths=[p for _,names in groups for p in names]
        self.assertEqual(sorted(all_paths),sorted(paths));self.assertEqual(len(all_paths),len(set(all_paths)))
        self.assertTrue(all(len(names)<=24 for _,names in groups))
    def test_resuming_completed_queue_makes_no_generation_or_embedding_calls(self):
        self.assertEqual(self.execute(answerer=self.answer),0)
        with patch('api.wiki_batch.evidence',side_effect=AssertionError('Completed queue must not read evidence')):
            self.assertEqual(self.execute(answerer=self.answer),0)
        state=json.loads((self.job/'status.json').read_text())
        self.assertEqual(state['status'],'complete');self.assertEqual(state['completed_count'],2)
        self.assertEqual(len(wiki_status(self.roots,self.storage,self.wiki)['pages']),2)
    def test_budget_failure_preserves_first_page_then_resumes_remaining(self):
        calls=[]
        async def limited(question,hits):
            calls.append(question)
            if len(calls)==2:
                error=RuntimeError('Insufficient credit');error.status_code=402;raise error
            return await self.answer(question,hits)
        self.assertEqual(self.execute(answerer=limited),2)
        state=json.loads((self.job/'status.json').read_text())
        self.assertEqual(state['status'],'budget_exhausted');self.assertEqual(state['completed_count'],1)
        self.assertEqual(len(wiki_status(self.roots,self.storage,self.wiki)['pages']),1)
        self.assertEqual(self.execute(answerer=self.answer),0)
    def test_paid_draft_is_reused_after_publication_failure(self):
        async def broken(*args,answerer=None,**kwargs):
            await answerer(None,None,'Question',48,None);raise RuntimeError('publish failure')
        self.assertEqual(self.execute(generate=broken,answerer=self.answer),2)
        async def forbidden(*args):raise AssertionError('Paid draft must be reused')
        # Limit queue to the one paid item for this recovery check.
        self.plan['items']=self.plan['items'][:1]
        self.assertEqual(self.execute(answerer=forbidden),0)
    def test_changed_variant_stops_before_generation(self):
        with patch.dict(os.environ,{'DEEPWIKI_BUILD_VARIANT':'different'}):
            with self.assertRaisesRegex(ValueError,'variant'):self.execute(answerer=self.answer)
    def test_error_classification_does_not_treat_all_403_as_budget(self):
        for code,message,expected in [(402,'Payment required','budget_exhausted'),(429,'Rate limit','rate_limited'),(429,'insufficient quota','budget_exhausted'),(403,'Forbidden','failed')]:
            error=RuntimeError(message);error.status_code=code;self.assertEqual(error_state(error),expected)
    def test_credential_redaction_preserves_line_numbers(self):
        source='PASSWORD="fixture-secret"\nint normal;\n'
        cleaned=redact(source);self.assertNotIn('fixture-secret',cleaned)
        self.assertEqual(len(source.splitlines()),len(cleaned.splitlines()))
