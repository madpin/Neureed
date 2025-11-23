# Summarization Service Credentials Fix

## Issue

The summarization service was failing in production with a **401 Invalid API key** error when trying to generate article summaries. The error showed an invalid/corrupted OpenAI API key being used.

### Root Cause

The `summarization-service.ts` was **not** checking system-level LLM credentials stored in the database (via admin settings). It only checked:

1. User preferences
2. Environment variables (`OPENAI_API_KEY`)

This was inconsistent with the `embedding-service.ts`, which properly cascades through:

1. User preferences
2. **System credentials (admin settings in database)** ← **This was missing**
3. Environment variables

## The Fix

Updated `src/lib/services/summarization-service.ts` to add system credentials fallback:

### Changes Made

1. **Added import** for `getSystemLLMCredentials` from admin-settings-service
2. **Updated `resolveLLMConfig` function** to check system credentials before falling back to environment variables

### Credential Resolution Order (Now Consistent)

```
User Preferences (highest priority)
         ↓
System Credentials (database)
         ↓
Environment Variables (lowest priority)
```

### Code Changes

```typescript
// Try user preferences first, then system credentials, then environment
let apiKey = preferences?.llmApiKey;
let baseUrl = preferences?.llmBaseUrl;
let model = preferences?.llmSummaryModel;

// If no user credentials, try to use system credentials
if (!apiKey) {
  try {
    const systemCreds = await getSystemLLMCredentials(false);
    if (systemCreds.provider === "openai" || !systemCreds.provider) {
      apiKey = systemCreds.apiKey || undefined;
      baseUrl = baseUrl || systemCreds.baseUrl || undefined;
      model = model || systemCreds.model || undefined;
      
      logger.info("Using system LLM credentials for summarization", {
        hasSystemKey: !!systemCreds.apiKey,
        userId,
      });
    }
  } catch (error) {
    logger.warn("Failed to get system LLM credentials", { error, userId });
  }
}

// Fall back to environment variables
apiKey = apiKey || env.OPENAI_API_KEY;
```

## Why This Fixes the Production Issue

In your production environment (`neureeddev.madpin.dev`):

1. **User preferences**: Likely not configured (or had corrupted API key)
2. **Environment variables**: Not set (no `OPENAI_API_KEY` in .env)
3. **System credentials**: Set via admin panel but **not being checked**

The service was trying to use an invalid/corrupted API key from user preferences because it never checked the system credentials stored in the database.

With this fix, it will now properly fall back to the system credentials configured in the admin panel.

## Next Steps

### 1. Deploy the Fix

```bash
# Commit the changes
git add src/lib/services/summarization-service.ts
git commit -m "fix: Add system credentials fallback to summarization service"

# Push to dev branch
git push origin dev

# Merge to main and deploy
git checkout main
git merge dev
git push origin main
```

### 2. Verify System Credentials in Production

You should verify that the system LLM credentials are properly configured in the production admin panel:

1. Navigate to: `https://neureeddev.madpin.dev/admin/dashboard`
2. Check **System LLM Configuration** section
3. Verify that:
   - Provider is set to "openai"
   - API key is configured (will show masked: `sk-••••••••`)
   - Base URL (if using custom endpoint)
   - Models are configured

### 3. Test the Fix

After deployment, test article summarization:

```bash
# Test the endpoint
curl -X GET https://neureeddev.madpin.dev/api/articles/[article-id]/summary \
  -H "Cookie: [your-session-cookie]"
```

Or use the UI to generate a summary for an article.

### 4. Check Logs

Monitor the application logs to confirm it's using the correct credentials:

```
Using system LLM credentials for summarization { hasSystemKey: true, userId: 'usr_...' }
```

## Troubleshooting

### If you still see 401 errors:

1. **Check system credentials are valid:**
   - Test the API key directly: `curl https://api.openai.com/v1/models -H "Authorization: Bearer YOUR_KEY"`

2. **Check encryption/decryption:**
   - Ensure `ENCRYPTION_KEY` environment variable is the same across all deployments
   - If you changed `ENCRYPTION_KEY`, you'll need to re-enter the API key in admin settings

3. **Check logs for decryption errors:**
   ```
   Failed to decrypt system API key
   ```

4. **Re-enter API key in admin panel:**
   - Navigate to admin dashboard
   - Update System LLM Configuration
   - Enter a fresh, valid OpenAI API key
   - Save

### If the API key appears corrupted:

The issue might be related to encryption key mismatch. The API keys are encrypted using the `ENCRYPTION_KEY` environment variable. If this key changed between when you set the admin credentials and now, the decryption will fail.

**Solution:**
1. Update the admin system LLM credentials with a fresh API key
2. Ensure `ENCRYPTION_KEY` is consistent across all environments

## Architecture Notes

### Credential Cascade Pattern

All LLM services should follow this pattern:

```typescript
// 1. Try user preferences
const userPrefs = await getUserPreferencesWithDecryptedKey(userId);
let apiKey = userPrefs?.llmApiKey;

// 2. Try system credentials
if (!apiKey) {
  const systemCreds = await getSystemLLMCredentials(false);
  apiKey = systemCreds.apiKey || undefined;
}

// 3. Fall back to environment
apiKey = apiKey || env.OPENAI_API_KEY;

// 4. Error if no credentials
if (!apiKey) {
  throw new Error("API key not configured");
}
```

### Services Using This Pattern

✅ **Embedding Service** - Correct (was already implemented)
✅ **Summarization Service** - Fixed (this PR)

### Related Documentation

- [ADMIN_VS_USER_CREDENTIALS.md](../ADMIN_VS_USER_CREDENTIALS.md) - Architecture overview
- [ADMIN_LLM_CONFIG_API.md](../ADMIN_LLM_CONFIG_API.md) - Admin API reference
- [SUMMARIZATION_FEATURE.md](../SUMMARIZATION_FEATURE.md) - Summarization feature docs

## Testing

To test this fix locally:

1. **Clear all credentials:**
   - Remove user LLM preferences
   - Remove `OPENAI_API_KEY` from .env
   - Set system credentials in admin panel only

2. **Try to generate a summary:**
   - Should succeed using system credentials
   - Check logs for: "Using system LLM credentials for summarization"

3. **Set user credentials:**
   - Configure user LLM API key in preferences
   - Should use user credentials (higher priority)

4. **Remove system credentials:**
   - Should fall back to environment variable

## Summary

This fix ensures the summarization service follows the same credential resolution pattern as other LLM services, properly checking system credentials before falling back to environment variables. This should resolve the production 401 errors if valid system credentials are configured in the admin panel.

