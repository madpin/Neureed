# Changelog

All notable changes to NeuReed are documented in this file.

## [Unreleased]

### Changed
- **Feed Parser Migration**
  - Migrated from `rss-parser` to `@rowanmanning/feed-parser` (v2.1.1)
  - Improved feed parsing with better maintained library
  - Better error handling with specific error codes
  - Maintains full compatibility with existing RSS 2.0 and Atom 1.0 feeds
  - All existing feeds continue to work without changes
  - Enhanced support for media enclosures and feed metadata

### Added
- **Nested Route Navigation with Browser History Support**
  - Implemented nested URL structure for feeds and articles (`/feeds/[feedId]`, `/feeds/[feedId]/articles/[articleId]`)
  - Browser back button now works granularly through feed changes and article navigation
  - Each feed selection creates a proper browser history entry
  - Each article opened in reading panel creates a history entry
  - Context-aware article links maintain feed context in URLs
  - Reading panel navigation uses `router.push()` instead of `router.replace()` for proper history
  - Automatic redirects for article routes to open in reading panel
  - Feed selection now uses router navigation instead of state-based navigation

- **User-Specific Feed Categories**
  - Create, rename, and delete personal feed categories
  - Each user can organize their own feeds independently
  - Category-level default settings (extraction method, refresh interval)
  - Individual feed settings override category defaults
  - Drag-and-drop feeds to assign them to categories
  - Drag-and-drop feeds to "Uncategorized" to remove from all categories
  - Category reordering via drag-and-drop
  - Persistent category expand/collapse states per user
  - Feed count badges on each category
  - Comprehensive category management modal showing all categories

- **Collapsible Sidebar**
  - Icon-only mode (20px width) with tooltips on hover
  - Toggle button at bottom of sidebar
  - Sidebar state persists across sessions
  - Full support in both expanded and collapsed modes
  - Smooth transitions between states

- **Enhanced Feed Organization**
  - Feeds grouped by user categories
  - Collapsible category sections with persistent state
  - "Uncategorized" section (only shows when needed)
  - Visual feedback during drag operations
  - Dropdown menus for quick category and feed actions
  - Settings button in each feed menu
  - Click category name to filter articles by that category
  - Category filter persists in URL (shareable links)
  - Works from both home page and feed detail page
  - Selected category is visually highlighted

- **Feed Management**
  - Users can now permanently delete feeds from the feed settings panel
  - Separated "Unsubscribe" (removes user subscription) from "Delete Feed" (removes feed for all users)
  - Added double confirmation for feed deletion with feed name verification
  - Cascading deletion of all articles when feed is deleted
  - Feed deletion options in a dedicated "Danger Zone" section in settings
  - Clear visual distinction between unsubscribe and delete actions

### Enhanced
- **Improved UI/UX**
  - Fixed dropdown menu positioning to prevent cutoff during scroll
  - Menus now use fixed positioning with dynamic coordinates
  - Separate click behaviors: arrow expands/collapses, name filters by category
  - Removed drag handles in favor of entire row being draggable
  - Consistent menu styling across feeds and categories

- **Improved Atom Feed Support**
  - Enhanced feed parser to better handle Atom 1.0 feeds
  - Added support for Atom-specific fields (logo, icon, summary, content)
  - Improved author extraction for both RSS and Atom formats
  - Better date handling (isoDate for Atom, pubDate for RSS)
  - Enhanced content extraction with fallback chain

### Fixed
- **Date Serialization Issue**
  - Fixed TypeError when displaying article dates in ArticlePanel and article detail pages
  - Added proper handling for dates serialized as strings from API responses
  - Dates now correctly converted before calling toISOString()

- **Drag-and-Drop Issues**
  - Feed-to-category assignment now works correctly
  - Visual feedback shows drop zones properly
  - Categories highlight when dragging feeds over them
  - Optimistic UI updates with backend persistence
  - Fixed buttons inside categories blocking drop events (made them non-draggable)

- **Feed Detail Page**
  - Updated feed detail page (`/feeds/[feedId]`) to use CategoryList component
  - Sidebar now shows categories on all pages consistently
  - Added support for collapsed sidebar on feed pages
  - Categories auto-collapse when sidebar is in icon-only mode to prevent long icon lists
  - Fixed race condition where expanded categories from preferences would load even when sidebar is collapsed
  - Fixed horizontal scrollbar appearing due to missing overflow-hidden on root container

