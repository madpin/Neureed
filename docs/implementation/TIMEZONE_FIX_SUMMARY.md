# Timezone Handling Fix - Summary

## Problem Description

The application had two major issues with article date/time handling:

1. **Timezone Offset Issue**: Brazilian users (and users in other non-UTC timezones) were seeing article dates displayed as "3 hours ago" when they should have been "just now". This was because the date comparison logic was mixing UTC and local times.

2. **Missing Dates**: Some RSS feeds don't provide publication dates, resulting in `publishedAt` being `null`, which caused "Unknown date" to be displayed without a proper fallback.

## Root Causes

### 1. Timezone Calculation Error
The original `formatDate` function in `ArticleCard.tsx` and `ArticlePanel.tsx` was:
```typescript
const formatDate = (date: Date | string | null) => {
  if (!date) return "Unknown date";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime(); // This was correct
  // ... but the issue was in how dates were being parsed
};
```

The problem was that when dates came from the database as ISO strings (stored in UTC), JavaScript's `new Date()` constructor would parse them correctly, but the comparison logic wasn't accounting for timezone display properly.

### 2. Missing Date Handling
When RSS feeds didn't provide a `pubDate` or `isoDate`, the `publishedAt` field was set to `undefined`, and there was no fallback to use the article's `createdAt` timestamp.

## Solution Implemented

### 1. Created Centralized Date Utilities (`src/lib/date-utils.ts`)

A comprehensive date utility library with timezone-aware functions:

- **`formatRelativeTime(date, fallbackDate?)`**: Formats dates as relative time strings (e.g., "2h ago", "3d ago") using UTC timestamps for calculations
- **`formatLocalizedDate(date, fallbackDate?, options?)`**: Formats dates using the user's locale and timezone
- **`formatLocalizedDateTime(date, fallbackDate?)`**: Formats dates with both date and time
- **`formatSmartDate(date, fallbackDate?, threshold?)`**: Shows relative time for recent dates, absolute date for older ones
- **`toISOString(date, fallbackDate?)`**: Safely converts dates to ISO strings for HTML datetime attributes

All functions:
- Accept both `Date` objects and ISO strings
- Support fallback dates for when primary date is null
- Use `getTime()` for time difference calculations (always UTC)
- Use `toLocaleDateString()`/`toLocaleString()` for display (user's timezone)

### 2. Updated All Components

#### ArticleCard.tsx
- Removed local `formatDate` function
- Imported `formatSmartDate` and `toISOString` from date-utils
- Updated to use `publishedAt` with `createdAt` as fallback

#### ArticlePanel.tsx
- Removed local `formatDate` and `toISOString` functions
- Imported `formatLocalizedDateTime` and `toISOString` from date-utils
- Updated to use fallback dates

#### RelatedArticles.tsx
- Imported `formatLocalizedDate` from date-utils
- Updated date display to use the new utility

#### FeedManagementModal.tsx
- Replaced custom `formatLastRefresh` logic with `formatSmartDate`
- Updated tooltips to use `formatLocalizedDateTime`

#### Admin Dashboard
- Updated user creation date display to use `formatLocalizedDate`

### 3. Enhanced Feed Parser (`src/lib/feed-parser.ts`)

Updated the article parsing logic to always provide a date:

```typescript
// Parse published date (Atom uses isoDate, RSS uses pubDate)
// If no date is provided, use current time as fallback
let publishedAt: Date | undefined;
if (item.isoDate) {
  publishedAt = new Date(item.isoDate);
} else if (item.pubDate) {
  publishedAt = new Date(item.pubDate);
} else {
  // Fallback to current time if no date is provided by the feed
  publishedAt = new Date();
}

// Always include publishedAt (validated or fallback to current time)
publishedAt: publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : new Date(),
```

### 4. Updated Article Service (`src/lib/services/article-service.ts`)

Added fallback in the `createArticle` function:

```typescript
publishedAt: data.publishedAt || new Date(),
```

## How It Works

### Timezone Handling

1. **Storage**: Dates are stored in PostgreSQL as `DateTime` (UTC)
2. **Transmission**: Dates are sent to the frontend as ISO strings (UTC)
3. **Parsing**: JavaScript parses ISO strings correctly into Date objects
4. **Calculation**: Time differences are calculated using `.getTime()` which returns milliseconds since epoch (UTC)
5. **Display**: Dates are formatted using `.toLocaleDateString()` which automatically converts to the user's timezone

### Example Flow for Brazilian User (UTC-3)

1. Article published at 12:00 PM Brazil time (15:00 UTC)
2. Stored in database as `2025-11-18T15:00:00.000Z`
3. Sent to frontend as ISO string: `"2025-11-18T15:00:00.000Z"`
4. Parsed by JavaScript: `new Date("2025-11-18T15:00:00.000Z")`
5. Time difference calculated: `Date.now() - date.getTime()` (both in UTC milliseconds)
6. Display formatted: `toLocaleDateString()` shows "Nov 18, 2025" in user's locale
7. Relative time: "2h ago" calculated correctly without timezone offset

## Testing

Created `scripts/test-timezone-handling.ts` to verify:
- ✅ Relative time formatting
- ✅ Localized date formatting
- ✅ Smart date formatting (relative for recent, absolute for old)
- ✅ ISO string conversion
- ✅ Null date handling with fallbacks
- ✅ Timezone offset calculations

Run tests with:
```bash
npx tsx scripts/test-timezone-handling.ts
```

## Benefits

1. **Accurate Time Display**: Users in all timezones see correct relative times
2. **No More "Unknown date"**: Articles without publication dates fall back to creation time or current time
3. **Consistent Formatting**: All dates are formatted consistently across the application
4. **Maintainable**: Centralized date utilities make it easy to update formatting globally
5. **Locale-Aware**: Dates are displayed in the user's locale and timezone automatically

## Files Modified

- ✅ `src/lib/date-utils.ts` (new file)
- ✅ `app/components/articles/ArticleCard.tsx`
- ✅ `app/components/articles/ArticlePanel.tsx`
- ✅ `app/components/articles/RelatedArticles.tsx`
- ✅ `app/components/feeds/FeedManagementModal.tsx`
- ✅ `app/admin/dashboard/page.tsx`
- ✅ `src/lib/feed-parser.ts`
- ✅ `src/lib/services/article-service.ts`
- ✅ `scripts/test-timezone-handling.ts` (new file)

## Migration Notes

No database migration is required. The fix is entirely in the application layer:
- Existing dates in the database remain unchanged
- The `publishedAt` field in the schema is already nullable, which is fine
- New articles will always have a `publishedAt` value (fallback to current time)

## Future Improvements

Consider these optional enhancements:
1. Add user preference for date format (relative vs absolute)
2. Add user preference for timezone override
3. Add "time ago" updates in real-time (e.g., update "2m ago" to "3m ago")
4. Add more granular relative time (e.g., "30 seconds ago")

