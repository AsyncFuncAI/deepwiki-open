"""Cross-file neighborhoods retain ambiguity, scope, budgets and source citations."""
import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch

from api.config import configs
from api.headless import ScanRoot
from api.headless_index import build_root
from api.reindex import reindex_root
from api.relationship_context import relationship_context
from api.structural_index import lookup
from tests.test_headless_search import embed
from tests.test_reindex import git


class ContextTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.base=Path(self.temp.name);self.storage=self.base/'indexes';self.roots=[]
        contents=[{'main.c':'#include "shared.h"\nint entry(void) { return helper(); }\nint helper(void) { return leaf(); }\nint leaf(void) { return entry(); }\n',
                   'shared.h':'struct Header { int value; };\n',
                   'flow.mk':'all: setup\n\t./build.sh\nsetup:\n\t$(MAKE) -C child\ninclude shared.mk\n',
                   'shared.mk':'VERSION := 1\n','build.sh':'build() {\n echo build\n}\n',
                   'module.py':'class A:\n def run(self):\n  return helper()\n'},
                  {'other.c':'int helper(void) { return 0; }\n','shared.h':'struct Other { int value; };\n'}]
        for i,files in enumerate(contents):
            source=self.base/f'repo{i}';source.mkdir()
            git(source,'init','-b','main');git(source,'config','user.email','fixture@example.invalid');git(source,'config','user.name','Fixture')
            for name,text in files.items():(source/name).write_text(text)
            git(source,'add','.');git(source,'commit','-m','initial')
            self.roots.append(ScanRoot(f'repo{i}',source,{}))
        for context in (patch.dict(configs,{'scan_extensions':['.c','.h','.mk','.py','.sh'],'scan_filenames':[],'file_filters':{},'text_splitter':{'split_by':'token','chunk_size':1000,'chunk_overlap':150}}),patch('api.headless_index.transform_documents_and_save_to_db',side_effect=embed),patch('api.reindex.transform_documents_and_save_to_db',side_effect=embed)):
            context.start();self.addCleanup(context.stop)
        for root in self.roots:build_root(root,self.storage);reindex_root(root,self.storage)

    def test_cross_root_duplicate_targets_are_candidates_not_resolved_calls(self):
        result=relationship_context(self.roots,self.storage,'entry',limit=24)
        edge=next(e for e in result['relationships'] if e['target']=='helper')
        by_id={d['id']:d for d in result['definitions']}
        candidates=[by_id[i] for i in edge['target_definition_candidates']]
        self.assertEqual({h['repository_id'] for h in candidates},{'repo0','repo1'})
        self.assertTrue(all(h['resolution']=='name_candidate_unresolved' for h in candidates))
        self.assertEqual(len(edge['source_definition_candidates']),1)
        self.assertEqual(edge['start_line'],2)

    def test_depth_bound_cycles_and_total_evidence_budget(self):
        shallow=relationship_context(self.roots,self.storage,'entry',depth=1)
        self.assertEqual(shallow['visited_names'],['entry'])
        deep=relationship_context(self.roots,self.storage,'entry',depth=3,limit=40)
        self.assertIn('leaf',deep['visited_names'])
        self.assertEqual(len(deep['visited_names']),len(set(deep['visited_names'])))
        small=relationship_context(self.roots,self.storage,'entry',depth=3,limit=2)
        self.assertLessEqual(sum(len(small[k]) for k in ('definitions','relationships','files')),2)
        self.assertTrue(small['truncated'])

    def test_make_targets_link_to_scripts_and_prerequisites_without_execution(self):
        with patch('subprocess.run',side_effect=AssertionError('No source commands during lookup')):
            result=relationship_context(self.roots,self.storage,'all',depth=2,limit=24)
        self.assertTrue(any(d['name']=='setup' for d in result['definitions']))
        script=next(e for e in result['relationships'] if e['kind']=='script_reference')
        self.assertTrue(script['target_file_candidates'])
        self.assertTrue(any(f['file_path']=='build.sh' for f in result['files']))
        self.assertTrue(any(e['kind']=='make_invocation' for e in result['relationships']))

    def test_include_candidates_stay_in_selected_roots_and_retain_ambiguity(self):
        result=relationship_context(self.roots,self.storage,'"shared.h"')
        self.assertEqual({f['repository_id'] for f in result['files']},{'repo0','repo1'})
        self.assertTrue(all(f['resolution']=='indexed_path_spelling_candidate' for f in result['files']))
        self.assertTrue(all(f['start_line']==1 for f in result['files']))

    def test_root_selection_prevents_cross_root_candidates(self):
        result=relationship_context([self.roots[0]],self.storage,'entry')
        self.assertEqual({d['repository_id'] for d in result['definitions']},{'repo0'})

    def test_qualified_python_definition_is_linked_by_lexical_name(self):
        hits=lookup(self.roots,self.storage,'A.run')
        self.assertEqual(hits[0]['name'],'run')
        result=relationship_context(self.roots,self.storage,'A.run')
        edge=next(e for e in result['relationships'] if e['source']=='A.run')
        self.assertTrue(edge['source_definition_candidates'])

    def test_deleted_files_remove_old_candidate_definitions_and_relationships(self):
        relationship_context(self.roots,self.storage,'entry')
        root=self.roots[1];(root.path/'other.c').unlink();reindex_root(root,self.storage)
        result=relationship_context(self.roots,self.storage,'entry')
        self.assertFalse(any(d['repository_id']=='repo1' for d in result['definitions']))

    def test_invalid_depth_and_unknown_symbols_are_explicit(self):
        for depth in (0,4,True):
            with self.assertRaises(ValueError):relationship_context(self.roots,self.storage,'entry',depth)
        result=relationship_context(self.roots,self.storage,'missing_symbol')
        self.assertFalse(result['definitions']);self.assertFalse(result['relationships'])

    def test_linked_definition_windows_cover_full_span_and_reject_stale_generation(self):
        from api.definition_context import definition_window
        from api.reindex import ReindexError
        root=self.roots[0]
        (root.path/'large.c').write_text('int large(void) {\n'+(' // line\n'*230)+' return 0;\n}\n')
        reindex_root(root,self.storage)
        hit=lookup([root],self.storage,'large')[0]
        window=definition_window(root,self.storage,'large','large.c',1,max_lines=40,generation=hit['generation'])
        lines=[]
        while True:
            lines.extend(range(window['start_line'],window['end_line']+1))
            if window['next_start_line'] is None:break
            window=definition_window(root,self.storage,'large','large.c',1,window['next_start_line'],40,window['generation'])
        self.assertEqual(lines,list(range(1,234)))
        (root.path/'large.c').write_text('int large(void) { return 1; }\n');reindex_root(root,self.storage)
        with self.assertRaises(ReindexError):definition_window(root,self.storage,'large','large.c',1,generation=hit['generation'])

    def test_definition_window_rejects_unknown_path_and_out_of_span_offset(self):
        from api.definition_context import definition_window
        root=self.roots[0]
        with self.assertRaises(ValueError):definition_window(root,self.storage,'entry','../outside.c',2)
        with self.assertRaises(ValueError):definition_window(root,self.storage,'entry','main.c',2,window_start=99)
        with self.assertRaises(ValueError):definition_window(root,self.storage,'entry','main.c',2,max_lines=121)

    def test_very_long_source_lines_and_graph_text_are_bounded(self):
        from api.structural_index import excerpt
        selected=excerpt('x'*50000,1,1)
        self.assertEqual(len(selected['text']),24000)
        self.assertTrue(selected['text_truncated'])
        definitions=[dict(repository_id='repo0',file_path=f'{i}.c',start_line=1,end_line=1,name='big',kind='function',text='x'*40000) for i in range(3)]
        with patch('api.relationship_context.lookup',side_effect=lambda roots,storage,query,mode,*rest: definitions if mode=='symbol' else []):
            result=relationship_context(self.roots,self.storage,'big')
        self.assertLessEqual(sum(len(h['text']) for h in result['definitions']),48000)
        self.assertTrue(result['truncated'])

    def test_cli_context_and_window_dispatch_do_not_fall_through_to_semantic_search(self):
        import io,json,sys
        from api.headless import main
        for extra,expected in [(['--context','entry','--top-k','16'],'relationships'),(['--definition','entry','--repository-id','repo0','--file-path','main.c','--definition-line','2'],'next_start_line')]:
            output=io.StringIO()
            with patch('dotenv.load_dotenv'),patch('api.headless.load_manifest',return_value=self.roots),patch.object(sys,'__stdout__',output),patch('api.headless_search.search',side_effect=AssertionError('No semantic call for local commands')):
                code=main(['fixture.json','--storage-root',str(self.storage),*extra])
            self.assertEqual(code,0)
            self.assertIn(expected,json.loads(output.getvalue()))

    def test_complex_indirect_call_spelling_does_not_abort_the_neighborhood(self):
        root=self.roots[0]
        expression='('*300+'helper'+')'*300
        (root.path/'indirect.c').write_text('int indirect(void) { return '+expression+'(); }\n')
        reindex_root(root,self.storage)
        result=relationship_context(self.roots,self.storage,'indirect')
        edge=next(e for e in result['relationships'] if e['source']=='indirect')
        self.assertFalse(edge['target_definition_candidates'])
        self.assertEqual(edge['resolution'],'unresolved_syntax_or_literal')
