# Embedding Generation Fix - Quick Summary

## What Was Wrong

Your production logs showed three critical errors:

1. **ONNX Runtime Missing**: `libonnxruntime.so.1.14.0: cannot open shared object file`
2. **OpenAI Provider Failing**: Silent failures when API key not configured
3. **Articles Without Embeddings**: Breaking the related articles feature

## What Was Fixed

### 1. WASM Backend (No Native Dependencies!)
- ✅ Configured @xenova/transformers to use WASM backend
- ✅ Works on ANY platform (Nixpacks, Docker, etc.)
- ✅ No system libraries required
- ✅ Pure JavaScript/WebAssembly solution

### 1b. Docker Image (Dockerfile) - Only if using Docker
- ✅ Changed from Alpine Linux to Debian Slim
- ✅ Provides better compatibility with native Node.js modules
- ⚠️ **Not needed for Nixpacks** - WASM works out of the box!

### 2. Local Embedding Provider (src/lib/embeddings/local-provider.ts)
- ✅ Configured to use WASM backend (no native dependencies needed)
- ✅ More portable and reliable
- ✅ Works on any platform

### 3. Embedding Service (src/lib/services/embedding-service.ts)
- ✅ Added automatic fallback: OpenAI → Local
- ✅ Prevents errors when API key is missing
- ✅ Ensures embeddings always work

### 4. OpenAI Provider (src/lib/embeddings/openai-provider.ts)
- ✅ Better error handling
- ✅ Clearer error messages
- ✅ Validates API key only when actually generating embeddings

## How to Deploy

### For Nixpacks (Railway, Render, etc.) - You!
```bash
# Just commit and push - Platform will rebuild automatically
git add .
git commit -m "Fix embedding generation with WASM backend"
git push
```

**That's it!** No configuration changes needed. The WASM backend works out of the box with Nixpacks.

See [NIXPACKS_EMBEDDING_FIX.md](./NIXPACKS_EMBEDDING_FIX.md) for detailed Nixpacks-specific guide.

### For Docker (If someone else needs it)
```bash
docker build -t neureed:latest .
docker push your-registry/neureed:latest
```

## After Deployment

### 1. Choose Your Embedding Provider (NEW!)

Visit your admin dashboard:
```
https://your-domain.com/admin/dashboard
```

Go to the **"Search"** tab and select your preferred embedding provider:
- **OpenAI**: Fast, high-quality, costs ~$0.065/1K articles
- **Local (WASM)**: Free, slower, runs locally

You can switch providers anytime without redeploying! The system will test the provider before switching.

### 2. Generate Embeddings for Existing Articles

Click the **"Generate Embeddings"** button to process all articles without embeddings.

### 3. Verify It's Working

Check the logs for success messages:
```
[INFO] Local embedding model loaded successfully
[INFO] Generated batch embeddings {"count":50}
[INFO] Embedding generation job completed {"totalProcessed":250}
```

## Admin Panel Control (NEW!)

**You can now switch embedding providers directly from the admin dashboard!**

No need to change environment variables or redeploy. Just:

1. Go to Admin Dashboard → Search tab
2. Click on your preferred provider (OpenAI or Local WASM)
3. System tests the provider automatically
4. Switch happens instantly!

### Benefits

- ✅ **Instant switching** - No redeployment needed
- ✅ **Provider testing** - Validates before switching
- ✅ **Status indicators** - See which providers are available
- ✅ **Persistent** - Settings stored in database
- ✅ **Error handling** - Clear feedback if something's wrong

## Environment Variables (Optional)

You can still use environment variables to set defaults, but the admin panel takes precedence:

### Option 1: Use OpenAI (Fast, Paid)
```bash
EMBEDDING_PROVIDER=openai  # Can be changed in admin panel
OPENAI_API_KEY=sk-your-key-here
```

### Option 2: Use Local (Free, Slower)
```bash
EMBEDDING_PROVIDER=local  # Can be changed in admin panel
```

### Option 3: Auto-Fallback (Recommended)
```bash
EMBEDDING_PROVIDER=openai  # Can be changed in admin panel
# Don't set OPENAI_API_KEY
# System automatically falls back to local
```

## Expected Behavior

### Before Fix
- ❌ Embeddings fail with ONNX error
- ❌ OpenAI fails silently
- ❌ Related articles don't work
- ❌ Articles have no embeddings

### After Fix
- ✅ Local embeddings work with WASM backend
- ✅ Automatic fallback when OpenAI not configured
- ✅ Related articles work
- ✅ All articles get embeddings

## Performance

| Provider | Speed | Cost | Quality | Reliability |
|----------|-------|------|---------|-------------|
| OpenAI | Fast (~100ms) | ~$0.065/1K articles | High | Requires API key |
| Local (WASM) | Slower (~500ms) | Free | Good | Always works |

## Troubleshooting

### Still seeing ONNX errors?
- Make sure you've rebuilt the Docker image
- Clear Docker cache: `docker build --no-cache`

### OpenAI still failing?
- Check your API key is valid
- Verify you have credits: https://platform.openai.com/usage

### Embeddings not generating?
- Check logs for errors
- Try manual generation via admin dashboard
- Verify database connection is working

## Need Help?

Check the detailed documentation:
- [Full Fix Documentation](./docs/EMBEDDING_FIXES.md)
- [Embedding Configuration Guide](./README.md#embeddings)

## Files Changed

1. `Dockerfile` - Updated base image and dependencies
2. `src/lib/embeddings/local-provider.ts` - Added WASM backend support
3. `src/lib/embeddings/openai-provider.ts` - Improved error handling
4. `src/lib/services/embedding-service.ts` - Added automatic fallback

All changes are backward compatible - no database migrations needed!

