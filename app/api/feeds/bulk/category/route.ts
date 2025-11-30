import { bulkUpdateFeedCategory } from "@/lib/services/bulk-operations-service";
import { createHandler } from "@/lib/api-handler";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  feedIds: z.array(z.string()).min(1),
  categoryId: z.string().nullable(),
});

/**
 * PUT /api/feeds/bulk/category
 * Bulk update feed category
 */
export const PUT = createHandler(
  async ({ body, session }) => {
    const { feedIds, categoryId } = body;
    const userId = session!.user.id;

    const result = await bulkUpdateFeedCategory(userId, feedIds, categoryId);

    return { data: result };
  },
  { bodySchema, requireAuth: true }
);
