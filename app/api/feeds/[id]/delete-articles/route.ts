import { NextRequest } from "next/server";
import { deleteAllArticles } from "@/src/lib/services/feed-settings-service";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { logger } from "@/src/lib/logger";

/**
 * DELETE /api/feeds/[id]/delete-articles
 * Delete all articles from a feed
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    logger.info(`[API] Deleting all articles from feed ${id}`);

    const count = await deleteAllArticles(id);

    return apiResponse({ 
      message: `Deleted ${count} articles`,
      count 
    }, 200);
  } catch (error) {
    logger.error(`[API] Failed to delete articles: ${error}`);
    return apiError(
      error instanceof Error ? error.message : "Failed to delete articles",
      500
    );
  }
}

