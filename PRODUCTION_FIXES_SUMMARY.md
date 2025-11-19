# Production Fixes Summary

## Issues Fixed

### 1. ✅ Validation Error: `categoryStates` Field

**Problem:**
```
API Error Details: [
  {
    code: 'invalid_type',
    expected: 'object',
    received: 'null',
    path: [ 'categoryStates' ],
    message: 'Expected object, received null'
  }
]
```

**Root Cause:**
- When saving theme preferences, the entire preferences object (including `categoryStates: null` from database) was sent to API
- Zod validation schema expected an object but received `null`
- This only appeared in production due to stricter validation

**Fix Applied:**
Updated `/app/api/user/preferences/route.ts`:
```typescript
// Before
categoryStates: z.record(z.boolean()).optional(),

// After
categoryStates: z.record(z.boolean()).nullable().optional(),
```

Now accepts: object, `null`, or `undefined` ✅

---

### 2. ✅ Related Articles Error Logging

**Problem:**
```
[ERROR] Failed to find related articles {"error":{"error":{},"articleId":"..."}}
```
Empty error objects made debugging impossible.

**Fix Applied:**
Improved error logging in two files:

**`/app/api/articles/[id]/related/route.ts`:**
```typescript
logger.error("Failed to find related articles", { 
  error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
  articleId: id 
});
```

**`/src/lib/services/semantic-search-service.ts`:**
```typescript
logger.error("Failed to find related articles", { 
  error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
  articleId 
});
```

Now logs full error details including stack traces ✅

---

### 3. ✅ Standalone Output Start Command

**Problem:**
Your logs showed:
```
⚠ "next start" does not work with "output: standalone" configuration.
Use "node .next/standalone/server.js" instead.
```

**Root Cause:**
- `next.config.ts` has `output: 'standalone'` for optimized Docker builds
- `npm run start` doesn't work with standalone mode
- Need to use `node server.js` directly from `.next/standalone/`

**Fix Applied:**
Updated `/nixpacks.toml`:

**Before:**
```toml
[start]
cmd = "pwd && ls -la && ls -la prisma/ 2>/dev/null || echo 'No prisma in current dir' && ls -la .next/standalone/prisma/ 2>/dev/null || echo 'No prisma in standalone' && npx prisma migrate deploy && npm run start"
```

**After:**
```toml
[start]
cmd = "cd .next/standalone && npx prisma migrate deploy --schema=./prisma/schema.prisma && node server.js"
```

Changes:
1. ✅ Navigate to `.next/standalone/` directory
2. ✅ Run migrations with explicit schema path
3. ✅ Use `node server.js` instead of `npm run start`
4. ✅ Removed debug commands (pwd, ls) for cleaner startup

---

### 4. ✅ Prisma Client in Standalone Build

**Problem:**
Standalone builds need Prisma Client copied to the standalone directory.

**Fix Applied:**
Updated `/nixpacks.toml` build phase:

```toml
[phases.build]
cmds = [
  # ... existing commands ...
  "echo '📦 Copying Prisma Client to standalone...'",
  "mkdir -p .next/standalone/node_modules/.prisma",
  "cp -r node_modules/.prisma/client .next/standalone/node_modules/.prisma/",
  "echo '✅ Prisma files copied'"
]
```

Ensures Prisma Client is available in the standalone bundle ✅

---

### 5. ✅ Cron Jobs Instrumentation Hook

**Problem:**
Cron jobs would **NOT start** in production because the instrumentation hook was not enabled.

**Root Cause:**
- `instrumentation.ts` exists and initializes cron jobs
- But `next.config.ts` was missing `instrumentationHook: true`
- Without this flag, Next.js doesn't call `instrumentation.ts`
- Cron jobs would never initialize

**Fix Applied:**
Updated `/next.config.ts`:

```typescript
experimental: {
  // Enable instrumentation hook for cron jobs
  instrumentationHook: true,
  // ... other settings
}
```

Now cron jobs will start automatically on server startup ✅

---

## Files Modified

1. ✅ `/app/api/user/preferences/route.ts` - Fixed validation schema
2. ✅ `/app/api/articles/[id]/related/route.ts` - Improved error logging
3. ✅ `/src/lib/services/semantic-search-service.ts` - Improved error logging
4. ✅ `/nixpacks.toml` - Fixed start command and Prisma Client copying
5. ✅ `/next.config.ts` - Enabled instrumentation hook for cron jobs
6. ✅ `/docs/PRODUCTION_VS_DEV_DIFFERENCES.md` - Comprehensive guide (new)
7. ✅ `/docs/PRODUCTION_CRON_AND_EMBEDDINGS.md` - Cron & embeddings guide (new)

---

## Testing Checklist

After deploying these changes, test:

### Authentication & User Features
- [ ] Sign in with OAuth provider
- [ ] Theme selection and saving
- [ ] Font size changes
- [ ] Other preference updates

