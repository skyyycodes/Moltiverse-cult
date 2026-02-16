# Multi-stage Dockerfile for AgentCult Monorepo
# Supports building agent backend and frontend services

# Stage 1: Base Node.js image
FROM node:20-alpine AS base

# Install dependencies needed for node-gyp and native modules
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy workspace configuration
COPY package*.json ./
COPY agent/package*.json ./agent/
COPY frontend/package*.json ./frontend/
COPY contracts/package*.json ./contracts/

# Stage 2: Dependencies
FROM base AS deps

# Install all dependencies including devDependencies for building
RUN npm ci

# Stage 3: Build Agent Backend
FROM base AS agent-builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/agent/node_modules ./agent/node_modules

# Copy agent source code
COPY agent ./agent
COPY tsconfig.json ./

# Build TypeScript
WORKDIR /app/agent
RUN npm run build

# Stage 4: Agent Production
FROM node:20-alpine AS agent

WORKDIR /app

# Copy only production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/agent/node_modules ./agent/node_modules

# Copy built files and runtime necessities
COPY --from=agent-builder /app/agent/dist ./agent/dist
COPY agent/package*.json ./agent/
COPY agent/data ./agent/data
COPY agent/tsconfig.json ./agent/

# Set working directory to agent
WORKDIR /app/agent

# Expose API port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start agent backend using tsx (since we use ESM)
CMD ["npx", "tsx", "src/index.ts"]

# Stage 5: Build Frontend
FROM base AS frontend-builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

# Copy frontend source code
COPY frontend ./frontend

# Build Next.js app
WORKDIR /app/frontend
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Stage 6: Frontend Production
FROM node:20-alpine AS frontend

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built Next.js app
COPY --from=frontend-builder /app/frontend/public ./public
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

USER nextjs

# Expose frontend port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start Next.js server
CMD ["node", "server.js"]