### Database Changes
- Added `UserCategory` model for user-specific categories
- Added `UserFeedCategory` junction table for feed-category assignments
- Added `sidebarCollapsed` and `categoryStates` to `UserPreferences`
- Migration: `20251118095229_add_user_categories_and_sidebar_preferences`

### API Changes
- `GET /api/user/categories` - List user categories
- `POST /api/user/categories` - Create new category
- `GET /api/user/categories/:categoryId` - Get category details
- `PUT /api/user/categories/:categoryId` - Update category (name, description, settings)
- `DELETE /api/user/categories/:categoryId` - Delete category
- `POST /api/user/categories/reorder` - Reorder categories via drag-and-drop
- `POST /api/user/categories/:categoryId/feeds` - Assign feed to category
- `DELETE /api/user/categories/:categoryId/feeds` - Unassign feed from category
- `DELETE /api/user/feeds/:userFeedId/categories` - Remove feed from all categories
- `GET /api/user/feeds?groupByCategory=true` - Get feeds grouped by categories
- `POST /api/user/feeds` - Now accepts optional `categoryId` parameter
- `GET /api/articles?categoryId=xxx` - Filter articles by category

### Planned Features
See [Feature Backlog](docs/BACKLOG.md) for upcoming feature backlog.

## [0.7.0] - 2024-11-17 - Phase 7: Advanced Features & Optimization

### Added
- **Custom Theming System**
  - User-created custom CSS themes with live preview
  - Theme editor with validation and sanitization
  - Public theme gallery for sharing and cloning themes
  - Preset themes: Light, Dark, Solarized, Nord, Dracula
  - Theme activation/deactivation per user
  - Theme management API endpoints

- **Redis Caching Layer**
  - Redis 7 Alpine integration via Docker Compose
  - Cache service with get/set/delete operations
  - Batch operations and pattern-based deletion
  - TTL management and cache statistics tracking
  - Caching for article scores, user patterns, embeddings, semantic search, LLM summaries
  - Admin APIs for cache management and monitoring

- **LLM Integration**
  - Article summarization with key points extraction
  - OpenAI and Ollama provider support
  - Per-user LLM configuration (provider, model, API key, base URL)
  - System-wide and user-specific settings
  - Cost tracking for OpenAI usage
  - Encrypted API key storage

- **OpenAI Base URL Configuration**
  - Support for Azure OpenAI, local proxies, and OpenAI-compatible endpoints
  - System-wide configuration via `OPENAI_BASE_URL` environment variable
  - User-specific configuration in preferences UI
  - Applies to both LLM and embedding providers

### Changed
- Improved theme switching with instant preview (no page reload required)
- Enhanced theme provider to support Tailwind dark mode classes with system theme
- Updated preferences UI to use theme CSS variables instead of hardcoded colors

### Fixed
- **Auto Mark as Read** - Articles now properly marked as read when preference is enabled
- **Cache Error Handling** - Errors now propagate with helpful messages instead of generic failures
- **Theme System** - Fixed instant theme switching, system theme dark mode, and custom CSS cleanup
- **Toolbar Display** - Made article toolbar sticky with improved mobile responsiveness
- **Summary Generation** - Fixed error messages to show actual configuration issues
- **Async Params** - Updated all route handlers to properly await params in Next.js 15

### Technical
- Migration: `20251117204146_add_themes_and_llm_fields`
- Migration: `20251117212929_add_llm_settings_to_user_preferences`
- Added Redis to Docker Compose stack
- Added `ioredis` dependency for Redis client
- Added `node-cron` for scheduled jobs

## [0.6.0] - 2024-11-17 - Phase 6: Learning & Personalization

### Added
- **Feedback Collection System**
  - Explicit feedback (thumbs up/down) on articles
  - Implicit feedback (bounce detection based on reading time)
  - Article view and exit tracking
  - Feedback statistics and analytics

- **Pattern Detection Algorithm**
  - TF-IDF-based keyword extraction from article content
  - Real-time pattern updates after each feedback
  - Pattern weight calculation (-1.0 to 1.0 scale)
  - Stop words filtering for better keyword quality
  - Pattern decay system (time-based weight reduction)

