import pytest

from api.services.wiki.structure import (
    detect_default_branch,
    parse_wiki_structure,
    read_repo_file_tree,
)

COMPREHENSIVE_XML = """
<wiki_structure>
  <title>My Wiki</title>
  <description>A description</description>
  <sections>
    <section id="section-1">
      <title>Overview</title>
      <pages><page_ref>page-1</page_ref></pages>
      <subsections><section_ref>section-2</section_ref></subsections>
    </section>
    <section id="section-2">
      <title>Architecture</title>
      <pages><page_ref>page-2</page_ref></pages>
    </section>
  </sections>
  <pages>
    <page id="page-1">
      <title>Intro</title>
      <importance>high</importance>
      <relevant_files><file_path>README.md</file_path></relevant_files>
      <related_pages><related>page-2</related></related_pages>
    </page>
    <page id="page-2">
      <title>Arch</title>
      <importance>medium</importance>
      <relevant_files><file_path>src/a.py</file_path></relevant_files>
    </page>
  </pages>
</wiki_structure>
"""


def test_parse_comprehensive():
    s = parse_wiki_structure(COMPREHENSIVE_XML, comprehensive=True)
    assert s.title == "My Wiki"
    assert s.description == "A description"
    assert [p.id for p in s.pages] == ["page-1", "page-2"]
    assert s.pages[0].filePaths == ["README.md"]
    assert s.pages[0].relatedPages == ["page-2"]
    assert s.pages[0].importance == "high"
    assert {sec.id for sec in s.sections} == {"section-1", "section-2"}
    # section-2 is referenced by section-1 -> only section-1 is a root section
    assert s.rootSections == ["section-1"]


def test_parse_concise_ignores_sections():
    xml = """<wiki_structure><title>W</title><description>d</description><pages>
      <page id="page-1"><title>P</title><importance>low</importance>
      <relevant_files><file_path>a.py</file_path></relevant_files></page>
    </pages></wiki_structure>"""
    s = parse_wiki_structure(xml, comprehensive=False)
    assert len(s.pages) == 1 and s.pages[0].importance == "low"
    assert s.sections == []
    assert s.rootSections == []


def test_parse_escapes_bare_ampersand():
    xml = """<wiki_structure><title>Frontend & Backend</title><description>d</description>
      <pages><page id="page-1"><title>P</title><importance>high</importance>
      <relevant_files><file_path>a.py</file_path></relevant_files></page></pages></wiki_structure>"""
    s = parse_wiki_structure(xml, comprehensive=False)
    assert s.title == "Frontend & Backend"  # bare & was escaped then decoded back
    assert len(s.pages) == 1


def test_parse_regex_fallback_on_malformed_xml():
    # Mismatched </oops> makes strict XML parsing fail -> regex page extraction.
    xml = """<wiki_structure>
      <title>Broken</oops>
      <pages><page id="page-1"><title>P1</title><importance>high</importance>
      <relevant_files><file_path>a.py</file_path></relevant_files></page></pages>
    </wiki_structure>"""
    s = parse_wiki_structure(xml, comprehensive=False)
    assert [p.id for p in s.pages] == ["page-1"]
    assert s.pages[0].filePaths == ["a.py"]


def test_parse_no_structure_raises():
    with pytest.raises(ValueError):
        parse_wiki_structure("no xml here", comprehensive=False)


def test_read_repo_file_tree(tmp_path, exclude_test_config):
    (tmp_path / "README.md").write_text("hello readme", encoding="utf-8")
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "a.py").write_text("x", encoding="utf-8")
    (tmp_path / ".hidden").write_text("h", encoding="utf-8")
    (tmp_path / "__pycache__").mkdir()
    (tmp_path / "__pycache__" / "junk.pyc").write_text("j", encoding="utf-8")

    entries, readme = read_repo_file_tree(str(tmp_path))
    assert "README.md" in entries
    assert "src/a.py" in entries
    assert ".hidden" not in entries
    assert not any("__pycache__" in e for e in entries)
    assert readme == "hello readme"


def test_detect_default_branch_non_git_dir(tmp_path):
    assert detect_default_branch(str(tmp_path)) == "main"
