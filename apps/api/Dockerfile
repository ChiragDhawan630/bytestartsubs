# =============================================================================
# ByteStart API - Production Dockerfile (NestJS Backend)
# =============================================================================
# Multi-stage build for optimized NestJS production image
# Compatible with: Docker Compose, Kubernetes, Coolify, aaPanel
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

# Copy root package files for workspace setup
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: Build application
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source code
COPY apps/api ./apps/api
COPY prisma ./apps/api/prisma
COPY .env .env

# Generate Prisma Client
RUN cd apps/api && npx prisma generate

# Build the application
RUN cd apps/api && npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production image
# -----------------------------------------------------------------------------
FROM node:22-alpine

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bytestart -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=bytestart:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=bytestart:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=bytestart:nodejs /app/apps/api/package.json ./package.json

# Switch to non-root user
USER bytestart

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Start the application
CMD ["node", "dist/main.js"]