- **Personalized Article Scoring**
  - Relevance score calculation based on learned patterns
  - Batch scoring for efficient article list processing
  - Score explanations showing top matching patterns
  - Visual relevance indicators with color coding (green/blue/yellow/red)
  - Automatic article dimming for low-relevance content

- **UI Components**
  - FeedbackButtons component (minimal and prominent variants)
  - ArticleViewTracker for client-side tracking
  - RelevanceScore component with tooltips
  - Pattern management in preferences (reset learning)
  - Bounce threshold configuration (10-50%, default 25%)

- **Pattern Management**
  - Scheduled pattern decay job
  - Pattern cleanup (removes low-weight patterns)
  - Limits to top 100 patterns per user
  - Pattern reset functionality

### Technical
- Migration: `20251117200449_add_feedback_and_pattern_learning`
- Added `ArticleFeedback` and `UserPattern` models
- API endpoints for feedback, scoring, and pattern management

## [0.5.0] - 2024-11-17 - Phase 5: Advanced Content Extraction

### Added
- **Modular Extractor Architecture**
  - Plugin interface for content extractors
  - Extractor registry with priority-based selection
  - Intelligent fallback chain (Playwright → Readability → RSS)
  - Performance metrics tracking for extractors

- **Content Extraction Methods**
  - Readability extractor (Mozilla Readability + JSDOM)
  - Optional Playwright extractor for JavaScript-rendered content
  - Cookie-based authentication support
  - Custom headers support

- **Cookie Management**
  - Secure AES-256-GCM encryption for cookie storage
  - Support for 4 cookie formats (JSON, Netscape, Header, Raw)
  - Browser-specific extraction guides (Chrome, Firefox, Safari)
  - Cookie validation and format auto-detection

- **Per-Feed Configuration**
  - Feed settings panel UI component
  - Test extraction functionality
  - Extraction method selector
  - Custom CSS selector support
  - Visual status indicators

- **Security**
  - Cookie encryption service
  - SSRF protection in URL validation
  - Input sanitization and validation
  - Secure cookie storage in database

### Technical
- Migration: `20251117164132_enhance_feed_article_schema`
- Added `@mozilla/readability` and `jsdom` dependencies
- Optional `playwright` dependency
- Added `ENCRYPTION_SECRET`, `PLAYWRIGHT_ENABLED`, `EXTRACTION_TIMEOUT` environment variables
- Documentation: `docs/COOKIE_EXTRACTION_GUIDE.md`, `docs/CONTENT_EXTRACTION.md`

## [0.3.0] - 2024-11-17 - Phase 3: Embeddings & Semantic Search

### Added
- **Embedding Providers**
  - OpenAI provider (text-embedding-3-small, 1536 dimensions)
  - Local provider (Transformers.js with bge-small-en-v1.5)
  - Configurable provider selection via environment variables
  - Cost tracking for API usage

- **Semantic Search**
  - Vector similarity search using pgvector and HNSW index
  - Real-time semantic search bar in main layout
  - Advanced search page with filters
  - Hybrid search mode (semantic + keyword)
  - Related articles recommendations

- **Embedding Generation**
  - Automatic generation on feed refresh (configurable)
  - Manual batch generation via API or UI
  - Background job for processing backlog
  - Embedding statistics and management

- **UI Components**
  - SemanticSearchBar component with dropdown results
  - Advanced search page with mode selection and filters
  - Related articles widget for article pages
  - Settings page for embedding configuration

- **Admin Features**
  - Embedding statistics dashboard
  - Provider status testing
  - Manual embedding generation
  - Cost tracking and reporting

### Technical
- Migration: `20251117172313_add_hnsw_index_and_embedding_settings`
- HNSW index for fast cosine similarity search
- Added `openai` and `@xenova/transformers` dependencies
- Environment variables: `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`, `EMBEDDING_BATCH_SIZE`, `EMBEDDING_AUTO_GENERATE`

## [0.4.0] - 2024-11-17 - Phase 4: User System & Authentication

### Added
- **User Authentication**
  - NextAuth.js integration
  - Support for multiple OAuth providers (Google, GitHub)
  - Session management
  - Protected routes and API endpoints

- **User Preferences**
  - Theme selection (light, dark, system)
  - Font size control
  - Articles per page
  - Default view (compact, expanded)
  - Show/hide read articles
  - Auto-mark as read option
  - Related article excerpt display

