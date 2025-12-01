# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NeuReed is an intelligent RSS reader with semantic search capabilities, built on Next.js 16 with PostgreSQL/pgvector. It features personalized content recommendations through machine learning, automated feed management via cron jobs, and flexible embedding generation (OpenAI or local models).

## Common Commands

### Development
```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Database Operations
```bash
# Schema changes - ALWAYS use migrations in development (per .cursorrules)
npx prisma migrate dev --name <descriptive_name>  # Create and apply migration
npm run db:generate      # Generate Prisma Client (auto-run by migrate)
npm run db:studio        # Open Prisma Studio at http://localhost:5555
npm run db:seed          # Seed database with sample data
npm run db:reset         # Reset database (⚠️ deletes all data)
```

### Docker & Database
```bash
docker-compose up -d               # Start PostgreSQL with pgvector
docker-compose logs -f postgres    # View database logs
docker exec -it neureed-postgres psql -U neureed -d neureed  # Connect to psql
```

### Testing & Debugging
```bash
# Test specific API routes
curl http://localhost:3000/api/health

# Manual job triggers (must be authenticated)
curl -X POST http://localhost:3000/api/jobs/refresh-feeds
curl -X POST http://localhost:3000/api/jobs/generate-embeddings
```

### CI/CD Workflows
```bash
# The project uses GitHub Actions for continuous integration and deployment
# Two main workflows:

# 1. main.yml - Primary workflow (runs on push/PR)
#    - Lint and type checking
#    - Next.js build
#    - Docker build and push (skipped on PRs)
#    - Auto-deploy to Dokploy (main branch only)

# 2. release.yml - Release workflow (runs on version tags)
#    - Multi-platform Docker builds (amd64 + arm64)
#    - Automatic changelog generation
#    - GitHub release creation

# See docs/GITHUB_ACTIONS_CONSOLIDATION.md for details
```

## Core Architecture

### Application Structure

**Next.js App Router Organization**
- `/app` - Route pages with server/client component split
- `/app/api` - API routes following RESTful conventions
- `/app/actions` - Server Actions for data mutations (2,173 lines across 7 files)
- `/src/lib/services` - Business logic layer (stateless, composable)
- `/src/components` - Reusable React components organized by feature
- `/prisma` - Database schema and migrations
- `/instrumentation.ts` - Server startup initialization (cron scheduler, WASM config)

### Server Actions Architecture

**Overview:**
Next.js 15+ Server Actions are the primary pattern for data mutations in NeuReed. They provide type-safe, progressive-enhanced data operations that integrate seamlessly with React Server Components.

**Benefits:**
- Type safety across client-server boundary
- Automatic request/response serialization
- Progressive enhancement (works without JavaScript)
- Direct function calls (no REST endpoint needed)
- Simplified error handling and validation

**Action Modules (2,173 total lines):**
- [actions/articles.ts](app/actions/articles.ts) (431 lines) - Article CRUD, search, semantic search, summarization
- [actions/feeds.ts](app/actions/feeds.ts) (512 lines) - Feed CRUD, testing, refresh, bulk operations, health
- [actions/user-feeds.ts](app/actions/user-feeds.ts) (358 lines) - User subscriptions, OPML import/export
- [actions/saved-searches.ts](app/actions/saved-searches.ts) (289 lines) - Saved search CRUD, matching, insights
- [actions/categories.ts](app/actions/categories.ts) (247 lines) - Category management
- [actions/notifications.ts](app/actions/notifications.ts) (178 lines) - Notification operations
- [actions/user-preferences.ts](app/actions/user-preferences.ts) (158 lines) - User settings, LLM config

**Key Pattern:**
```typescript
'use server'

