import { getBulkFeedHealth } from "@/lib/services/feed-health-service";
import { createHandler } from "@/lib/api-handler";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  feedIds: z.array(z.string()).min(1).max(100),
});

/**
 * POST /api/feeds/bulk-health
 * Get health status for multiple feeds
 */
export const POST = createHandler(
  async ({ body }) => {
    const { feedIds } = body;

    const healthStatuses = await getBulkFeedHealth(feedIds);

    return { data: healthStatuses };
  },
  { bodySchema }
);
