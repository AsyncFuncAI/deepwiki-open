"""Read trusted local index data without reconstructing model clients/transformers."""
import pickle
from adalflow.core.db import LocalDB


class _SavedDocuments(LocalDB):
    def __setstate__(self,state):
        # The original LocalDB loader reconstructs the saved embedding pipeline.
        # Readers need documents/vectors only, and must not initialize providers.
        state=dict(state)
        state.pop("_transformer_files",None)
        state.pop("_transformer_type_names",None)
        self.__dict__.update(state)
        self.transformer_setups={}
        self.mapper_setups={}


class _IndexReader(pickle.Unpickler):
    def find_class(self,module,name):
        if module=="adalflow.core.db" and name=="LocalDB":return _SavedDocuments
        return super().find_class(module,name)


def load_saved_part(filename):
    # These pickles are generated locally by this application's indexer, not input
    # accepted from MCP clients. Never use this for externally supplied pickle data.
    from pathlib import Path
    if Path(filename).suffix=='.sqlite3':
        from api.portable_parts import load_part
        return load_part(filename)
    with open(filename,"rb") as source:
        if source.read(16)==b'SQLite format 3\x00':
            from api.portable_parts import load_part
            return load_part(filename)
        source.seek(0)
        return _IndexReader(source).load()
