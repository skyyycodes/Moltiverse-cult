# Dockerfile for AgentCult Backend
# Builds and deploys the autonomous AI agent backend service

FROM node:20-alpine

# Install dependencies needed for node-gyp and native modules
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY agent/package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy agent source code and data
COPY agent/src ./src
COPY agent/data ./data
COPY agent/tsconfig.json ./

# Install tsx for running TypeScript ESM modules
RUN npm install tsx

# Expose API port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start agent backend using tsx (since we use ESM)
CMD ["npx", "tsx", "src/index.ts"]
