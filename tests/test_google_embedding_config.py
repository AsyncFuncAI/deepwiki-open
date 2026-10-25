"""Google environment selection without network calls."""
import os
import unittest
from unittest.mock import patch

from api.config import load_embedder_config


class GoogleEmbeddingConfigTests(unittest.TestCase):
    @patch.dict(os.environ, {"GOOGLE_EMBEDDING_MODEL": "chosen-google-model"})
    def test_model_override_leaves_other_providers_unchanged(self):
        config = load_embedder_config()
        self.assertEqual(config["embedder_google"]["model_kwargs"]["model"], "chosen-google-model")
        self.assertEqual(config["embedder"]["model_kwargs"]["model"], "text-embedding-3-small")

    @patch.dict(os.environ, {"GOOGLE_EMBEDDING_MODEL": ""})
    def test_empty_override_preserves_json_default(self):
        self.assertEqual(load_embedder_config()["embedder_google"]["model_kwargs"]["model"], "gemini-embedding-001")

    @patch.dict(os.environ, {"GOOGLE_EMBEDDING_MIN_INTERVAL_SECONDS": "10"})
    def test_request_pacing_is_shared_across_calls(self):
        from api.clients import google_embedder
        with patch.object(google_embedder, "_last_request_at", 0), patch.object(google_embedder.time, "monotonic", return_value=100), patch.object(google_embedder.time, "sleep") as sleep:
            google_embedder.pace_embedding_request()
            google_embedder.pace_embedding_request()
            sleep.assert_called_once_with(10)

    @patch.dict(os.environ, {"GOOGLE_EMBEDDING_MIN_INTERVAL_SECONDS": "-1"})
    def test_negative_pacing_rejected(self):
        from api.clients.google_embedder import pace_embedding_request
        with self.assertRaises(ValueError):
            pace_embedding_request()
