import { createHandler } from "@/lib/api-handler";
import { z } from "zod";
import {
  getUserCategory,
  updateUserCategory,
  deleteUserCategory,
} from "@/lib/services/user-category-service";

/**
 * GET /api/user/categories/:categoryId
 * Get a specific category
 */
export const GET = createHandler(
  async ({ params, session }) => {
    const { categoryId } = params;

    const category = await getUserCategory(session!.user!.id, categoryId);

    if (!category) {
      return {
        error: "Category not found",
        status: 404,
      };
    }

    return { category };
  },
  { requireAuth: true }
);

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable().transform(val => val ?? undefined),
  settings: z.record(z.any()).optional().nullable().transform(val => val ?? undefined),
  icon: z.string().optional(),
});

/**
 * PUT /api/user/categories/:categoryId
 * Update a category
 */
export const PUT = createHandler(
  async ({ params, body, session }) => {
    const { categoryId } = params;

    const category = await updateUserCategory(
      session!.user!.id,
      categoryId,
      {
        name: body.name,
        description: body.description ?? undefined,
        settings: body.settings ?? undefined,
        icon: body.icon,
      }
    );

    return {
      category,
      message: "Category updated successfully",
    };
  },
  { bodySchema: updateCategorySchema, requireAuth: true }
);

/**
 * DELETE /api/user/categories/:categoryId
 * Delete a category
 */
export const DELETE = createHandler(
  async ({ params, session }) => {
    const { categoryId } = params;

    await deleteUserCategory(session!.user!.id, categoryId);

    return {
      message: "Category deleted successfully",
    };
  },
  { requireAuth: true }
);

