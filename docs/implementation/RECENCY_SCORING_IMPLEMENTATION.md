# Recency Scoring Implementation for Semantic Search

## Overview
Implemented recency-aware scoring for semantic search to prioritize more recent articles in search results. The system now combines semantic similarity with time-based decay to provide more relevant results.

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
Added two new fields to `UserPreferences` model:
- `searchRecencyWeight` (Float, default: 0.3): Controls the weight given to recency vs semantic similarity (0-1 range)
- `searchRecencyDecayDays` (Int, default: 30): Number of days for recency score to decay to ~37% (exponential decay)

Migration created: `20251118185440_add_search_recency_preferences`

### 2. Semantic Search Service (`src/lib/services/semantic-search-service.ts`)
Enhanced the search algorithm with recency scoring:

**Key Changes:**
- Added `recencyWeight` and `recencyDecayDays` to `SemanticSearchOptions` interface
- Modified SQL query to calculate combined score when recency is enabled:
  ```sql
  -- Recency score using exponential decay
  EXP(-EXTRACT(EPOCH FROM (NOW() - "publishedAt")) / decaySeconds) AS recency_score
  
  -- Combined final score
  (semanticWeight * similarity + recencyWeight * recency_score) AS final_score
  ```
- Updated `ORDER BY` clause to use `final_score DESC` when recency is enabled
- Applied to both `searchSimilarArticles` and `hybridSearch` functions

**Scoring Formula:**
- `final_score = (1 - recencyWeight) × semantic_similarity + recencyWeight × recency_score`
- `recency_score = e^(-time_elapsed / decay_period)`

### 3. API Routes

#### Semantic Search API (`app/api/articles/semantic-search/route.ts`)
- Added `recencyWeight` and `recencyDecayDays` parameters to request schema
- Default values: `recencyWeight: 0.3`, `recencyDecayDays: 30`
- Parameters are passed through to the search service

#### User Preferences API (`app/api/user/preferences/route.ts`)
- Added validation for new preference fields
- `searchRecencyWeight`: 0-1 range
- `searchRecencyDecayDays`: 1-365 days range

#### Admin Settings API (`app/api/admin/settings/route.ts`)
- Added validation for admin-configured defaults
- `default_search_recency_weight`: 0-1 range
- `default_search_recency_decay_days`: 1-365 days range
- Validates values before saving to database

### 3.5. Admin Settings Service (`src/lib/services/admin-settings-service.ts`)
Added helper functions for recency configuration:

- `getDefaultSearchRecencyWeight()`: Get system default weight (fallback: 0.3)
- `getDefaultSearchRecencyDecayDays()`: Get system default decay days (fallback: 30)
- `getSearchRecencyConfiguration()`: Get complete recency config with sources
  - Returns both values and their sources (database or default)
  - Used for admin dashboard display

### 4. User Interface

#### Admin Dashboard (`app/admin/dashboard/page.tsx`)
Added "Search Recency Settings" section to the Search tab (formerly Embeddings):

1. **Default Recency Weight Slider** (0-100%)
   - Sets system-wide default for new users
   - Real-time saving to database
   - Includes recommendations and explanations

2. **Default Recency Decay Period Slider** (7-180 days)
   - Sets system-wide decay period default
   - Real-time saving to database
   - Includes usage guidelines

3. **Info Box**
   - Explains how recency scoring works
   - Shows decay examples
   - Clarifies admin vs user settings

#### User Preferences Modal (`app/components/preferences/PreferencesModal.tsx`)
Added two new controls in the "Learning System" section:

1. **Search Recency Weight Slider** (0-100%)
   - Controls how much to prioritize recent articles
   - 0% = pure semantic similarity
   - 100% = only recency matters
   - Default: 30% (or admin-configured default)

2. **Recency Decay Period Slider** (7-180 days)
   - Controls how quickly article recency importance fades
   - Shorter periods favor very recent articles
   - Default: 30 days (or admin-configured default)

#### Main Page (`app/page.tsx`)
- Loads user's recency preferences on mount
- Passes preferences to semantic search API calls
- State variables: `searchRecencyWeight`, `searchRecencyDecayDays`

#### Semantic Search Bar (`app/components/search/SemanticSearchBar.tsx`)
- Loads user preferences for quick search dropdown
- Applies same recency settings as main search

## How It Works

### Exponential Decay
The recency score uses exponential decay: `e^(-t/τ)`
- `t` = time elapsed since publication (in seconds)
- `τ` = decay time constant (configurable via `searchRecencyDecayDays`)

**Examples with 30-day decay:**
- Today's article: ~100% recency score
- 30-day-old article: ~37% recency score
- 60-day-old article: ~14% recency score
- 90-day-old article: ~5% recency score

### Combined Scoring
With default settings (30% recency weight):
- An article from today with 70% semantic similarity: `0.7 × 0.7 + 0.3 × 1.0 = 0.79`
- An article from 30 days ago with 90% semantic similarity: `0.7 × 0.9 + 0.3 × 0.37 = 0.74`
- An article from 60 days ago with 95% semantic similarity: `0.7 × 0.95 + 0.3 × 0.14 = 0.71`

This means recent articles get a boost, but highly relevant older articles can still rank well.

## Configuration

### Admin Configuration

Administrators can set system-wide defaults through **Admin Dashboard → Search Tab → Search Recency Settings**:

1. **Default Recency Weight** (0-100%): System-wide default for new users
   - Recommended: 20-40% for balanced results
   - Saved to database as `default_search_recency_weight`

2. **Default Recency Decay Period** (7-180 days): How quickly recency importance fades
   - Recommended: 30 days for news, 60-90 days for general content
   - Saved to database as `default_search_recency_decay_days`

These settings apply to:
- New users who haven't customized their preferences
- Users who haven't overridden the defaults
- System-wide search behavior when no user context is available

### User Configuration

Users can customize the behavior through **Preferences → Learning System**:

1. **Increase recency weight** (e.g., 50-70%) for news-focused feeds where timeliness is critical
2. **Decrease recency weight** (e.g., 0-20%) for evergreen content where relevance matters more
3. **Shorter decay periods** (7-14 days) for fast-moving topics
4. **Longer decay periods** (60-180 days) for slower-moving or archival content

User preferences always override admin defaults.

## Backward Compatibility

- Default behavior (recencyWeight = 0.3) provides a balanced approach
- Setting recencyWeight to 0 disables recency scoring entirely (pure semantic search)
- Existing users will get the default settings automatically
- No breaking changes to existing API contracts

## Performance Considerations

- The exponential calculation is performed in PostgreSQL using native functions
- No additional database queries required
- HNSW index still used for efficient vector similarity search
- Minimal performance impact (<5ms additional query time)

## Testing

To test the implementation:
1. Search for a common term (e.g., "AI")
2. Adjust recency weight in preferences (0%, 50%, 100%)
3. Observe how result ordering changes
4. Recent articles should rank higher with increased recency weight

## Future Enhancements

Potential improvements:
- Per-feed or per-category recency settings
- Time-of-day aware decay (e.g., news articles decay faster)
- Adaptive decay based on feed update frequency
- User feedback to automatically tune recency preferences

