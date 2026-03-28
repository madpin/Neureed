/**
 * Normalize extraction error text for storage and UI (single line, bounded length).
 */
export function sanitizeExtractionErrorMessage(
  message: string | undefined,
  maxLen = 500
): string | null {
  if (!message) return null;
  const singleLine = message.replace(/\s+/g, " ").trim();
  if (!singleLine) return null;
  if (singleLine.length <= maxLen) return singleLine;
  return `${singleLine.slice(0, maxLen - 1)}…`;
}
