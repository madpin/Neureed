import { bulkUpdateFeedTags } from "@/lib/services/bulk-operations-service";
import { createHandler } from "@/lib/api-handler";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  feedIds: z.array(z.string()).min(1),
  action: z.enum(["add", "remove", "replace"]),
  tags: z.array(z.string()),
});

/**
 * PUT /api/feeds/bulk/tags
 * Bulk update feed tags
 */
export const PUT = createHandler(
  async ({ body, session }) => {
    const { feedIds, action, tags } = body;
    const userId = session!.user.id;

    const result = await bulkUpdateFeedTags(userId, feedIds, action, tags);

    return { data: result };
  },
  { bodySchema, requireAuth: true }
);
