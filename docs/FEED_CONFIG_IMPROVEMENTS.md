# Feed Configuration Improvements

This document outlines planned improvements to NeuReed's per-feed configuration system. It compares the desired feature set for a modern RSS reader against the current implementation and provides a roadmap for enhancements.

## Current State Analysis

### Already Implemented ✅

Based on [prisma/schema.prisma](../prisma/schema.prisma) and the service layer:

**Feed-Level Settings:**
- Feed URL (`feeds.url`)
- Custom title per user (`user_feeds.customName`)
- Category/folder organization (`user_categories`, `user_feed_categories`)
- Update interval with cascade (`fetchInterval` + cascade system)
- Fetch timeout and error handling (`errorCount`, `lastError`)
- Item retention policy (cascade: `maxArticlesPerFeed`, `maxArticleAge`)
- Content extraction settings (`feeds.settings.extraction`)
  - Method selection (RSS, Readability, Playwright)
  - Content merge strategy (prepend, append, replace)
  - Cookie-based authentication (encrypted)

**Settings Cascade System ([feed-settings-cascade.ts](../src/lib/services/feed-settings-cascade.ts)):**
- Four-level hierarchy: Feed → Category → User → System
- Applies to: `refreshInterval`, `maxArticlesPerFeed`, `maxArticleAge`
- Source tracking for each setting

**Read State Management:**
- Read tracking (`read_articles`)
- User preferences for auto-mark behavior (`autoMarkAsRead`)
- Show/hide read articles (`showReadArticles`)

**Personalization & Semantic Features:**
- Embeddings generation (`articles.embedding`)
- Pattern learning (`user_patterns`)
- Article scoring (`article_feedback`)
- User-specific embedding settings (`embeddingsEnabled`, LLM provider config)

---

## Must-Have Enhancements

### 1. HTTP Options & Authentication ⚠️ PARTIALLY IMPLEMENTED
**Status:** Cookie authentication exists, but needs expansion

**Currently:**
- ✅ Cookie support with encryption ([feed-settings-service.ts](../src/lib/services/feed-settings-service.ts))
- ✅ Basic User-Agent handling in feed parser

**Missing:**
- ❌ Basic HTTP authentication (username/password)
- ❌ Bearer token authentication
- ❌ Custom HTTP headers (beyond User-Agent)
- ❌ Per-feed proxy configuration
- ❌ UI for managing authentication credentials

**Implementation Plan:**
1. **Database Schema Extension:**
   ```prisma
   // In feeds.settings JSON:
   {
     "authentication": {
       "type": "none" | "basic" | "bearer" | "cookie",
       "credentials": {
         "username": string,      // Encrypted
         "password": string,      // Encrypted
         "token": string,         // Encrypted
         "cookies": string        // Already implemented
       }
     },
     "http": {
       "headers": { [key: string]: string },
       "timeout": number,         // milliseconds
       "proxy": {
         "enabled": boolean,
         "url": string,           // Encrypted
         "type": "http" | "https" | "socks5"
       }
     }
   }
   ```

2. **Service Layer:**
   - Extend [feed-settings-service.ts](../src/lib/services/feed-settings-service.ts):
     - `getAuthSettings(feedId): Promise<AuthSettings>`
     - `updateAuthSettings(feedId, settings): Promise<void>`
     - `getHttpOptions(feedId): Promise<HttpOptions>`
   - Update [feed-parser.ts](../src/lib/feed-parser.ts):
     - Accept authentication and HTTP options
     - Apply credentials before fetch
     - Support proxy configuration

3. **UI Components:**
   - Feed settings modal with authentication tab
   - Secure credential input (password fields)
   - Test connection button
   - Auth type selector (radio/dropdown)

---

### 2. Read State Behavior Per Feed ⚠️ PARTIALLY IMPLEMENTED
**Status:** Global preferences exist, need per-feed overrides

**Currently:**
- ✅ Global `autoMarkAsRead` preference
- ✅ Global `showReadArticles` preference
- ❌ Per-feed overrides

