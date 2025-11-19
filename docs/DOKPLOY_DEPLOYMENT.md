# Dokploy Deployment Guide

## Overview
This guide covers deploying NeuReed to Dokploy with optimized build configuration to handle large dependencies like `@xenova/transformers`.

## Changes Made

### 1. Updated `.npmrc`
- Increased fetch timeout to 15 minutes (900000ms)
- Increased retry attempts to 10
- Limited concurrent connections to 5 (prevents overwhelming the network)
- Disabled prefer-offline to ensure fresh downloads
- Explicitly set npm registry

### 2. Updated `nixpacks.toml`
- Extended timeout configurations
- Added environment variables for build optimization
- Simplified install command with better retry logic

### 3. Added `Dockerfile`
Multi-stage Docker build for better control:
- **deps stage**: Installs dependencies with extended timeouts
- **builder stage**: Generates Prisma client and builds Next.js
- **runner stage**: Minimal production image with only necessary files

### 4. Updated `next.config.ts`
- Added `output: 'standalone'` for optimal Docker builds

## Deployment Options

### Option 1: Using Nixpacks (Recommended to try first)

1. **Commit and push changes:**
```bash
git add .
git commit -m "fix: optimize build configuration for deployment"
git push origin main
```

2. **In Dokploy:**
   - Go to your application settings
   - Ensure "Build Type" is set to "Nixpacks"
   - Increase build timeout if available (to at least 30 minutes)
   - Trigger a new deployment

### Option 2: Using Docker (If Nixpacks continues to fail)

1. **Commit and push changes** (same as above)

2. **In Dokploy:**
   - Go to your application settings
   - Change "Build Type" to "Dockerfile"
   - Ensure it points to `/Dockerfile` (or just `Dockerfile`)
   - Set build timeout to at least 30 minutes
   - Trigger a new deployment

## Environment Variables Required

Ensure these are set in Dokploy:

### Required
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
```

### Optional but Recommended
```env
# OpenAI (for embeddings and summaries)
OPENAI_API_KEY=sk-...

# Redis (for caching)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Admin credentials
ADMIN_EMAIL=admin@example.com
```

## Troubleshooting

### Build Still Times Out

If the build still times out with npm install:

1. **Increase server resources temporarily**
   - During build, npm install of `@xenova/transformers` downloads ~500MB
   - Minimum 2GB RAM and good network connection recommended

2. **Pre-build the image locally and push to registry**
   ```bash
   # Build locally
   docker build -t your-registry/neureed:latest .
   
   # Push to registry (Docker Hub, GitHub Container Registry, etc.)
   docker push your-registry/neureed:latest
   
   # In Dokploy: Use "Image" deployment type instead
   ```

3. **Split the dependencies**
   - Consider creating a base image with heavy dependencies pre-installed
   - Then only install application-specific packages

### Nixpacks Not Picking Up Configuration

If Dokploy/Nixpacks ignores `nixpacks.toml`:
- Switch to Docker build method (Option 2 above)
- Dockerfile gives you full control over the build process

### Build Succeeds But App Won't Start

1. **Check environment variables are set correctly**
2. **Verify DATABASE_URL is accessible from the container**
3. **Check logs in Dokploy console**
4. **Ensure Prisma migrations have run:**
   ```bash
   # In Dokploy, add a pre-start command or run manually:
   npx prisma migrate deploy
   ```

### Memory Issues During Build

If the build fails with memory errors:
- The `NODE_OPTIONS=--max-old-space-size=4096` is already set
- Increase server RAM temporarily for the build
- Consider building locally and pushing to registry

## Health Checks

The Dockerfile includes a health check that monitors `/api/health`. Ensure this endpoint:
1. Exists in your application
2. Returns 200 OK when the app is healthy
3. Can be accessed without authentication

## Post-Deployment Steps

1. **Run database migrations:**
   ```bash
   npx prisma migrate deploy
   ```

2. **Verify the app is running:**
   - Check the health endpoint: `https://your-domain.com/api/health`
   - Check application logs in Dokploy

3. **Set up scheduled jobs** (if using cron):
   - Configure cron jobs in Dokploy or use external service like cron-job.org

## Performance Optimization

After successful deployment:

1. **Enable Redis caching** (if not already)
2. **Configure CDN** for static assets
3. **Set up database connection pooling**
4. **Monitor resource usage** and adjust as needed

## Build Time Expectations

- **First build**: 15-25 minutes (due to downloading transformers package)
- **Subsequent builds**: 5-10 minutes (with proper caching)

## Support

If issues persist:
1. Check Dokploy logs for detailed error messages
2. Verify network connectivity from build server
3. Consider temporarily disabling `@xenova/transformers` if not immediately needed
4. Reach out to Dokploy support if platform-specific issues occur

