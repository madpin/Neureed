# User Embedding Preferences Implementation

## Overview
This document describes the implementation of user-specific embedding preferences, allowing users to:
1. Enable/disable embeddings on a per-user basis
2. Use their own LLM API keys and settings for embedding generation
3. Benefit from shared embeddings (if another user already generated embeddings for an article, all users can see them)
4. Prevent re-calculation of embeddings for articles that already have them

## Changes Made

### 1. Database Schema Updates

#### Added `embeddingsEnabled` field to UserPreferences
```prisma
embeddingsEnabled        Boolean  @default(false) // Enable embedding generation for semantic search
```

**Migration**: `20251119172117_add_embeddings_enabled_preference`

### 2. User Preferences Service Updates

#### Updated Files:
- `app/api/user/preferences/route.ts` - Added validation for `embeddingsEnabled`
- `src/lib/services/user-preferences-service.ts` - Added default value for `embeddingsEnabled`

### 3. Embedding Service Updates

#### Core Changes in `src/lib/services/embedding-service.ts`:

**Updated `getEmbeddingProvider()` function:**
- Now accepts optional `userId` parameter
- Checks if user has embeddings enabled (throws error if disabled)
- Uses user's LLM preferences (provider, API key, base URL, model)
- Falls back to system defaults if no user preferences

**Updated `generateEmbedding()` function:**
- Accepts `userId` parameter
- Passes userId to provider for preference resolution

**Updated `generateEmbeddings()` function:**
- Accepts `userId` parameter for batch operations
- Uses user's LLM preferences for all embeddings in batch

**Updated `testEmbeddingProvider()` function:**
- Accepts `userId` parameter for testing with user preferences

### 4. Article Embedding Service Updates

#### Updated `src/lib/services/article-embedding-service.ts`:

**`generateArticleEmbedding()` function:**
- Now accepts `userId` parameter
- **Checks if article already has embeddings** (returns `skipped: true` if exists)
- Uses user's LLM preferences if userId provided
- Returns error if user has embeddings disabled

**`generateBatchEmbeddings()` function:**
- Now accepts `userId` parameter
- **Only fetches articles without embeddings** (`embedding: null`)
- Reports number of skipped articles
- Uses user's LLM preferences for batch generation

### 5. Feed Refresh Service Updates

#### Updated `src/lib/services/feed-refresh-service.ts`:
- Passes `userId` to `generateBatchEmbeddings()` when available
- Logs both successful and skipped embeddings

### 6. New User API Endpoint

#### Created `app/api/user/articles/embeddings/route.ts`:

**POST /api/user/articles/embeddings**
- Allows users to trigger embedding generation using their own LLM preferences
- Accepts:
  - `articleIds`: Array of specific article IDs to generate embeddings for
  - `limit`: Maximum number of articles without embeddings to process (default: 100)
- Returns:
  - `processed`: Number of embeddings generated
  - `skipped`: Number of articles that already had embeddings
  - `failed`: Number of failures
  - `totalTokens`: Total tokens used
  - `errors`: Array of errors (if any)

**GET /api/user/articles/embeddings**
- Returns embedding statistics

### 7. Encryption Fix

#### Updated `src/lib/crypto.ts`:
- Added validation to check if `ENCRYPTION_SECRET` is defined before using it
- Added better error messages for missing encryption secret

#### Updated `src/lib/services/user-preferences-service.ts`:
- Improved handling of null/empty API keys
- Prevents attempting to encrypt undefined values

#### Added to `.env`:
- Generated secure `ENCRYPTION_SECRET` for encrypting user API keys

## How It Works

### Embedding Generation Flow

1. **User enables embeddings** in their preferences (`embeddingsEnabled: true`)
2. **User configures LLM settings** (optional):
   - `llmProvider`: "openai" or "ollama"
   - `llmModel`: Model to use (e.g., "text-embedding-3-small")
   - `llmApiKey`: Their OpenAI API key (encrypted)
   - `llmBaseUrl`: Custom API endpoint (optional)

3. **When embeddings are generated**:
   - System checks if user has embeddings enabled
   - If disabled, skips embedding generation
   - If enabled, uses user's LLM preferences
   - Falls back to system defaults if user hasn't configured custom settings

4. **Shared embeddings**:
   - Embeddings are stored at the article level (not per-user)
   - If User A generates embeddings for Article X, User B can also see/use them
   - System never re-generates embeddings for articles that already have them

### API Usage Examples

