import { NextRequest } from "next/server";
import { getArticle, deleteArticle } from "@/src/lib/services/article-service";
import { apiResponse, apiError } from "@/src/lib/api-response";

/**
 * GET /api/articles/:id
 * Get a single article with feed information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const article = await getArticle(id);

    if (!article) {
      return apiError("Article not found", 404);
    }

    return apiResponse({ article });
  } catch (error) {
    console.error("Error fetching article:", error);
    return apiError(
      "Failed to fetch article",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * DELETE /api/articles/:id
 * Delete an article
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if article exists
    const article = await getArticle(id);
    if (!article) {
      return apiError("Article not found", 404);
    }

    // Delete article
    await deleteArticle(id);

    return apiResponse({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return apiError(
      "Failed to delete article",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

