# 🚨 Quick Fix for Auth Error

You're seeing this error:
```
[auth][error] UntrustedHost: Host must be trusted. URL was: https://neureed.madpin.dev/api/auth/session
```

## ✅ Solution (2 minutes)

### Step 1: Add Environment Variable in Dokploy

1. Open your Dokploy dashboard
2. Go to your NeuReed application
3. Click on **Environment Variables**
4. Add a new variable:
   - **Name**: `AUTH_TRUST_HOST`
   - **Value**: `true`
5. Save

### Step 2: Restart the Application

- Click **Restart** (NOT rebuild - just restart the container)
- Wait for the application to come back online

### Step 3: Test

- Visit `https://neureed.madpin.dev`
- The auth errors should be gone

## 🔄 If That Doesn't Work

If a simple restart doesn't fix it, you need to deploy the new code:

```bash
# In your local repository
git add .
git commit -m "fix: add AUTH_TRUST_HOST configuration for NextAuth"
git push
```

Then in Dokploy:
- Make sure `AUTH_TRUST_HOST=true` is still set
- Click **Deploy** to rebuild with the new code

## 📝 What Changed

I've updated the code to properly handle the `AUTH_TRUST_HOST` environment variable:
- `src/env.ts` - Added the variable definition
- `src/lib/auth.ts` - Configured NextAuth to use it
- Documentation updated

## ❓ Why This Happened

NextAuth.js v5 requires you to explicitly trust production hosts as a security measure. When your app is deployed behind a proxy (like in Dokploy), you need to tell NextAuth to trust the forwarded headers.

## 📚 More Details

See `docs/AUTH_TRUST_HOST_FIX.md` for a comprehensive explanation.

