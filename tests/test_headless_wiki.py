"""Atomic wiki artifact lifecycle with offline answer responses."""
import asyncio
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import AsyncMock,patch

from api.headless import ScanRoot
from api.headless_wiki import generate_wiki,page_name
from api.reindex import ReindexError


class WikiTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.base=Path(self.temp.name);self.source=self.base/"source";self.source.mkdir()
        self.roots=[ScanRoot("fixture",self.source,{})]
        self.storage=self.base/"index"
        for context in (patch.dict("os.environ",{"DEEPWIKI_ALLOW_SOURCE_EXCERPTS":"true","DEEPWIKI_ALLOW_WIKI_SOURCE_EXCERPTS":"true","DEEPWIKI_PROVIDER":"google"}),
                        patch("api.headless_wiki.load_state",return_value={"generation":"source-g1"})):
            context.start();self.addCleanup(context.stop)
        self.result={"answer":"Build invokes the script [1].","sources":[{"repository_id":"fixture","file_path":"Makefile","start_line":1,"end_line":4,"score":0.9,"text":"private fixture"}]}

    def run_wiki(self,topics):
        return asyncio.run(generate_wiki(self.roots,self.storage,topics))

    def test_pages_sources_and_generation_are_saved(self):
        with patch("api.headless_wiki.answer",new=AsyncMock(return_value=self.result)):
            result=self.run_wiki(["Build workflow","Architecture"])
        pointer=self.storage/"wiki/codewiki-current.json"
        manifest=json.loads(pointer.read_text())
        self.assertEqual(result["pages"],2)
        self.assertEqual(manifest["index_generations"],{"fixture":"source-g1"})
        page=Path(result["directory"])/manifest["pages"][0]["file"]
        self.assertIn("fixture:Makefile:1-4",page.read_text())
        self.assertNotIn("private fixture",pointer.read_text())

    def test_failure_preserves_previous_published_wiki(self):
        with patch("api.headless_wiki.answer",new=AsyncMock(return_value=self.result)):
            self.run_wiki(["Original"])
        pointer=self.storage/"wiki/codewiki-current.json";before=pointer.read_bytes()
        with patch("api.headless_wiki.answer",new=AsyncMock(side_effect=[self.result,RuntimeError("model failed")])):
            with self.assertRaises(RuntimeError):self.run_wiki(["First","Second"])
        self.assertEqual(pointer.read_bytes(),before)

    def test_index_change_prevents_publication(self):
        with patch("api.headless_wiki.answer",new=AsyncMock(return_value=self.result)), patch("api.headless_wiki.load_state",side_effect=[{"generation":"g1"},{"generation":"g2"}]):
            with self.assertRaises(ReindexError):self.run_wiki(["Changed during run"])
        self.assertFalse((self.storage/"wiki/codewiki-current.json").exists())

    def test_citation_errors_never_publish(self):
        invalid=dict(self.result,answer="Unsubstantiated answer [999].")
        with patch("api.headless_wiki.answer",new=AsyncMock(return_value=invalid)):
            with self.assertRaises(ReindexError):self.run_wiki(["Invalid"])
        self.assertFalse((self.storage/"wiki/codewiki-current.json").exists())

    def test_no_source_export_without_approval(self):
        with patch.dict("os.environ",{"DEEPWIKI_ALLOW_SOURCE_EXCERPTS":"false"}), patch("api.headless_wiki.answer",new=AsyncMock()) as answer:
            with self.assertRaises(ReindexError):self.run_wiki(["No approval"])
            answer.assert_not_called()

    def test_output_cannot_write_into_source_tree(self):
        with self.assertRaises(ValueError):
            asyncio.run(generate_wiki(self.roots,self.storage,["Topic"],self.source/"wiki"))
        self.assertFalse((self.source/"wiki").exists())

    def test_topic_names_cannot_escape_output(self):
        name=page_name("../../escape/topic")
        self.assertNotIn("/",name)
        self.assertTrue(name.endswith(".md"))

    def test_wiki_reading_and_staleness_are_explicit(self):
        from api.headless_wiki import wiki_status,read_wiki_page
        with patch("api.headless_wiki.answer",new=AsyncMock(return_value=self.result)):
            self.run_wiki(["Build"])
        page=read_wiki_page(self.roots,self.storage,"Build")
        self.assertFalse(page["stale"])
        self.assertIn("Sources",page["content"])
        with patch("api.headless_wiki.load_state",return_value={"generation":"new-index"}):
            self.assertTrue(wiki_status(self.roots,self.storage)["stale"])
        with self.assertRaises(ValueError):read_wiki_page(self.roots,self.storage,"../../outside")

    def test_modified_wiki_manifest_cannot_escape_artifact_root(self):
        from api.headless_wiki import read_wiki_page
        with patch("api.headless_wiki.answer",new=AsyncMock(return_value=self.result)):
            self.run_wiki(["Build"])
        pointer=self.storage/"wiki/codewiki-current.json"
        manifest=json.loads(pointer.read_text())
        manifest["pages"][0]["file"]="../../../../outside"
        pointer.write_text(json.dumps(manifest))
        with self.assertRaises(ReindexError):read_wiki_page(self.roots,self.storage,"Build")

    def test_answer_approval_does_not_enable_wiki_exports(self):
        with patch.dict("os.environ",{"DEEPWIKI_ALLOW_SOURCE_EXCERPTS":"true","DEEPWIKI_ALLOW_WIKI_SOURCE_EXCERPTS":"false"}),patch("api.headless_wiki.answer",new=AsyncMock()) as answer:
            with self.assertRaisesRegex(ReindexError,"separate approval"):self.run_wiki(["Not approved for wiki"])
            answer.assert_not_called()


    def test_new_topic_retains_existing_page_without_regenerating_it(self):
        with patch("api.headless_wiki.answer",new=AsyncMock(return_value=self.result)):
            first=self.run_wiki(["Original"])
        original=(Path(first["directory"])/page_name("Original")).read_bytes()
        with patch("api.headless_wiki.answer",new=AsyncMock(return_value=self.result)) as model:
            second=self.run_wiki(["New topic"])
        self.assertEqual(model.await_count,1)
        self.assertEqual(second["pages"],2);self.assertEqual(second["retained_pages"],1)
        self.assertEqual((Path(second["directory"])/page_name("Original")).read_bytes(),original)

    def test_stale_retained_pages_require_explicit_refresh(self):
        with patch("api.headless_wiki.answer",new=AsyncMock(return_value=self.result)):
            self.run_wiki(["Original"])
        pointer=self.storage/"wiki/codewiki-current.json";before=pointer.read_bytes()
        with patch("api.headless_wiki.load_state",return_value={"generation":"new-source"}),patch("api.headless_wiki.answer",new=AsyncMock()) as model:
            with self.assertRaisesRegex(ReindexError,"stale"):self.run_wiki(["New topic"])
            model.assert_not_called()
        self.assertEqual(pointer.read_bytes(),before)
