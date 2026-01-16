#!/bin/bash
# Example environment variables for DeepWiki Enterprise Configuration

# Enterprise OpenAI LLM Configuration
export ENTERPRISE_OPENAI_BASE_URL="https://your-enterprise-api.company.com"
export ENTERPRISE_OPENAI_TOKEN="your-enterprise-auth-token"

# Enterprise BGE Embedding Configuration
export ENTERPRISE_BGE_BASE_URL="https://your-embedding-api.company.com"
export ENTERPRISE_BGE_TOKEN="your-embedding-auth-token"

# Set the embedder type to use enterprise BGE
export DEEPWIKI_EMBEDDER_TYPE="enterprise_bge"

# Optional: Point to custom config directory
# export DEEPWIKI_CONFIG_DIR="/path/to/your/config"

echo "Enterprise environment variables configured!"
echo "LLM Provider: Enterprise OpenAI (gpt-oss-130b)"
echo "Embedding Provider: Enterprise BGE (bge-m3)"
