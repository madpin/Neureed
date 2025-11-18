import { getPatternStats } from "@/src/lib/services/pattern-detection-service";
import { createHandler } from "@/src/lib/api-handler";

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

