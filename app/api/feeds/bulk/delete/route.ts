import { bulkDeleteFeeds } from "@/lib/services/bulk-operations-service";
import { createHandler } from "@/lib/api-handler";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  feedIds: z.array(z.string()).min(1),
});

/**
 * DELETE /api/feeds/bulk/delete
 * Bulk delete feeds
 */
export const DELETE = createHandler(
  async ({ body, session }) => {
    const { feedIds } = body;
    const userId = session!.user.id;

    const result = await bulkDeleteFeeds(userId, feedIds);

    return { data: result };
  },
  { bodySchema, requireAuth: true }
);
