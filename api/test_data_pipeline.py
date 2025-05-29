import unittest
from unittest.mock import patch, MagicMock, ANY, call 
import os
import shutil
# No longer need to import logging for patching logger directly in tests
from adalflow import Sequential
from adalflow.core.component import Component
from adalflow.core.types import Document
from adalflow.core.db import LocalDB 

from api.data_pipeline import DatabaseManager, read_all_documents, prepare_data_pipeline, transform_documents_and_save_to_db
from api.config import configs

SAMPLE_FILE_CONTENT_NORMAL = "This is a sample document with several words. It should be chunked for RAG."
SAMPLE_FILE_CONTENT_LARGE = "This is a very large document. " * 500 
TEST_REPO_PARENT_DIR = "test_temp_data_pipeline" 
TEST_REPO_PATH = os.path.join(TEST_REPO_PARENT_DIR, "test_repo")
TEST_FILE_NORMAL = os.path.join(TEST_REPO_PATH, "normal_doc.txt")
TEST_FILE_LARGE = os.path.join(TEST_REPO_PATH, "large_doc.txt")
TEST_DB_PATH = os.path.join(TEST_REPO_PARENT_DIR, "test_db.pkl")

class StubComponent(Component):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.process_logic_mock = MagicMock(return_value=[Document(text="stub_transformed_output", meta_data={'embedding': [0.1, 0.2]})])
        self.init_args = args
        self.init_kwargs = kwargs

    def __call__(self, documents: list[Document], **kwargs) -> list[Document]:
        return self.process_logic_mock(documents, **kwargs) 

    def __str__(self):
        return f"{self.__class__.__name__}({self.init_args}, {self.init_kwargs})"

    def __repr__(self):
        return f"{self.__class__.__name__}({self.init_args}, {self.init_kwargs})"

class StubTextSplitter(StubComponent):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        def split_effect(documents, **inner_kwargs):
            output_docs = []
            for doc_item in documents: # Renamed to avoid confusion with outer 'doc'
                words = doc_item.text.split()
                if len(words) > 5 and doc_item.meta_data and "large_doc" in doc_item.meta_data.get("file_path",""): 
                    output_docs.append(Document(text=" ".join(words[:5]), meta_data=doc_item.meta_data))
                    output_docs.append(Document(text=" ".join(words[5:]), meta_data=doc_item.meta_data))
                else:
                    output_docs.append(Document(text=doc_item.text, meta_data=doc_item.meta_data)) 
            return output_docs
        self.process_logic_mock.side_effect = split_effect

