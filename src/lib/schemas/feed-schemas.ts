import { z } from "zod";

/**
 * Extraction methods for feed content
 */
export const extractionMethodSchema = z.enum([
  "rss",
  "readability",
  "playwright",
  "custom",
]);

export type ExtractionMethod = z.infer<typeof extractionMethodSchema>;

/**
 * Schema for adding a new feed
 */
export const addFeedSchema = z.object({
  /**
   * Feed URL (required)
   */
  url: z.string().url("Please enter a valid URL"),

  /**
   * Optional feed name (auto-detected if not provided)
   */
  name: z.string().optional(),

  /**
   * Optional category IDs to assign the feed to
   */
  categoryIds: z.array(z.string()).optional(),

  /**
   * Content extraction method
   */
  extractionMethod: extractionMethodSchema,
});

export type AddFeedFormData = z.infer<typeof addFeedSchema>;

/**
 * Schema for editing an existing feed
 */
export const editFeedSchema = z.object({
  /**
   * Feed ID
   */
  id: z.string(),

  /**
   * Feed name
   */
  name: z.string().min(1, "Feed name is required"),

  /**
   * Feed URL
   */
  url: z.string().url("Please enter a valid URL"),

  /**
   * Category IDs
   */
  categoryIds: z.array(z.string()).optional(),

  /**
   * Content extraction method
   */
  extractionMethod: extractionMethodSchema,

  /**
   * Whether the feed is enabled
   */
  enabled: z.boolean().default(true),
});

export type EditFeedFormData = z.infer<typeof editFeedSchema>;
