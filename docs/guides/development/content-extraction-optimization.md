# Content Extraction Optimization

## Overview

NeuReed implements an important optimization in the feed refresh process to prevent wasting resources on duplicate articles. When a feed has content extraction enabled (Readability, Playwright, etc.), the system now checks if an article already exists in the database **before** performing the expensive content extraction operation.

## Problem Statement

### Before Optimization

Prior to this optimization, the feed refresh process worked like this:

1. Parse RSS feed (returns, e.g., 20 articles)
2. **For EACH article, extract content** using Readability/Playwright (CPU & network intensive)
3. Check if article already exists in database
4. Skip duplicate articles

**Issue**: Most RSS feeds include articles that were already imported in previous refreshes. Extracting content for all 20 articles when only 1-2 are new wastes significant resources:

- **CPU**: Readability parsing is computationally expensive
- **Network**: Fetching full article HTML uses bandwidth
- **Time**: Extraction can take 1-5 seconds per article
- **Risk**: High request rate can trigger rate limiting or IP blocking from target sites

### Example Impact

A typical feed refresh scenario:
- Feed has 20 articles in RSS
- Only 2 are new since last refresh
- **Before**: 20 extraction requests (18 wasted)
- **After**: 2 extraction requests (90% reduction)

## Solution: Duplicate Detection Before Extraction

### Implementation

The optimized flow in `feed-refresh-service.ts`:

```typescript
// If feed has extraction settings and method is not RSS, try content extraction
// Only extract content for NEW articles to avoid wasting resources
if (settings && settings.method !== "rss") {
  logger.info(`[FeedRefresh] Feed ${feedId} has extraction settings, checking for new articles`);
  
  const mergeStrategy = settings.contentMergeStrategy || "replace";
  
  try {
    // Import deduplication functions
    const { findDuplicateArticle } = await import("./article-deduplication");
    
    // Try to extract content for each article
    for (const article of parsedFeed.items) {
      if (article.link) {
        // ✅ Check if article already exists BEFORE extracting content
        const existing = await findDuplicateArticle(article, feedId);
        
        if (existing) {
          logger.info(`[FeedRefresh] Article already exists, skipping extraction: ${article.title}`);
          continue; // Skip extraction for duplicate
        }
        
        // Only extract content for NEW articles
        logger.info(`[FeedRefresh] New article detected, extracting content: ${article.title}`);
        const extracted = await extractContent(article.link, feedId);
        
        // ... apply extracted content to article
      }
    }
  } catch (error) {
    logger.error(`[FeedRefresh] Content extraction error: ${error}`);
  }
}
```

### Deduplication Strategy

The `findDuplicateArticle()` function uses a three-level strategy:

1. **GUID matching** (most reliable) - RSS items have unique GUIDs
2. **URL matching** (secondary) - Match by article URL
3. **Content hash** (fallback) - For articles without GUID

This ensures robust duplicate detection before any extraction occurs.

## Benefits

### 1. Resource Efficiency

**CPU Savings:**
- No Readability parsing for existing articles
- Reduces server load during feed refreshes
- Allows more feeds to be refreshed concurrently

**Network Savings:**
- Eliminates unnecessary HTTP requests to article pages
- Reduces bandwidth usage
- Lowers hosting costs

### 2. Reliability

**Rate Limiting Protection:**
- Many websites limit request frequency
- Reduces request rate by 80-95% for typical feeds
- Prevents IP blocking and 429 errors

**Faster Refreshes:**
- Feed refresh completes in seconds instead of minutes
- Better user experience
- More responsive system

### 3. Scalability

**Supports More Users:**
- Lower per-feed resource cost
- Can handle more feeds per server
- Better performance under load

**Better Concurrency:**
- Faster per-feed refresh allows higher concurrency
- Configurable via `FEED_REFRESH_CONCURRENCY` environment variable

## Testing

### Automated Test

Run the automated test to verify the optimization:

```bash
npx tsx scripts/tests/test-duplicate-extraction-skip.ts
```

This test:
1. Creates a feed with extraction settings
2. Inserts an existing article
3. Refreshes the feed
4. Verifies extraction was NOT called for the existing article
5. Confirms extraction WAS called for new articles only

### Manual Testing

**Setup:**
1. Create a feed with Readability or Playwright extraction enabled
2. Import articles from the feed (first refresh)
3. Enable debug logging: `DEBUG=neureed:* npm run dev`

**Test:**
1. Refresh the feed again (second refresh)
2. Check logs for messages like:
   ```
   [FeedRefresh] Article already exists, skipping extraction: Article Title
   ```
3. Verify only NEW articles show:
   ```
   [FeedRefresh] New article detected, extracting content: New Article
   ```

## Monitoring

### Log Messages

Key log messages to monitor:

