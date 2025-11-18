import { z } from "zod";

/**
 * Validation schemas for content extraction settings
 */

/**
 * Cookie store schema
 */
export const cookieStoreSchema = z.object({
  format: z.enum(["json", "netscape", "header", "raw"]),
  value: z.string(), // Encrypted value
  expiresAt: z.coerce.date().optional(),
  domain: z.string().optional(),
  updatedAt: z.coerce.date(),
});

/**
 * Extraction settings schema
 */
export const extractionSettingsSchema = z.object({
  method: z.enum(["rss", "readability", "playwright", "custom"]),
  requiresAuth: z.boolean().default(false),
  contentMergeStrategy: z.enum(["replace", "prepend", "append"]).default("replace"),
  cookies: cookieStoreSchema.optional(),
  headers: z.record(z.string(), z.string()).optional(),
  customSelector: z.string().optional(),
  timeout: z.number().int().positive().max(120000).optional(), // Max 2 minutes
  lastTestedAt: z.coerce.date().optional(),
  lastTestStatus: z.enum(["success", "failed", "pending"]).optional(),
  lastTestError: z.string().optional(),
});

/**
 * Extractor config schema (for API requests)
 */
export const extractorConfigSchema = z.object({
  cookies: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  timeout: z.number().int().positive().max(120000).optional(),
  customSelector: z.string().optional(),
  userAgent: z.string().optional(),
});

/**
 * Update extraction settings request schema
 */
export const updateExtractionSettingsSchema = z.object({
  method: z.enum(["rss", "readability", "playwright", "custom"]).optional(),
  requiresAuth: z.boolean().optional(),
  contentMergeStrategy: z.enum(["replace", "prepend", "append"]).optional(),
  cookies: z.string().optional(), // Raw cookie string (will be encrypted)
  headers: z.record(z.string(), z.string()).optional(),
  customSelector: z.string().optional(),
  timeout: z.number().int().positive().max(120000).optional(),
});

/**
 * Test extraction request schema
 */
export const testExtractionSchema = z.object({
  url: z.string().url().optional(), // If not provided, uses feed URL
  method: z.enum(["rss", "readability", "playwright", "custom"]).optional(),
  cookies: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  customSelector: z.string().optional(),
  timeout: z.number().int().positive().max(120000).optional(),
});

/**
 * Cookie format validation
 */
export function validateCookieFormat(cookieString: string): {
  valid: boolean;
  format?: "json" | "netscape" | "header" | "raw";
  error?: string;
} {
  if (!cookieString || !cookieString.trim()) {
    return { valid: false, error: "Cookie string is empty" };
  }

  // Try JSON format
  try {
    const parsed = JSON.parse(cookieString);
    if (Array.isArray(parsed)) {
      // Validate each cookie has name and value
      const allValid = parsed.every(
        (c: any) =>
          typeof c === "object" &&
          c !== null &&
          typeof c.name === "string" &&
          typeof c.value === "string"
      );
      if (allValid) {
        return { valid: true, format: "json" };
      }
    }
  } catch {
    // Not JSON, continue
  }

  // Check for Netscape format (tab-separated)
  if (cookieString.includes("\t")) {
    const lines = cookieString.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
    if (lines.length > 0) {
      const validLines = lines.every((line) => {
        const parts = line.split("\t");
        return parts.length >= 7;
      });
      if (validLines) {
        return { valid: true, format: "netscape" };
      }
    }
  }

  // Check for header format (semicolon-separated key=value pairs)
  if (cookieString.includes(";") && cookieString.includes("=")) {
    const pairs = cookieString.split(";");
    const validPairs = pairs.every((pair) => {
      const trimmed = pair.trim();
      return trimmed.includes("=");
    });
    if (validPairs) {
      return { valid: true, format: "header" };
    }
  }

  // Check for raw key=value pairs (newline-separated)
  const lines = cookieString.split("\n").filter((l) => l.trim());
  if (lines.length > 0) {
    const validLines = lines.every((line) => {
      const trimmed = line.trim();
      return !trimmed || trimmed.startsWith("#") || trimmed.includes("=");
    });
    if (validLines) {
      return { valid: true, format: "raw" };
    }
  }

  return {
    valid: false,
    error: "Invalid cookie format. Supported formats: JSON array, Netscape, Header string, or Raw key=value pairs",
  };
}

/**
 * Validate URL for extraction
 */
export function validateExtractionUrl(url: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const urlObj = new URL(url);
    
    // Only allow HTTP and HTTPS
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return {
        valid: false,
        error: "Only HTTP and HTTPS URLs are supported",
      };
    }

    // Block localhost and private IPs (basic check)
    const hostname = urlObj.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.")
    ) {
      return {
        valid: false,
        error: "Cannot extract from localhost or private IP addresses",
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Type exports
 */
export type ExtractionSettings = z.infer<typeof extractionSettingsSchema>;
export type ExtractorConfig = z.infer<typeof extractorConfigSchema>;
export type UpdateExtractionSettings = z.infer<typeof updateExtractionSettingsSchema>;
export type TestExtraction = z.infer<typeof testExtractionSchema>;
export type CookieStore = z.infer<typeof cookieStoreSchema>;

