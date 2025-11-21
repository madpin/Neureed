# Cache Implementation Guide - Quick Start

This guide provides ready-to-use code for implementing the high-priority cache improvements identified in the Redis Cache Analysis.

## 🚀 Priority 1: Quick Wins (Implement First)

### 1. Update Cache Keys

First, add missing cache key definitions:

```typescript
// src/lib/cache/cache-keys.ts

export const CacheKeys = {
  // Existing keys...
  articleScore: (userId: string, articleId: string) =>
    `score:${userId}:${articleId}`,
  articleScoreBatch: (userId: string) => `scores:${userId}`,
  userPatterns: (userId: string) => `patterns:${userId}`,
  userPatternsMap: (userId: string) => `patterns:map:${userId}`,
  articleEmbedding: (articleId: string) => `embedding:${articleId}`,
  embeddingBatch: (prefix: string) => `embeddings:${prefix}`,
  
  // Enhanced semantic search key (include all parameters)
  semanticSearch: (query: string, options: {
    limit?: number;
    minScore?: number;
    feedIds?: string[];
    since?: Date;
    until?: Date;
  }) => {
    const feedsStr = options.feedIds?.sort().join(',') || 'all';
    const sinceStr = options.since?.toISOString() || '';
    const untilStr = options.until?.toISOString() || '';
    return `search:${Buffer.from(query).toString("base64").substring(0, 50)}:${options.limit || 10}:${options.minScore || 0.7}:${feedsStr}:${sinceStr}:${untilStr}`;
  },
  
  // Enhanced related articles key
  relatedArticles: (articleId: string, options: {
    limit?: number;
    minScore?: number;
    excludeSameFeed?: boolean;
  }) => {
    return `related:${articleId}:${options.limit || 10}:${options.minScore || 0.7}:${options.excludeSameFeed || false}`;
  },
  
  // NEW: User subscriptions
  userSubscriptions: (userId: string) => `subs:${userId}`,
  
  // NEW: User categories
  userCategories: (userId: string) => `categories:${userId}`,
  categoryFeeds: (userId: string, categoryId: string) => 
    `category:${userId}:${categoryId}:feeds`,
  
  // Existing LLM keys...
  articleSummary: (articleId: string) => `summary:${articleId}`,
  articleKeyPoints: (articleId: string) => `keypoints:${articleId}`,
  articleTopics: (articleId: string) => `topics:${articleId}`,
  feedMetadata: (feedId: string) => `feed:${feedId}`,
  feedArticles: (feedId: string, page: number) =>
    `feed:articles:${feedId}:${page}`,
  userPreferences: (userId: string) => `prefs:${userId}`,
  userTheme: (userId: string) => `theme:${userId}`,
  cacheStats: () => "stats:cache",
  apiMetrics: (endpoint: string) => `metrics:${endpoint}`,
};

export const CacheTTL = {
  // Ultra-short
  feedRefreshStatus: 2 * 60, // 2 minutes
  
  // Short-lived (5-15 minutes)
  userSubscriptions: 15 * 60,
  userPatterns: 15 * 60,
  feedArticles: 5 * 60,
  semanticSearch: 30 * 60,
  
  // Medium-lived (30-60 minutes)
  userCategories: 30 * 60,
  articleScore: 60 * 60,
  feedMetadata: 60 * 60,
  userPreferences: 60 * 60,
  
  // Long-lived (24 hours)
  articleEmbedding: 24 * 60 * 60,
  relatedArticles: 24 * 60 * 60,
  
  // Very long-lived (7 days)
  articleSummary: 7 * 24 * 60 * 60,
  articleKeyPoints: 7 * 24 * 60 * 60,
  articleTopics: 7 * 24 * 60 * 60,
};
```

---

### 2. Cache Semantic Search

Update the semantic search service:

```typescript
// src/lib/services/semantic-search-service.ts

import { cacheGetOrSet } from "@/lib/cache/cache-service";
import { CacheKeys, CacheTTL } from "@/lib/cache/cache-keys";

/**
 * Search for similar articles using text query
 * NOW WITH CACHING
 */
export async function searchSimilarArticles(
  query: string,
  options: SemanticSearchOptions = {},
  provider?: EmbeddingProvider
): Promise<SearchResult[]> {
  const {
    limit = 10,
    minScore = 0.7,
    feedIds,
    since,
    until,
    offset,
    page,
    recencyWeight,
    recencyDecayDays,
  } = options;

  try {
    // Generate cache key with all relevant parameters
    const cacheKey = CacheKeys.semanticSearch(query, {
      limit,
      minScore,
      feedIds,
      since,
      until,
    });

    return await cacheGetOrSet(
      cacheKey,
      async () => {
        // Original implementation
        const { embedding } = await generateEmbedding(query, provider);
        return await searchByEmbedding(embedding, {
          limit,
          minScore,
          feedIds,
          since,
          until,
          offset,
          page,
          recencyWeight,
          recencyDecayDays,
        });
      },
      CacheTTL.semanticSearch
    ) as SearchResult[];
  } catch (error) {
    logger.error("Semantic search failed", { error, query });
    throw error;
  }
}
```

