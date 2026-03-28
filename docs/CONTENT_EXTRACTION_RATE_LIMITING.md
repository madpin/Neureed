# Content Extraction Rate Limiting System

## Overview

The Content Extraction Rate Limiting system prevents NeuReed from being blocked or rate-limited by websites when extracting full article content. It implements intelligent per-domain throttling with multiple layers of protection.

## Problem Statement

While NeuReed already prevents re-extracting duplicate articles (80-95% reduction in requests), websites can still block extraction when:
- Multiple new articles from the same domain are extracted in quick succession
- Feed refresh job processes multiple feeds simultaneously
- Sites detect bot-like patterns (consistent user-agent, timing)
- Sites have strict rate limits (e.g., 1 request per 10 seconds)

## Solution Architecture

The rate limiting system uses a **layered approach** combining multiple strategies:

### Layer 1: Basic Delays (Phase 1 - Quick Win)
- Configurable delay between ANY extractions
- Default: 3 seconds (via `EXTRACTION_DELAY_MS`)
- Per-feed override: `extractionDelayMs` field on feeds table
- Simple but effective at preventing burst requests

### Layer 2: Domain-Aware Rate Limiting (Phase 2)
- Track last extraction time per domain
- Enforce minimum delay between requests to same domain
- Respects robots.txt `crawl-delay` directive
- Adaptive delays based on 429 responses

### Layer 3: Enhanced 429 Handling
- Detects 429 (Too Many Requests) responses specifically
- Parses `Retry-After` header if present
- Applies longer backoff: 30s, 60s, 120s
- Tracks rate-limited domains for future avoidance

### Layer 4: Metrics & Monitoring
- Tracks extraction attempts, successes, failures
- Identifies problematic domains
- Provides health scores for domains
- Admin dashboard visibility

## Key Components

### 1. Environment Variables (`src/env.ts`)

```typescript
EXTRACTION_DELAY_MS: z.coerce.number().default(3000)
// Default delay between extractions (milliseconds)

EXTRACTION_RESPECT_ROBOTS_TXT: z.enum(["true", "false"]).default("true")
// Whether to respect robots.txt crawl-delay globally
```

### 2. Database Schema Changes

#### Feeds Table
```prisma
model feeds {
  // ... existing fields
  extractionDelayMs    Int?      // Override default delay for this feed
  respectRobotsTxt     Boolean?  @default(true)
  lastExtractionAt     DateTime? // Last extraction timestamp
}
```

#### Domain Extraction Log Table
```prisma
model domain_extraction_log {
  id              String   @id @default(cuid())
  domain          String   @unique
  lastExtractedAt DateTime
  failureCount    Int      @default(0)
  lastError       String?
  crawlDelay      Int?     // From robots.txt (milliseconds)
  rateLimitCount  Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 3. Robots.txt Parser (`src/lib/services/robots-txt-parser.ts`)

**Purpose**: Parse robots.txt files and extract crawl-delay directives.

**Key Functions**:
- `getRobotsTxtInfo(domain)` - Fetch and parse robots.txt
- `extractDomain(url)` - Extract domain from URL
- `clearRobotsTxtCache(domain?)` - Clear cached robots.txt data

**Features**:
- 24-hour cache TTL
- Handles missing/inaccessible robots.txt gracefully
- Parses crawl-delay in seconds, converts to milliseconds
- Supports User-Agent specific rules

**Example**:
```typescript
const robotsInfo = await getRobotsTxtInfo("example.com");
if (robotsInfo.crawlDelay) {
  console.log(`Crawl delay: ${robotsInfo.crawlDelay}ms`);
}
```

### 4. Extraction Rate Limiter (`src/lib/services/extraction-rate-limiter.ts`)

**Purpose**: Core rate limiting logic with domain-aware throttling.

**Key Methods**:
- `canExtract(url, feedId?)` - Check if extraction is allowed
- `waitForSlot(url, feedId?)` - Block until extraction allowed
- `recordExtraction(url, success, error?, httpStatus?)` - Record extraction result
- `getRequiredDelay(domain, feedId?)` - Calculate required delay
- `resetRateLimitCount(domain)` - Reset rate limit tracking
- `getDomainStats()` - Get statistics for all domains

**Delay Calculation Hierarchy**:
1. Feed-specific `extractionDelayMs` override (highest priority)
2. robots.txt `crawl-delay` directive
3. Environment variable `EXTRACTION_DELAY_MS`
4. Adaptive delay based on 429 responses (lowest priority, but overrides if higher)

**Adaptive Delay Logic**:
```
1-2 rate limits  → 10 seconds
3-5 rate limits  → 30 seconds
6-10 rate limits → 60 seconds
10+ rate limits  → 120 seconds
```

**Example Usage**:
```typescript
import { extractionRateLimiter } from '@/lib/services/extraction-rate-limiter';

