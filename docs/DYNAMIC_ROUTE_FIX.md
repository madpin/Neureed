# Dynamic Route Configuration Fix

## Issue
The application was experiencing build errors with the message:
```
Error: Dynamic server usage: Route is configured with methods that cannot be statically generated.
```

Additionally, the feed validation endpoint was returning "Method Not Allowed" errors when called from the frontend.

## Root Cause
Next.js 15 attempts to statically analyze and pre-render routes at build time. Routes that use:
- Authentication (session checks)
- Database queries
- Dynamic data fetching
- Request headers/cookies

...need to be explicitly marked as dynamic using `export const dynamic = "force-dynamic";`

The API routes in this project use the `createHandler` wrapper which:
1. Checks authentication via `auth()` 
2. Accesses the database through Prisma
3. Processes dynamic request data

Without the `dynamic` export, Next.js tried to statically generate these routes, causing the build error.

## Solution
Added `export const dynamic = "force-dynamic";` to all API routes that use `createHandler`.

### Files Modified
**All 59 API route files** in `app/api/` have been updated with the dynamic export:

#### Admin Routes (16 files)
- `app/api/admin/cache/clear/route.ts`
- `app/api/admin/cache/stats/route.ts`
- `app/api/admin/cleanup/route.ts`
- `app/api/admin/cron/status/route.ts`
- `app/api/admin/cron/trigger/route.ts`
- `app/api/admin/database/reset/route.ts`
- `app/api/admin/embeddings/config/route.ts`
- `app/api/admin/embeddings/costs/route.ts`
- `app/api/admin/embeddings/route.ts`
- `app/api/admin/settings/route.ts`
- `app/api/admin/storage/postgres/maintenance/route.ts`
- `app/api/admin/storage/postgres/route.ts`
- `app/api/admin/storage/redis/maintenance/route.ts`
- `app/api/admin/storage/redis/route.ts`
- `app/api/admin/users/[userId]/route.ts`
- `app/api/admin/users/route.ts`

#### Article Routes (11 files)
- `app/api/articles/[id]/keypoints/route.ts`
- `app/api/articles/[id]/related/route.ts`
- `app/api/articles/[id]/route.ts`
- `app/api/articles/[id]/summary/route.ts`
- `app/api/articles/recent/route.ts`
- `app/api/articles/route.ts`
- `app/api/articles/search/route.ts`
- `app/api/articles/semantic-search/route.ts`
- `app/api/articles/suggestions/route.ts`
- `app/api/articles/topics/route.ts`

#### Feed Routes (6 files)
- `app/api/feeds/[id]/delete-articles/route.ts`
- `app/api/feeds/[id]/refresh/route.ts`
- `app/api/feeds/[id]/route.ts`
- `app/api/feeds/[id]/settings/route.ts`
- `app/api/feeds/[id]/test-extraction/route.ts`
- `app/api/feeds/route.ts`
- `app/api/feeds/validate/route.ts`

#### User Routes (20 files)
- `app/api/user/articles/[id]/exit/route.ts`
- `app/api/user/articles/[id]/feedback/route.ts`
- `app/api/user/articles/[id]/read/route.ts`
- `app/api/user/articles/[id]/view/route.ts`
- `app/api/user/articles/scores/route.ts`
- `app/api/user/categories/[categoryId]/feeds/route.ts`
- `app/api/user/categories/[categoryId]/route.ts`
- `app/api/user/categories/[categoryId]/settings/route.ts`
- `app/api/user/categories/reorder/route.ts`
- `app/api/user/categories/route.ts`
- `app/api/user/feedback/stats/route.ts`
- `app/api/user/feeds/[feedId]/categories/route.ts`
- `app/api/user/feeds/[feedId]/settings/route.ts`
- `app/api/user/feeds/refresh/route.ts`
- `app/api/user/feeds/route.ts`
- `app/api/user/opml/export/route.ts`
- `app/api/user/opml/import/route.ts`
- `app/api/user/patterns/reset/route.ts`
- `app/api/user/patterns/route.ts`
- `app/api/user/patterns/stats/route.ts`
- `app/api/user/preferences/route.ts`

#### Other Routes (6 files)
- `app/api/auth/[...nextauth]/route.ts`
- `app/api/health/route.ts`
- `app/api/jobs/generate-embeddings/route.ts`
- `app/api/jobs/pattern-decay/route.ts`
- `app/api/jobs/refresh-feeds/route.ts`

### Example Change
```typescript
// Before
import { createHandler } from "@/lib/api-handler";

export const POST = createHandler(
  async ({ body }) => {
    // handler logic
  }
);

// After
import { createHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const POST = createHandler(
  async ({ body }) => {
    // handler logic
  }
);
```

## Verification
After applying the fix:
1. ✅ Build completes successfully
2. ✅ All 59 API routes are marked as dynamic (ƒ symbol in build output)
3. ✅ No "Dynamic server usage" errors
4. ✅ Feed validation endpoint is properly configured
5. ✅ All route files have `export const dynamic = "force-dynamic";` after imports
6. ✅ No syntax errors or malformed exports

## Build Output
```
Route (app)
├ ƒ /api/feeds/validate
├ ƒ /api/feeds
├ ƒ /api/articles
├ ƒ /api/user/feeds
...
```

The `ƒ` symbol indicates routes are correctly configured as dynamic (server-rendered on demand).

## Related Documentation
- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering)
- [Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic)

## Date
November 19, 2025

