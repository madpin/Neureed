# Implementation Plan: Saved Searches Feature

## Overview

This document outlines the implementation plan for the Saved Searches feature as specified in [FEATURE_SAVED_SEARCHES.md](FEATURE_SAVED_SEARCHES.md). The implementation is divided into phases to enable incremental development and testing.

---

## Phase 1: Database Schema & Core Models

### 1.1 Database Schema Changes

**New Models:**

```prisma
model SavedSearch {
  id                String   @id @default(cuid())
  userId            String
  name              String
  query             String   @db.Text
  icon              String?  @default("🔍")
  threshold         Float    @default(0.6)
  categoryId        String?

  // Notification settings
  notifyOnMatch     Boolean  @default(false)
  notifyThreshold   Float    @default(0.85)
  dailyDigest       Boolean  @default(false)

  // Advanced settings
  recencyBias       Float    @default(0.0)
  prioritySources   Json?    // Array of feed IDs

  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  lastMatchedAt     DateTime?
  totalMatches      Int      @default(0)
  archived          Boolean  @default(false)

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category          Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  matches           SavedSearchMatch[]

  @@index([userId])
  @@index([userId, archived])
}

model SavedSearchMatch {
  id              String   @id @default(cuid())
  savedSearchId   String
  articleId       String
  relevanceScore  Float    // 0.0 - 1.0
  matchedTerms    Json     // Array of terms that matched
  matchReason     String?  @db.Text  // Explanation of why it matched

  createdAt       DateTime @default(now())
  notified        Boolean  @default(false)

  savedSearch     SavedSearch @relation(fields: [savedSearchId], references: [id], onDelete: Cascade)
  article         Article     @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([savedSearchId, articleId])
  @@index([savedSearchId, relevanceScore])
  @@index([articleId])
  @@index([createdAt])
}
```

**Migration Task:**
- Create migration file: `npx prisma migrate dev --name add_saved_searches`
- Update Prisma schema with new models
- Add indexes for performance
- Test migration with rollback

---

## Phase 2: Query Parser & Execution Engine

### 2.1 Query Parser Service

**File:** `src/lib/services/search-query-parser.ts`

**Responsibilities:**
- Parse query string into abstract syntax tree (AST)
- Support operators: `,` (OR), `+` (AND), `-` (NOT), `"..."` (phrase), `()` (grouping)
- Handle nested parentheses
- Validate syntax
- Provide helpful error messages

**Key Functions:**
```typescript
interface QueryNode {
  type: 'term' | 'phrase' | 'and' | 'or' | 'not' | 'group';
  value?: string;
  children?: QueryNode[];
  required?: boolean;  // For + prefix
  excluded?: boolean;  // For - prefix
}

interface ParseResult {
  ast: QueryNode;
  errors: string[];
  valid: boolean;
}

export function parseQuery(query: string): ParseResult;
export function validateQuery(query: string): { valid: boolean; errors: string[] };
export function explainQuery(ast: QueryNode): string; // Human-readable explanation
```

**Implementation Approach:**
- Tokenize input string
- Recursive descent parser for nested structures
- Handle operator precedence: phrases → exclusions → requirements → alternatives
- Detect unbalanced parentheses
- Support escaped characters in phrases

### 2.2 Search Execution Service

**File:** `src/lib/services/saved-search-execution.ts`

**Responsibilities:**
- Execute parsed queries against article database
- Combine semantic search (embeddings) with keyword matching
- Calculate relevance scores
- Apply thresholds and filters
- Support recency bias

**Key Functions:**
```typescript
interface SearchResult {
  articleId: string;
  relevanceScore: number;  // 0.0 - 1.0
  matchedTerms: string[];
  matchReason: string;
}

interface SearchOptions {
  userId: string;
  threshold?: number;
  recencyBias?: number;
  prioritySources?: string[];
  limit?: number;
  offset?: number;
}

export async function executeSearch(
  query: string,
  options: SearchOptions
): Promise<SearchResult[]>;

export async function matchArticle(
  articleId: string,
  query: string,
  threshold: number
): Promise<SearchResult | null>;
```

