/**
 * JSON Parser Utilities for LLM Responses
 * Handles extraction of JSON from responses that may be wrapped in markdown or have introductory text
 */

import { logger } from "../logger";

/**
 * Extract JSON from LLM response that may be wrapped in markdown code blocks or have introductory text
 *
 * Handles cases like:
 * - "Here's the result: ```json\n{...}\n```"
 * - "```\n{...}\n```"
 * - "Sure! ```json {... } ```"
 * - "{...}" (plain JSON)
 */
export function extractJSON(rawResponse: string): string {
  // Trim whitespace
  let cleaned = rawResponse.trim();

  // Try to extract JSON from markdown code blocks
  // Match ```json or ``` followed by JSON content
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch?.[1]) {
    cleaned = codeBlockMatch[1].trim();
  }

  // Remove any leading text before the first { or [
  const jsonStartMatch = cleaned.match(/^[^{[]*([{[][\s\S]*)/);
  if (jsonStartMatch?.[1]) {
    cleaned = jsonStartMatch[1];
  }

  // Remove any trailing text after the last } or ]
  const jsonEndMatch = cleaned.match(/([\s\S]*[}\]])[^}\]]*$/);
  if (jsonEndMatch?.[1]) {
    cleaned = jsonEndMatch[1];
  }

  return cleaned.trim();
}

/**
 * Parse JSON from LLM response with automatic extraction and detailed error logging
 *
 * @param rawResponse - Raw LLM response that may contain JSON
 * @param context - Context information for error logging (e.g., model name, operation)
 * @returns Parsed JSON object
 * @throws Error if JSON cannot be parsed even after extraction
 */
export function parseJSONFromLLM(
  rawResponse: string,
  context?: { model?: string; operation?: string }
): unknown {
  const extracted = extractJSON(rawResponse);

  try {
    return JSON.parse(extracted);
  } catch (error) {
    // Log detailed error information
    logger.error("Failed to parse LLM JSON response", {
      parseError: error instanceof Error ? error.message : String(error),
      rawResponse: rawResponse.substring(0, 1000), // First 1000 chars to avoid huge logs
      extractedJSON: extracted.substring(0, 1000),
      responseLength: rawResponse.length,
      extractedLength: extracted.length,
      model: context?.model,
      operation: context?.operation,
    });

    throw new Error(
      `Failed to parse JSON from LLM response: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Safely parse JSON from LLM response with fallback value
 *
 * @param rawResponse - Raw LLM response
 * @param fallback - Fallback value if parsing fails
 * @param context - Context information for error logging
 * @returns Parsed JSON or fallback value
 */
export function parseJSONFromLLMSafe<T>(
  rawResponse: string,
  fallback: T,
  context?: { model?: string; operation?: string }
): T {
  try {
    return parseJSONFromLLM(rawResponse, context) as T;
  } catch (error) {
    logger.warn("Using fallback value due to JSON parse error", {
      context,
      fallbackUsed: true,
    });
    return fallback;
  }
}
