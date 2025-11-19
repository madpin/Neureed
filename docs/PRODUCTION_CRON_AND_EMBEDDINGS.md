# Production: Cron Jobs & Embeddings Guide

## Cron Jobs in Production

### ✅ Will Cron Work? YES, with Configuration

Your cron implementation **will work in production**, but you need to ensure proper configuration.

#### How It Works

**1. Initialization via Next.js Instrumentation Hook**

Your `instrumentation.ts` file is called automatically when the server starts:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeScheduler } = await import("./src/lib/jobs/scheduler");
    initializeScheduler();
  }
}
```

**2. Scheduler Checks Environment Variable**

In `src/lib/jobs/scheduler.ts`:
```typescript
if (!env.ENABLE_CRON_JOBS) {
  logger.info("Cron jobs are disabled (ENABLE_CRON_JOBS=false)");
  return;
}
```

**3. Cron Jobs Start**
- **Feed Refresh**: Every 30 minutes (default: `*/30 * * * *`)
- **Cleanup**: Daily at 3 AM (default: `0 3 * * *`)

### ⚠️ CRITICAL: Enable Instrumentation Hook

**Problem:** Your `next.config.ts` is **missing** the instrumentation hook configuration!

**Current Configuration:**
```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    staticGenerationRetryCount: 0,
  },
};
```

**Required Fix:**
```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    staticGenerationRetryCount: 0,
    instrumentationHook: true,  // ⚠️ ADD THIS!
  },
};
```

**Without this, `instrumentation.ts` will NOT be called, and cron jobs will NOT start!**

### Environment Variables for Cron

Add these to your Dokploy environment variables:

```bash
# Enable cron jobs (default: true)
ENABLE_CRON_JOBS="true"

# Feed refresh schedule (default: every 30 minutes)
FEED_REFRESH_SCHEDULE="*/30 * * * *"

# Cleanup schedule (default: daily at 3 AM)
CLEANUP_SCHEDULE="0 3 * * *"
```

**Note:** If you don't set these, the defaults will be used (which are fine for most cases).

### Verifying Cron is Running

**1. Check Startup Logs:**
```bash
docker logs <container-name> | grep -i cron
```

You should see:
```
[Instrumentation] register() called
[Instrumentation] Running in Node.js runtime, initializing scheduler...
[INFO] Initializing cron job scheduler...
[INFO] Cron job scheduler initialized successfully
```

**2. Check Cron Status API:**
```bash
curl https://your-domain.com/api/admin/cron/status
```

Expected response:
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "initialized": true,
    "schedules": {
      "feedRefresh": "*/30 * * * *",
      "cleanup": "0 3 * * *"
    }
  }
}
```

**3. Manually Trigger (for testing):**
```bash
curl -X POST https://your-domain.com/api/admin/cron/trigger \
  -H "Content-Type: application/json" \
  -d '{"job": "feedRefresh"}'
```

### Cron Jobs in Standalone Mode

**Important:** Cron jobs work perfectly in standalone mode because:
- ✅ `instrumentation.ts` is included in the standalone bundle
- ✅ `node-cron` runs in the Node.js process
- ✅ No external scheduler needed (like system cron)

**Single Container:** All cron jobs run in the same container as your web server.

### Production Considerations

#### 1. **Single Instance Only**

**Problem:** If you run multiple instances (horizontal scaling), each instance will run its own cron jobs, causing duplicate work.

**Solutions:**

**Option A: Disable Cron on Additional Instances**
```bash
# Primary instance
ENABLE_CRON_JOBS="true"

# Additional instances (if scaling)
ENABLE_CRON_JOBS="false"
```

**Option B: Use External Cron Service**
- Use Dokploy's scheduled tasks feature
- Use a dedicated cron service (e.g., cron-job.org)
- Call your API endpoints on schedule

**Option C: Distributed Locking** (Advanced)
- Use Redis for distributed locks
- Ensure only one instance runs each job

#### 2. **Long-Running Jobs**

Your feed refresh job processes all feeds, which could take time.

**Current Implementation:** ✅ Already handles this
```typescript
if (isRunning) {
  logger.warn("Feed refresh job already running, skipping");
  return;
}
```

#### 3. **Timezone Considerations**

**Default:** Cron runs in the container's timezone (usually UTC)

**To use a specific timezone:**
```bash
# In Dokploy environment variables
TZ="America/New_York"
```

Or adjust your cron expressions accordingly.

---

## Embeddings in Production

### ✅ Will Embeddings Work? YES, with Configuration

Your embeddings system supports two modes:

### Mode 1: OpenAI Embeddings (Recommended for Production)

**Pros:**
- ✅ Fast and reliable
- ✅ High quality embeddings
- ✅ No local compute needed
- ✅ Scales easily

**Cons:**
- ❌ Costs money (but cheap: ~$0.13 per 1M tokens)
- ❌ Requires API key
- ❌ Sends data to OpenAI

