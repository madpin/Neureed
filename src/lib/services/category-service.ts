import { prisma } from "@/lib/db";
import type { categories } from "@prisma/client";

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<categories[]> {
  return prisma.categories.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          feed_categories: true,
        },
      },
    },
  });
}

/**
 * Get a category by ID
 */
export async function getCategory(id: string): Promise<categories | null> {
  return prisma.categories.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          feed_categories: true,
        },
      },
    },
  });
}

/**
 * Get a category by name (case-insensitive)
 */
export async function getCategoryByName(name: string): Promise<categories | null> {
  return prisma.categories.findFirst({
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
): Promise<categories> {
  // Check if category already exists
  const existing = await getCategoryByName(name);
  if (existing) {
    throw new Error(`Category "${name}" already exists`);
  }

  return prisma.categories.create({
    data: {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: name.trim(),
      description: description?.trim(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Find existing category by name or create a new one
 * This is useful for OPML import where we want to reuse existing categories
 */
export async function findOrCreateCategory(name: string): Promise<categories> {
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
): Promise<categories> {
  // If updating name, check for duplicates
  if (data.name) {
    const existing = await getCategoryByName(data.name);
    if (existing && existing.id !== id) {
      throw new Error(`Category "${data.name}" already exists`);
    }
  }

  return prisma.categories.update({
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
  const feedCount = await prisma.feed_categories.count({
    where: { categoryId: id },
  });

  if (feedCount > 0) {
    throw new Error(
      `Cannot delete category: ${feedCount} feed(s) are still using it`
    );
  }

  await prisma.categories.delete({
    where: { id },
  });
}

/**
 * Get categories with their feed counts
 */
export async function getCategoriesWithStats(): Promise<
  Array<categories & { feedCount: number }>
> {
  const categories = await prisma.categories.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          feed_categories: true,
        },
      },
    },
  });

  return categories.map((cat) => ({
    ...cat,
    feedCount: cat._count.feed_categories,
    _count: undefined as never,
  }));
}

/**
 * Get feeds in a category
 */
export async function getCategoryFeeds(categoryId: string) {
  const category = await prisma.categories.findUnique({
    where: { id: categoryId },
    include: {
      feed_categories: {
        include: {
          feeds: true,
        },
      },
    },
  });

  if (!category) {
    return null;
  }

  return {
    ...category,
    feeds: category.feed_categories.map((fc) => fc.feeds),
    feed_categories: undefined as never,
  };
}

