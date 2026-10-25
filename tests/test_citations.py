import unittest
from api.citations import citation_numbers
from api.headless_wiki import render_page
from api.reindex import ReindexError


class CitationTests(unittest.TestCase):
    def test_single_and_grouped_references(self):
        self.assertEqual(citation_numbers('Observed [1], also [2, 3,4].'),[1,2,3,4])

    def test_code_arrays_are_not_citations(self):
        self.assertEqual(citation_numbers('Example `items[0]` and ```c\na[99];\n``` verified [1].'),[1])

    def test_grouped_wiki_references_are_accepted(self):
        sources=[{'repository_id':'a','file_path':'main.c','start_line':1,'end_line':3}]*2
        self.assertIn('Sources',render_page('topic',{'answer':'Observed [1, 2].','sources':sources}))

    def test_invalid_member_in_group_is_rejected(self):
        source={'repository_id':'a','file_path':'main.c','start_line':1,'end_line':3}
        with self.assertRaises(ReindexError):render_page('topic',{'answer':'Observed [1, 99].','sources':[source]})
