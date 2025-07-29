# syntax=docker/dockerfile:1-labs

# Build argument for custom certificates directory
ARG CUSTOM_CERT_DIR="certs"

FROM node:20-alpine3.22 AS node_base

FROM node_base AS node_deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

FROM node_base AS node_builder
WORKDIR /app
COPY --from=node_deps /app/node_modules ./node_modules
# Copy only necessary files for Next.js build
COPY package.json package-lock.json next.config.ts tsconfig.json tailwind.config.js postcss.config.mjs ./
COPY src/ ./src/
COPY public/ ./public/
# Increase Node.js memory limit for build and disable telemetry
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1
RUN NODE_ENV=production npm run build

FROM python:3.11-slim AS py_deps
WORKDIR /app
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY api/requirements.txt ./api/
RUN pip install --no-cache -r api/requirements.txt

# Use Python 3.11 as final image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install Node.js and npm
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    git \
    ca-certificates \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Update certificates if custom ones were provided and copied successfully
RUN if [ -n "${CUSTOM_CERT_DIR}" ]; then \
        mkdir -p /usr/local/share/ca-certificates && \
        if [ -d "${CUSTOM_CERT_DIR}" ]; then \
            cp -r ${CUSTOM_CERT_DIR}/* /usr/local/share/ca-certificates/ 2>/dev/null || true; \
            update-ca-certificates; \
            echo "Custom certificates installed successfully."; \
        else \
            echo "Warning: ${CUSTOM_CERT_DIR} not found. Skipping certificate installation."; \
        fi \
    fi

ENV PATH="/opt/venv/bin:$PATH"

# Copy Python dependencies
COPY --from=py_deps /opt/venv /opt/venv
COPY api/ ./api/

# Copy Node app
COPY --from=node_builder /app/public ./public
COPY --from=node_builder /app/.next/standalone ./
COPY --from=node_builder /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE ${PORT:-8001} 3000

# Create a script to run both backend and frontend
RUN echo '#!/bin/bash\n\
# Load environment variables from .env file if it exists\n\
if [ -f .env ]; then\n\
  export $(grep -v "^#" .env | xargs -r)\n\
fi\n\
\n\
# Check for required environment variables based on provider configuration\n\
has_azure_openai=false\n\
has_other_provider=false\n\
\n\
# Check if Azure OpenAI is configured\n\
if [ -n "$AZURE_OPENAI_API_KEY" ] && [ -n "$AZURE_OPENAI_ENDPOINT" ]; then\n\
  has_azure_openai=true\n\
  echo "✓ Azure OpenAI configuration detected"\n\
fi\n\
\n\
# Check if other providers are configured\n\
if [ -n "$GOOGLE_API_KEY" ] || [ -n "$OPENAI_API_KEY" ] || [ -n "$OPENROUTER_API_KEY" ]; then\n\
  has_other_provider=true\n\
fi\n\
\n\
# Validate configuration\n\
if [ "$has_azure_openai" = false ] && [ "$has_other_provider" = false ]; then\n\
  echo "⚠️  Warning: No AI provider configured!"\n\
  echo "Please configure at least one of the following:"\n\
  echo "  • Azure OpenAI: AZURE_OPENAI_API_KEY + AZURE_OPENAI_ENDPOINT"\n\
  echo "  • Google Gemini: GOOGLE_API_KEY"\n\
  echo "  • OpenAI: OPENAI_API_KEY"\n\
  echo "  • OpenRouter: OPENROUTER_API_KEY"\n\
  echo ""\n\
fi\n\
\n\
if [ "$has_azure_openai" = true ]; then\n\
  echo "🚀 Starting DeepWiki with Azure OpenAI integration..."\n\
else\n\
  echo "🚀 Starting DeepWiki with standard providers..."\n\
fi\n\
\n\
# Start the API server in the background with the configured port\n\
python -m api.main --port ${PORT:-8001} &\n\
PORT=3000 HOSTNAME=0.0.0.0 node server.js &\n\
wait -n\n\
exit $?' > /app/start.sh && chmod +x /app/start.sh

# Set environment variables
ENV PORT=8001
ENV NODE_ENV=production
ENV SERVER_BASE_URL=http://localhost:${PORT:-8001}

# Supported environment variables (set via .env file or docker run -e):
# API Providers:
#   GOOGLE_API_KEY - Google Gemini API key
#   OPENAI_API_KEY - OpenAI API key  
#   OPENROUTER_API_KEY - OpenRouter API key
# Azure OpenAI (auto-detected when configured):
#   AZURE_OPENAI_API_KEY - Azure OpenAI API key for text generation
#   AZURE_OPENAI_ENDPOINT - Azure OpenAI endpoint for text generation
#   AZURE_OPENAI_DEPLOYMENT - Azure deployment name for text generation
#   AZURE_OPENAI_VERSION - Azure OpenAI API version (default: 2024-12-01-preview)
#   AZURE_OPENAI_EMBEDDING_API_KEY - Azure OpenAI API key for embeddings (optional)
#   AZURE_OPENAI_EMBEDDING_ENDPOINT - Azure OpenAI endpoint for embeddings (optional)
#   AZURE_OPENAI_EMBEDDING_DEPLOYMENT - Azure deployment name for embeddings (optional) 
#   AZURE_OPENAI_EMBEDDING_VERSION - Azure OpenAI API version for embeddings (optional)
# Other services:
#   OLLAMA_HOST - Ollama server host (default: http://localhost:11434)
#   OPENAI_BASE_URL - Custom OpenAI API endpoint
# Configuration:
#   LOG_LEVEL - Logging level (default: INFO)
#   LOG_FILE_PATH - Log file path (default: api/logs/application.log)
#   DEEPWIKI_CONFIG_DIR - Custom config directory path

# Create empty .env file (will be overridden if one exists at runtime)
RUN touch .env

# Command to run the application
CMD ["/app/start.sh"]
