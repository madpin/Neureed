import { z } from "zod";

/**
 * Validation schemas for article operations
 */

export const articleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20).catch(20),
  feedId: z.string().optional().nullable(),
  since: z.coerce.date().optional().nullable(),
  sort: z.enum(["publishedAt", "createdAt"]).optional().default("publishedAt").catch("publishedAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc").catch("desc"),
});

export const searchArticlesSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  feedId: z.string().optional(),
});

export const recentArticlesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  hours: z.coerce.number().int().min(1).max(168).optional().default(24), // Max 1 week
});

export type ArticleQueryInput = z.infer<typeof articleQuerySchema>;
export type SearchArticlesInput = z.infer<typeof searchArticlesSchema>;
export type RecentArticlesInput = z.infer<typeof recentArticlesSchema>;

