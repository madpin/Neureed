import { getArticle, deleteArticle } from "@/src/lib/services/article-service";
import { createHandler } from "@/src/lib/api-handler";

/**
 * GET /api/articles/:id
 * Get a single article with feed information
 */
export const GET = createHandler(async ({ params }) => {
  const { id } = params;

  const article = await getArticle(id);

  if (!article) {
    throw new Error("Article not found");
  }

  return { article };
});

/**
 * DELETE /api/articles/:id
 * Delete an article
 */
export const DELETE = createHandler(async ({ params }) => {
  const { id } = params;

  // Check if article exists
  const article = await getArticle(id);
  if (!article) {
    throw new Error("Article not found");
  }

  // Delete article
  await deleteArticle(id);

  return { success: true };
});

