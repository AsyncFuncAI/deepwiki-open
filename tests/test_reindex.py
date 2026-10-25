"""Forward commit ranges, immutable index state and offline embedding tests."""
import copy
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

from adalflow.core.db import LocalDB
from api.config import configs
from api.headless import ScanRoot
from api.headless_index import build_root,index_directory
from api.reindex import ReindexError,reindex_root,iter_active_chunks


def git(path,*args):
    result=subprocess.run(["git","-C",str(path),*args],check=True,capture_output=True)
    return result.stdout.decode().strip()


def offline_embed(docs,filename):
    chunks=copy.deepcopy(docs)
    for d in chunks:d.vector=[1.,2.,3.]
    db=LocalDB(items=docs,transformed_items={"split_and_embed":chunks})
    db.save_state(filename)
    return db


class ReindexTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.base=Path(self.temp.name);self.source=self.base/"source";self.source.mkdir()
        git(self.source,"init","-b","main")
        git(self.source,"config","user.email","fixture@example.invalid")
        git(self.source,"config","user.name","Fixture")
        (self.source/"one.c").write_text("int one;")
        (self.source/"two.py").write_text("value = 2")
        (self.source/"ignore.xml").write_text("<ignore/>")
        self.commit("initial")
        self.root=ScanRoot("fixture",self.source,{})
        self.storage=self.base/"index"
        self.config=patch.dict(configs,{"scan_extensions":[".c",".py",".sh",".mk"],"scan_filenames":["Makefile"],"file_filters":{}})
        self.config.start();self.addCleanup(self.config.stop)
        self.full=patch("api.headless_index.transform_documents_and_save_to_db",side_effect=offline_embed)
        self.full.start();self.addCleanup(self.full.stop)
        self.embed_patch=patch("api.reindex.transform_documents_and_save_to_db",side_effect=offline_embed)
        self.embed=self.embed_patch.start();self.addCleanup(self.embed_patch.stop)

    def commit(self,message):
        git(self.source,"add",".");git(self.source,"commit","-m",message)
        return git(self.source,"rev-parse","HEAD")

    def initial(self):
        build_root(self.root,self.storage)
        return reindex_root(self.root,self.storage)

    def state(self):
        return json.loads((index_directory(self.root,self.storage)/"state.json").read_text())

    def test_adoption_and_no_change_make_zero_embedding_calls(self):
        initial=self.initial()
        self.assertTrue(initial["baseline_adopted"])
        self.assertEqual(initial["indexed_files"],0)
        again=reindex_root(self.root,self.storage)
        self.assertEqual(initial["generation"],again["generation"])
        self.embed.assert_not_called()

    def test_multiple_forward_commits_update_only_changed_content(self):
        self.initial()
        (self.source/"one.c").write_text("int new_one;");self.commit("first change")
        (self.source/"new.sh").write_text("echo ready");self.commit("second change")
        result=reindex_root(self.root,self.storage)
        self.assertEqual(result["indexed_files"],2)
        self.assertEqual(self.embed.call_count,2)
        active={d.meta_data["file_path"]:d.text for d in iter_active_chunks(self.state())}
        self.assertEqual(active["one.c"],"int new_one;")
        self.assertIn("two.py",active);self.assertIn("new.sh",active)
        self.assertNotIn("ignore.xml",active)

    def test_delete_and_rename_reuse_vectors_without_embedding(self):
        self.initial()
        git(self.source,"mv","one.c","renamed.c")
        (self.source/"two.py").unlink();self.commit("rename and delete")
        result=reindex_root(self.root,self.storage)
        self.assertEqual(result["deleted_files"],2)
        self.assertEqual(result["reused_files"],1)
        self.embed.assert_not_called()
        self.assertEqual({d.meta_data["file_path"] for d in iter_active_chunks(self.state())},{"renamed.c"})

    def test_failure_preserves_previous_generation_and_checkpoint(self):
        self.initial();before=self.state()
        (self.source/"one.c").write_text("int changed;");self.commit("change")
        self.embed.side_effect=RuntimeError("embedding failure")
        with self.assertRaises(RuntimeError):reindex_root(self.root,self.storage)
        self.assertEqual(self.state(),before)

    def test_out_of_scope_commit_advances_watermark_without_embeddings(self):
        initial=self.initial()
        (self.source/"ignore.xml").write_text("<changed/>");head=self.commit("xml only")
        result=reindex_root(self.root,self.storage)
        self.assertEqual(result["commits"][0]["to_commit"],head)
        self.assertEqual(result["indexed_files"],0)
        self.assertNotEqual(initial["generation"],result["generation"])
        self.embed.assert_not_called()

    def test_uncommitted_and_untracked_changes_are_not_lost(self):
        self.initial()
        (self.source/"one.c").write_text("int dirty;")
        (self.source/"dirty.sh").write_text("echo dirty")
        result=reindex_root(self.root,self.storage)
        self.assertEqual(result["dirty_files"],2)
        self.assertEqual(result["indexed_files"],2)
        self.commit("commit already indexed working tree")
        self.embed.reset_mock()
        self.assertEqual(reindex_root(self.root,self.storage)["indexed_files"],0)
        self.embed.assert_not_called()

    def test_diverged_or_rewound_history_fails_without_checkpoint_changes(self):
        initial=self.initial();old=git(self.source,"rev-parse","HEAD")
        (self.source/"one.c").write_text("int advanced;");self.commit("advance")
        reindex_root(self.root,self.storage);before=self.state()
        git(self.source,"reset","--hard",old)
        with self.assertRaises(ReindexError):reindex_root(self.root,self.storage)
        self.assertEqual(before,self.state())

    def test_changed_sources_between_initial_scan_and_adoption_are_reconciled(self):
        build_root(self.root,self.storage)
        (self.source/"one.c").write_text("int arrived_later;");self.commit("during initial scan")
        result=reindex_root(self.root,self.storage)
        self.assertTrue(result["baseline_adopted"])
        self.assertEqual(result["indexed_files"],1)
        self.assertEqual({d.meta_data["file_path"]:d.text for d in iter_active_chunks(self.state())}["one.c"],"int arrived_later;")

    def test_parent_repository_diff_stays_inside_selected_subfolder(self):
        selected=self.source/"selected";selected.mkdir()
        (selected/"inside.c").write_text("int inside;");self.commit("selected subtree")
        root=ScanRoot("subtree",selected,{})
        build_root(root,self.storage);reindex_root(root,self.storage)
        (self.source/"one.c").write_text("int outside;");self.commit("outside selected folder")
        self.embed.reset_mock()
        self.assertEqual(reindex_root(root,self.storage)["indexed_files"],0)
        self.embed.assert_not_called()

    def test_nested_repositories_advance_independently(self):
        nested=self.source/"nested";nested.mkdir()
        git(nested,"init","-b","main");git(nested,"config","user.email","fixture@example.invalid");git(nested,"config","user.name","Fixture")
        (nested/"nested.c").write_text("int nested;")
        git(nested,"add",".");git(nested,"commit","-m","nested initial")
        result=self.initial()
        self.assertEqual(len(result["commits"]),2)
        old_parent=git(self.source,"rev-parse","HEAD")
        (nested/"nested.c").write_text("int nested_changed;")
        git(nested,"add",".");git(nested,"commit","-m","nested change")
        result=reindex_root(self.root,self.storage)
        self.assertEqual(result["indexed_files"],1)
        self.assertEqual(self.state()["repositories"][str(self.source)],old_parent)

    def test_configuration_change_requires_explicit_targeted_rebuild(self):
        self.initial()
        with patch.dict(configs,{"scan_extensions":[".c"]}):
            with self.assertRaises(ReindexError):reindex_root(self.root,self.storage)

    def test_source_changes_during_update_preserve_checkpoint(self):
        self.initial();before=self.state()
        (self.source/"one.c").write_text("int changed;");self.commit("update input")
        def moving_source(docs,filename):
            db=offline_embed(docs,filename)
            (self.source/"two.py").write_text("concurrent_change = True")
            return db
        self.embed.side_effect=moving_source
        with self.assertRaises(ReindexError):reindex_root(self.root,self.storage)
        self.assertEqual(before,self.state())

    def test_publication_failure_does_not_advance_current_state(self):
        self.initial();before=self.state()
        (self.source/"one.c").write_text("int changed;");self.commit("change")
        from api.reindex import write_json as real_write
        def fail_pointer(path,value):
            if path.name=="state.json":raise OSError("simulated atomic publication failure")
            real_write(path,value)
        with patch("api.reindex.write_json",side_effect=fail_pointer):
            with self.assertRaises(OSError):reindex_root(self.root,self.storage)
        self.assertEqual(before,self.state())
        calls=self.embed.call_count
        result=reindex_root(self.root,self.storage)
        self.assertEqual(result["indexed_files"],1)
        self.assertEqual(calls,self.embed.call_count)
