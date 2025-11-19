# CI npm Install Fix

## Problem

The GitHub Actions CI was failing with the following errors:

1. **npm ci timeout**: `npm ci` was hanging for 40+ minutes and eventually failing with "Exit handler never called!" error
2. **Prisma version mismatch**: `npx prisma generate` was trying to install Prisma 6.19.0 instead of using the locked version 6.1.0, leading to exit code 217 (out of memory)

## Root Causes

1. **Insufficient memory allocation**: Node.js was running out of memory during package installation
2. **Prisma CLI version mismatch**: Using `npx prisma` was attempting to install the latest version instead of using the version from `package-lock.json`
3. **No timeout protection**: Jobs could hang indefinitely
4. **Inefficient npm configuration**: Retry settings were too aggressive

## Solutions Applied

### 1. Increased Memory Allocation

**Changed:**
```yaml
NODE_OPTIONS: --max-old-space-size=4096
```

**To:**
```yaml
NODE_OPTIONS: --max-old-space-size=8192
```

This doubles the Node.js heap size from 4GB to 8GB, preventing out-of-memory errors during large dependency installations.

### 2. Added Timeout Protection

**Added to all install and generate steps:**
```yaml
- name: Install dependencies
  timeout-minutes: 15
  run: npm ci --prefer-offline --no-audit --no-fund --omit=optional
```

This ensures that if npm hangs, the job will fail fast (15 minutes) instead of running for 1+ hours.

### 3. Fixed Prisma Client Generation

**Changed from:**
```yaml
- name: Generate Prisma Client
  run: npm run db:generate
```

**To:**
```yaml
- name: Generate Prisma Client
  timeout-minutes: 5
  run: npm run db:generate
  env:
    NODE_OPTIONS: --max-old-space-size=8192
```

And removed the problematic validation command that was using `npx prisma generate` indirectly.

### 4. Improved Prisma Cache Key

**Changed from:**
```yaml
key: ${{ runner.os }}-prisma-${{ hashFiles('prisma/schema.prisma') }}
```

**To:**
```yaml
key: ${{ runner.os }}-prisma-${{ hashFiles('prisma/schema.prisma') }}-${{ hashFiles('package-lock.json') }}
```

This ensures Prisma cache is invalidated when the Prisma version changes in `package-lock.json`.

### 5. Added npm Cache Cleaning

**Added before npm install:**
```yaml
- name: Clean npm cache
  if: steps.cache-node-modules.outputs.cache-hit != 'true'
  run: npm cache clean --force
```

This prevents corrupted cache from causing issues.

### 6. Optimized .npmrc Configuration

**Updated `.npmrc` with:**
- Increased fetch timeout from 5 minutes to 10 minutes
- Reduced fetch retries from 5 to 3 (faster failure)
- Added `optional=true` to prevent optional dependencies from failing builds
- Added `maxsockets=10` for better parallel downloads

## Testing

After applying these changes:

1. Push to a branch and verify the CI runs successfully
2. Check that `npm ci` completes within 5-10 minutes
3. Verify Prisma client generates without trying to install new versions
4. Confirm all jobs complete within reasonable timeframes

## Expected Improvements

- ✅ **Faster CI runs**: npm install should complete in 5-10 minutes instead of 40+ minutes
- ✅ **No more hangs**: Timeout protection ensures fast failure
- ✅ **No memory errors**: 8GB heap should be sufficient for all operations
- ✅ **Consistent Prisma versions**: Uses locked versions from package-lock.json
- ✅ **Better caching**: Improved cache keys prevent stale cache issues

## Monitoring

Watch the next few CI runs to ensure:
- [ ] npm ci completes in < 10 minutes
- [ ] Prisma generate completes in < 2 minutes
- [ ] No exit code 217 errors
- [ ] No "Exit handler never called!" errors
- [ ] Cache hit rate improves over time

## Rollback Plan

If issues persist, you can:

1. Revert the `.npmrc` changes
2. Try removing `--prefer-offline` flag
3. Disable node_modules caching temporarily
4. Use `npm install` instead of `npm ci` (not recommended for CI)

## Related Files

- `.github/workflows/ci.yml` - Main CI workflow
- `.npmrc` - npm configuration
- `package.json` - Package versions
- `package-lock.json` - Locked dependency versions

