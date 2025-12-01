import { enableFeed, disableFeed } from "@/lib/services/feed-health-service";
import { createHandler } from "@/lib/api-handler";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  enabled: z.boolean(),
});

/**
 * PUT /api/feeds/:id/status
 * Enable or disable a feed
 */
export const PUT = createHandler(
  async ({ params, body }) => {
    const { id } = params;
    const { enabled } = body;

    if (!id || typeof id !== "string") {
      return { error: "Feed ID is required", status: 400 };
    }

    if (enabled) {
      await enableFeed(id);
    } else {
      await disableFeed(id);
    }

    return {
      success: true,
      message: `Feed ${enabled ? "enabled" : "disabled"} successfully`,
      data: { enabled },
    };
  },
  { bodySchema, requireAuth: true }
);
