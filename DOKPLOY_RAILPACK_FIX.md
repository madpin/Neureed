# 🚨 URGENT: Dokploy Still Using Railpack - Fix Now

## The Problem

Dokploy is **ignoring** the configuration files and auto-detecting Railpack because it sees:
- `package.json` (Node.js project indicator)
- `.nvmrc` (Node version file)

This triggers automatic Railpack detection, which crashes during `npm ci`.

## SOLUTION 1: Use Pre-Built Images (RECOMMENDED ⭐)

This is the **BEST and FASTEST** solution - no building on Dokploy at all!

### Steps:

1. **In Dokploy UI**, change your application settings:
   - Source Type: **"Docker"** (not "Git")
   - Docker Image: `ghcr.io/madpin/neureed:latest`
   - Pull Policy: `Always`

2. **Save and Deploy**

That's it! Your GitHub Actions workflow already builds and pushes images to GHCR.

### Why This is Better:
- ✅ No building on Dokploy (just pull and run)
- ✅ Deployments in < 2 minutes instead of 15+ minutes
- ✅ No memory/timeout issues
- ✅ Multi-architecture support
- ✅ Zero downtime deployments

See [DOKPLOY_SETUP_GUIDE.md](./DOKPLOY_SETUP_GUIDE.md) for complete setup.

---

## SOLUTION 2: Force Dockerfile Build (Alternative)

If you want to build on Dokploy:

### Steps:

1. **Commit the new files:**
   ```bash
   git add .dokploy .railpackignore .nixpacks.json dokploy.json Dockerfile.dokploy .dockerignore
   git commit -m "fix: force Dockerfile build and disable Railpack"
   git push origin dev
   ```

2. **In Dokploy UI**, manually configure:
   - Go to your NeuReed application
   - Settings → Build Configuration
   - Build Type: **"Dockerfile"**
   - Dockerfile: `Dockerfile.dokploy`
   - Build Context: `.`
   - **Save**

3. **Trigger new deployment**

4. **Verify** - You should see "Building with Dockerfile" instead of "Preparing Railpack build plan..."

### If Still Using Railpack:

The UI settings might not be saving. Try:

1. **Delete the application** in Dokploy
2. **Create new application** with:
   - Source: Git
   - Build Type: **Dockerfile** (select during creation)
   - Dockerfile: `Dockerfile.dokploy`

---

## Files Created to Disable Railpack

- `.dokploy` - Forces Dockerfile build type
- `.railpackignore` - Tells Railpack to ignore this project
- `.nixpacks.json` - Disables Nixpacks (alternative builder)
- `dokploy.json` - Configuration file (may be ignored by UI)
- `Dockerfile.dokploy` - Optimized Dockerfile
- `.dockerignore` - Reduces build context

---

## Quick Comparison

| Method | Speed | Reliability | Memory Usage | Complexity |
|--------|-------|-------------|--------------|------------|
| **Pre-built Images (GHCR)** | ⚡ Fast | ✅ Excellent | 💚 Low | 🟢 Easy |
| **Dockerfile on Dokploy** | 🐌 Slow | ⚠️ Good | 🔴 High | 🟡 Medium |
| **Railpack (Current)** | 💀 Crashes | ❌ Fails | 💥 Very High | 🔴 Complex |

---

## Recommended Action Right Now

1. Go to Dokploy UI: https://dokploy.madpin.dev
2. Edit your NeuReed application
3. Change Source Type to **"Docker"**
4. Set Image to: `ghcr.io/madpin/neureed:latest`
5. Save and Deploy

Done! Your deployment will work immediately using pre-built images.

---

## Support Docs

- [DOKPLOY_SETUP_GUIDE.md](./DOKPLOY_SETUP_GUIDE.md) - Complete guide for pre-built image setup
- [DOKPLOY_DEPLOYMENT_FIX.md](./DOKPLOY_DEPLOYMENT_FIX.md) - Detailed Dockerfile optimization
- [GITHUB_ACTIONS_CONSOLIDATION.md](./GITHUB_ACTIONS_CONSOLIDATION.md) - CI/CD workflow details