// Before extraction
await extractionRateLimiter.waitForSlot(articleUrl, feedId);

try {
  const content = await extractContent(articleUrl);

  // Record success
  await extractionRateLimiter.recordExtraction(
    articleUrl,
    true
  );
} catch (error) {
  // Record failure
  await extractionRateLimiter.recordExtraction(
    articleUrl,
    false,
    error.message,
    429 // HTTP status if available
  );
}
```

### 5. Enhanced 429 Handling (`src/lib/extractors/base-extractor.ts`)

**Enhancements to `retry()` method**:
- Detects 429 responses specifically
- Parses `Retry-After` header (seconds or HTTP date)
- Applies aggressive backoff for 429: 30s → 60s → 120s
- Falls back to regular exponential backoff for other errors

**Enhanced `fetchWithConfig()` method**:
- Throws error with attached Response object for 429
- Allows retry logic to access response headers
- Preserves Retry-After information

**Example 429 Response Handling**:
```
Request 1: Fails with 429, Retry-After: 30
  → Wait 30 seconds
Request 2: Fails with 429, no Retry-After
  → Wait 60 seconds (aggressive backoff)
Request 3: Fails with 429, no Retry-After
  → Wait 120 seconds (max backoff)
```

### 6. Feed Refresh Integration (`src/lib/services/feed-refresh-service.ts`)

**Integration Points**:

1. **Before extraction**:
   ```typescript
   await extractionRateLimiter.waitForSlot(article.link, feedId);
   ```

2. **After extraction** (success or failure):
   ```typescript
   await extractionRateLimiter.recordExtraction(
     article.link,
     extractionSuccess,
     extractionError,
     extractionHttpStatus
   );
   ```

3. **Applied to**:
   - `refreshFeed()` - Regular feed refresh
   - `refreshLastArticles()` - Manual article re-extraction

### 7. Extraction Metrics (`src/lib/services/extraction-metrics.ts`)

**Purpose**: Monitor extraction performance and identify issues.

**Key Functions**:
- `getExtractionMetrics(period)` - Overall metrics for time period
- `getProblematicDomains(limit)` - Domains with frequent failures
- `getRateLimitedDomains()` - Currently rate-limited domains
- `getDomainHealthScore(domain)` - Health score (0-100) for domain
- `cleanupStaleExtractionLogs(daysToKeep)` - Remove old logs

**Metrics Provided**:
- Total extraction attempts
- Success/failure counts and rates
- Rate-limited domain count
- Average delay across domains
- Per-domain statistics

**Example**:
```typescript
import { getExtractionMetrics, getProblematicDomains } from '@/lib/services/extraction-metrics';

// Get metrics for last 24 hours
const metrics = await getExtractionMetrics('24h');
console.log(`Success rate: ${metrics.successRate.toFixed(2)}%`);
console.log(`Rate-limited domains: ${metrics.rateLimitedDomains}`);

// Get problematic domains
const problematic = await getProblematicDomains(10);
problematic.forEach(domain => {
  console.log(`${domain.domain}: ${domain.failureCount} failures, ${domain.rateLimitCount} rate limits`);
});
```

## Configuration

### Environment Variables

Add to `.env.local` or environment:

```bash
# Extraction Rate Limiting
EXTRACTION_DELAY_MS=3000                    # Default delay between extractions (ms)
EXTRACTION_RESPECT_ROBOTS_TXT=true          # Respect robots.txt crawl-delay
```

### Per-Feed Configuration

Configure in feed settings UI or via API:

```typescript
await prisma.feeds.update({
  where: { id: feedId },
  data: {
    extractionDelayMs: 5000,      // 5 second delay for this feed
    respectRobotsTxt: true,        // Respect robots.txt
  }
});
```

### Feed Settings Cascade

Delay is determined by (highest priority first):
1. **Feed-specific** `extractionDelayMs` (e.g., 5000ms)
2. **robots.txt** `crawl-delay` (e.g., 10 seconds → 10000ms)
3. **Environment** `EXTRACTION_DELAY_MS` (default: 3000ms)
4. **Adaptive** delay for rate-limited domains (overrides if higher)

**Example Scenario**:
- Environment default: 3000ms
- Feed setting: 5000ms
- robots.txt: 10 seconds (10000ms)
- Domain has 5 rate limits → adaptive delay: 30000ms

**Result**: 30000ms (adaptive delay wins because it's highest)

## Usage Examples

### Example 1: Basic Delay Configuration

```typescript
// Set global default delay
// In .env.local:
EXTRACTION_DELAY_MS=5000  // 5 seconds

