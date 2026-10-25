"""Lossless syntax chunks and explicit strategy identities; no hosted embeddings."""
import os
import unittest
from unittest.mock import patch
import tiktoken
from adalflow.core.types import Document
from api.syntax_chunks import SyntaxTextSplitter,chunk_strategy,estimate_root_chunks
from api.headless_index import index_configuration,index_directory
from tests import test_relationship_context as fixtures


class SyntaxTests(unittest.TestCase):
    def chunks(self,text,path='example.c',size=40,overlap=6):
        doc=Document(text=text,meta_data={'file_path':path,'repository_id':'fixture'})
        return SyntaxTextSplitter(chunk_size=size,chunk_overlap=overlap)([doc])

    def assert_coverage(self,text,chunks,size):
        positions=set();encoding=tiktoken.get_encoding('cl100k_base')
        for piece in chunks:
            meta=piece.meta_data;a=meta['char_start'];b=meta['char_end']
            self.assertEqual(piece.text,text[a:b]);positions.update(range(a,b))
            self.assertLessEqual(len(encoding.encode(piece.text,disallowed_special=())),size)
            self.assertEqual(meta['start_line'],text.count('\n',0,a)+1)
            self.assertEqual(meta['end_line'],text.count('\n',0,b-1)+1)
        self.assertEqual(positions,set(range(len(text))))

    def test_small_functions_stay_whole_and_uncovered_source_is_kept(self):
        text='#include "api.h"\nint before;\nint one(void) { return 1; }\nint two(void) { return 2; }\nint after;\n'
        pieces=self.chunks(text,size=80)
        self.assert_coverage(text,pieces,80)
        definitions=[p for p in pieces if p.meta_data.get('definition_name')]
        self.assertEqual([p.meta_data['definition_name'] for p in definitions],['one','two'])
        self.assertTrue(all(p.meta_data['piece_count']==1 for p in definitions))

    def test_oversized_definition_has_stable_linked_pieces_and_unicode_offsets(self):
        text='int huge(void) {\n'+(' // café 🙂 value\n'*80)+' return 1;\n}\n'
        pieces=self.chunks(text);self.assert_coverage(text,pieces,40)
        self.assertGreater(len(pieces),1)
        self.assertEqual(len({p.meta_data['definition_id'] for p in pieces}),1)
        for i,piece in enumerate(pieces):
            self.assertEqual(piece.meta_data['piece_index'],i)
            self.assertEqual(piece.meta_data['previous_piece_id'],pieces[i-1].id if i else None)
            self.assertEqual(piece.meta_data['next_piece_id'],pieces[i+1].id if i+1<len(pieces) else None)
        self.assertEqual([p.id for p in pieces],[p.id for p in self.chunks(text)])

    def test_nested_python_definitions_and_decorators_keep_symbol_spans(self):
        text='@decorate\nclass Service:\n def run(self):\n  def nested():\n   return 1\n  return nested()\n'
        pieces=self.chunks(text,'example.py',size=100)
        self.assertEqual(len(pieces),1)
        self.assertTrue(pieces[0].text.startswith('@decorate'))
        self.assertEqual({s['name'] for s in pieces[0].meta_data['definition_symbols']},{'Service','run','nested'})
        self.assert_coverage(text,pieces,100)

    def test_malformed_python_falls_back_and_script_make_source_is_retained(self):
        for path,text in [('legacy.py','def invalid(:\n print 1\n'),('Makefile','all: target\n\t$(MAKE) -C child\n'),('script.sh','echo ready\n')]:
            pieces=self.chunks(text,path);self.assert_coverage(text,pieces,40)
            self.assertFalse(any(p.meta_data.get('definition_id') for p in pieces))

    def test_guards_are_not_evaluated_and_very_long_lines_are_split(self):
        text='#if FLAG\nint guarded(void) { return '+('value + '*200)+'0; }\n#endif\n'
        pieces=self.chunks(text);self.assert_coverage(text,pieces,40)
        guarded=[p for p in pieces if p.meta_data.get('definition_name')=='guarded']
        self.assertTrue(all(p.meta_data['build_variant']=='unselected' for p in guarded))
        self.assertTrue(all(p.meta_data['conditional_context'] for p in guarded))

    def test_short_window_before_long_line_does_not_repeat_almost_entirely(self):
        text=' '*300+'int big(void) {\n return '+('value + '*200)+'0;\n}\n'
        pieces=self.chunks(text,size=40,overlap=12)
        self.assert_coverage(text,pieces,40)
        self.assertLess(len(pieces),30)
        self.assertEqual(sum(p.estimated_num_tokens<=12 for p in pieces),1)

    def test_empty_source_and_invalid_settings_are_explicit(self):
        self.assertEqual(self.chunks(''),[])
        for kwargs in ({'split_by':'word'},{'chunk_size':0},{'chunk_size':10,'chunk_overlap':10}):
            with self.assertRaises(ValueError):SyntaxTextSplitter(**kwargs)
        with patch.dict(os.environ,{'DEEPWIKI_CHUNK_STRATEGY':'unknown'}):
            with self.assertRaises(ValueError):chunk_strategy()


