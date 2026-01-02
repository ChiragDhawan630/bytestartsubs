# =============================================================================
# ByteStart Subscription Platform - Production Dockerfile
# =============================================================================
# Multi-stage build for optimized production image
# Compatible with: Coolify, aaPanel, Docker Compose, Kubernetes
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Install production dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# -----------------------------------------------------------------------------
# Stage 2: Production image
# -----------------------------------------------------------------------------
FROM node:22-alpine

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bytestart -u 1001

WORKDIR /app

# Copy dependencies from builder stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY --chown=bytestart:nodejs . .

# Switch to non-root user
USER bytestart

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Start the application
CMD ["node", "server.js"]
