import json,os
from pathlib import Path
from unittest.mock import patch
import unittest
from tests import test_headless_search as fixtures
from api.compiler_analysis import analyze,safe_arguments
from api.reindex import reindex_root

class CompilerTests(unittest.TestCase):
    setUp=fixtures.SearchTests.setUp
    def profile(self,defines=None):
        root=self.roots[0]
        profile={'id':'fixture','repository_id':root.id,'defines':defines or {},'include_dirs':['.']}
        filename=self.base/'profiles.json';filename.write_text(json.dumps({'version':1,'profiles':[profile]}))
        return patch.dict(os.environ,{'DEEPWIKI_COMPILER_PROFILES':str(filename),'DEEPWIKI_BUILD_VARIANT':'fixture'})
    def source(self,text):
        (self.roots[0].path/'same.c').write_text(text);reindex_root(self.roots[0],self.storage)
    def test_compiler_resolves_direct_calls_but_not_function_pointers(self):
        self.source('int helper(void){return 1;}\nint entry(int (*fp)(void)){return helper()+fp();}\n')
        with self.profile():result=analyze(self.roots[0],self.storage,'same.c')
        self.assertEqual(result['status'],'ready')
        direct=next(c for c in result['calls'] if c['name']=='helper')
        self.assertEqual(direct['resolution'],'compiler_resolved_definition')
        self.assertEqual(direct['definition']['line'],1)
        self.assertTrue(any(c['resolution']=='unresolved_indirect_call' for c in result['calls']))
    def test_active_variant_excludes_opposite_branch(self):
        self.source('#if EDGE\nint edge(void){return 1;}\n#else\nint other(void){return 2;}\n#endif\n')
        with self.profile({'EDGE':1}):first=analyze(self.roots[0],self.storage,'same.c')
        with self.profile({'EDGE':0}):second=analyze(self.roots[0],self.storage,'same.c')
        self.assertEqual([d['name'] for d in first['definitions']],['edge'])
        self.assertEqual([d['name'] for d in second['definitions']],['other'])
        self.assertTrue(first['inactive_ranges']);self.assertTrue(second['inactive_ranges'])
    def test_missing_header_is_partial_not_success(self):
        self.source('#include "missing.h"\nint entry(void){return 1;}\n')
        with self.profile():result=analyze(self.roots[0],self.storage,'same.c')
        self.assertEqual(result['status'],'partial')
        self.assertTrue(result['diagnostics'])
    def test_snapshot_ignores_later_unindexed_source_edits(self):
        self.source('int saved(void){return 1;}\n')
        (self.roots[0].path/'same.c').write_text('int unindexed(void){return 2;}\n')
        with self.profile():result=analyze(self.roots[0],self.storage,'same.c')
        self.assertEqual([d['name'] for d in result['definitions']],['saved'])
    def test_project_include_escape_is_rejected(self):
        with self.assertRaisesRegex(ValueError,'escapes'):
            safe_arguments({'include_dirs':['../outside']},self.roots[0],self.base/'snapshot','same.c')
    def test_unknown_or_external_translation_unit_is_rejected(self):
        with self.profile(),self.assertRaisesRegex(ValueError,'indexed C'):
            analyze(self.roots[0],self.storage,'../external.c')

    def test_virtual_variant_override_does_not_modify_indexed_source(self):
        text='#define EDGE 0\n#if EDGE\nint edge(void){return 1;}\n#else\nint other(void){return 2;}\n#endif\n'
        self.source(text)
        with self.profile():
            path=self.base/'profiles.json';data=json.loads(path.read_text())
            data['profiles'][0]['macro_overrides']=[{'file':'same.c','name':'EDGE','value':1}]
            path.write_text(json.dumps(data))
            result=analyze(self.roots[0],self.storage,'same.c')
        self.assertEqual([d['name'] for d in result['definitions']],['edge'])
        self.assertEqual((self.roots[0].path/'same.c').read_text(),text)

    def test_changed_build_metadata_refuses_stale_profile(self):
        metadata=self.base/'build-flags';metadata.write_text('changed')
        with self.profile():
            path=self.base/'profiles.json';data=json.loads(path.read_text())
            data['profiles'][0]['configuration_evidence']=[{'path':str(metadata),'sha256':'old'}]
            path.write_text(json.dumps(data))
            from api.reindex import ReindexError
            with self.assertRaisesRegex(ReindexError,'metadata changed'):
                analyze(self.roots[0],self.storage,'same.c')

    def test_cross_translation_unit_matching_uses_compiler_usr_and_reports_coverage(self):
        self.source('int helper(void){return 1;}\n')
        (self.roots[0].path/'caller.c').write_text('int helper(void); int entry(void){return helper();}\n')
        reindex_root(self.roots[0],self.storage)
        from api.compiler_analysis import find_compiler_symbol
        with self.profile():
            analyze(self.roots[0],self.storage,'same.c');analyze(self.roots[0],self.storage,'caller.c')
            result=find_compiler_symbol([self.roots[0]],self.storage,'helper')
        self.assertTrue(result['coverage_complete'])
        self.assertEqual(result['calls'][0]['definition_candidates'][0]['file_path'],'same.c')
        self.assertFalse(result['runtime_dispatch_proven'])

    def test_hybrid_compiler_context_is_bounded_and_variant_specific(self):
        self.source('int helper(void){return 1;} int entry(void){return helper();}\n')
        from api.compiler_analysis import enrich_compiler_context
        hit={'repository_id':self.roots[0].id,'file_path':'same.c','start_line':1,'end_line':1}
        with self.profile(),patch.dict(os.environ,{'DEEPWIKI_COMPILER_CONTEXT':'true'}):
            result=enrich_compiler_context([self.roots[0]],self.storage,[hit])
        self.assertEqual(result[0]['compiler_context']['variant'],'fixture')
        self.assertTrue(result[0]['compiler_context']['calls'])

    def test_filesystem_overlay_blocks_external_header_reads(self):
        external=self.base/'not-indexed.h';external.write_text('int outside(void){return 0;}\n')
        self.source('#include "'+str(external)+'"\nint entry(void){return 1;}\n')
        with self.profile():result=analyze(self.roots[0],self.storage,'same.c')
        self.assertEqual(result['status'],'partial')
        self.assertFalse(result['includes'])
        self.assertFalse(any(d['name']=='outside' for d in result['definitions']))

    def test_absolute_project_include_uses_snapshot_not_live_source(self):
        dependency=self.roots[0].path/'dependency.c'
        dependency.write_text('int helper(void){return 1;}\n')
        self.source('#include "'+str(dependency)+'"\nint entry(void){return helper();}\n')
        dependency.write_text('int live_only(void){return 2;}\n')
        with self.profile():result=analyze(self.roots[0],self.storage,'same.c')
        call=next(c for c in result['calls'] if c['name']=='helper')
        self.assertEqual(call['resolution'],'compiler_resolved_definition')
        self.assertFalse(any(d['name']=='live_only' for d in result['definitions']))

    def test_variant_override_applies_to_an_included_snapshot_file(self):
        dependency=self.roots[0].path/'dependency.c'
        original='#define EDGE 0\n#if EDGE\nint edge(void){return 1;}\n#else\nint other(void){return 0;}\n#endif\n'
        dependency.write_text(original)
        self.source('#include "dependency.c"\n')
        with self.profile():
            path=self.base/'profiles.json';data=json.loads(path.read_text())
            data['profiles'][0]['macro_overrides']=[{'file':'dependency.c','name':'EDGE','value':1}]
            path.write_text(json.dumps(data))
            result=analyze(self.roots[0],self.storage,'same.c')
        self.assertEqual([d['name'] for d in result['definitions']],['edge'])
        self.assertEqual(dependency.read_text(),original)

    def test_changed_sdk_header_invalidates_compiler_cache(self):
        sdk=self.base/'sdk';sdk.mkdir();header=sdk/'sdk.h';header.write_text('int sdk_call(void);\n')
        self.source('#include <sdk.h>\nint entry(void){return sdk_call();}\n')
        with self.profile():
            path=self.base/'profiles.json';data=json.loads(path.read_text())
            data['profiles'][0]['system_include_dirs']=[str(sdk)]
            path.write_text(json.dumps(data))
            first=analyze(self.roots[0],self.storage,'same.c')
            self.assertEqual(first['status'],'ready')
            header.write_text('#error SDK changed\n')
            second=analyze(self.roots[0],self.storage,'same.c')
        self.assertEqual(second['status'],'partial')
        self.assertTrue(any('SDK changed' in d['message'] for d in second['diagnostics']))

    def test_variant_alias_works_for_analysis_lookup_and_hybrid_context(self):
        self.source('int helper(void){return 1;} int entry(void){return helper();}\n')
        from api.compiler_analysis import select_profile,find_compiler_symbol,enrich_compiler_context
        with self.profile(),patch.dict(os.environ,{'DEEPWIKI_BUILD_VARIANT':'short','DEEPWIKI_COMPILER_CONTEXT':'true'}):
            path=self.base/'profiles.json';data=json.loads(path.read_text());data['profiles'][0]['aliases']=['short'];path.write_text(json.dumps(data))
            self.assertEqual(select_profile(self.roots[0],None)['id'],'fixture')
            result=analyze(self.roots[0],self.storage,'same.c')
            self.assertEqual(result['variant'],'fixture')
            self.assertTrue(find_compiler_symbol([self.roots[0]],self.storage,'helper')['calls'])
            hit={'repository_id':self.roots[0].id,'file_path':'same.c','start_line':1,'end_line':1}
            self.assertEqual(enrich_compiler_context([self.roots[0]],self.storage,[hit])[0]['compiler_context']['variant'],'fixture')

    def test_ambiguous_alias_is_rejected(self):
        from api.compiler_analysis import profiles
        with self.profile():
            path=self.base/'profiles.json';data=json.loads(path.read_text());data['profiles'][0]['aliases']=['short']
            data['profiles'].append(dict(data['profiles'][0],id='other'));path.write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError,'Ambiguous'):profiles()