---

### 3. Cache Related Articles

Update related articles function:

```typescript
// src/lib/services/semantic-search-service.ts

/**
 * Find related articles for a given article
 * NOW WITH CACHING
 */
export async function findRelatedArticles(
  articleId: string,
  options: Omit<SemanticSearchOptions, "feedIds"> & { excludeSameFeed?: boolean } = {}
): Promise<SearchResult[]> {
  const {
    limit = 10,
    minScore = 0.7,
    since,
    until,
    excludeSameFeed = false,
  } = options;

  try {
    // Generate cache key
    const cacheKey = CacheKeys.relatedArticles(articleId, {
      limit,
      minScore,
      excludeSameFeed,
    });

    return await cacheGetOrSet(
      cacheKey,
      async () => {
        // Original implementation
        const articleCheck = await prisma.$queryRaw<Array<{ id: string; feedId: string; hasEmbedding: boolean }>>`
          SELECT id, "feedId", (embedding IS NOT NULL) as "hasEmbedding"
          FROM articles
          WHERE id = ${articleId}
        `;

        if (!articleCheck || articleCheck.length === 0) {
          throw new Error("Article not found");
        }

        const article = articleCheck[0];
        if (!article.hasEmbedding) {
          throw new Error("Article has no embedding");
        }

        let query = `
          SELECT 
            a.id, a."feedId", a.title, a.content, a.url, a.guid, a.author, a.excerpt, 
            a."imageUrl", a."contentHash", a."publishedAt", a."createdAt", a."updatedAt",
            1 - (a.embedding <=> source.embedding) / 2 AS similarity
          FROM articles a
          CROSS JOIN (SELECT embedding FROM articles WHERE id = $1) source
          WHERE a.embedding IS NOT NULL
            AND a.id != $1
        `;

        const params: any[] = [articleId];
        let paramIndex = 2;

        if (excludeSameFeed) {
          query += ` AND a."feedId" != $${paramIndex}`;
          params.push(article.feedId);
          paramIndex++;
        }

        if (since) {
          query += ` AND a."publishedAt" >= $${paramIndex}::timestamp`;
          params.push(since);
          paramIndex++;
        }

        if (until) {
          query += ` AND a."publishedAt" <= $${paramIndex}::timestamp`;
          params.push(until);
          paramIndex++;
        }

        query += ` ORDER BY a.embedding <=> source.embedding LIMIT $${paramIndex}`;
        params.push(limit);

        const results = await prisma.$queryRawUnsafe<Array<articles & { similarity: number }>>(
          query,
          ...params
        );

        const filtered = results.filter((r) => r.similarity >= minScore);

        const articleIds = filtered.map((r) => r.id);
        const articlesWithFeeds = await prisma.articles.findMany({
          where: { id: { in: articleIds } },
          include: { feeds: true },
        });

        const resultsWithFeeds = filtered.map((result) => {
          const articleWithFeed = articlesWithFeeds.find((a) => a.id === result.id);
          return {
            ...result,
            feeds: articleWithFeed?.feeds,
          };
        }) as SearchResult[];

        logger.info("Found related articles", {
          articleId,
          totalResults: results.length,
          filteredResults: filtered.length,
        });

        return resultsWithFeeds;
      },
      CacheTTL.relatedArticles
    ) as SearchResult[];
  } catch (error) {
    logger.error("Failed to find related articles", { 
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      articleId 
    });
    throw error;
  }
}
```

---

### 4. Cache User Patterns

Update pattern detection service:

```typescript
// src/lib/services/pattern-detection-service.ts

import { cacheGetOrSet } from "@/lib/cache/cache-service";
import { CacheKeys, CacheTTL } from "@/lib/cache/cache-keys";

/**
 * Get user patterns as a map (for efficient scoring)
 * NOW WITH CACHING
 */
export async function getUserPatternsMap(
  userId: string
): Promise<Map<string, number>> {
  const cacheKey = CacheKeys.userPatternsMap(userId);
  
  return await cacheGetOrSet(
    cacheKey,
    async () => {
      const patterns = await getUserPatterns(userId);
      return new Map(patterns.map((p) => [p.keyword, p.weight]));
    },
    CacheTTL.userPatterns
  ) as Map<string, number>;
}
```

