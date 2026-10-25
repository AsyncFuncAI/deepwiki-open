"""Checkpointed full-source indexing with deterministic offline embeddings."""
import copy
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from adalflow.core.db import LocalDB
from api.config import configs
from api.headless import ScanRoot
from api.headless_index import build_root


def embed_offline(docs, filename):
    chunks=copy.deepcopy(docs)
    for doc in chunks:
        doc.vector=[1.0,2.0,3.0]
    db=LocalDB(items=docs,transformed_items={"split_and_embed":chunks})
    db.save_state(filename)
    return db


class HeadlessIndexTests(unittest.TestCase):
    def test_full_source_scope_encoding_persistence_and_retry(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder); source=base/"source"; source.mkdir()
            (source/"old.c").write_bytes(b"// comment \x96\nint main() {return 0;}")
            (source/"script.sh").write_text("echo ready")
            (source/"schema.xml").write_text("<ignore/>")
            root=ScanRoot("test",source,{})
            selection={"scan_extensions":[".c",".sh"],"scan_filenames":[],"file_filters":{}}
            with patch.dict(configs,selection), patch("api.headless_index.transform_documents_and_save_to_db",side_effect=embed_offline) as embed:
                manifest, filename=build_root(root,base/"cache")
                self.assertEqual(manifest["state"],"ready")
                self.assertEqual(manifest["indexed_files"],2)
                self.assertTrue(filename.exists())
                self.assertEqual(embed.call_count,1)
                again,_=build_root(root,base/"cache")
                self.assertEqual(again["chunks"],2)
                self.assertEqual(embed.call_count,1)
                (source/"old.c").write_text("int changed;")
                build_root(root,base/"cache")
                self.assertEqual(embed.call_count,2)

    def test_failed_embedding_is_never_published(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder); source=base/"source"; source.mkdir()
            (source/"main.c").write_text("int main();")
            root=ScanRoot("test",source,{})
            with patch.dict(configs,{"scan_extensions":[".c"],"scan_filenames":[],"file_filters":{}}), patch("api.headless_index.transform_documents_and_save_to_db",side_effect=RuntimeError("offline failure")):
                with self.assertRaises(RuntimeError):
                    build_root(root,base/"cache")
            self.assertEqual(list((base/"cache").rglob("manifest.json")),[])
