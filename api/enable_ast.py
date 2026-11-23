#!/usr/bin/env python3
"""Enable or disable AST chunking while preserving embedder configuration."""

import json
import shutil
import sys
from pathlib import Path
from typing import Any


CONFIG_DIR = Path(__file__).resolve().parent / "config"
EMBEDDER_CONFIG = CONFIG_DIR / "embedder.json"
AST_CONFIG = CONFIG_DIR / "embedder.ast.json"
BACKUP_CONFIG = CONFIG_DIR / "embedder.json.backup"


def _load_config(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as config_file:
        return json.load(config_file)


def _write_config(path: Path, config: dict[str, Any]) -> None:
    with path.open("w", encoding="utf-8") as config_file:
        json.dump(config, config_file, indent=2)
        config_file.write("\n")


def enable_ast_chunking() -> bool:
    if not EMBEDDER_CONFIG.exists() or not AST_CONFIG.exists():
        print("Embedder config or AST config is missing")
        return False

    if not BACKUP_CONFIG.exists():
        shutil.copy2(EMBEDDER_CONFIG, BACKUP_CONFIG)

    embedder_config = _load_config(EMBEDDER_CONFIG)
    ast_config = _load_config(AST_CONFIG)
    embedder_config["text_splitter"] = ast_config["text_splitter"]
    _write_config(EMBEDDER_CONFIG, embedder_config)
    print("AST chunking enabled")
    return True


def disable_ast_chunking() -> bool:
    if BACKUP_CONFIG.exists():
        shutil.copy2(BACKUP_CONFIG, EMBEDDER_CONFIG)
        BACKUP_CONFIG.unlink()
    else:
        if not EMBEDDER_CONFIG.exists() or not AST_CONFIG.exists():
            print("Embedder config or AST config is missing")
            return False

        embedder_config = _load_config(EMBEDDER_CONFIG)
        ast_config = _load_config(AST_CONFIG)
        embedder_config["text_splitter"] = ast_config["fallback"]
        _write_config(EMBEDDER_CONFIG, embedder_config)

    print("AST chunking disabled")
    return True


def check_status() -> bool:
    if not EMBEDDER_CONFIG.exists():
        print(f"Embedder config not found: {EMBEDDER_CONFIG}")
        return False

    splitter = _load_config(EMBEDDER_CONFIG).get("text_splitter", {})
    mode = splitter.get("split_by", "word")
    print(f"Chunking mode: {mode}")
    print(f"Chunk size: {splitter.get('chunk_size', 0)}")
    return True


def main() -> None:
    commands = {
        "enable": enable_ast_chunking,
        "disable": disable_ast_chunking,
        "status": check_status,
    }
    if len(sys.argv) != 2 or sys.argv[1].lower() not in commands:
        print("Usage: python enable_ast.py [enable|disable|status]")
        sys.exit(1)

    if not commands[sys.argv[1].lower()]():
        sys.exit(1)


if __name__ == "__main__":
    main()
