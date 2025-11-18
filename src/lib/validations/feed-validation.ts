import { z } from "zod";

/**
 * Validation schemas for feed operations
 */

export const createFeedSchema = z.object({
  url: z.string().url("Invalid URL format"),
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  categoryIds: z.array(z.string()).optional(),
  fetchInterval: z.number().int().min(5).max(1440).optional(), // 5 minutes to 24 hours
});

export const updateFeedSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  siteUrl: z.string().url("Invalid URL format").optional(),
  imageUrl: z.string().url("Invalid URL format").optional(),
  fetchInterval: z.number().int().min(5).max(1440).optional(),
  categoryIds: z.array(z.string()).optional(),
});

export const validateFeedSchema = z.object({
  url: z.string().url("Invalid URL format"),
});

export const feedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20).catch(20),
  category: z.string().optional().nullable(),
  search: z.string().optional().nullable(),
});

export type CreateFeedInput = z.infer<typeof createFeedSchema>;
export type UpdateFeedInput = z.infer<typeof updateFeedSchema>;
export type ValidateFeedInput = z.infer<typeof validateFeedSchema>;
export type FeedQueryInput = z.infer<typeof feedQuerySchema>;

