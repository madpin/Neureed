# NextAuth UntrustedHost Error Fix

## Problem

The application was experiencing `UntrustedHost` errors in production:

```
[auth][error] UntrustedHost: Host must be trusted. URL was: https://neureed.madpin.dev/api/auth/session
```

This is a security feature in NextAuth.js that requires explicit trust of hosts that can make authentication requests.

## Solution

Added the `AUTH_TRUST_HOST` environment variable to the application configuration.

### Changes Made

1. **Updated `src/env.ts`**:
   - Added `AUTH_TRUST_HOST` to the server environment schema
   - Configured it as a boolean flag (defaults to `false` for security)
   - Added it to the runtime environment mapping

2. **Updated `src/lib/auth.ts`**:
   - Added `trustHost: env.AUTH_TRUST_HOST` to the NextAuth configuration
   - This tells NextAuth to trust the host when the flag is enabled

3. **Updated Documentation**:
   - Updated `DEPLOYMENT.md` to include `AUTH_TRUST_HOST="true"` in required environment variables
   - Updated `README.md` Docker example to include the new variable

## Configuration

### Development

In development, you can leave this unset or set it to `false`:

```bash
AUTH_TRUST_HOST="false"  # or omit entirely
```

NextAuth will use `NEXTAUTH_URL` or the request host automatically.

### Production

In production (Dokploy, Docker, etc.), you **must** set this to `true`:

```bash
AUTH_TRUST_HOST="true"
```

This is required for deployed applications to work correctly with NextAuth.js.

## Environment Variables Summary

For production deployment, ensure these NextAuth variables are set:

```bash
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key-at-least-32-characters"
AUTH_TRUST_HOST="true"
```

## References

- [NextAuth.js UntrustedHost Error](https://errors.authjs.dev#untrustedhost)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options#trusthost)

## Deployment Steps

### Quick Fix (Try This First)

NextAuth.js v5 automatically recognizes the `AUTH_TRUST_HOST` environment variable. You may not need to redeploy the code:

1. Go to your Dokploy dashboard
2. Navigate to your NeuReed application → Environment Variables
3. Add: `AUTH_TRUST_HOST` with value `true`
4. **Restart** the application (not a full rebuild, just restart)
5. Test if the authentication errors are resolved

### If Quick Fix Doesn't Work

If restarting doesn't work, you'll need to deploy the new code:

1. Commit and push the changes:
   ```bash
   git add .
   git commit -m "fix: add AUTH_TRUST_HOST configuration for NextAuth"
   git push
   ```

2. In Dokploy:
   - Ensure `AUTH_TRUST_HOST=true` is in environment variables
   - Trigger a new deployment
   
3. The authentication errors should be resolved

## Security Note

The `trustHost` option should only be enabled in production environments where you control the deployment. In development, it's safer to leave it disabled and rely on `NEXTAUTH_URL` for host validation.

