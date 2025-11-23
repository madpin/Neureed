# Deployment Guide for NeuReed

## Overview
This guide covers deploying NeuReed to production environments using Docker, with specific focus on Dokploy and Railway deployments.

## Build Optimizations

### npm Configuration (`.npmrc`)
The project includes optimized npm settings to handle large dependencies:

- **Increased timeout**: 600 seconds for fetching packages
- **Retry logic**: 5 retries with exponential backoff
- **Reduced logging**: Error-level only to reduce build noise
- **Disabled progress bars**: Reduces output and memory overhead

### Node.js Memory Configuration
The build requires at least **4GB of memory** due to:
- `@xenova/transformers` (ML/AI package)
- Next.js build process
- Prisma client generation

The `NODE_OPTIONS="--max-old-space-size=4096"` can be set as an environment variable in your deployment platform.

## Technology Stack

- **Node.js**: 24.x (LTS)
- **Deployment**: Docker-based (Dockerfile included)
- **Runtime**: Next.js standalone server

## Dokploy/Railway Configuration

### Required Environment Variables

#### Database
```bash
DATABASE_URL="postgresql://user:password@host:port/database"
```

#### Authentication (NextAuth.js)
```bash
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-a-random-secret-key"
```

Generate secret with:
```bash
openssl rand -base64 32
```

#### Redis (Optional but Recommended)
```bash
REDIS_URL="redis://host:port"
```

#### OpenAI (for embeddings and summaries)
```bash
OPENAI_API_KEY="your-api-key"
```

### Resource Requirements

#### Minimum Specifications
- **Memory**: 4GB RAM (8GB recommended)
- **CPU**: 2 vCPUs
- **Disk**: 10GB (for dependencies and build artifacts)

#### Build Resources
If your platform allows separate build/runtime resources:
- **Build Memory**: 4GB minimum
- **Runtime Memory**: 2GB minimum

### Dokploy Specific Settings

1. **Build Timeout**: Set to at least 15 minutes
   - npm install can take 5-10 minutes with large dependencies
   
2. **Health Check**: Configure health check endpoint
   ```
   Path: /api/health
   Port: 3000
   Initial Delay: 60 seconds
   ```

3. **Build Cache**: Enable build caching if available
   - Significantly speeds up subsequent deployments
   - Caches node_modules and .next/cache

## Deployment Steps

### 1. Prepare Environment Variables
Create a `.env.production` or set them in your deployment platform:

```bash
# Required
DATABASE_URL="..."
NEXTAUTH_URL="..."
NEXTAUTH_SECRET="..."

# Optional
REDIS_URL="..."
OPENAI_API_KEY="..."
NODE_ENV="production"
```

### 2. Database Setup

Run migrations before first deployment:
```bash
npx prisma migrate deploy
```

Or use the Dokploy "Run Command" feature to execute migrations after build.

### 3. Initial Deployment
Push to your connected GitHub repository. Dokploy will automatically:
1. Clone the repository
2. Detect Dockerfile and use Docker build
3. Install dependencies with `npm ci`
4. Generate Prisma client
5. Build Next.js application
6. Start the application with Docker entrypoint

### 4. Post-Deployment Verification

Check these endpoints:
- `GET /api/health` - Should return 200 OK
- Login page - Verify authentication works
- Add a feed - Test RSS feed parsing
- View articles - Test database connection

## Troubleshooting

### Build Failures

#### "Exit handler never called" Error
This usually indicates:
- **Insufficient memory**: Increase build memory to 4GB+
- **Timeout**: Extend build timeout to 15+ minutes
- **Network issues**: Check npm registry accessibility

**Solution**: The current `.npmrc` and `Dockerfile` are optimized to prevent this.

#### Prisma Generation Fails
```bash
Error: @prisma/client did not initialize yet
```

**Solution**: Ensure `npx prisma generate` runs before `npm run build` (already configured in `Dockerfile`).

#### Next.js Build Timeout
```bash
Error: Build exceeded maximum duration
```

**Solution**: 
- Increase build timeout
- Check for infinite loops in page components
- Verify environment variables are set correctly

### Runtime Issues

#### Database Connection Errors
```bash
Error: Can't reach database server
```

**Solutions**:
- Verify `DATABASE_URL` is correct
- Check firewall rules allow connection from deployment platform
- Ensure PostgreSQL version is 12+

#### Redis Connection Failures
The application works without Redis but will be slower:
- No caching for feed fetches
- No rate limiting
- Slower repeated queries

**Solution**: Set up Redis and configure `REDIS_URL`

#### Authentication Not Working
**Solutions**:
- Verify `NEXTAUTH_URL` matches your actual domain (including https://)
- Ensure `NEXTAUTH_SECRET` is set and persistent
- Check OAuth provider settings if using GitHub/Google auth

## Performance Optimization

### Post-Deployment

1. **Enable CDN**: Use Cloudflare or similar for static assets
2. **Database Indexing**: Indexes are created via migrations
3. **Redis Caching**: Highly recommended for production
4. **Feed Refresh Cron**: The app includes built-in cron jobs

### Monitoring

Set up monitoring for:
- `/api/health` endpoint
- Database connection pool usage
- Memory consumption (should stay under 2GB runtime)
- API response times

## Scaling

### Horizontal Scaling
- The application supports multiple instances with:
  - Shared PostgreSQL database
  - Shared Redis instance
  - Session storage in database (via NextAuth)

### Limitations
- Cron jobs run on each instance (use distributed lock if scaling)
- RSS feed fetches are not deduplicated across instances

## Security Checklist

- [ ] All environment variables are set securely (not in code)
- [ ] `NEXTAUTH_SECRET` is strong and unique
- [ ] Database uses SSL connection
- [ ] HTTPS is enforced (set `NEXTAUTH_URL` to https://)
- [ ] Rate limiting is enabled (requires Redis)
- [ ] Regular security updates via `npm audit`

## Maintenance

### Updating Dependencies
```bash
npm update
npm audit fix
git commit -am "chore: update dependencies"
git push
```

### Database Migrations
```bash
# Create migration
npx prisma migrate dev --name descriptive_name

# Deploy to production
npx prisma migrate deploy
```

### Backup Strategy
- **Database**: Regular PostgreSQL backups (daily recommended)
- **Redis**: Not critical, stores cache only
- **User data**: Backup `User`, `Feed`, `Article`, and `UserArticleInteraction` tables

## Cost Optimization

### Resource Usage
- Start with minimum specs and scale based on usage
- Monitor actual memory/CPU usage after deployment
- Consider spot instances for non-critical environments

### Third-Party Services
- **OpenAI API**: Monitor token usage, implement rate limits
- **Database**: Use connection pooling (Prisma handles this)
- **Redis**: Use minimal memory tier (128MB sufficient for small deployments)

## Support

For deployment issues:
1. Check logs in Dokploy dashboard
2. Review this guide's troubleshooting section
3. Check GitHub issues
4. Review the application logs via `docker logs <container-id>`