export async function updateFeedAction(feedId: string, data: UpdateFeedInput) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  // 2. Validation
  const validated = updateFeedSchema.parse(data)

  // 3. Service layer
  const result = await updateFeed(feedId, validated, session.user.id)

  // 4. Revalidation
  revalidatePath('/feeds-management')

  return result
}
```

**Integration with React Query:**
```typescript
const { mutate } = useMutation({
  mutationFn: (data) => updateFeedAction(feedId, data),
  onSuccess: () => queryClient.invalidateQueries(['feeds'])
})
```

**When to use Server Actions vs API Routes:**
- **Server Actions**: Form submissions, data mutations, component actions, user-initiated operations
- **API Routes**: Webhooks, external integrations, non-React clients, cron job endpoints

### API Route Conventions

**Unified Handler Pattern** ([src/lib/api-handler.ts](src/lib/api-handler.ts)):
```typescript
export const POST = createHandler(
  async ({ body, session, params, query }) => {
    // Business logic here
    return { data: result };  // Automatically wrapped in apiResponse()
  },
  {
    bodySchema: z.object({ ... }),    // Zod validation
    querySchema: z.object({ ... }),   // Optional query param validation
    requireAuth: true,                 // Enforce authentication
  }
);
```

**Response Format:**
- Success: `{ data: any, message?: string }`
- Error: `{ error: string, details?: any }`
- Status codes: 200 (success), 400 (validation), 401 (auth), 404 (not found), 500 (server error)

**API Organization:**
- `/api/articles/*` - Article operations and search
- `/api/feeds/*` - Feed management
- `/api/user/*` - User-specific data (preferences, subscriptions, notifications)
- `/api/admin/*` - Administrative operations
- `/api/jobs/*` - Manual job triggers
- `/api/saved-searches/*` - Saved search CRUD, matching, templates, insights

### Service Layer Pattern

The codebase follows a clear separation of concerns:
- **API routes** are thin controllers that handle HTTP concerns (auth, validation, responses)
- **Server Actions** handle form submissions and mutations with revalidation
- **Services** contain all business logic and are highly composable
- **Database access** goes through services, never directly in API routes or actions

Example service dependencies:
```
feed-refresh-service.ts
  ├─→ embedding-service.ts (via article-embedding-service)
  ├─→ content-extraction-service.ts
  ├─→ feed-parser.ts
  └─→ article-cleanup-service.ts
```

### Database Architecture (Prisma + pgvector)

**Core Model Relationships:**
- **Users** → user_feeds → feeds (many-to-many subscriptions)
- **Feeds** → articles (one-to-many)
- **Articles** → article_feedback (per-user feedback)
- **Articles** → read_articles (per-user read tracking)
- **Users** → user_patterns (learned preferences via TF-IDF)
- **Users** → user_notifications (in-app notifications)
- **Feeds** → feed_error_log (health tracking audit trail)

**Important: pgvector Operations**
- Prisma doesn't natively support pgvector, so raw SQL is used for vector operations
- Vector column defined as: `embedding Unsupported("vector")?`
- Updates: `prisma.$executeRaw`UPDATE articles SET embedding = $1::vector WHERE id = $2``
- Queries: `prisma.$queryRaw`SELECT ... ORDER BY embedding <=> $1::vector``
- HNSW index enables fast similarity search

### Authentication Architecture (NextAuth.js v5)

**Configuration** ([src/lib/auth.ts](src/lib/auth.ts)):
- Prisma adapter for database session storage
- Dynamic OAuth providers (Google, GitHub, Generic OAuth2)
- JWT strategy with secure HTTP-only cookies
- Custom callbacks add user ID to JWT token
- Automatic default feed subscription on user creation

**Authorization Pattern:**
```typescript
// In API routes via createHandler
export const POST = createHandler(
  async ({ body, session }) => {
    const userId = session!.user.id;  // session available, requireAuth ensures non-null
    // ... business logic
  },
  { bodySchema: mySchema, requireAuth: true }
);

// In Server Actions
const session = await auth()
if (!session?.user?.id) throw new Error('Unauthorized')
```

**Multi-Tenancy:**
- All data scoped to users (feeds, articles, patterns, preferences)
- Services accept `userId` parameter
- Database queries filter by `userId`

### Caching Strategy

**Redis-Based Caching** ([cache-service.ts](src/lib/cache/cache-service.ts)):
- Cache-aside pattern: `cacheGetOrSet()`
- Short TTLs balance freshness and performance:
  - Article scores: 1 hour
  - Feed data: 5 minutes
  - Search query AST: 24 hours
- Pattern-based invalidation: `cache:user:{userId}:*`
- Statistics tracking (hits, misses, errors)

**When to Invalidate:**
- User feedback → clear article scores for that user
- Feed refresh → clear feed data
- Settings change → clear affected cached data

## AI & Machine Learning Features

### Embedding & Semantic Search Flow

**Architecture:**
1. **Provider Selection** (cascade):
   - User's LLM preferences (if configured)
   - Admin system settings
   - Environment variables

2. **Embedding Generation** ([article-embedding-service.ts](src/lib/services/article-embedding-service.ts)):
   - Prepares text: title + excerpt + content preview (~2000 chars)
   - Processes in batches (configurable batch size)
   - Updates via raw SQL: `UPDATE articles SET embedding = $1::vector`
   - Tracks costs via Redis

3. **Semantic Search** ([semantic-search-service.ts](src/lib/services/semantic-search-service.ts)):
   - Query embedded using same provider
   - Vector similarity search: `embedding <=> $1::vector` (cosine distance)
   - Optional recency scoring: `semantic_weight * similarity + recency_weight * exp(-age / decay_period)`
   - Results filtered by similarity threshold (default: 0.7)

4. **Related Articles:**
   - Uses article's existing embedding (no query needed)
   - Fast lookup via: `ORDER BY embedding <=> (SELECT embedding FROM articles WHERE id = $1)`

### Article Summarization & LLM Integration

**Overview:**
On-demand article summarization with key point extraction and topic detection. Uses LLM providers with configurable cascade and comprehensive cost tracking.

**Service Layer** ([summarization-service.ts](src/lib/services/summarization-service.ts)):
- `summarizeArticle(articleId, userId, options)` - Generate article summary
- `extractKeyPoints(articleId, userId)` - Extract 3-5 key takeaways
- `detectTopics(articleId, userId)` - Identify main topics/themes
- `batchSummarize(articleIds, userId)` - Batch processing with concurrency control
- `getSummarizationCosts(userId, period)` - Cost analytics

**Cost Tracking** ([summarization-cost-tracker.ts](src/lib/services/summarization-cost-tracker.ts)):
- Redis-based cost tracking per user
- OpenAI pricing: $0.150/1M input, $0.600/1M output tokens
- Daily/monthly aggregates
- Admin cost visibility dashboard

**Database Schema:**
- `articles.summary` (text) - Generated summary
- `articles.keyPoints` (string[]) - Extracted key points
- `articles.topics` (string[]) - Detected topics
- `articles.summarizedAt` (DateTime) - Generation timestamp

**LLM Configuration Cascade:**
```
1. User preferences (user_llm_config table)
   └─ Encrypted API keys per user
   └─ Model selection (summary/embedding/digest)
2. Admin settings (admin_llm_settings table)
   └─ System-wide defaults
   └─ Provider enable/disable
3. Environment variables
   └─ OPENAI_API_KEY, OLLAMA_BASE_URL
```

**Supported Providers:**
- **OpenAI**: gpt-4o-mini (default), gpt-4o (premium)
- **Ollama**: llama3.1, qwen2.5 (self-hosted, free)

**API Endpoints:**
- `POST /api/articles/[id]/summarize` - Generate summary
- `GET /api/articles/[id]/summary` - Retrieve cached summary
- `GET /api/articles/[id]/keypoints` - Get key points
- `GET /api/articles/topics` - Topic analysis
- `GET /api/admin/summarization/costs` - Cost analytics

**Server Actions:**
- `generateArticleSummaryAction(articleId)` - Trigger summarization
- `getArticleSummaryAction(articleId)` - Retrieve with auth

**Caching Strategy:**
- Database persistence (articles table)
- Redis cache (1 hour TTL)
- Revalidate on article update

### Personalization System

**Pattern Detection** ([pattern-detection-service.ts](src/lib/services/pattern-detection-service.ts)):
- Extracts keywords via TF-IDF from article content
- Learns from explicit feedback (thumbs up/down: +1.0/-1.0)
- Learns from implicit feedback (bounce/completion: -0.5/+0.5)
- Applies 10% decay per 30-day period
- Maintains top 100 patterns per user

**Article Scoring** ([article-scoring-service.ts](src/lib/services/article-scoring-service.ts)):
- Scores articles based on user patterns
- Normalized 0-1 relevance score (sigmoid function)
- Cached in Redis for performance (1 hour TTL)
- Provides explanations for scores (matched keywords)

**Feedback Service** ([feedback-service.ts](src/lib/services/feedback-service.ts)):
- Explicit feedback takes precedence over implicit
- Reading time estimated from word count
- Quick bounce (<25% time) = negative signal
- Completion (>90% time) = positive signal

### Saved Searches Architecture

**Overview:**
Saved Searches is a dynamic content monitoring system that allows users to create persistent queries that automatically match against new articles. It combines semantic search (vector embeddings) with keyword matching to find relevant content.

**Core Components:**
- **Query Parser** ([search-query-parser.ts](src/lib/services/search-query-parser.ts)): Parses complex query syntax into AST
- **Search Execution** ([saved-search-execution.ts](src/lib/services/saved-search-execution.ts)): Executes queries against article database
- **Matcher Service** ([saved-search-matcher.ts](src/lib/services/saved-search-matcher.ts)): Automatically matches new articles
- **Cache Service** ([saved-search-cache-service.ts](src/lib/services/saved-search-cache-service.ts)): Multi-level caching
- **Batch Processor** ([saved-search-batch-processor.ts](src/lib/services/saved-search-batch-processor.ts)): Efficient batch matching

**Query Syntax:**
```
Basic: "AI"                           # Simple semantic search
OR:    "AI, machine learning"         # Match any term
AND:   "AI +ethics"                   # Required term
NOT:   "AI -cryptocurrency"           # Excluded term
Phrase: "machine learning"            # Exact phrase
Groups: "(AI, ML) +ethics"            # Grouped expressions
```

**Integration Points:**
1. Feed refresh job automatically triggers matching for new articles
2. Articles scored for relevance (0-1 scale)
3. High-relevance matches (>0.85) trigger notifications
4. Results cached for performance (5-minute TTL)
5. Mobile-optimized with offline support

**Database Schema:**
- `saved_searches`: User-created search configurations with settings
- `saved_search_matches`: Join table with relevance scores and match reasons
- Indexed on `(savedSearchId, relevanceScore)` and `(savedSearchId, articleId)` for fast retrieval

**Performance Optimizations:**
- Query AST caching (24h TTL, 80% reduction in parsing time)
- Batch processing (100 articles/batch, 5 concurrent searches)
- Vector search with HNSW index
- Compound database indexes for common query patterns
- Target throughput: 1000+ articles/minute

**Documentation:**
- User Guide: [docs/USER_GUIDE_SAVED_SEARCHES.md](docs/USER_GUIDE_SAVED_SEARCHES.md)
- Feature Spec: [docs/FEATURE_SAVED_SEARCHES.md](docs/FEATURE_SAVED_SEARCHES.md)
- Performance Guide: [docs/SAVED_SEARCH_PERFORMANCE_GUIDE.md](docs/SAVED_SEARCH_PERFORMANCE_GUIDE.md)
- Testing Guide: [docs/TESTING_SAVED_SEARCHES.md](docs/TESTING_SAVED_SEARCHES.md)

## Feed Management

### Feed Health & Status Tracking System

**Overview:**
Comprehensive feed reliability monitoring with automatic failure tracking, auto-disable for problematic feeds, and historical error logging for debugging.

**Health States:**
```
healthy  → 0 consecutive failures
warning  → 1-2 consecutive failures
error    → 3+ consecutive failures
disabled → Auto-disabled at threshold (default: 10) or manually disabled
```

**Database Schema:**

New `feeds` table fields:
- `healthStatus` (string, default: "healthy")
- `consecutiveFailures` (int, default: 0)
- `lastSuccessfulFetch` (DateTime?)
- `autoDisableThreshold` (int, default: 10)
- `notifyOnError` (boolean, default: false)
- `httpStatus` (int?) - Last HTTP status code
- `redirectUrl` (string?) - Redirect destination if feed moved

New `feed_error_log` table:
- `id`, `feedId`, `timestamp`, `errorType`, `errorMessage`
- `httpStatus`, `details` (JSON), `resolved` (boolean)
- Cascade delete with feeds
- Full audit trail of all errors

**Service Layer** ([feed-health-service.ts](src/lib/services/feed-health-service.ts)):
- `getFeedHealth(feedId)` - Get health status
- `getBulkFeedHealth(feedIds)` - Batch health check (single query)
- `recordFeedSuccess(feedId)` - Mark successful fetch, reset failures
- `recordFeedFailure(feedId, errorType, message, httpStatus)` - Log failure, update health
- `resetFeedHealth(feedId)` - Atomic reset to healthy state
- `getUnhealthyFeeds(userId)` - Get warning/error/disabled feeds for user
- `enableFeed(feedId)` - Manually enable disabled feed
- `disableFeed(feedId)` - Manually disable feed
- `updateAutoDisableThreshold(feedId, threshold)` - Configure threshold
- `getFeedErrorLogs(feedId, limit)` - Retrieve error history
- `clearFeedErrorLogs(feedId)` - Clear error logs

**Auto-Disable Logic:**
```typescript
if (feed.consecutiveFailures >= feed.autoDisableThreshold) {
  await prisma.feed.update({
    where: { id: feedId },
    data: { healthStatus: 'disabled' }
  })

  if (feed.notifyOnError) {
    await createNotification({
      userId,
      type: 'feed_health_disabled',
      title: `Feed auto-disabled: ${feed.title}`,
      message: `After ${threshold} consecutive failures`
    })
  }
}
```

**Integration with Feed Refresh Job:**
- Job respects `healthStatus` (skips disabled feeds)
- Calls `recordFeedSuccess()` on successful fetch
- Calls `recordFeedFailure()` on error
- Error types: FETCH_ERROR, PARSE_ERROR, TIMEOUT, HTTP_ERROR

**API Endpoints:**
- `PUT /api/feeds/[id]/status` - Enable/disable feed
- `POST /api/feeds/bulk/status` - Bulk enable/disable
- `GET /api/feeds/[id]/health` - Get health status
- `POST /api/feeds/bulk-health` - Batch health retrieval
- `GET /api/feeds/unhealthy` - User's unhealthy feeds

**Server Actions:**
- `toggleFeedStatusAction(feedId, enabled)` - Single feed toggle
- `bulkToggleFeedStatusAction(feedIds, enabled)` - Bulk toggle
- `resetFeedHealthAction(feedId)` - Reset to healthy

**UI Integration:**
- FeedDetailsView "Quality & Health" tab:
  - Health status badge with color coding
  - Consecutive failure count display
  - Auto-disable threshold configuration
  - Last error message viewer
  - Error notification toggle
  - View error history button
- OverviewView feeds table:
  - Health status badge column (Disabled/Error/Warning/Active)
  - Bulk enable/disable buttons for selected feeds

**Query Hooks:**
- `useFeedHealth(feedId)` - Real-time health status
- `useToggleFeedStatus()` - Single feed mutation
- `useBulkToggleFeedStatus()` - Bulk mutation with partial failure handling

### Bulk Operations System

**Overview:**
Multi-feed operations for efficiency with partial failure tolerance and user authorization verification.

**Service Layer** ([bulk-operations-service.ts](src/lib/services/bulk-operations-service.ts)):
- `bulkUpdateFeedCategory(feedIds, categoryId, userId)` - Assign category to multiple feeds
- `bulkUpdateFeedTags(feedIds, tags, mode, userId)` - Manage tags (modes: 'add', 'remove', 'replace')
- `bulkUpdateFeedSettings(feedIds, settings, userId)` - Update settings (refreshInterval, maxArticles, maxArticleAge)
- `bulkDeleteFeeds(feedIds, userId)` - Delete multiple feeds with cascade
- `bulkRefreshFeeds(feedIds, userId)` - Trigger refresh for multiple feeds

**Response Format:**
```typescript
interface BulkUpdateResult {
  success: number
  failed: number
  results: Array<{
    feedId: string
    success: boolean
    error?: string
  }>
}
```

**Authorization Pattern:**
```typescript
// Verify all feeds belong to user
const userFeedIds = await prisma.userFeed.findMany({
  where: { userId, feedId: { in: feedIds } },
  select: { feedId: true }
}).then(feeds => feeds.map(f => f.feedId))

const unauthorized = feedIds.filter(id => !userFeedIds.includes(id))
if (unauthorized.length > 0) {
  throw new Error('Unauthorized feeds')
}
```

**API Endpoints:**
- `POST /api/feeds/bulk/category` - Bulk category update
- `POST /api/feeds/bulk/tags` - Bulk tag management
- `POST /api/feeds/bulk/settings` - Bulk settings update
- `POST /api/feeds/bulk/delete` - Bulk delete
- `POST /api/feeds/bulk/refresh` - Bulk refresh

**Server Actions:**
- `bulkUpdateFeedCategoryAction(feedIds, categoryId)`
- `bulkUpdateFeedTagsAction(feedIds, tags, mode)`
- `bulkDeleteFeedsAction(feedIds)`

**UI Integration:**
- OverviewView bulk selection mode with checkboxes
- Bulk action toolbar (appears when feeds selected)
- Operations: Enable, Disable, Delete, Edit Category, Edit Tags
- Loading states during bulk operations

**Query Hooks:**
- `useBulkUpdateCategory()` - Category mutation with optimistic updates
- `useBulkUpdateTags()` - Tags mutation
- `useBulkDeleteFeeds()` - Delete mutation with confirmation

### OPML Import/Export

**Overview:**
Full OPML 2.0 standard support for importing/exporting feed subscriptions with category preservation. Essential for migration and backup functionality.

**Service Layer** ([opml-service.ts](src/lib/services/opml-service.ts)):
- `parseOPML(xmlString)` - Parse OPML XML to structured data
- `generateOPML(userId)` - Export user's feeds to OPML format
- `validateOPMLStructure(data)` - Validate structure before import
- `importOPMLFeeds(userId, opmlData)` - Import with automatic category creation

**OPML Structure:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>NeuReed Feeds</title>
    <dateCreated>2025-01-15T10:30:00Z</dateCreated>
  </head>
  <body>
    <outline text="Technology" title="Technology">
      <outline type="rss" text="TechCrunch"
               xmlUrl="https://techcrunch.com/feed/"
               htmlUrl="https://techcrunch.com/"/>
    </outline>
  </body>
</opml>
```

**Import Flow:**
1. User uploads OPML file or provides XML string
2. Parse XML and validate OPML structure
3. Create missing categories with color assignment
4. Create or update feeds (dedupe by URL)
5. Subscribe user to imported feeds
6. Return import summary (created, updated, failed counts)

**Export Flow:**
1. Fetch user's feed subscriptions with categories
2. Group feeds by category
3. Generate OPML XML with proper nesting
4. Return as downloadable file with timestamp

**API Endpoints:**
- `POST /api/user/opml/import` - Import OPML file (multipart/form-data)
- `GET /api/user/opml/export` - Export as OPML (application/xml)

**Server Actions:**
- `importOPMLAction(opmlXml)` - Handle import with validation
- `exportOPMLAction()` - Generate export for current user

**UI Integration:**
- OverviewView header with Import/Export buttons
- File drop zone for drag-and-drop OPML import
- Download button triggers export
- Import summary modal showing results

**Query Hooks:**
- `useImportOPML()` - Import mutation with progress tracking
- `useExportOPML()` - Export query with file download

### Cron Job System

**Initialization Flow:**
1. `instrumentation.ts` runs on server startup
2. Checks `ENABLE_CRON_JOBS` environment variable
3. Initializes scheduler with all job definitions
4. Jobs run on schedule OR via manual trigger

**Job Execution Pattern:**
- All jobs wrapped with `createJobExecutor()` for tracking
- Creates `CronJobRun` record in database (status, duration, logs)
- In-memory lock prevents duplicate runs
- Logs captured via `JobLogger` and stored in database
- Admin can view history and trigger jobs manually

**Key Jobs:**
- `feed-refresh-job.ts`: Refreshes feeds every 30 minutes (configurable), creates notifications, respects health status
- `cleanup-job.ts`: Removes old articles daily at 3 AM based on retention settings
- Pattern decay job: Time-based decay of user preferences (10% per 30 days)

### Cascade Settings Pattern

Settings cascade from most specific to most general:
1. Feed-specific setting (highest priority)
2. Category setting
3. User default setting
4. System default setting (lowest priority)

Applied to: refresh intervals, article retention periods, max articles per feed.

Implementation: [src/lib/services/feed-settings-cascade.ts](src/lib/services/feed-settings-cascade.ts)

## User Features

### Notification System

**Architecture:**
- In-app notifications stored in `user_notifications` table
- Notifications created automatically for feed refresh events and feed health issues
- Real-time updates via React Query polling (30s interval)
- Toast notifications for new items with rich metadata display

**Notification Types:**
- `feed_refresh`: Feed update notifications with stats (new/updated articles, embeddings, cleanup)
- `feed_health_error`: Feed health degraded to error state
- `feed_health_disabled`: Feed auto-disabled after threshold failures
- `info`, `warning`, `error`, `success`: General notifications

**Service Layer** ([notification-service.ts](src/lib/services/notification-service.ts)):
- `createNotification()`: Create any notification
- `createFeedRefreshNotification()`: Specialized for feed updates
- `getUserNotifications()`: Fetch with pagination
- `markNotificationAsRead()`: Mark single notification as read
- `markAllNotificationsAsRead()`: Bulk mark as read
- `cleanupOldNotifications()`: Keep only last 100 per user

**Feed Health Integration:**
- Notifications created when feed health changes to error or disabled
- Respects `notifyOnError` setting per feed
- Batched notifications (max 1 per feed per hour)
- Integration with `recordFeedFailure()` in health service

**UI Components:**
- `NotificationBell`: Header component with unread count badge
- Dropdown panel with notification list and actions
- Toast notifications for new items

### Offline Support & Client-Side Caching

**Overview:**
LocalStorage-based caching with TTL management for offline access to saved search results and article data.

**Service Layer** ([offline-cache-service.ts](src/lib/services/offline-cache-service.ts)):
- `setCacheItem(key, data, ttl)` - Store with expiration time
- `getCacheItem(key)` - Retrieve if not expired
- `removeCacheItem(key)` - Delete specific entry
- `clearExpiredCache()` - Cleanup old entries
- `getCacheStats()` - Storage size and entry count
- `isOnline()` - Current network status

**Cache Structure:**
```typescript
interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
  version: string
}

interface CacheMetadata {
  version: '1.0'
  lastSync: number
  isOnline: boolean
}
```

**Usage Pattern:**
```typescript
// Cache saved search results
await setCacheItem(
  `saved-search:${searchId}:results`,
  results,
  5 * 60 * 1000 // 5 minute TTL
)

// Retrieve with fallback to server
const cached = await getCacheItem(`saved-search:${searchId}:results`)
if (!cached) {
  const fresh = await fetchFromServer()
  await setCacheItem(key, fresh, ttl)
}
```

**Storage Management:**
- Quota monitoring (LocalStorage ~5-10MB limit)
- LRU eviction when approaching storage limit
- Automatic cleanup of expired entries on app load
- Version-based cache invalidation

**Online/Offline Handling:**
```typescript
window.addEventListener('online', () => {
  syncCachedSearches()
  updateCacheMetadata({ isOnline: true })
})

window.addEventListener('offline', () => {
  showOfflineIndicator()
  updateCacheMetadata({ isOnline: false })
})
```

**Integration Points:**
- Saved searches: Cache query results for offline access
- Article lists: Cache for offline viewing
- User preferences: Local copy for instant access

### Default Feeds for New Users

New users are automatically subscribed to a curated set of 9 feeds covering:
- **Technology**: TechCrunch, The Verge, Hacker News
- **News**: BBC News
- **Science**: Nature, Science Daily
- **Positive News**: Good News Network, Positive News
- **Satire**: The Onion

**Implementation:**
- Feeds created on-demand in [src/lib/services/default-feeds-service.ts](src/lib/services/default-feeds-service.ts)
- Subscription happens in `createUser` event in auth.ts
- Categories and feeds auto-created if missing
- Idempotent (safe to run multiple times)

See [docs/DEFAULT_FEEDS.md](docs/DEFAULT_FEEDS.md) for full documentation.

## Developer Guide

### React Hooks & Client State

**Custom Hooks** ([src/hooks/](src/hooks/)):

1. **useAuth** - Session management with loading states
   ```typescript
   const { user, loading, isAuthenticated } = useAuth()
   ```

2. **useUnsavedChanges** - Form change tracking with warnings
   ```typescript
   const { hasChanges, revert, confirmClose } = useUnsavedChanges(formData, initialData)
   ```

3. **useFileDrop** - Drag & drop with file validation
   ```typescript
   const { isDragging, files, getRootProps } = useFileDrop({
     accept: '.opml',
     maxSize: 5 * 1024 * 1024
   })
   ```

4. **useFormChanges** - Detailed field-level change tracking
   ```typescript
   const { changes, isDirty, reset } = useFormChanges(formState)
   ```

5. **useConfirmation** - Confirmation dialogs with promise-based API
   ```typescript
   const { confirm, ConfirmDialog } = useConfirmation()
   const confirmed = await confirm('Delete feed?')
   ```

6. **useFeedNavigation** - URL-based feed navigation
   ```typescript
   const { currentFeedId, navigateToFeed } = useFeedNavigation()
   ```

7. **useViewNavigation** - View state management via URL params
   ```typescript
   const { currentView, setView } = useViewNavigation()
   ```

8. **useMobileMenu** - Mobile menu state management
   ```typescript
   const { isOpen, toggle, close } = useMobileMenu()
   ```

9. **useDebounce** - Debounced values for search inputs
   ```typescript
   const debouncedSearch = useDebounce(searchTerm, 300)
   ```

**React Query Hooks** ([src/hooks/queries/](src/hooks/queries/)):

**Feed Management:**
- `useFeeds()` - All feeds with health status
- `useUserFeeds()` - User's subscribed feeds
- `useFeedHealth(feedId)` - Real-time health status
- `useUpdateFeed()` - Update mutation with validation
- `useDeleteFeed()` - Delete mutation with cascade
- `useToggleFeedStatus()` - Enable/disable single feed
- `useBulkToggleFeedStatus()` - Bulk enable/disable

**Article Management:**
- `useArticles(filters)` - Article list with pagination
- `useArticle(id)` - Single article with relations
- `useArticleSummary(id)` - Cached summary data
- `useSearchArticles()` - Full-text search mutation
- `useSemanticSearch()` - Vector similarity search

**Saved Searches:**
- `useSavedSearches()` - User's saved searches
- `useSavedSearchMatches(id)` - Matching articles
- `useCreateSavedSearch()` - Create with validation
- `useRematchSavedSearch()` - Re-run matching algorithm

**Notifications:**
- `useNotifications()` - Unread notifications with polling
- `useMarkNotificationRead()` - Mark as read mutation

**Standard Hook Pattern:**
```typescript
export function useUpdateFeed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => updateFeedAction(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['feeds'])
      queryClient.invalidateQueries(['userFeeds'])
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
}
```

### Feed Management UI Architecture

**URL Navigation Pattern:**
Query parameter-based navigation for natural browser back/forward support:
```
/feeds-management?view=overview              # Default view
/feeds-management?view=feed&id=123           # Feed details
/feeds-management?view=category&id=456       # Category settings
/feeds-management?view=bulk-edit&ids=1,2,3   # Bulk edit

Modal query params:
?modal=import-opml
?modal=export-opml
?modal=create-category
?modal=bulk-edit
```

**Component Hierarchy:**
```
FeedsManagementPage
├─ FeedsManagementLayout (header, navigation)
├─ OverviewView (default view)
│  ├─ StatisticsPanel (4 stat cards)
│  ├─ FeedsTable (with bulk selection)
│  └─ CategoriesList
├─ FeedDetailsView (7-tab interface)
│  ├─ BasicSettingsTab
│  ├─ UpdateRefreshTab
│  ├─ ContentProcessingTab
│  ├─ ConnectionSettingsTab
│  ├─ QualityHealthTab (health monitoring)
│  ├─ PresentationTab
│  └─ AdvancedTab
├─ CategorySettingsView
└─ BulkEditView
```

**FeedDetailsView 7-Tab Interface:**
1. **Basic Settings** - Name, URL, categories, tags, enable/disable toggle
2. **Update & Refresh** - Fetch intervals, timeout, retry settings, backoff strategy
3. **Content Processing** - Article retention, max articles, extraction method, content filters
4. **Connection Settings** - Authentication, custom headers, proxy, SSL verification
5. **Quality & Health** - Health status badge, failure count, error logs, auto-disable config, notifications
6. **Presentation** - Feed icon, excerpt length, display format (card/list/compact)
7. **Advanced** - Response caching, conditional GET, redirect handling, raw feed viewer

**Data Flow:**
```
URL query params (browser)
  ↓
useFeedNavigation() / useViewNavigation()
  ↓
Conditional view rendering
  ↓
User interaction (form submission)
  ↓
Server Action call
  ↓
Service layer + database update
  ↓
revalidatePath() / revalidateTag()
  ↓
React Query cache invalidation
  ↓
Optimistic UI updates
```

**Modal System:**
- URL-driven (state preserved on page refresh)
- Components lazy-loaded for performance
- Backdrop click and Escape key to close
- Accessible keyboard navigation

**File Locations:**
- Page: [app/feeds-management/page.tsx](app/feeds-management/page.tsx)
- Views: [app/feeds-management/components/views/](app/feeds-management/components/views/)
- Forms: [app/feeds-management/components/forms/](app/feeds-management/components/forms/)
- Modals: [app/feeds-management/components/modals/](app/feeds-management/components/modals/)

### Important Development Notes

#### Database Migrations
- **ALWAYS** use `npx prisma migrate dev --name <descriptive_name>` for schema changes
- **NEVER** use `prisma db push` in development (only for prototyping)
- Test migrations locally before committing
- Regeneration of Prisma Client happens automatically after migrations
- **Important:** Prisma CLI is in `dependencies` (not `devDependencies`) to ensure it's available in CI/CD and Docker builds

#### Working with pgvector
- Prisma doesn't support vector types natively
- Use raw SQL for vector operations (see examples in semantic-search-service.ts)
- Vector dimensions: 384 (local/BGE-small) or 1536 (OpenAI)
- HNSW index requires periodic REINDEX for optimal performance

#### Security Considerations
- Always sanitize HTML content (use `he.decode()` for entities)
- Validate URLs before fetching (feed-parser.ts has SSRF protection)
- User inputs validated with Zod schemas
- Sensitive data (API keys, cookies) encrypted via encryption-service.ts
- Never expose internal errors to users

#### Type Safety
- Environment variables validated via `@t3-oss/env-nextjs` in [src/env.ts](src/env.ts)
- Prisma generates TypeScript types for all models
- Zod schemas for runtime validation
- Use `satisfies` for type narrowing where appropriate

#### Working with Server Actions

**Best Practices:**
1. Always use `'use server'` directive at top of file
2. Validate inputs with Zod schemas before processing
3. Check authentication early in the function
4. Keep business logic in service layer (actions are thin wrappers)
5. Use `revalidatePath()` or `revalidateTag()` for cache invalidation
6. Handle errors gracefully without leaking internal details

**Error Handling Pattern:**
```typescript
try {
  const validated = schema.parse(data)
  const result = await serviceFunction(validated)
  revalidatePath('/path')
  return { success: true, data: result }
} catch (error) {
  if (error instanceof z.ZodError) {
    return { success: false, error: 'Validation failed', details: error.errors }
  }
  console.error('Action failed:', error)
  return { success: false, error: 'Operation failed' }
}
```

**Testing Server Actions:**
```typescript
import { updateFeedAction } from '@/app/actions/feeds'

// Actions are just async functions - call directly in tests
const result = await updateFeedAction('feed-123', {
  title: 'New Title'
})
```

**Common Revalidation Paths:**
- `/feeds-management` - Feed list and details updates
- `/articles` - Article list updates
- `/saved-searches` - Saved search updates
- `/admin/dashboard` - Admin data changes

#### LLM Configuration

**Provider Selection:**
- **OpenAI**: Cloud-based, best quality, costs per token
- **Ollama**: Self-hosted, free, requires local installation

**Configuration Cascade:**
```
User LLM Config (highest priority)
  ↓ if not configured
Admin LLM Settings
  ↓ if not configured
Environment Variables (lowest priority)
```

**Per-User Overrides:**
Users can configure their own:
- Provider preference (OpenAI vs Ollama)
- Model selection (summary/embedding/digest)
- Personal API keys (encrypted in database)
- Usage cost limits

**Admin System Config:**
- Default models for all users
- Provider enable/disable flags
- System-wide API keys
- Rate limiting settings

**Model Recommendations:**
- **Summarization**: gpt-4o-mini (OpenAI) or llama3.1 (Ollama)
- **Embeddings**: text-embedding-3-small (OpenAI) or bge-small-en-v1.5 (local)
- **Digest**: gpt-4o (OpenAI) or qwen2.5 (Ollama)

**Environment Variables:**
- `OPENAI_API_KEY` - OpenAI authentication
- `OLLAMA_BASE_URL` - Ollama server URL (default: http://localhost:11434)

#### Content Extraction
- Multiple strategies: Readability (fast), Playwright (for JS-rendered content)
- Cookie-based authentication for paywalled feeds
- Per-feed extraction settings with merge strategies
- Timeouts prevent hanging on slow sites

#### Cost Management
- Embedding costs tracked via embedding-cost-tracker.ts
- Summarization costs tracked via summarization-cost-tracker.ts
- User-specific LLM configurations allow cost control
- Admin can enable/disable providers system-wide
- Local embeddings available as zero-cost alternative

#### Job Monitoring
- All cron jobs logged in `CronJobRun` table
- View history in admin dashboard: [/admin/dashboard](http://localhost:3000/admin/dashboard)
- Manual triggers via API for debugging
- Logs captured and stored with each run

### Common Patterns to Follow

#### Adding a New Service
1. Create file in `/src/lib/services/<feature>-service.ts`
2. Export functions (not classes) for composability
3. Accept dependencies as parameters (no global state)
4. Use Prisma for database access
5. Add detailed JSDoc comments for public functions
6. Handle errors with try-catch and meaningful messages

#### Adding a New API Route
1. Create route in `/app/api/<resource>/route.ts`
2. Use `createHandler()` wrapper from api-handler.ts
3. Define Zod schema for request validation
4. Call service layer for business logic
5. Return structured response (don't throw errors to client)

#### Adding a Server Action
1. Create or update action file in `/app/actions/<resource>.ts`
2. Add `'use server'` directive at top of file
3. Define Zod schema for input validation
4. Implement action function with auth check
5. Call service layer for business logic
6. Use `revalidatePath()` to invalidate cached data
7. Create React Query hook for client integration

**Example:**
```typescript
// app/actions/feeds.ts
'use server'

export async function updateFeedAction(
  feedId: string,
  data: UpdateFeedInput
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = updateFeedSchema.parse(data)
  const result = await updateFeed(feedId, validated, session.user.id)

  revalidatePath('/feeds-management')
  return result
}

// hooks/queries/use-feeds.ts
export function useUpdateFeed() {
  return useMutation({
    mutationFn: (data) => updateFeedAction(data.id, data),
    onSuccess: () => queryClient.invalidateQueries(['feeds'])
  })
}
```

#### Adding a New Cron Job
1. Create job file in `/src/lib/jobs/<name>-job.ts`
2. Export function wrapped with `createJobExecutor()`
3. Use `JobLogger` for logging
4. Register in `scheduler.ts`
5. Add environment variable for schedule (optional)

#### Adding Database Migrations
1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <descriptive_name>`
3. Test migration with `npm run db:reset && npm run db:seed`
4. Commit both schema.prisma and migration files

### Troubleshooting

#### Database Connection Issues
- Verify Docker is running: `docker ps`
- Check logs: `docker-compose logs postgres`
- Database runs on port 5433 (not default 5432) to avoid conflicts

#### Embedding Generation Fails
- Check provider configuration in user preferences or admin settings
- Verify API keys are set (OpenAI) or WASM is configured (local)
- Look at job logs in admin dashboard
- Check Redis connection for cost tracking

#### Cron Jobs Not Running
- Verify `ENABLE_CRON_JOBS=true` in environment
- Check server logs for scheduler initialization
- Ensure no errors in `instrumentation.ts`
- Try manual trigger via API to test job logic

#### Semantic Search Returns No Results
- Verify articles have embeddings: `SELECT COUNT(*) FROM articles WHERE embedding IS NOT NULL`
- Check similarity threshold (may be too high)
- Ensure same embedding provider used for query and articles
- Verify HNSW index exists: `\d articles` in psql

#### Feed Health Issues
- Check feed health status in OverviewView or via API
- Review error logs: `GET /api/feeds/[id]/errors`
- Manually reset health if needed: `resetFeedHealthAction(feedId)`
- Verify auto-disable threshold is appropriate for feed reliability

## Reference

### Key Files to Reference

**Core Architecture:**
- [src/lib/api-handler.ts](src/lib/api-handler.ts) - API route wrapper pattern
- [src/lib/auth.ts](src/lib/auth.ts) - Authentication configuration
- [prisma/schema.prisma](prisma/schema.prisma) - Database schema
- [src/env.ts](src/env.ts) - Environment variable definitions

**Server Actions:**
- [app/actions/feeds.ts](app/actions/feeds.ts) - Feed server actions (512 lines)
- [app/actions/articles.ts](app/actions/articles.ts) - Article server actions (431 lines)
- [app/actions/user-feeds.ts](app/actions/user-feeds.ts) - User subscription actions (358 lines)
- [app/actions/saved-searches.ts](app/actions/saved-searches.ts) - Saved search actions (289 lines)

**Services:**
- [src/lib/services/feed-refresh-service.ts](src/lib/services/feed-refresh-service.ts) - Core feed refresh logic
- [src/lib/services/feed-health-service.ts](src/lib/services/feed-health-service.ts) - Feed health tracking
- [src/lib/services/semantic-search-service.ts](src/lib/services/semantic-search-service.ts) - Vector search implementation
- [src/lib/services/summarization-service.ts](src/lib/services/summarization-service.ts) - Article summarization
- [src/lib/services/bulk-operations-service.ts](src/lib/services/bulk-operations-service.ts) - Bulk feed operations
- [src/lib/services/opml-service.ts](src/lib/services/opml-service.ts) - OPML import/export
- [src/lib/services/offline-cache-service.ts](src/lib/services/offline-cache-service.ts) - Client-side caching
- [src/lib/services/default-feeds-service.ts](src/lib/services/default-feeds-service.ts) - Default feed subscription

**Jobs & Scheduling:**
- [src/lib/jobs/scheduler.ts](src/lib/jobs/scheduler.ts) - Cron job initialization
- [src/lib/jobs/feed-refresh-job.ts](src/lib/jobs/feed-refresh-job.ts) - Feed refresh cron job

**React Hooks:**
- [src/hooks/queries/use-feeds.ts](src/hooks/queries/use-feeds.ts) - Feed React Query hooks
- [src/hooks/queries/use-articles.ts](src/hooks/queries/use-articles.ts) - Article React Query hooks
- [src/hooks/queries/use-saved-searches.ts](src/hooks/queries/use-saved-searches.ts) - Saved search hooks

**UI Components:**
- [app/feeds-management/page.tsx](app/feeds-management/page.tsx) - Feed management UI
- [app/feeds-management/components/views/FeedDetailsView.tsx](app/feeds-management/components/views/FeedDetailsView.tsx) - 7-tab feed details
- [app/feeds-management/components/views/OverviewView.tsx](app/feeds-management/components/views/OverviewView.tsx) - Feed overview with bulk ops