**Scoring Algorithm:**
1. **Semantic Score (0-1):** Embedding similarity using cosine distance
2. **Keyword Score (0-1):** TF-IDF weighted term matching
3. **Boolean Filter:** Apply AND/OR/NOT logic
4. **Combined Score:** `(0.6 * semantic + 0.4 * keyword) * recency_multiplier`
5. **Recency Multiplier:** `1 + recencyBias * exp(-age_days / 30)`

### 2.3 Query Matcher Service

**File:** `src/lib/services/saved-search-matcher.ts`

**Responsibilities:**
- Match new articles against all active saved searches
- Batch process for efficiency
- Create SavedSearchMatch records
- Trigger notifications for high-relevance matches

**Key Functions:**
```typescript
export async function matchNewArticles(
  articleIds: string[],
  userId?: string  // If null, match for all users
): Promise<void>;

export async function rematchSavedSearch(
  savedSearchId: string
): Promise<number>; // Returns number of new matches
```

---

## Phase 3: Backend Services & API Routes

### 3.1 Saved Search Service

**File:** `src/lib/services/saved-search-service.ts`

**Key Functions:**
```typescript
export async function createSavedSearch(data: {
  userId: string;
  name: string;
  query: string;
  icon?: string;
  threshold?: number;
  categoryId?: string;
  notifyOnMatch?: boolean;
  // ... other settings
}): Promise<SavedSearch>;

export async function updateSavedSearch(
  id: string,
  userId: string,
  updates: Partial<SavedSearch>
): Promise<SavedSearch>;

export async function deleteSavedSearch(
  id: string,
  userId: string
): Promise<void>;

export async function getSavedSearches(
  userId: string,
  includeArchived?: boolean
): Promise<SavedSearch[]>;

export async function getSavedSearchById(
  id: string,
  userId: string
): Promise<SavedSearch | null>;

export async function getMatchingArticles(
  savedSearchId: string,
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'relevance' | 'date' | 'combined';
    startDate?: Date;
    endDate?: Date;
    feedIds?: string[];
  }
): Promise<{ articles: Article[]; matches: SavedSearchMatch[]; total: number }>;
```

### 3.2 API Routes

**Route Structure:**
```
/app/api/saved-searches/
  ├── route.ts                    # GET (list), POST (create)
  ├── [id]/route.ts               # GET, PUT, DELETE
  ├── [id]/articles/route.ts      # GET matching articles
  ├── [id]/preview/route.ts       # POST preview without saving
  └── [id]/rematch/route.ts       # POST trigger rematch
```

**Example Route Implementation:**
```typescript
// /app/api/saved-searches/route.ts

import { createHandler } from '@/lib/api-handler';
import { z } from 'zod';
import * as savedSearchService from '@/lib/services/saved-search-service';
import { parseQuery } from '@/lib/services/search-query-parser';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  query: z.string().min(1),
  icon: z.string().optional(),
  threshold: z.number().min(0).max(1).optional(),
  categoryId: z.string().optional(),
  notifyOnMatch: z.boolean().optional(),
  notifyThreshold: z.number().min(0).max(1).optional(),
});

export const POST = createHandler(
  async ({ body, session }) => {
    // Validate query syntax
    const parseResult = parseQuery(body.query);
    if (!parseResult.valid) {
      return {
        error: 'Invalid query syntax',
        details: parseResult.errors
      };
    }

    const savedSearch = await savedSearchService.createSavedSearch({
      userId: session!.user.id,
      ...body,
    });

    // Trigger initial matching in background
    matchNewArticles([], session!.user.id).catch(console.error);

    return { data: savedSearch };
  },
  { bodySchema: createSchema, requireAuth: true }
);

export const GET = createHandler(
  async ({ session, query }) => {
    const savedSearches = await savedSearchService.getSavedSearches(
      session!.user.id,
      query.includeArchived === 'true'
    );
    return { data: savedSearches };
  },
  { requireAuth: true }
);
```