---

### 5. Create User Subscription Cache Service

Create a new file:

```typescript
// src/lib/services/user-subscription-cache-service.ts

import { CacheKeys, CacheTTL } from "@/lib/cache/cache-keys";
import { cacheGetOrSet, cacheDelete, cacheDeletePattern } from "@/lib/cache/cache-service";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Get user's subscribed feed IDs with caching
 */
export async function getUserFeedIdsWithCache(userId: string): Promise<string[]> {
  const cacheKey = CacheKeys.userSubscriptions(userId);
  
  return await cacheGetOrSet(
    cacheKey,
    async () => {
      const subscriptions = await prisma.user_feeds.findMany({
        where: { 
          userId, 
          isSubscribed: true 
        },
        select: { feedId: true },
      });
      
      const feedIds = subscriptions.map(s => s.feedId);
      
      logger.info("Fetched user subscriptions from DB", {
        userId,
        count: feedIds.length,
      });
      
      return feedIds;
    },
    CacheTTL.userSubscriptions
  ) as string[];
}

/**
 * Invalidate user subscription cache
 * Call this when user subscribes/unsubscribes
 */
export async function invalidateUserSubscriptions(userId: string): Promise<void> {
  const cacheKey = CacheKeys.userSubscriptions(userId);
  await cacheDelete(cacheKey);
  
  logger.info("Invalidated user subscriptions cache", { userId });
}

/**
 * Get user subscriptions with full feed details (cached)
 */
export async function getUserSubscriptionsWithCache(userId: string) {
  // We can cache the full subscription list
  const cacheKey = `user:${userId}:full-subscriptions`;
  
  return await cacheGetOrSet(
    cacheKey,
    async () => {
      return await prisma.user_feeds.findMany({
        where: { 
          userId, 
          isSubscribed: true 
        },
        include: {
          feeds: true,
        },
      });
    },
    CacheTTL.userSubscriptions
  );
}
```

---

### 6. Update Articles API to Use Cached Subscriptions

```typescript
// app/api/articles/route.ts

import { getUserFeedIdsWithCache } from "@/lib/services/user-subscription-cache-service";

export const GET = createHandler(
  async ({ query }) => {
    const { page = 1, limit = 20, feedId, categoryId, sortBy, sortDirection } = query as any;

    const user = await getCurrentUser();
    
    let finalSortBy: "publishedAt" | "relevance" | "title" | "feed" | "updatedAt" = (sortBy as any) || "publishedAt";
    let finalSortDirection: "asc" | "desc" = (sortDirection as any) || "desc";
    
    if (user?.id && !sortBy) {
      const userPrefs = await prisma.user_preferences.findUnique({
        where: { userId: user.id },
        select: { articleSortOrder: true, articleSortDirection: true },
      });
      
      if (userPrefs) {
        finalSortBy = userPrefs.articleSortOrder as typeof finalSortBy;
        finalSortDirection = userPrefs.articleSortDirection as typeof finalSortDirection;
      }
    }
    
    let articles, total;
    
    if (user?.id) {
      // USE CACHED SUBSCRIPTIONS
      let subscribedFeedIds = await getUserFeedIdsWithCache(user.id);
      
      // Rest of implementation...
    }
    
    // ... rest of handler
  },
  { querySchema: articleQuerySchema }
);
```

---

### 7. Invalidate Cache on User Actions

Update subscription endpoints:

```typescript
// app/api/user/feeds/route.ts

import { invalidateUserSubscriptions } from "@/lib/services/user-subscription-cache-service";

/**
 * POST /api/user/feeds
 * Subscribe to a feed
 */
export const POST = createHandler(
  async ({ body, session }) => {
    const userId = session!.user.id;
    const { feedId } = body;

    // ... subscription logic ...

    // INVALIDATE CACHE
    await invalidateUserSubscriptions(userId);

    return { success: true, userFeed };
  },
  { bodySchema: subscribeSchema, requireAuth: true }
);
```

```typescript
// app/api/user/feeds/[userFeedId]/route.ts

/**
 * DELETE /api/user/feeds/{userFeedId}
 * Unsubscribe from feed
 */
export const DELETE = createHandler(
  async ({ params, session }) => {
    const userId = session!.user.id;
    const { userFeedId } = params;

    // ... unsubscribe logic ...

    // INVALIDATE CACHE
    await invalidateUserSubscriptions(userId);

    return { success: true };
  },
  { requireAuth: true }
);
```

