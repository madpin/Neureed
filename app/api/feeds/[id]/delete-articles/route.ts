import { deleteAllArticles } from "@/src/lib/services/feed-settings-service";
import { createHandler } from "@/src/lib/api-handler";
import { logger } from "@/src/lib/logger";

/**
 * DELETE /api/feeds/[id]/delete-articles
 * Delete all articles from a feed
 */
export const DELETE = createHandler(async ({ params }) => {
  const { id } = params;
  
  logger.info(`[API] Deleting all articles from feed ${id}`);

  const count = await deleteAllArticles(id);

  return { 
    message: `Deleted ${count} articles`,
    count 
  };
});

