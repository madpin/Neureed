# Saved Search Performance Guide

## Overview

This guide covers performance optimizations implemented for the Saved Searches feature, including caching strategies, batch processing, and database optimizations.

---

## Performance Optimizations

### 1. Caching Layer

The saved search cache service provides multi-level caching:

#### Query AST Caching
- **Purpose**: Avoid re-parsing the same query multiple times
- **TTL**: 24 hours
- **Key**: `saved-search:ast:{base64(query)}`
- **Benefit**: Reduces parsing overhead by ~80%

#### Search Results Caching
- **Purpose**: Cache recent search results for quick retrieval
- **TTL**: 5 minutes
- **Key**: `saved-search:results:{searchId}:{userId}`
- **Benefit**: Reduces database queries for frequently accessed searches

#### Match Count Caching
- **Purpose**: Cache match counts to avoid expensive COUNT queries
- **TTL**: 30 minutes
- **Key**: `saved-search:count:{searchId}`
- **Benefit**: Speeds up statistics displays

#### Insights Caching
- **Purpose**: Cache computed analytics and insights
- **TTL**: 1 hour
- **Key**: `saved-search:insights:{userId}`
- **Benefit**: Reduces complex aggregation queries

### 2. Batch Processing

#### Chunked Processing
```typescript
// Process 100 articles at a time
batchSize = 100
```

- Articles are processed in chunks to avoid memory issues
- Prevents overwhelming the database with too many concurrent queries

#### Parallel Execution
```typescript
// Run up to 5 searches concurrently
maxConcurrent = 5
```

- Searches are executed in parallel for better throughput
- Rate limiting prevents resource exhaustion

#### Progressive Checkpointing
```typescript
const processor = new ProgressiveBatchProcessor();
await processor.processWithCheckpoints(items, handler, {
  checkpointKey: 'batch-001',
  batchSize: 100,
});
```

- Checkpoints allow resuming failed batches
- Essential for processing large article backlogs

### 3. Database Optimizations

#### Existing Indexes

The schema already includes these indexes:

```sql
-- Saved searches
@@index([userId])
@@index([userId, archived])

-- Saved search matches
@@unique([savedSearchId, articleId])
@@index([savedSearchId, relevanceScore])
@@index([articleId])
@@index([createdAt])
```

#### Recommended Additional Indexes

For even better performance, consider adding:

```sql
-- Compound index for common filtering
CREATE INDEX idx_matches_search_score_date
  ON saved_search_matches(savedSearchId, relevanceScore DESC, createdAt DESC);

-- Index for notification queries
CREATE INDEX idx_matches_notified
  ON saved_search_matches(savedSearchId, notified, createdAt DESC)
  WHERE notified = false;

-- Index for user search queries
CREATE INDEX idx_searches_user_active
  ON saved_searches(userId, archived, lastMatchedAt DESC)
  WHERE archived = false;
```

#### Query Optimization Tips

**Avoid N+1 Queries**
```typescript
// Bad: N+1 queries
const searches = await prisma.saved_searches.findMany();
for (const search of searches) {
  const matches = await prisma.saved_search_matches.findMany({
    where: { savedSearchId: search.id },
  });
}

// Good: Single query with includes
const searches = await prisma.saved_searches.findMany({
  include: {
    matches: {
      take: 100,
      orderBy: { relevanceScore: 'desc' },
    },
  },
});
```

**Use Pagination**
```typescript
// Always paginate large result sets
const matches = await prisma.saved_search_matches.findMany({
  where: { savedSearchId },
  take: limit,
  skip: offset,
  orderBy: { relevanceScore: 'desc' },
});
```

**Select Only Required Fields**
```typescript
// Avoid selecting large fields when not needed
const matches = await prisma.saved_search_matches.findMany({
  select: {
    id: true,
    relevanceScore: true,
    createdAt: true,
    // Don't select matchReason if not displaying it
  },
});
```

### 4. Vector Search Optimization

#### HNSW Index Maintenance

For optimal pgvector performance:

```sql
-- Reindex periodically (weekly recommended)
REINDEX INDEX articles_embedding_idx;

-- Vacuum to reclaim space
VACUUM ANALYZE articles;
```

#### Embedding Query Optimization

```typescript
// Use appropriate M and ef_search parameters
CREATE INDEX ON articles USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- For searches, adjust ef_search
SET hnsw.ef_search = 100; -- Higher = more accurate but slower
```

#### Batch Embedding Generation

When generating embeddings for many articles:

```typescript
// Process in batches to avoid rate limits
const batchSize = 100;
for (let i = 0; i < articles.length; i += batchSize) {
  const batch = articles.slice(i, i + batchSize);
  await generateEmbeddings(batch);
  await sleep(1000); // Rate limiting
}
```

### 5. Frontend Optimizations

#### Lazy Loading

```typescript
// Load articles as user scrolls
import { useInfiniteQuery } from '@tanstack/react-query';

const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['saved-search-articles', searchId],
  queryFn: ({ pageParam = 0 }) =>
    fetchArticles({ offset: pageParam, limit: 20 }),
  getNextPageParam: (lastPage, pages) =>
    lastPage.hasMore ? pages.length * 20 : undefined,
});
```