---

## Phase 4: Feed Refresh Integration

### 4.1 Modify Feed Refresh Job

**File:** `src/lib/jobs/feed-refresh-job.ts`

**Changes:**
1. After articles are created/updated, trigger saved search matching
2. Add match count to job statistics
3. Create notifications for high-relevance matches

**Implementation:**
```typescript
// In feed refresh job, after article creation
const newArticleIds = createdArticles.map(a => a.id);

// Match against all users' saved searches
await matchNewArticles(newArticleIds);

logger.info(`Matched ${newArticleIds.length} articles against saved searches`);
```

### 4.2 Notification Integration

**File:** `src/lib/services/saved-search-matcher.ts`

**Add notification creation:**
```typescript
// After creating high-relevance matches
if (match.relevanceScore >= savedSearch.notifyThreshold && savedSearch.notifyOnMatch) {
  await createNotification({
    userId: savedSearch.userId,
    type: 'saved_search_match',
    title: `New match for "${savedSearch.name}"`,
    message: article.title,
    data: {
      savedSearchId: savedSearch.id,
      articleId: article.id,
      relevanceScore: match.relevanceScore,
    },
  });
}
```

---

## Phase 5: Frontend Components

### 5.1 Core Components

**Component Structure:**
```
src/components/saved-searches/
  ├── SavedSearchList.tsx           # Sidebar list component
  ├── SavedSearchModal.tsx          # Create/edit modal
  ├── QueryBuilder.tsx              # Query input with helpers
  ├── QuerySyntaxHelper.tsx         # Syntax help panel
  ├── SavedSearchView.tsx           # Feed-like article view
  ├── RelevanceScoreBadge.tsx       # Score indicator
  ├── MatchReasonTooltip.tsx        # Why this matched
  ├── SavedSearchSettings.tsx       # Settings panel
  └── SearchTemplateGallery.tsx     # Template browser
```

### 5.2 Query Builder Component

**File:** `src/components/saved-searches/QueryBuilder.tsx`

**Features:**
- Syntax highlighting for operators
- Auto-complete for terms
- Parentheses auto-balancing
- Real-time syntax validation
- Quick insert buttons for operators
- Live preview of matching articles

**Key Props:**
```typescript
interface QueryBuilderProps {
  value: string;
  onChange: (query: string) => void;
  onPreview?: () => void;
  userId: string;
  showPreview?: boolean;
}
```

### 5.3 Saved Search View Component

**File:** `src/components/saved-searches/SavedSearchView.tsx`

**Features:**
- Article list with relevance scores
- Sort options (relevance, date, combined)
- Filter by date range, source feed
- "Why this article?" expandable section
- All standard article actions (read, save, feedback)

**Implementation:**
- Reuse existing ArticleCard component
- Add relevance score badge overlay
- Add matched terms highlighting in excerpt
- Show source feed badge (since multi-feed)

---

## Phase 6: UI Integration

### 6.1 Sidebar Integration

**File:** `src/components/layout/Sidebar.tsx`

**Changes:**
1. Add "Saved Searches" collapsible section
2. Render SavedSearchList component
3. Add "+ New Saved Search" button
4. Show unread count badges
5. Support drag-and-drop for organization

### 6.2 Search Bar Enhancement

**File:** `src/components/search/SearchBar.tsx`

**Changes:**
1. Add "Save this search" button after search
2. Pre-fill SavedSearchModal with current query
3. Show indicator if current view is a saved search

### 6.3 Article Actions

**File:** `src/components/articles/ArticleActions.tsx`

**Changes:**
1. Show which saved searches matched this article
2. Add "Remove from this search" action (soft delete match)

---

## Phase 7: Advanced Features

### 7.1 Search Templates

**File:** `src/lib/services/search-templates-service.ts`

