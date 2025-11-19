# Deployment CSS Fix

## Issue
The deployment at https://neureed.madpin.dev was showing a 404 error for a CSS chunk file: `/_next/static/chunks/2a19bf86d93bc1a1.css`

This was causing styling issues on the production site.

## Root Cause
The `dokploy.json` was configured to use `Dockerfile` instead of `nixpacks`, and the build wasn't properly cleaning cached build artifacts before rebuilding.

## Fix Applied

### 1. Updated `dokploy.json`
Changed from:
```json
{
  "buildType": "dockerfile",
  "dockerfile": "Dockerfile"
}
```

To:
```json
{
  "buildType": "nixpacks"
}
```

### 2. Updated `nixpacks.toml`
Added a clean step before building to remove stale build artifacts:
```toml
[phases.build]
cmds = [
  ...
  "echo '🧹 Cleaning previous build artifacts...'",
  "rm -rf .next",
  "echo '🏗️  Building Next.js application...'",
  "npm run build",
  ...
]
```

### 3. Added `.dockerignore`
Created a `.dockerignore` file to prevent build artifacts and logs from being copied into the build context.

## How to Deploy

1. Commit and push these changes to your repository:
   ```bash
   git add dokploy.json nixpacks.toml .dockerignore
   git commit -m "Fix CSS chunk 404 error - use nixpacks properly"
   git push origin main
   ```

2. In Dokploy:
   - Go to your application
   - Click "Redeploy" or trigger a new deployment
   - The build will now use nixpacks and clean build artifacts

3. The deployment should complete successfully with all CSS files present.

## Verification

After deployment, check:
- Visit https://neureed.madpin.dev
- Open browser DevTools (F12)
- Go to Network tab
- Look for any 404 errors (there should be none)
- The site should load with proper styling

## Notes

- The missing CSS file was likely due to build cache from a previous build
- Cleaning `.next` before building ensures a fresh build every time
- Using nixpacks properly ensures all static assets are copied correctly

