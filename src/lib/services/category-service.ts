import { prisma } from "@/src/lib/db";
import type { Category } from "@prisma/client";

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<Category[]> {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          feedCategories: true,
        },
      },
    },
  });
}

/**
 * Get a category by ID
 */
export async function getCategory(id: string): Promise<Category | null> {
  return prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          feedCategories: true,
        },
      },
    },
  });
}

/**
 * Get a category by name (case-insensitive)
 */
export async function getCategoryByName(name: string): Promise<Category | null> {
  return prisma.category.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });
}

/**
 * Create a new category
 */
export async function createCategory(
  name: string,
  description?: string
): Promise<Category> {
  // Check if category already exists
  const existing = await getCategoryByName(name);
  if (existing) {
    throw new Error(`Category "${name}" already exists`);
  }

  return prisma.category.create({
    data: {
      name: name.trim(),
      description: description?.trim(),
    },
  });
}

/**
 * Find existing category by name or create a new one
 * This is useful for OPML import where we want to reuse existing categories
 */
export async function findOrCreateCategory(name: string): Promise<Category> {
  const existing = await getCategoryByName(name);
  if (existing) {
    return existing;
  }

  return createCategory(name);
}

/**
 * Update a category
 */
export async function updateCategory(
  id: string,
  data: {
    name?: string;
    description?: string;
  }
): Promise<Category> {
  // If updating name, check for duplicates
  if (data.name) {
    const existing = await getCategoryByName(data.name);
    if (existing && existing.id !== id) {
      throw new Error(`Category "${data.name}" already exists`);
    }
  }

  return prisma.category.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      description: data.description?.trim(),
    },
  });
}

/**
 * Delete a category
 * Only deletes if no feeds are using it
 */
export async function deleteCategory(id: string): Promise<void> {
  // Check if any feeds are using this category
  const feedCount = await prisma.feedCategory.count({
    where: { categoryId: id },
  });

  if (feedCount > 0) {
    throw new Error(
      `Cannot delete category: ${feedCount} feed(s) are still using it`
    );
  }

  await prisma.category.delete({
    where: { id },
  });
}

/**
 * Get categories with their feed counts
 */
export async function getCategoriesWithStats(): Promise<
  Array<Category & { feedCount: number }>
> {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          feedCategories: true,
        },
      },
    },
  });

  return categories.map((cat) => ({
    ...cat,
    feedCount: cat._count.feedCategories,
    _count: undefined as never,
  }));
}

/**
 * Get feeds in a category
 */
export async function getCategoryFeeds(categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      feedCategories: {
        include: {
          feed: true,
        },
      },
    },
  });

  if (!category) {
    return null;
  }

  return {
    ...category,
    feeds: category.feedCategories.map((fc) => fc.feed),
    feedCategories: undefined as never,
  };
}

