# Admin LLM Configuration API

## Overview
Admin endpoints for configuring system-level LLM settings. These settings serve as fallback when users don't provide their own credentials.

## API Endpoints

### GET `/api/admin/llm/config`
Get current system LLM configuration.

**Response:**
```json
{
  "config": {
    "provider": "openai",
    "apiKey": "sk-••••••••-Elhw",
    "baseUrl": "https://api.openai.com/v1",
    "summaryModel": "gpt-4o-mini",
    "embeddingModel": "text-embedding-3-small",
    "digestModel": "gpt-4o",
    "providerSource": "database",
    "apiKeySource": "database",
    "baseUrlSource": "environment",
    "summaryModelSource": "database",
    "embeddingModelSource": "environment",
    "digestModelSource": "environment"
  },
  "message": "System LLM configuration retrieved successfully"
}
```

**Sources:**
- `database` - Value stored in admin_settings
- `environment` - Value from .env file
- `none` - No value configured

### PUT `/api/admin/llm/config`
Update system LLM configuration.

**Request Body:**
```json
{
  "provider": "openai",
  "apiKey": "sk-...",
  "baseUrl": "https://api.openai.com/v1",
  "summaryModel": "gpt-4o-mini",
  "embeddingModel": "text-embedding-3-small",
  "digestModel": "gpt-4o"
}
```

All fields are optional. Provide only fields you want to update.

**Special handling:**
- `apiKey: null` - Clears the API key
- `apiKey: "sk-..."` - Encrypts and stores new key
- `apiKey: "sk-••••..."` - Ignored (masked value from GET)

**Response:**
```json
{
  "config": { /* updated config */ },
  "message": "System LLM configuration updated successfully"
}
```

### POST `/api/admin/llm/config/test`
Test system LLM configuration.

**Request Body:** (Optional - tests current config if not provided)
```json
{
  "provider": "openai",
  "apiKey": "sk-...",
  "baseUrl": "https://api.openai.com/v1",
  "summaryModel": "gpt-4o-mini",
  "embeddingModel": "text-embedding-3-small"
}
```

**Response:**
```json
{
  "results": {
    "success": true,
    "embedding": {
      "success": true,
      "model": "text-embedding-3-small",
      "dimensions": 1536,
      "testTime": 234
    },
    "summary": {
      "success": true,
      "model": "gpt-4o-mini",
      "testTime": 456
    }
  },
  "message": "System LLM configuration test successful"
}
```

## Model Configuration

### Summary Model
Used for:
- Article summarization
- Key point extraction
- General text processing

Recommended models:
- `gpt-4o-mini` - Fast, cost-effective (default)
- `gpt-4o` - Better quality
- `gpt-4-turbo` - Best quality

### Embedding Model
Used for:
- Semantic search
- Article similarity
- Content indexing

Recommended models:
- `text-embedding-3-small` - Cost-effective, 1536 dimensions (default)
- `text-embedding-3-large` - Better quality, 3072 dimensions
- `text-embedding-ada-002` - Legacy model

**Important:** Only use OpenAI embedding models, NOT chat models!

### Digest Model
Used for:
- Newsletter generation (future)
- Multi-article summaries
- Digest emails

Recommended models:
- `gpt-4o` - Good for structured output (default)
- `gpt-4-turbo` - Better for long context

## Configuration Hierarchy

When resolving LLM settings, the system follows this order:

1. **User Preferences** (highest priority)
   - User's own API key
   - User's model choices
   - User's base URL

2. **Admin Database Settings**
   - System API key from database
   - Models configured via admin panel
   - Custom base URL

3. **Environment Variables** (lowest priority)
   - `.env` file settings
   - Default fallback

## Security

- API keys are encrypted using AES-256-GCM before storage
- Keys are masked (`sk-••••••••-Elhw`) when displayed
- Only admins can view/update system configuration
- Users cannot see system API keys

## Usage Examples

### Initial Setup
```bash
# Configure OpenAI with all models
PUT /api/admin/llm/config
{
  "provider": "openai",
  "apiKey": "sk-proj-...",
  "summaryModel": "gpt-4o-mini",
  "embeddingModel": "text-embedding-3-small",
  "digestModel": "gpt-4o"
}
```

### Update Just API Key
```bash
PUT /api/admin/llm/config
{
  "apiKey": "sk-proj-new-key-..."
}
```

### Clear API Key (Users Must Provide Own)
```bash
PUT /api/admin/llm/config
{
  "apiKey": null
}
```

### Test Before Saving
```bash
POST /api/admin/llm/config/test
{
  "apiKey": "sk-proj-test-key-...",
  "summaryModel": "gpt-4o-mini",
  "embeddingModel": "text-embedding-3-small"
}
```

### Use Custom OpenAI-Compatible Endpoint
```bash
PUT /api/admin/llm/config
{
  "baseUrl": "https://your-openai-proxy.com/v1",
  "apiKey": "your-proxy-key"
}
```

## Integration

The system automatically uses these settings when:
- Users haven't configured their own credentials
- Cron jobs generate embeddings
- System operations need LLM services

Users' personal credentials always take precedence over system settings.

## Troubleshooting

### "API key not configured" Error
1. Check admin configuration: `GET /api/admin/llm/config`
2. Verify `apiKeySource` shows `"database"` or `"environment"`
3. Test configuration: `POST /api/admin/llm/config/test`
4. Or tell users to configure their own API keys

### "Invalid API key" Error
1. System key may be expired/invalid
2. Test with new key before saving
3. Clear system key and let users provide their own

### Embedding Test Fails
- Make sure you're using an embedding model (`text-embedding-*`)
- NOT a chat model (`gpt-4`, `gpt-3.5-turbo`)

### Summary Test Fails
- Use chat/completion models (`gpt-4o-mini`, `gpt-4`, etc.)
- Check API key has access to the model

