import { z } from "zod";
import {
  cleanupOldArticles,
  getCleanupStats,
} from "@/lib/services/article-cleanup-service";
import { createHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * Request schema
 */
const cleanupSchema = z.object({
  maxAge: z.number().int().min(1).max(365).optional().default(90),
  maxArticlesPerFeed: z.number().int().min(10).max(10000).optional().default(1000),
  dryRun: z.boolean().optional().default(false),
});

/**
 * POST /api/admin/cleanup
 * Manually trigger article cleanup
 */
export const POST = createHandler(
  async ({ body }) => {
    const { maxAge, maxArticlesPerFeed, dryRun } = body;

    // Execute cleanup
    const result = await cleanupOldArticles({
      maxAge,
      maxArticlesPerFeed,
      preserveStarred: true,
      dryRun,
    });

    return {
      success: true,
      deleted: result.deleted,
      preserved: result.preserved,
      dryRun: result.dryRun,
      details: result.details,
    };
  },
  { bodySchema: cleanupSchema, requireAdmin: true }
);

/**
 * GET /api/admin/cleanup
 * Get cleanup statistics
 */
export const GET = createHandler(
  async () => {
    const stats = await getCleanupStats();
    return { stats };
  },
  { requireAdmin: true }
);