**Pre-defined Templates:**
- Technology topics (AI, cybersecurity, etc.)
- News categories (breaking, local, politics)
- Research topics (academic, industry reports)
- Job searches (by role, location, remote)

**Implementation:**
- Store templates in database or JSON config
- Allow users to customize before saving
- Track template usage for analytics

### 7.2 Visual Query Builder (Power User Mode)

**File:** `src/components/saved-searches/VisualQueryBuilder.tsx`

**Features:**
- Drag-and-drop term blocks
- Visual nesting indicators
- Boolean logic diagram
- Toggle between visual and text mode
- Auto-sync between modes

### 7.3 Search Performance Insights

**File:** `src/components/saved-searches/SearchInsights.tsx`

**Dashboard showing:**
- Most productive searches (high matches + engagement)
- Underperforming searches (no matches)
- Suggested refinements
- Trending topics across searches

**Data Collection:**
- Track match counts over time
- Track user engagement with matched articles
- Analyze which terms yield best results

---

## Phase 8: Testing & Optimization

### 8.1 Unit Tests

**Test Files:**
- `search-query-parser.test.ts` - Parser logic, edge cases
- `saved-search-execution.test.ts` - Scoring algorithm, filters
- `saved-search-matcher.test.ts` - Batch matching, notifications
- `saved-search-service.test.ts` - CRUD operations, permissions

**Key Test Scenarios:**
- Complex nested queries with multiple operators
- Edge cases: empty query, unbalanced parentheses
- Score calculation accuracy
- Performance with large article sets

### 8.2 Integration Tests

