# frontend/Dockerfile
# Build stage
FROM node:20-alpine3.22 AS builder
WORKDIR /app

# Accept build argument
ARG SERVER_BASE_URL=http://backend:8001
ENV SERVER_BASE_URL=${SERVER_BASE_URL}

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Runtime stage
FROM node:20-alpine3.22
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
