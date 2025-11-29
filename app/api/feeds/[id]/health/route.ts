import { getFeedHealth } from "@/lib/services/feed-health-service";
import { createHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * GET /api/feeds/:id/health
 * Get health status for a specific feed
 */
export const GET = createHandler(async ({ params }) => {
  const { id } = params;

  if (!id) {
    return { error: "Feed ID is required", status: 400 };
  }

  const health = await getFeedHealth(id);

  if (!health) {
    return { error: "Feed not found", status: 404 };
  }

  return { data: health };
});
