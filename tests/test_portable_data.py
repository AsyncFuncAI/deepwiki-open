import asyncio
from contextlib import redirect_stdout,redirect_stderr
import io
import json
import os
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch
import numpy as np
from mcp import Client
from tests import test_headless_search as fixtures
from api.headless import load_env_roots,main
from api.headless_settings import runtime_paths,inside
from api.portable_data import export_dataset,import_dataset,verify_bundle
from api.headless_index import index_directory
from api.headless_search import load_state,search
from api.structural_index import lookup
from api.headless_wiki import generate_wiki,wiki_status,read_wiki_page
from api.reindex import reindex_root

class PortableTests(unittest.TestCase):
    def setUp(self):
        fixtures.SearchTests.setUp(self)
        context=patch.dict(os.environ,{'DEEPWIKI_CACHE_DIR':str(self.base/'query-cache')})
        context.start();self.addCleanup(context.stop)
    def export(self):
        target=self.base/'bundle'
        with patch('api.config.get_embedder',side_effect=AssertionError('No model calls during export')):
            result=export_dataset(self.roots,self.storage,target)
        self.assertEqual(result['embedding_calls'],0)
        return target
    def env(self,data,read_only=True,mapping=None):
        env=self.base/'recipient.env'
        env.write_text('DEEPWIKI_DATA_DIR='+str(data)+'\nDEEPWIKI_WIKI_DIR=wiki\nDEEPWIKI_READ_ONLY='+str(read_only).lower()+'\n'+("DEEPWIKI_SOURCE_PATHS='"+json.dumps(mapping)+"'\n" if mapping else ''))
        return env
    @patch.dict(os.environ,{},clear=True)
    def test_env_locations_and_explicit_override_precedence(self):
        env=self.base/'locations.env';env.write_text('DEEPWIKI_DATA_DIR=shared/data\nDEEPWIKI_WIKI_DIR=notes\nDEEPWIKI_READ_ONLY=true\n')
        data,wiki,readonly=runtime_paths(env)
        self.assertEqual(data,self.base/'shared/data');self.assertEqual(wiki,data/'notes');self.assertTrue(readonly)
        with patch.dict(os.environ,{'DEEPWIKI_DATA_DIR':'other'}):self.assertEqual(runtime_paths(env)[0],self.base/'other')
        self.assertEqual(runtime_paths(env,self.base/'override')[0],self.base/'override')
    def test_bundle_is_relative_and_has_no_secret_or_pickle_configuration(self):
        (self.storage/'.env').write_text('CLINE_API_KEY=secret-marker')
        bundle=self.export();verify_bundle(bundle)
        self.assertFalse(list(bundle.rglob('*.pkl')));self.assertFalse(list(bundle.rglob('.env')))
        for path in bundle.rglob('*.json'):
            self.assertNotIn('secret-marker',path.read_text())
            self.assertNotIn(str(self.roots[0].path),path.read_text())
        state=json.loads((bundle/'repositories/alpha/index/state.json').read_text())
        self.assertFalse(Path(state['files']['same.c']['part']).is_absolute())
    def test_moved_bundle_queries_without_sources_or_embedding_initialization(self):
        bundle=self.export();moved=self.base/'elsewhere/data';import_dataset(bundle,moved)
        for root in self.roots:shutil.rmtree(root.path)
        env=self.env(moved);roots=load_env_roots(env)
        self.assertTrue(all(r.read_only and not r.path.exists() for r in roots))
        before={p.relative_to(moved).as_posix():p.stat().st_mtime_ns for p in moved.rglob('*')}
        with patch('api.config.get_embedder',side_effect=AssertionError('Exact lookup needs no key')):
            hits=lookup(roots,moved,'alpha','symbol',8)
        self.assertEqual(hits[0]['repository_id'],'alpha')
        self.assertEqual(hits[0]['file_path'],'same.c')
        result=search(roots,moved,'alpha',2)
        self.assertEqual(result[0]['repository_id'],'alpha')
        self.assertEqual(set(h['repository_id'] for h in result),{'alpha','beta'})
        self.assertEqual({p.relative_to(moved).as_posix():p.stat().st_mtime_ns for p in moved.rglob('*')},before)
    def test_writable_source_mapping_reuses_existing_vectors(self):
        bundle=self.export();target=self.base/'moved-data';import_dataset(bundle,target)
        mapping={}
        for root in self.roots:
            moved=self.base/'new-checkouts'/root.id;shutil.copytree(root.path,moved);mapping[root.id]=str(moved)
        env=self.env(target,False,mapping);roots=load_env_roots(env)
        with patch('api.reindex.transform_documents_and_save_to_db',side_effect=AssertionError('Same source must reuse vectors')):
            for root in roots:self.assertEqual(reindex_root(root,target)['indexed_files'],0)
        state=json.loads((target/'repositories/alpha/index/state.json').read_text())
        self.assertNotIn(str(self.base),json.dumps(state))
        self.assertEqual(lookup(roots,target,'alpha','symbol')[0]['repository_id'],'alpha')
    def test_changed_source_embeds_only_that_file_and_writes_sqlite_update(self):
        bundle=self.export();target=self.base/'imported';import_dataset(bundle,target)
        mapping={r.id:str(r.path) for r in self.roots};roots=load_env_roots(self.env(target,False,mapping))
        (self.roots[0].path/'same.c').write_text('int alpha_changed;')
        result=reindex_root(roots[0],target)
        self.assertEqual(result['indexed_files'],1)
        state=load_state(roots[0],target)
        self.assertTrue(state['files']['same.c']['part'].endswith('.sqlite3'))
        self.assertEqual(lookup(roots,target,'alpha_changed','symbol')[0]['file_path'],'same.c')
    def test_readonly_rejects_direct_writes_and_hides_mcp_mutations(self):
        bundle=self.export();roots=load_env_roots(self.env(bundle))
        with self.assertRaisesRegex(ValueError,'read-only'):reindex_root(roots[0],bundle)
        with self.assertRaisesRegex(ValueError,'read-only'):asyncio.run(generate_wiki(roots,bundle,['Forbidden']))
        from api.headless_mcp import create_server
        async def scenario():
            async with Client(create_server(roots,bundle)) as client:
                names={t.name for t in (await client.list_tools()).tools}
                self.assertNotIn('reindex_repositories',names);self.assertNotIn('generate_wiki_pages',names)
                self.assertNotIn('analyze_c_translation_unit',names)
                self.assertFalse((await client.call_tool('list_repositories',{})).is_error)
        asyncio.run(scenario())
    def test_wiki_moves_with_bundle_and_keeps_source_generations(self):
        from api.headless_index import write_json
        versions={r.id:load_state(r,self.storage)['generation'] for r in self.roots}
        folder=self.storage/'wiki/generations/wiki-g1';folder.mkdir(parents=True)
        (folder/'page.md').write_text('# Wiki\nCited fixture');(folder/'index.md').write_text('# Index')
        manifest={'kind':'codewiki-wiki','version':1,'state':'ready','generation':'wiki-g1','directory':str(folder),'index_generations':versions,'pages':[{'topic':'Fixture','file':'page.md','sources':[]}]}
        write_json(self.storage/'wiki/codewiki-current.json',manifest)
        bundle=self.export();moved=self.base/'new-data';import_dataset(bundle,moved)
        for root in self.roots:shutil.rmtree(root.path)
        roots=load_env_roots(self.env(moved))
        self.assertFalse(wiki_status(roots,moved)['stale'])
        self.assertIn('Cited fixture',read_wiki_page(roots,moved,'Fixture')['content'])
        self.assertEqual(json.loads((moved/'wiki/codewiki-current.json').read_text())['directory'],'generations/wiki-g1')
    def test_corruption_fails_before_import_publication(self):
        bundle=self.export();part=next(bundle.rglob('*.sqlite3'));part.write_bytes(b'corrupted')
        target=self.base/'bad-import'
        with self.assertRaisesRegex(ValueError,'checksum'):import_dataset(bundle,target)
        self.assertFalse(target.exists())
    def test_path_traversal_and_windows_paths_are_rejected(self):
        for name in ['../escape','/absolute','C:/escape','a'+chr(92)+'escape']:
            with self.subTest(name=name),self.assertRaises(ValueError):inside(self.base,name)
    def test_existing_destination_is_never_overwritten(self):
        bundle=self.export()
        with self.assertRaisesRegex(ValueError,'must not exist'):export_dataset(self.roots,self.storage,bundle)
        with self.assertRaisesRegex(ValueError,'must not exist'):import_dataset(bundle,bundle)
    def test_cli_plan_reads_catalog_without_source_configuration(self):
        bundle=self.export();env=self.env(bundle)
        output=io.StringIO()
        with redirect_stdout(output),redirect_stderr(io.StringIO()):code=main(['--env-file',str(env),'--plan'])
        self.assertEqual(code,0)
        self.assertEqual({r['id'] for r in json.loads(output.getvalue())['repositories']},{'alpha','beta'})

    def test_portable_state_refuses_pickle_even_with_valid_checksums(self):
        from api.portable_data import digest
        bundle=self.export();state_path=bundle/'repositories/alpha/index/state.json'
        state=json.loads(state_path.read_text());state['files']['same.c']['part']='parts/disguised.pkl';state_path.write_text(json.dumps(state))
        malicious=bundle/'repositories/alpha/index/parts/disguised.pkl';malicious.write_bytes(b'not executable input')
        manifest=json.loads((bundle/'bundle.json').read_text())
        for entry in manifest['files']:
            if entry['path']=='repositories/alpha/index/state.json':entry.update(bytes=state_path.stat().st_size,sha256=digest(state_path))
        manifest['files'].append({'path':malicious.relative_to(bundle).as_posix(),'bytes':malicious.stat().st_size,'sha256':digest(malicious)})
        (bundle/'bundle.json').write_text(json.dumps(manifest))
        with self.assertRaisesRegex(ValueError,'SQLite parts only'):import_dataset(bundle,self.base/'rejected')

    def test_readonly_query_tolerates_recipient_parser_version_change(self):
        bundle=self.export();roots=load_env_roots(self.env(bundle))
        expected=load_state(self.roots[0],self.storage)['generation']
        with patch('api.headless_search.index_configuration',side_effect=AssertionError('Read-only exact lookup must not depend on local parser identity')):
            self.assertEqual(load_state(roots[0],bundle)['generation'],expected)

    def test_nested_and_containing_git_checkpoints_survive_source_relocation(self):
        from api.headless import ScanRoot
        from api.headless_index import build_root
        from tests.test_reindex import git
        parent=self.base/'parent';parent.mkdir();git(parent,'init','-b','main');git(parent,'config','user.email','fixture@example.invalid');git(parent,'config','user.name','Fixture')
        scope=parent/'selected';scope.mkdir();(scope/'main.c').write_text('int alpha;')
        nested=scope/'nested';nested.mkdir();git(nested,'init','-b','main');git(nested,'config','user.email','fixture@example.invalid');git(nested,'config','user.name','Fixture')
        (nested/'other.c').write_text('int beta;');git(nested,'add','.');git(nested,'commit','-m','nested')
        git(parent,'add','.');git(parent,'commit','-m','parent')
        root=ScanRoot('complex',scope,{})
        build_root(root,self.storage);reindex_root(root,self.storage)
        bundle=self.base/'complex-bundle';export_dataset([root],self.storage,bundle)
        moved=self.base/'relocated-parent';shutil.copytree(parent,moved)
        roots=load_env_roots(self.env(bundle,False,{'complex':str(moved/'selected')}))
        with patch('api.reindex.transform_documents_and_save_to_db',side_effect=AssertionError('No re-embedding')):
            result=reindex_root(roots[0],bundle)
        self.assertEqual(result['indexed_files'],0);self.assertEqual(len(result['commits']),2)
        self.assertEqual({p['repository'] for p in result['commits']},{str(moved),str(moved/'selected/nested')})

    def test_failed_export_preserves_live_state_and_never_publishes_destination(self):
        from api.headless_index import index_directory
        before={r.id:(index_directory(r,self.storage)/'state.json').read_bytes() for r in self.roots}
        with patch('api.portable_parts.save_part',side_effect=RuntimeError('fixture write failed')):
            with self.assertRaises(RuntimeError):export_dataset(self.roots,self.storage,self.base/'failed-export')
        self.assertFalse((self.base/'failed-export').exists())
        self.assertTrue(all((index_directory(r,self.storage)/'state.json').read_bytes()==before[r.id] for r in self.roots))


    def test_import_detects_corruption_during_copy_before_publication(self):
        bundle=self.export();target=self.base/'interrupted-copy'
        original=shutil.copyfile
        def damaged(source,destination):
            result=original(source,destination)
            if str(destination).endswith('.sqlite3'):Path(destination).write_bytes(b'copy-corrupted')
            return result
        with patch('api.portable_data.shutil.copyfile',side_effect=damaged):
            with self.assertRaisesRegex(ValueError,'checksum'):import_dataset(bundle,target)
        self.assertFalse(target.exists())
        self.assertFalse(list(self.base.glob('.interrupted-copy-*')))

    def test_cli_import_reads_env_destination_and_refuses_overwrite(self):
        bundle=self.export();target=self.base/'cli-import';env=self.env(target)
        output=io.StringIO()
        with redirect_stdout(output),redirect_stderr(io.StringIO()):code=main(['--env-file',str(env),'--import-data',str(bundle)])
        self.assertEqual(code,0);self.assertEqual(json.loads(output.getvalue())['directory'],str(target))
        with redirect_stdout(io.StringIO()),redirect_stderr(io.StringIO()):code=main(['--env-file',str(env),'--import-data',str(bundle)])
        self.assertEqual(code,2)
