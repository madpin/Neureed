# Content Extraction System

This document provides technical documentation for NeuReed's content extraction system, designed for developers who want to understand or extend the system.

## Architecture Overview

The content extraction system is built with a modular, plugin-based architecture that supports multiple extraction methods with intelligent fallback.

### Core Components

1. **Extractors** - Individual extraction implementations
2. **Extractor Registry** - Manages and orchestrates extractors
3. **Content Extraction Service** - High-level API for extraction
4. **Feed Settings Service** - Manages per-feed extraction configuration
5. **Encryption Service** - Secures sensitive data (cookies)

### Directory Structure

```
src/lib/
├── extractors/
│   ├── types.ts                    # Type definitions
│   ├── base-extractor.ts           # Base class for extractors
│   ├── readability-extractor.ts    # Readability.js implementation
│   ├── playwright-extractor.ts     # Playwright implementation
│   └── extractor-registry.ts       # Extractor orchestration
├── services/
│   ├── content-extraction-service.ts
│   ├── feed-settings-service.ts
│   └── encryption-service.ts
└── validations/
    └── extraction-validation.ts    # Zod schemas
```

## Extraction Methods

### 1. RSS Parser (Default)

The default method that parses standard RSS/Atom feeds.

**Pros:**
- Fast and lightweight
- Works with any standard feed
- No additional dependencies

**Cons:**
- Limited to feed content
- May have truncated articles
- No access to paywalled content

**Use when:**
- Feed provides full content
- No authentication required
- Performance is critical

### 2. Readability Extractor

Uses Mozilla's Readability library to extract clean article content from HTML pages.

**Pros:**
- Extracts full article content
- Removes ads and clutter
- Works with most article pages
- Supports cookie-based authentication

**Cons:**
- Requires fetching full HTML
- May fail on non-article pages
- Doesn't handle JavaScript-rendered content

**Use when:**
- Feed has truncated content
- Need clean, readable text
- Static HTML pages

**Implementation:**
```typescript
import { ReadabilityExtractor } from '@/lib/extractors/readability-extractor';

const extractor = new ReadabilityExtractor();
const result = await extractor.extract(url, {
  cookies: cookieString,
  headers: { 'User-Agent': '...' }
});
```

### 3. Playwright Extractor (Optional)

Uses Playwright to render JavaScript-heavy pages in a headless browser.

**Pros:**
- Handles JavaScript-rendered content
- Supports complex authentication flows
- Can wait for dynamic content
- Full browser environment

**Cons:**
- Slower than other methods
- Requires Playwright installation
- Higher resource usage
- Optional dependency

**Use when:**
- Content is JavaScript-rendered
- Static extraction fails
- Complex authentication required

**Configuration:**
```bash
# Install Playwright (optional)
npm install playwright

# Enable in environment
PLAYWRIGHT_ENABLED=true
```

## Extractor Interface

All extractors implement the `ContentExtractor` interface:

```typescript
interface ContentExtractor {
  name: string;
  priority?: number;
  
  canHandle(url: string, config?: ExtractorConfig): Promise<boolean>;
  extract(url: string, config?: ExtractorConfig): Promise<ExtractedContent>;
}
```

### Creating a Custom Extractor

1. **Extend BaseExtractor:**

```typescript
import { BaseExtractor } from '@/lib/extractors/base-extractor';

export class CustomExtractor extends BaseExtractor {
  name = "custom";
  priority = 60;

  async canHandle(url: string, config?: ExtractorConfig): Promise<boolean> {
    // Check if this extractor can handle the URL
    return url.includes('example.com');
  }

  async extract(url: string, config?: ExtractorConfig): Promise<ExtractedContent> {
    try {
      // Fetch content
      const response = await this.fetchWithConfig(url, config);
      const html = await response.text();

      // Extract content (your logic here)
      const title = extractTitle(html);
      const content = extractContent(html);

      return this.createSuccessResult(title, content, {
        excerpt: this.extractExcerpt(content),
        author: extractAuthor(html),
      });
    } catch (error) {
      return this.createErrorResult(url, error.message);
    }
  }
}
```

2. **Register the extractor:**

```typescript
import { extractorRegistry } from '@/lib/extractors/extractor-registry';
import { customExtractor } from './custom-extractor';

extractorRegistry.registerExtractor(customExtractor);
```

## Fallback Chain

