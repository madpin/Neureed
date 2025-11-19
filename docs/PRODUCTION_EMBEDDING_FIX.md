# Production Embedding Fix - ONNX Runtime Issue

## Problem

In production (Gravitron server with Dokploy + Nixpacks), you're seeing this error:

```
Error: libonnxruntime.so.1.14.0: cannot open shared object file: No such file or directory
```

This happens when:
1. OpenAI API key is not configured or OpenAI API fails
2. System falls back to local embeddings using `@xenova/transformers`
3. The library tries to load native ONNX Runtime binaries
4. The binaries are not available in the production environment

## Root Cause

`@xenova/transformers` supports two backends:
- **Native ONNX Runtime** (faster, requires native libraries)
- **WASM ONNX Runtime** (slower, works everywhere)

By default, in Node.js environments, it tries to use the native backend first, which requires `libonnxruntime.so` to be installed on the system.

## Solutions

### Solution 1: Use OpenAI Embeddings (RECOMMENDED)

This is the **best solution for production**:

**Pros:**
- ✅ Fast and reliable
- ✅ High quality embeddings
- ✅ No local compute needed
- ✅ Very affordable (~$0.13 per 1M tokens)

**Setup in Dokploy:**

Add these environment variables:

```bash
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Cost Estimate:**
- 1,000 articles ≈ $0.065
- 10,000 articles ≈ $0.65
- 100,000 articles ≈ $6.50

### Solution 2: Install ONNX Runtime (If you must use local embeddings)

If you need to use local embeddings, we've updated `nixpacks.toml` to include ONNX Runtime:

```toml
nixPkgs = ["nodejs_20", "openssl", "onnxruntime"]
```

**After deploying this change:**
1. The native ONNX Runtime library will be available
2. Local embeddings will work (but will be slower)
3. More memory will be used (~500MB-1GB)

### Solution 3: Force WASM Backend (Backup option)

We've also improved the WASM backend configuration in `src/lib/embeddings/local-provider.ts`:

```typescript
// Force WASM backend ONLY to avoid native library dependencies
transformersEnv.backends.onnx.wasm.numThreads = 1;
transformersEnv.backends.onnx.executionProviders = ['wasm'];
```

This should work even without native libraries, but may be slower.

## Deployment Steps

### Option A: Use OpenAI (Recommended)

1. **In Dokploy**, go to your app's environment variables
2. Add or update:
   ```
   EMBEDDING_PROVIDER=openai
   OPENAI_API_KEY=sk-your-key-here
   ```
3. Redeploy the app
4. ✅ Done! Embeddings will use OpenAI

### Option B: Use Local with ONNX Runtime

1. **Commit and push the changes:**
   ```bash
   git add nixpacks.toml src/lib/embeddings/local-provider.ts
   git commit -m "Fix: Add ONNX Runtime support for local embeddings"
   git push
   ```

2. **In Dokploy**, trigger a rebuild
3. The new build will include ONNX Runtime
4. Local embeddings will work

### Option C: Use Local with WASM Only

1. **Commit and push the changes:**
   ```bash
   git add src/lib/embeddings/local-provider.ts
   git commit -m "Fix: Force WASM backend for local embeddings"
   git push
   ```

2. **In Dokploy**, add this environment variable:
   ```
   USE_ONNX_WASM=1
   ```

3. Redeploy
4. WASM backend will be used (slower but works everywhere)

## Testing

After deployment, check the logs:

### Success with OpenAI:
```
[INFO] Using OpenAI embedding provider
[INFO] Generated embedding for article: xxx
```

### Success with Local (Native):
```
[INFO] Initializing local embedding model
[INFO] Loading local embedding model (this may take a few minutes on first use)
[INFO] Local embedding model loaded successfully {"backend":"native"}
```

### Success with Local (WASM):
```
[INFO] Initializing local embedding model
[INFO] Loading local embedding model (this may take a few minutes on first use)
[INFO] Local embedding model loaded successfully {"backend":"wasm"}
```

## Performance Comparison

| Provider | Speed | Quality | Cost | Memory | Setup |
|----------|-------|---------|------|--------|-------|
| OpenAI | ⚡⚡⚡ Very Fast | ⭐⭐⭐ Excellent | 💰 ~$0.13/1M tokens | 🪶 Minimal | ✅ Easy |
| Local (Native) | ⚡⚡ Fast | ⭐⭐ Good | 💰 Free | 🐘 ~500MB-1GB | ⚠️ Needs libraries |
| Local (WASM) | ⚡ Slow | ⭐⭐ Good | 💰 Free | 🐘 ~500MB-1GB | ✅ Easy |

## Recommendation

**For Production: Use OpenAI** (Solution 1)
- It's fast, reliable, and very affordable
- No infrastructure complexity
- Better quality embeddings
- Scales effortlessly

**For Development/Testing: Use Local**
- Free and private
- Good for testing
- No API keys needed

## Current Status

✅ **Fixed in this commit:**
1. Added ONNX Runtime to nixpacks.toml
2. Improved WASM backend configuration
3. Better error logging
4. Added environment variable hints

✅ **What you need to do:**
1. Choose your preferred solution (OpenAI recommended)
2. Set environment variables in Dokploy
3. Deploy/Redeploy

## Troubleshooting

### Still seeing ONNX errors after deploying?

1. **Check environment variables:**
   ```bash
   # In Dokploy, verify these are set:
   EMBEDDING_PROVIDER=openai  # or "local"
   OPENAI_API_KEY=sk-...      # if using OpenAI
   ```

2. **Check build logs:**
   - Look for "Installing onnxruntime" during build
   - If not found, nixpacks.toml changes didn't apply

3. **Force rebuild:**
   - In Dokploy, do a clean rebuild (not just redeploy)

4. **Check application logs:**
   - Look for "Initializing local embedding model"
   - Check if it says "backend: wasm" or "backend: native"

### Embeddings are slow?

- **If using local embeddings:** This is expected. Switch to OpenAI for better performance.
- **If using OpenAI:** Check your API key and network connectivity.

### Out of memory errors?

- **If using local embeddings:** Reduce `EMBEDDING_BATCH_SIZE` to 3-5
- **Or switch to OpenAI:** Much lower memory usage

## Additional Resources

- [OpenAI Embeddings Pricing](https://openai.com/api/pricing/)
- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
- [ONNX Runtime Documentation](https://onnxruntime.ai/)

