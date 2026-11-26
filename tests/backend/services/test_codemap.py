from api.schemas import CodeMap
from api.services.codemap import _ground_citations, read_repo_file

GBK_SOURCE = "def main():\n    # 读取配置文件\n    load_config()\n"


def _write_gbk_file(tmp_path):
    (tmp_path / "main.py").write_bytes(GBK_SOURCE.encode("gbk"))


def test_read_repo_file_decodes_gbk(tmp_path):
    _write_gbk_file(tmp_path)

    assert read_repo_file(str(tmp_path), None, "main.py") == GBK_SOURCE


def test_ground_citations_in_gbk_file(tmp_path):
    _write_gbk_file(tmp_path)
    codemap = CodeMap.model_validate(
        {
            "title": "Startup",
            "sections": [
                {
                    "id": "1",
                    "title": "Load config",
                    "steps": [
                        {
                            "id": "1a",
                            "label": "Read the config file",
                            "citation": {
                                "file_path": "main.py",
                                "start_line": 10,
                                "end_line": 10,
                                "snippet": "    # 读取配置文件\n    load_config()",
                            },
                        }
                    ],
                }
            ],
        }
    )

    _ground_citations(codemap, str(tmp_path))

    citation = codemap.sections[0].steps[0].citation
    assert (citation.start_line, citation.end_line) == (2, 3)