// Override for specific feed
await prisma.feeds.update({
  where: { id: 'feed-123' },
  data: { extractionDelayMs: 10000 }  // 10 seconds for this feed
});
```

### Example 2: Check Domain Health Before Extraction

```typescript
import { getDomainHealthScore } from '@/lib/services/extraction-metrics';
import { extractDomain } from '@/lib/services/robots-txt-parser';

const domain = extractDomain(articleUrl);
const health = await getDomainHealthScore(domain);

if (health.status === 'critical') {
  console.warn(`Domain ${domain} is unhealthy (score: ${health.score})`);
  // Consider skipping extraction or using RSS content
}
```

### Example 3: Reset Rate Limiting for Domain

```typescript
import { extractionRateLimiter } from '@/lib/services/extraction-rate-limiter';

// After fixing issues with a domain or waiting long period
await extractionRateLimiter.resetRateLimitCount('example.com');
```

### Example 4: Monitor Extraction Performance

```typescript
import { getExtractionMetrics, getProblematicDomains } from '@/lib/services/extraction-metrics';

// Daily metrics report
const metrics = await getExtractionMetrics('24h');
console.log(`
  Extraction Report (Last 24 Hours):
  - Total Attempts: ${metrics.totalAttempts}
  - Success Rate: ${metrics.successRate.toFixed(2)}%
  - Rate-Limited Domains: ${metrics.rateLimitedDomains}
  - Average Delay: ${metrics.averageDelay}ms
`);

// Check for problematic domains
const problematic = await getProblematicDomains(5);
if (problematic.length > 0) {
  console.warn('Problematic Domains:');
  problematic.forEach(d => {
    console.warn(`- ${d.domain}: ${d.failureCount} failures, ${d.rateLimitCount} rate limits (${d.severity})`);
  });
}
```

## Expected Impact

### Before Implementation
- Extractions happen immediately in rapid succession
- Same domain may receive 5-10 requests within seconds
- High risk of 429 responses and IP blocking
- No awareness of site rate limit preferences

### After Phase 1 (Basic Delays)
- Minimum 3-5 second delay between ANY extractions
- Reduces burst behavior
- **50-70% reduction in blocking likelihood**

### After Phase 1 + 2 (Smart Rate Limiting)
- Intelligent per-domain throttling
- Respects robots.txt preferences
- **80-90% reduction in blocking likelihood**
- Self-adapting to 429 responses
- Better long-term site relationships

### Performance Impact

**Extraction Speed**:
- Without rate limiting: ~20 articles/minute (if all new)
- With basic delays: ~20 articles/3s = ~400 articles/minute ÷ concurrent = realistic throughput
- With domain rate limiting: Similar throughput, but spread across domains to avoid blocking

**Note**: Most feed refreshes don't extract many articles due to duplicate detection (80-95% already exist), so the impact on overall refresh time is minimal.

## Monitoring & Debugging

### Check Domain Statistics

```bash
# Via Prisma Studio
npx prisma studio
# Navigate to domain_extraction_log table

# Or via Node.js REPL
node
> const { extractionRateLimiter } = require('./src/lib/services/extraction-rate-limiter');
> await extractionRateLimiter.getDomainStats();
```

### View Problematic Domains

```typescript
import { getProblematicDomains } from '@/lib/services/extraction-metrics';

const problematic = await getProblematicDomains(20);
console.table(problematic);
```

### Clear Rate Limit for Domain

If you've resolved issues with a domain or want to test:

```typescript
import { extractionRateLimiter } from '@/lib/services/extraction-rate-limiter';

await extractionRateLimiter.resetRateLimitCount('example.com');
```

### Clear All In-Memory Timestamps

For testing or forcing fresh delay calculations:

```typescript
import { extractionRateLimiter } from '@/lib/services/extraction-rate-limiter';

extractionRateLimiter.clearInMemoryCache();
```

## Testing

### Test Rate Limiting Manually

```bash
# 1. Set a short delay for testing
# In .env.local:
EXTRACTION_DELAY_MS=1000  # 1 second

# 2. Add a test feed with new articles
# 3. Trigger feed refresh
curl -X POST http://localhost:3000/api/jobs/refresh-feeds

