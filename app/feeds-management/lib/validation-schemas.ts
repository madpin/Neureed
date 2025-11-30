import { z } from "zod";

/**
 * Validation Schemas for Feed Management
 *
 * Centralized Zod schemas for all feed management forms
 */

// Category validation
export const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters").max(100, "Category name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  parentId: z.string().optional(),
  icon: z.string().max(10).optional(),
  collapsed: z.boolean().optional(),
  sortOrder: z.enum(["manual", "alphabetical", "date"]).optional(),
  includeInSearch: z.boolean().optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// Feed basic settings validation
export const feedBasicSettingsSchema = z.object({
  name: z.string().min(1, "Feed name is required").max(200, "Feed name is too long"),
  url: z.string().url("Invalid URL format"),
  description: z.string().max(1000, "Description is too long").optional(),
  enabled: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export type FeedBasicSettingsData = z.infer<typeof feedBasicSettingsSchema>;

// Feed refresh settings validation
export const feedRefreshSettingsSchema = z.object({
  refreshInterval: z.number()
    .min(5, "Minimum refresh interval is 5 minutes")
    .max(10080, "Maximum refresh interval is 1 week (10080 minutes)")
    .optional(),
  maxArticlesPerFeed: z.number()
    .min(10, "Minimum 10 articles")
    .max(10000, "Maximum 10000 articles")
    .optional(),
  maxArticleAge: z.number()
    .min(1, "Minimum 1 day")
    .max(3650, "Maximum 10 years (3650 days)")
    .optional(),
  autoRefresh: z.boolean().optional(),
});

export type FeedRefreshSettingsData = z.infer<typeof feedRefreshSettingsSchema>;

// Feed content processing validation
export const feedContentProcessingSchema = z.object({
  extractionMethod: z.enum(["rss", "readability", "playwright", "custom"]).optional(),
  fullContentExtraction: z.boolean().optional(),
  extractImages: z.boolean().optional(),
  stripScripts: z.boolean().optional(),
  contentFilters: z.array(z.string()).optional(),
});

export type FeedContentProcessingData = z.infer<typeof feedContentProcessingSchema>;

// Feed connection settings validation
export const feedConnectionSettingsSchema = z.object({
  userAgent: z.string().max(500, "User agent is too long").optional(),
  timeout: z.number()
    .min(5000, "Minimum timeout is 5 seconds")
    .max(120000, "Maximum timeout is 2 minutes")
    .optional(),
  maxRedirects: z.number()
    .min(0, "Cannot be negative")
    .max(10, "Maximum 10 redirects")
    .optional(),
  customHeaders: z.record(z.string(), z.string()).optional(),
  authentication: z.object({
    type: z.enum(["none", "basic", "bearer", "cookie"]).optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    token: z.string().optional(),
    cookies: z.string().optional(),
  }).optional(),
});

export type FeedConnectionSettingsData = z.infer<typeof feedConnectionSettingsSchema>;

// Feed health settings validation
export const feedHealthSettingsSchema = z.object({
  autoDisableThreshold: z.number()
    .min(1, "Minimum 1 failure")
    .max(100, "Maximum 100 failures")
    .optional(),
  notifyOnError: z.boolean().optional(),
  healthCheckEnabled: z.boolean().optional(),
  errorNotificationEmails: z.array(z.string().email("Invalid email")).optional(),
});

export type FeedHealthSettingsData = z.infer<typeof feedHealthSettingsSchema>;

// Bulk edit validation
export const bulkEditSchema = z.object({
  action: z.enum(["category", "tags", "enable", "settings"]),
  feedIds: z.array(z.string()).min(1, "At least one feed must be selected"),
  category: z.string().optional(),
  tags: z.object({
    action: z.enum(["add", "remove", "replace"]),
    values: z.array(z.string()),
  }).optional(),
  enabled: z.boolean().optional(),
  settings: z.object({
    refreshInterval: z.number().optional(),
    maxArticlesPerFeed: z.number().optional(),
    maxArticleAge: z.number().optional(),
  }).optional(),
});

export type BulkEditData = z.infer<typeof bulkEditSchema>;

// OPML import validation
export const opmlImportSchema = z.object({
  file: z.instanceof(File, { message: "Please select a file" })
    .refine((file) => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB")
    .refine(
      (file) => file.name.endsWith(".opml") || file.name.endsWith(".xml"),
      "File must be .opml or .xml"
    ),
  defaultCategory: z.string().optional(),
  createMissingCategories: z.boolean().optional(),
  skipDuplicates: z.boolean().optional(),
});

export type OpmlImportData = z.infer<typeof opmlImportSchema>;

// OPML export validation
export const opmlExportSchema = z.object({
  scope: z.enum(["all", "selected"]),
  categoryIds: z.array(z.string()).optional(),
  includeSettings: z.boolean().optional(),
  includeStats: z.boolean().optional(),
});

export type OpmlExportData = z.infer<typeof opmlExportSchema>;
