# LLM JSON Parsing Improvements

## Problem

The application was experiencing JSON parsing errors when processing LLM responses:
- Error: "Unexpected end of JSON input"
- Empty raw responses logged
- LLMs often return JSON wrapped in markdown code blocks or with introductory text
- No detailed logging of the actual LLM response when parsing failed

## Solution

Created a robust JSON extraction and parsing utility that:
1. **Extracts JSON** from various response formats
2. **Logs detailed error information** when parsing fails
3. **Handles common LLM response patterns** automatically

## Changes Made

### 1. New Utility Module: `json-parser.ts`

Location: [src/lib/llm/json-parser.ts](../src/lib/llm/json-parser.ts)

**Key Functions:**

#### `extractJSON(rawResponse: string): string`
Cleans and extracts JSON from LLM responses that may contain:
- Markdown code blocks: `` ```json\n{...}\n``` ``
- Markdown code blocks without language tag: `` ```\n{...}\n``` ``
- Introductory text: `"Here's the result: {...}"`
- Trailing text: `"{...} I hope this helps!"`

**Examples:**

```typescript
// Input: "Here's the JSON:\n```json\n{\"key\": \"value\"}\n```"
// Output: "{\"key\": \"value\"}"

// Input: "Sure! {\"summary\": \"text\"} Let me know if you need anything else."
// Output: "{\"summary\": \"text\"}"
```

#### `parseJSONFromLLM(rawResponse: string, context?: { model?: string; operation?: string }): any`
Parses JSON from LLM response with automatic extraction and detailed error logging.

**Error Logging includes:**
- Parse error message
- First 1000 characters of raw response
- First 1000 characters of extracted JSON
- Response length
- Model name
- Operation name

#### `parseJSONFromLLMSafe<T>(rawResponse: string, fallback: T, context?: { ... }): T`
Safe parsing with fallback value if parsing fails.

### 2. Updated LLM Providers

**Files Modified:**
- [src/lib/llm/openai-provider.ts](../src/lib/llm/openai-provider.ts)
- [src/lib/llm/ollama-provider.ts](../src/lib/llm/ollama-provider.ts)
- [src/lib/services/summarization-service.ts](../src/lib/services/summarization-service.ts)

**Changes:**
- All `JSON.parse()` calls replaced with `parseJSONFromLLM()`
- Improved error logging (changed from `logger.error` to `logger.warn` for fallback cases)
- Added context information (model name, operation) to all parse calls

### 3. Enhanced Error Logging

**Before:**
```typescript
logger.error("Failed to parse LLM JSON response, using fallback", {
  parseError: "Unexpected end of JSON input",
  fullRawResponse: "",  // Often empty!
  responseLength: 0,
  model: "gpt-5-nano"
});
```

**After:**
```typescript
logger.error("Failed to parse LLM JSON response", {
  parseError: "Unexpected token",
  rawResponse: "Here's the result: ```json\n{\"sum...",  // First 1000 chars
  extractedJSON: "{\"sum...",  // First 1000 chars of extracted JSON
  responseLength: 2543,
  extractedLength: 234,
  model: "gpt-4o-mini",
  operation: "summarizeArticle"
});
```

## Usage Examples

### In LLM Providers

```typescript
import { parseJSONFromLLM } from "./json-parser";

// In summarizeArticle method
try {
  const parsed = parseJSONFromLLM(response.content, {
    model: this.model,
    operation: "summarizeArticle",
  });
  return {
    summary: parsed.summary || "",
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
    topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    sentiment: ["positive", "neutral", "negative"].includes(parsed.sentiment)
      ? parsed.sentiment
      : "neutral",
  };
} catch (parseError) {
  // Detailed error already logged by parseJSONFromLLM
  logger.warn("Using fallback for article summary due to parse error", {
    model: this.model,
  });

  return {
    summary: response.content.substring(0, 500),
    keyPoints: [],
    topics: [],
    sentiment: "neutral",
  };
}
```

## Supported Response Formats

The parser now handles all these formats automatically:

1. **Plain JSON**
   ```
   {"key": "value"}
   ```

2. **Markdown with json tag**
   ```
   ```json
   {"key": "value"}
   ```
   ```

3. **Markdown without language tag**
   ```
   ```
   {"key": "value"}
   ```
   ```

4. **With introductory text**
   ```
   Sure! Here's the JSON response:
   {"key": "value"}
   ```

5. **With trailing text**
   ```
   {"key": "value"}

   I hope this helps!
   ```

6. **Complex multi-line with explanation**
   ```
   Here's your article summary:

   ```json
   {
     "summary": "This is a summary",
     "keyPoints": ["point 1", "point 2"],
     "topics": ["topic1", "topic2"],
     "sentiment": "positive"
   }
   ```

   Let me know if you need any clarifications!
   ```

## Benefits

1. **Fewer Parse Errors**: Automatically extracts JSON from various formats
2. **Better Debugging**: Detailed error logs show actual LLM responses
3. **Graceful Fallbacks**: Maintains functionality even with malformed responses
4. **Consistent Handling**: Same parsing logic across all LLM providers
5. **Type Safety**: TypeScript support with generic fallback values

## Testing

A comprehensive test suite is available at:
[src/lib/llm/__tests__/json-parser.test.ts](../src/lib/llm/__tests__/json-parser.test.ts)

Tests cover:
- Plain JSON extraction
- Markdown code block extraction (with and without language tags)
- Removal of introductory/trailing text
- JSON arrays
- Complex nested structures
- Error handling and fallbacks

## Migration Notes

All existing code using `JSON.parse()` for LLM responses should be updated to use `parseJSONFromLLM()`:

**Before:**
```typescript
const parsed = JSON.parse(response.content);
```

**After:**
```typescript
const parsed = parseJSONFromLLM(response.content, {
  model: this.model,
  operation: "operationName"
});
```

## Monitoring

After deployment, monitor logs for:
- Reduced frequency of JSON parse errors
- More informative error messages with actual LLM response content
- Successful extraction from markdown-wrapped responses

Look for log messages:
- `"Failed to parse LLM JSON response"` (error level) - parsing failed even after extraction
- `"Using fallback for ..."` (warn level) - fallback value used due to parse failure
