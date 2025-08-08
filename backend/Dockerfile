# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY backend/api/requirements.txt ./api/
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache -r api/requirements.txt

# Copy source
COPY backend/api/ ./api/

ENV PATH="/opt/venv/bin:$PATH"
ENV PORT=8001

# A health-check endpoint should be implemented in FastAPI
EXPOSE 8001
CMD ["sh", "-c", "uvicorn api.api:app --host 0.0.0.0 --port ${PORT}"]