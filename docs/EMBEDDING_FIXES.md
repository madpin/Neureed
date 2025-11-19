# Embedding Generation Fixes

## Issues Identified

From the production logs, we identified three critical issues with the embedding generation system:

### 1. ONNX Runtime Library Missing
```
Error: libonnxruntime.so.1.14.0: cannot open shared object file: No such file or directory
code: 'ERR_DLOPEN_FAILED'
```

**Root Cause**: The `@xenova/transformers` library requires ONNX Runtime native libraries, which were not available in the Alpine Linux Docker image.

### 2. OpenAI Provider Failing Silently
```
[ERROR] OpenAI embedding generation failed {"error":{"error":{},"text":"This is a test sentence for embedding generation."}}
```

**Root Cause**: The OpenAI provider was being instantiated even when the API key was not configured, and errors were not being properly logged or handled.

### 3. Articles Without Embeddings
```
[ERROR] Failed to find related articles {"error":{"message":"Article has no embedding"}}
```

**Root Cause**: Embedding generation was failing, leaving articles without embeddings, which broke the related articles feature.

## Solutions Implemented

### 1. Docker Image Update (Dockerfile)

**Changed**: Switched from `node:20-alpine` to `node:20-slim` (Debian-based)

**Why**: 
- Alpine Linux doesn't have pre-built ONNX Runtime binaries
- Debian-slim provides better compatibility with native Node.js modules
- Still maintains a small image size (~200MB vs ~150MB for Alpine)

**Changes**:
```dockerfile
# Before
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# After
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
```

Also updated user creation commands to use Debian syntax:
```dockerfile
# Before (Alpine)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# After (Debian)
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs
```

### 2. Local Provider Enhancement (local-provider.ts)

**Added**: WASM backend configuration for `@xenova/transformers`

**Why**: 
- WASM backend works on any platform without native dependencies
- More portable and reliable than native ONNX Runtime
- Slightly slower but more compatible

**Changes**:
```typescript
// Configure transformers.js to use WASM backend
const { pipeline, env: transformersEnv } = await import("@xenova/transformers");

// Use WASM backend to avoid native library dependencies
transformersEnv.backends.onnx.wasm.numThreads = 1;
transformersEnv.allowLocalModels = false;
transformersEnv.allowRemoteModels = true;
```

### 3. Improved Fallback Logic (embedding-service.ts)

**Added**: Automatic fallback from OpenAI to local provider when API key is missing

**Why**: 
- Prevents errors when OpenAI is configured but API key is not set
- Ensures embeddings can always be generated
- Provides better user experience

**Changes**:
```typescript
export function getEmbeddingProvider(
  providerType?: EmbeddingProvider
): EmbeddingProviderInterface {
  const provider = providerType || env.EMBEDDING_PROVIDER;

  switch (provider) {
    case "openai":
      try {
        // Check if OpenAI API key is available
        if (!env.OPENAI_API_KEY) {
          logger.warn("OpenAI API key not configured, falling back to local provider");
          return new LocalEmbeddingProvider();
        }
        return new OpenAIEmbeddingProvider();
      } catch (error) {
        logger.warn("Failed to initialize OpenAI provider, falling back to local", { error });
        return new LocalEmbeddingProvider();
      }
    // ...
  }
}
```

### 4. OpenAI Provider Error Handling (openai-provider.ts)

**Changed**: Moved API key validation from constructor to method calls

**Why**: 
- Allows provider instantiation for testing/configuration checks
- Provides clearer error messages when API key is missing
- Enables better fallback logic

**Changes**:
```typescript
// Removed from constructor
// if (!this.apiKey) {
//   throw new Error("OpenAI API key is required...");
// }

// Added to generateEmbedding and generateEmbeddings methods
async generateEmbedding(text: string): Promise<EmbeddingResult> {
  if (!this.apiKey) {
    throw new Error(
      "OpenAI API key is required. Set OPENAI_API_KEY environment variable."
    );
  }
  // ...
}
```

## Deployment Instructions

### 1. Rebuild Docker Image

The Dockerfile changes require rebuilding the Docker image:

```bash
# Build new image
docker build -t neureed:latest .

# Or if using Dokploy, trigger a new deployment
# The platform will automatically rebuild with the new Dockerfile
```

### 2. Environment Variables

Ensure your environment variables are properly configured:

```bash
# Option 1: Use OpenAI (Recommended for production)
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
EMBEDDING_MODEL=text-embedding-3-small

# Option 2: Use Local Embeddings (Free but slower)
EMBEDDING_PROVIDER=local
EMBEDDING_MODEL=Xenova/bge-small-en-v1.5

# Option 3: Auto-fallback (Recommended for development)
# Set provider to openai but don't set API key
# System will automatically fall back to local
EMBEDDING_PROVIDER=openai
# OPENAI_API_KEY not set -> will use local
```

### 3. Generate Embeddings for Existing Articles

After deployment, generate embeddings for articles that don't have them:

```bash
# Via API (requires admin access)
curl -X POST https://your-domain.com/api/admin/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 50, "maxBatches": 10}'

# Or via admin dashboard
# Navigate to: https://your-domain.com/admin/dashboard
# Click "Generate Embeddings" button
```

## Performance Considerations

### OpenAI Provider
- **Speed**: Very fast (~100ms per article)
- **Cost**: ~$0.13 per 1M tokens (~$0.065 per 1000 articles)
- **Quality**: High quality embeddings
- **Reliability**: Requires internet and API key

### Local Provider (WASM)
- **Speed**: Slower (~500-1000ms per article)
- **Cost**: Free
- **Quality**: Good quality (slightly lower than OpenAI)
- **Reliability**: Works offline, no API key needed

### Recommendations

1. **Production**: Use OpenAI provider with API key
   - Fast and reliable
   - Cost is minimal (~$0.65 for 10,000 articles)
   - Better search quality

2. **Development**: Use local provider or auto-fallback
   - No API costs
   - Works offline
   - Good enough for testing

3. **Self-hosted/Privacy-focused**: Use local provider
   - No data sent to external services
   - Completely free
   - Acceptable performance for smaller deployments

## Testing

### Test Embedding Generation

```bash
# Test OpenAI provider
curl -X POST https://your-domain.com/api/admin/embeddings/config \
  -H "Content-Type: application/json" \
  -d '{"provider": "openai"}'

# Test local provider
curl -X POST https://your-domain.com/api/admin/embeddings/config \
  -H "Content-Type: application/json" \
  -d '{"provider": "local"}'
```

### Verify Embeddings

```bash
# Check embedding statistics
curl https://your-domain.com/api/admin/embeddings/stats

# Should show:
# {
#   "total": 590,
#   "withEmbeddings": 590,  // Should increase after generation
#   "withoutEmbeddings": 0,  // Should decrease to 0
#   "percentage": 100
# }
```

## Troubleshooting

### Issue: Local embeddings still failing with ONNX error

**Solution**: Ensure you've rebuilt the Docker image with the new Dockerfile. The old image may still be cached.

```bash
# Force rebuild without cache
docker build --no-cache -t neureed:latest .
```

### Issue: OpenAI embeddings failing with authentication error

**Solution**: Verify your API key is correctly set and has sufficient credits.

```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Issue: Embeddings generating but related articles not working

**Solution**: Ensure the HNSW index is created in PostgreSQL:

```sql
-- Check if index exists
SELECT indexname FROM pg_indexes 
WHERE tablename = 'articles' AND indexname = 'articles_embedding_idx';

-- If not, create it
CREATE INDEX articles_embedding_idx ON articles 
USING hnsw (embedding vector_cosine_ops);
```

## Migration Path

If you're currently running the old version:

1. **Backup your database** (important!)
2. **Deploy the new version** with updated Dockerfile
3. **Wait for deployment to complete**
4. **Test embedding generation** using the admin dashboard
5. **Generate embeddings** for all articles
6. **Verify related articles** feature is working

The system will automatically fall back to local embeddings if OpenAI is not configured, so there should be no downtime.

## Monitoring

Watch the logs for these indicators:

### Success Indicators
```
[INFO] Local embedding model loaded successfully
[INFO] Generated batch embeddings {"provider":"Xenova/bge-small-en-v1.5","count":50}
[INFO] Embedding generation job completed {"totalProcessed":250}
```

### Warning Indicators (Non-critical)
```
[WARN] OpenAI API key not configured, falling back to local provider
```

### Error Indicators (Requires attention)
```
[ERROR] Failed to load local embedding model
[ERROR] Failed to generate article embedding
```

## Future Improvements

1. **Hybrid Approach**: Use OpenAI for new articles, cache locally
2. **Batch Optimization**: Process embeddings in larger batches during off-peak hours
3. **Alternative Providers**: Support for Cohere, Anthropic, or other embedding providers
4. **GPU Support**: Add GPU acceleration for local embeddings (if available)
5. **Embedding Cache**: Cache embeddings in Redis for frequently accessed articles