**Test Scenarios:**
1. Create saved search → verify matching articles
2. New article arrives → verify auto-matching
3. Edit saved search → verify rematching
4. Notification creation on high-relevance match
5. Multi-user scenario (article matches multiple users' searches)

### 8.3 Performance Optimization

**Database Optimization:**
- Add compound indexes on SavedSearchMatch table
- Use materialized views for frequently accessed queries
- Implement pagination for large result sets
- Add database query caching

**Matching Optimization:**
- Batch process articles (e.g., 100 at a time)
- Use worker queue for background matching
- Cache parsed query ASTs
- Optimize vector similarity queries with HNSW index

**Frontend Optimization:**
- Lazy load article previews
- Virtualize long article lists
- Debounce query input
- Cache preview results

---

## Phase 9: Mobile Responsiveness

### 9.1 Mobile UI Adaptations

**Changes:**
- Bottom sheet for query builder modal
- Condensed relevance indicators (dots vs percentages)
- Swipe gestures for managing saved searches
- Simplified syntax helper (expandable panel)
- Voice input for query creation

### 9.2 Offline Support

**Implementation:**
- Cache saved searches in localStorage
- Cache recent match results
- Sync when connection restored
- Show offline indicator

---

## Phase 10: Documentation & Onboarding

### 10.1 User Documentation

**Files to Create:**
- `docs/USER_GUIDE_SAVED_SEARCHES.md` - Comprehensive user guide
- In-app help tooltips
- Video tutorial (optional)

### 10.2 Onboarding Flow

**First-Time User Experience:**
1. Tutorial modal explaining saved searches
2. Suggested starter searches based on subscribed feeds
3. Interactive demo with sample queries
4. Template gallery showcase

**Empty State Design:**
- Welcoming message
- "Get Started" guide
- Example queries with visual results
- Quick template suggestions

---

## Implementation Timeline

### Sprint 1 (Week 1-2): Foundation
- Phase 1: Database schema and migrations
- Phase 2.1: Query parser
- Unit tests for parser

### Sprint 2 (Week 3-4): Core Functionality
- Phase 2.2: Search execution engine
- Phase 2.3: Query matcher
- Phase 3.1: Saved search service
- Unit tests for execution and matching

### Sprint 3 (Week 5-6): API & Integration
- Phase 3.2: API routes
- Phase 4: Feed refresh integration
- Integration tests

### Sprint 4 (Week 7-8): Frontend Core
- Phase 5.1: Core components (QueryBuilder, SavedSearchView)
- Phase 5.2: Query builder enhancements
- Phase 5.3: Saved search view

### Sprint 5 (Week 9-10): UI Integration
- Phase 6: Sidebar, search bar, article actions
- Mobile responsiveness basics
- UI testing

### Sprint 6 (Week 11-12): Polish & Advanced Features
- Phase 7: Templates, visual builder, insights
- Phase 8.3: Performance optimization
- Phase 10: Documentation and onboarding

### Sprint 7 (Week 13): Testing & Launch
- Phase 8.1-8.2: Comprehensive testing
- Bug fixes and refinements
- Production deployment

---

## Success Metrics

### Technical Metrics
- Query parsing success rate: >99%
- Average search execution time: <500ms
- Matching throughput: >1000 articles/minute
- False positive rate: <10%

### User Metrics
- Saved searches created per user: Target >2
- Engagement rate with matched articles: Target >50%
- Query syntax error rate: <5%
- User retention increase: Target +15%

---

## Risk Mitigation

### Performance Risks
- **Risk:** Matching all articles against all searches is expensive
- **Mitigation:** Batch processing, background jobs, caching, incremental matching

### Complexity Risks
- **Risk:** Query syntax too complex for average users
- **Mitigation:** Simple mode by default, power mode opt-in, templates, visual builder

### Relevance Risks
- **Risk:** Poor match quality leads to user frustration
- **Mitigation:** Adjustable thresholds, explicit feedback loop, continuous algorithm tuning

---

## Future Enhancements (Post-MVP)

1. **AI-Suggested Searches:** Automatically suggest saved searches based on reading patterns
2. **Multi-User Searches:** Team/family shared searches
3. **Search Chains:** Use results from one search as input to another
4. **Historical Analysis:** Track how topics evolve over time
5. **Cross-Workspace Searches:** Searches that work across multiple accounts
6. **Natural Language Queries:** "Show me articles about AI ethics from the last week"
7. **Scheduled Searches:** Run searches on specific schedules (e.g., daily digest)

---

## Dependencies

### External Libraries (Consider Adding)
- `nearley` or `chevrotain` - Advanced parser generators (if recursive descent becomes complex)
- `fuse.js` - Fuzzy matching for keyword search
- `compromise` - NLP for query understanding
- `react-syntax-highlighter` - Query syntax highlighting

### Internal Dependencies
- Semantic search service (embeddings)
- Pattern detection service (TF-IDF)
- Notification service
- Cache service
- Article scoring service

---

## Questions to Resolve Before Implementation

1. **Embedding Strategy:** Should saved search queries be embedded once and cached, or embedded on each search?
   - Recommendation: Cache embedded queries in Redis with TTL

2. **Real-time Updates:** Should saved search results update in real-time or on refresh?
   - Recommendation: Background updates every 5 minutes, with manual refresh option

3. **Search Scope:** Should saved searches only match new articles, or also existing ones?
   - Recommendation: Match all articles on creation, then only new ones incrementally

4. **Export Format:** What format for saved search export/import? (JSON, OPML, custom?)
   - Recommendation: JSON with schema versioning

5. **Threshold Behavior:** Should low-scoring matches be stored in database or filtered at query time?
   - Recommendation: Store all matches above 0.5, filter by user threshold at display time

6. **Notification Frequency:** How to prevent notification spam for highly active searches?
   - Recommendation: Rate limiting (max 10 notifications/hour per search) + daily digest option

---

## Conclusion

This implementation plan provides a structured approach to building the Saved Searches feature across 7 sprints (approximately 3 months). The phased approach allows for:

1. Early validation of core functionality (parser, execution engine)
2. Incremental user testing and feedback
3. Performance optimization based on real data
4. Flexible timeline adjustments based on complexity

The feature will significantly enhance NeuReed's value proposition by enabling dynamic, persistent content monitoring across all feeds without manual searching.
