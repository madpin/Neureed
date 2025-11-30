import { resetFeedHealth } from "@/lib/services/feed-health-service";
import { createHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * POST /api/feeds/:id/health/reset
 * Reset feed health (clear failures and errors)
 */
export const POST = createHandler(
  async ({ params, session }) => {
    const { id } = params;

    if (!id) {
      return { error: "Feed ID is required", status: 400 };
    }

    await resetFeedHealth(id);

    return { success: true, message: "Feed health reset successfully" };
  },
  { requireAuth: true }
);
