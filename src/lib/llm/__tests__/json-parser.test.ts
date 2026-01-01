/**
 * Tests for JSON Parser Utilities
 */

import { extractJSON, parseJSONFromLLM, parseJSONFromLLMSafe } from "../json-parser";

describe("extractJSON", () => {
  it("should extract plain JSON", () => {
    const input = '{"key": "value"}';
    const result = extractJSON(input);
    expect(result).toBe('{"key": "value"}');
  });

  it("should extract JSON from markdown code blocks with json tag", () => {
    const input = "Here's the JSON:\n```json\n{\"key\": \"value\"}\n```";
    const result = extractJSON(input);
    expect(result).toBe('{"key": "value"}');
  });

  it("should extract JSON from markdown code blocks without json tag", () => {
    const input = "```\n{\"key\": \"value\"}\n```";
    const result = extractJSON(input);
    expect(result).toBe('{"key": "value"}');
  });

  it("should remove introductory text before JSON", () => {
    const input = "Sure! Here's the result: {\"key\": \"value\"}";
    const result = extractJSON(input);
    expect(result).toBe('{"key": "value"}');
  });

  it("should remove trailing text after JSON", () => {
    const input = '{\"key\": \"value\"} I hope this helps!';
    const result = extractJSON(input);
    expect(result).toBe('{"key": "value"}');
  });

  it("should handle JSON arrays", () => {
    const input = '["item1", "item2", "item3"]';
    const result = extractJSON(input);
    expect(result).toBe('["item1", "item2", "item3"]');
  });

  it("should extract JSON array from markdown", () => {
    const input = "```json\n[\"item1\", \"item2\"]\n```";
    const result = extractJSON(input);
    expect(result).toBe('["item1", "item2"]');
  });

  it("should handle complex nested JSON", () => {
    const input = `
Here's your response:
\`\`\`json
{
  "summary": "This is a summary",
  "keyPoints": ["point 1", "point 2"],
  "topics": ["topic1", "topic2"],
  "sentiment": "positive"
}
\`\`\`
I hope this is helpful!
    `.trim();
    const result = extractJSON(input);
    const parsed = JSON.parse(result);
    expect(parsed.summary).toBe("This is a summary");
    expect(parsed.keyPoints).toHaveLength(2);
    expect(parsed.topics).toHaveLength(2);
  });
});

describe("parseJSONFromLLM", () => {
  it("should parse valid JSON", () => {
    const input = '{"key": "value"}';
    const result = parseJSONFromLLM(input);
    expect(result).toEqual({ key: "value" });
  });

  it("should parse JSON from markdown", () => {
    const input = "```json\n{\"key\": \"value\"}\n```";
    const result = parseJSONFromLLM(input);
    expect(result).toEqual({ key: "value" });
  });

  it("should throw error for invalid JSON", () => {
    const input = "This is not JSON";
    expect(() => parseJSONFromLLM(input)).toThrow();
  });

  it("should parse JSON with context for logging", () => {
    const input = '{"key": "value"}';
    const result = parseJSONFromLLM(input, {
      model: "gpt-4",
      operation: "test",
    });
    expect(result).toEqual({ key: "value" });
  });
});

describe("parseJSONFromLLMSafe", () => {
  it("should parse valid JSON", () => {
    const input = '{"key": "value"}';
    const result = parseJSONFromLLMSafe(input, { fallback: true });
    expect(result).toEqual({ key: "value" });
  });

  it("should return fallback for invalid JSON", () => {
    const input = "This is not JSON";
    const fallback = { fallback: true, empty: [] };
    const result = parseJSONFromLLMSafe(input, fallback);
    expect(result).toEqual(fallback);
  });

  it("should return fallback for empty response", () => {
    const input = "";
    const fallback = { summary: "", keyPoints: [], topics: [] };
    const result = parseJSONFromLLMSafe(input, fallback);
    expect(result).toEqual(fallback);
  });
});
