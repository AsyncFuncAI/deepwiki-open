#!/bin/bash

# Claude Run Deployment Script for DeepWiki
set -e

PROJECT_ID="srpdev-7b1d3"
SERVICE_NAME="deepwiki-open"

echo "🚀 Deploying DeepWiki to Claude Run..."
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"

# Check if claude-run CLI is installed
if ! command -v claude-run &> /dev/null; then
    echo "❌ claude-run CLI not found. Please install it first:"
    echo "npm install -g @anthropic-ai/claude-run"
    exit 1
fi

# Set the project context
echo "📋 Setting project context..."
claude-run project set $PROJECT_ID

# Deploy the service with environment variables
echo "🔧 Deploying service with environment variables..."
claude-run deploy \
  --name $SERVICE_NAME \
  --dockerfile Dockerfile.claude-run \
  --port 8001 \
  --port 3000 \
  --env OPENAI_API_KEY=sk-82HhpCHH06eCY_nutInQ-A \
  --env OPENAI_BASE_URL=https://litellm.vllm.yesy.dev \
  --env PORT=8001 \
  --env NODE_ENV=production \
  --env SERVER_BASE_URL=http://localhost:8001 \
  --env NEXT_PUBLIC_SERVER_BASE_URL=http://localhost:8001 \
  --env LOG_LEVEL=INFO \
  --env LOG_FILE_PATH=api/logs/application.log \
  --memory 6Gi \
  --cpu 2 \
  --wait

echo "✅ Deployment completed!"
echo ""
echo "🔗 Service URLs:"
claude-run service list --project $PROJECT_ID | grep $SERVICE_NAME

echo ""
echo "📊 To check service status:"
echo "claude-run service status $SERVICE_NAME --project $PROJECT_ID"
echo ""
echo "📝 To view logs:"
echo "claude-run service logs $SERVICE_NAME --project $PROJECT_ID" 