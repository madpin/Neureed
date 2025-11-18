import { createHandler } from "@/src/lib/api-handler";
import { z } from "zod";
import {
  getUserCategories,
  createUserCategory,
} from "@/src/lib/services/user-category-service";

/**
 * GET /api/user/categories
 * Get all user categories
 */
export const GET = createHandler(
  async ({ session }) => {
    const categories = await getUserCategories(session!.user!.id);
    return { categories };
  },
  { requireAuth: true }
);

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  settings: z.record(z.any()).optional(),
});

/**
 * POST /api/user/categories
 * Create a new category
 */
export const POST = createHandler(
  async ({ body, session }) => {
    const { name, description, settings } = body;

    const category = await createUserCategory(
      session!.user!.id,
      name,
      description,
      settings
    );

    return {
      category,
      message: "Category created successfully",
    };
  },
  { bodySchema: createCategorySchema, requireAuth: true }
);

