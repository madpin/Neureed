'use server';

/**
 * Server Actions for User Category operations
 *
 * These actions replace the following API routes:
 * - GET /api/user/categories
 * - POST /api/user/categories
 * - GET /api/user/categories/[categoryId]
 * - PUT /api/user/categories/[categoryId]
 * - DELETE /api/user/categories/[categoryId]
 * - POST /api/user/categories/reorder
 */

import { auth } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  getUserCategories,
  createUserCategory,
  getUserCategory,
  updateUserCategory,
  deleteUserCategory,
  reorderUserCategories,
} from '@/lib/services/user-category-service';

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500).optional().nullable(),
  settings: z.record(z.string(), z.any()).optional().nullable(),
  icon: z.string().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform(val => val ?? undefined),
  settings: z
    .record(z.string(), z.any())
    .optional()
    .nullable()
    .transform(val => val ?? undefined),
  icon: z.string().optional(),
});

const reorderSchema = z.object({
  categoryIds: z.array(z.string()).min(1),
});

type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
type ReorderInput = z.infer<typeof reorderSchema>;

/**
 * Get all user categories
 */
export async function getUserCategoriesAction() {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const categories = await getUserCategories(session.user.id);

  return { categories };
}

/**
 * Create a new category
 */
export async function createUserCategoryAction(input: CreateCategoryInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const validated = createCategorySchema.parse(input);
    const { name, description, settings, icon } = validated;

    const category = await createUserCategory(
      session.user.id,
      name,
      description ?? undefined,
      settings ?? undefined,
      icon
    );

    revalidatePath('/');
    revalidatePath('/feeds');

    return { category, message: 'Category created successfully' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Get a specific category
 */
export async function getUserCategoryAction(categoryId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!categoryId) {
    throw new Error('Category ID is required');
  }

  const category = await getUserCategory(session.user.id, categoryId);

  if (!category) {
    throw new Error('Category not found');
  }

  return { category };
}

/**
 * Update a category
 */
export async function updateUserCategoryAction(categoryId: string, input: UpdateCategoryInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!categoryId) {
    throw new Error('Category ID is required');
  }

  try {
    const validated = updateCategorySchema.parse(input);

    const category = await updateUserCategory(session.user.id, categoryId, {
      name: validated.name,
      description: validated.description ?? undefined,
      settings: validated.settings ?? undefined,
      icon: validated.icon,
    });

    revalidatePath('/');
    revalidatePath('/feeds');

    return { category, message: 'Category updated successfully' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Delete a category
 */
export async function deleteUserCategoryAction(categoryId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!categoryId) {
    throw new Error('Category ID is required');
  }

  await deleteUserCategory(session.user.id, categoryId);

  revalidatePath('/');
  revalidatePath('/feeds');

  return { message: 'Category deleted successfully' };
}

/**
 * Reorder categories based on drag-and-drop
 */
export async function reorderUserCategoriesAction(input: ReorderInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const validated = reorderSchema.parse(input);
    const { categoryIds } = validated;

    await reorderUserCategories(session.user.id, categoryIds);

    revalidatePath('/');
    revalidatePath('/feeds');

    return { message: 'Categories reordered successfully' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}
