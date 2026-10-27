import numpy as np
from adalflow.core.types import Document

from api.rag import RAG


def test_rag_valid_filter_documents():
    doc_list = [
        Document(
            text="test1",
            vector=[10, 11, 12],
            meta_data={},
        ),
        Document(
            text="test2",
            vector=np.array([10, 11, 12]),
            meta_data={},
        ),
        Document(
            text="test3",
            vector=(10, 11, 12),
            meta_data={},
        ),
        Document(
            text="invalid1",
            vector=np.array([10, 11, 12, 13]),
            meta_data={},
        ),
        Document(
            text="invalid2",
            vector=None,
            meta_data={},
        ),
    ]

    validated_docs = doc_list.copy()[:3]
    assert validated_docs == RAG._validate_and_filter_embeddings(doc_list)