### Article Features
- [ ] View articles
- [ ] Related articles section (check for proper error messages if fails)
- [ ] Article search
- [ ] Semantic search

### Feed Management
- [ ] Add new feed
- [ ] Refresh feeds
- [ ] Delete feeds
- [ ] Category management

### Admin Features (if applicable)
- [ ] Admin dashboard access
- [ ] User management
- [ ] System settings

---

## Environment Variables Checklist

Ensure these are set in Dokploy:

### Required
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_SECRET` - Min 32 characters
- [ ] `NEXTAUTH_URL` - Your actual domain (e.g., `https://neureed.yourdomain.com`)
- [ ] `REDIS_URL` - Redis connection string
- [ ] `NODE_ENV=production`

### OAuth (at least one)
- [ ] `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET`
- [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`

### Security
- [ ] `ENCRYPTION_SECRET` - **NOT** the default value from env.ts

### Optional but Recommended
- [ ] `OPENAI_API_KEY` - For AI features
- [ ] `EMBEDDING_PROVIDER` - "openai" or "local"
- [ ] `ENABLE_CRON_JOBS` - "true" for automated feed refresh
- [ ] `REDIS_PASSWORD` - If Redis requires authentication

---

## Deployment Steps

1. **Commit Changes:**
   ```bash
   git add .
   git commit -m "fix: Production issues - validation, logging, and standalone mode"
   git push origin main
   ```

2. **Verify Environment Variables in Dokploy:**
   - Check all required variables are set
   - Ensure `NODE_ENV=production`
   - Verify `NEXTAUTH_URL` matches your domain

3. **Deploy:**
   - Dokploy will automatically rebuild on push
   - Or manually trigger rebuild in Dokploy UI

4. **Monitor Logs:**
   ```bash
   # Watch deployment logs
   docker logs -f <container-name>
   ```

5. **Test Features:**
   - Go through testing checklist above
   - Pay special attention to theme saving and related articles

---

## Expected Behavior After Fixes

### Theme Saving
- ✅ Should save without validation errors
- ✅ `categoryStates` can be `null`, object, or undefined
- ✅ No more "Expected object, received null" errors

### Related Articles
- ✅ If articles have embeddings, related articles appear
- ✅ If no embeddings, clear error message in logs with full details
- ✅ No more empty error objects

### Application Startup
- ✅ Migrations run automatically on startup
- ✅ Server starts using correct standalone mode
- ✅ No warnings about "next start" incompatibility

### Performance
- ✅ Faster startup (standalone mode is optimized)
- ✅ Smaller Docker image
- ✅ Better resource usage

---

## Monitoring

After deployment, monitor for:

1. **Startup Logs:**
   ```
   🔄 Running database migrations...
   ✅ Migrations complete
   [Instrumentation] register() called
   [Instrumentation] Running in Node.js runtime, initializing scheduler...
   ✓ Ready in XXXXms
   ```

2. **Error Logs:**
   - Should see detailed error messages (not empty objects)
   - Stack traces should be present for debugging

3. **Performance:**
   - Response times for API calls
   - Database connection pool usage
   - Redis connection status

---

## Rollback Plan

If issues occur after deployment:

1. **Quick Rollback:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Or revert to previous Dokploy deployment** in the UI

3. **Check logs for specific errors:**
   ```bash
   docker logs <container-name> | grep ERROR
   ```

---

## Additional Notes

### Why These Issues Only Appeared in Production

1. **Stricter Validation:**
   - Production builds validate all data paths
   - Development mode is more permissive

2. **Different Build Process:**
   - Production: Full build with optimization
   - Development: On-demand compilation

3. **Standalone Mode:**
   - Only used in production Docker builds
   - Development uses standard Next.js server

4. **Environment Differences:**
   - Production: Environment variables baked in at build time
   - Development: Loaded from `.env.local` at runtime

### Best Practices Applied

1. ✅ **Proper Error Logging:** Full error details with stack traces
2. ✅ **Flexible Validation:** Accept `null` where database allows it
3. ✅ **Correct Build Output:** Using standalone mode properly
4. ✅ **Automated Migrations:** Run on every deployment
5. ✅ **Clean Start Command:** No debug clutter in production

---

## Next Steps

1. **Deploy these changes** to production
2. **Test thoroughly** using the checklist above
3. **Monitor logs** for the first few hours
4. **Document any new issues** that arise
5. **Consider adding:**
   - Health check endpoint monitoring
   - Error tracking service (e.g., Sentry)
   - Performance monitoring (e.g., New Relic)

---

## Support

If you encounter issues after deployment:

1. Check `/docs/PRODUCTION_VS_DEV_DIFFERENCES.md` for detailed explanations
2. Review Docker logs for specific error messages
3. Verify all environment variables are set correctly
4. Test database and Redis connectivity
5. Check that migrations completed successfully

---

**Date:** November 19, 2025
**Status:** Ready for deployment ✅

