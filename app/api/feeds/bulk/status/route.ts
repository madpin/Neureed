import { enableFeed, disableFeed } from "@/lib/services/feed-health-service";
import { createHandler } from "@/lib/api-handler";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  feedIds: z.array(z.string()),
  enabled: z.boolean(),
});

/**
 * POST /api/feeds/bulk/status
 * Enable or disable multiple feeds at once
 */
export const POST = createHandler(
  async ({ body }) => {
    const { feedIds, enabled } = body;

    if (!feedIds || feedIds.length === 0) {
      return { error: "Feed IDs are required", status: 400 };
    }

    // Use Promise.allSettled to handle partial failures
    const results = await Promise.allSettled(
      feedIds.map(async (feedId) => {
        if (enabled) {
          await enableFeed(feedId);
        } else {
          await disableFeed(feedId);
        }
        return feedId;
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return {
      success: true,
      message: `${enabled ? "Enabled" : "Disabled"} ${successful} of ${feedIds.length} feeds${failed > 0 ? ` (${failed} failed)` : ""}`,
      data: {
        total: feedIds.length,
        successful,
        failed,
        results,
      },
    };
  },
  { bodySchema, requireAuth: true }
);
