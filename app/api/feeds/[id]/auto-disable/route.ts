import { updateAutoDisableThreshold } from "@/lib/services/feed-health-service";
import { createHandler } from "@/lib/api-handler";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  threshold: z.number().min(1).max(100),
});

/**
 * PUT /api/feeds/:id/auto-disable
 * Update auto-disable threshold for a feed
 */
export const PUT = createHandler(
  async ({ params, body, session }) => {
    const { id } = params;
    const { threshold } = body;

    if (!id) {
      return { error: "Feed ID is required", status: 400 };
    }

    await updateAutoDisableThreshold(id, threshold);

    return { success: true, message: "Auto-disable threshold updated successfully" };
  },
  { bodySchema, requireAuth: true }
);
