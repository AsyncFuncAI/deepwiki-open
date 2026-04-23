import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory


def _write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


class TestFileFiltersGlob(unittest.TestCase):
    def setUp(self) -> None:
        project_root = Path(__file__).parent.parent.parent
        sys.path.insert(0, str(project_root))

    def test_excluded_files_glob_md_excludes_markdown(self):
        from api.data_pipeline import read_all_documents

        with TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            _write_text(tmp_path / "README.md", "# hello\n")
            _write_text(tmp_path / "notes.txt", "hello\n")
            _write_text(tmp_path / "main.py", "print('hi')\n")

            docs = read_all_documents(
                str(tmp_path),
                embedder_type="openai",
                excluded_files=["*.md"],
            )

            paths = {d.meta_data.get("file_path") for d in docs}
            self.assertNotIn("README.md", paths)
            self.assertIn("notes.txt", paths)
            self.assertIn("main.py", paths)

    def test_included_files_glob_md_includes_only_markdown(self):
        from api.data_pipeline import read_all_documents

        with TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            _write_text(tmp_path / "README.md", "# hello\n")
            _write_text(tmp_path / "notes.txt", "hello\n")
            _write_text(tmp_path / "main.py", "print('hi')\n")

            docs = read_all_documents(
                str(tmp_path),
                embedder_type="openai",
                included_files=["*.md"],
            )

            paths = {d.meta_data.get("file_path") for d in docs}
            self.assertEqual(paths, {"README.md"})

    def test_excluded_files_glob_path(self):
        from api.data_pipeline import read_all_documents

        with TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            _write_text(tmp_path / "src/main.py", "print('main')\n")
            _write_text(tmp_path / "pkg/dist/bundle.js", "// bundle\n")
            _write_text(tmp_path / "pkg/src/index.js", "// index\n")

            docs = read_all_documents(
                str(tmp_path),
                embedder_type="openai",
                excluded_files=["pkg/dist/*"],
            )

            paths = {d.meta_data.get("file_path") for d in docs}
            self.assertNotIn(str(Path("pkg/dist/bundle.js")), paths)
            self.assertIn(str(Path("src/main.py")), paths)
            self.assertIn(str(Path("pkg/src/index.js")), paths)

    def test_excluded_files_multiple_patterns(self):
        from api.data_pipeline import read_all_documents

        with TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            _write_text(tmp_path / "src/main.py", "print('main')\n")
            _write_text(tmp_path / "test/test_main.py", "# test\n")
            _write_text(tmp_path / "build/output.js", "// build\n")
            _write_text(tmp_path / "lib/helper.py", "# helper\n")

            docs = read_all_documents(
                str(tmp_path),
                embedder_type="openai",
                excluded_files=["test/*", "build/*"],
            )

            paths = {d.meta_data.get("file_path") for d in docs}
            self.assertIn(str(Path("src/main.py")), paths)
            self.assertIn(str(Path("lib/helper.py")), paths)
            self.assertNotIn(str(Path("test/test_main.py")), paths)
            self.assertNotIn(str(Path("build/output.js")), paths)

    def test_excluded_files_nested_directories(self):
        from api.data_pipeline import read_all_documents

        with TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            _write_text(tmp_path / "src/utils/helper.py", "# helper\n")
            _write_text(tmp_path / "src/core/main.py", "# main\n")
            _write_text(tmp_path / "node_modules/pkg/index.js", "// pkg\n")
            _write_text(tmp_path / "vendor/lib/code.py", "# vendor\n")

            docs = read_all_documents(
                str(tmp_path),
                embedder_type="openai",
                excluded_files=["node_modules/*", "vendor/*"],
            )

            paths = {d.meta_data.get("file_path") for d in docs}
            self.assertIn(str(Path("src/utils/helper.py")), paths)
            self.assertIn(str(Path("src/core/main.py")), paths)
            self.assertNotIn(str(Path("node_modules/pkg/index.js")), paths)
            self.assertNotIn(str(Path("vendor/lib/code.py")), paths)

    def test_excluded_files_wildcard_extension(self):
        from api.data_pipeline import read_all_documents

        with TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            _write_text(tmp_path / "src/main.py", "# python\n")
            _write_text(tmp_path / "src/app.js", "// js\n")
            _write_text(tmp_path / "config.txt", "key=value\n")
            _write_text(tmp_path / "data.rst", "Documentation\n")

            docs = read_all_documents(
                str(tmp_path),
                embedder_type="openai",
                excluded_files=["*.txt", "*.rst"],
            )

            paths = {d.meta_data.get("file_path") for d in docs}
            self.assertIn(str(Path("src/main.py")), paths)
            self.assertIn(str(Path("src/app.js")), paths)
            self.assertNotIn("config.txt", paths)
            self.assertNotIn("data.rst", paths)

    def test_excluded_dirs_simple(self):
        from api.data_pipeline import read_all_documents

        with TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            _write_text(tmp_path / "src/main.py", "# main\n")
            _write_text(tmp_path / "tests/test_main.py", "# test\n")
            _write_text(tmp_path / "lib/helper.py", "# helper\n")

            docs = read_all_documents(
                str(tmp_path),
                embedder_type="openai",
                excluded_dirs=["tests"],
            )

            paths = {d.meta_data.get("file_path") for d in docs}
            self.assertIn(str(Path("src/main.py")), paths)
            self.assertIn(str(Path("lib/helper.py")), paths)
            self.assertNotIn(str(Path("tests/test_main.py")), paths)

    def test_excluded_dirs_multiple(self):
        from api.data_pipeline import read_all_documents

        with TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            _write_text(tmp_path / "src/main.py", "# main\n")
            _write_text(tmp_path / "mybuild/output.js", "// build\n")
            _write_text(tmp_path / "mydist/bundle.js", "// dist\n")
            _write_text(tmp_path / "lib/helper.py", "# helper\n")

            docs = read_all_documents(
                str(tmp_path),
                embedder_type="openai",
                excluded_dirs=["mybuild", "mydist"],
            )

            paths = {d.meta_data.get("file_path") for d in docs}
            self.assertIn(str(Path("src/main.py")), paths)
            self.assertIn(str(Path("lib/helper.py")), paths)
            self.assertNotIn(str(Path("mybuild/output.js")), paths)
            self.assertNotIn(str(Path("mydist/bundle.js")), paths)

    def test_combined_excluded_dirs_and_files(self):
        from api.data_pipeline import read_all_documents

        with TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            _write_text(tmp_path / "src/main.py", "# main\n")
            _write_text(tmp_path / "src/config.txt", "key=value\n")
            _write_text(tmp_path / "tests/test_main.py", "# test\n")
            _write_text(tmp_path / "lib/helper.py", "# helper\n")
            _write_text(tmp_path / "lib/data.txt", "data\n")

            docs = read_all_documents(
                str(tmp_path),
                embedder_type="openai",
                excluded_dirs=["tests"],
                excluded_files=["*.txt"],
            )

            paths = {d.meta_data.get("file_path") for d in docs}
            self.assertIn(str(Path("src/main.py")), paths)
            self.assertIn(str(Path("lib/helper.py")), paths)
            self.assertNotIn(str(Path("tests/test_main.py")), paths)
            self.assertNotIn(str(Path("src/config.txt")), paths)
            self.assertNotIn(str(Path("lib/data.txt")), paths)

    def test_included_files_with_path_pattern(self):
        from api.data_pipeline import read_all_documents

        with TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            _write_text(tmp_path / "src/main.py", "# main\n")
            _write_text(tmp_path / "src/utils/helper.py", "# helper\n")
            _write_text(tmp_path / "tests/test_main.py", "# test\n")
            _write_text(tmp_path / "lib/util.py", "# util\n")

            docs = read_all_documents(
                str(tmp_path),
                embedder_type="openai",
                included_files=["*.py"],
            )

            paths = {d.meta_data.get("file_path") for d in docs}
            self.assertIn(str(Path("src/main.py")), paths)
            self.assertIn(str(Path("src/utils/helper.py")), paths)
            self.assertIn(str(Path("tests/test_main.py")), paths)
            self.assertIn(str(Path("lib/util.py")), paths)

    def test_deep_nested_exclusion(self):
        from api.data_pipeline import read_all_documents

        with TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            _write_text(tmp_path / "src/app/core/main.py", "# main\n")
            _write_text(tmp_path / "src/app/tests/test.py", "# test\n")
            _write_text(tmp_path / "lib/vendor/pkg/code.py", "# vendor\n")
            _write_text(tmp_path / "lib/internal/util.py", "# internal\n")

            docs = read_all_documents(
                str(tmp_path),
                embedder_type="openai",
                excluded_files=["*/tests/*", "*/vendor/*"],
            )

            paths = {d.meta_data.get("file_path") for d in docs}
            self.assertIn(str(Path("src/app/core/main.py")), paths)
            self.assertIn(str(Path("lib/internal/util.py")), paths)
            self.assertNotIn(str(Path("src/app/tests/test.py")), paths)
            self.assertNotIn(str(Path("lib/vendor/pkg/code.py")), paths)


if __name__ == "__main__":
    unittest.main()
