import { z } from "zod";

/**
 * Schema for OPML export query parameters
 */
export const opmlExportQuerySchema = z.object({
  categoryIds: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),
  feedIds: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),
});

/**
 * Schema for validating a single feed in OPML
 */
export const opmlFeedSchema = z.object({
  title: z.string().min(1, "Feed title is required"),
  xmlUrl: z.string().url("Invalid feed URL"),
  htmlUrl: z.string().url("Invalid HTML URL").optional(),
  description: z.string().optional(),
  type: z.string().optional().default("rss"),
  categories: z.array(z.string()).default([]),
});

/**
 * Schema for parsed OPML structure
 */
export const parsedOPMLSchema = z.object({
  title: z.string().optional(),
  dateCreated: z.date().optional(),
  feeds: z.array(opmlFeedSchema),
});

/**
 * Schema for OPML import options
 */
export const opmlImportOptionsSchema = z.object({
  selectedFeedUrls: z.array(z.string().url()).optional(),
  createMissingCategories: z.boolean().default(true),
  subscribeToFeeds: z.boolean().default(true),
  skipExisting: z.boolean().default(true),
});

/**
 * Schema for category name validation
 */
export const categoryNameSchema = z
  .string()
  .min(1, "Category name cannot be empty")
  .max(100, "Category name is too long")
  .regex(/^[^<>{}[\]]+$/, "Category name contains invalid characters")
  .transform((val) => val.trim());

/**
 * Schema for feed URL validation
 */
export const feedUrlSchema = z
  .string()
  .url("Invalid URL format")
  .regex(
    /^https?:\/\/.+/,
    "URL must start with http:// or https://"
  );

/**
 * Validate OPML file size
 */
export function validateOPMLFileSize(size: number): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (size > maxSize) {
    return {
      valid: false,
      error: `File size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (10MB)`,
    };
  }
  return { valid: true };
}

/**
 * Validate OPML file type
 */
export function validateOPMLFileType(filename: string, mimeType?: string): {
  valid: boolean;
  error?: string;
} {
  const validExtensions = [".opml", ".xml"];
  const validMimeTypes = [
    "text/xml",
    "application/xml",
    "text/x-opml",
    "text/x-opml+xml",
  ];

  const hasValidExtension = validExtensions.some((ext) =>
    filename.toLowerCase().endsWith(ext)
  );

  const hasValidMimeType = !mimeType || validMimeTypes.includes(mimeType);

  if (!hasValidExtension) {
    return {
      valid: false,
      error: "File must have .opml or .xml extension",
    };
  }

  if (!hasValidMimeType) {
    return {
      valid: false,
      error: "Invalid file type. Expected XML/OPML file",
    };
  }

  return { valid: true };
}

/**
 * Schema for OPML import result
 */
export const opmlImportResultSchema = z.object({
  success: z.boolean(),
  summary: z.object({
    totalFeeds: z.number(),
    feedsCreated: z.number(),
    feedsSkipped: z.number(),
    subscriptionsAdded: z.number(),
    categoriesCreated: z.number(),
  }),
  errors: z.array(
    z.object({
      feedUrl: z.string(),
      feedTitle: z.string(),
      error: z.string(),
    })
  ),
});

export type OPMLExportQuery = z.infer<typeof opmlExportQuerySchema>;
export type OPMLFeed = z.infer<typeof opmlFeedSchema>;
export type ParsedOPML = z.infer<typeof parsedOPMLSchema>;
export type OPMLImportOptions = z.infer<typeof opmlImportOptionsSchema>;
export type OPMLImportResult = z.infer<typeof opmlImportResultSchema>;

