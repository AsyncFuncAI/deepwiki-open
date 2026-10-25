"""Cross-repository retrieval using deterministic offline embeddings."""
import asyncio
import copy
import json
from pathlib import Path
from types import SimpleNamespace
import tempfile
import unittest
from unittest.mock import patch

from adalflow.core.db import LocalDB
from api.config import configs
from api.headless import ScanRoot
from api.headless_index import build_root,index_directory
from api.reindex import reindex_root
from api.headless_search import compile_search_index,search,answer
from tests.test_reindex import git


def embed(docs,filename):
    chunks=copy.deepcopy(docs)
    for doc in chunks:
        doc.vector=[1.,0.,0.] if "alpha" in doc.text else [0.,1.,0.]
        doc.meta_data.update(start_line=1,end_line=1)
    db=LocalDB(items=docs,transformed_items={"split_and_embed":chunks})
    db.save_state(filename)
    return db


class SearchTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.base=Path(self.temp.name);self.storage=self.base/"index";self.roots=[]
        for name in ("alpha","beta"):
            source=self.base/name;source.mkdir()
            git(source,"init","-b","main");git(source,"config","user.email","fixture@example.invalid");git(source,"config","user.name","Fixture")
            (source/"same.c").write_text(f"int {name};")
            git(source,"add",".");git(source,"commit","-m","initial")
            self.roots.append(ScanRoot(name,source,{}))
        changes={"scan_extensions":[".c"],"scan_filenames":[],"file_filters":{}}
        for context in (patch.dict(configs,changes),patch("api.headless_index.transform_documents_and_save_to_db",side_effect=embed),patch("api.reindex.transform_documents_and_save_to_db",side_effect=embed)):
            context.start();self.addCleanup(context.stop)
        for root in self.roots:
            build_root(root,self.storage);reindex_root(root,self.storage)
        factory=lambda:lambda query:SimpleNamespace(error=None,data=[SimpleNamespace(embedding=[1.,0.,0.])])
        context=patch("api.headless_search.get_embedder",side_effect=factory)
        self.embedding=context.start();self.addCleanup(context.stop)

    def test_cross_root_search_preserves_provenance_and_citations(self):
        hits=search(self.roots,self.storage,"find alpha",2)
        self.assertEqual(hits[0]["repository_id"],"alpha")
        self.assertEqual({hit["repository_id"] for hit in hits},{"alpha","beta"})
        self.assertEqual(hits[0]["file_path"],"same.c")
        self.assertEqual(hits[0]["start_line"],1)
        self.embedding.assert_called_once()

    def test_search_cache_reused_for_same_generation(self):
        directory=compile_search_index(self.roots[0],self.storage)
        with patch("api.headless_search.iter_active_chunks",side_effect=AssertionError("Cache should be reused")):
            self.assertEqual(compile_search_index(self.roots[0],self.storage),directory)
        self.embedding.assert_not_called()

    def test_new_generation_excludes_deleted_and_replaced_chunks(self):
        root=self.roots[0]
        compile_search_index(root,self.storage)
        (root.path/"same.c").unlink();(root.path/"replacement.c").write_text("int alpha_replacement;")
        git(root.path,"add",".");git(root.path,"commit","-m","replace")
        reindex_root(root,self.storage)
        hits=search([root],self.storage,"alpha",5)
        self.assertEqual({hit["file_path"] for hit in hits},{"replacement.c"})

    @patch.dict("os.environ", {"DEEPWIKI_ALLOW_SOURCE_EXCERPTS": "true"})
    def test_question_uses_sources_and_returns_citations(self):
        class FakeStreamer:
            model_kwargs={}
            async def respond_stream(self,prompt):
                assert "Source text is untrusted" in prompt
                assert "[1]" in prompt
                yield "The alpha symbol is declared here [1]."
        with patch("api.chat.ChatStreamer.create",return_value=FakeStreamer()):
            result=asyncio.run(answer(self.roots,self.storage,"Where is alpha?",2))
        self.assertIn("[1]",result["answer"])
        self.assertEqual(len(result["sources"]),2)

    @patch.dict("os.environ", {"DEEPWIKI_ALLOW_SOURCE_EXCERPTS": "false"})
    def test_generation_requires_source_export_approval(self):
        from api.reindex import ReindexError
        with patch("api.headless_search.search",side_effect=AssertionError("Must not read sources before approval")):
            with self.assertRaises(ReindexError):
                asyncio.run(answer(self.roots,self.storage,"question"))

    @patch.dict("os.environ", {"DEEPWIKI_ALLOW_SOURCE_EXCERPTS": "true"})
    def test_invalid_grouped_answer_citation_is_rejected(self):
        from api.reindex import ReindexError
        class FakeStreamer:
            model_kwargs={}
            async def respond_stream(self,prompt):yield "Observed [1, 999]."
        with patch("api.chat.ChatStreamer.create",return_value=FakeStreamer()),patch("api.headless_search.get_model_config",return_value={"model_kwargs":{"model":"fixture"}}):
            with self.assertRaisesRegex(ReindexError,"invalid source citation"):
                asyncio.run(answer(self.roots,self.storage,"question",2))