**Implementation Plan:**
1. **Add to user_feeds.settings:**
   ```json
   {
     "readBehavior": {
       "autoMarkAsRead": "inherit" | "on_scroll" | "on_open" | "manual",
       "showUnreadOnly": boolean,
       "markAsReadDelay": number  // seconds
     }
   }
   ```

2. **Update [feed-settings-cascade.ts](../src/lib/services/feed-settings-cascade.ts):**
   - Add `readBehavior` to cascade system
   - Provide defaults from user preferences

3. **UI Changes:**
   - Add read behavior section to feed settings
   - "Use default" option with current value display
   - Per-feed toggles

---

### 3. Improved Content Mode Settings ⚠️ PARTIALLY IMPLEMENTED
**Status:** Extraction exists, needs better control over RSS vs. extracted

**Currently:**
- ✅ Content extraction with multiple strategies
- ✅ Merge strategies (prepend, append, replace)
- ❌ Simple "prefer full content" toggle
- ❌ Fallback behavior configuration

**Implementation Plan:**
1. **Simplify extraction settings:**
   ```json
   {
     "contentPreference": "rss" | "extracted" | "best_available",
     "extraction": {
       "enabled": boolean,
       "method": "auto" | "readability" | "playwright",
       "fallbackToRSS": boolean,
       "mergeStrategy": "prepend" | "append" | "replace"
     }
   }
   ```

2. **Update extraction logic in [feed-refresh-service.ts](../src/lib/services/feed-refresh-service.ts):**
   - Honor `contentPreference` setting
   - Implement "best_available" heuristic (length, completeness)

---

## Good-to-Have Enhancements

### 4. Keyword Filters ❌ NOT IMPLEMENTED
**Status:** Not implemented (high-value feature)

**Purpose:** Allow users to filter noisy feeds, highlight important topics, and auto-tag articles

**Implementation Plan:**
1. **Database Schema:**
   ```prisma
   // In user_feeds.settings JSON:
   {
     "filters": {
       "includeKeywords": string[],     // Whitelist
       "excludeKeywords": string[],     // Blacklist
       "includeRegex": string[],
       "excludeRegex": string[],
       "matchLocation": "title" | "content" | "both",
       "caseSensitive": boolean,
       "autoTagRules": [
         {
           "keywords": string[],
           "tag": string,
           "action": "add_tag" | "highlight" | "notify"
         }
       ]
     }
   }
   ```

2. **Service Layer:**
   - New service: `article-filter-service.ts`
     - `shouldIncludeArticle(article, filters): boolean`
     - `applyAutoTagRules(article, rules): string[]`
   - Hook into [article-service.ts](../src/lib/services/article-service.ts) during upsert

3. **UI Components:**
   - Filter management panel in feed settings
   - Keyword input with chips/tags UI
   - Regex tester/validator
   - Auto-tag rule builder

4. **Testing:**
   - Test filter button (show what would be included/excluded)
   - Statistics on filtered articles

---

### 5. Per-Feed Notification Settings ❌ NOT IMPLEMENTED
**Status:** Global notification system exists, needs per-feed controls

**Currently:**
- ✅ Notification system ([user_notifications](../prisma/schema.prisma))
- ✅ Feed refresh notifications
- ❌ Per-feed notification preferences

**Implementation Plan:**
1. **Add to user_feeds.settings:**
   ```json
   {
     "notifications": {
       "enabled": boolean,
       "priority": "muted" | "normal" | "important",
       "minNewArticles": number,        // Only notify if X+ new articles
       "keywordAlerts": string[],       // Notify if these keywords match
       "notifyOnError": boolean
     }
   }
   ```

2. **Update [notification-service.ts](../src/lib/services/notification-service.ts):**
   - Check per-feed settings before creating notification
   - Priority-based notification styling
   - Keyword match highlighting

3. **UI:**
   - Notification preferences in feed settings
   - Priority level selector (icon: 🔇 muted, 🔔 normal, ⭐ important)
   - Keyword alert input

---

### 6. RSS Metadata Hints (skipDays/skipHours) ❌ NOT IMPLEMENTED
**Status:** Not implemented (nice optimization)

