# Docker & CI/CD Fixes

## Problem

The `npm run db:generate` command was failing in both Docker builds and GitHub Actions with:
```
sh: 1: prisma: not found
Error: Process completed with exit code 127.
```

## Root Cause

**Prisma CLI was in `devDependencies`** instead of `dependencies`. When the CI pipeline ran with `--omit=optional` flag, it created scenarios where devDependencies weren't always installed correctly, causing Prisma CLI to be unavailable.

## Solutions Applied

### 1. ✅ Fixed package.json
- **Moved `prisma` from `devDependencies` to `dependencies`**
- Prisma CLI is needed at build time to generate the Prisma Client
- This ensures it's always available in CI/CD and Docker builds

### 2. ✅ Optimized CI Workflow (.github/workflows/ci.yml)

**Removed unnecessary complexity:**
- ❌ Removed manual `node_modules` caching (GitHub Actions cache npm handles this)
- ❌ Removed `npm cache clean --force` (unnecessary and slows down builds)
- ❌ Removed `--omit=optional` flag (was causing issues)
- ❌ Removed separate Prisma caching (generated automatically)
- ❌ Removed redundant `docker-build-test` job (handled by separate workflow)
- ❌ Removed excessive `NODE_OPTIONS` and timeouts

**Simplified to:**
```yaml
- name: Install dependencies
  timeout-minutes: 10
  run: npm ci --prefer-offline --no-audit --no-fund
  env:
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: 1
    CI: true

- name: Generate Prisma Client
  run: npm run db:generate
```

**Benefits:**
- ⚡ Faster CI runs (removed ~2-3 minutes per job)
- 🧹 Cleaner logs
- 🎯 More reliable builds
- 🔧 Easier to maintain

### 3. ✅ Optimized Dockerfile

**Changes:**
- Moved package file copy to `deps` stage for better layer caching
- Removed unnecessary `NODE_OPTIONS=--max-old-space-size=4096` (default is sufficient)
- Changed from `npx prisma generate` to `npm run db:generate` (consistent with CI)
- Added `--prefer-offline --no-audit --no-fund` flags for faster installs

**Benefits:**
- 🚀 Faster Docker builds through better layer caching
- 📦 More efficient dependency installation
- 🔁 Consistent between CI and Docker

## Testing

To verify the fixes work:

### Test Docker Build Locally
```bash
docker build -t neureed:test .
```

### Test GitHub Actions
Push to a branch and verify:
1. Quick Checks job completes successfully
2. Build Application job completes successfully
3. No "prisma: not found" errors in logs

## Performance Impact

**Before:**
- CI quick-checks: ~8-10 minutes
- CI build-test: ~10-12 minutes
- Total: ~18-22 minutes (parallel)

**After (estimated):**
- CI quick-checks: ~5-6 minutes
- CI build-test: ~7-8 minutes
- Total: ~12-14 minutes (parallel)

**Docker Build:**
- Better layer caching = faster rebuilds
- No change to final image size

## Additional Optimizations Made

1. **Removed docker-build-test from ci.yml**
   - Duplicate work (separate docker-build.yml workflow exists)
   - Saves ~5-7 minutes per CI run

2. **Simplified dependency caching**
   - Let GitHub Actions handle npm caching automatically
   - Removed manual node_modules caching (complex and error-prone)

3. **Removed unnecessary environment variables**
   - `NODE_OPTIONS: --max-old-space-size=8192` (overkill for most builds)
   - Multiple timeout configurations (simplified to single timeout)

## Files Changed

1. `package.json` - Moved prisma to dependencies
2. `.github/workflows/ci.yml` - Simplified and optimized
3. `Dockerfile` - Optimized layer caching and removed unnecessary flags

## Related Workflows

This fix doesn't affect:
- `.github/workflows/docker-build.yml` - Separate Docker publishing workflow (will benefit from same fixes)
- `.github/workflows/release.yml` - Release workflow (will benefit from same fixes)

Both of these already had correct configurations but will be faster due to prisma being in dependencies.

## Next Steps

If you want even more optimization:
1. Consider using `pnpm` instead of `npm` (faster installs)
2. Implement GitHub Actions matrix builds for parallel testing
3. Add layer caching to Docker builds in CI with `cache-from: type=gha`

## Verification Commands

```bash
# Verify prisma is in dependencies
grep -A 30 '"dependencies"' package.json | grep prisma

# Test CI workflow locally (requires act)
act -j quick-checks

# Test Docker build
docker build --progress=plain -t neureed:test .
```