The extractor registry tries extractors in priority order:

1. **Playwright** (priority: 100) - if enabled and configured
2. **Readability** (priority: 75) - default for HTML extraction
3. **RSS Parser** (priority: 50) - fallback

### How Fallback Works

```typescript
// Try extractors in priority order
for (const extractor of extractors) {
  if (await extractor.canHandle(url, config)) {
    const result = await extractor.extract(url, config);
    if (result.success) {
      return result; // Success, stop here
    }
    // Failed, try next extractor
  }
}
// All failed, return error
```

## Cookie Management

### Encryption

Cookies are encrypted using AES-256-GCM before storage:

```typescript
import { encrypt, decrypt } from '@/lib/services/encryption-service';

// Encrypt before saving
const encrypted = encrypt(cookieString);

// Decrypt when using
const decrypted = decrypt(encrypted);
```

### Cookie Formats

The system supports multiple cookie formats:

**JSON Array:**
```json
[
  {"name": "session", "value": "abc123"},
  {"name": "token", "value": "xyz789"}
]
```

**Header String:**
```
session=abc123; token=xyz789
```

**Netscape Format:**
```
.example.com	TRUE	/	FALSE	1234567890	session	abc123
```

### Cookie Parsing

The `BaseExtractor.parseCookies()` method handles all formats:

```typescript
protected parseCookies(cookieString: string): ParsedCookie[] {
  // Tries JSON, Netscape, Header, and raw formats
  // Returns normalized ParsedCookie array
}
```

## Feed Settings Schema

Extraction settings are stored in the `Feed.settings` JSON field:

```typescript
{
  extraction: {
    method: "readability",
    requiresAuth: true,
    cookies: {
      format: "json",
      value: "encrypted_string",
      updatedAt: "2024-01-01T00:00:00Z"
    },
    headers: {
      "User-Agent": "Custom UA"
    },
    customSelector: "article.main",
    timeout: 30000,
    lastTestedAt: "2024-01-01T00:00:00Z",
    lastTestStatus: "success",
    lastTestError: null
  }
}
```

## API Endpoints

### Get Feed Settings
```http
GET /api/feeds/:id/settings
```

Returns decrypted extraction settings for a feed.

### Update Feed Settings
```http
PUT /api/feeds/:id/settings
Content-Type: application/json

{
  "method": "readability",
  "requiresAuth": true,
  "cookies": "raw_cookie_string",
  "headers": {"User-Agent": "..."},
  "customSelector": "article",
  "timeout": 30000
}
```

Cookies are automatically encrypted before storage.

### Test Extraction
```http
POST /api/feeds/:id/test-extraction
Content-Type: application/json

{
  "url": "https://example.com/article",  // Optional, uses feed URL if not provided
  "method": "readability",                // Optional
  "cookies": "...",                       // Optional
  "headers": {},                          // Optional
  "customSelector": "article"             // Optional
}
```

Returns extraction result with content preview.

### Clear Settings
```http
DELETE /api/feeds/:id/settings
```

Removes all extraction settings for a feed.

## Integration with Feed Refresh

The feed refresh service automatically uses extraction settings:

```typescript
// In feed-refresh-service.ts
const settings = feed.settings?.extraction;

if (settings && settings.method !== 'rss') {
  // Try content extraction
  for (const article of parsedFeed.items) {
    const extracted = await extractContent(article.link, feedId);
    if (extracted.success) {
      // Use extracted content
      article.content = extracted.content;
    }
    // Falls back to RSS content on failure
  }
}
```

## Performance Considerations

### Caching

Consider implementing caching for:
- Extracted content (by URL hash)
- Extractor availability checks
- Cookie validation results

### Rate Limiting

Implement rate limiting for:
- Extraction requests per feed
- Test extraction attempts
- Cookie validation

### Timeouts

Default timeouts:
- Extraction: 30 seconds
- Playwright page load: 30 seconds
- Network requests: 30 seconds

Configure via `EXTRACTION_TIMEOUT` environment variable.

### Resource Usage

**Readability:**
- Memory: ~50MB per extraction
- CPU: Low
- Network: 1 HTTP request

**Playwright:**
- Memory: ~200MB per browser instance
- CPU: Medium-High
- Network: Multiple requests + resources

## Error Handling

### Extraction Errors

Extractors return structured error results:

