import { prisma } from "../db";
import type { User, UserPreferences } from "@prisma/client";
import type { UserWithPreferences } from "@/types/user";

/**
 * Get user by ID with preferences
 */
export async function getUserById(userId: string): Promise<UserWithPreferences | null> {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: { preferences: true },
  });
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Create a new user
 */
export async function createUser(data: {
  email: string;
  name?: string;
  image?: string;
}): Promise<User> {
  return await prisma.user.create({
    data,
  });
}

/**
 * Update user information
 */
export async function updateUser(
  userId: string,
  data: {
    name?: string;
    email?: string;
    image?: string;
  }
): Promise<User> {
  return await prisma.user.update({
    where: { id: userId },
    data,
  });
}

/**
 * Delete a user and all associated data
 */
export async function deleteUser(userId: string): Promise<void> {
  await prisma.user.delete({
    where: { id: userId },
  });
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string) {
  const [subscribedFeedsCount, readArticlesCount, totalArticlesCount] = await Promise.all([
    prisma.userFeed.count({
      where: { userId },
    }),
    prisma.readArticle.count({
      where: { userId },
    }),
    prisma.article.count({
      where: {
        feed: {
          userFeeds: {
            some: { userId },
          },
        },
      },
    }),
  ]);

  return {
    subscribedFeedsCount,
    readArticlesCount,
    totalArticlesCount,
    unreadArticlesCount: totalArticlesCount - readArticlesCount,
  };
}