**Purpose:** Respect publisher's recommended fetch schedule

**Implementation Plan:**
1. **Extend feed parser ([feed-parser.ts](../src/lib/feed-parser.ts)):**
   - Parse `<skipDays>` and `<skipHours>` from RSS 2.0
   - Parse `<ttl>` (time to live) and `<sy:updatePeriod>` extensions

2. **Store in feeds.settings:**
   ```json
   {
     "publisherHints": {
       "ttl": number,                // minutes
       "skipDays": string[],         // ["Saturday", "Sunday"]
       "skipHours": number[],        // [0, 1, 2, 3, 4, 5]
       "updatePeriod": string,       // "hourly", "daily"
       "updateFrequency": number
     }
   }
   ```

3. **Update refresh logic:**
   - Check hints before scheduling refresh
   - Skip refresh during `skipHours` or `skipDays`
   - Adjust `fetchInterval` based on `ttl`

---

### 7. Bookmarks/Starred Articles ❌ NOT IMPLEMENTED
**Status:** Feedback system exists (👍/👎), but no bookmarking

**Currently:**
- ✅ Article feedback (`article_feedback`)
- ❌ Dedicated bookmark/star system

**Implementation Plan:**
1. **Database Schema:**
   ```prisma
   model user_bookmarks {
     id        String   @id @default(cuid())
     userId    String
     articleId String
     note      String?
     tags      String[]
     createdAt DateTime @default(now())

     users    User     @relation(...)
     articles articles @relation(...)

     @@unique([userId, articleId])
     @@index([userId, createdAt])
   }
   ```

2. **Add to user_feeds.settings:**
   ```json
   {
     "bookmarks": {
       "autoStarFromFeed": boolean,
       "autoTags": string[]
     }
   }
   ```

3. **Service Layer:**
   - `bookmark-service.ts`:
     - `bookmarkArticle(userId, articleId, note, tags)`
     - `unbookmarkArticle(userId, articleId)`
     - `getUserBookmarks(userId, filters)`

4. **UI:**
   - Star icon on article cards
   - "Starred" virtual feed in sidebar
   - Bookmark manager page
   - Per-feed auto-bookmark toggle

---

## Semantic Search & ML Enhancements

### 8. Per-Feed Embedding Control ⚠️ PARTIALLY IMPLEMENTED
**Status:** Global embedding setting, needs per-feed toggle

**Currently:**
- ✅ Global `embeddingsEnabled` preference
- ✅ Automatic embedding generation
- ❌ Per-feed toggle

**Implementation Plan:**
1. **Add to user_feeds.settings:**
   ```json
   {
     "embeddings": {
       "enabled": "inherit" | "always" | "never",
       "priority": number  // 1-10 for batch generation order
     }
   }
   ```

2. **Update [article-embedding-service.ts](../src/lib/services/article-embedding-service.ts):**
   - Check feed setting before generating embeddings
   - Prioritize high-priority feeds in batch processing

---

### 9. Feed Importance/Weight for Ranking ❌ NOT IMPLEMENTED
**Status:** Pattern-based scoring exists, but no explicit feed weighting

**Purpose:** Bias recommendations and reduce noise from low-value feeds

**Implementation Plan:**
1. **Add to user_feeds.settings:**
   ```json
   {
     "importance": {
       "weight": number,           // 0.0-3.0, default 1.0
       "boostInSearch": boolean,
       "boostInRecommendations": boolean,
       "dedupeStrategy": "prefer_this" | "prefer_other" | "show_both"
     }
   }
   ```

2. **Update scoring services:**
   - [article-scoring-service.ts](../src/lib/services/article-scoring-service.ts):
     - Multiply relevance score by feed weight
   - [semantic-search-service.ts](../src/lib/services/semantic-search-service.ts):
     - Apply feed boost in similarity ranking

3. **UI:**
   - Importance slider (0-3 stars)
   - Visual indicator in feed list
   - Sort feeds by importance

---

### 10. Language & Timezone Hints ❌ NOT IMPLEMENTED
**Status:** Not implemented (useful for multi-language feeds)

**Purpose:** Better summarization, keyword extraction, and scheduling