**Configuration:**
```bash
# Required
OPENAI_API_KEY="sk-..."

# Optional (defaults shown)
EMBEDDING_PROVIDER="openai"
EMBEDDING_MODEL="text-embedding-3-small"
EMBEDDING_BATCH_SIZE="10"
EMBEDDING_AUTO_GENERATE="false"
```

**Cost Estimate:**
- 1,000 articles ≈ 500K tokens ≈ $0.065
- 10,000 articles ≈ 5M tokens ≈ $0.65
- Very affordable for most use cases

### Mode 2: Local Embeddings (Transformers.js)

**Pros:**
- ✅ Free
- ✅ Private (data stays local)
- ✅ No API key needed

**Cons:**
- ❌ Slower (CPU-intensive)
- ❌ Requires more memory
- ❌ Lower quality than OpenAI
- ❌ May timeout on large batches

**Configuration:**
```bash
EMBEDDING_PROVIDER="local"
EMBEDDING_MODEL="Xenova/all-MiniLM-L6-v2"  # Default local model
EMBEDDING_BATCH_SIZE="5"  # Smaller batches for local
```

**Production Considerations:**

⚠️ **Memory Usage:** Local embeddings use `@xenova/transformers` which:
- Downloads models on first run (~100MB)
- Keeps models in memory
- Can use 500MB-1GB RAM

⚠️ **CPU Usage:** Generating embeddings is CPU-intensive:
- May slow down web requests
- Consider running in background job
- May need more CPU resources

⚠️ **Timeout Issues:** In Docker with limited resources:
- May timeout on large articles
- Adjust `EXTRACTION_TIMEOUT` if needed

### Embedding Generation Strategy

#### Option 1: Manual Generation (Current Default)

**Configuration:**
```bash
EMBEDDING_AUTO_GENERATE="false"
```

**How it works:**
- Embeddings are NOT generated automatically
- Must be triggered manually via API or admin panel

**Trigger via API:**
```bash
curl -X POST https://your-domain.com/api/jobs/generate-embeddings
```

**Pros:**
- ✅ Control when embeddings are generated
- ✅ Won't slow down feed refresh
- ✅ Can monitor progress

**Cons:**
- ❌ Manual intervention required
- ❌ New articles won't have embeddings immediately

#### Option 2: Auto-Generate (Recommended for Production)

**Configuration:**
```bash
EMBEDDING_AUTO_GENERATE="true"
```

**How it works:**
- Embeddings generated automatically after feed refresh
- Runs in background
- Processes articles without embeddings

**Pros:**
- ✅ Fully automated
- ✅ New articles get embeddings automatically
- ✅ No manual intervention

**Cons:**
- ❌ Uses API credits (if using OpenAI)
- ❌ Adds time to feed refresh cycle

### Database Requirements

**PostgreSQL with pgvector Extension**

Your embeddings require the `pgvector` extension for vector similarity search.

**Check if installed:**
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Install if missing:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**In Dokploy/Managed PostgreSQL:**
- Most managed PostgreSQL services support pgvector
- Check your provider's documentation
- May need to enable in control panel

### Embedding Storage

**Database Schema:**
```sql
-- From your schema.prisma
embedding Unsupported("vector(1536)")?
```

**Storage per article:**
- OpenAI `text-embedding-3-small`: 1536 dimensions
- Local models: Usually 384-768 dimensions
- ~6KB per embedding (1536 floats)

**Database size estimate:**
- 1,000 articles ≈ 6MB
- 10,000 articles ≈ 60MB
- 100,000 articles ≈ 600MB

### Testing Embeddings in Production

**1. Generate embeddings for existing articles:**
```bash
curl -X POST https://your-domain.com/api/jobs/generate-embeddings \
  -H "Content-Type: application/json"
```

**2. Check embedding status:**
```bash
curl https://your-domain.com/api/admin/embeddings
```

Expected response:
```json
{
  "success": true,
  "data": {
    "totalArticles": 1000,
    "articlesWithEmbeddings": 950,
    "articlesWithoutEmbeddings": 50,
    "coveragePercentage": 95
  }
}
```

**3. Test semantic search:**
```bash
curl "https://your-domain.com/api/articles/semantic-search?query=artificial+intelligence&limit=5"
```

**4. Test related articles:**
```bash
curl "https://your-domain.com/api/articles/{article-id}/related?limit=5"
```

### Troubleshooting Embeddings

#### Issue: "Article has no embedding"

**Cause:** Embeddings not generated for that article

**Solutions:**
1. Enable auto-generation: `EMBEDDING_AUTO_GENERATE="true"`
2. Manually trigger: `POST /api/jobs/generate-embeddings`
3. Check OpenAI API key is valid
4. Check logs for generation errors

#### Issue: "pgvector extension not found"

**Cause:** PostgreSQL doesn't have pgvector installed

**Solution:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Or contact your database provider to enable it.

#### Issue: Embeddings generation is slow

**Cause:** Using local embeddings or large batch size