#### Virtualization

For large lists:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: articles.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 100, // Estimated row height
});
```

#### Debounced Query Input

```typescript
import { useDebouncedValue } from '@/hooks/use-debounced-value';

const [query, setQuery] = useState('');
const debouncedQuery = useDebouncedValue(query, 500);

// Use debouncedQuery for API calls
```

#### Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: createSavedSearch,
  onMutate: async (newSearch) => {
    // Optimistically update UI
    await queryClient.cancelQueries(['saved-searches']);
    const previous = queryClient.getQueryData(['saved-searches']);

    queryClient.setQueryData(['saved-searches'], (old) =>
      [...old, { ...newSearch, id: 'temp' }]
    );

    return { previous };
  },
  onError: (err, newSearch, context) => {
    // Rollback on error
    queryClient.setQueryData(['saved-searches'], context.previous);
  },
});
```

### 6. Monitoring & Metrics

#### Key Metrics to Track

1. **Query Parsing Time**
   - Target: < 50ms per query
   - Alert if > 200ms

2. **Search Execution Time**
   - Target: < 500ms for typical search
   - Alert if > 2 seconds

3. **Batch Matching Throughput**
   - Target: > 1000 articles/minute
   - Alert if < 500 articles/minute

4. **Cache Hit Rate**
   - Target: > 60% for results cache
   - Alert if < 40%

5. **Database Query Time**
   - Target: < 100ms for match queries
   - Alert if > 500ms

#### Logging Performance Data

```typescript
const startTime = Date.now();
const results = await executeSearch(query, options);
const duration = Date.now() - startTime;

logger.info('Search executed', {
  query: query.substring(0, 50),
  duration,
  resultCount: results.length,
  threshold: options.threshold,
});

// Alert if slow
if (duration > 2000) {
  logger.warn('Slow search detected', {
    query,
    duration,
  });
}
```

#### Cache Statistics Dashboard

```typescript
import { getCacheStats } from '@/lib/services/saved-search-cache-service';

const stats = await getCacheStats();
console.log(`Total cached keys: ${stats.totalKeys}`);
console.log(`Memory usage: ${stats.memoryUsage}`);
console.log('Keys by prefix:', stats.keysByPrefix);
```

---

## Performance Testing

### Load Testing

Use k6 or Apache Bench to simulate concurrent users:

```javascript
// k6 script
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function () {
  const res = http.get('http://localhost:3000/api/saved-searches');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### Benchmarking

```typescript
// Run benchmark for batch processing
console.time('Batch processing');
const result = await batchMatchArticles(articleIds, searchIds, {
  batchSize: 100,
  maxConcurrent: 5,
});
console.timeEnd('Batch processing');

console.log(`Processed ${result.totalProcessed} articles`);
console.log(`Created ${result.totalMatches} matches`);
console.log(`Duration: ${result.duration}ms`);
console.log(`Throughput: ${(result.totalProcessed / result.duration * 1000).toFixed(0)} articles/sec`);
```

---

## Troubleshooting Performance Issues

### Slow Queries

1. **Check EXPLAIN output**:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM saved_search_matches
   WHERE savedSearchId = 'xxx'
   ORDER BY relevanceScore DESC
   LIMIT 50;
   ```

2. **Verify indexes are being used**:
   Look for "Index Scan" in EXPLAIN output

3. **Check for table bloat**:
   ```sql
   SELECT schemaname, tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
   FROM pg_tables
   WHERE tablename LIKE 'saved_search%';
   ```

### High Cache Miss Rate

1. **Check TTL settings**: May be too short
2. **Monitor invalidation patterns**: Excessive invalidations
3. **Review cache key generation**: Ensure consistent keys

### Memory Issues

1. **Reduce batch sizes**
2. **Implement streaming for large result sets**
3. **Use database cursors for pagination**

### Vector Search Slowness

1. **Reindex HNSW**: `REINDEX INDEX articles_embedding_idx;`
2. **Adjust ef_search**: Balance accuracy vs speed
3. **Consider dimension reduction**: Use smaller embeddings

---

## Best Practices

1. **Always use pagination** for article lists
2. **Cache aggressively** but invalidate intelligently
3. **Batch operations** when processing multiple items
4. **Monitor and alert** on performance regressions
5. **Regular maintenance**: Reindex, vacuum, analyze
6. **Test at scale**: Load test with realistic data volumes
7. **Optimize frontend**: Lazy load, virtualize, debounce
8. **Use connection pooling**: For database connections
9. **Implement rate limiting**: Protect against abuse
10. **Profile regularly**: Identify bottlenecks early

---

## Future Optimizations

1. **Materialized Views**: Pre-compute common aggregations
2. **Read Replicas**: Offload read queries
3. **Full-Text Search**: PostgreSQL FTS for faster keyword matching
4. **Query Result Streaming**: For very large result sets
5. **Worker Queue**: Offload matching to background jobs
6. **CDN Caching**: For static template data
7. **Database Sharding**: If user base grows significantly
8. **Elasticsearch Integration**: For advanced search features