**Implementation Plan:**
1. **Add to feeds.settings:**
   ```json
   {
     "locale": {
       "language": string,        // ISO 639-1 (e.g., "en", "pt", "es")
       "timezone": string,        // IANA timezone (e.g., "America/New_York")
       "country": string          // ISO 3166-1 (e.g., "US", "PT")
     }
   }
   ```

2. **Auto-detect on feed creation:**
   - Parse `<language>` from RSS 2.0
   - Detect from feed content using language detection library

3. **Use in services:**
   - LLM summarization: pass language hint
   - Keyword extraction: language-specific stopwords
   - Refresh scheduling: convert skipHours to user's timezone

---

## Implementation Priority

### Phase 1: Core Must-Haves (1-2 months)
1. ✅ **HTTP Authentication & Options** (1 week)
   - Critical for paywalled/private feeds
   - Extends existing cookie system

2. ✅ **Read State Per Feed** (3 days)
   - High user value, low complexity
   - Quick win for power users

3. ✅ **Improved Content Mode** (3 days)
   - Simplifies existing extraction system
   - Better UX for content preference

### Phase 2: High-Value Good-to-Haves (2-3 months)
4. ✅ **Keyword Filters** (2 weeks)
   - High user demand for noisy feeds
   - Enables power user workflows

5. ✅ **Per-Feed Notifications** (1 week)
   - Extends existing notification system
   - Reduces notification fatigue

6. ✅ **Bookmarks/Starred Articles** (1 week)
   - Core feature for content curation
   - Enables "read later" workflows

### Phase 3: Smart Features (ongoing)
7. ✅ **Per-Feed Embedding Control** (2 days)
   - Cost optimization for paid LLMs
   - Performance optimization

8. ✅ **Feed Importance/Weight** (1 week)
   - Enhances existing scoring system
   - Better recommendations

### Phase 4: Polish & Optimization (ongoing)
9. ✅ **RSS Metadata Hints** (3 days)
   - Optimization, not critical
   - Reduces unnecessary fetches

10. ✅ **Language & Timezone** (3 days)
    - Nice to have for international users
    - Improves auto-detection

---

## Database Migration Strategy

Most enhancements use the existing `settings` JSON column, avoiding heavy migrations:

- `feeds.settings`: Global feed metadata (language, locale, publisher hints)
- `user_feeds.settings`: User-specific overrides (filters, notifications, importance)
- `user_categories.settings`: Category-level defaults (already implemented)

**New Tables Required:**
- `user_bookmarks` (Phase 2, feature #7)

**Migration Approach:**
1. Add new settings incrementally (backward compatible)
2. Provide migration script to set defaults for existing feeds
3. UI shows "not configured" state with sensible defaults

---

## Testing Strategy

For each feature:
1. **Unit tests** for service layer logic
2. **Integration tests** for cascade behavior
3. **UI tests** for settings management
4. **Manual testing** with diverse feed types:
   - RSS 2.0, Atom, JSON Feed
   - Paywalled vs. public
   - High-frequency vs. low-frequency
   - Clean vs. noisy feeds

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md): Project overview and architecture
- [prisma/schema.prisma](../prisma/schema.prisma): Database schema
- [feed-settings-cascade.ts](../src/lib/services/feed-settings-cascade.ts): Settings cascade implementation
- [feed-settings-service.ts](../src/lib/services/feed-settings-service.ts): Extraction settings management

---

## Open Questions

1. **Keyword Filters:**
   - Should filters apply at fetch time or display time?
   - How to handle filter changes for existing articles?

2. **Bookmarks:**
   - Should bookmarks sync across devices?
   - Export format (JSON, HTML, Markdown)?

3. **Feed Importance:**
   - Should weight affect feed refresh priority?
   - How to visualize importance in UI?

4. **Authentication:**
   - Support OAuth flows for complex sites?
   - Cookie refresh/rotation logic?

5. **Settings UI:**
   - Single modal with tabs vs. separate pages?
   - Bulk settings editor for multiple feeds?

---

*This document will be updated as features are implemented and priorities change.*