# 4. Check logs for rate limiting messages:
# "[RateLimiter] Waiting Xms before extracting from domain.com"
```

### Test 429 Handling

```bash
# 1. Mock a website that returns 429 (requires test setup)
# 2. Add feed pointing to mock endpoint
# 3. Trigger extraction
# 4. Verify longer backoff in logs:
# "[BaseExtractor] 429 response with Retry-After: 30s"
```

### Test robots.txt Parsing

```typescript
import { getRobotsTxtInfo } from '@/lib/services/robots-txt-parser';

const info = await getRobotsTxtInfo('techcrunch.com');
console.log('Crawl delay:', info.crawlDelay);
console.log('Allowed:', info.allowed);
```

## Troubleshooting

### Issue: Domain Still Getting Blocked

**Possible Causes**:
1. Delay is too short for that domain
2. robots.txt crawl-delay not being respected
3. Domain requires authentication/cookies
4. Domain has very aggressive anti-bot protection

**Solutions**:
```typescript
// Increase delay for specific feed
await prisma.feeds.update({
  where: { id: feedId },
  data: { extractionDelayMs: 30000 }  // 30 seconds
});

// Or disable extraction for that feed, use RSS content only
await prisma.feeds.update({
  where: { id: feedId },
  data: {
    settings: {
      extraction: {
        method: 'rss'  // Don't extract, use RSS content
      }
    }
  }
});
```

### Issue: Extraction Too Slow

**Possible Causes**:
1. Delay is too high globally
2. Many domains with high adaptive delays

**Solutions**:
```bash
# Reduce global delay
EXTRACTION_DELAY_MS=1000  # 1 second

# Or increase feed refresh concurrency to process multiple feeds in parallel
FEED_REFRESH_CONCURRENCY=5
```

### Issue: robots.txt Not Being Respected

**Possible Causes**:
1. `EXTRACTION_RESPECT_ROBOTS_TXT=false` in environment
2. Feed has `respectRobotsTxt: false` setting
3. robots.txt fetch failing (timeout, DNS error)

**Solutions**:
```bash
# Enable globally
EXTRACTION_RESPECT_ROBOTS_TXT=true

# Check robots.txt cache
node
> const { getRobotsTxtCacheStats } = require('./src/lib/services/robots-txt-parser');
> getRobotsTxtCacheStats();

# Clear cache and retry
> const { clearRobotsTxtCache } = require('./src/lib/services/robots-txt-parser');
> clearRobotsTxtCache('example.com');
```

## Future Enhancements

### Phase 3: Advanced Queue System (Optional)
- Full extraction queue with priority
- Concurrency control (max N concurrent extractions)
- Never extract same domain simultaneously
- Background worker processes queue

### Phase 4: Additional Improvements
- User-agent rotation pool
- Proxy support for high-risk domains
- Machine learning-based delay prediction
- Per-domain extraction scheduling
- Integration with external rate limit APIs

## Related Documentation

- [Content Extraction Optimization](./guides/development/content-extraction-optimization.md) - Duplicate detection
- [Feed Health Tracking](./FEED_HEALTH_TRACKING.md) - Feed health system
- [Feed Refresh Job](../src/lib/jobs/feed-refresh-job.ts) - Cron job implementation

## API Endpoints (Future)

Potential admin endpoints for managing rate limiting:

- `GET /api/admin/extraction/metrics` - Get extraction metrics
- `GET /api/admin/extraction/domains` - List domain statistics
- `POST /api/admin/extraction/domains/:domain/reset` - Reset rate limit for domain
- `GET /api/admin/extraction/problematic` - Get problematic domains

## Maintenance

### Regular Cleanup

Run periodically to clean up old extraction logs:

```typescript
import { cleanupStaleExtractionLogs } from '@/lib/services/extraction-metrics';

// Keep last 90 days of logs
await cleanupStaleExtractionLogs(90);
```

### Monitoring Checklist

- [ ] Check extraction success rate weekly
- [ ] Review problematic domains monthly
- [ ] Clear rate limits for resolved domains
- [ ] Adjust delays based on blocking patterns
- [ ] Update robots.txt cache if sites change policies

## Summary

The Content Extraction Rate Limiting system provides **multi-layered protection** against website blocking:

1. **Basic delays** prevent burst requests
2. **Domain-aware throttling** respects per-site limits
3. **robots.txt compliance** follows site preferences
4. **Adaptive delays** learn from 429 responses
5. **Enhanced retry logic** handles rate limits gracefully
6. **Comprehensive metrics** enable monitoring and optimization

This system significantly reduces the risk of IP blocking while maintaining efficient content extraction for new articles.