```typescript
// Duplicate detected (extraction skipped)
[FeedRefresh] Article already exists, skipping extraction: ${title}

// New article (extraction performed)
[FeedRefresh] New article detected, extracting content: ${title}

// Extraction successful
[FeedRefresh] Successfully extracted content for article: ${title}
```

### Metrics to Track

Monitor these metrics in production:

1. **Extraction Rate**: Number of extractions per feed refresh
   - Expected: 0-5 for most feeds
   - Alert if consistently high (10+)

2. **Refresh Duration**: Time to refresh feed
   - Expected: < 30 seconds for most feeds
   - Higher for feeds with many new articles

3. **Error Rate**: Failed extractions
   - Expected: < 5% of attempts
   - Investigate if > 10%

## Related Files

**Core Implementation:**
- `src/lib/services/feed-refresh-service.ts` - Feed refresh with duplicate check
- `src/lib/services/article-deduplication.ts` - Duplicate detection logic
- `src/lib/services/content-extraction-service.ts` - Content extraction orchestration

**Tests:**
- `scripts/tests/test-duplicate-extraction-skip.ts` - Automated test

**Documentation:**
- `CLAUDE.md` - Architecture reference (Content Extraction section)
- This file - Detailed optimization guide

## Future Improvements

### Batch Duplicate Checking

Currently, duplicate checking happens per-article in a loop. Future optimization:

```typescript
// Check all articles at once
const articleUrls = parsedFeed.items.map(a => a.link);
const existingUrls = await findDuplicateArticlesBatch(articleUrls, feedId);
const newArticles = parsedFeed.items.filter(a => !existingUrls.has(a.link));

// Only extract content for new articles
for (const article of newArticles) {
  await extractContent(article.link, feedId);
}
```

This would reduce database queries from N to 1 per feed refresh.

### Conditional Extraction

Add user preference to control extraction behavior:

- **Always extract**: Re-extract content even for existing articles (current behavior for updates)
- **New only**: Only extract for new articles (current default)
- **Scheduled**: Re-extract old articles on a schedule (e.g., weekly)

### Extraction Caching

Cache extraction results for a period (e.g., 7 days):

```typescript
const cacheKey = `extraction:${sha256(url)}`;
const cached = await cache.get(cacheKey);

if (cached) {
  return cached;
}

const extracted = await extractContent(url, feedId);
await cache.set(cacheKey, extracted, 7 * 24 * 60 * 60); // 7 days
```

This would help for articles that appear in multiple feeds.

## Troubleshooting

### Articles Not Being Extracted

**Symptom**: New articles show without extracted content, only RSS content

**Causes:**
1. Feed doesn't have extraction settings configured
2. Extraction method set to "rss" (no extraction)
3. Extraction failing but falling back to RSS content

**Solution:**
1. Check feed settings: `settings.extraction.method` should be "readability" or "playwright"
2. Check logs for extraction errors
3. Test extraction manually: `POST /api/feeds/[id]/test-extraction`

### High Extraction Rate

**Symptom**: Feed consistently extracts content for many articles

**Causes:**
1. Feed has poor GUID stability (GUIDs change between refreshes)
2. URLs change frequently (redirects, query params)
3. Feed interval is too long (many new articles accumulate)

**Solution:**
1. Check duplicate detection logs
2. Consider using content hash for this feed
3. Reduce refresh interval to catch articles earlier

### Extraction Takes Too Long

**Symptom**: Feed refresh times out or takes minutes

**Causes:**
1. Too many new articles at once
2. Target site is slow to respond
3. Playwright extraction overhead

**Solution:**
1. Reduce refresh interval to process fewer articles per run
2. Increase timeout: `settings.extraction.timeout`
3. Try Readability instead of Playwright (much faster)

## Configuration Reference

### Feed Extraction Settings

```typescript
{
  "extraction": {
    "method": "readability" | "playwright" | "custom" | "rss",
    "contentMergeStrategy": "replace" | "prepend" | "append",
    "timeout": 30000,  // milliseconds
    "cookies": { "value": "encrypted_cookie_string" },
    "headers": { "User-Agent": "Custom UA" },
    "customSelector": ".article-content"
  }
}
```

### Environment Variables

- `FEED_REFRESH_CONCURRENCY` - Number of concurrent feed refreshes (default: 3)
- `EXTRACTION_TIMEOUT` - Global extraction timeout in ms (default: 30000)
- `ENABLE_EXTRACTION` - Enable/disable content extraction globally (default: true)

## See Also

- [Feed Management Architecture](../../../CLAUDE.md#feed-management)
- [Article Deduplication Service](../../../src/lib/services/article-deduplication.ts)
- [Content Extraction Service](../../../src/lib/services/content-extraction-service.ts)
- [Feed Refresh Service](../../../src/lib/services/feed-refresh-service.ts)

