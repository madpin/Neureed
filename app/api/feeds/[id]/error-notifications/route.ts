import { updateErrorNotifications } from "@/lib/services/feed-health-service";
import { createHandler } from "@/lib/api-handler";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  enabled: z.boolean(),
});

/**
 * PUT /api/feeds/:id/error-notifications
 * Enable or disable error notifications for a feed
 */
export const PUT = createHandler(
  async ({ params, body, session }) => {
    const { id } = params;
    const { enabled } = body;

    if (!id) {
      return { error: "Feed ID is required", status: 400 };
    }

    await updateErrorNotifications(id, enabled);

    return { success: true, message: "Error notifications updated successfully" };
  },
  { bodySchema, requireAuth: true }
);