---

### 8. Fix Inefficient Pattern Deletion (CRITICAL)

Replace the current implementation:

```typescript
// src/lib/cache/cache-service.ts

/**
 * Delete multiple keys matching a pattern (NON-BLOCKING)
 * Uses SCAN instead of KEYS to avoid blocking Redis
 */
export async function cacheDeletePattern(pattern: string): Promise<number> {
  const client = getRedisClient();
  if (!client) {
    return 0;
  }

  try {
    let cursor = 0;
    let totalDeleted = 0;
    const matchPattern = pattern.includes('*') ? pattern : `*${pattern}*`;
    
    do {
      // Use SCAN instead of KEYS to avoid blocking
      const reply = await client.scan(
        cursor,
        'MATCH', matchPattern,
        'COUNT', 100  // Process in batches of 100
      );
      
      cursor = parseInt(reply[0]);
      const keys = reply[1];
      
      if (keys.length > 0) {
        const deleted = await client.del(...keys);
        totalDeleted += deleted;
        stats.deletes += deleted;
      }
    } while (cursor !== 0);
    
    if (totalDeleted > 0) {
      logger.info("Cache pattern deleted", {
        pattern: matchPattern,
        deleted: totalDeleted,
      });
    }
    
    return totalDeleted;
  } catch (error) {
    stats.errors++;
    logger.error("Cache delete pattern error", { pattern, error });
    return 0;
  }
}
```

---

## 🧪 Testing Your Changes

### 1. Test Semantic Search Caching

```typescript
// scripts/test-semantic-search-cache.ts

import { searchSimilarArticles } from "@/src/lib/services/semantic-search-service";
import { getCacheStats } from "@/src/lib/cache/cache-service";

async function testSemanticSearchCache() {
  console.log("Testing semantic search caching...\n");
  
  // First search (should miss cache)
  console.time("First search (cache miss)");
  const results1 = await searchSimilarArticles("artificial intelligence", {
    limit: 10,
    minScore: 0.7,
  });
  console.timeEnd("First search (cache miss)");
  console.log(`Found ${results1.length} results\n`);
  
  // Second search (should hit cache)
  console.time("Second search (cache hit)");
  const results2 = await searchSimilarArticles("artificial intelligence", {
    limit: 10,
    minScore: 0.7,
  });
  console.timeEnd("Second search (cache hit)");
  console.log(`Found ${results2.length} results\n`);
  
  // Check cache stats
  const stats = getCacheStats();
  console.log("Cache stats:", stats);
  console.log(`\nExpected: ~50% hit rate after two queries`);
}

testSemanticSearchCache();
```

Run with: `npx tsx scripts/test-semantic-search-cache.ts`

---

### 2. Test Related Articles Caching

```typescript
// scripts/test-related-articles-cache.ts

import { findRelatedArticles } from "@/src/lib/services/semantic-search-service";
import { prisma } from "@/src/lib/db";

async function testRelatedArticlesCache() {
  // Get a random article ID
  const article = await prisma.articles.findFirst({
    where: { embedding: { not: null } },
    select: { id: true, title: true },
  });
  
  if (!article) {
    console.log("No articles with embeddings found");
    return;
  }
  
  console.log(`Testing with article: ${article.title}\n`);
  
  // First call (cache miss)
  console.time("First call (cache miss)");
  const results1 = await findRelatedArticles(article.id, { limit: 5 });
  console.timeEnd("First call (cache miss)");
  console.log(`Found ${results1.length} related articles\n`);
  
  // Second call (cache hit)
  console.time("Second call (cache hit)");
  const results2 = await findRelatedArticles(article.id, { limit: 5 });
  console.timeEnd("Second call (cache hit)");
  console.log(`Found ${results2.length} related articles\n`);
  
  console.log("Cache hit should be 95%+ faster!");
}

testRelatedArticlesCache();
```

---

### 3. Monitor Cache Effectiveness

Add to admin dashboard or create monitoring endpoint:

```typescript
// app/api/admin/cache/effectiveness/route.ts

import { createHandler } from "@/lib/api-handler";
import { getCacheStats } from "@/lib/cache/cache-service";
import { getRedisClient } from "@/lib/cache/redis-client";

export const GET = createHandler(
  async () => {
    const stats = getCacheStats();
    const client = getRedisClient();
    
    if (!client) {
      return { error: "Redis not available" };
    }
    
    // Get key count by prefix
    const prefixes = [
      'score:', 'search:', 'related:', 'patterns:', 
      'subs:', 'feed:', 'summary:', 'categories:'
    ];
    
    const keyBreakdown: Record<string, number> = {};
    
    for (const prefix of prefixes) {
      let count = 0;
      let cursor = 0;
      
      do {
        const reply = await client.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
        cursor = parseInt(reply[0]);
        count += reply[1].length;
      } while (cursor !== 0);
      
      keyBreakdown[prefix] = count;
    }
    
    const totalKeys = Object.values(keyBreakdown).reduce((a, b) => a + b, 0);
    
    return {
      stats,
      keyBreakdown,
      totalKeys,
      recommendations: generateRecommendations(stats, keyBreakdown),
    };
  },
  { requireAdmin: true }
);

function generateRecommendations(
  stats: any,
  keyBreakdown: Record<string, number>
) {
  const recommendations = [];
  
  if (stats.hitRate < 40) {
    recommendations.push({
      level: "warning",
      message: "Cache hit rate is low (<40%). Consider increasing TTLs or checking cache key consistency.",
    });
  }
  
  if (stats.errors > stats.hits * 0.05) {
    recommendations.push({
      level: "error",
      message: "High error rate (>5%). Check Redis connection and logs.",
    });
  }
  
  if (keyBreakdown['search:'] === 0) {
    recommendations.push({
      level: "info",
      message: "Semantic search caching not active yet. Implement for major performance gains.",
    });
  }
  
  return recommendations;
}
```

---

## 📊 Measuring Success

After implementing these changes, monitor these metrics:

### Before vs After Comparison

Create a simple script to measure:

```typescript
// scripts/benchmark-cache.ts

interface BenchmarkResult {
  operation: string;
  before: number;
  after: number;
  improvement: number;
}

async function benchmarkOperations() {
  const results: BenchmarkResult[] = [];
  
  // Benchmark semantic search
  const searchBefore = await measureOperation(async () => {
    // Simulate no cache by clearing it first
    await cacheDelete(CacheKeys.semanticSearch("test query", { limit: 10 }));
    return await searchSimilarArticles("test query", { limit: 10 });
  });
  
  const searchAfter = await measureOperation(async () => {
    return await searchSimilarArticles("test query", { limit: 10 });
  });
  
  results.push({
    operation: "Semantic Search",
    before: searchBefore,
    after: searchAfter,
    improvement: ((searchBefore - searchAfter) / searchBefore) * 100,
  });
  
  // Display results
  console.table(results);
}

async function measureOperation(fn: () => Promise<any>): Promise<number> {
  const start = Date.now();
  await fn();
  return Date.now() - start;
}
```

---

## 🚨 Rollback Plan

If you encounter issues:

1. **Disable caching per feature:**
   ```typescript
   // Temporary flag in env
   CACHE_SEMANTIC_SEARCH=false
   CACHE_RELATED_ARTICLES=false
   ```

2. **Clear all cache:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/cache/clear
   ```

3. **Revert individual services:**
   - Remove `cacheGetOrSet` wrapper
   - Return to direct implementation

---

## ✅ Implementation Checklist

- [ ] Update cache keys in `cache-keys.ts`
- [ ] Implement semantic search caching
- [ ] Implement related articles caching
- [ ] Implement user patterns caching
- [ ] Create user subscription cache service
- [ ] Update articles API to use cached subscriptions
- [ ] Add cache invalidation to subscription endpoints
- [ ] Fix pattern deletion (SCAN instead of KEYS)
- [ ] Test each implementation with provided scripts
- [ ] Monitor cache hit rates in production
- [ ] Document TTL decisions for your team

---

## 🎯 Expected Results

After completing Priority 1 implementations:

- **Semantic Search:** 200-500ms → 5-10ms (95%+ faster)
- **Related Articles:** 100-200ms → 2-5ms (95%+ faster)
- **User Patterns:** 50-100ms → 2-5ms (95%+ faster)
- **Subscriptions:** 20-50ms → 2-3ms (90%+ faster)
- **Overall Cache Hit Rate:** 60-80%
- **Database Load:** 60-70% reduction

---

## 📞 Need Help?

If you encounter issues during implementation:

1. Check Redis connection: `docker-compose logs redis`
2. Verify cache stats: `GET /api/admin/cache/stats`
3. Check application logs for cache errors
4. Test cache operations manually with Redis CLI:
   ```bash
   docker exec -it neureed-redis redis-cli
   > KEYS search:*
   > GET search:somekey
   > TTL search:somekey
   ```

Happy caching! 🚀

