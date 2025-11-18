# Admin Recency Settings Implementation

## Overview
Added admin panel controls for configuring system-wide default recency scoring settings for semantic search. Admins can now set defaults that apply to new users and users who haven't customized their preferences.

## Changes Made

### 1. Admin Settings Service (`src/lib/services/admin-settings-service.ts`)
Added three new helper functions:

```typescript
// Get default recency weight (0-1)
async function getDefaultSearchRecencyWeight(): Promise<number>

// Get default recency decay days (1-365)
async function getDefaultSearchRecencyDecayDays(): Promise<number>

// Get complete configuration with sources
async function getSearchRecencyConfiguration(): Promise<{
  defaultRecencyWeight: number;
  defaultRecencyWeightSource: "database" | "default";
  defaultRecencyDecayDays: number;
  defaultRecencyDecayDaysSource: "database" | "default";
}>
```

These functions:
- Read from `AdminSettings` table using key-value storage
- Provide fallback defaults (0.3 for weight, 30 for decay days)
- Track whether values come from database or defaults

### 2. Admin Settings API (`app/api/admin/settings/route.ts`)
Added validation for two new setting keys:

**`default_search_recency_weight`**
- Type: `number`
- Range: 0-1
- Description: Default recency weight for semantic search

**`default_search_recency_decay_days`**
- Type: `number`
- Range: 1-365
- Description: Default recency decay period in days

Validation ensures:
- Values are numbers
- Values are within acceptable ranges
- Invalid values return 400 error with descriptive message

### 3. Admin Dashboard UI (`app/admin/dashboard/page.tsx`)
Added "Search Recency Settings" section to the Embeddings tab with:

#### UI Components
1. **Default Recency Weight Slider**
   - Range: 0-100% (stored as 0-1)
   - Step: 5%
   - Real-time saving on change
   - Displays current percentage

2. **Default Recency Decay Period Slider**
   - Range: 7-180 days
   - Step: 7 days
   - Real-time saving on change
   - Displays current days

3. **Status Messages**
   - Success: Green banner "Setting saved successfully"
   - Error: Red banner with error details
   - Auto-dismiss after 3 seconds

4. **Information Box**
   - Explains how recency scoring works
   - Shows decay calculation examples
   - Clarifies admin vs user settings relationship

#### State Management
```typescript
const [recencyWeight, setRecencyWeight] = useState(0.3);
const [recencyDecayDays, setRecencyDecayDays] = useState(30);
const [isLoadingRecency, setIsLoadingRecency] = useState(true);
const [isSavingRecency, setIsSavingRecency] = useState(false);
const [recencySaveMessage, setRecencySaveMessage] = useState(null);
```

#### Data Flow
1. **Load on mount**: Fetches current values from API
2. **User adjusts slider**: Updates local state
3. **Auto-save**: Immediately saves to database via API
4. **Feedback**: Shows success/error message
5. **Persistence**: Values stored in `admin_settings` table

## Database Storage

Settings are stored in the `AdminSettings` table as key-value pairs:

```sql
-- Example records
INSERT INTO admin_settings (key, value, description) VALUES
  ('default_search_recency_weight', 0.3, 'Default recency weight for semantic search (0-1)'),
  ('default_search_recency_decay_days', 30, 'Default recency decay period in days for semantic search');
```

## Admin Usage Guide

### Accessing Settings
1. Navigate to **Admin Dashboard**
2. Click on **Search** tab
3. Scroll to **Search Recency Settings** section

### Configuring Recency Weight
- **0%**: Pure semantic similarity (no recency boost)
- **20-40%**: Balanced (recommended for most use cases)
- **50-70%**: Strong recency preference (good for news sites)
- **100%**: Only recency matters (not recommended)

### Configuring Decay Period
- **7-14 days**: Very fast decay (breaking news, trending topics)
- **30 days**: Balanced decay (recommended default)
- **60-90 days**: Slow decay (general content, evergreen articles)
- **90-180 days**: Very slow decay (archival content, research)

### Best Practices

#### For News-Focused Sites
- Recency Weight: 40-50%
- Decay Period: 14-30 days
- Rationale: Recent news is highly valuable, older news quickly becomes less relevant

#### For General Content Sites
- Recency Weight: 20-30%
- Decay Period: 30-60 days
- Rationale: Balance between relevance and recency

#### For Research/Documentation Sites
- Recency Weight: 10-20%
- Decay Period: 60-180 days
- Rationale: Content quality matters more than publication date

#### For Mixed Content
- Recency Weight: 30% (default)
- Decay Period: 30 days (default)
- Rationale: Let users customize per their needs

## Settings Hierarchy

The system uses a three-tier hierarchy:

1. **User Preferences** (highest priority)
   - Set in user preferences modal
   - Overrides admin defaults
   - Stored in `user_preferences` table

2. **Admin Defaults** (medium priority)
   - Set in admin dashboard
   - Applies to users without custom settings
   - Stored in `admin_settings` table

3. **System Defaults** (lowest priority)
   - Hardcoded fallbacks (0.3, 30 days)
   - Used when no admin or user settings exist
   - Defined in code

## Impact Analysis

### Who Is Affected
- **New users**: Get admin-configured defaults immediately
- **Existing users without custom settings**: Get admin-configured defaults
- **Existing users with custom settings**: Unaffected (user settings take precedence)

### When Changes Apply
- **Immediately**: For new searches after settings are saved
- **No restart required**: Settings are read from database on each request
- **No cache invalidation needed**: Each search fetches current settings

### Performance Impact
- **Negligible**: Two additional database reads per admin dashboard load
- **Optimized**: Settings are read once per search request
- **Cached**: Can be cached at application level if needed

## Testing Checklist

- [ ] Admin can access Embeddings tab
- [ ] Recency settings section loads without errors
- [ ] Sliders display current values correctly
- [ ] Changing recency weight saves successfully
- [ ] Changing decay days saves successfully
- [ ] Success messages appear and auto-dismiss
- [ ] Error messages appear for invalid values
- [ ] Settings persist after page refresh
- [ ] New users get admin-configured defaults
- [ ] User preferences override admin defaults
- [ ] Search results reflect recency settings

## Troubleshooting

### Settings Not Saving
1. Check browser console for errors
2. Verify admin permissions
3. Check database connection
4. Verify `admin_settings` table exists

### Settings Not Applying
1. Verify settings saved to database
2. Check user hasn't overridden in preferences
3. Verify search API is passing parameters
4. Check semantic search service receives values

### Unexpected Search Results
1. Verify recency weight is reasonable (20-40%)
2. Check decay period matches content type
3. Test with recency weight at 0% (pure semantic)
4. Compare results with different settings

## Future Enhancements

Potential improvements:
- Per-category recency settings
- Time-of-day based decay rates
- A/B testing different configurations
- Analytics on recency impact
- Preset configurations for common use cases
- Bulk user settings migration tool

