import { getUnhealthyFeeds } from "@/lib/services/feed-health-service";
import { createHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * GET /api/feeds/unhealthy
 * Get unhealthy feeds for the current user
 */
export const GET = createHandler(
  async ({ session }) => {
    const userId = session!.user.id;

    const unhealthyFeeds = await getUnhealthyFeeds(userId);

    return { data: unhealthyFeeds };
  },
  { requireAuth: true }
);
