"""File-type allowlist tests without embedding calls."""
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from api.config import configs, iterate_files, load_repo_config


class ScanTypeTests(unittest.TestCase):
    def test_only_c_python_shell_and_makefiles_are_selected(self):
        with tempfile.TemporaryDirectory() as folder:
            names = ["main.c", "main.h", "tool.py", "build.sh", "rules.mk", "Makefile", "Makefile.debug", "makefile", "GNUmakefile",
                     "schema.xml", "model.yang", "data.json", "readme.md", "binary.o", "archive.a", "image.bin", "app.js", "config.in"]
            for name in names:
                (Path(folder) / name).write_text("sample")
            settings = {"scan_extensions": [".c", ".h", ".py", ".sh", ".mk"],
                        "scan_filenames": ["Makefile", "makefile", "GNUmakefile", "Makefile.*"], "file_filters": {}}
            with patch.dict(configs, settings):
                self.assertEqual(set(iterate_files(folder)), set(names[:9]))
                self.assertEqual(iterate_files(folder, included_files=["schema.xml"]), [])

    def test_empty_explicit_allowlist_does_not_scan_everything(self):
        with tempfile.TemporaryDirectory() as folder:
            (Path(folder) / "main.c").write_text("sample")
            with patch.dict(configs, {"scan_extensions": [], "scan_filenames": [], "file_filters": {}}):
                self.assertEqual(iterate_files(folder), [])

    @patch.dict(os.environ, {"DEEPWIKI_SCAN_EXTENSIONS": '[".C", ".py", ".sh"]', "DEEPWIKI_SCAN_FILENAMES": '["Makefile"]'})
    def test_env_controls_allowlist(self):
        config = load_repo_config()
        self.assertEqual(config["scan_extensions"], [".c", ".py", ".sh"])
        self.assertEqual(config["scan_filenames"], ["Makefile"])

    @patch.dict(os.environ, {"DEEPWIKI_SCAN_EXTENSIONS": '["*.xml"]'})
    def test_extension_patterns_rejected(self):
        with self.assertRaises(ValueError):
            load_repo_config()
