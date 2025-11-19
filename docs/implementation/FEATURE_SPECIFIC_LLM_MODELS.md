# Feature-Specific LLM Models Implementation

## Overview
This document describes the implementation of separate model configurations for different LLM features. Each feature (embeddings, summarization, digests) now has its own dedicated model setting.

## Problem Solved
Previously, the system used a single `llmModel` setting for all LLM operations, which caused issues:
- Embedding models (like `text-embedding-3-small`) are different from chat models (like `gpt-4o-mini`)
- Using a chat model for embeddings resulted in API errors
- No flexibility to optimize model choice per feature (e.g., use cheaper models for summaries, better models for digests)

## Changes Made

### 1. Database Schema Updates

**Migration**: `20251119202752_separate_llm_models_by_feature`

#### Updated UserPreferences Table

**Removed:**
- `llmModel` - Generic model field (replaced with feature-specific fields)

**Added:**
- `llmSummaryModel` - Model for article summarization (e.g., "gpt-4o-mini", "gpt-4-turbo")
- `llmEmbeddingModel` - Model for embeddings (e.g., "text-embedding-3-small", "text-embedding-3-large")
- `llmDigestModel` - Model for digest generation (future feature)

**Data Migration:**
Existing `llmModel` values were automatically migrated to `llmSummaryModel` to preserve user settings.

### 2. Environment Variables

**Updated `src/env.ts`:**

**Removed:**
- `LLM_MODEL` - Generic model setting

**Added:**
- `LLM_SUMMARY_MODEL` - Default: "gpt-4o-mini"
- `LLM_DIGEST_MODEL` - Default: "gpt-4o-mini"
- `EMBEDDING_MODEL` - (Already existed) Default: "text-embedding-3-small"

### 3. User Preferences API

**Updated `app/api/user/preferences/route.ts`:**
- Replaced `llmModel` validation with `llmSummaryModel`, `llmEmbeddingModel`, `llmDigestModel`
- All three fields are optional and nullable

### 4. Services Updated

#### Embedding Service (`src/lib/services/embedding-service.ts`)
- Now uses `preferences.llmEmbeddingModel` when available
- Falls back to `env.EMBEDDING_MODEL` (text-embedding-3-small)
- **Never** uses summarization or digest models

#### Summarization Service (`src/lib/services/summarization-service.ts`)
- Now uses `preferences.llmSummaryModel` when available
- Falls back to `env.LLM_SUMMARY_MODEL` (gpt-4o-mini)
- Completely separate from embedding models

## Model Recommendations

### For Embeddings
**OpenAI Models:**
- `text-embedding-3-small` - **Recommended** (balanced cost/performance, 1536 dimensions)
- `text-embedding-3-large` - Better quality, higher cost (3072 dimensions)
- `text-embedding-ada-002` - Legacy model (1536 dimensions)

**DO NOT USE:** Any chat/completion model (gpt-4, gpt-3.5-turbo, etc.)

### For Summarization
**OpenAI Models:**
- `gpt-4o-mini` - **Recommended** (fast, cost-effective, good quality)
- `gpt-4o` - Better quality, higher cost
- `gpt-4-turbo` - Excellent quality, highest cost
- `gpt-3.5-turbo` - Fastest, cheapest, lower quality

**Ollama Models:**
- `llama2` - Good for local/offline use
- `mistral` - Better quality for local use
- `phi` - Fast and lightweight

### For Digests (Future)
Similar to summarization models, but might benefit from:
- Larger context windows for processing multiple articles
- Better instruction following for structured output
- Consider `gpt-4o` or `gpt-4-turbo` for this use case

## Configuration Examples

### System-Level (Environment Variables)
```bash
# .env
EMBEDDING_MODEL="text-embedding-3-small"
LLM_SUMMARY_MODEL="gpt-4o-mini"
LLM_DIGEST_MODEL="gpt-4o"
```

### User-Level (Preferences API)
```json
{
  "llmProvider": "openai",
  "llmApiKey": "sk-...",
  "llmSummaryModel": "gpt-4o-mini",
  "llmEmbeddingModel": "text-embedding-3-small",
  "llmDigestModel": null  // Use system default
}
```

## Benefits

### 1. **Correctness**
- Embeddings always use embedding models (no more API errors)
- Summarization uses appropriate chat models

### 2. **Flexibility**
- Users can optimize costs by using cheaper models for summaries
- Users can use better models for critical features
- Different models for different use cases

### 3. **Future-Proof**
- Easy to add new features with their own model settings
- Digest feature ready when implemented

### 4. **Cost Optimization**
- Use `text-embedding-3-small` for embeddings ($0.02/1M tokens)
- Use `gpt-4o-mini` for summaries (~10x faster, much cheaper than GPT-4)
- Use `gpt-4o` only for digests where quality is critical

## Migration Path

### For Existing Users
1. Existing `llmModel` values automatically migrated to `llmSummaryModel`
2. `llmEmbeddingModel` defaults to system `EMBEDDING_MODEL`
3. No action required from users
4. Users can optionally configure per-feature models

### For New Users
- All model fields default to `null`
- System defaults are used:
  - Embeddings: `text-embedding-3-small`
  - Summaries: `gpt-4o-mini`
  - Digests: `gpt-4o-mini`

## API Usage

### Get Current Preferences
```bash
GET /api/user/preferences
```

Response includes:
```json
{
  "llmProvider": "openai",
  "llmApiKey": "sk-••••••••-Elhw",
  "llmBaseUrl": null,
  "llmSummaryModel": "gpt-4o-mini",
  "llmEmbeddingModel": "text-embedding-3-small",
  "llmDigestModel": null,
  "embeddingsEnabled": true
}
```

### Update Model Settings
```bash
PUT /api/user/preferences
Content-Type: application/json

{
  "llmSummaryModel": "gpt-4o",
  "llmEmbeddingModel": "text-embedding-3-large"
}
```

## Testing

After implementation:
1. ✅ Embeddings work with correct model
2. ✅ Summaries use chat models
3. ✅ User preferences saved correctly
4. ✅ System defaults work
5. ✅ No linter errors

## Future Enhancements

1. **Model Validation**: Add validation to ensure users don't accidentally use chat models for embeddings
2. **Model Selection UI**: Dropdown with available models per feature
3. **Cost Tracking**: Track usage per model/feature
4. **Model Performance**: Compare quality metrics across different models
5. **Auto-Selection**: Suggest optimal models based on usage patterns

