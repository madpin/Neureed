# Dokploy Production Setup Guide

This guide follows the [Dokploy production best practices](https://docs.dokploy.com/docs/core/applications/going-production) for deploying NeuReed.

## Overview

Instead of building on your Dokploy server (which can freeze or timeout), we use GitHub Actions to:
1. ✅ Build Docker images in GitHub's infrastructure
2. ✅ Push multi-architecture images (AMD64 + ARM64) to GitHub Container Registry
3. ✅ Automatically trigger deployment on Dokploy
4. ✅ Enable zero-downtime deployments with health checks and rollbacks

## Prerequisites

- Dokploy instance running at `https://dokploy.madpin.dev`
- GitHub repository with Actions enabled
- Docker registry access (GitHub Container Registry is pre-configured)

## Step 1: Configure Dokploy Application

### 1.1 Create Application in Dokploy

1. Log in to https://dokploy.madpin.dev
2. Create a new application
3. **Important**: Set Source Type to **"Docker"** (not Git)
4. Configure the following:

```
Source Type: Docker
Docker Image: ghcr.io/madpin/neureed:latest
Pull Policy: Always
```

### 1.2 Set Environment Variables

Add these environment variables in Dokploy:

**Required:**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/neureed
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
GITHUB_CLIENT_ID=<your-github-oauth-client-id>
GITHUB_CLIENT_SECRET=<your-github-oauth-client-secret>
OPENAI_API_KEY=<your-openai-api-key>
NODE_ENV=production
```

**Optional but Recommended:**
```bash
REDIS_URL=redis://redis:6379
```

### 1.3 Configure Domain

1. Go to the **Domains** tab
2. Click the dice icon to generate a domain
3. Set port to **3000**
4. Or configure your custom domain

### 1.4 Configure Health Checks & Rollbacks

Go to **Advanced** → **Cluster Settings** → **Swarm Settings**

**Health Check Configuration:**
```json
{
  "Test": [
    "CMD",
    "curl",
    "-f",
    "http://localhost:3000/api/health"
  ],
  "Interval": 30000000000,
  "Timeout": 10000000000,
  "StartPeriod": 30000000000,
  "Retries": 3
}
```

**Update Config (for Zero Downtime & Rollbacks):**
```json
{
  "Parallelism": 1,
  "Delay": 10000000000,
  "FailureAction": "rollback",
  "Order": "start-first"
}
```

This configuration ensures:
- ✅ Health checks every 30 seconds
- ✅ Automatic rollback if health check fails
- ✅ Zero downtime deployments (new container starts before old one stops)
- ✅ Graceful handling of failed deployments

## Step 2: Configure GitHub Secrets

### 2.1 Generate Dokploy API Key

1. Go to https://dokploy.madpin.dev
2. Navigate to **Settings** → **API Keys**
3. Click **Generate API Key**
4. Copy the generated key (you won't see it again!)

### 2.2 Get Application ID

1. Go to your application in Dokploy
2. The Application ID is in the URL: `https://dokploy.madpin.dev/dashboard/project/{project-id}/services/application/{application-id}`
3. Or check the application settings page

### 2.3 Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

```
Name: DOKPLOY_API_KEY
Value: <your-api-key-from-step-2.1>

Name: DOKPLOY_APP_ID
Value: <your-application-id-from-step-2.2>
```

## Step 3: Deploy

### 3.1 Initial Deployment

1. Push your code to the `main` branch:
   ```bash
   git push origin main
   ```

2. GitHub Actions will automatically:
   - ✅ Build the Docker image for AMD64 and ARM64
   - ✅ Push to `ghcr.io/madpin/neureed:latest`
   - ✅ Trigger deployment on Dokploy

3. Monitor the deployment:
   - GitHub Actions: Check the workflow run in the **Actions** tab
   - Dokploy: Watch the deployment logs in your application

### 3.2 Verify Deployment

1. Check the health endpoint:
   ```bash
   curl https://your-domain.com/api/health
   ```

   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-11-19T...",
     "database": {
       "connected": true,
       "message": "Database connection successful"
     },
     "pgvector": {
       "enabled": true,
       "message": "pgvector extension is enabled"
     }
   }
   ```

2. Check application logs in Dokploy

3. Test the application functionality

## Step 4: Run Database Migrations

After the first successful deployment:

1. Access the container terminal in Dokploy, or SSH to your server:
   ```bash
   docker exec -it <container-name> sh
   ```

2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

3. Verify the database schema is up to date

## Architecture Overview

```
┌─────────────────┐
│  GitHub Push    │
│   to main       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│     GitHub Actions Workflow         │
│  1. Build Docker (AMD64 + ARM64)    │
│  2. Push to ghcr.io                 │
│  3. Trigger Dokploy API             │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         Dokploy Server              │
│  1. Pull latest image               │
│  2. Start new container             │
│  3. Health check                    │
│  4. Stop old container              │
│  5. Rollback if unhealthy           │
└─────────────────────────────────────┘
```

## Benefits of This Setup

### 1. **No Server Resource Issues**
- Building happens on GitHub's infrastructure
- Your Dokploy server only pulls and runs pre-built images
- No more timeouts or server freezes during builds

### 2. **Multi-Architecture Support**
- Images built for both AMD64 and ARM64
- Works on Graviton (ARM) processors
- Works on standard x86 servers

### 3. **Zero Downtime Deployments**
- New container starts before old one stops
- Health checks ensure stability
- Automatic rollback on failures

### 4. **Automated Deployments**
- Push to main → automatic deployment
- No manual intervention needed
- Consistent deployment process

### 5. **Fast Deployments**
- Pulling pre-built images is much faster than building
- Docker layer caching speeds up builds
- Parallel builds for multiple architectures

## Troubleshooting

### Build Fails on GitHub Actions

1. Check the workflow logs in GitHub Actions
2. Verify the Dockerfile is valid
3. Ensure all dependencies are in package.json
4. Check for any syntax errors

### Deployment Not Triggered

1. Verify secrets are set correctly:
   - `DOKPLOY_API_KEY`
   - `DOKPLOY_APP_ID`
2. Check GitHub Actions logs for API call errors
3. Verify the API key has the correct permissions
4. Ensure the application ID is correct

### Container Fails Health Check

1. Check application logs in Dokploy
2. Verify database connection:
   ```bash
   curl http://localhost:3000/api/health
   ```
3. Ensure all environment variables are set
4. Check that PostgreSQL has pgvector extension installed
5. Verify database migrations have been run

### Rollback Occurs

1. Check the health check logs
2. Review application logs for errors
3. Verify the new image works locally:
   ```bash
   docker pull ghcr.io/madpin/neureed:latest
   docker run -p 3000:3000 <env-vars> ghcr.io/madpin/neureed:latest
   ```
4. Fix the issue and push a new commit

### Image Pull Fails

1. Verify the image exists:
   ```bash
   docker pull ghcr.io/madpin/neureed:latest
   ```
2. Check if the repository is public or if authentication is needed
3. Verify network connectivity from Dokploy server

## Manual Deployment

If you need to deploy manually:

1. Go to your application in Dokploy
2. Click **Deploy**
3. Dokploy will pull the latest image and deploy

## Monitoring

### GitHub Actions
- Monitor workflow runs: https://github.com/madpin/Neureed/actions
- Check build status badges in README
- Review build summaries after each run

### Dokploy
- Application logs: Real-time logs in the application page
- Deployment history: View past deployments
- Metrics: CPU, memory, network usage

### Application
- Health endpoint: `https://your-domain.com/api/health`
- Application logs: Available in Dokploy dashboard
- Database: Use Prisma Studio or connect directly

