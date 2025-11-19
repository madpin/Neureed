# Deployment Guide for NeuReed

## Dokploy Deployment

This project is configured to deploy on Dokploy using Nixpacks.

### Prerequisites

1. **Database**: PostgreSQL instance with connection URL
2. **Redis**: Redis instance for caching (optional but recommended)
3. **Environment Variables**: All required environment variables configured in Dokploy

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"
AUTH_TRUST_HOST="true"  # Required for production to trust the host

# GitHub OAuth (if using)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# OpenAI (if using AI features)
OPENAI_API_KEY="your-openai-api-key"

# Redis (optional)
REDIS_URL="redis://host:port"

# Node Environment
NODE_ENV="production"
```

### Deployment Configuration

The project uses `nixpacks.toml` for Dokploy deployment configuration:

- **Setup Phase**: Installs Node.js 20 and OpenSSL
- **Install Phase**: Installs npm dependencies with extended timeouts
- **Build Phase**: Generates Prisma Client and builds Next.js
- **Start Phase**: Starts the production server

### Troubleshooting

#### 1. npm Install Timeouts

If you see errors like "Exit handler never called!" or npm timeouts:

**Solution**: The `nixpacks.toml` is configured to:
- Clean npm cache before install
- Use extended timeouts (900 seconds)
- Retry up to 10 times
- Use fewer concurrent connections (maxsockets=5)
- Remove package-lock.json and use `npm install` instead of `npm ci`

#### 2. Prisma Client Generation Fails

If Prisma generate fails with "Command failed with exit code 217":

**Causes**:
- npm dependencies not fully installed
- Version mismatch between `prisma` and `@prisma/client`
- Memory issues during generation

**Solutions**:
- Ensure both `prisma` and `@prisma/client` are at the same version
- Increase memory allocation: `NODE_OPTIONS="--max-old-space-size=4096"`
- Check that all dependencies installed successfully

#### 3. Build Failures

If the build fails after dependencies are installed:

**Check**:
- All environment variables are set correctly
- `SKIP_ENV_VALIDATION=1` is set if you're validating env vars at build time
- Database is accessible from the build environment (if running migrations)

#### 4. Database Connection Issues

If the app can't connect to the database:

**Solutions**:
- Verify `DATABASE_URL` is correct and accessible
- Check if database requires SSL: add `?sslmode=require` to the URL
- Ensure database user has proper permissions
- Run migrations: `npx prisma migrate deploy`

### Post-Deployment Steps

1. **Run Database Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

2. **Verify Health Check**:
   ```bash
   curl https://your-domain.com/api/health
   ```

3. **Check Logs**:
   - Monitor Dokploy logs for any runtime errors
   - Check for database connection issues
   - Verify all services are running

### Performance Optimization

1. **Memory Settings**: Adjust `NODE_OPTIONS` if needed
2. **Database Pooling**: Configure in `DATABASE_URL` with `?connection_limit=10`
3. **Redis Caching**: Enable Redis for better performance
4. **CDN**: Use a CDN for static assets

### Rollback Procedure

If deployment fails:

1. **Dokploy UI**: Use the rollback feature to previous version
2. **Manual**: Redeploy the previous commit
3. **Database**: If migrations were run, you may need to rollback schema changes

### Alternative: Docker Deployment

If Nixpacks continues to have issues, you can use the provided `Dockerfile`:

1. In Dokploy, change build method from "Nixpacks" to "Dockerfile"
2. Ensure the `Dockerfile` is in the root directory
3. Redeploy

The Dockerfile uses multi-stage builds for optimal image size and includes:
- Alpine Linux base for smaller images
- Proper dependency caching
- Non-root user for security
- Health checks

### Monitoring

After deployment, monitor:

1. **Application Logs**: Check for errors and warnings
2. **Database Performance**: Monitor query performance
3. **Memory Usage**: Ensure no memory leaks
4. **Response Times**: Monitor API endpoint performance

### Support

For issues:
1. Check Dokploy logs
2. Review this troubleshooting guide
3. Check GitHub issues
4. Contact the development team