class StrategyTests(unittest.TestCase):
    setUp=fixtures.ContextTests.setUp

    def test_default_identity_is_unchanged_and_syntax_identity_is_separate(self):
        with patch.dict(os.environ,{'DEEPWIKI_CHUNK_STRATEGY':'token'}):
            legacy=index_configuration();legacy_path=index_directory(self.roots[0],self.storage)
        self.assertNotIn('chunk_strategy',legacy)
        with patch.dict(os.environ,{'DEEPWIKI_CHUNK_STRATEGY':'syntax-v1'}):
            self.assertNotEqual(index_directory(self.roots[0],self.storage),legacy_path)
            self.assertEqual(index_configuration()['chunk_strategy'],'syntax-v1')
        self.assertTrue((legacy_path/'state.json').exists())

    def test_estimate_makes_no_embedding_calls_or_index_writes(self):
        root=self.roots[0]
        before={str(p) for p in self.storage.rglob('*')}
        with patch.dict(os.environ,{'DEEPWIKI_CHUNK_STRATEGY':'syntax-v1'}),patch('api.config.get_embedder',side_effect=AssertionError('No model initialization')):
            result=estimate_root_chunks(root)
        self.assertGreater(result['chunks'],0)
        self.assertEqual(result['embedding_calls'],0)
        self.assertFalse(result['skipped'])
        self.assertEqual(before,{str(p) for p in self.storage.rglob('*')})

    def test_syntax_forward_update_and_rename_reuse_vectors_with_new_identities(self):
        import copy
        from adalflow.core.db import LocalDB
        from api.headless_index import build_root
        from api.reindex import reindex_root,iter_active_chunks
        from api.headless_search import load_state
        def embed(docs,filename):
            chunks=SyntaxTextSplitter(chunk_size=1000,chunk_overlap=150)(docs)
            for chunk in chunks:chunk.vector=[1.,2.,3.]
            db=LocalDB(items=docs,transformed_items={'split_and_embed':chunks});db.save_state(filename);return db
        root=self.roots[0]
        with patch.dict(os.environ,{'DEEPWIKI_CHUNK_STRATEGY':'syntax-v1'}),patch('api.headless_index.transform_documents_and_save_to_db',side_effect=embed),patch('api.reindex.transform_documents_and_save_to_db',side_effect=embed) as embedding:
            build_root(root,self.storage);reindex_root(root,self.storage)
            original=list(iter_active_chunks(load_state(root,self.storage)))
            previous={d.meta_data['definition_id'] for d in original if d.meta_data['file_path']=='main.c' and d.meta_data.get('definition_id')}
            embedding.reset_mock();reindex_root(root,self.storage);embedding.assert_not_called()
            (root.path/'main.c').rename(root.path/'renamed.c')
            result=reindex_root(root,self.storage)
            embedding.assert_not_called();self.assertEqual(result['reused_files'],1)
            renamed=[d for d in iter_active_chunks(load_state(root,self.storage)) if d.meta_data['file_path']=='renamed.c']
            self.assertTrue(renamed)
            self.assertFalse(previous.intersection(d.meta_data.get('definition_id') for d in renamed))
            self.assertTrue(all(d.vector==[1.,2.,3.] for d in renamed))
            (root.path/'renamed.c').write_text('int changed(void) { return 1; }\n')
            reindex_root(root,self.storage);self.assertEqual(embedding.call_count,1)

    def test_pipeline_uses_document_strategy_without_changing_web_default(self):
        import tempfile
        from pathlib import Path
        from adalflow.core.component import Component
        from api.rag.pipeline import prepare_data_pipeline,transform_documents_and_save_to_db,LineTrackingTextSplitter
        class OfflineEmbeddings(Component):
            def call(self,docs):
                for doc in docs:doc.vector=[1.,2.,3.]
                return docs
        with patch('api.rag.pipeline.get_embedder',return_value=object()),patch('api.rag.pipeline.ToEmbeddings',side_effect=lambda **kwargs:OfflineEmbeddings()):
            with patch.dict(os.environ,{'DEEPWIKI_CHUNK_STRATEGY':'syntax-v1'}):
                self.assertIsInstance(prepare_data_pipeline()[0],LineTrackingTextSplitter)
            with tempfile.TemporaryDirectory() as folder:
                docs=[Document(text='int ready(void) { return 0; }\n',meta_data={'file_path':'ready.c','chunk_strategy':'syntax-v1'})]
                db=transform_documents_and_save_to_db(docs,str(Path(folder)/'index.pkl'))
                chunks=db.get_transformed_data(key='split_and_embed')
                self.assertEqual(chunks[0].meta_data['definition_name'],'ready')
                self.assertEqual(chunks[0].vector,[1.,2.,3.])

    def test_cli_estimate_uses_explicit_strategy_without_writing_index(self):
        import io,json,sys
        from api.headless import main
        output=io.StringIO();before={str(p) for p in self.storage.rglob('*')}
        with patch.dict(os.environ,{'DEEPWIKI_CHUNK_STRATEGY':'token'}),patch('dotenv.load_dotenv'),patch('api.headless.load_manifest',return_value=self.roots),patch.object(sys,'__stdout__',output),patch('api.config.get_embedder',side_effect=AssertionError('No embedding')),patch('api.rag.pipeline.get_embedder',side_effect=AssertionError('No embedding')):
            code=main(['fixture.json','--storage-root',str(self.storage),'--chunk-strategy','syntax-v1','--estimate-chunks'])
        self.assertEqual(code,0)
        payload=json.loads(output.getvalue())
        self.assertTrue(all(r['strategy']=='syntax-v1' and r['embedding_calls']==0 for r in payload['repositories']))
        self.assertEqual(before,{str(p) for p in self.storage.rglob('*')})

    def test_duplicate_hash_in_other_language_does_not_hide_reusable_vectors(self):
        from adalflow.core.db import LocalDB
        from api.headless_index import build_root
        from api.reindex import reindex_root,iter_active_chunks
        from api.headless_search import load_state
        def embed(docs,filename):
            chunks=SyntaxTextSplitter(chunk_size=1000,chunk_overlap=150)(docs)
            for chunk in chunks:chunk.vector=[1.,2.,3.]
            db=LocalDB(items=docs,transformed_items={'split_and_embed':chunks});db.save_state(filename);return db
        root=self.roots[0];text='int shared(void) { return 7; }\n'
        (root.path/'a.c').write_text(text);(root.path/'z.py').write_text(text)
        with patch.dict(os.environ,{'DEEPWIKI_CHUNK_STRATEGY':'syntax-v1'}),patch('api.headless_index.transform_documents_and_save_to_db',side_effect=embed),patch('api.reindex.transform_documents_and_save_to_db',side_effect=embed) as embedding:
            build_root(root,self.storage);reindex_root(root,self.storage);embedding.reset_mock()
            (root.path/'a.c').rename(root.path/'b.c')
            (root.path/'copy.c').write_text(text)
            result=reindex_root(root,self.storage)
            embedding.assert_not_called();self.assertEqual(result['reused_files'],2)
            active=[c for c in iter_active_chunks(load_state(root,self.storage)) if c.meta_data['file_path'] in {'b.c','copy.c'}]
            self.assertEqual(len(active),2)
            self.assertEqual(len({c.meta_data['definition_id'] for c in active}),2)
            self.assertEqual(len({c.id for c in active}),2)
