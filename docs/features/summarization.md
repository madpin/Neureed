# Automatic Article Summarization Feature

## Overview

This feature automatically generates summaries for RSS feed articles using LLM providers (OpenAI or Ollama). Summaries are generated asynchronously after articles are fetched, without blocking the feed refresh process.

## Architecture

### Flow Diagram

```
Feed Refresh Starts
    ↓
Articles Fetched & Saved
    ↓
Embeddings Generated (if enabled)
    ↓
[Background] Summarization Triggered →→→ [Async Processing]
    ↓                                          ↓
Feed Refresh Completes                    Check Settings
    ↓                                          ↓
User Notification (Feed Refresh)          Filter Articles
                                               ↓
                                          Generate Summaries
                                               ↓
                                          Track Costs
                                               ↓
                                          User Notification (Summarization Complete)
```

### Components

1. **Cost Tracker** ([src/lib/services/summarization-cost-tracker.ts](../src/lib/services/summarization-cost-tracker.ts))
   - Tracks token usage and costs per provider, user, and time period

2. **Settings Cascade** ([src/lib/services/feed-settings-cascade.ts](../src/lib/services/feed-settings-cascade.ts))
   - Per-feed configuration with cascade from user defaults

3. **Admin Controls** ([src/lib/services/admin-settings-service.ts](../src/lib/services/admin-settings-service.ts))
   - System-wide enable/disable toggle

4. **Processing Service** ([src/lib/services/article-summarization-service.ts](../src/lib/services/article-summarization-service.ts))
   - Orchestrates summarization with filtering and batch processing

5. **LLM Integration** ([src/lib/services/summarization-service.ts](../src/lib/services/summarization-service.ts))
   - Generates summaries with cost tracking

## User-Visible Features

### 1. Notifications

Users receive notifications in the notification bell when:

**Feed Refresh Complete (Immediate)**
- Shows new and updated articles
- Shows embeddings generated (if enabled)
- Shows cleanup stats

**Article Summarization Complete (Later, Async)**
- Shows number of articles summarized
- Shows failed attempts (if any)
- Shows skipped articles (if any)
- Type: `info` (or `warning` if failures occurred)

**Manual Summarization Complete**
- When user triggers manual summarization
- Shows success/failure counts
- Type: `success` or `warning`

### 2. API Endpoints for Users

#### Check Pending Summarization
```bash
GET /api/user/articles/summarize?feedId={feedId}&limit=50
```

**Response:**
```json
{
  "data": {
    "articles": [
      {
        "id": "article-123",
        "title": "Article Title",
        "feedId": "feed-456",
        "feedTitle": "Feed Name",
        "contentLength": 8500,
        "publishedAt": "2025-01-15T10:30:00Z"
      }
    ],
    "totalCount": 25,
    "systemEnabled": true,
    "costEstimate": {
      "articleCount": 25,
      "estimatedTokens": 45000,
      "estimatedCost": 0.0135
    }
  }
}
```

#### Manually Trigger Summarization
```bash
POST /api/user/articles/summarize
Content-Type: application/json

{
  "feedId": "feed-456",        // Optional: limit to specific feed
  "articleIds": ["id1", "id2"], // Optional: specific articles
  "limit": 10                   // Optional: max articles to process
}
```

**Response:**
```json
{
  "data": {
    "success": 8,
    "failed": 2,
    "totalTokens": 15420,
    "errors": ["article-123: API rate limit exceeded"]
  },
  "message": "Summarized 8 articles, 2 failed"
}
```

#### Get Feed Summarization Settings
```bash
GET /api/feeds/{feedId}/summarization
```

**Response:**
```json
{
  "data": {
    "feedId": "feed-123",
    "feedTitle": "My Tech Feed",
    "systemEnabled": true,
    "effectiveSettings": {
      "enabled": true,
      "minContentLength": 5000,
      "includeKeyPoints": true,
      "includeTopics": true
    },
    "source": "feed"  // or "category", "user", "system"
  }
}
```

#### Update Feed Summarization Settings
```bash
PUT /api/feeds/{feedId}/summarization
Content-Type: application/json

{
  "enabled": true,
  "minContentLength": 3000,
  "includeKeyPoints": true,
  "includeTopics": true
}
```

**Response:**
```json
{
  "data": {
    "feedId": "feed-123",
    "settings": {
      "enabled": true,
      "minContentLength": 3000,
      "includeKeyPoints": true,
      "includeTopics": true
    },
    "effectiveSettings": { ... }
  },
  "message": "Summarization settings updated successfully"
}
```

#### Clear Feed Settings (Revert to Defaults)
```bash
DELETE /api/feeds/{feedId}/summarization
```

### 3. Admin Features

#### System-Wide Toggle
```bash
# Get current configuration
GET /api/admin/summarization/config

# Enable/disable system-wide
POST /api/admin/summarization/config
Content-Type: application/json

{
  "autoGenerate": true
}
```

