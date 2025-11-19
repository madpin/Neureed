# Admin & User Settings Separation Implementation

## Overview

This document describes the implementation of the admin and user settings separation, allowing administrators to set system-wide defaults, constraints, and credentials while users can customize settings within defined bounds or provide their own credentials.

## Implementation Date

November 19, 2024

## Key Features

### 1. System LLM Credentials

Admins can now configure system-wide LLM credentials that users inherit by default:

- **System Provider**: "openai" | "ollama" | null
- **System API Key**: Encrypted, masked in responses
- **System Base URL**: Custom endpoint support
- **System Model**: Default model name

**Behavior**: 
- Users without their own credentials automatically use system credentials
- Users can override with their own credentials
- System credentials are stored encrypted in the database

**API Endpoints**:
- `GET/PUT /api/admin/settings/llm`

### 2. Provider Control

Admins can enable/disable specific embedding providers system-wide:

- **OpenAI Provider**: Can be disabled globally
- **Local Provider**: Can be disabled globally

**Behavior**:
- Users cannot use disabled providers even if they have credentials
- Clear error messages when trying to use disabled providers
- Defaults to both providers enabled

**API Endpoints**:
- `GET/PUT /api/admin/settings/providers`

### 3. User Preference Constraints

Admins can define min/max bounds for user preferences:

**Feed Settings**:
- `minRefreshInterval` / `maxRefreshInterval`: 1-10080 minutes (1 min to 1 week)
- `minMaxArticlesPerFeed` / `maxMaxArticlesPerFeed`: 10-10000 articles
- `minMaxArticleAge` / `maxMaxArticleAge`: 1-730 days (1 day to 2 years)

**Behavior**:
- User preference updates are validated against these constraints
- Clear error messages when constraints are violated
- Constraints are validated for min < max relationships

**API Endpoints**:
- `GET/PUT /api/admin/settings/constraints`

### 4. Default User Preferences

Admins can set default values for new users:

- `embeddingsEnabled`: Default embeddings state for new users
- `searchRecencyWeight`: Default recency weighting (0-1)
- `searchRecencyDecayDays`: Default decay period (1-365 days)

**Behavior**:
- New users inherit these defaults when preferences are created
- Existing users are not affected
- Values are validated within allowed ranges

**API Endpoints**:
- `GET/PUT /api/admin/settings/defaults`

### 5. Comprehensive Settings Overview

A single endpoint to retrieve all admin settings:

**API Endpoints**:
- `GET /api/admin/settings`

Returns:
```json
{
  "systemLLM": {
    "provider": "openai",
    "apiKey": "sk-••••••••1234",
    "baseUrl": null,
    "model": "text-embedding-3-small"
  },
  "providers": {
    "openai": true,
    "local": true
  },
  "constraints": {
    "minRefreshInterval": 15,
    "maxRefreshInterval": 1440,
    "minMaxArticlesPerFeed": 50,
    "maxMaxArticlesPerFeed": 5000,
    "minMaxArticleAge": 1,
    "maxMaxArticleAge": 365
  },
  "defaults": {
    "embeddingsEnabled": false,
    "searchRecencyWeight": 0.3,
    "searchRecencyDecayDays": 30
  },
  "embeddingConfig": {
    "autoGenerate": true,
    "provider": "openai",
    "model": "text-embedding-3-small",
    "batchSize": 100
  }
}
```

## Implementation Details

### Files Created

1. **Validation Schemas**:
   - `/src/lib/validations/admin-validation.ts`

2. **API Endpoints**:
   - `/app/api/admin/settings/route.ts` (overview)
   - `/app/api/admin/settings/llm/route.ts`
   - `/app/api/admin/settings/providers/route.ts`
   - `/app/api/admin/settings/constraints/route.ts`
   - `/app/api/admin/settings/defaults/route.ts`

### Files Modified

1. **Services**:
   - `/src/lib/services/admin-settings-service.ts`
     - Added system LLM credential management
     - Added provider enable/disable functions
     - Added constraint management and validation
     - Added default preferences management

   - `/src/lib/services/user-preferences-service.ts`
     - Added constraint validation on preference updates
     - Modified to inherit admin defaults on user creation
     - Added function to merge system and user credentials

   - `/src/lib/services/embedding-service.ts`
     - Added provider enabled/disabled checks
     - Added system credential fallback
     - Improved error messages for disabled providers

2. **API Routes**:
   - `/app/api/user/preferences/route.ts`
     - Updated schema to allow wider ranges (service layer validates)
     - Added comment about service layer validation

## Credential Hierarchy

The system now follows this credential resolution hierarchy:

1. **User has own credentials** → Use user credentials
2. **User has no credentials, system has credentials** → Use system credentials
3. **Neither has credentials** → Error with clear message

## Validation Flow

### User Preference Updates

1. User submits preference update via `/api/user/preferences`
2. Zod schema validates basic type and range
3. Service layer validates against admin constraints:
   - `defaultRefreshInterval` checked against min/max
   - `defaultMaxArticlesPerFeed` checked against min/max
   - `defaultMaxArticleAge` checked against min/max
