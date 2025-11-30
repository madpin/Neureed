# Saved Searches - Technical Specification

**Status:** Production-ready
**Last Updated:** November 2025

## Overview

Saved Searches enable users to create persistent, dynamic feeds based on custom search criteria. The system combines semantic search (vector embeddings) with keyword matching to continuously monitor articles across all subscribed feeds.

---

## Core Features

### Search Query Syntax

**Basic Operations:**
- `AI` - Semantic similarity search
- `AI, machine learning` - OR logic (comma-separated)
- `AI +regulation` - AND logic (+ prefix for required terms)
- `llama -animal` - NOT logic (- prefix for exclusions)
- `"large language model"` - Exact phrase matching
- `(Anthropic, OpenAI) +ethics` - Grouped expressions

**Advanced Patterns:**
- Nested grouping: `(term1, term2) +(group1, group2) -exclude`
- Phrase matching with operators: `"exact phrase" +required -excluded`
- Complex boolean logic with multiple levels of nesting

### Architecture

**Components:**
1. **Query Parser** ([search-query-parser.ts](../../../src/lib/services/search-query-parser.ts))
   - Parses query syntax into AST (Abstract Syntax Tree)
   - Validates query structure
   - Handles operator precedence

2. **Search Execution** ([saved-search-execution.ts](../../../src/lib/services/saved-search-execution.ts))
   - Executes queries against article database
   - Combines semantic + keyword matching
   - Scores articles for relevance (0-1 scale)

3. **Matcher Service** ([saved-search-matcher.ts](../../../src/lib/services/saved-search-matcher.ts))
   - Automatically matches new articles
   - Batch processing (100 articles/batch, 5 concurrent searches)
   - High-relevance notifications (>0.85 threshold)

4. **Cache Service** ([saved-search-cache-service.ts](../../../src/lib/services/saved-search-cache-service.ts))
   - Multi-level caching (query AST, results)
   - 24h TTL for parsed queries
   - 5-minute TTL for search results

5. **Batch Processor** ([saved-search-batch-processor.ts](../../../src/lib/services/saved-search-batch-processor.ts))
   - Efficient batch matching
   - Parallel execution
   - Error handling and retry logic

---

## Database Schema

### saved_searches Table
```sql
- id: UUID (primary key)
- userId: String (foreign key)
- name: String (user-defined label)
- query: String (search syntax)
- settings: JSON (threshold, notifications, etc.)
- createdAt: DateTime
- updatedAt: DateTime
```

### saved_search_matches Table
```sql
- id: UUID (primary key)
- savedSearchId: UUID (foreign key)
- articleId: String (foreign key)
- relevanceScore: Float (0-1)
- matchReasons: JSON (why it matched)
- createdAt: DateTime

Indexes:
- (savedSearchId, relevanceScore)
- (savedSearchId, articleId) [unique]
```

---

## Performance

### Benchmarks
- **Query Parsing:** <10ms average (80% cache hit rate)
- **Search Execution:** 50-200ms depending on corpus size
- **Batch Processing:** 1000+ articles/minute
- **Cache Hit Rate:** 80%+ for parsed queries
- **Vector Search:** HNSW index enables <100ms similarity search

### Optimization Strategies
1. **Query AST Caching** - 24h TTL, reduces parsing time by 80%
2. **Batch Processing** - Process 100 articles at once
3. **Concurrent Execution** - 5 searches run in parallel
4. **Result Caching** - 5-minute TTL for frequently accessed searches
5. **Compound Indexes** - Fast retrieval by relevance and ID

---

## Integration Points

### Feed Refresh Job
- Automatically triggers matching for new articles
- Batch processes articles per feed
- Creates notifications for high-relevance matches (>0.85)

### User Interface
- Saved searches appear alongside regular feeds in sidebar
- Visual relevance indicators (0-100% scale)
- Real-time updates as new articles arrive
- Mobile-optimized with offline support

### Notifications
- Created for high-relevance matches (>0.85 score)
- Grouped by saved search
- Includes match reasons and article preview

---

## API Routes

### CRUD Operations
- `POST /api/saved-searches` - Create new saved search
- `GET /api/saved-searches` - List user's saved searches
- `GET /api/saved-searches/:id` - Get specific saved search
- `PATCH /api/saved-searches/:id` - Update saved search
- `DELETE /api/saved-searches/:id` - Delete saved search

### Search Operations
- `GET /api/saved-searches/:id/articles` - Get matched articles
- `POST /api/saved-searches/:id/rematch` - Trigger re-matching
- `POST /api/saved-searches/preview` - Preview search results

### Utilities
- `GET /api/saved-searches/templates` - Get query templates
- `GET /api/saved-searches/:id/insights` - Get match statistics

---

## Testing

- **60+ unit tests** covering parser, execution, matching, templates
- **Integration tests** for end-to-end workflows
- **Performance benchmarks** validated
- **See:** [TESTING_SAVED_SEARCHES.md](TESTING_SAVED_SEARCHES.md)

---

## User Documentation

- **[User Guide](USER_GUIDE_SAVED_SEARCHES.md)** - How to create and use saved searches
- **[Performance Guide](SAVED_SEARCH_PERFORMANCE_GUIDE.md)** - Optimization tips and best practices

---

## Implementation Details

### Query Parser Logic
The parser converts user queries into an AST structure:
```typescript
type QueryNode =
  | { type: 'TERM', value: string, operator?: '+' | '-' }
  | { type: 'PHRASE', value: string, operator?: '+' | '-' }
  | { type: 'GROUP', children: QueryNode[], operator?: '+' | '-' }
  | { type: 'OR', children: QueryNode[] }
```

### Scoring Algorithm
```typescript
finalScore = (
  semanticWeight * vectorSimilarity +
  keywordWeight * keywordMatch +
  requiredTermBonus
) * excludedTermPenalty
```

Where:
- `vectorSimilarity`: Cosine similarity (0-1)
- `keywordMatch`: Exact/partial keyword matches (0-1)
- `requiredTermBonus`: 1.2x multiplier if all required terms present
- `excludedTermPenalty`: 0 if excluded terms present, 1 otherwise

### Caching Strategy
1. **Query AST Cache** - Parsed queries cached for 24h
2. **Result Cache** - Search results cached for 5 minutes
3. **Match Cache** - Pre-computed matches never expire (invalidated on new articles)

---

## Future Enhancements

See [Planning Backlog](../../../planning/backlog.md) for proposed improvements:
- Advanced analytics and trending topics
- Collaborative saved searches (team sharing)
- Export saved search results to RSS
- Machine learning-based query suggestions

---

## Related Documentation

- **Architecture:** [Service Layer Pattern](../../architecture/)
- **Search Implementation:** [Semantic Search Service](../../../src/lib/services/semantic-search-service.ts)
- **Vector Database:** [pgvector Integration](../../../CLAUDE.md#embedding--semantic-search-flow)

---

**For detailed implementation examples and historical context, see the archived planning documents in** [docs/archive/](../../archive/)