## Updating the Application

1. Make changes to your code
2. Commit and push to main:
   ```bash
   git add .
   git commit -m "feat: your changes"
   git push origin main
   ```
3. GitHub Actions automatically builds and deploys
4. Monitor the deployment in Dokploy
5. Verify the changes are live

## Rollback to Previous Version

### Option 1: Using Dokploy (Automatic)
If health checks fail, Dokploy automatically rolls back to the previous version.

### Option 2: Manual Rollback
1. Find the previous working image tag:
   ```bash
   ghcr.io/madpin/neureed:main-abc1234
   ```
2. Update the Docker image in Dokploy to the specific tag
3. Click **Deploy**

### Option 3: Git Revert
1. Revert the problematic commit:
   ```bash
   git revert HEAD
   git push origin main
   ```
2. GitHub Actions will build and deploy the reverted version

## Best Practices

1. **Always test locally** before pushing to main
2. **Use feature branches** for development
3. **Monitor deployments** after pushing
4. **Keep secrets secure** - never commit them
5. **Review logs** regularly for issues
6. **Update dependencies** periodically
7. **Backup database** before major changes
8. **Test health endpoint** after deployment

## Additional Resources

- [Dokploy Documentation](https://docs.dokploy.com)
- [Dokploy Production Guide](https://docs.dokploy.com/docs/core/applications/going-production)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Multi-Platform Builds](https://docs.docker.com/build/building/multi-platform/)

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review [DOKPLOY_FIX.md](./DOKPLOY_FIX.md) for build issues
3. Check [DEPLOYMENT_FIX_SUMMARY.md](./DEPLOYMENT_FIX_SUMMARY.md)
4. Review GitHub Actions logs
5. Check Dokploy application logs

---

**Last Updated**: 2025-11-19  
**Dokploy Version**: Compatible with latest  
**GitHub Actions**: Configured and tested