4. If validation fails, clear error message is returned
5. If successful, preferences are updated

### Embedding Provider Selection

1. Request for embeddings includes optional userId
2. Check if user has embeddings enabled (if userId provided)
3. Determine which provider to use (user pref → system setting → env)
4. **Check if provider is enabled by admin**
5. If disabled, throw error: "X embeddings have been disabled by the administrator"
6. Resolve credentials (user → system → env)
7. Initialize provider with resolved credentials

## Error Messages

The implementation provides clear, user-friendly error messages:

**Provider Disabled**:
```
"OpenAI embeddings have been disabled by the administrator"
"Local embeddings have been disabled by the administrator"
```

**Constraint Violations**:
```
"Refresh interval must be at least 15 minutes"
"Maximum articles per feed cannot exceed 5000"
"Maximum article age must be at least 1 days"
```

**Missing Credentials**:
```
"OpenAI API key not configured. Please configure system credentials or provide your own API key."
```

## Database Schema

No schema changes required. All new settings use the existing `AdminSettings` table with these keys:

### System LLM Credentials
- `system_llm_provider`
- `system_llm_api_key` (encrypted)
- `system_llm_base_url`
- `system_llm_model`

### Provider Control
- `openai_provider_enabled`
- `local_provider_enabled`

### User Constraints
- `min_refresh_interval`
- `max_refresh_interval`
- `min_max_articles_per_feed`
- `max_max_articles_per_feed`
- `min_max_article_age`
- `max_max_article_age`

### Default Preferences
- `default_embeddings_enabled`
- `default_search_recency_weight`
- `default_search_recency_decay_days`

## Security

1. **Encryption**: System API keys are encrypted using AES-256-GCM
2. **Masking**: API keys are masked in responses (only first/last 4 chars visible)
3. **Authentication**: All admin endpoints require authentication
4. **Validation**: All inputs are validated with Zod schemas

## Backward Compatibility

1. **Existing Users**: Existing user preferences remain valid and unchanged
2. **Default Values**: All new settings have sensible defaults
3. **Provider Flags**: Default to enabled (no breaking changes)
4. **System Credentials**: Optional (users can still use their own)
5. **Constraints**: Default ranges allow existing user settings

## Testing

### Manual Testing Checklist

1. **System LLM Credentials**:
   - [ ] Set system OpenAI credentials
   - [ ] Verify user without credentials can generate embeddings
   - [ ] Verify user with own credentials uses their own
   - [ ] Verify API keys are masked in responses

2. **Provider Control**:
   - [ ] Disable OpenAI provider
   - [ ] Verify users cannot generate OpenAI embeddings
   - [ ] Verify clear error message
   - [ ] Re-enable and verify functionality restored

3. **User Constraints**:
   - [ ] Set minimum refresh interval to 30 minutes
   - [ ] Try to set user preference to 15 minutes
   - [ ] Verify error message
   - [ ] Set to 45 minutes and verify success

4. **Default Preferences**:
   - [ ] Set default embeddings to enabled
   - [ ] Create new user
   - [ ] Verify new user has embeddings enabled by default

5. **Comprehensive Overview**:
   - [ ] Call `/api/admin/settings`
   - [ ] Verify all settings returned correctly

## Future Enhancements

Potential improvements:

1. **Cost Tracking**: Track embedding costs per user
2. **Usage Limits**: Set per-user rate limits
3. **Audit Logging**: Log admin setting changes
4. **UI Interface**: Admin dashboard for managing settings
5. **Provider-Specific Constraints**: Different constraints per provider
6. **Scheduled Updates**: Bulk update user settings
7. **Setting Templates**: Pre-defined setting configurations

## Example Usage

### Admin: Configure System Credentials

```bash
PUT /api/admin/settings/llm
{
  "provider": "openai",
  "apiKey": "sk-proj-...",
  "model": "text-embedding-3-small"
}
```

### Admin: Set Constraints

```bash
PUT /api/admin/settings/constraints
{
  "minRefreshInterval": 30,
  "maxRefreshInterval": 720,
  "minMaxArticlesPerFeed": 100,
  "maxMaxArticlesPerFeed": 2000
}
```

### Admin: Disable Local Embeddings

```bash
PUT /api/admin/settings/providers
{
  "local": false
}
```

### User: Update Preferences (Respects Constraints)

```bash
PUT /api/user/preferences
{
  "defaultRefreshInterval": 45,  // Must be >= 30 (admin min)
  "embeddingsEnabled": true
}
```

### System: Generate Embeddings (Uses Appropriate Credentials)

```typescript
// User with credentials → uses user's key
// User without credentials → uses system key
// Provider disabled → throws error
const embedding = await generateEmbedding(text, "openai", userId);
```

## Conclusion

This implementation successfully separates admin system-wide settings from user preferences, providing:

- **Flexibility**: Users can customize within bounds or provide own credentials
- **Control**: Admins can enforce policies and provide defaults
- **Security**: Credentials are encrypted and properly validated
- **Usability**: Clear error messages and sensible defaults
- **Scalability**: Support for multiple users with different needs

The system maintains backward compatibility while adding powerful new admin capabilities.

