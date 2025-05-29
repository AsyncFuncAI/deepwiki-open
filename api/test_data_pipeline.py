import unittest
from unittest.mock import patch, MagicMock, ANY # Added ANY
import os
import shutil
from adalflow import Sequential # Corrected import
from adalflow.core.component import Component
from adalflow.core.types import Document
from adalflow.core.db import LocalDB # For type hinting if needed, though direct use is mocked

# Assume api.data_pipeline and other necessary imports are available
from api.data_pipeline import DatabaseManager, read_all_documents, prepare_data_pipeline, transform_documents_and_save_to_db
from api.config import configs

# Sample file content
SAMPLE_FILE_CONTENT_NORMAL = "This is a sample document with several words. It should be chunked for RAG."
SAMPLE_FILE_CONTENT_LARGE = "This is a very large document. " * 500 # Approx 2500 words
TEST_REPO_PARENT_DIR = "test_temp_data_pipeline" # Unique name
TEST_REPO_PATH = os.path.join(TEST_REPO_PARENT_DIR, "test_repo")
TEST_FILE_NORMAL = os.path.join(TEST_REPO_PATH, "normal_doc.txt")
TEST_FILE_LARGE = os.path.join(TEST_REPO_PATH, "large_doc.txt")
TEST_DB_PATH = os.path.join(TEST_REPO_PARENT_DIR, "test_db.pkl")

# --- Stub Adalflow Components ---
class StubComponent(Component):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.process_logic_mock = MagicMock(return_value=[Document(text="stub_transformed_output", meta_data={'embedding': [0.1, 0.2]})])
        self.init_args = args
        self.init_kwargs = kwargs

    def __call__(self, documents: list[Document], **kwargs) -> list[Document]:
        # DEBUG PRINT and counter removed
        return self.process_logic_mock(documents, **kwargs) # Ensure kwargs are passed

    def __str__(self):
        return f"{self.__class__.__name__}({self.init_args}, {self.init_kwargs})"

    def __repr__(self):
        return f"{self.__class__.__name__}({self.init_args}, {self.init_kwargs})"

class StubTextSplitter(StubComponent):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Simulate splitting by returning multiple documents based on a simple word count for testing
        def split_effect(documents, **inner_kwargs):
            output_docs = []
            for doc in documents:
                words = doc.text.split()
                # Example: split if more than 5 words, just for testing
                # Also check file_path in meta_data to be more specific for the large doc
                if len(words) > 5 and doc.meta_data and "large_doc" in doc.meta_data.get("file_path",""): 
                    output_docs.append(Document(text=" ".join(words[:5]), meta_data=doc.meta_data))
                    output_docs.append(Document(text=" ".join(words[5:]), meta_data=doc.meta_data))
                else:
                    output_docs.append(Document(text=doc.text, meta_data=doc.meta_data)) # No split if short
            return output_docs
        self.process_logic_mock.side_effect = split_effect


