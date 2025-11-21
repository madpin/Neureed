# Validation Error Root Cause & Fix

## The Actual Problem

The validation error was caused by **float values being sent for integer fields**, specifically `readingPanelSize`.

### Specific Issue

When resizing the reading panel, the percentage calculation produces a float like `47.40057472117855`, but the Zod schema requires an integer:

```typescript
readingPanelSize: z.number().int().min(30).max(70).optional(),
```

**Error Details:**
```json
{
  "code": "invalid_type",
  "expected": "integer",
  "received": "float",
  "path": ["readingPanelSize"],
  "message": "Expected integer, received float"
}
```

### Secondary Issues Prevented

The fix also handles:
- Empty string values for URL fields (e.g., `llmBaseUrl`)
- Float values for other integer fields (`articlesPerPage`, `readingFontSize`, etc.)

## The Solution

### 1. Enhanced Preference Cleaning (`src/hooks/queries/use-user-preferences.ts`)

Added comprehensive data cleaning logic:
- **Round floats to integers** for integer fields
- **Convert empty strings to null** for nullable fields
- **Filter out undefined values**

```typescript
async function updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
  const cleanedPreferences: Record<string, any> = {};
  
  // Fields that must be integers
  const integerFields = new Set([
    "articlesPerPage",
    "readingPanelSize",        // ← This was the culprit!
    "readingFontSize",
    "defaultRefreshInterval",
    "defaultMaxArticlesPerFeed",
    "defaultMaxArticleAge",
    "searchRecencyDecayDays",
  ]);
  
  for (const [key, value] of Object.entries(preferences)) {
    // Skip undefined values
    if (value === undefined) continue;
    
    // Convert empty strings to null for nullable string fields
    if (value === "" && (
      key === "llmBaseUrl" || 
      key === "llmApiKey" || 
      key === "llmProvider" ||
      key === "llmSummaryModel" ||
      key === "llmEmbeddingModel" ||
      key === "llmDigestModel"
    )) {
      cleanedPreferences[key] = null;
    }
    // Round float values to integers for integer fields
    else if (integerFields.has(key) && typeof value === "number") {
      cleanedPreferences[key] = Math.round(value);  // 47.40057472117855 → 47
    }
    else {
      cleanedPreferences[key] = value;
    }
  }
  
  // ... send cleaned preferences
}
```

### 2. Enhanced Error Reporting

Added multiple layers of error reporting to make future debugging easier:

#### A. API Response includes details (`src/lib/api-response.ts`)
```typescript
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;  // ← Added this
};
```

#### B. API Client logs full error response (`src/lib/query/api-client.ts`)
```typescript
if (!response.ok) {
  console.error("API Error Response:", {
    status: response.status,
    statusText: response.statusText,
    data,
    url,
  });
  // ...
}
```

#### C. PreferencesModal shows field-level errors (`app/components/preferences/PreferencesModal.tsx`)
```typescript
catch (error: any) {
  if (error.data && Array.isArray(error.data)) {
    // Zod validation errors
    const fieldErrors = error.data
      .map((e: any) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    errorMessage = `Validation error: ${fieldErrors}`;
  }
  // ...
}
```

#### D. Client-side validation for new fields
Added pre-flight validation to catch invalid enum values before sending to the API.

### 3. Comprehensive Logging

Added detailed console logging at multiple points:
- PreferencesModal: Logs full preferences object and article-specific preferences before saving
- API Client: Logs full error response including status, data, and URL
- updateUserPreferences: Logs cleaned preferences being sent to API

## Testing the Fix

After these changes, you should:

1. **Try saving preferences again** - The error should be resolved
2. **Check the console** if you still get errors - You'll now see:
   - Exact preferences being saved
   - Cleaned preferences after processing
   - Full API error response with field-level details
   - Specific field names and validation errors

## Why This Happened

1. **User resized the reading panel** by dragging the divider
2. **Percentage calculation produced a float** (e.g., 47.40057472117855)
3. **Float value sent to API** which expects an integer
4. **Zod validation failed** with "Expected integer, received float"
5. **Generic error message** didn't indicate which field failed (until we added logging)

## Prevention

To prevent similar issues in the future:

### Option 1: Fix the Zod Schema (More Permissive)
```typescript
llmBaseUrl: z.string().url().nullable().optional()
  .or(z.literal(""))  // ← Allow empty strings
  .transform(val => val === "" ? null : val),  // ← Convert to null
```

### Option 2: Fix the Input Handling (Current Approach)
Clean the data before sending - this is what we implemented as it's more predictable.

### Option 3: Fix the Schema Definition (Alternative)
```typescript
llmBaseUrl: z.union([
  z.string().url(),  // Valid URL
  z.null(),          // Explicitly null
  z.undefined(),     // Omitted
]).optional(),
```

## Files Modified

1. `src/hooks/queries/use-user-preferences.ts` - Empty string → null conversion
2. `src/lib/api-response.ts` - Added `details` field to error responses
3. `src/lib/query/api-client.ts` - Enhanced error logging
4. `app/components/preferences/PreferencesModal.tsx` - Field-level error display + client validation
5. `app/api/user/preferences/route.ts` - Enhanced request logging

## Expected Behavior Now

✅ Float values automatically rounded to integers for integer fields
✅ Empty URL fields automatically converted to `null`
✅ Validation errors show specific field names and messages
✅ Console logs provide complete debugging information with JSON formatting
✅ Client-side validation catches enum mismatches before API call
✅ Reading panel resize works without validation errors

