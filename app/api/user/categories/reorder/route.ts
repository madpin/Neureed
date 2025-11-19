import { createHandler } from "@/lib/api-handler";
import { z } from "zod";
import { reorderUserCategories } from "@/lib/services/user-category-service";

const reorderSchema = z.object({
  categoryIds: z.array(z.string()).min(1),
});

/**
 * POST /api/user/categories/reorder
 * Reorder categories based on drag-and-drop
 */
export const POST = createHandler(
  async ({ body, session }) => {
    const { categoryIds } = body;

    await reorderUserCategories(session!.user!.id, categoryIds);

    return {
      message: "Categories reordered successfully",
    };
  },
  { bodySchema: reorderSchema, requireAuth: true }
);