```typescript
{
  success: false,
  method: "readability",
  error: "Authentication required (401)",
  title: "",
  content: ""
}
```

### Common Error Types

1. **Authentication Errors (401, 403)**
   - Cookies expired or invalid
   - Account doesn't have access
   - Solution: Update cookies

2. **Content Not Found (404)**
   - Article removed or moved
   - Invalid URL
   - Solution: Check URL, remove feed

3. **Timeout Errors**
   - Slow website response
   - Network issues
   - Solution: Increase timeout, check network

4. **Parsing Errors**
   - Invalid HTML structure
   - Non-article page
   - Solution: Try different extractor, custom selector

## Testing

### Unit Tests

Test individual extractors:

```typescript
describe('ReadabilityExtractor', () => {
  it('should extract article content', async () => {
    const extractor = new ReadabilityExtractor();
    const result = await extractor.extract('https://example.com/article');
    
    expect(result.success).toBe(true);
    expect(result.title).toBeTruthy();
    expect(result.content).toBeTruthy();
  });
});
```

### Integration Tests

Test the full extraction flow:

```typescript
describe('Content Extraction Service', () => {
  it('should extract with fallback', async () => {
    const result = await extractContent('https://example.com/article', feedId);
    expect(result.success).toBe(true);
  });
});
```

### Manual Testing

Use the test extraction endpoint:

```bash
curl -X POST http://localhost:3000/api/feeds/FEED_ID/test-extraction \
  -H "Content-Type: application/json" \
  -d '{"method": "readability"}'
```

## Monitoring

### Metrics to Track

1. **Extraction Success Rate**
   - Per extractor
   - Per feed
   - Overall

2. **Extraction Duration**
   - Average time per method
   - P95/P99 latencies

3. **Error Rates**
   - By error type
   - By extractor
   - By feed

4. **Resource Usage**
   - Memory per extraction
   - CPU usage
   - Network bandwidth

### Logging

The system logs extraction attempts:

```typescript
logger.info('[Readability] Extracting content from URL');
logger.error('[Readability] Extraction failed: error message');
logger.warn('[Readability] Paywall detected');
```

## Security Best Practices

1. **Cookie Storage**
   - Always encrypt cookies before storage
   - Use strong encryption keys (32+ characters)
   - Rotate encryption keys periodically

2. **Input Validation**
   - Validate all URLs before extraction
   - Sanitize extracted HTML content
   - Validate cookie formats

3. **SSRF Prevention**
   - Block private IP ranges
   - Block localhost
   - Validate URL protocols (HTTP/HTTPS only)

4. **Rate Limiting**
   - Limit extraction attempts per feed
   - Limit test extractions per user
   - Implement exponential backoff

5. **Error Messages**
   - Don't expose internal errors to users
   - Log detailed errors server-side
   - Return generic error messages to clients

## Environment Variables

```bash
# Required
ENCRYPTION_SECRET=your-32-char-secret-key-here

# Optional
PLAYWRIGHT_ENABLED=false
EXTRACTION_TIMEOUT=30000
```

## Troubleshooting

### Extractor Not Working

1. Check if extractor is registered
2. Verify `canHandle()` returns true
3. Check extractor priority
4. Review error logs

### Cookies Not Working

1. Verify cookies are encrypted correctly
2. Check cookie format is supported
3. Test cookies manually in browser
4. Verify cookies haven't expired

### Playwright Issues

1. Check if Playwright is installed
2. Verify `PLAYWRIGHT_ENABLED=true`
3. Check browser installation
4. Review Playwright logs

## Future Enhancements

Potential improvements:

1. **Site-Specific Extractors**
   - Medium, Substack, etc.
   - Custom logic per site

2. **Caching Layer**
   - Redis for extracted content
   - Reduce redundant extractions

3. **Browser Pool**
   - Reuse Playwright browsers
   - Improve performance

4. **ML-Based Extraction**
   - Train models for content detection
   - Improve extraction accuracy

5. **Proxy Support**
   - Rotate IPs
   - Avoid rate limiting

## Contributing

To add a new extractor:

1. Create extractor class extending `BaseExtractor`
2. Implement `canHandle()` and `extract()` methods
3. Register in `extractor-registry.ts`
4. Add tests
5. Update documentation

## Support

For issues or questions:
- Check the troubleshooting section
- Review error logs
- Test extraction manually
- Open an issue on GitHub

