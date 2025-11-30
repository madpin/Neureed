import { bulkRefreshFeeds } from "@/lib/services/bulk-operations-service";
import { createHandler } from "@/lib/api-handler";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  feedIds: z.array(z.string()).min(1),
});

/**
 * POST /api/feeds/bulk/refresh
 * Bulk refresh feeds
 */
export const POST = createHandler(
  async ({ body, session }) => {
    const { feedIds } = body;
    const userId = session!.user.id;

    const result = await bulkRefreshFeeds(userId, feedIds);

    return { data: result };
  },
  { bodySchema, requireAuth: true }
);