**Solutions:**
1. Switch to OpenAI: `EMBEDDING_PROVIDER="openai"`
2. Reduce batch size: `EMBEDDING_BATCH_SIZE="5"`
3. Increase timeout: `EXTRACTION_TIMEOUT="60000"`
4. Add more CPU/memory to container

#### Issue: OpenAI API rate limits

**Cause:** Generating too many embeddings too fast

**Solutions:**
1. Reduce batch size: `EMBEDDING_BATCH_SIZE="5"`
2. Add delays between batches (modify code)
3. Upgrade OpenAI tier
4. Use local embeddings for bulk generation

---

## Recommended Production Configuration

### For Small to Medium Deployments (< 10K articles)

```bash
# Cron Jobs
ENABLE_CRON_JOBS="true"
FEED_REFRESH_SCHEDULE="*/30 * * * *"
CLEANUP_SCHEDULE="0 3 * * *"

# Embeddings - OpenAI (Recommended)
OPENAI_API_KEY="sk-..."
EMBEDDING_PROVIDER="openai"
EMBEDDING_MODEL="text-embedding-3-small"
EMBEDDING_BATCH_SIZE="10"
EMBEDDING_AUTO_GENERATE="true"
```

**Cost:** ~$0.50-$5/month depending on article volume

### For Large Deployments (> 10K articles)

```bash
# Cron Jobs
ENABLE_CRON_JOBS="true"
FEED_REFRESH_SCHEDULE="*/60 * * * *"  # Less frequent
CLEANUP_SCHEDULE="0 3 * * *"

# Embeddings - OpenAI with larger batches
OPENAI_API_KEY="sk-..."
EMBEDDING_PROVIDER="openai"
EMBEDDING_MODEL="text-embedding-3-small"
EMBEDDING_BATCH_SIZE="20"
EMBEDDING_AUTO_GENERATE="true"
```

### For Privacy-Focused / Budget Deployments

```bash
# Cron Jobs
ENABLE_CRON_JOBS="true"
FEED_REFRESH_SCHEDULE="*/60 * * * *"
CLEANUP_SCHEDULE="0 3 * * *"

# Embeddings - Local (Free but slower)
EMBEDDING_PROVIDER="local"
EMBEDDING_MODEL="Xenova/all-MiniLM-L6-v2"
EMBEDDING_BATCH_SIZE="5"
EMBEDDING_AUTO_GENERATE="false"  # Manual trigger to avoid slowdowns
EXTRACTION_TIMEOUT="60000"
```

**Note:** Allocate at least 2GB RAM for local embeddings

---

## Complete Production Checklist

### 1. Enable Instrumentation Hook ⚠️ CRITICAL

- [ ] Add `instrumentationHook: true` to `next.config.ts`
- [ ] Redeploy after making this change

### 2. Configure Cron Jobs

- [ ] Set `ENABLE_CRON_JOBS="true"` in Dokploy
- [ ] Optionally customize schedules
- [ ] Verify only ONE instance has cron enabled (if scaling)

### 3. Configure Embeddings

Choose one:

**Option A: OpenAI (Recommended)**
- [ ] Set `OPENAI_API_KEY`
- [ ] Set `EMBEDDING_PROVIDER="openai"`
- [ ] Set `EMBEDDING_AUTO_GENERATE="true"`
- [ ] Verify OpenAI API key has credits

**Option B: Local**
- [ ] Set `EMBEDDING_PROVIDER="local"`
- [ ] Allocate sufficient memory (2GB+)
- [ ] Consider manual generation
- [ ] Test performance with your article volume

### 4. Database Setup

- [ ] Verify pgvector extension is installed
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Check database has sufficient storage

### 5. Test After Deployment

- [ ] Check startup logs for cron initialization
- [ ] Call `/api/admin/cron/status` to verify
- [ ] Manually trigger feed refresh to test
- [ ] Generate embeddings for test articles
- [ ] Test semantic search functionality
- [ ] Test related articles feature

### 6. Monitor

- [ ] Watch logs for cron job execution
- [ ] Monitor embedding generation progress
- [ ] Check OpenAI usage/costs (if applicable)
- [ ] Monitor database size growth
- [ ] Check CPU/memory usage

---

## Summary

### Cron Jobs
- ✅ **Will work** in production with proper configuration
- ⚠️ **Must enable** `instrumentationHook: true` in `next.config.ts`
- ✅ Already properly implemented with `node-cron`
- ✅ No external scheduler needed
- ⚠️ Consider single-instance deployment or distributed locking

### Embeddings
- ✅ **Will work** in production with either OpenAI or local
- ✅ **Recommended:** OpenAI for production (fast, reliable, cheap)
- ⚠️ **Local embeddings:** Possible but requires more resources
- ✅ Auto-generation recommended for seamless experience
- ✅ Requires pgvector extension in PostgreSQL

### Next Steps
1. **Fix `next.config.ts`** to enable instrumentation hook
2. **Choose embedding strategy** (OpenAI recommended)
3. **Set environment variables** in Dokploy
4. **Deploy and test** thoroughly
5. **Monitor** for the first few days

Both systems are production-ready! 🚀

