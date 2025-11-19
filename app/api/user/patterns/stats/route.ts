import { getPatternStats } from "@/lib/services/pattern-detection-service";
import { createHandler } from "@/lib/api-handler";

/**
 * GET /api/user/patterns/stats
 * Get pattern statistics for the current user
 */
export const GET = createHandler(
  async ({ session }) => {
    const stats = await getPatternStats(session!.user!.id);

    return { stats };
  },
  { requireAuth: true }
);

