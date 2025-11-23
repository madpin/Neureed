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
git add dokploy.json Dockerfile.dokploy .dockerignore .dokploy .railpackignore .nixpacks.json
git commit -m "fix: force Dockerfile build and disable Railpack auto-detection"
git push origin dev
```

### 2. **CRITICAL**: Configure Build Type in Dokploy UI

Dokploy is **ignoring** the `dokploy.json` file and auto-detecting Railpack. You MUST manually configure it in the UI:

1. Go to your Dokploy dashboard: https://dokploy.madpin.dev
2. Click on your NeuReed application
3. Go to **Settings** or **Build Configuration**
4. Look for **Build Type** or **Source Type** dropdown
5. Select **"Dockerfile"** (NOT "Railpack" or "Auto")
6. In the Dockerfile path field, enter: `Dockerfile.dokploy`
7. **Save** the configuration
8. Trigger a new deployment

### 3. Verify Dockerfile Build

After configuring, watch the build logs. You should see:
- ✅ "Building with Dockerfile" (NOT "Building with Railpack")
- ✅ Multi-stage build starting
- ✅ No Railpack detection messages

If you still see "Preparing Railpack build plan...", the configuration didn't save - repeat step 2.

### 4. Alternative: Use Pre-built Images (RECOMMENDED)

If Dockerfile builds still fail or take too long, use the GitHub Actions workflow instead:

**This is the BEST solution for Dokploy** - it's what the DOKPLOY_SETUP_GUIDE.md recommends:

1. Update `dokploy.json`:
   ```json
   {
     "buildType": "docker",
     "dockerImage": "ghcr.io/madpin/neureed:latest"
   }
   ```

2. In Dokploy UI, change Source Type to **"Docker"**:
   - Source Type: `Docker`
   - Docker Image: `ghcr.io/madpin/neureed:latest`
   - Pull Policy: `Always`

3. GitHub Actions will build the image and push to GHCR
4. Dokploy only pulls and runs the pre-built image (fast and reliable!)

**Benefits:**
- ✅ Builds happen on GitHub's infrastructure (no memory issues)
- ✅ Much faster deployments (just pull, don't build)
- ✅ Multi-architecture support (AMD64 + ARM64)
- ✅ Zero downtime with health checks

See [DOKPLOY_SETUP_GUIDE.md](./DOKPLOY_SETUP_GUIDE.md) for complete setup.

### 5. If You Must Build on Dokploy

**Option A: Retry with Forced Configuration**
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
- ✅ `.dockerignore` - Reduces build context size
- ✅ `.dokploy` - Forces Dockerfile build type
- ✅ `.railpackignore` - Disables Railpack auto-detection
- ✅ `.nixpacks.json` - Disables Nixpacks auto-detection

All changes are backward compatible - your original `Dockerfile` remains unchanged for other deployment scenarios.

## Why Railpack Keeps Running

Dokploy uses **auto-detection** by default:
1. Sees `package.json` + `.nvmrc` → assumes Node.js project
2. Uses Railpack (their Node.js builder) automatically
3. **Ignores** `dokploy.json` unless you configure it in the UI

The files we created (`.railpackignore`, `.dokploy`, `.nixpacks.json`) attempt to disable this, but **the UI configuration is the most reliable way** to force Dockerfile builds.

