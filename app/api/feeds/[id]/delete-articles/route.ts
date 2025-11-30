import { deleteAllArticles } from "@/lib/services/feed-settings-service";
import { createHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/feeds/[id]/delete-articles
 * Delete all articles from a feed
 */
export const DELETE = createHandler(async ({ params }) => {
  const { id } = params;

  if (!id) {
    return { error: "Feed ID is required", status: 400 };
  }

  logger.info(`[API] Deleting all articles from feed ${id}`);

  const count = await deleteAllArticles(id);

  return { 
    message: `Deleted ${count} articles`,
    count 
  };
});

