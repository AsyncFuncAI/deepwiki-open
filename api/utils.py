import os

from adalflow.utils import get_adalflow_default_root_path


def deepwiki_root() -> str:
    path = get_adalflow_default_root_path()
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)
    return path
