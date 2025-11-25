#!/usr/bin/env python3
"""
Simple script to enable/disable AST chunking in DeepWiki.
"""

import json
import shutil
import os
import sys

def enable_ast_chunking():
    """Enable AST-based chunking."""
    embedder_config = "config/embedder.json"
    ast_config = "config/embedder.ast.json"
    backup_config = "config/embedder.json.backup"
    
    # Check if AST config exists
    if not os.path.exists(ast_config):
        print(f"❌ AST config not found: {ast_config}")
        return False
    
    # Backup current config
    if os.path.exists(embedder_config):
        shutil.copy2(embedder_config, backup_config)
        print(f"✅ Backed up current config to {backup_config}")
        
        # Load current config to preserve embedder settings
        with open(embedder_config, 'r') as f:
            current_config = json.load(f)
    else:
        current_config = {}
    
    # Load AST config
    with open(ast_config, 'r') as f:
        ast_config_data = json.load(f)
    
    # Merge embedder settings from current config into AST config
    if 'embedder_ollama' in current_config:
        ast_config_data['embedder_ollama'] = current_config['embedder_ollama']
    if 'retriever' in current_config:
        ast_config_data['retriever'] = current_config['retriever']
    
    # Write merged config
    with open(embedder_config, 'w') as f:
        json.dump(ast_config_data, f, indent=2)
    
    print(f"✅ Enabled AST chunking with preserved embedder settings")
    
    # Verify the switch
    with open(embedder_config, 'r') as f:
        config = json.load(f)
        split_by = config.get('text_splitter', {}).get('split_by', 'unknown')
        print(f"✅ Current chunking mode: {split_by}")
    
    return True

def disable_ast_chunking():
    """Disable AST chunking and restore previous config."""
    embedder_config = "config/embedder.json"
    backup_config = "config/embedder.json.backup"
    
    if os.path.exists(backup_config):
        shutil.copy2(backup_config, embedder_config)
        print(f"✅ Restored previous config from {backup_config}")
    else:
        # Create default text config
        default_config = {
            "embedder_ollama": {
                "client_class": "OllamaClient",
                "model_kwargs": {
                    "model": "nomic-embed-text"
                }
            },
            "retriever": {
                "top_k": 20
            },
            "text_splitter": {
                "split_by": "word",
                "chunk_size": 350,
                "chunk_overlap": 100
            }
        }
        
        with open(embedder_config, 'w') as f:
            json.dump(default_config, f, indent=2)
        
        print(f"✅ Created default text chunking config")
    
    # Verify the switch
    with open(embedder_config, 'r') as f:
        config = json.load(f)
        split_by = config.get('text_splitter', {}).get('split_by', 'unknown')
        print(f"✅ Current chunking mode: {split_by}")

def check_status():
    """Check current chunking status."""
    embedder_config = "config/embedder.json"
    
    if not os.path.exists(embedder_config):
        print("❌ No embedder config found")
        return
    
    with open(embedder_config, 'r') as f:
        config = json.load(f)
        split_by = config.get('text_splitter', {}).get('split_by', 'word')
        chunk_size = config.get('text_splitter', {}).get('chunk_size', 0)
        
    print(f"\n📊 Current Configuration:")
    print(f"   Chunking mode: {split_by}")
    print(f"   Chunk size: {chunk_size}")
    
    if split_by == "ast":
        print("   Status: 🚀 AST chunking ENABLED")
        print("   Benefits: Semantic code understanding, function/class boundaries preserved")
    else:
        print("   Status: 📝 Traditional text chunking")
        print("   Note: Consider enabling AST chunking for better code understanding")

def main():
    if len(sys.argv) < 2:
        print("Usage: python enable_ast.py [enable|disable|status]")
        print("\nCommands:")
        print("  enable  - Enable AST-based chunking")
        print("  disable - Disable AST chunking (restore text chunking)")
        print("  status  - Show current chunking status")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "enable":
        enable_ast_chunking()
    elif command == "disable":
        disable_ast_chunking()
    elif command == "status":
        check_status()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()