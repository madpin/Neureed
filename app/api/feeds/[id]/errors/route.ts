import { getFeedErrorLogs, clearFeedErrorLogs } from "@/lib/services/feed-health-service";
import { createHandler } from "@/lib/api-handler";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

/**
 * GET /api/feeds/:id/errors
 * Get error logs for a feed
 */
export const GET = createHandler(
  async ({ params, query }) => {
    const { id } = params;
    const { limit } = query;

    if (!id) {
      return { error: "Feed ID is required", status: 400 };
    }

    const logs = await getFeedErrorLogs(id, limit);

    return { data: logs };
  },
  { querySchema }
);

/**
 * DELETE /api/feeds/:id/errors
 * Clear error logs for a feed
 */
export const DELETE = createHandler(
  async ({ params, session }) => {
    const { id } = params;

    if (!id) {
      return { error: "Feed ID is required", status: 400 };
    }

    await clearFeedErrorLogs(id);

    return { success: true, message: "Error logs cleared successfully" };
  },
  { requireAuth: true }
);
