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

## High-Level Architecture

### Application Structure

**Next.js App Router Organization**
- `/app` - Route pages with server/client component split
- `/app/api` - API routes following RESTful conventions
- `/src/lib/services` - Business logic layer (stateless, composable)
- `/src/components` - Reusable React components organized by feature
- `/prisma` - Database schema and migrations
- `/instrumentation.ts` - Server startup initialization (cron scheduler, WASM config)

### Service Layer Pattern

The codebase follows a clear separation of concerns:
- **API routes** are thin controllers that handle HTTP concerns (auth, validation, responses)
- **Services** contain all business logic and are highly composable
- **Database access** goes through services, never directly in API routes

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

**Important: pgvector Operations**
- Prisma doesn't natively support pgvector, so raw SQL is used for vector operations
- Vector column defined as: `embedding Unsupported("vector")?`
- Updates: `prisma.$executeRaw`UPDATE articles SET embedding = $1::vector WHERE id = $2``
- Queries: `prisma.$queryRaw`SELECT ... ORDER BY embedding <=> $1::vector``
- HNSW index enables fast similarity search

### Cascade Settings Pattern

Settings cascade from most specific to most general:
1. Feed-specific setting (highest priority)
2. Category setting
3. User default setting
4. System default setting (lowest priority)

Applied to: refresh intervals, article retention periods, max articles per feed.

Implementation: [src/lib/services/feed-settings-cascade.ts](src/lib/services/feed-settings-cascade.ts)

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
- `feed-refresh-job.ts`: Refreshes feeds every 30 minutes (configurable), creates notifications for users
- `cleanup-job.ts`: Removes old articles daily at 3 AM
- Pattern decay job: Time-based decay of user preferences

### Notification System

**Architecture:**
- In-app notifications stored in `user_notifications` table
- Notifications created automatically for feed refresh events
- Real-time updates via React Query polling (30s interval)
- Toast notifications for new items

**Notification Types:**
- `feed_refresh`: Feed update notifications with stats (new/updated articles, embeddings, cleanup)
- `info`, `warning`, `error`, `success`: General notifications

**Service Layer** ([notification-service.ts](src/lib/services/notification-service.ts)):
- `createNotification()`: Create any notification
- `createFeedRefreshNotification()`: Specialized for feed updates
- `getUserNotifications()`: Fetch with pagination
- `markNotificationAsRead()`: Mark single notification as read
- `markAllNotificationsAsRead()`: Bulk mark as read
- `cleanupOldNotifications()`: Keep only last 100 per user

**UI Components:**
- `NotificationBell`: Header component with unread count badge
- Dropdown panel with notification list
- Toast notifications for new items with rich metadata display

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
- Pattern-based invalidation: `cache:user:{userId}:*`
- Statistics tracking (hits, misses, errors)

**When to Invalidate:**
- User feedback → clear article scores for that user
- Feed refresh → clear feed data
- Settings change → clear affected cached data

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

## Important Development Notes

### Database Migrations (from .cursorrules)
- **ALWAYS** use `npx prisma migrate dev --name <descriptive_name>` for schema changes
- **NEVER** use `prisma db push` in development (only for prototyping)
- Test migrations locally before committing
- Regeneration of Prisma Client happens automatically after migrations

### Working with pgvector
- Prisma doesn't support vector types natively
- Use raw SQL for vector operations (see examples in semantic-search-service.ts)
- Vector dimensions: 384 (local/BGE-small) or 1536 (OpenAI)
- HNSW index requires periodic REINDEX for optimal performance

### Security Considerations (from .cursorrules)
- Always sanitize HTML content (use `he.decode()` for entities)
- Validate URLs before fetching (feed-parser.ts has SSRF protection)
- User inputs validated with Zod schemas
- Sensitive data (API keys, cookies) encrypted via encryption-service.ts
- Never expose internal errors to users

### Type Safety
- Environment variables validated via `@t3-oss/env-nextjs` in [src/env.ts](src/env.ts)
- Prisma generates TypeScript types for all models
- Zod schemas for runtime validation
- Use `satisfies` for type narrowing where appropriate

### Content Extraction
- Multiple strategies: Readability (fast), Playwright (for JS-rendered content)
- Cookie-based authentication for paywalled feeds
- Per-feed extraction settings with merge strategies
- Timeouts prevent hanging on slow sites

### Cost Management
- Embedding costs tracked via embedding-cost-tracker.ts
- User-specific LLM configurations allow cost control
- Admin can enable/disable providers system-wide
- Local embeddings available as zero-cost alternative

### Job Monitoring
- All cron jobs logged in `CronJobRun` table
- View history in admin dashboard: [/admin/dashboard](http://localhost:3000/admin/dashboard)
- Manual triggers via API for debugging
- Logs captured and stored with each run

## Common Patterns to Follow

### Adding a New Service
1. Create file in `/src/lib/services/<feature>-service.ts`
2. Export functions (not classes) for composability
3. Accept dependencies as parameters (no global state)
4. Use Prisma for database access
5. Add detailed JSDoc comments for public functions
6. Handle errors with try-catch and meaningful messages

### Adding a New API Route
1. Create route in `/app/api/<resource>/route.ts`
2. Use `createHandler()` wrapper from api-handler.ts
3. Define Zod schema for request validation
4. Call service layer for business logic
5. Return structured response (don't throw errors to client)

### Adding a New Cron Job
1. Create job file in `/src/lib/jobs/<name>-job.ts`
2. Export function wrapped with `createJobExecutor()`
3. Use `JobLogger` for logging
4. Register in `scheduler.ts`
5. Add environment variable for schedule (optional)

### Adding Database Migrations
1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <descriptive_name>`
3. Test migration with `npm run db:reset && npm run db:seed`
4. Commit both schema.prisma and migration files

## Troubleshooting

### Database Connection Issues
- Verify Docker is running: `docker ps`
- Check logs: `docker-compose logs postgres`
- Database runs on port 5433 (not default 5432) to avoid conflicts

### Embedding Generation Fails
- Check provider configuration in user preferences or admin settings
- Verify API keys are set (OpenAI) or WASM is configured (local)
- Look at job logs in admin dashboard
- Check Redis connection for cost tracking

### Cron Jobs Not Running
- Verify `ENABLE_CRON_JOBS=true` in environment
- Check server logs for scheduler initialization
- Ensure no errors in `instrumentation.ts`
- Try manual trigger via API to test job logic

### Semantic Search Returns No Results
- Verify articles have embeddings: `SELECT COUNT(*) FROM articles WHERE embedding IS NOT NULL`
- Check similarity threshold (may be too high)
- Ensure same embedding provider used for query and articles
- Verify HNSW index exists: `\d articles` in psql

## Default Feeds for New Users

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

## Key Files to Reference

- [src/lib/api-handler.ts](src/lib/api-handler.ts) - API route wrapper pattern
- [src/lib/auth.ts](src/lib/auth.ts) - Authentication configuration
- [src/lib/services/feed-refresh-service.ts](src/lib/services/feed-refresh-service.ts) - Core feed refresh logic
- [src/lib/services/semantic-search-service.ts](src/lib/services/semantic-search-service.ts) - Vector search implementation
- [src/lib/services/default-feeds-service.ts](src/lib/services/default-feeds-service.ts) - Default feed subscription
- [src/lib/jobs/scheduler.ts](src/lib/jobs/scheduler.ts) - Cron job initialization
- [prisma/schema.prisma](prisma/schema.prisma) - Database schema
- [src/env.ts](src/env.ts) - Environment variable definitions
