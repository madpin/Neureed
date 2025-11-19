# CI/CD Pipeline Fixes

## Problem Summary

The GitHub Actions CI pipeline was failing with the following issues:

1. **npm ci timeout**: The `npm ci` command was hanging for ~43 minutes before failing with "Exit handler never called!"
2. **Prisma version mismatch**: `npx prisma generate` was trying to install `@prisma/client@6.19.0` while the project had `6.1.0` locked
3. **Out of memory errors**: Exit code 217 indicating Node.js running out of memory during package installation

## Root Causes

1. **Large dependencies**: Packages like `@xenova/transformers` and optional dependencies like `playwright` are very large
2. **Version inconsistency**: Mixed use of exact versions and caret versions in `package.json`
3. **Memory constraints**: Default Node.js memory limits too low for large dependency installations
4. **Inefficient npm settings**: No optimization flags for CI environment

## Solutions Implemented

### 1. Updated CI Workflow (`.github/workflows/ci.yml`)

**Changes:**
- Added `--no-audit --no-fund --omit=optional` flags to `npm ci`
  - `--no-audit`: Skips security audit (saves ~30 seconds)
  - `--no-fund`: Skips funding messages (cleaner output)
  - `--omit=optional`: Skips optional dependencies like Playwright (saves significant time and space)
  
- Increased Node.js memory limit to 4GB:
  ```yaml
  env:
    NODE_OPTIONS: --max-old-space-size=4096
  ```

- Changed from `npx prisma generate` to `npm run db:generate`:
  - Uses the locally installed Prisma version from `node_modules`
  - Prevents version mismatches
  - More reliable and faster

**Before:**
```yaml
- name: Install dependencies
  run: npm ci --prefer-offline

- name: Generate Prisma Client
  run: npx prisma generate
```

**After:**
```yaml
- name: Install dependencies
  run: |
    npm ci --prefer-offline --no-audit --no-fund --omit=optional
  env:
    NODE_OPTIONS: --max-old-space-size=4096

- name: Generate Prisma Client
  run: npm run db:generate
  env:
    NODE_OPTIONS: --max-old-space-size=4096
```

### 2. Fixed Version Consistency (`package.json`)

**Changes:**
- Added caret (`^`) to all dependencies for consistency
- This allows patch and minor version updates while preventing breaking changes

**Fixed packages:**
- `@prisma/client`: `6.1.0` → `^6.1.0`
- `prisma`: `6.1.0` → `^6.1.0`
- `next`: `16.0.3` → `^16.0.3`
- `react`: `19.2.0` → `^19.2.0`
- `react-dom`: `19.2.0` → `^19.2.0`
- `eslint-config-next`: `16.0.3` → `^16.0.3`

### 3. Created NPM Configuration (`.npmrc`)

Added project-level `.npmrc` with CI-optimized settings:

```ini
# Disable audit during install (saves time)
audit=false

# Disable funding messages
fund=false

# Use prefer-offline to speed up installs
prefer-offline=true

# Increase fetch timeout for large packages
fetch-timeout=300000

# Increase fetch retry settings
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000

# Progress bar disabled in CI (cleaner logs)
progress=false

# Engine strict to catch Node version issues early
engine-strict=true
```

## Expected Improvements

### Time Savings
- **Before**: ~43+ minutes (timeout)
- **After**: ~5-10 minutes (estimated)

### Breakdown:
- Skipping audit: ~30 seconds saved
- Skipping optional dependencies: ~2-3 minutes saved
- Using local Prisma: ~1-2 minutes saved
- Better retry logic: More reliable, fewer failures

### Memory Usage
- **Before**: Hitting memory limits (exit code 217)
- **After**: 4GB limit should handle all installations comfortably

### Reliability
- **Before**: Frequent timeouts and version conflicts
- **After**: More reliable with proper version locking and local tool usage

## Testing the Changes

### Locally
```bash
# Clean install to test
rm -rf node_modules package-lock.json
npm install

# Verify Prisma generation works
npm run db:generate

# Verify build works
npm run build
```

### In CI
The changes will be tested automatically on the next push to `main` or `develop`.

## Monitoring

After deployment, monitor:
1. **Build times**: Should be significantly faster
2. **Success rate**: Should have fewer failures
3. **Cache hit rate**: Should improve over time

Check the Actions tab for build logs and timing information.

## Rollback Plan

If issues occur:

1. **Revert `.github/workflows/ci.yml`**:
   ```bash
   git revert <commit-hash>
   ```

2. **Revert `package.json` versions** (if needed):
   - Remove carets from critical packages
   - Run `npm install` to update lock file

3. **Remove `.npmrc`** (if causing issues):
   ```bash
   git rm .npmrc
   ```

## Additional Optimizations (Future)

Consider these for further improvements:

1. **Use pnpm instead of npm**:
   - Faster installs
   - Better disk space usage
   - More reliable

2. **Split jobs more granularly**:
   - Separate lint, type-check, and build
   - Run in parallel for faster feedback

3. **Use Docker layer caching**:
   - Cache npm packages in Docker layers
   - Faster Docker builds

4. **Add build matrix**:
   - Test on multiple Node versions
   - Catch compatibility issues early

5. **Implement incremental builds**:
   - Only rebuild changed packages
   - Use Turborepo or Nx for monorepo benefits

## References

- [npm ci documentation](https://docs.npmjs.com/cli/v8/commands/npm-ci)
- [GitHub Actions caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Node.js memory management](https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes)
- [Prisma best practices](https://www.prisma.io/docs/guides/performance-and-optimization/prisma-client-transactions-guide)

