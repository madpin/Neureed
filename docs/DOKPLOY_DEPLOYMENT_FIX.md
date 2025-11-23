# Dokploy Deployment Fix

## Problem

The deployment was failing with Railpack's `npm ci` command crashing after 11+ minutes with:
```
npm error Exit handler never called!
npm error This is an error with npm itself.
```

This error typically indicates:
1. **Memory exhaustion** - Large dependencies like @xenova/transformers (WASM files) and Playwright
2. **Network timeouts** - Slow or unstable connection during package downloads
3. **Hanging postinstall scripts** - Some packages may have problematic installation hooks

## Solution

### 1. Created Dokploy-Specific Dockerfile

Created `Dockerfile.dokploy` with the following optimizations:

#### Memory Optimizations
- `NODE_OPTIONS="--max-old-space-size=2048"` - Limits memory to 2GB to prevent OOM
- `NPM_CONFIG_MAXSOCKETS=3` - Reduces concurrent downloads (less memory pressure)
- `--omit=dev` - Skips dev dependencies during install
- Multi-stage build with proper caching layers

#### Network & Reliability Optimizations
- `NPM_CONFIG_FETCH_TIMEOUT=900000` - 15-minute timeout for slow networks
- `NPM_CONFIG_FETCH_RETRIES=10` - More retry attempts
- `--mount=type=cache,target=/root/.npm` - Uses Docker layer caching for npm
- Fallback to `npm install` if `npm ci` fails

#### Build Performance
- Skips Playwright browser downloads (`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`)
- Uses `--prefer-offline` for faster installs
- Copies only necessary files (reduces build context size)

### 2. Added .dockerignore

Created `.dockerignore` to exclude unnecessary files from build context:
- Documentation, tests, scripts
- IDE and OS files
- Git history
- Cache directories

This reduces the build context from ~62MB to much less, speeding up the initial file transfer.

### 3. Updated dokploy.json

Changed configuration to:
```json
{
  "buildType": "dockerfile",
  "dockerfile": "Dockerfile.dokploy",
  "buildPath": ".",
  "dockerBuildArgs": {
    "BUILDKIT_INLINE_CACHE": "1"
  }
}
```

This forces Dokploy to use the custom Dockerfile instead of Railpack's auto-detection.

## What Changed vs Original Dockerfile

The main differences from your original `Dockerfile`:

1. **Memory limits** - Added `NODE_OPTIONS` to cap memory usage
2. **Reduced concurrency** - Changed `MAXSOCKETS` from 5 to 3
3. **Dev dependencies** - Uses `--omit=dev` instead of installing all deps
4. **Docker cache mounts** - Uses BuildKit cache for npm to speed up rebuilds
5. **Better error handling** - Fallback strategy if `npm ci` fails

## Next Steps

### 1. Commit and Push Changes

```bash
git add dokploy.json Dockerfile.dokploy .dockerignore
git commit -m "fix: optimize Dockerfile for Dokploy deployment with memory constraints"
git push origin dev
```

### 2. Redeploy in Dokploy

After pushing:
1. Go to your Dokploy dashboard
2. Trigger a new deployment
3. The build should now use `Dockerfile.dokploy` instead of Railpack

### 3. If It Still Fails

If you still see Railpack being used:

**Option A: Configure in Dokploy UI**
1. Go to your service settings in Dokploy
2. Look for "Build Type" or "Build Configuration"
3. Manually select "Dockerfile" and specify `Dockerfile.dokploy`

**Option B: Use Original Dockerfile**
If Dokploy respects the Dockerfile setting but still has issues, you can update `dokploy.json` to use the original:
```json
{
  "buildType": "dockerfile",
  "dockerfile": "Dockerfile"
}
```

Then update the original `Dockerfile` with the memory optimizations from `Dockerfile.dokploy`.

**Option C: Increase Memory in Dokploy**
If your Dokploy instance has low memory:
1. Check the server resources (should have at least 2GB available during build)
2. Consider increasing memory allocation for the build process
3. Some hosting providers allow you to temporarily boost resources during builds

## Monitoring the Build

Watch for these improvements:
- ✅ Build should complete `npm ci` in < 5 minutes
- ✅ Memory usage should stay under 2GB
- ✅ No "Exit handler never called" errors
- ✅ Successful Docker image creation

## Alternative: If Dockerfile Approach Doesn't Work

If Dokploy insists on using Railpack, you can try:

1. **Simplify package.json** temporarily:
   - Move `playwright` from `optionalDependencies` to a separate optional install
   - Consider using a lighter embedding model during build

2. **Pre-build approach**:
   - Build the Docker image locally
   - Push to a container registry
   - Deploy the pre-built image in Dokploy

3. **Contact Dokploy support**:
   - This might be a bug in how Dokploy detects build types
   - They may need to respect the `dokploy.json` configuration better

## Files Created/Modified

- ✅ `dokploy.json` - Updated to use Dockerfile.dokploy
- ✅ `Dockerfile.dokploy` - New optimized Dockerfile for Dokploy
- ✅ `.dockerignore` - New file to reduce build context size

All changes are backward compatible - your original `Dockerfile` remains unchanged for other deployment scenarios.