class StubToEmbeddings(StubComponent):
    def __init__(self, embedder, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.embedder = embedder
        def add_embedding_side_effect(documents, **inner_kwargs):
            processed_docs = []
            for doc_idx, doc_item in enumerate(documents): # Renamed to avoid confusion
                new_meta = doc_item.meta_data.copy() if doc_item.meta_data else {}
                new_meta['embedding'] = [0.1 + doc_idx, 0.2, 0.3] 
                processed_docs.append(Document(text=doc_item.text, meta_data=new_meta))
            return processed_docs
        self.process_logic_mock.side_effect = add_embedding_side_effect

class StubOllamaDocumentProcessor(StubComponent):
    def __init__(self, embedder, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.embedder = embedder
        def add_ollama_embedding_side_effect(documents, **inner_kwargs):
            processed_docs = []
            for doc_idx, doc_item in enumerate(documents): # Renamed to avoid confusion
                new_meta = doc_item.meta_data.copy() if doc_item.meta_data else {}
                new_meta['embedding'] = [0.4 + doc_idx, 0.5, 0.6] 
                processed_docs.append(Document(text=doc_item.text, meta_data=new_meta))
            return processed_docs
        self.process_logic_mock.side_effect = add_ollama_embedding_side_effect

class TestDataPipelineFineTuning(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        os.makedirs(TEST_REPO_PATH, exist_ok=True)
        with open(TEST_FILE_NORMAL, "w") as f:
            cls.normal_file_content = SAMPLE_FILE_CONTENT_NORMAL + " some extra words for testing."
            f.write(cls.normal_file_content)
        with open(TEST_FILE_LARGE, "w") as f:
            f.write(SAMPLE_FILE_CONTENT_LARGE)

        cls.original_adalflow_root = os.environ.get("ADALFLOW_ROOT_PATH")
        os.environ["ADALFLOW_ROOT_PATH"] = TEST_REPO_PARENT_DIR
        
        cls.original_openai_api_key = os.environ.get("OPENAI_API_KEY")
        os.environ["OPENAI_API_KEY"] = "test_key_dummy"

        cls.original_text_splitter_config = configs.get("text_splitter", {}).copy()
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
        patcher_save_state = patch('api.data_pipeline.LocalDB.save_state', MagicMock(return_value=None))
        self.mock_save_state = patcher_save_state.start()
        self.addCleanup(patcher_save_state.stop)

    @patch('api.data_pipeline.LocalDB.load_state', new_callable=MagicMock, side_effect=FileNotFoundError("Mock: DB not found for this test"))
    @patch('api.data_pipeline.OllamaDocumentProcessor', new_callable=MagicMock)
    @patch('api.data_pipeline.ToEmbeddings', new_callable=MagicMock)
    @patch('api.data_pipeline.TextSplitter', new_callable=MagicMock)
    def test_processing_for_rag_default(self, MockTextSplitter, MockToEmbeddings, MockOllamaProcessor, mock_db_load_state_prevents_cache):
        configs['fine_tuning_data_prep_default'] = True 
        MockTextSplitter.return_value = StubTextSplitter(**configs["text_splitter"])
        MockToEmbeddings.return_value = StubToEmbeddings(embedder=MagicMock())
        db_manager = DatabaseManager()
        db_manager.repo_paths = {"save_repo_dir": TEST_REPO_PATH, "save_db_file": TEST_DB_PATH}
        documents, _ = db_manager.prepare_db_index(local_ollama=False, chunk_for_fine_tuning=False) # Unpack tuple
        MockTextSplitter.assert_called_once_with(**configs["text_splitter"])
        MockTextSplitter.return_value.process_logic_mock.assert_called()
        MockToEmbeddings.assert_called_once_with(embedder=ANY, batch_size=configs["embedder"]["batch_size"])
        MockToEmbeddings.return_value.process_logic_mock.assert_called()
        MockOllamaProcessor.assert_not_called()
        self.assertEqual(len(documents), 3) 
        for doc in documents:
            self.assertIn('embedding', doc.meta_data) 
            if "large_doc" not in doc.meta_data.get("file_path",""): 
                 self.assertEqual(doc.text, self.normal_file_content) 
            else: 
                 self.assertTrue(doc.text.startswith("This is a very large") or doc.text.startswith("document. "))

    @patch('api.data_pipeline.LocalDB.load_state', new_callable=MagicMock, side_effect=FileNotFoundError("Mock: DB not found for this test"))
    @patch('api.data_pipeline.OllamaDocumentProcessor', new_callable=MagicMock)
    @patch('api.data_pipeline.ToEmbeddings', new_callable=MagicMock)
    @patch('api.data_pipeline.TextSplitter', new_callable=MagicMock)
    def test_processing_for_fine_tuning_true(self, MockTextSplitter, MockToEmbeddings, MockOllamaProcessor, mock_db_load_state_prevents_cache):
        configs['fine_tuning_data_prep_default'] = False 
        db_manager = DatabaseManager()
        db_manager.repo_paths = {"save_repo_dir": TEST_REPO_PATH, "save_db_file": TEST_DB_PATH}
        documents, _ = db_manager.prepare_db_index(local_ollama=False, chunk_for_fine_tuning=True) # Unpack tuple
        MockTextSplitter.assert_not_called()
        MockToEmbeddings.assert_not_called()
        MockOllamaProcessor.assert_not_called()
        self.assertEqual(len(documents), 2) 
        texts = {doc.meta_data['file_path']: doc.text for doc in documents} # Use documents
        self.assertEqual(texts["normal_doc.txt"], self.normal_file_content)
        self.assertEqual(texts["large_doc.txt"], SAMPLE_FILE_CONTENT_LARGE)

    @patch('api.data_pipeline.LocalDB.load_state', new_callable=MagicMock, side_effect=FileNotFoundError("Mock: DB not found for this test"))
    @patch('api.data_pipeline.OllamaDocumentProcessor', new_callable=MagicMock)
    @patch('api.data_pipeline.ToEmbeddings', new_callable=MagicMock)
    @patch('api.data_pipeline.TextSplitter', new_callable=MagicMock)
    def test_behavior_with_json_default_true(self, MockTextSplitter, MockToEmbeddings, MockOllamaProcessor, mock_db_load_state_prevents_cache):
        configs['fine_tuning_data_prep_default'] = True
        db_manager = DatabaseManager()
        db_manager.repo_paths = {"save_repo_dir": TEST_REPO_PATH, "save_db_file": TEST_DB_PATH}
        documents, _ = db_manager.prepare_db_index(local_ollama=False) # Unpack tuple
        MockTextSplitter.assert_not_called()
        MockToEmbeddings.assert_not_called()
        MockOllamaProcessor.assert_not_called()
        self.assertEqual(len(documents), 2) # Check len of documents

    @patch('api.data_pipeline.LocalDB.load_state', new_callable=MagicMock, side_effect=FileNotFoundError("Mock: DB not found for this test"))
    @patch('api.data_pipeline.OllamaDocumentProcessor', new_callable=MagicMock)
    @patch('api.data_pipeline.ToEmbeddings', new_callable=MagicMock)
    @patch('api.data_pipeline.TextSplitter', new_callable=MagicMock)
    def test_behavior_with_json_default_false(self, MockTextSplitter, MockToEmbeddings, MockOllamaProcessor, mock_db_load_state_prevents_cache):
        configs['fine_tuning_data_prep_default'] = False
        MockTextSplitter.return_value = StubTextSplitter(**configs["text_splitter"])
        MockToEmbeddings.return_value = StubToEmbeddings(embedder=MagicMock())
        db_manager = DatabaseManager()
        db_manager.repo_paths = {"save_repo_dir": TEST_REPO_PATH, "save_db_file": TEST_DB_PATH}
        documents, _ = db_manager.prepare_db_index(local_ollama=False) # Unpack tuple
        MockTextSplitter.assert_called_once_with(**configs["text_splitter"])
        MockTextSplitter.return_value.process_logic_mock.assert_called()
        MockToEmbeddings.assert_called_once() 
        MockToEmbeddings.return_value.process_logic_mock.assert_called()
        self.assertEqual(len(documents), 3) # Check len of documents

    @patch('api.data_pipeline.LocalDB.load_state', new_callable=MagicMock, side_effect=FileNotFoundError("Mock: DB not found for this test"))
    @patch('api.data_pipeline.OllamaDocumentProcessor', new_callable=MagicMock)
    @patch('api.data_pipeline.ToEmbeddings', new_callable=MagicMock)
    @patch('api.data_pipeline.TextSplitter', new_callable=MagicMock)
    def test_override_json_default_true_with_false_param(self, MockTextSplitter, MockToEmbeddings, MockOllamaProcessor, mock_db_load_state_prevents_cache):
        configs['fine_tuning_data_prep_default'] = True 
        MockTextSplitter.return_value = StubTextSplitter(**configs["text_splitter"])
        MockToEmbeddings.return_value = StubToEmbeddings(embedder=MagicMock())
        db_manager = DatabaseManager()
        db_manager.repo_paths = {"save_repo_dir": TEST_REPO_PATH, "save_db_file": TEST_DB_PATH}
        documents, _ = db_manager.prepare_db_index(local_ollama=False, chunk_for_fine_tuning=False) # Unpack tuple
        MockTextSplitter.assert_called_once_with(**configs["text_splitter"])
        MockToEmbeddings.assert_called_once_with(embedder=ANY, batch_size=configs["embedder"]["batch_size"])
        self.assertEqual(len(documents), 3) # Check len of documents

    @patch('api.data_pipeline.LocalDB.load_state', new_callable=MagicMock, side_effect=FileNotFoundError("Mock: DB not found for this test"))
    @patch('api.data_pipeline.OllamaDocumentProcessor', new_callable=MagicMock)
    @patch('api.data_pipeline.ToEmbeddings', new_callable=MagicMock)
    @patch('api.data_pipeline.TextSplitter', new_callable=MagicMock)
    def test_override_json_default_false_with_true_param(self, MockTextSplitter, MockToEmbeddings, MockOllamaProcessor, mock_db_load_state_prevents_cache):
        configs['fine_tuning_data_prep_default'] = False 
        db_manager = DatabaseManager()
        db_manager.repo_paths = {"save_repo_dir": TEST_REPO_PATH, "save_db_file": TEST_DB_PATH}
        documents, _ = db_manager.prepare_db_index(local_ollama=False, chunk_for_fine_tuning=True) # Unpack tuple
        MockTextSplitter.assert_not_called()
        MockToEmbeddings.assert_not_called()
        self.assertEqual(len(documents), 2) # Check len of documents

    def test_prepare_data_pipeline_rag(self):
        with patch('api.data_pipeline.TextSplitter', new_callable=MagicMock) as MockTextSplitter, \
             patch('api.data_pipeline.ToEmbeddings', new_callable=MagicMock) as MockToEmbeddings:
            MockTextSplitter.return_value = StubTextSplitter(**configs["text_splitter"])
            MockToEmbeddings.return_value = StubToEmbeddings(embedder=MagicMock())
            pipeline = prepare_data_pipeline(local_ollama=False, chunk_for_fine_tuning=False)
            self.assertIsInstance(pipeline, Sequential)
            MockTextSplitter.assert_called_once_with(**configs["text_splitter"])
            MockToEmbeddings.assert_called_once_with(embedder=ANY, batch_size=configs["embedder"]["batch_size"])
            dummy_doc = Document(text="test input for rag pipeline that is long enough to be split by stub")
            output_docs = pipeline([dummy_doc]) 
            MockTextSplitter.return_value.process_logic_mock.assert_called()
            MockToEmbeddings.return_value.process_logic_mock.assert_called()
            self.assertEqual(len(output_docs), 1) 
            for doc_item in output_docs: # Renamed to avoid confusion 
                 self.assertIn('embedding', doc_item.meta_data) 
                 self.assertEqual(doc_item.text, dummy_doc.text) 

    def test_prepare_data_pipeline_fine_tuning(self):
        pipeline = prepare_data_pipeline(local_ollama=False, chunk_for_fine_tuning=True)
        self.assertIsInstance(pipeline, Sequential)
        dummy_doc = Document(text="test input")
        output_docs = pipeline([dummy_doc]) 
        self.assertEqual(len(output_docs), 1)
        self.assertIs(output_docs[0], dummy_doc)

    @patch('api.data_pipeline.logging.getLogger') # Corrected patch target
    @patch('os.path.exists')
    @patch('api.data_pipeline.LocalDB.load_state')
    @patch('api.data_pipeline.read_all_documents')
    def test_cache_hit_fine_tuning_loads_raw_from_cache(self, mock_read_all_docs, mock_load_state, mock_os_exists, mock_get_logger):
        mock_logger = mock_get_logger.return_value # Get the actual logger mock
        mock_os_exists.return_value = True  
        mock_db_instance = MagicMock() 
        mock_raw_docs_data = [Document(text="raw_doc_1")]
        mock_db_instance.get_documents = MagicMock() 
        def get_docs_side_effect_scen1(key):
            if key == '__adal__DEFAULT_KEY__': 
                return mock_raw_docs_data
            return []
        mock_db_instance.get_documents.side_effect = get_docs_side_effect_scen1
        mock_db_instance.get_transformed_data = MagicMock(return_value=[])
        mock_load_state.return_value = mock_db_instance
        mock_read_all_docs.return_value = [Document(text="fail_if_read_all_docs_called")]
        db_manager = DatabaseManager()
        db_manager.repo_paths = {"save_repo_dir": TEST_REPO_PATH, "save_db_file": TEST_DB_PATH}
        
        documents, status_message = db_manager.prepare_db_index(chunk_for_fine_tuning=True)
        
        self.assertEqual(documents, mock_raw_docs_data)
        self.assertEqual(status_message, "loaded_raw_from_cache")
        mock_read_all_docs.assert_not_called()
        # Log assertions removed as per subtask

    @patch('api.data_pipeline.logging.getLogger')
    @patch('os.path.exists')
    @patch('api.data_pipeline.LocalDB.load_state')
    @patch('api.data_pipeline.read_all_documents')
    @patch('api.data_pipeline.transform_documents_and_save_to_db') 
    def test_cache_miss_fine_tuning_creates_raw_rag_reprocesses(self, mock_transform_and_save, mock_read_all_docs, mock_load_state, mock_os_exists, mock_get_logger):
        mock_logger = mock_get_logger.return_value
        mock_os_exists.return_value = True # DB file exists
        mock_db_instance = MagicMock() 
        mock_db_instance.get_documents = MagicMock()
        # Simulate DB has raw data (from a fine-tuning save) but no transformed RAG data
        def get_docs_side_effect_scen2(key):
            if key == '__adal__DEFAULT_KEY__': 
                return [Document(text="raw_doc_1_for_scenario2")] # Raw data exists
            return []
        mock_db_instance.get_documents.side_effect = get_docs_side_effect_scen2
        mock_db_instance.get_transformed_data = MagicMock(return_value=[]) # No RAG data
        mock_load_state.return_value = mock_db_instance
        
        reprocessed_raw_docs = [Document(text="reprocessed_doc_for_rag")] # Docs read if reprocessing
        mock_read_all_docs.return_value = reprocessed_raw_docs
        
        mock_final_db_after_reprocessing = MagicMock() 
        mock_final_transformed_docs = [Document(text="final_transformed_for_rag")]
        mock_final_db_after_reprocessing.get_transformed_data.return_value = mock_final_transformed_docs
        mock_transform_and_save.return_value = mock_final_db_after_reprocessing
        
        db_manager = DatabaseManager()
        db_manager.repo_paths = {"save_repo_dir": TEST_REPO_PATH, "save_db_file": TEST_DB_PATH}
        
        documents, status_message = db_manager.prepare_db_index(chunk_for_fine_tuning=False) # Request RAG data
        
        mock_read_all_docs.assert_called_once() 
        mock_transform_and_save.assert_called_once()
        self.assertEqual(documents, mock_final_transformed_docs)
        self.assertEqual(status_message, "reprocessed_data_rag")

    @patch('api.data_pipeline.logging.getLogger')
    @patch('os.path.exists')
    @patch('api.data_pipeline.LocalDB.load_state')
    @patch('api.data_pipeline.read_all_documents')
    @patch('api.data_pipeline.transform_documents_and_save_to_db')
    def test_cache_miss_rag_creates_transformed_fine_tuning_reprocesses(self, mock_transform_and_save, mock_read_all_docs, mock_load_state, mock_os_exists, mock_get_logger):
        mock_logger = mock_get_logger.return_value
        mock_os_exists.return_value = True # DB file exists
        mock_db_instance = MagicMock() 
        mock_db_instance.get_documents = MagicMock()
        # Simulate DB has transformed RAG data, but no raw data for fine-tuning
        def get_docs_side_effect_scen3(key):
            if key == '__adal__DEFAULT_KEY__': 
                return [] # No raw data
            return [] 
        mock_db_instance.get_documents.side_effect = get_docs_side_effect_scen3
        mock_db_instance.get_transformed_data = MagicMock(return_value=[Document(text="transformed_doc_1_for_scenario3", meta_data={'embedding': [0.1]})]) # RAG data exists
        mock_load_state.return_value = mock_db_instance
        
        reprocessed_raw_docs = [Document(text="reprocessed_raw_for_fine_tuning")] # Docs read if reprocessing
        mock_read_all_docs.return_value = reprocessed_raw_docs
        
        mock_final_db_after_reprocessing = MagicMock() 
        # For fine-tuning, transform_documents_and_save_to_db returns the db instance,
        # and prepare_db_index returns the raw documents directly.
        mock_transform_and_save.return_value = mock_final_db_after_reprocessing
        
        db_manager = DatabaseManager()
        db_manager.repo_paths = {"save_repo_dir": TEST_REPO_PATH, "save_db_file": TEST_DB_PATH}
        
        documents, status_message = db_manager.prepare_db_index(chunk_for_fine_tuning=True) # Request fine-tuning data
        
        mock_read_all_docs.assert_called_once() 
        mock_transform_and_save.assert_called_once()
        self.assertEqual(documents, reprocessed_raw_docs)
        self.assertEqual(status_message, "reprocessed_data_fine_tuning")

    @patch('api.data_pipeline.logging.getLogger')
    @patch('os.path.exists')
    @patch('api.data_pipeline.LocalDB.load_state')
    @patch('api.data_pipeline.read_all_documents')
    def test_cache_hit_rag_loads_transformed_from_cache(self, mock_read_all_docs, mock_load_state, mock_os_exists, mock_get_logger):
        mock_logger = mock_get_logger.return_value
        mock_os_exists.return_value = True
        mock_db_instance = MagicMock() 
        mock_transformed_docs_data = [Document(text="transformed_doc_1", meta_data={'embedding': [0.1]})]
        mock_db_instance.get_documents = MagicMock()
        def get_docs_side_effect_scen4(key):
            if key == '__adal__DEFAULT_KEY__': 
                return [Document(text="raw_doc_for_scenario4")] # Raw data also exists
            return []
        mock_db_instance.get_documents.side_effect = get_docs_side_effect_scen4
        mock_db_instance.get_transformed_data = MagicMock(return_value=mock_transformed_docs_data) # Transformed RAG data exists
        mock_load_state.return_value = mock_db_instance
        mock_read_all_docs.return_value = [Document(text="fail_if_read_all_docs_called")]
        db_manager = DatabaseManager()
        db_manager.repo_paths = {"save_repo_dir": TEST_REPO_PATH, "save_db_file": TEST_DB_PATH}
        
        documents, status_message = db_manager.prepare_db_index(chunk_for_fine_tuning=False)
        
        self.assertEqual(documents, mock_transformed_docs_data)
        self.assertEqual(status_message, "loaded_transformed_from_cache")
        mock_read_all_docs.assert_not_called()
        # Log assertions removed

if __name__ == '__main__':
    unittest.main(verbosity=2)