#### Cost Monitoring
```bash
# Get overall stats
GET /api/admin/summarization/costs

# Get recent entries
GET /api/admin/summarization/costs?action=recent&limit=100

# Get user-specific stats
GET /api/admin/summarization/costs?action=user&userId=user-123

# Get date range report
GET /api/admin/summarization/costs?action=report&start=2025-01-01&end=2025-01-31

# Clear cost history
DELETE /api/admin/summarization/costs
```

**Stats Response:**
```json
{
  "totalTokens": 125000,
  "totalCost": 0.375,
  "entriesCount": 50,
  "byProvider": {
    "openai": {
      "tokens": 100000,
      "cost": 0.30,
      "count": 40,
      "models": ["gpt-3.5-turbo", "gpt-4"]
    },
    "ollama": {
      "tokens": 25000,
      "cost": 0,
      "count": 10,
      "models": ["llama2"]
    }
  },
  "byUser": {
    "user-123": {
      "tokens": 50000,
      "cost": 0.15,
      "count": 20
    }
  },
  "last24Hours": { "tokens": 5000, "cost": 0.015, "count": 5 },
  "last7Days": { "tokens": 25000, "cost": 0.075, "count": 25 },
  "last30Days": { "tokens": 125000, "cost": 0.375, "count": 50 }
}
```

#### System Settings Overview
```bash
GET /api/admin/settings
```

Includes `summarizationConfig`:
```json
{
  "summarizationConfig": {
    "autoGenerate": true,
    "autoGenerateSource": "database"  // or "default"
  }
}
```

## Configuration Hierarchy

Settings cascade from most specific to most general:

```
1. User Feed Settings (user_feeds.settings.summarization)
   ↓ (if not set)
2. Category Settings (user_categories.settings.summarization)
   ↓ (if not set)
3. User Defaults (future: user_preferences.summarization)
   ↓ (if not set)
4. System Defaults (hardcoded)
   - enabled: false
   - minContentLength: 5000
   - includeKeyPoints: true
   - includeTopics: true
```

## Settings Options

### Per-Feed Configuration

| Setting | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| `enabled` | boolean | false | - | Enable/disable summarization for this feed |
| `minContentLength` | number | 5000 | 100-100000 | Only summarize articles longer than this |
| `includeKeyPoints` | boolean | true | - | Extract 3-5 key points from article |
| `includeTopics` | boolean | true | - | Identify 3-5 main topics/tags |

### Validation Rules

- `minContentLength` must be between 100 and 100,000 characters
- Settings can only be changed if admin has enabled the feature system-wide
- Invalid settings return 400 with detailed error messages

## How It Works

### Automatic Summarization (During Feed Refresh)

1. **Feed refresh starts** (user-initiated, scheduled job, or API call)
2. **Articles are fetched and saved** to database
3. **Embeddings generated** (if enabled, synchronously)
4. **Summarization triggered** asynchronously in background:
   - Checks if admin enabled system-wide
   - Checks if user enabled for this feed
   - Filters articles by:
     - No existing summary
     - Content length ≥ minContentLength
   - Processes in batches of 5
   - Tracks token usage and costs
   - Logs progress and errors
5. **Feed refresh completes** immediately (user sees feed refresh notification)
6. **Background process continues** generating summaries
7. **Completion notification sent** when summarization finishes (separate notification)

### Manual Summarization

Users can manually trigger summarization via API for:
- All pending articles (no summary yet)
- Specific feed's pending articles
- Specific article IDs

This is useful for:
- Catching up on backlog
- Re-processing after changing settings
- Testing summarization

## Database Schema

### Articles Table (No Changes Needed)

```sql
-- Columns already exist:
summary         TEXT NULL           -- Generated summary
keyPoints       JSON NULL           -- Array of key points
topics          TEXT[] NULL         -- Array of topic tags
```

### Feed Settings (JSON Column)

```json
{
  "summarization": {
    "enabled": true,
    "minContentLength": 3000,
    "includeKeyPoints": true,
    "includeTopics": true
  }
}
```

### Admin Settings Table

```sql
-- Key: summarization_auto_generate
-- Value: boolean (true/false)
-- Description: Enable/disable automatic article summarization system-wide
```

## Cost Tracking

### In-Memory Tracking

Costs are tracked in memory with the following structure:

```typescript
{
  timestamp: Date
  provider: "openai" | "ollama"
  model: string
  tokensPrompt: number
  tokensCompletion: number
  tokensTotal: number
  cost: number
  operation: "article_summarization"
  userId?: string
  articleId?: string
}
```

### Cost Calculation

**OpenAI Pricing (2025 rates):**
- GPT-4 Turbo: $0.01/1K prompt tokens, $0.03/1K completion tokens
- GPT-4: $0.03/1K prompt tokens, $0.06/1K completion tokens
- GPT-3.5 Turbo: $0.0005/1K prompt tokens, $0.0015/1K completion tokens

**Ollama/Local Models:** $0.00 (free)

### Cost Estimation

Before processing, users can estimate costs:

```bash
GET /api/user/articles/summarize?feedId=feed-123
```