class StubToEmbeddings(StubComponent):
    def __init__(self, embedder, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.embedder = embedder
        def add_embedding_side_effect(documents, **inner_kwargs):
            processed_docs = []
            for doc_idx, doc in enumerate(documents):
                new_meta = doc.meta_data.copy() if doc.meta_data else {}
                new_meta['embedding'] = [0.1 + doc_idx, 0.2, 0.3] # Dummy embedding
                processed_docs.append(Document(text=doc.text, meta_data=new_meta))
            return processed_docs
        self.process_logic_mock.side_effect = add_embedding_side_effect

class StubOllamaDocumentProcessor(StubComponent):
    def __init__(self, embedder, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.embedder = embedder
        def add_ollama_embedding_side_effect(documents, **inner_kwargs):
            processed_docs = []
            for doc_idx, doc in enumerate(documents):
                new_meta = doc.meta_data.copy() if doc.meta_data else {}
                new_meta['embedding'] = [0.4 + doc_idx, 0.5, 0.6] # Dummy Ollama embedding
                processed_docs.append(Document(text=doc.text, meta_data=new_meta))
            return processed_docs
        self.process_logic_mock.side_effect = add_ollama_embedding_side_effect

# --- Test Class ---
class TestDataPipelineFineTuning(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        os.makedirs(TEST_REPO_PATH, exist_ok=True)
        with open(TEST_FILE_NORMAL, "w") as f:
            # Make normal_doc.txt have more than 5 words to test splitter's non-large-file path
            cls.normal_file_content = SAMPLE_FILE_CONTENT_NORMAL + " some extra words for testing."
            f.write(cls.normal_file_content)
        with open(TEST_FILE_LARGE, "w") as f:
            f.write(SAMPLE_FILE_CONTENT_LARGE)

        cls.original_adalflow_root = os.environ.get("ADALFLOW_ROOT_PATH")
        os.environ["ADALFLOW_ROOT_PATH"] = TEST_REPO_PARENT_DIR
        
        cls.original_openai_api_key = os.environ.get("OPENAI_API_KEY")
        os.environ["OPENAI_API_KEY"] = "test_key_dummy"

        cls.original_text_splitter_config = configs.get("text_splitter", {}).copy()
        # Ensure meta_data_to_attach is part of the default test config for text_splitter
        configs["text_splitter"] = {"split_by": "word", "chunk_size": 10, "chunk_overlap": 2, "meta_data_to_attach": {"source_test_splitter": "test_val"} }
        
        cls.original_fine_tuning_default = configs.get('fine_tuning_data_prep_default')


    @classmethod
    def tearDownClass(cls):
        if cls.original_adalflow_root is None:
            if "ADALFLOW_ROOT_PATH" in os.environ: del os.environ["ADALFLOW_ROOT_PATH"]
        else:
            os.environ["ADALFLOW_ROOT_PATH"] = cls.original_adalflow_root

        if cls.original_openai_api_key is None:
            if "OPENAI_API_KEY" in os.environ and os.environ.get("OPENAI_API_KEY") == "test_key_dummy":
                del os.environ["OPENAI_API_KEY"]
        else:
            os.environ["OPENAI_API_KEY"] = cls.original_openai_api_key

        configs["text_splitter"] = cls.original_text_splitter_config
        
        if cls.original_fine_tuning_default is None:
            if 'fine_tuning_data_prep_default' in configs:
                del configs['fine_tuning_data_prep_default']
        else:
            configs['fine_tuning_data_prep_default'] = cls.original_fine_tuning_default

        if os.path.exists(TEST_REPO_PARENT_DIR):
            shutil.rmtree(TEST_REPO_PARENT_DIR)

    def setUp(self):
        patcher_load_state = patch('api.data_pipeline.LocalDB.load_state', MagicMock(side_effect=FileNotFoundError("Mock: DB not found")))
        patcher_save_state = patch('api.data_pipeline.LocalDB.save_state', MagicMock(return_value=None))
        patcher_transform = patch('api.data_pipeline.LocalDB.transform', MagicMock(return_value=None))
        
        self.mock_load_state = patcher_load_state.start()
        self.mock_save_state = patcher_save_state.start()
        self.mock_transform = patcher_transform.start()
        
        self.addCleanup(patcher_load_state.stop)
        self.addCleanup(patcher_save_state.stop)
        self.addCleanup(patcher_transform.stop)

    # --- Test Cases ---

    @patch('api.data_pipeline.OllamaDocumentProcessor', new_callable=MagicMock)
    @patch('api.data_pipeline.ToEmbeddings', new_callable=MagicMock)
    @patch('api.data_pipeline.TextSplitter', new_callable=MagicMock)
    def test_processing_for_rag_default(self, MockTextSplitter, MockToEmbeddings, MockOllamaProcessor):
        configs['fine_tuning_data_prep_default'] = True 

        MockTextSplitter.return_value = StubTextSplitter(**configs["text_splitter"])
        MockToEmbeddings.return_value = StubToEmbeddings(embedder=MagicMock())
        
        db_manager = DatabaseManager()
        db_manager.repo_paths = {"save_repo_dir": TEST_REPO_PATH, "save_db_file": TEST_DB_PATH}
        processed_docs = db_manager.prepare_db_index(local_ollama=False, chunk_for_fine_tuning=False)

        MockTextSplitter.assert_called_once_with(**configs["text_splitter"])
        MockTextSplitter.return_value.process_logic_mock.assert_called()
        MockToEmbeddings.assert_called_once_with(embedder=ANY)
        MockToEmbeddings.return_value.process_logic_mock.assert_called()
        MockOllamaProcessor.assert_not_called()
        self.mock_transform.assert_called_once_with(key="split_and_embed")
        
        # StubTextSplitter splits large_doc.txt (identified by "large_doc" in path) into 2.
        # normal_doc.txt (content updated in setUpClass) is NOT split by the stub's current logic as it doesn't contain "large_doc" in path.
        # So, 1 (normal_doc) + 2 (large_doc parts) = 3 documents.
        self.assertEqual(len(processed_docs), 3) 
        for doc in processed_docs:
            self.assertIn('embedding', doc.meta_data) # From StubToEmbeddings
            if "large_doc" not in doc.meta_data.get("file_path",""): # normal_doc
                 self.assertEqual(doc.text, self.normal_file_content) # Not split
            else: # large_doc parts
                 self.assertTrue(doc.text.startswith("This is a very large document.") or doc.text.startswith("document. This is a very large document."))


        self.mock_transform.reset_mock()

    @patch('api.data_pipeline.OllamaDocumentProcessor', new_callable=MagicMock)
    @patch('api.data_pipeline.ToEmbeddings', new_callable=MagicMock)
    @patch('api.data_pipeline.TextSplitter', new_callable=MagicMock)
    def test_processing_for_fine_tuning_true(self, MockTextSplitter, MockToEmbeddings, MockOllamaProcessor):
        configs['fine_tuning_data_prep_default'] = False 

        db_manager = DatabaseManager()
        db_manager.repo_paths = {"save_repo_dir": TEST_REPO_PATH, "save_db_file": TEST_DB_PATH}
        processed_docs = db_manager.prepare_db_index(local_ollama=False, chunk_for_fine_tuning=True)

        MockTextSplitter.assert_not_called()
        MockToEmbeddings.assert_not_called()
        MockOllamaProcessor.assert_not_called()
        self.mock_transform.assert_not_called()
        
        self.assertEqual(len(processed_docs), 2) 
        texts = {doc.meta_data['file_path']: doc.text for doc in processed_docs}
        self.assertEqual(texts["normal_doc.txt"], self.normal_file_content)
        self.assertEqual(texts["large_doc.txt"], SAMPLE_FILE_CONTENT_LARGE)
        self.mock_transform.reset_mock()


    @patch('api.data_pipeline.OllamaDocumentProcessor', new_callable=MagicMock)
    @patch('api.data_pipeline.ToEmbeddings', new_callable=MagicMock)
    @patch('api.data_pipeline.TextSplitter', new_callable=MagicMock)
    def test_behavior_with_json_default_true(self, MockTextSplitter, MockToEmbeddings, MockOllamaProcessor):
        configs['fine_tuning_data_prep_default'] = True

        db_manager = DatabaseManager()
        db_manager.repo_paths = {"save_repo_dir": TEST_REPO_PATH, "save_db_file": TEST_DB_PATH}
        processed_docs = db_manager.prepare_db_index(local_ollama=False) 

        MockTextSplitter.assert_not_called()
        MockToEmbeddings.assert_not_called()
        MockOllamaProcessor.assert_not_called()
        self.mock_transform.assert_not_called()
        self.assertEqual(len(processed_docs), 2)
        self.mock_transform.reset_mock()

    @patch('api.data_pipeline.OllamaDocumentProcessor', new_callable=MagicMock)
    @patch('api.data_pipeline.ToEmbeddings', new_callable=MagicMock)
    @patch('api.data_pipeline.TextSplitter', new_callable=MagicMock)
    def test_behavior_with_json_default_false(self, MockTextSplitter, MockToEmbeddings, MockOllamaProcessor):
        configs['fine_tuning_data_prep_default'] = False

        MockTextSplitter.return_value = StubTextSplitter(**configs["text_splitter"])
        MockToEmbeddings.return_value = StubToEmbeddings(embedder=MagicMock())

        db_manager = DatabaseManager()
        db_manager.repo_paths = {"save_repo_dir": TEST_REPO_PATH, "save_db_file": TEST_DB_PATH}
        processed_docs = db_manager.prepare_db_index(local_ollama=False)

        MockTextSplitter.assert_called_once_with(**configs["text_splitter"])
        
        # Assertions for call_invoked_count removed

        MockTextSplitter.return_value.process_logic_mock.assert_called()
        MockToEmbeddings.assert_called_once() # Constructor assertion
        MockToEmbeddings.return_value.process_logic_mock.assert_called()
        self.mock_transform.assert_called_once_with(key="split_and_embed")
        self.assertEqual(len(processed_docs), 3)
        self.mock_transform.reset_mock()

    @patch('api.data_pipeline.OllamaDocumentProcessor', new_callable=MagicMock)
    @patch('api.data_pipeline.ToEmbeddings', new_callable=MagicMock)
    @patch('api.data_pipeline.TextSplitter', new_callable=MagicMock)
    def test_override_json_default_true_with_false_param(self, MockTextSplitter, MockToEmbeddings, MockOllamaProcessor):
        configs['fine_tuning_data_prep_default'] = True 

        MockTextSplitter.return_value = StubTextSplitter(**configs["text_splitter"])
        MockToEmbeddings.return_value = StubToEmbeddings(embedder=MagicMock())

        db_manager = DatabaseManager()
        db_manager.repo_paths = {"save_repo_dir": TEST_REPO_PATH, "save_db_file": TEST_DB_PATH}
        processed_docs = db_manager.prepare_db_index(local_ollama=False, chunk_for_fine_tuning=False) 

        MockTextSplitter.assert_called_once_with(**configs["text_splitter"])
        MockToEmbeddings.assert_called_once_with(embedder=ANY)
        self.mock_transform.assert_called_once_with(key="split_and_embed")
        self.assertEqual(len(processed_docs), 3)
        self.mock_transform.reset_mock()

    @patch('api.data_pipeline.OllamaDocumentProcessor', new_callable=MagicMock)
    @patch('api.data_pipeline.ToEmbeddings', new_callable=MagicMock)
    @patch('api.data_pipeline.TextSplitter', new_callable=MagicMock)
    def test_override_json_default_false_with_true_param(self, MockTextSplitter, MockToEmbeddings, MockOllamaProcessor):
        configs['fine_tuning_data_prep_default'] = False 

        db_manager = DatabaseManager()
        db_manager.repo_paths = {"save_repo_dir": TEST_REPO_PATH, "save_db_file": TEST_DB_PATH}
        processed_docs = db_manager.prepare_db_index(local_ollama=False, chunk_for_fine_tuning=True)

        MockTextSplitter.assert_not_called()
        MockToEmbeddings.assert_not_called()
        self.mock_transform.assert_not_called()
        self.assertEqual(len(processed_docs), 2)
        self.mock_transform.reset_mock()

    def test_prepare_data_pipeline_rag(self):
        with patch('api.data_pipeline.TextSplitter', new_callable=MagicMock) as MockTextSplitter, \
             patch('api.data_pipeline.ToEmbeddings', new_callable=MagicMock) as MockToEmbeddings:
            
            # Configure the main mocks to return STUB instances
            MockTextSplitter.return_value = StubTextSplitter(**configs["text_splitter"])
            MockToEmbeddings.return_value = StubToEmbeddings(embedder=MagicMock())
            
            pipeline = prepare_data_pipeline(local_ollama=False, chunk_for_fine_tuning=False)
            self.assertIsInstance(pipeline, Sequential)
            
            # Check that the actual component constructors were called by prepare_data_pipeline
            MockTextSplitter.assert_called_once_with(**configs["text_splitter"])
            MockToEmbeddings.assert_called_once_with(embedder=ANY)

            # Behavioral check of the returned pipeline
            dummy_doc = Document(text="test input for rag pipeline that is long enough to be split by stub")
            output_docs = pipeline([dummy_doc]) 

            # Check that stubs' process_logic_mock was called
            MockTextSplitter.return_value.process_logic_mock.assert_called()
            MockToEmbeddings.return_value.process_logic_mock.assert_called()
            
            # Based on StubTextSplitter splitting if >5 words (and not "large_doc" in path)
            # and StubToEmbeddings adding embeddings
            # "test input for rag pipeline that is long enough to be split by stub" -> 13 words.
            # This dummy_doc has no meta_data, so StubTextSplitter's split_effect will not split it.
            # Thus, 1 document is expected after StubTextSplitter, which then goes to StubToEmbeddings.
            self.assertEqual(len(output_docs), 1) 
            # The loop will run once, for output_docs[0]
            for doc in output_docs: # 
                 self.assertIn('embedding', doc.meta_data) # StubToEmbeddings adds embedding
                 self.assertEqual(doc.text, dummy_doc.text) # Text should be unchanged as not split


    def test_prepare_data_pipeline_fine_tuning(self):
        pipeline = prepare_data_pipeline(local_ollama=False, chunk_for_fine_tuning=True)
        self.assertIsInstance(pipeline, Sequential)
        
        dummy_doc = Document(text="test input")
        output_docs = pipeline([dummy_doc]) 
        self.assertEqual(len(output_docs), 1)
        self.assertIs(output_docs[0], dummy_doc) 


if __name__ == '__main__':
    unittest.main(verbosity=2)
