# Feed Parser Migration Summary

## Overview

Successfully migrated from `rss-parser` to `@rowanmanning/feed-parser` (v2.1.1) on November 21, 2025.

## Motivation

- **Better Maintained**: `@rowanmanning/feed-parser` is actively maintained with modern development practices
- **Cleaner API**: Separation of fetching and parsing provides more flexibility
- **Better Error Handling**: Specific error codes (e.g., `INVALID_FEED`) for better diagnostics
- **Modern TypeScript**: Better type definitions and TypeScript support

## Changes Made

### 1. Package Updates

**Added:**
- `@rowanmanning/feed-parser@^2.1.1`

**Removed:**
- `rss-parser@^3.13.0`

### 2. Code Changes

**Modified File:** `src/lib/feed-parser.ts`

#### Key Changes:
- Replaced `Parser` import with `parseFeed` from new library
- Removed `PARSER_CONFIG` object (no longer needed)
- Removed parser instance initialization
- Updated field mappings:
  - `item.link` → `item.url`
  - `item.guid` → `item.id`
  - `item.isoDate` / `item.pubDate` → `item.published` / `item.updated`
  - `item.creator` / `item.author` → `item.authors[]` (array)
  - `item.enclosure` → `item.media[]` (array)
  - `feed.link` → `feed.url`
  - `feed.subtitle` → included in `feed.description`

#### Maintained Compatibility:
- All exported functions maintain the same signatures
- Same `ParsedFeed` and `ParsedArticle` interfaces
- No changes required in dependent services
- All helper functions (sanitization, normalization, etc.) unchanged

### 3. Testing

Created comprehensive test suite: `scripts/test-feed-parser-migration.ts`

**Tests Included:**
- URL safety validation (8 test cases)
- URL normalization (2 test cases)
- Feed parsing with various formats:
  - RSS 2.0 feeds
  - Atom feeds
  - RSS with content:encoded
  - RSS with media enclosures
- Testing with existing database feeds

**Test Results:**
- ✅ All 9 feeds tested successfully
- ✅ URL safety checks: 8/8 passed
- ✅ URL normalization: 2/2 passed
- ✅ TypeScript compilation: No errors
- ✅ ESLint: No errors

### 4. Documentation Updates

- Updated `CHANGELOG.md` with migration details
- Created this migration document
- No changes needed to `CLAUDE.md` (references were already generic)

## Compatibility

### Maintained Features:
- ✅ RSS 2.0 feed support
- ✅ Atom 1.0 feed support
- ✅ Content extraction (content:encoded, description, summary)
- ✅ Author extraction (dc:creator, author fields)
- ✅ Media/image extraction (media:content, media:thumbnail, enclosures)
- ✅ Date parsing with timezone support
- ✅ HTML entity decoding
- ✅ Content sanitization
- ✅ Feed metadata extraction (title, description, link, image)
- ✅ SSRF protection
- ✅ Encoding detection (ISO-8859-1, UTF-8, Windows-1252)

### Verified Integrations:
- ✅ `feed-refresh-service.ts` - Feed refresh operations
- ✅ `feed-service.ts` - Feed validation and creation
- ✅ `article-service.ts` - Article content processing
- ✅ `article-deduplication.ts` - Content hashing
- ✅ `content-extraction-service.ts` - External content extraction
- ✅ API routes (`/api/feeds/validate`)

## Technical Details

### Field Mapping Reference

| Old (rss-parser) | New (@rowanmanning/feed-parser) | Notes |
|------------------|----------------------------------|-------|
| `item.link` | `item.url` | Direct mapping |
| `item.guid` | `item.id` | Direct mapping |
| `item.isoDate` | `item.published` | Already a Date object |
| `item.pubDate` | `item.published` | Already a Date object |
| `item.creator` | `item.authors[0].name` | Now an array |
| `item["dc:creator"]` | `item.authors[0].name` | Automatically normalized |
| `item.author` | `item.authors[0]` | Can be string or object |
| `item.enclosure` | `item.media[]` | Now an array |
| `item["media:content"]` | `item.media[]` | Automatically extracted |
| `item["content:encoded"]` | `item.content` | Automatically preferred |
| `feed.link` | `feed.url` | Direct mapping |
| `feed.subtitle` | `feed.description` | Merged into description |

### Error Handling

The new library provides specific error codes:

```typescript
try {
  const feed = parseFeed(xml);
} catch (error) {
  if (error.code === 'INVALID_FEED') {
    // Handle invalid feed format
  }
}
```

## Rollback Plan

If needed, rollback is straightforward:

1. Revert the changes to `src/lib/feed-parser.ts`
2. Run: `npm install rss-parser@^3.13.0`
3. Run: `npm uninstall @rowanmanning/feed-parser`
4. Redeploy

The git commit hash for this migration: [To be added when committed]

## Performance

No significant performance impact observed:
- Feed parsing speed: Similar to previous implementation
- Memory usage: No increase detected
- All existing feeds parse successfully

## Future Considerations

- The new library provides a cleaner separation between fetching and parsing
- Easier to implement custom feed fetching logic if needed
- Better positioned for future enhancements (e.g., custom parser plugins)

## References

- [@rowanmanning/feed-parser GitHub](https://github.com/rowanmanning/feed-parser)
- [@rowanmanning/feed-parser npm](https://www.npmjs.com/package/@rowanmanning/feed-parser)
- Migration Test Results: See `scripts/test-feed-parser-migration.ts`

## Conclusion

The migration was successful with:
- ✅ Zero breaking changes to the API
- ✅ All tests passing
- ✅ Full backward compatibility
- ✅ Improved maintainability
- ✅ Better error handling

No further action required. The application is ready for deployment with the new feed parser.

