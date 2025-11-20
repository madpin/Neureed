# NeuReed Configuration Reference

**Version:** 1.0  
**Last Updated:** November 2024

---

## Table of Contents

1. [Introduction](#introduction)
2. [User Preferences & Configurations](#user-preferences--configurations)
3. [Feed & Category Management](#feed--category-management)
4. [Article Interactions](#article-interactions)
5. [Admin Settings & Configurations](#admin-settings--configurations)
6. [Environment Variables](#environment-variables)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [Settings Hierarchy & Priority](#settings-hierarchy--priority)
9. [Identified Inconsistencies](#identified-inconsistencies)
10. [Recommendations](#recommendations)

---

## Introduction

### Purpose

This document serves as a comprehensive reference for all configuration options, preferences, and settings available in NeuReed. It is intended for:

- **Developers** understanding the system architecture
- **Administrators** configuring system-wide settings
- **Power Users** customizing their experience
- **Documentation maintainers** keeping track of features

### Document Organization

The document is organized into logical sections:
- **User-facing configurations** that individual users can control
- **Admin-level settings** that affect the entire system
- **Environment variables** for deployment configuration
- **API endpoints** for programmatic access
- **System architecture** explaining how settings cascade and interact

### Quick Reference

| Configuration Type | Count | Primary UI Location |
|-------------------|-------|---------------------|
| User Preferences | 30+ fields | Preferences Modal (User Menu → Preferences) |
| Admin Settings | 15+ settings | Admin Dashboard (`/admin/dashboard`) |
| Environment Variables | 35+ variables | `.env` file or deployment configuration |
| User API Endpoints | 22+ endpoints | `/api/user/*` |
| Admin API Endpoints | 15+ endpoints | `/api/admin/*` |

---

## User Preferences & Configurations

All user preferences are stored in the `UserPreferences` database model and can be accessed through the **Preferences Modal** (User Menu → Preferences).

### 1. Profile Settings

**UI Location:** Preferences Modal → Profile Tab

| Setting | Type | Description | Editable |
|---------|------|-------------|----------|
| Name | String | User's display name | Read-only (from OAuth) |
| Email | String | User's email address | Read-only (from OAuth) |
| Profile Picture | String (URL) | User's avatar image | Read-only (from OAuth) |

**Database Fields:** `User.name`, `User.email`, `User.image`  
**API Endpoint:** N/A (managed by NextAuth)

---

### 2. Appearance Settings

**UI Location:** Preferences Modal → Appearance Tab

#### Theme

| Field | Type | Default | Options |
|-------|------|---------|---------|
| `theme` | String | `"system"` | `"light"`, `"dark"`, `"nord-light"`, `"nord-dark"`, `"solarized-light"`, `"solarized-dark"`, `"barbie-light"`, `"barbie-dark"`, `"purple-light"`, `"purple-dark"`, `"orange-light"`, `"orange-dark"`, `"rainbow-light"`, `"rainbow-dark"`, `"system"` |

**Description:** Controls the color theme of the application. "system" automatically switches between light and dark based on device settings.

**Database Field:** `UserPreferences.theme`  
**API Endpoint:** `PUT /api/user/preferences`

#### Font Size

| Field | Type | Default | Options |
|-------|------|---------|---------|
| `fontSize` | String | `"medium"` | `"small"` (14px), `"medium"` (16px), `"large"` (18px), or custom value (e.g., "20px") |

**Description:** Controls the base font size for the application interface.

**Database Field:** `UserPreferences.fontSize`  
**API Endpoint:** `PUT /api/user/preferences`

#### Default Article View

| Field | Type | Default | Options |
|-------|------|---------|---------|
| `defaultView` | String | `"expanded"` | `"compact"`, `"expanded"` |

**Description:** Controls how articles are displayed in the feed list.

**Database Field:** `UserPreferences.defaultView`  
**API Endpoint:** `PUT /api/user/preferences`

---

### 3. Reading Preferences

**UI Location:** Preferences Modal → Reading Tab

#### Reading Panel Settings

| Field | Type | Default | Range/Options | Description |
|-------|------|---------|---------------|-------------|
| `readingPanelEnabled` | Boolean | `false` | `true`, `false` | Enable split-pane reading panel instead of separate page |
| `readingPanelPosition` | String | `"right"` | `"right"`, `"left"`, `"top"`, `"bottom"` | Position of the reading panel |
| `readingPanelSize` | Integer | `50` | 30-70 | Percentage of viewport for reading panel |

**Database Fields:** `UserPreferences.readingPanelEnabled`, `UserPreferences.readingPanelPosition`, `UserPreferences.readingPanelSize`  
**API Endpoint:** `PUT /api/user/preferences`

#### Reading Typography Settings

| Field | Type | Default | Range/Options | Description |
|-------|------|---------|---------------|-------------|
| `readingFontFamily` | String | `"Georgia"` | Any valid CSS font family | Font family for article content |
| `readingFontSize` | Integer | `18` | 12-24 (pixels) | Font size for article content |
| `readingLineHeight` | Float | `1.7` | 1.2-2.0 | Line height multiplier |
| `readingParagraphSpacing` | Float | `1.5` | 0.5-3.0 (rem) | Spacing between paragraphs |
| `breakLineSpacing` | Float | `0.75` | 0.25-1.5 (rem) | Spacing for `<br>` elements |
| `showReadingTime` | Boolean | `true` | `true`, `false` | Display estimated reading time |

**Database Fields:** `UserPreferences.readingFontFamily`, `UserPreferences.readingFontSize`, `UserPreferences.readingLineHeight`, `UserPreferences.readingParagraphSpacing`, `UserPreferences.breakLineSpacing`, `UserPreferences.showReadingTime`  
**API Endpoint:** `PUT /api/user/preferences`

#### Article Display Settings

| Field | Type | Default | Range/Options | Description |
|-------|------|---------|---------------|-------------|
| `articlesPerPage` | Integer | `20` | 5-100 | Number of articles per page |
| `infiniteScrollMode` | String | `"both"` | `"auto"`, `"button"`, `"both"` | How to load more articles |
| `showReadArticles` | Boolean | `true` | `true`, `false` | Display already-read articles |
| `autoMarkAsRead` | Boolean | `false` | `true`, `false` | Automatically mark articles as read when opened |
| `showRelatedExcerpts` | Boolean | `false` | `true`, `false` | Show excerpts in related articles section |

**Description:**
- `infiniteScrollMode`: 
  - `"auto"` = Auto-load when scrolling
  - `"button"` = Manual load button only
  - `"both"` = Auto-load + button

**Database Fields:** `UserPreferences.articlesPerPage`, `UserPreferences.infiniteScrollMode`, `UserPreferences.showReadArticles`, `UserPreferences.autoMarkAsRead`, `UserPreferences.showRelatedExcerpts`  
**API Endpoint:** `PUT /api/user/preferences`

#### Article Sorting

**UI Location:** Main header → Sort dropdown (also persisted to preferences)

| Field | Type | Default | Options | Description |
|-------|------|---------|---------|-------------|
| `articleSortOrder` | String | `"publishedAt"` | `"publishedAt"`, `"relevance"`, `"title"`, `"feed"`, `"updatedAt"` | Sort field |
| `articleSortDirection` | String | `"desc"` | `"asc"`, `"desc"` | Sort direction |

**Database Fields:** `UserPreferences.articleSortOrder`, `UserPreferences.articleSortDirection`  
**API Endpoint:** `PUT /api/user/preferences`

---

### 4. Learning System Settings

**UI Location:** Preferences Modal → Learning Tab

| Field | Type | Default | Range/Options | Description |
|-------|------|---------|---------------|-------------|
| `bounceThreshold` | Float | `0.25` | 0.10-0.50 | Percentage of reading time before article counts as "bounced" |
| `showLowRelevanceArticles` | Boolean | `true` | `true`, `false` | Display dimmed low-relevance articles vs hide completely |
| `searchRecencyWeight` | Float | `0.3` | 0.0-1.0 | Balance between semantic similarity (0) and recency (1) in search |
| `searchRecencyDecayDays` | Integer | `30` | 7-180 | Days for recency importance to decay to ~37% |

**Database Fields:** `UserPreferences.bounceThreshold`, `UserPreferences.showLowRelevanceArticles`, `UserPreferences.searchRecencyWeight`, `UserPreferences.searchRecencyDecayDays`  
**API Endpoint:** `PUT /api/user/preferences`

**Additional Actions:**
- **Reset Learning** button: Clears all learned patterns
  - **API Endpoint:** `POST /api/user/patterns/reset`

---

### 5. LLM Settings (User-Level)

**UI Location:** Preferences Modal → LLM Settings Tab

These settings allow users to override system-wide LLM configuration with their own credentials.

| Field | Type | Default | Options/Format | Description |
|-------|------|---------|----------------|-------------|
| `llmProvider` | String (nullable) | `null` | `null`, `"openai"`, `"ollama"` | LLM provider (null = use system default) |
| `llmSummaryModel` | String (nullable) | `null` | Model name string | Model for article summarization |
| `llmEmbeddingModel` | String (nullable) | `null` | Model name string | Model for semantic search embeddings |
| `llmDigestModel` | String (nullable) | `null` | Model name string | Model for digest generation (future) |
| `llmApiKey` | String (nullable) | `null` | API key string | OpenAI API key (encrypted in database) |
| `llmBaseUrl` | String (nullable) | `null` | URL string | Base URL for OpenAI-compatible endpoints or Ollama |
| `embeddingsEnabled` | Boolean | `false` | `true`, `false` | Enable semantic search for user's articles |

**Model Examples:**
- **OpenAI Summary Models:** `gpt-4o-mini`, `gpt-4o`, `gpt-3.5-turbo`
- **OpenAI Embedding Models:** `text-embedding-3-small`, `text-embedding-3-large`
- **Ollama Summary Models:** `llama2`, `mistral`, `codellama`
- **Ollama Embedding Models:** `nomic-embed-text`

**Database Fields:** `UserPreferences.llmProvider`, `UserPreferences.llmSummaryModel`, `UserPreferences.llmEmbeddingModel`, `UserPreferences.llmDigestModel`, `UserPreferences.llmApiKey`, `UserPreferences.llmBaseUrl`, `UserPreferences.embeddingsEnabled`  
**API Endpoint:** `PUT /api/user/preferences`

**Security Note:** API keys are encrypted using `ENCRYPTION_SECRET` before storage.

---

### 6. Feed & OPML Management

**UI Location:** Feed Management Modal (accessible from sidebar)

#### OPML Operations

| Action | UI Element | API Endpoint | Description |
|--------|-----------|--------------|-------------|
| Export OPML | Export button → Modal | `GET /api/user/opml/export` | Download feeds as OPML file |
| Import OPML | Import button → Modal | `POST /api/user/opml/import` | Upload and import OPML file |

**UI Location:** Feed Management Modal → Overview Tab

#### Feed Refresh & Cleanup Settings (User Defaults)

| Field | Type | Default | Range | Description |
|-------|------|---------|-------|-------------|
| `defaultRefreshInterval` | Integer | `60` | 15-1440 (minutes) | Default feed refresh interval |
| `defaultMaxArticlesPerFeed` | Integer | `500` | 50-5000 | Default max articles to keep per feed |
| `defaultMaxArticleAge` | Integer | `90` | 1-365 (days) | Default max article age before deletion |

**Database Fields:** `UserPreferences.defaultRefreshInterval`, `UserPreferences.defaultMaxArticlesPerFeed`, `UserPreferences.defaultMaxArticleAge`  
**API Endpoint:** `PUT /api/user/preferences`

**Note:** These are user-level defaults. They can be overridden at the category or individual feed level.

#### Category Override Settings

**UI Location:** Feed Management Modal → Category Settings View → Category Override Settings Section

Each category can override user default settings for all feeds in that category:

| Setting | Type | Range | Description |
|---------|------|-------|-------------|
| Refresh Interval | Integer (nullable) | 15-1440 minutes | Override user default refresh interval |
| Max Articles | Integer (nullable) | 50-5000 | Override user default max articles to keep |
| Max Article Age | Integer (nullable) | 1-365 days | Override user default max article age |

**Database Field:** `UserCategory.settings` (JSON)  
**API Endpoint:** `PUT /api/user/categories/{categoryId}/settings`

#### Per-Feed Override Settings

**UI Location:** Feed Management Modal → Feed Settings View → Feed Override Settings Section

Each subscribed feed can override category or user default settings:

| Setting | Type | Range | Description |
|---------|------|-------|-------------|
| Refresh Interval | Integer (nullable) | 15-1440 minutes | Override default refresh interval |
| Max Articles | Integer (nullable) | 50-5000 | Override max articles to keep |
| Max Article Age | Integer (nullable) | 1-365 days | Override max article age |

**Database Field:** `UserFeed.settings` (JSON)  
**API Endpoint:** `PUT /api/user/feeds/{feedId}/settings`

**Settings Hierarchy:** Feed Settings → Category Settings → User Defaults

**Note:** All feed management functionality (OPML operations, category management, feed settings, and override settings) is now consolidated in the Feed Management Modal for a unified experience.

---

### 7. Sidebar Settings

**UI Location:** Left sidebar

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `sidebarCollapsed` | Boolean | `false` | Sidebar collapsed to icon-only mode |
| `categoryStates` | JSON (nullable) | `null` | Object mapping categoryId to expanded state |

**Database Fields:** `UserPreferences.sidebarCollapsed`, `UserPreferences.categoryStates`  
**API Endpoint:** `PUT /api/user/preferences`

**Note:** These settings are automatically persisted when users interact with the sidebar. The collapse button is at the bottom of the sidebar.

---

## Feed & Category Management

### Feed Management Overview

Feeds can be managed through multiple UI locations:
1. **Sidebar** (left panel)
2. **Feed Management Modal** (accessed via sidebar "Manage" button or right-click context menu)
3. **Preferences Modal → Feeds & OPML Tab** (for settings only)

### Adding Feeds

#### Method 1: Add Feed Button (Sidebar)

**UI Location:** Sidebar → "+" button

**Process:**
1. Click "+" button in sidebar
2. Opens `AddFeedForm` modal
3. Enter RSS/Atom feed URL
4. System creates feed and subscribes user

**API Endpoints:**
- `POST /api/feeds` - Creates the feed if it doesn't exist
- `POST /api/user/feeds` - Subscribes user to the feed

#### Method 2: Browse Existing Feeds

**UI Location:** Sidebar → "Browse Feeds" button

**Process:**
1. Click "Browse Feeds" button
2. Opens `FeedBrowser` modal showing all available feeds
3. Subscribe/unsubscribe to existing feeds

**API Endpoints:**
- `GET /api/user/feeds?includeAll=true` - Get all feeds with subscription status
- `POST /api/user/feeds` - Subscribe to feed
- `DELETE /api/user/feeds/{userFeedId}` - Unsubscribe from feed

#### Method 3: Add to Category (Feed Management Modal)

**UI Location:** Feed Management Modal → Category View → Add Feeds section

**Process:**
1. Open Feed Management Modal
2. Navigate to a category
3. Choose "Add existing feed" or "Add new feed by URL"

**API Endpoints:**
- `POST /api/feeds` - Create new feed
- `POST /api/user/categories/{categoryId}/feeds` - Assign feed to category

---

### Category Management

**UI Location:** Feed Management Modal → Overview Tab

#### Creating Categories

**Process:**
1. Open Feed Management Modal (Sidebar → "Manage" button)
2. Click "Create New Category" button
3. Enter name and optional description
4. Click "Create"

**API Endpoint:** `POST /api/user/categories`

**Request Body:**
```json
{
  "name": "Technology",
  "description": "Tech news and articles"
}
```

#### Category Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | String | Required | Category name (unique per user) |
| `description` | String | Optional | Category description |
| `icon` | String | `"📁"` | Category icon (emoji or predefined) |
| `order` | Integer | `0` | Display order (for drag-and-drop) |
| `settings` | JSON | `null` | Category-level feed settings |

**Database Model:** `UserCategory`

#### Editing Categories

**UI Location:** Feed Management Modal → Category View

**Editable Fields:**
- Name (inline edit)
- Description (inline edit)
- Icon (icon picker modal)
- Category-level settings (refresh interval, max articles, max age)

**API Endpoint:** `PUT /api/user/categories/{categoryId}`

#### Deleting Categories

**UI Location:** Feed Management Modal → Overview Tab → Category → Delete button

**API Endpoint:** `DELETE /api/user/categories/{categoryId}`

**Note:** Feeds in deleted categories become uncategorized.

---

### Feed Organization

#### Drag & Drop

**UI Location:** Sidebar

**Capabilities:**
- Drag feed between categories
- Drag feed to "Uncategorized" section to remove from all categories
- Reorder categories (persisted to `UserCategory.order`)

**API Endpoints:**
- `POST /api/user/categories/{categoryId}/feeds` - Add feed to category
- `DELETE /api/user/feeds/{userFeedId}/categories` - Remove feed from all categories
- `POST /api/user/categories/reorder` - Update category order

#### Feed Context Menu

**UI Location:** Sidebar → Right-click on feed

**Options:**
- Refresh Feed
- Manage Feed
- Unsubscribe

**API Endpoints:**
- `POST /api/user/feeds/refresh` - Manually refresh feed
- `DELETE /api/user/feeds/{userFeedId}` - Unsubscribe from feed

---

### Category-Level Settings

**UI Location:** Feed Management Modal → Category View → Settings section

Categories can define default settings for all feeds within them:

| Setting | Type | Range | Description |
|---------|------|-------|-------------|
| Refresh Interval | Integer (nullable) | 15-1440 minutes | Override user default |
| Max Articles Per Feed | Integer (nullable) | 50-5000 | Override user default |
| Max Article Age | Integer (nullable) | 1-365 days | Override user default |

**Database Field:** `UserCategory.settings` (JSON)  
**API Endpoint:** `PUT /api/user/categories/{categoryId}/settings`

**Settings Hierarchy:** Feed Settings → **Category Settings** → User Defaults

---

### Feed-Level Settings

**UI Location:** Feed Management Modal → Feed View

Each feed can have its own specific settings:

| Setting | Type | Range | Description |
|---------|------|-------|-------------|
| Refresh Interval | Integer (nullable) | 15-1440 minutes | Override category/user default |
| Max Articles | Integer (nullable) | 50-5000 | Override category/user default |
| Max Article Age | Integer (nullable) | 1-365 days | Override category/user default |

**Database Field:** `UserFeed.settings` (JSON)  
**API Endpoint:** `PUT /api/user/feeds/{userFeedId}/settings`

**Settings Hierarchy:** **Feed Settings** → Category Settings → User Defaults

---

## Article Interactions

All article interactions contribute to the learning system and personalization.

### Reading Tracking

#### Mark as Read/Unread

**UI Location:** Article list → Article card → Eye icon button

**API Endpoint:** `POST /api/user/articles/{articleId}/read`

**Database Model:** `ReadArticle`

**Behavior:**
- Automatically marks as read if `autoMarkAsRead` preference is enabled
- Tracked with timestamp in `ReadArticle.readAt`

#### Article View Tracking

**API Endpoint:** `POST /api/user/articles/{articleId}/view`

**Purpose:** Tracks when user views an article (for analytics)

---

### Feedback System

#### Explicit Feedback (Thumbs Up/Down)

**UI Location:** Article detail page → Feedback buttons

**API Endpoint:** `POST /api/user/articles/{articleId}/feedback`

**Request Body:**
```json
{
  "feedbackValue": 1.0  // 1.0 for thumbs up, -1.0 for thumbs down
}
```

**Database Model:** `ArticleFeedback`

**Fields:**
- `feedbackType`: `"explicit"`
- `feedbackValue`: `1.0` (positive) or `-1.0` (negative)

**Effect:** Updates user patterns in real-time for personalization

#### Get Feedback

**API Endpoint:** `GET /api/user/articles/{articleId}/feedback`

**Response:** Returns user's feedback for the article (if any)

#### Delete Feedback

**API Endpoint:** `DELETE /api/user/articles/{articleId}/feedback`

---

### Bounce Detection (Implicit Feedback)

**Trigger:** When user exits an article before reading threshold

**API Endpoint:** `POST /api/user/articles/{articleId}/exit`

**Request Body:**
```json
{
  "timeSpent": 15,        // seconds spent on article
  "estimatedTime": 120    // estimated reading time in seconds
}
```

**Logic:**
- If `timeSpent / estimatedTime < bounceThreshold`, records as bounce
- Bounce threshold configured in user preferences (default 25%)

**Database Model:** `ArticleFeedback`

**Fields:**
- `feedbackType`: `"implicit"`
- `feedbackValue`: `-0.5` (bounce penalty)
- `timeSpent`: Actual time spent
- `estimatedTime`: Estimated reading time

**Effect:** Negative signal for pattern learning

---

### Pattern Learning

The system learns from user feedback to personalize article recommendations.

#### View Patterns

**UI Location:** User Menu → Learning Dashboard (`/preferences/analytics`)

**API Endpoints:**
- `GET /api/user/patterns` - Get all learned patterns
- `GET /api/user/patterns/stats` - Get pattern statistics

**Response Example:**
```json
{
  "patterns": [
    {
      "keyword": "typescript",
      "weight": 0.75,
      "feedbackCount": 8,
      "updatedAt": "2024-11-19T10:30:00Z"
    }
  ]
}
```

#### Feedback Statistics

**API Endpoint:** `GET /api/user/feedback/stats`

**Response:**
```json
{
  "stats": {
    "totalFeedback": 25,
    "explicitFeedback": 15,
    "implicitFeedback": 10,
    "positiveCount": 18,
    "negativeCount": 7,
    "bounceCount": 10
  }
}
```

#### Reset Patterns

**UI Location:** Preferences Modal → Learning Tab → Reset Learning button

**API Endpoint:** `POST /api/user/patterns/reset`

**Effect:** Clears all learned patterns for the user

---

### Related Articles

**UI Location:** Article detail page → Related Articles section

**Mechanism:** Uses semantic similarity (embeddings) to find related articles

**Requirements:**
- User must have `embeddingsEnabled: true` in preferences
- Articles must have embeddings generated

**API Endpoint:** `GET /api/user/articles/embeddings?query={query}`

**Display Options:**
- `showRelatedExcerpts` preference controls whether excerpts are shown

---

### Article Scoring

**API Endpoint:** `GET /api/user/articles/scores`

**Purpose:** Returns relevance scores for articles based on learned patterns

**Response:**
```json
{
  "scores": {
    "article-id-1": 0.85,
    "article-id-2": 0.42,
    "article-id-3": -0.15
  }
}
```

**Usage:** Used to rank and filter articles in the feed

---

## Admin Settings & Configurations

**Access:** Admin Dashboard at `/admin/dashboard` (requires admin authentication)

### Dashboard Tabs

The admin dashboard has 7 tabs:

1. **Overview** - System statistics and health
2. **Search** - Embedding and search configuration
3. **Users** - User management
4. **Jobs** - Manual job triggers and cron status
5. **Storage** - Cache and database management
6. **Config** - System configuration display (read-only)
7. **LLM Config** - System-wide LLM settings

---

### 1. Overview Tab

**Purpose:** Display system health and statistics

**Displays:**

#### Cache Status
- Connection status (connected/disconnected)
- Redis URL (masked)

#### Cache Statistics
- Total keys
- Memory usage
- Hit rate
- Uptime

**API Endpoints:**
- `GET /api/admin/cache/stats`
- `GET /api/admin/cache/status` (via cron status endpoint)

#### Embedding Statistics
- Total articles
- Articles with embeddings
- Articles pending embeddings
- Embedding coverage percentage

**API Endpoint:** `GET /api/admin/embeddings/stats`

#### User Statistics
- Total users
- Active users (with recent activity)

**API Endpoint:** `GET /api/admin/users`

---

### 2. Search Tab

**Purpose:** Configure embedding generation and search behavior

#### Embedding Configuration

| Setting | Type | Default | Options | Description |
|---------|------|---------|---------|-------------|
| Auto-Generate Embeddings | Boolean | `false` | `true`, `false` | Automatically generate embeddings for new articles |
| Embedding Provider | String | From env | `"openai"`, `"local"` | Which provider to use for embeddings |

**Database Keys:**
- `embedding_auto_generate`
- `embedding_provider`

**API Endpoints:**
- `PUT /api/admin/embeddings/auto-generate`
- `PUT /api/admin/embeddings/provider`

#### Manual Actions

| Action | Button | API Endpoint | Description |
|--------|--------|--------------|-------------|
| Generate Embeddings | Generate Now | `POST /api/admin/embeddings/generate` | Generate embeddings for all articles |
| Delete Embeddings | Delete All | `DELETE /api/admin/embeddings` | Remove all embeddings from database |

#### Search Recency Settings (Defaults for New Users)

| Setting | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| Default Recency Weight | Float | `0.3` | 0.0-1.0 | Default search recency weight for new users |
| Default Recency Decay Days | Integer | `30` | 7-180 | Default recency decay period for new users |

**Database Keys:**
- `default_search_recency_weight`
- `default_search_recency_decay_days`

**API Endpoint:** `PUT /api/admin/settings/defaults`

---

### 3. Users Tab

**Purpose:** View and manage users

**Displays:**
- List of all users
- User details (name, email, created date)
- User statistics

**API Endpoint:** `GET /api/admin/users`

**Note:** Currently read-only. User management features may be added in future.

---

### 4. Jobs Tab

**Purpose:** Manually trigger background jobs and view cron status

#### Manual Job Triggers

| Job | Button | API Endpoint | Description |
|-----|--------|--------------|-------------|
| Refresh All Feeds | Refresh Feeds | `POST /api/jobs/refresh-feeds` | Fetch new articles from all feeds |
| Generate Embeddings | Generate Embeddings | `POST /api/jobs/generate-embeddings` | Generate embeddings for articles |
| Run Cleanup | Run Cleanup | `POST /api/jobs/cleanup` | Clean up old articles based on settings |

#### Cron Status

**Display:**
- Cron job status (enabled/disabled)
- Last run times
- Next scheduled runs
- Job configurations

**API Endpoint:** `GET /api/admin/cron/status`

---

### 5. Storage Tab

**Purpose:** Manage cache and database storage

#### Cache Management

**Displays:**
- Cache statistics (keys, memory, hit rate)
- Cache status (connected/disconnected)

**Actions:**

| Action | Button | API Endpoint | Description |
|--------|--------|--------------|-------------|
| Clear Cache | Clear Cache | `POST /api/admin/cache/clear` | Clear all Redis cache |

**API Endpoints:**
- `GET /api/admin/cache/stats`
- `POST /api/admin/cache/clear`

#### Database Management

**Actions:**

| Action | Button | API Endpoint | Description |
|--------|--------|--------------|-------------|
| Reset Database | Reset Database | `POST /api/admin/database/reset` | **DANGEROUS:** Reset entire database |

**Warning:** Database reset is a destructive operation that cannot be undone.

---

### 6. Config Tab

**Purpose:** Display system configuration (read-only)

**Sections:**
- Authentication settings
- Embedding settings
- LLM settings
- Cache settings
- Content extraction settings
- Cron job settings
- Next.js settings
- TypeScript settings
- Environment variables

**API Endpoint:** `GET /api/admin/config`

**Note:** This tab is read-only and displays current configuration from environment variables and database settings.

---

### 7. LLM Config Tab

**Purpose:** Configure system-wide LLM settings and constraints

#### System-Wide LLM Credentials

These credentials are used as defaults for all users who don't provide their own.

| Setting | Type | Default | Options | Description |
|---------|------|---------|---------|-------------|
| Provider | String (nullable) | `null` | `null`, `"openai"`, `"ollama"` | System-wide LLM provider |
| API Key | String (nullable) | `null` | API key string | OpenAI API key (encrypted) |
| Base URL | String (nullable) | `null` | URL string | Base URL for API endpoint |
| Model | String (nullable) | `null` | Model name | Default model name |

**Database Keys:**
- `system_llm_provider`
- `system_llm_api_key` (encrypted)
- `system_llm_base_url`
- `system_llm_model`

**API Endpoints:**
- `GET /api/admin/settings/llm`
- `PUT /api/admin/settings/llm`

**Security:** API keys are encrypted using `ENCRYPTION_SECRET` before storage and masked when displayed.

#### Provider Control

Enable or disable specific embedding providers for all users.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| OpenAI Provider Enabled | Boolean | `true` | Allow users to use OpenAI provider |
| Local Provider Enabled | Boolean | `true` | Allow users to use local provider |

**Database Keys:**
- `openai_provider_enabled`
- `local_provider_enabled`

**API Endpoint:** `PUT /api/admin/settings/providers`

#### User Preference Constraints

Set limits on what users can configure.

| Constraint | Type | Default Min | Default Max | Description |
|------------|------|-------------|-------------|-------------|
| Refresh Interval | Integer | `15` | `1440` | Min/max feed refresh interval (minutes) |
| Max Articles Per Feed | Integer | `50` | `5000` | Min/max articles to keep per feed |
| Max Article Age | Integer | `1` | `365` | Min/max article age (days) |

**Database Keys:**
- `min_refresh_interval`, `max_refresh_interval`
- `min_max_articles_per_feed`, `max_max_articles_per_feed`
- `min_max_article_age`, `max_max_article_age`

**API Endpoint:** `PUT /api/admin/settings/constraints`

**Validation Limits:**
- Refresh Interval: 1-10080 minutes (1 week)
- Max Articles: 10-10000
- Max Age: 1-730 days (2 years)

#### Default User Preferences

Set default preferences for newly created users.

| Setting | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| Default Embeddings Enabled | Boolean | `false` | `true`, `false` | Enable embeddings for new users |
| Default Search Recency Weight | Float | `0.3` | 0.0-1.0 | Default recency weight |
| Default Search Recency Decay Days | Integer | `30` | 7-180 | Default decay period |

**Database Keys:**
- `default_embeddings_enabled`
- `default_search_recency_weight`
- `default_search_recency_decay_days`

**API Endpoint:** `PUT /api/admin/settings/defaults`

---

### Admin Settings Storage

All admin settings are stored in the `AdminSettings` database model:

```typescript
{
  id: string;          // Unique ID
  key: string;         // Setting key (unique)
  value: Json;         // Setting value (any JSON type)
  description: string; // Human-readable description
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Service:** `src/lib/services/admin-settings-service.ts`

**Key Functions:**
- `getAdminSetting(key, envFallback)` - Get setting with env fallback
- `updateAdminSetting(key, value, description)` - Update or create setting
- `getAllAdminSettings()` - Get all settings
- `deleteAdminSetting(key)` - Delete setting

---

## Environment Variables

All environment variables are defined in `src/env.ts` using `@t3-oss/env-nextjs` for validation.

### Database

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `DATABASE_URL` | URL | Yes | - | PostgreSQL connection string |

**Example:** `postgresql://user:password@localhost:5432/neureed`

---

### Authentication

#### NextAuth Configuration

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NEXTAUTH_URL` | URL | No | - | NextAuth base URL |
| `NEXTAUTH_SECRET` | String | Yes | - | NextAuth secret (min 32 chars) |
| `AUTH_TRUST_HOST` | Boolean | No | `false` | Trust host header |

#### Google OAuth

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` | String | No | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | String | No | - | Google OAuth client secret |

#### GitHub OAuth

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `GITHUB_CLIENT_ID` | String | No | - | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | String | No | - | GitHub OAuth client secret |

#### Generic OAuth2

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `OAUTH_CLIENT_ID` | String | No | - | Generic OAuth2 client ID |
| `OAUTH_CLIENT_SECRET` | String | No | - | Generic OAuth2 client secret |
| `OAUTH_ISSUER` | String | No | - | OAuth issuer URL |
| `OAUTH_AUTHORIZATION_URL` | URL | No | - | OAuth authorization endpoint |
| `OAUTH_TOKEN_URL` | URL | No | - | OAuth token endpoint |
| `OAUTH_USERINFO_URL` | URL | No | - | OAuth userinfo endpoint |
| `OAUTH_PROVIDER_NAME` | String | No | `"OAuth"` | Display name for OAuth provider |

---

### Embeddings

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `OPENAI_API_KEY` | String | No | - | OpenAI API key for embeddings |
| `OPENAI_BASE_URL` | URL | No | - | OpenAI-compatible endpoint URL |
| `EMBEDDING_PROVIDER` | Enum | No | `"local"` | `"openai"` or `"local"` |
| `EMBEDDING_MODEL` | String | No | `"text-embedding-3-small"` | Embedding model name |
| `EMBEDDING_BATCH_SIZE` | Integer | No | `10` | Batch size for generation |
| `EMBEDDING_AUTO_GENERATE` | Boolean | No | `false` | Auto-generate on article creation |

**Notes:**
- `OPENAI_BASE_URL` can be used for Azure OpenAI or other compatible services
- `local` provider uses a local embedding model (implementation-specific)

---

### Content Extraction

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `ENCRYPTION_SECRET` | String | Yes | Dev default | Secret for encrypting API keys (min 32 chars) |
| `PLAYWRIGHT_ENABLED` | Boolean | No | `false` | Enable Playwright for JS rendering |
| `EXTRACTION_TIMEOUT` | Integer | No | `30000` | Timeout in milliseconds |

**Security Warning:** The dev default for `ENCRYPTION_SECRET` should **never** be used in production.

---

### Cache (Redis)

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `REDIS_URL` | URL | No | `redis://localhost:6379` | Redis connection URL |
| `REDIS_PASSWORD` | String | No | - | Redis password |
| `CACHE_ENABLED` | Boolean | No | `true` | Enable caching |

**Notes:**
- If Redis is unavailable, the app will function without caching
- Cache is used for feed data, article data, and API responses

---

### LLM

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `LLM_PROVIDER` | Enum | No | `"openai"` | `"openai"` or `"ollama"` |
| `LLM_MODEL` | String | No | `"gpt-4o-mini"` | Default LLM model |
| `LLM_SUMMARY_MODEL` | String | No | `"gpt-4o-mini"` | Model for summarization |
| `LLM_DIGEST_MODEL` | String | No | `"gpt-4o-mini"` | Model for digest generation |
| `OLLAMA_BASE_URL` | URL | No | `http://localhost:11434` | Ollama instance URL |

**Notes:**
- These are system-wide defaults
- Can be overridden by admin settings
- Can be overridden by individual users

---

### Cron Jobs

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `ENABLE_CRON_JOBS` | Boolean | No | `true` | Enable scheduled jobs |
| `FEED_REFRESH_SCHEDULE` | Cron | No | `*/30 * * * *` | Feed refresh schedule (every 30 min) |
| `CLEANUP_SCHEDULE` | Cron | No | `0 3 * * *` | Cleanup schedule (daily at 3 AM) |

**Cron Expression Format:** Standard cron format (minute hour day month weekday)

**Examples:**
- `*/30 * * * *` - Every 30 minutes
- `0 * * * *` - Every hour
- `0 3 * * *` - Daily at 3 AM
- `0 0 * * 0` - Weekly on Sunday at midnight

---

### General

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NODE_ENV` | Enum | No | `"development"` | `"development"`, `"test"`, or `"production"` |
| `SKIP_ENV_VALIDATION` | Boolean | No | `false` | Skip environment validation (for Docker) |

---

## API Endpoints Reference

### User Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/preferences` | Get user preferences |
| `PUT` | `/api/user/preferences` | Update user preferences |

---

### Feed Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/feeds` | Get all feeds |
| `POST` | `/api/feeds` | Create new feed |
| `GET` | `/api/feeds/{feedId}` | Get feed details |
| `PUT` | `/api/feeds/{feedId}` | Update feed |
| `DELETE` | `/api/feeds/{feedId}` | Delete feed |
| `POST` | `/api/feeds/{feedId}/refresh` | Manually refresh feed |

---

### User Feed Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/feeds` | Get user's subscribed feeds |
| `POST` | `/api/user/feeds` | Subscribe to feed |
| `GET` | `/api/user/feeds/{userFeedId}` | Get subscription details |
| `DELETE` | `/api/user/feeds/{userFeedId}` | Unsubscribe from feed |
| `GET` | `/api/user/feeds/{userFeedId}/settings` | Get feed settings |
| `PUT` | `/api/user/feeds/{userFeedId}/settings` | Update feed settings |
| `DELETE` | `/api/user/feeds/{userFeedId}/categories` | Remove feed from all categories |
| `POST` | `/api/user/feeds/refresh` | Manually refresh user's feeds |

**Query Parameters for `GET /api/user/feeds`:**
- `?includeAll=true` - Include all feeds (not just subscribed)
- `?groupByCategory=true` - Group feeds by category

---

### Category Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/categories` | Get user's categories |
| `POST` | `/api/user/categories` | Create category |
| `GET` | `/api/user/categories/{categoryId}` | Get category details |
| `PUT` | `/api/user/categories/{categoryId}` | Update category |
| `DELETE` | `/api/user/categories/{categoryId}` | Delete category |
| `GET` | `/api/user/categories/{categoryId}/settings` | Get category settings |
| `PUT` | `/api/user/categories/{categoryId}/settings` | Update category settings |
| `POST` | `/api/user/categories/{categoryId}/feeds` | Add feed to category |
| `DELETE` | `/api/user/categories/{categoryId}/feeds/{userFeedId}` | Remove feed from category |
| `POST` | `/api/user/categories/reorder` | Reorder categories |

---

### Articles

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/articles` | Get articles (with filters) |
| `GET` | `/api/articles/{articleId}` | Get article details |

**Query Parameters for `GET /api/articles`:**
- `?feedId={id}` - Filter by feed
- `?categoryId={id}` - Filter by category
- `?topic={topic}` - Filter by topic
- `?unreadOnly=true` - Only unread articles
- `?sortBy={field}` - Sort field
- `?sortDirection={asc|desc}` - Sort direction
- `?page={n}` - Page number
- `?limit={n}` - Items per page

---

### Article Interactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/user/articles/{articleId}/read` | Mark article as read/unread |
| `POST` | `/api/user/articles/{articleId}/view` | Track article view |
| `POST` | `/api/user/articles/{articleId}/exit` | Track article exit (bounce detection) |
| `GET` | `/api/user/articles/{articleId}/feedback` | Get user's feedback |
| `POST` | `/api/user/articles/{articleId}/feedback` | Submit feedback (thumbs up/down) |
| `DELETE` | `/api/user/articles/{articleId}/feedback` | Delete feedback |
| `GET` | `/api/user/articles/scores` | Get relevance scores for articles |
| `GET` | `/api/user/articles/embeddings` | Semantic search |

**Query Parameters for `GET /api/user/articles/embeddings`:**
- `?query={text}` - Search query (required)
- `?limit={n}` - Number of results

---

### Pattern Learning

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/patterns` | Get learned patterns |
| `GET` | `/api/user/patterns/stats` | Get pattern statistics |
| `POST` | `/api/user/patterns/reset` | Reset all learned patterns |
| `GET` | `/api/user/feedback/stats` | Get feedback statistics |

---

### OPML

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/opml/export` | Export feeds as OPML |
| `POST` | `/api/user/opml/import` | Import feeds from OPML |

---

### Admin - Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/settings` | Get all admin settings overview |
| `GET` | `/api/admin/settings/llm` | Get system LLM credentials |
| `PUT` | `/api/admin/settings/llm` | Update system LLM credentials |
| `GET` | `/api/admin/settings/providers` | Get provider status |
| `PUT` | `/api/admin/settings/providers` | Update provider status |
| `GET` | `/api/admin/settings/constraints` | Get user constraints |
| `PUT` | `/api/admin/settings/constraints` | Update user constraints |
| `GET` | `/api/admin/settings/defaults` | Get default user preferences |
| `PUT` | `/api/admin/settings/defaults` | Update default user preferences |

---

### Admin - Embeddings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/embeddings/stats` | Get embedding statistics |
| `POST` | `/api/admin/embeddings/generate` | Generate embeddings for all articles |
| `DELETE` | `/api/admin/embeddings` | Delete all embeddings |
| `GET` | `/api/admin/embeddings/auto-generate` | Get auto-generate setting |
| `PUT` | `/api/admin/embeddings/auto-generate` | Update auto-generate setting |
| `GET` | `/api/admin/embeddings/provider` | Get embedding provider |
| `PUT` | `/api/admin/embeddings/provider` | Update embedding provider |

---

### Admin - Cache

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/cache/stats` | Get cache statistics |
| `POST` | `/api/admin/cache/clear` | Clear all cache |

---

### Admin - Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/config` | Get system configuration |
| `GET` | `/api/admin/users` | Get all users |
| `GET` | `/api/admin/cron/status` | Get cron job status |
| `POST` | `/api/admin/cron/trigger` | Manually trigger cron job |
| `POST` | `/api/admin/database/reset` | Reset database (DANGEROUS) |
| `POST` | `/api/admin/cleanup` | Run cleanup job |

---

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/jobs/refresh-feeds` | Refresh all feeds |
| `POST` | `/api/jobs/generate-embeddings` | Generate embeddings |
| `POST` | `/api/jobs/cleanup` | Run cleanup |

---

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check endpoint |

---

## Settings Hierarchy & Priority

NeuReed uses a cascading settings system where more specific settings override more general ones.

### Feed Refresh Settings Hierarchy

**Priority Order (highest to lowest):**

1. **Feed-Level Settings** (`UserFeed.settings`)
   - Set per individual feed
   - UI: Feed Management Modal → Feed View
   - API: `PUT /api/user/feeds/{userFeedId}/settings`

2. **Category-Level Settings** (`UserCategory.settings`)
   - Set per category, applies to all feeds in category
   - UI: Feed Management Modal → Category View
   - API: `PUT /api/user/categories/{categoryId}/settings`

3. **User Default Settings** (`UserPreferences`)
   - User's personal defaults
   - UI: Preferences Modal → Feeds & OPML Tab
   - API: `PUT /api/user/preferences`

4. **Admin Constraints** (`AdminSettings`)
   - System-wide min/max limits
   - UI: Admin Dashboard → LLM Config Tab
   - API: `PUT /api/admin/settings/constraints`

5. **Environment Variables**
   - `FEED_REFRESH_SCHEDULE` (cron expression)
   - Fallback if no other settings exist

**Example Resolution:**

```
Feed has refreshInterval: 30 minutes
Category has refreshInterval: 60 minutes
User default: 120 minutes
Admin min: 15, max: 1440 minutes

Result: Feed uses 30 minutes (most specific setting)
```

**Settings That Cascade:**
- `refreshInterval` (minutes)
- `maxArticlesPerFeed` (count)
- `maxArticleAge` (days)

---

### LLM Credentials Hierarchy

**Priority Order (highest to lowest):**

1. **User-Level Credentials** (`UserPreferences`)
   - User's personal API keys and models
   - UI: Preferences Modal → LLM Settings Tab
   - API: `PUT /api/user/preferences`
   - Fields: `llmProvider`, `llmApiKey`, `llmBaseUrl`, `llmSummaryModel`, `llmEmbeddingModel`, `llmDigestModel`

2. **Admin System Credentials** (`AdminSettings`)
   - System-wide credentials for users without personal credentials
   - UI: Admin Dashboard → LLM Config Tab
   - API: `PUT /api/admin/settings/llm`
   - Keys: `system_llm_provider`, `system_llm_api_key`, `system_llm_base_url`, `system_llm_model`

3. **Environment Variables**
   - `LLM_PROVIDER`, `LLM_MODEL`, `LLM_SUMMARY_MODEL`, `LLM_DIGEST_MODEL`
   - `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OLLAMA_BASE_URL`
   - Fallback if no database settings exist

**Resolution Logic:**

```typescript
// Pseudo-code for LLM provider resolution
function getLLMProvider(userId) {
  const userPrefs = getUserPreferences(userId);
  if (userPrefs.llmProvider !== null) {
    return userPrefs.llmProvider; // User override
  }
  
  const adminSettings = getAdminSetting('system_llm_provider');
  if (adminSettings !== null) {
    return adminSettings; // Admin system default
  }
  
  return env.LLM_PROVIDER; // Environment fallback
}
```

**Model-Specific Resolution:**

Each LLM feature (summary, embedding, digest) can have its own model:

- User can set `llmSummaryModel`, `llmEmbeddingModel`, `llmDigestModel`
- Falls back to admin `system_llm_model`
- Falls back to env `LLM_SUMMARY_MODEL`, `LLM_MODEL`, etc.

---

### Embedding Settings Hierarchy

**Priority Order:**

1. **User Embedding Preferences** (`UserPreferences.embeddingsEnabled`)
   - User enables/disables embeddings for their articles
   - UI: Preferences Modal → LLM Settings Tab
   - API: `PUT /api/user/preferences`

2. **Admin Embedding Configuration** (`AdminSettings`)
   - `embedding_auto_generate` - Auto-generate for all new articles
   - `embedding_provider` - Which provider to use
   - UI: Admin Dashboard → Search Tab
   - API: `PUT /api/admin/embeddings/auto-generate`, `PUT /api/admin/embeddings/provider`

3. **Environment Variables**
   - `EMBEDDING_AUTO_GENERATE`, `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`
   - System-wide defaults

**Auto-Generation Logic:**

```typescript
// Embeddings are generated if:
// 1. Admin has enabled auto-generate globally, OR
// 2. User has enabled embeddings personally

function shouldGenerateEmbedding(userId, articleId) {
  const adminAutoGenerate = getAdminSetting('embedding_auto_generate');
  const userEnabled = getUserPreference(userId, 'embeddingsEnabled');
  
  return adminAutoGenerate || userEnabled;
}
```

---

### Search Recency Settings

**Priority Order:**

1. **User Personal Settings** (`UserPreferences`)
   - `searchRecencyWeight` (0.0-1.0)
   - `searchRecencyDecayDays` (7-180)
   - UI: Preferences Modal → Learning Tab
   - API: `PUT /api/user/preferences`

2. **Admin Default Settings** (`AdminSettings`)
   - `default_search_recency_weight`
   - `default_search_recency_decay_days`
   - Used for new users
   - UI: Admin Dashboard → Search Tab
   - API: `PUT /api/admin/settings/defaults`

3. **Hardcoded Defaults**
   - Weight: `0.3`
   - Decay: `30` days

---

### Provider Control

Admins can disable specific providers system-wide:

**Admin Settings:**
- `openai_provider_enabled` (Boolean)
- `local_provider_enabled` (Boolean)

**Effect:**
- If provider is disabled, users cannot select it
- Existing user configurations using disabled provider will fall back to system default
- UI: Admin Dashboard → LLM Config Tab
- API: `PUT /api/admin/settings/providers`

---

## Identified Inconsistencies

Based on comprehensive codebase analysis, the following inconsistencies have been identified:

### 1. Settings Hierarchy Confusion ✅ RESOLVED

**Issue:** Feed settings could be configured at 3 levels (user default, category, feed) but the UI showed this in two different places:
- **Preferences Modal → Feeds Tab:** User defaults + per-feed overrides
- **Feed Management Modal:** Category settings + per-feed overrides

**Resolution:** All feed management functionality has been consolidated into the Feed Management Modal:
- **OPML Operations:** Import/Export moved to Feed Management Modal → Overview Tab
- **Category Override Settings:** Available in Feed Management Modal → Category Settings View
- **Feed Override Settings:** Available in Feed Management Modal → Feed Settings View
- **Visual Indicators:** Each override setting now shows the effective value and its source
- **Settings Hierarchy:** Clearly displayed as Feed → Category → User Default

**Changes Made:**
- Removed "Feeds & OPML" tab from Preferences Modal
- Added OPML import/export to Feed Management Modal Overview
- Added Category Override Settings section to CategorySettingsView
- Added Feed Override Settings section to FeedSettingsView
- All settings now show effective values with source attribution

**Affected Files:**
- `app/components/preferences/PreferencesModal.tsx` - Removed feeds tab
- `app/components/feeds/FeedManagementModal.tsx` - Added OPML operations and override settings

---

### 2. LLM Configuration Duplication

**Issue:** LLM settings exist at both admin and user levels with overlapping functionality:
- Admin sets system-wide credentials (provider, API key, base URL, model)
- Users can override with their own credentials (same fields)
- No clear indication in UI that user settings override system settings

**Impact:** Users may not understand that their settings override system defaults, or may unnecessarily configure credentials when system defaults would work.

**Recommendation:**
- Add visual indicator in user LLM settings showing if system defaults are available
- Display "Using system default" when user hasn't configured personal settings
- Add "Test Connection" button to verify credentials
- Show which settings are active (user vs system)

**Affected Files:**
- `app/components/preferences/PreferencesModal.tsx` (LLMView)
- `app/admin/dashboard/page.tsx` (LLMConfigTab)

---

### 3. Embedding Settings Scattered

**Issue:** Embedding-related settings are in multiple places:
- **Admin Dashboard → Search Tab:** Auto-generate, provider
- **User Preferences → LLM Settings:** Enable embeddings, embedding model
- **Environment Variables:** Provider, model, batch size, auto-generate

**Impact:** Difficult to understand where embeddings are configured and which settings affect what.

**Recommendation:**
- Create dedicated "Embeddings" section in user preferences
- Group all embedding-related settings together
- Clearly separate "Enable semantic search" from "Embedding provider configuration"
- Add documentation link explaining embeddings

**Affected Files:**
- `app/components/preferences/PreferencesModal.tsx`
- `app/admin/dashboard/page.tsx`

---

### 4. Search Recency Settings Duplication

**Issue:** Search recency settings appear in two places:
- **User Preferences → Learning Tab:** User's personal settings
- **Admin Dashboard → Search Tab:** Default for new users

**Impact:** This is actually correct behavior, but not well documented.

**Recommendation:**
- Add tooltip in admin panel: "These are defaults for new users. Existing users keep their settings."
- Add tooltip in user preferences: "These settings control how search balances recency vs relevance."
- Consider adding "Reset to system default" button in user preferences

**Status:** Low priority - behavior is correct, just needs better documentation.

---

### 5. Feed Refresh Settings Complexity

**Issue:** Refresh intervals can be set at 4 levels:
- Environment variable (`FEED_REFRESH_SCHEDULE`)
- User default preference
- Category setting
- Individual feed setting

**Impact:** Complex to understand which setting is actually being used.

**Recommendation:**
- Display effective setting with source in UI
- Add visual hierarchy diagram in documentation
- Show "Effective: 60 minutes (from category)" in feed settings
- Add "Reset to default" button to clear overrides

**Affected Files:**
- `app/components/preferences/PreferencesModal.tsx`
- `app/components/feeds/FeedManagementModal.tsx`

---

### 6. Missing UI for Some Admin Settings

**Issue:** Some admin settings in the database have no UI:
- All settings are stored in `AdminSettings` table
- Only subset exposed in admin dashboard
- No generic admin settings editor

**Examples of settings without UI:**
- Individual constraint values (have UI in LLM Config tab)
- Provider enable/disable (have UI in LLM Config tab)
- Custom admin settings added via API

**Recommendation:**
- Add "Advanced Settings" tab in admin dashboard
- Show all settings in `AdminSettings` table
- Allow editing with JSON schema validation
- Add warnings for dangerous settings

**Affected Files:**
- `app/admin/dashboard/page.tsx`

---

### 7. Article Sorting Location

**Issue:** Article sorting preferences are saved to user preferences but the UI is only in the main header dropdown, not in the Preferences Modal.

**Impact:** Users may not realize sorting is persisted or may want to reset to default.

**Recommendation:**
- Add article sorting section to Preferences Modal → Reading Tab
- Include both sort order and direction
- Add "Reset to default" button
- Keep header dropdown for quick access

**Affected Files:**
- `app/components/preferences/PreferencesModal.tsx`
- `app/components/articles/ArticleSortDropdown.tsx`

---

### 8. Category States Not User-Editable

**Issue:** `UserPreferences.categoryStates` (which categories are expanded) is automatically persisted but users can't bulk reset or configure this.

**Impact:** If sidebar state gets corrupted or user wants to reset, no UI option available.

**Recommendation:**
- Add "Reset sidebar state" button in Preferences Modal → Appearance or Reading tab
- Add "Expand all" / "Collapse all" buttons in sidebar
- Consider adding to "Advanced" section

**Affected Files:**
- `app/components/preferences/PreferencesModal.tsx`
- `app/components/feeds/CategoryList.tsx`

---

### 9. Sidebar Collapse State

**Issue:** Sidebar collapse state is in user preferences but the toggle is only in the main UI, not in preferences.

**Impact:** Minor - this is actually fine for UX, but could be documented.

**Recommendation:**
- Add note in Preferences Modal that sidebar collapse is managed by button at bottom of sidebar
- Consider adding to Appearance tab for consistency
- Low priority

**Status:** Low priority - current behavior is acceptable.

---

### 10. Reading Typography Settings Missing Preview

**Issue:** Typography settings (font, size, line height, etc.) are in Preferences → Reading but don't show any preview or apply in real-time.

**Impact:** Users must save and view an article to see effect of changes.

**Recommendation:**
- Add live preview panel showing sample article text
- Apply settings immediately to preview (not saved until "Save" clicked)
- Show before/after comparison

**Affected Files:**
- `app/components/preferences/PreferencesModal.tsx` (ReadingView)

---

## Recommendations

### High Priority

1. **Add Settings Source Indicators**
   - Show where each setting comes from (feed/category/user/system)
   - Add tooltips explaining hierarchy
   - Display effective values with source

2. **Consolidate Embedding Settings**
   - Create dedicated "Embeddings" section in user preferences
   - Group all related settings together
   - Add clear documentation

3. **Improve Feed Settings UX**
   - Add visual hierarchy indicators
   - Show effective settings with source
   - Add "Reset to default" buttons

4. **Add LLM Connection Testing**
   - "Test Connection" button for user and admin LLM settings
   - Validate credentials before saving
   - Show connection status

### Medium Priority

5. **Add Article Sorting to Preferences**
   - Include in Preferences Modal → Reading Tab
   - Keep header dropdown for quick access
   - Add reset button

6. **Add Reading Typography Preview**
   - Live preview panel in preferences
   - Apply changes immediately to preview
   - Show before/after

7. **Add Advanced Admin Settings Tab**
   - Show all settings in AdminSettings table
   - Allow editing with validation
   - Add warnings for dangerous settings

### Low Priority

8. **Add Sidebar State Management**
   - "Reset sidebar state" button
   - "Expand all" / "Collapse all" buttons
   - Document current behavior

9. **Improve Documentation**
   - Add in-app help tooltips
   - Link to documentation from settings
   - Add video tutorials

10. **Add Settings Export/Import**
    - Allow users to export their preferences
    - Import preferences from file
    - Useful for backup and migration

---

## Summary Statistics

### Configuration Counts

| Category | Count |
|----------|-------|
| User Preference Fields | 30 |
| Admin Settings | 15+ |
| Environment Variables | 35 |
| User API Endpoints | 22 |
| Admin API Endpoints | 15 |
| Job Endpoints | 3 |
| Database Models | 13 |

### UI Locations

| Interface | Purpose |
|-----------|---------|
| Preferences Modal | User preferences (6 tabs) |
| Feed Management Modal | Feed/category management (3 views) |
| Admin Dashboard | System administration (7 tabs) |
| Sidebar | Quick feed access and organization |
| Main Header | Search, sort, user menu |
| Learning Dashboard | View learned patterns and feedback |

### Settings Hierarchies

| Setting Type | Levels |
|--------------|--------|
| Feed Refresh | 4 (env → user → category → feed) |
| LLM Credentials | 3 (env → admin → user) |
| Embedding Config | 3 (env → admin → user) |
| Search Recency | 2 (admin default → user) |

---

## Document Maintenance

**Last Updated:** November 2024  
**Version:** 1.0  
**Maintainers:** Development Team

**Update Triggers:**
- New user preference added
- New admin setting added
- New environment variable added
- New API endpoint added
- Settings hierarchy changed
- UI location changed

**Related Documentation:**
- `README.md` - Project overview
- `docs/DEPLOYMENT.md` - Deployment guide
- `docs/ADMIN_PANEL_PROVIDER_CONTROL.md` - Provider control details
- `docs/ADMIN_LLM_CONFIG_API.md` - LLM configuration API
- `docs/implementation/USER_EMBEDDING_PREFERENCES.md` - Embedding preferences

---

*End of Configuration Reference*

