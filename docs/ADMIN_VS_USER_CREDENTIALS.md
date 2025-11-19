# Admin vs User Credentials Architecture

## Overview
This document clarifies the relationship between admin settings and user credentials for LLM/Embedding features.

## Key Principles

### 1. **Admin Controls Availability**
The admin's role is to **enable or disable** embedding providers (OpenAI, Local), NOT to provide credentials.

### 2. **Users Provide Credentials**
Users configure their own API keys and model preferences in their personal preferences.

### 3. **System Credentials Are Optional**
The admin CAN provide system-level credentials, but it's NOT required. System credentials serve as:
- Fallback for users who haven't configured their own
- Default for cron jobs and system operations
- Optional convenience

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN SETTINGS                       │
│  Controls: Which providers are enabled/disabled         │
│  Optional: System-level API keys (fallback)            │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   USER PREFERENCES                       │
│  Required: Own API keys and model preferences           │
│  Falls back to system credentials if not configured     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  EMBEDDING GENERATION                    │
│  Uses: User credentials (or system fallback)            │
│  Respects: Admin enable/disable settings                │
└─────────────────────────────────────────────────────────┘
```

## Provider Availability Logic

### OpenAI Provider
**Always shows as "Available"** in admin panel because:
- Users can provide their own API keys
- Admin just controls enable/disable
- System API key is optional (nice to have)

**Status Messages:**
- ✅ **Working**: "OpenAI working with provided credentials" (system or user key works)
- ⚠️ **Available**: "No system API key - users can provide their own in preferences"
- ⚠️ **Available**: "Invalid system API key - users can provide their own"

### Local (WASM) Provider
**Shows as "Available" only if dependencies exist** because:
- Requires WASM dependencies
- No credentials needed
- Either works or doesn't based on technical setup

**Status Messages:**
- ✅ **Available**: Local provider working
- ❌ **Not Available**: "Missing dependencies"

## Response Structure

Admin endpoints now return:
```json
{
  "providers": {
    "openai": {
      "success": false,
      "available": true,  // Always true - users can provide credentials
      "configuredWithSystemKey": false,
      "canUseUserCredentials": true,
      "error": "No system API key - users can provide their own",
      "dimensions": 0,
      "testTime": 0
    },
    "local": {
      "success": false,
      "available": false,  // False if dependencies missing
      "configuredWithSystemKey": false,
      "canUseUserCredentials": false,
      "error": "Missing dependencies",
      "dimensions": 0,
      "testTime": 0
    }
  },
  "message": "OpenAI available - users can provide API keys in preferences"
}
```

## Configuration Scenarios

### Scenario 1: No System Key, User Has Key
```
Admin: OpenAI enabled, no system key
User: Has API key in preferences
Result: ✅ Embeddings work with user's key
```

### Scenario 2: System Key, User Has No Key
```
Admin: OpenAI enabled, has system key
User: No API key configured
Result: ✅ Embeddings work with system key (fallback)
```

### Scenario 3: Both Have Keys
```
Admin: OpenAI enabled, has system key
User: Has API key in preferences
Result: ✅ Embeddings work with user's key (preference)
```

### Scenario 4: No Keys At All
```
Admin: OpenAI enabled, no system key
User: No API key configured
Result: ❌ Error: "API key not configured"
```

### Scenario 5: Provider Disabled
```
Admin: OpenAI disabled
User: Has API key
Result: ❌ Error: "OpenAI embeddings disabled by administrator"
```

## User Experience

### For Admin
1. **Enable/Disable Providers**: Control which methods users can use
2. **Optional System Keys**: Provide fallback credentials (optional)
3. **View Status**: See if providers are working

Admin panel will show:
- OpenAI: "Available" (even without system key)
- Status message explains user credentials work

### For Users
1. **Configure Preferences**: Add their own API keys
2. **Choose Models**: Select which models for each feature
3. **Generate Embeddings**: System uses their credentials

Users see:
- Provider enabled/disabled status
- Can configure even if admin has no system key

## Benefits

### 1. **Privacy**
- Users' API keys are private to them
- No need to share admin credentials
- Each user can track their own API usage

### 2. **Flexibility**
- Admin doesn't need OpenAI account
- Users can use their own quotas
- Different users can use different providers

### 3. **Cost Distribution**
- Users pay for their own usage
- No centralized billing concern
- Fair usage model

### 4. **Security**
- Admin credentials not required
- Less risk if admin account compromised
- Users control their own keys

## Implementation Details

### Admin Enable/Disable
Located in: `src/lib/services/admin-settings-service.ts`
- `isProviderEnabled(provider)` - Checks if provider is enabled by admin
- Called before any embedding operation

### User Credentials
Located in: `src/lib/services/user-preferences-service.ts`
- `getUserPreferencesWithDecryptedKey(userId)` - Gets user's API keys
- Keys are encrypted at rest

### Credential Resolution
Located in: `src/lib/services/embedding-service.ts`
1. Check if provider enabled by admin
2. Try user's credentials first
3. Fall back to system credentials
4. Error if no credentials available

## Best Practices

### For Admins
1. **Enable OpenAI**: Even without a system key - users can provide their own
2. **Disable Providers**: Only if you don't want users to use them at all
3. **System Keys**: Optional - only if you want to provide fallback

### For Users
1. **Configure API Keys**: Don't rely on system fallback
2. **Choose Models**: Optimize for your use case
3. **Enable Features**: Turn on embeddings in preferences

### For Developers
1. **Always check**: Provider enabled by admin first
2. **Prefer user credentials**: Over system credentials
3. **Clear errors**: Explain when credentials missing
4. **Status messages**: Help users understand what's needed

## Migration Notes

### From Old Architecture
Previously:
- System required API key to show provider as available
- "Not Available" shown without system key

Now:
- OpenAI always shows as available
- Users can configure independently
- System key optional

### Breaking Changes
None - existing functionality preserved, just better UX

## Testing

To test this architecture:

1. **Without System Key**:
   - Remove `OPENAI_API_KEY` from `.env`
   - Restart server
   - Admin panel shows "Available" with message
   - Configure user API key in preferences
   - Generate embeddings successfully

2. **With System Key**:
   - Add `OPENAI_API_KEY` to `.env`
   - Admin panel shows "Working"
   - Users without keys use system fallback
   - Users with keys use their own

3. **Disabled Provider**:
   - Admin disables OpenAI
   - Users cannot generate embeddings
   - Clear error message shown

