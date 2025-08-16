# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/api/requirements.txt ./api/
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache -r api/requirements.txt

# Copy source
COPY backend/api/ ./api/

ENV PATH="/opt/venv/bin:$PATH"
ENV PORT=8001

# Health check endpoint is implemented at /health
EXPOSE 8001
CMD ["python", "-m", "api.main"]