"""Dependency-free coverage: python3 -m unittest discover -s tests -t . -p test_headless.py."""
import io
import json
from pathlib import Path
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from unittest.mock import Mock, patch

from api.headless import index_roots, load_env_roots, load_manifest, main


class HeadlessTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.manifest = self.base / "repos.json"
        for parent in ("one", "two"):
            (self.base / parent / "same-name").mkdir(parents=True)

    def write(self, entries):
        self.manifest.write_text(json.dumps({"repositories": entries}))
        return load_manifest(self.manifest)

    def entries(self):
        return [{"id": "one", "path": "one/same-name"}, {"id": "two", "path": "two/same-name"}]

    def test_same_basename_has_distinct_stable_storage(self):
        roots = self.write(self.entries())
        storage = self.base / "storage"
        self.assertNotEqual(roots[0].storage_path(storage), roots[1].storage_path(storage))
        self.assertEqual(roots[0].storage_path(storage), load_manifest(self.manifest)[0].storage_path(storage))

    def test_filter_change_invalidates_storage(self):
        entries = self.entries()
        before = self.write(entries)[0].storage_path(self.base)
        entries[0]["excluded_dirs"] = ["build"]
        self.assertNotEqual(before, self.write(entries)[0].storage_path(self.base))

    def test_root_change_invalidates_storage(self):
        entries = self.entries()[:1]
        before = self.write(entries)[0].storage_path(self.base)
        entries[0]["path"] = "two/same-name"
        self.assertNotEqual(before, self.write(entries)[0].storage_path(self.base))

    def test_duplicate_and_unsafe_ids_rejected(self):
        for repo_id in ("one", "../escape", "", "/absolute"):
            entries = self.entries()
            entries[1]["id"] = repo_id
            with self.subTest(id=repo_id), self.assertRaises(ValueError):
                self.write(entries)

    def test_overlap_and_symlink_alias_rejected(self):
        entries = self.entries()
        entries[1]["path"] = "one"
        with self.assertRaises(ValueError):
            self.write(entries)
        (self.base / "alias").symlink_to(self.base / "one/same-name", target_is_directory=True)
        entries[1]["path"] = "alias"
        with self.assertRaises(ValueError):
            self.write(entries)

    def test_missing_directory_rejected(self):
        with self.assertRaises(OSError):
            self.write([{"id": "missing", "path": "missing"}])

    def test_invalid_manifest_and_filters_rejected(self):
        for entries in ([], [{"id": "one", "path": "one", "excluded_dirs": "build"}],
                        [{"id": "one", "path": "one", "typo": True}]):
            with self.subTest(entries=entries), self.assertRaises(ValueError):
                self.write(entries)

    def test_index_calls_exact_roots_and_continues_after_failure(self):
        roots = self.write(self.entries())
        good = Mock(repo_paths={"save_db_file": "isolated.pkl"})
        good.prepare_database.return_value = [object(), object()]
        bad = Mock()
        bad.prepare_database.side_effect = RuntimeError("private detail")
        factory = Mock(side_effect=[bad, good])
        result = index_roots(roots, self.base / "storage", factory)
        self.assertEqual([r["status"] for r in result], ["error", "ready"])
        self.assertNotIn("private detail", json.dumps(result))
        self.assertEqual(result[1]["chunks"], 2)
        good.prepare_database.assert_called_once_with(
            repo_url_or_path=str(roots[1].path), repo_type="local", **roots[1].filters
        )
        self.assertNotEqual(factory.call_args_list[0], factory.call_args_list[1])

    def test_empty_index_is_error(self):
        root = self.write(self.entries()[:1])[0]
        manager = Mock()
        manager.prepare_database.return_value = []
        self.assertEqual(index_roots([root], self.base / "storage", Mock(return_value=manager))[0]["status"], "error")

    def test_plan_has_exact_roots_without_loading_backend(self):
        self.write(self.entries())
        output = io.StringIO()
        with redirect_stdout(output):
            code = main([str(self.manifest), "--plan", "--storage-root", str(self.base / "storage")])
        self.assertEqual(code, 0)
        self.assertEqual([r["path"] for r in json.loads(output.getvalue())["repositories"]],
                         [str((self.base / e["path"]).resolve()) for e in self.entries()])

    def test_storage_inside_source_rejected(self):
        self.write(self.entries())
        with redirect_stderr(io.StringIO()):
            self.assertEqual(main([str(self.manifest), "--plan", "--storage-root", str(self.base / "one/same-name/cache")]), 2)

    def env_file(self, folders=None):
        env = self.base / ".env"
        folders = ["one/same-name", "two/same-name"] if folders is None else folders
        env.write_text(
            "UNRELATED_KEY=untouched\n"
            + f"DEEPWIKI_SCAN_ROOT='{self.base}'\n"
            + "DEEPWIKI_SCAN_FOLDERS='" + json.dumps(folders) + "' # scope\n"
        )
        return env

    @patch.dict("os.environ", {}, clear=True)
    def test_env_loads_only_selected_folders_and_preserves_file(self):
        env = self.env_file()
        before = env.read_bytes()
        roots = load_env_roots(env)
        self.assertEqual([r.path for r in roots], [self.base / "one/same-name", self.base / "two/same-name"])
        self.assertNotEqual(roots[0].id, roots[1].id)
        self.assertEqual(before, env.read_bytes())

    @patch.dict("os.environ", {}, clear=True)
    def test_env_override_and_relative_scan_root(self):
        env = self.env_file()
        with patch.dict("os.environ", {"DEEPWIKI_SCAN_ROOT": "one", "DEEPWIKI_SCAN_FOLDERS": '["same-name"]'}):
            self.assertEqual(load_env_roots(env)[0].path, self.base / "one/same-name")

    @patch.dict("os.environ", {}, clear=True)
    def test_env_rejects_escape_absolute_and_symlink_escape(self):
        (self.base / "one/escape").symlink_to(self.base / "two", target_is_directory=True)
        for folder in ("../two", str(self.base / "two"), "escape"):
            env = self.env_file([folder])
            with patch.dict("os.environ", {"DEEPWIKI_SCAN_ROOT": str(self.base / "one")}):
                with self.subTest(folder=folder), self.assertRaises(ValueError):
                    load_env_roots(env)

    @patch.dict("os.environ", {}, clear=True)
    def test_env_rejects_empty_invalid_and_nonlist_folders(self):
        for folders in ([], "one", [123], [""], ["one", "one/same-name"]):
            with self.subTest(folders=folders), self.assertRaises(ValueError):
                load_env_roots(self.env_file(folders))

    @patch.dict("os.environ", {}, clear=True)
    def test_cli_env_plan_and_manifest_precedence(self):
        env = self.env_file(["one/same-name"])
        output = io.StringIO()
        with redirect_stdout(output):
            self.assertEqual(main(["--env-file", str(env), "--plan"]), 0)
        self.assertEqual(len(json.loads(output.getvalue())["repositories"]), 1)
        self.write(self.entries())
        env.write_text("DEEPWIKI_SCAN_FOLDERS=invalid\n")
        with redirect_stdout(io.StringIO()):
            self.assertEqual(main([str(self.manifest), "--env-file", str(env), "--plan"]), 0)

    @patch.dict("os.environ", {}, clear=True)
    def test_missing_env_config_returns_input_error(self):
        with redirect_stderr(io.StringIO()):
            self.assertEqual(main(["--env-file", str(self.base / "missing.env"), "--plan"]), 2)
