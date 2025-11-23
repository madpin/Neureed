# Multi-stage build for optimal image size
FROM node:24-slim AS base

# Install dependencies for native modules (openssl for Prisma)
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install dependencies stage
FROM base AS deps

# Copy package files
COPY package.json package-lock.json .npmrc ./

# Set npm configurations for better timeout handling
ENV NPM_CONFIG_FETCH_TIMEOUT=900000 \
    NPM_CONFIG_FETCH_RETRIES=10 \
    NPM_CONFIG_MAXSOCKETS=5 \
    NPM_CONFIG_LEGACY_PEER_DEPS=true \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=1 \
    CI=true

# Install dependencies (includes prisma in dependencies now)
RUN npm ci --prefer-offline --no-audit --no-fund 2>&1 || npm install --loglevel=error

# Build stage
FROM base AS builder

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Set environment variables for build
ENV SKIP_ENV_VALIDATION=1 \
    NODE_ENV=production

# Generate Prisma Client
RUN npm run db:generate

# Build the application
RUN npm run build

# Production stage
FROM base AS runner

# Set to production environment with WASM-only transformers backend
ENV NODE_ENV=production \
    PORT=3000 \
    TRANSFORMERS_BACKEND=wasm \
    ONNXRUNTIME_EXECUTION_PROVIDERS=wasm \
    USE_ONNX_WASM=1 \
    TRANSFORMERS_CACHE=./.cache/transformers

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/prisma/migrations ./prisma/migrations

# Copy entrypoint script
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set entrypoint and command
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]

