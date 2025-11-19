# Dokploy Deployment Fix

## Issue
The Nixpacks build was failing during `npm ci` and `npx prisma generate` steps due to:
1. npm hanging or timing out during dependency installation
2. Missing node_modules causing Prisma generate to fail
3. Insufficient timeout configurations

## Changes Made

### 1. Created `dokploy.json`
This file tells Dokploy to use the custom Dockerfile instead of Nixpacks:
```json
{
  "buildType": "dockerfile",
  "dockerfile": "Dockerfile"
}
```

### 2. Updated `Dockerfile`
- Added `NPM_CONFIG_LEGACY_PEER_DEPS=true` to handle peer dependency issues
- Added `CI=true` environment variable
- Changed npm install command to include fallback: `npm ci || npm install`
- Improved error logging with `--loglevel=error`

### 3. Updated `.npmrc`
- Added `prefer-online=false` to prevent npm from hanging
- Added custom cache location: `cache=/tmp/.npm`
- Kept aggressive timeout settings (900s timeout, 10 retries)

### 4. Updated `nixpacks.toml` (backup if Dokploy still uses Nixpacks)
- Configured npm settings before running install
- Added fallback from `npm ci` to `npm install`
- Increased timeout and retry settings

## Deployment Steps

### Option 1: Using Custom Dockerfile (Recommended)
1. Commit and push these changes
2. In Dokploy, ensure the build type is set to "Dockerfile"
3. Redeploy the application

### Option 2: Force Dockerfile in Dokploy UI
If `dokploy.json` is not recognized:
1. Go to your application settings in Dokploy
2. Under "Build Settings", select "Dockerfile" as the build type
3. Specify "Dockerfile" as the dockerfile path
4. Save and redeploy

### Option 3: If Nixpacks is Required
If you must use Nixpacks:
1. The updated `nixpacks.toml` should handle the issues
2. Ensure sufficient memory is allocated (at least 2GB)
3. Consider increasing build timeout in Dokploy settings

## Environment Variables Required

Ensure these environment variables are set in Dokploy:

### Database
- `DATABASE_URL` - PostgreSQL connection string with pgvector extension

### Authentication
- `NEXTAUTH_URL` - Your application URL (e.g., https://neureed.yourdomain.com)
- `NEXTAUTH_SECRET` - Random secret for NextAuth (generate with: `openssl rand -base64 32`)
- `GITHUB_CLIENT_ID` - GitHub OAuth App Client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth App Client Secret

### AI/Embeddings
- `OPENAI_API_KEY` - OpenAI API key for embeddings and summaries

### Optional
- `REDIS_URL` - Redis connection string for caching (optional but recommended)
- `NODE_ENV=production`
- `SKIP_ENV_VALIDATION=1` (for build time only)

## Troubleshooting

### If npm install still hangs:
1. Check available memory in Dokploy (needs at least 2GB)
2. Try increasing the build timeout
3. Check network connectivity to npm registry
4. Consider using a npm registry mirror if in a restricted network

### If Prisma generate fails:
1. Ensure `@prisma/client` is in dependencies (not devDependencies)
2. Check that the database URL is accessible during build
3. Verify the Prisma schema is valid: `npx prisma validate`

### If build succeeds but app crashes:
1. Check that all environment variables are set
2. Verify database connection and that pgvector extension is installed
3. Check logs for specific error messages
4. Ensure the database migrations have been run

## Post-Deployment

After successful deployment:

1. **Run Database Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

2. **Verify Health Endpoint**:
   ```bash
   curl https://your-domain.com/api/health
   ```

3. **Check Application Logs** in Dokploy dashboard

4. **Test Authentication** by logging in with GitHub

## Additional Notes

- The Dockerfile uses multi-stage builds to optimize image size
- The standalone output mode is enabled in `next.config.ts`
- Health checks are configured to run every 30 seconds
- The application runs as a non-root user (nextjs:nodejs) for security

## If All Else Fails

If you continue to experience issues:

1. Try building locally with Docker:
   ```bash
   docker build -t neureed .
   docker run -p 3000:3000 neureed
   ```

2. If local build works, the issue is likely with Dokploy's environment
3. Check Dokploy's resource limits and network configuration
4. Consider using a different deployment platform (Vercel, Railway, Render)