#### Enable embeddings in user preferences:
```bash
PUT /api/user/preferences
{
  "embeddingsEnabled": true,
  "llmProvider": "openai",
  "llmApiKey": "sk-...",
  "llmModel": "text-embedding-3-small"
}
```

#### Generate embeddings for articles:
```bash
# Generate for specific articles
POST /api/user/articles/embeddings
{
  "articleIds": ["article-id-1", "article-id-2"]
}

# Generate for up to 100 articles without embeddings
POST /api/user/articles/embeddings
{
  "limit": 100
}
```

#### Check embedding statistics:
```bash
GET /api/user/articles/embeddings
```

## Key Features

### ✅ User Control
- Users can enable/disable embeddings
- Users can use their own API keys
- Users can choose providers (OpenAI, Ollama, or system default)

### ✅ Efficiency
- Never re-calculates embeddings for articles that already have them
- Shared embeddings across all users
- Batch processing for efficiency

### ✅ Privacy
- API keys are encrypted using AES-256-GCM
- Keys are masked when displayed (shown as `••••••••`)
- Users' LLM settings are private to them

### ✅ Admin Fallback to User Credentials
- **Admin endpoints now use user's LLM preferences** if system API key is invalid/missing
- When a logged-in admin user has configured their LLM settings, admin operations will use those credentials
- Responses include `usingUserConfig: true` when user's credentials are being used
- This allows admins to test and use embeddings even without system-level API keys

### ✅ Backward Compatibility
- Cron jobs use system defaults
- Feed refresh can work with or without user context
- Admin endpoints gracefully fall back to user preferences when needed

## Testing

1. **Enable embeddings** in user preferences:
   - Go to Preferences → LLM Settings
   - Enable "Embeddings Enabled"
   - Configure your API key if using OpenAI

2. **Generate embeddings**:
   - Refresh a feed (embeddings will be generated automatically if enabled)
   - Or use the API endpoint to manually trigger generation

3. **Verify no re-calculation**:
   - Try generating embeddings again for the same articles
   - Should see `skipped` count in the response

4. **Test with disabled embeddings**:
   - Disable embeddings in preferences
   - Try to generate embeddings
   - Should receive error message

## Security Considerations

1. **API Key Encryption**: User API keys are encrypted using AES-256-GCM with a secure encryption secret
2. **Masked Display**: API keys are never shown in full, only masked with bullets
3. **Per-User Settings**: Each user's LLM preferences are isolated and private
4. **Validation**: All inputs are validated using Zod schemas

## Admin Endpoints with User Fallback

All admin embedding endpoints now support using the logged-in user's LLM preferences when system credentials are not available or invalid:

### `/api/admin/embeddings` (GET/POST/DELETE)
- **GET**: Get embedding statistics
- **POST**: Generate embeddings (uses user's LLM config if available)
  - Pass `articleIds` for specific articles or `limit` for batch processing
  - Returns `skipped` count for articles that already have embeddings
- **DELETE**: Clear all embeddings

### `/api/admin/embeddings/provider` (GET/POST/PUT)
- **GET**: Get provider configuration and test both providers
- **POST**: Test a specific provider
- **PUT**: Switch active provider
- All operations will use user's LLM preferences for testing when system key is invalid

### `/api/admin/embeddings/config` (GET/POST)
- **GET**: Get embedding configuration
- **POST**: Test embedding provider
- All operations will use user's LLM preferences when system key is invalid

**Response Enhancement**: All endpoints return `usingUserConfig: true` when user's credentials are being used instead of system credentials.

## Troubleshooting

### "OpenAI API error: 401 - Incorrect API key"

This error indicates the system-level `OPENAI_API_KEY` is invalid. To fix:

**Option 1: Use your own API key (Recommended for development)**
1. Go to Preferences → LLM Settings
2. Enable "Embeddings Enabled"
3. Set your OpenAI API key
4. Admin operations will now use your credentials automatically

**Option 2: Update system API key**
1. Get a valid API key from OpenAI
2. Update `.env` file: `OPENAI_API_KEY=sk-...`
3. Restart the server

### Embeddings not generating

Check if:
1. User has `embeddingsEnabled: true` in preferences
2. Valid API key is configured (either system or user level)
3. Articles don't already have embeddings (check `skipped` count)

## Future Enhancements

Potential future improvements:
- Track which user generated embeddings (for cost attribution)
- Per-user embedding cost tracking
- Ability to regenerate embeddings with different models
- Embedding quality metrics per user
- UI indicator showing when user credentials are being used vs system credentials