Returns:
```json
{
  "costEstimate": {
    "articleCount": 25,
    "estimatedTokens": 45000,
    "estimatedCost": 0.0135
  }
}
```

## Error Handling

### Graceful Degradation

- If summarization fails, feed refresh still succeeds
- Individual article failures don't stop batch processing
- Errors logged and included in notifications
- Users notified of failures via warning notification

### Common Errors

| Error | Cause | User Action |
|-------|-------|-------------|
| "Summarization is disabled system-wide" | Admin disabled feature | Contact administrator |
| "Feed not found or you are not subscribed" | Invalid feed ID | Check feed subscription |
| "LLM service not configured" | Missing API key | Configure LLM settings in preferences |
| "Rate limit exceeded" | API quota reached | Wait and retry, or use local model |

## Performance Considerations

### Asynchronous Processing

- Feed refresh completes immediately (no blocking)
- Summaries generate in background
- Users notified when complete (separate notification)
- Batch size: 5 articles at a time (configurable)

### Filtering to Reduce Costs

Only articles meeting ALL criteria are summarized:
- ✅ No existing summary
- ✅ Content length ≥ minContentLength
- ✅ Summarization enabled for feed
- ✅ Admin enabled system-wide

### Content Truncation

Articles longer than 40,000 characters are truncated to stay within LLM token limits.

## Testing the Feature

### 1. Enable System-Wide (Admin)

```bash
curl -X POST http://localhost:3000/api/admin/summarization/config \
  -H "Content-Type: application/json" \
  -d '{"autoGenerate": true}'
```

### 2. Enable for Specific Feed (User)

```bash
curl -X PUT http://localhost:3000/api/feeds/{feedId}/summarization \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "minContentLength": 3000,
    "includeKeyPoints": true,
    "includeTopics": true
  }'
```

### 3. Trigger Feed Refresh

```bash
curl -X POST http://localhost:3000/api/feeds/{feedId}/refresh
```

### 4. Check Notifications

```bash
curl http://localhost:3000/api/user/notifications
```

Expected notifications:
1. **Immediate**: "Feeds Refreshed" (shows new articles)
2. **Later**: "Article Summarization Complete" (shows summarized count)

### 5. Manually Trigger Summarization

```bash
curl -X POST http://localhost:3000/api/user/articles/summarize \
  -H "Content-Type: application/json" \
  -d '{"feedId": "{feedId}", "limit": 10}'
```

### 6. View Costs (Admin)

```bash
curl http://localhost:3000/api/admin/summarization/costs
```

## Future Enhancements

Potential improvements for future versions:

1. **User-level defaults** - Set default summarization preferences for all feeds
2. **Category-level settings** - Configure summarization per category
3. **Summary quality settings** - Choose between fast/cheap vs. detailed/expensive
4. **Batch job** - Dedicated cron job for backlog processing
5. **Progress tracking** - Real-time progress bar in UI
6. **Summary regeneration** - Re-summarize with different settings
7. **Export summaries** - Download summaries as Markdown/PDF
8. **Smart filtering** - Only summarize articles user is likely to read
9. **Multi-language support** - Detect language and use appropriate model
10. **Custom prompts** - Let users customize summarization style

## Troubleshooting

### Summaries not generating?

1. Check admin settings: `GET /api/admin/summarization/config`
2. Check feed settings: `GET /api/feeds/{feedId}/summarization`
3. Check article length: Must be ≥ minContentLength
4. Check LLM configuration in user preferences
5. Check logs for errors

### Costs too high?

1. Increase `minContentLength` to reduce volume
2. Switch to local Ollama model (free)
3. Disable summarization for low-priority feeds
4. Use manual trigger instead of automatic

### Summarization too slow?

1. This is expected - it's asynchronous
2. Check notification bell for completion status
3. Use manual trigger with smaller batches
4. Consider dedicated summarization job (future)

## Files Reference

### Services
- [src/lib/services/summarization-cost-tracker.ts](../src/lib/services/summarization-cost-tracker.ts)
- [src/lib/services/feed-settings-cascade.ts](../src/lib/services/feed-settings-cascade.ts)
- [src/lib/services/admin-settings-service.ts](../src/lib/services/admin-settings-service.ts)
- [src/lib/services/article-summarization-service.ts](../src/lib/services/article-summarization-service.ts)
- [src/lib/services/summarization-service.ts](../src/lib/services/summarization-service.ts)
- [src/lib/services/feed-refresh-service.ts](../src/lib/services/feed-refresh-service.ts)
- [src/lib/services/notification-service.ts](../src/lib/services/notification-service.ts)

### API Routes
- [app/api/feeds/[id]/summarization/route.ts](../app/api/feeds/[id]/summarization/route.ts)
- [app/api/user/articles/summarize/route.ts](../app/api/user/articles/summarize/route.ts)
- [app/api/admin/summarization/config/route.ts](../app/api/admin/summarization/config/route.ts)
- [app/api/admin/summarization/costs/route.ts](../app/api/admin/summarization/costs/route.ts)
- [app/api/admin/settings/route.ts](../app/api/admin/settings/route.ts) (updated)
