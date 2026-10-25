"""MCP tool registration and validation through the official in-process client."""
import asyncio
import unittest
from pathlib import Path
from unittest.mock import patch
from mcp import Client
from api.headless import ScanRoot
from api.headless_mcp import create_server


class MCPTests(unittest.TestCase):
    def test_tools_registered_and_repository_ids_validated(self):
        root=ScanRoot("fixture",Path("/fixture"),{})
        state={"files":{"main.c":{"chunks":1}},"repositories":{"/fixture":"abc"},"generation":"g1"}
        async def scenario():
            with patch("api.headless_search.load_state",return_value=state):
                server=create_server([root],Path("/cache"))
                async with Client(server) as client:
                    tools=await client.list_tools()
                    self.assertEqual({t.name for t in tools.tools},{"list_repositories","search_code","ask_code","reindex_repositories","list_wiki_pages","get_wiki_page","generate_wiki_pages","find_symbol","search_exact","find_relations","trace_relationships","read_definition","list_build_variants","analyze_c_translation_unit","find_compiler_symbol"})
                    result=await client.call_tool("list_repositories",{})
                    self.assertFalse(result.is_error)
                    invalid=await client.call_tool("search_code",{"query":"test","repo_ids":["outside"]})
                    self.assertTrue(invalid.is_error)
        asyncio.run(scenario())
