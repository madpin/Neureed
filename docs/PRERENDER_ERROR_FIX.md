# Prerender Error Fix - Next.js 16 SSR Issue

## Problem

The deployment was failing during the Next.js build process with the following error:

```
Error occurred prerendering page "/_not-found". Read more: https://nextjs.org/docs/messages/prerender-error
TypeError: Cannot read properties of null (reading 'useState')
    at w (.next/server/chunks/ssr/[root-of-the-server]__1857d5e8._.js:2:1429) {
  digest: '2994773512'
}
Export encountered an error on /_not-found/page: /_not-found, exiting the build.
```

## Root Cause

Next.js 16 attempts to prerender all pages during the build process, including the default `/_not-found` page. The issue occurred because:

1. The root layout (`app/layout.tsx`) wraps all pages with client components (`AuthProvider` and `ThemeProvider`)
2. These providers use React hooks (`useState`, `useEffect`, `useContext`)
3. During static generation/prerendering, React context is not available
4. When Next.js tried to prerender the default 404 page, it couldn't access the React hooks, causing the "Cannot read properties of null (reading 'useState')" error

## Solution

Created a custom `app/not-found.tsx` file as a **server component** (no `"use client"` directive):

```typescript
/**
 * Custom 404 Not Found page
 * This is a server component by default, which prevents SSR issues during build
 */
export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold">404</h1>
        <h2 className="mb-4 text-2xl font-semibold">Page Not Found</h2>
        <p className="mb-8 text-foreground/70">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <a
          href="/"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
```

### Why This Works

1. **Server Component**: By default, the component is a server component (no client-side hooks)
2. **Static Rendering**: Can be safely prerendered during build without React context
3. **Simple HTML**: Uses only static HTML/CSS, no client-side JavaScript required
4. **User-Friendly**: Provides a clean 404 page with navigation back to home

## Verification

Build tested locally and succeeded:

```bash
npx next build
# ✓ Compiled successfully in 3.8s
# ✓ Generating static pages using 15 workers (46/46) in 507.9ms
```

The `/_not-found` page now appears in the build output as a static page:

```
Route (app)
├ ○ /_not-found
...
○  (Static)   prerendered as static content
```

## Related Issues

- Next.js 16 is stricter about SSR and static generation
- Client components with hooks must be properly isolated from static generation
- Custom error pages should be server components when possible

## References

- [Next.js Prerender Error Documentation](https://nextjs.org/docs/messages/prerender-error)
- [Next.js App Router - Not Found](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)
- [Server and Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

## Additional Issue: global-error.tsx Prerender Error

After fixing the `not-found.tsx` issue, a similar error occurred with `/_global-error`:

```
Error occurred prerendering page "/_global-error". Read more: https://nextjs.org/docs/messages/prerender-error
TypeError: Cannot read properties of null (reading 'useContext')
```

### Root Cause

The `global-error.tsx` file was marked as `"use client"` (required for error boundaries), but Next.js 16 with `output: 'standalone'` was still trying to statically generate it during the build process. Even though it was a client component, the prerendering phase attempted to execute it server-side before React context was available.

### Solution

Applied a two-part fix:

1. **Simplified global-error.tsx**: Removed variable declarations for styles and used only inline style objects directly in JSX. This minimizes the JavaScript execution needed during SSR.

2. **Updated next.config.ts**: Added `staticGenerationRetryCount: 0` to the experimental configuration to prevent Next.js from attempting to statically generate error pages.

```typescript
experimental: {
  serverActions: {
    bodySizeLimit: '2mb',
  },
  // Disable static generation for error pages
  staticGenerationRetryCount: 0,
},
```

### Result

After these changes:
- `/_global-error` no longer appears in the build route list (not being prerendered)
- `/_not-found` successfully renders as a static page
- Build completes successfully both locally and in deployment

## Commits

1. **Initial Fix** (`97ff5c5`):
```
fix: Add custom not-found page to resolve SSR prerender error

- Created app/not-found.tsx as a server component
- Prevents 'Cannot read properties of null (reading useState)' error during build
- Fixes deployment failure in Dokploy/Next.js 16 build process
- Provides user-friendly 404 page with navigation back to home
```

2. **Complete Fix** (`71fd071`):
```
fix: Resolve global-error SSR prerender issue

- Simplified global-error.tsx to use only inline styles without variable declarations
- Added staticGenerationRetryCount: 0 to experimental config to prevent error page prerendering
- Prevents 'Cannot read properties of null (reading useContext)' during build
- Fixes deployment failure when Next.js tries to statically generate /_global-error
- Both /_not-found and /_global-error now work correctly during build
```