- **User-Specific Features**
  - Personal feed subscriptions
  - Read article tracking
  - User-specific article lists
  - Personalized API responses

### Technical
- Migration: `20251117181322_add_user_system`
- Migration: `20251117190246_add_show_related_excerpts_preference`
- Added NextAuth.js models (User, Account, Session, VerificationToken)
- Added UserFeed and ReadArticle models
- Added UserPreferences model

## [0.2.0] - 2024-11-17 - Phase 2: Feed Management & Article Storage

### Added
- **Feed Management**
  - RSS/Atom feed parsing with `rss-parser`
  - Feed CRUD operations
  - Feed validation and error handling
  - Feed refresh scheduler
  - ETags and Last-Modified support for efficient fetching

- **Article Storage**
  - Article deduplication by URL and GUID
  - Content hash-based duplicate detection
  - Article metadata extraction
  - Estimated reading time calculation

- **Content Processing**
  - HTML sanitization
  - Text excerpt generation
  - Image URL extraction
  - Content encoding detection

- **UI Components**
  - Feed list with management actions
  - Article list with filtering
  - Article cards with metadata
  - Article detail page

### Technical
- Complete feed and article service implementation
- Feed refresh service with duplicate detection
- Content processor with sanitization

## [0.1.0] - 2024-11-17 - Phase 1: Foundation & Core Setup

### Added
- **Project Foundation**
  - Next.js 16 with App Router
  - TypeScript with strict configuration
  - Tailwind CSS 4.x for styling
  - ESLint and Prettier configuration

- **Database Infrastructure**
  - PostgreSQL 16 with pgvector extension
  - Docker Compose configuration for local development
  - Prisma ORM with type-safe client
  - Database schema with vector support
  - Database migration system

- **Environment Configuration**
  - Type-safe environment variables with Zod validation
  - Separate server/client environment handling
  - `.env` symlink for Prisma compatibility

- **Development Tools**
  - Automated setup script (`scripts/setup.sh`)
  - Database seed script with sample data
  - npm scripts for common operations
  - Prisma Studio for database management

- **API Infrastructure**
  - Health check endpoint
  - Standardized API response helpers
  - Error handling utilities
  - Logging system

- **Core Schema**
  - Feed and Article models
  - Category and FeedCategory models
  - Vector embedding support (1536 dimensions)
  - HNSW index for similarity search

### Technical
- PostgreSQL port 5433 to avoid local conflicts
- pgvector extension for vector operations
- Prisma Client singleton pattern
- Comprehensive documentation (README, setup guides)

## Development Information

### Database Migrations
All database changes are tracked through Prisma migrations in `prisma/migrations/`:
- `0_init` - Initial schema setup
- `20251117164132_enhance_feed_article_schema` - Feed enhancements
- `20251117172313_add_hnsw_index_and_embedding_settings` - Vector search optimization
- `20251117181322_add_user_system` - User authentication
- `20251117190246_add_show_related_excerpts_preference` - Preference enhancement
- `20251117200449_add_feedback_and_pattern_learning` - Learning system
- `20251117204146_add_themes_and_llm_fields` - Theme system
- `20251117212929_add_llm_settings_to_user_preferences` - LLM configuration

### Technology Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL 16 with pgvector
- **Caching**: Redis 7
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS 4.x
- **Validation**: Zod
- **Environment**: @t3-oss/env-nextjs

### Performance Optimizations
- HNSW vector index for fast similarity search (<500ms)
- Redis caching for frequently accessed data
- Batch processing for embeddings and scoring
- Efficient pagination and filtering
- Connection pooling for database access

### Security Features
- AES-256-GCM encryption for sensitive data
- Parameterized database queries (SQL injection prevention)
- Input validation with Zod schemas
- API key encryption for user storage
- SSRF protection in URL validation
- Content sanitization for HTML

### Future Roadmap
See [Feature Backlog](docs/BACKLOG.md) for planned features including:
- OPML import/export
- News clustering and digest generation
- Improved reading formats for accessibility
- Configurable reading panel layouts
- Keyboard shortcuts
- Article retention policies
- And much more!

---

For detailed implementation notes on specific features, refer to the documentation in the `docs/` directory.

