#!/usr/bin/env python3
"""
Test configuration loading logic, particularly API keys placeholder replacement and comma-separated handling
"""

import os
import sys
from pathlib import Path

# Add project root to Python path
# __file__ is in tests/unit/, so we need to go up 2 levels to reach project root
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
print(f"project_root: {project_root}, __file__: {__file__}")
sys.path.insert(0, project_root)

# Load environment variables from .env file
from dotenv import load_dotenv

env_path = Path(project_root) / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print(f"✅ Loaded environment variables from: {env_path}")
else:
    print(f"⚠️  Warning: .env file not found at {env_path}")
    print("   Please create a .env file with OPENAI_API_KEYS and OPENAI_BASE_URL")
    sys.exit(1)

from api.config import load_api_keys_config, configs

print("=" * 60)
print("Test configuration loading logic")
print("=" * 60)

# Verify required environment variables are loaded
required_env_vars = ['OPENAI_API_KEYS', 'OPENAI_BASE_URL']
missing_vars = [var for var in required_env_vars if not os.environ.get(var)]

if missing_vars:
    print(f"\n❌ Error: Missing required environment variables: {', '.join(missing_vars)}")
    print("   Please add them to your .env file")
    sys.exit(1)

print(f"\n✅ Environment variables loaded:")
print(f"   OPENAI_API_KEYS: {len(os.environ.get('OPENAI_API_KEYS', '').split(','))} key(s)")
print(f"   OPENAI_BASE_URL: {os.environ.get('OPENAI_BASE_URL')}")

# Test 1: Directly load API keys configuration
print("\n1️⃣ Test load_api_keys_config():")
print("-" * 60)
api_keys = load_api_keys_config()

print(f"\nLoaded providers: {list(api_keys.keys())}")

for provider, keys in api_keys.items():
    if keys:
        print(f"\n{provider}:")
        print(f"  Total {len(keys)} key(s)")
        for i, key in enumerate(keys, 1):
            masked_key = f"{key[:8]}...{key[-4:]}" if len(key) > 12 else key
            print(f"  [{i}] {masked_key}")

# Test 2: Check api_keys in configs
print("\n" + "=" * 60)
print("2️⃣ Test configs['api_keys']:")
print("-" * 60)

if 'api_keys' in configs:
    openai_keys = configs['api_keys'].get('openai', [])
    print(f"\nOpenAI keys count: {len(openai_keys)}")
    
    if len(openai_keys) > 4:
        print("✅ Success! Correctly loaded at least 5 OpenAI API keys")
    else:
        print(f"❌ Failure! Expected at least 5 keys, actual {len(openai_keys)} keys")
else:
    print("❌ 'api_keys' not found in configs")

# Test 3: Verify LLMService can correctly use these keys
print("\n" + "=" * 60)
print("3️⃣ Test LLMService loading:")
print("-" * 60)

try:
    from api.llm import LLMService
    
    llm_service = LLMService(default_provider="openai")
    status = llm_service.get_api_keys_status("openai")
    
    print(f"\nOpenAI keys count in LLMService: {status['total_keys']}")
    print(f"API Keys (masked):")
    for key in status['api_keys']:
        print(f"  - {key}")
    
    if status['total_keys'] > 4:
        print("\n✅ Success! LLMService correctly loaded at least 5 OpenAI API keys")
        print("✅ Load balancing functionality is ready")
    else:
        print(f"\n❌ Failure! Expected at least 5 keys, actual {status['total_keys']} keys")
        
except Exception as e:
    print(f"❌ Error loading LLMService: {e}")
    import traceback
    traceback.print_exc()

# Test 4: Test real LLM calls and load balancing
print("\n" + "=" * 60)
print("4️⃣ Test LLM Service Call & Load Balancing:")
print("-" * 60)

try:
    print("\n🚀 Sending 10 parallel requests to test load balancing...")
    print("   Question: 奶油扇贝意大利面的做法")
    print("")
    
    # Reset usage stats before testing
    llm_service.reset_key_usage_stats("openai")
    
    # Batch invoke same prompt 10 times
    results = llm_service.batch_invoke_same_prompt(
        prompt="请简要介绍奶油扇贝意大利面的做法（200字以内）",
        count=10,
        provider="openai",
        model="gpt-4.1",  # Use a faster/cheaper model for testing
        temperature=0.7,
        max_tokens=200,
        max_concurrent_per_key=2,  # Limit concurrent per key to better see load balancing
        max_total_concurrent=5
    )
    
    # Check results
    successful_count = sum(1 for r in results if r and "error" not in r and "content" in r)
    failed_count = len(results) - successful_count
    
    print(f"\n📊 Request Results:")
    print(f"   Total: {len(results)}")
    print(f"   ✅ Successful: {successful_count}")
    print(f"   ❌ Failed: {failed_count}")
    
    # Get and display API key usage statistics
    print(f"\n📈 API Key Usage Statistics (Load Balancing):")
    print("-" * 60)
    status = llm_service.get_api_keys_status("openai")
    
    usage_data = status.get("key_usage_count", {})
    total_usage = sum(usage_data.values())
    
    # Sort by usage count
    sorted_usage = sorted(usage_data.items(), key=lambda x: x[1], reverse=True)
    
    for i, (key_masked, count) in enumerate(sorted_usage, 1):
        percentage = (count / total_usage * 100) if total_usage > 0 else 0
        bar = "█" * int(count * 2)  # Visual bar
        print(f"   Key {i}: {key_masked}")
        print(f"          使用次数: {count:2d} ({percentage:5.1f}%) {bar}")
    
    print(f"\n   Total API Calls: {total_usage}")
    
    # Check if load balancing is working
    if total_usage > 0:
        max_usage = max(usage_data.values())
        min_usage = min(usage_data.values())
        balance_ratio = min_usage / max_usage if max_usage > 0 else 0
        
        print(f"   Max usage per key: {max_usage}")
        print(f"   Min usage per key: {min_usage}")
        print(f"   Balance ratio: {balance_ratio:.2f} (1.0 = perfect balance)")
        
        if balance_ratio >= 0.5:
            print("   ✅ Load balancing is working well!")
        else:
            print("   ⚠️  Load balancing could be improved")
    
    # Display formatted responses
    print(f"\n📝 Response Content:")
    print("=" * 60)
    
    for i, result in enumerate(results, 1):
        print(f"\n【Response {i}】")
        print("-" * 60)
        
        if result and "error" not in result:
            response_text = result.get("content", "")
            if response_text:
                # Clean up response text
                response_text = response_text.strip()
                print(f"{response_text}")
            else:
                print("⚠️  Empty response")
        else:
            error_msg = result.get("error", "Unknown error") if result else "No result"
            print(f"❌ Error: {error_msg}")
    
    print("\n" + "=" * 60)
    
    if successful_count == 10:
        print("✅ Test 4 PASSED: All 10 requests successful!")
    elif successful_count > 0:
        print(f"⚠️  Test 4 PARTIAL: {successful_count}/10 requests successful")
    else:
        print("❌ Test 4 FAILED: No successful requests")
        
except Exception as e:
    print(f"❌ Error during LLM service call test: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("All Tests Completed")
print("=" * 60)
