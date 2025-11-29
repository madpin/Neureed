import { bulkUpdateFeedSettings } from "@/lib/services/bulk-operations-service";
import { createHandler } from "@/lib/api-handler";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  feedIds: z.array(z.string()).min(1),
  settings: z.object({
    refreshInterval: z.number().min(5).max(10080).optional(),
    maxArticlesPerFeed: z.number().min(10).max(10000).optional(),
    maxArticleAge: z.number().min(1).max(3650).optional(),
  }),
});

/**
 * PUT /api/feeds/bulk/settings
 * Bulk update feed settings
 */
export const PUT = createHandler(
  async ({ body, session }) => {
    const { feedIds, settings } = body;
    const userId = session!.user.id;

    const result = await bulkUpdateFeedSettings(userId, feedIds, settings);

    return { data: result };
  },
  { bodySchema, requireAuth: true }
);
