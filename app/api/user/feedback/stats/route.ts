import { getFeedbackStats } from "@/lib/services/feedback-service";
import { createHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/feedback/stats
 * Get feedback statistics for the current user
 */
export const GET = createHandler(
  async ({ session }) => {
    const stats = await getFeedbackStats(session!.user!.id);

    return { stats };
  },
  { requireAuth: true }
);

