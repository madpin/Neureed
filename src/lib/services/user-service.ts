import { prisma } from "../db";
import type { User, user_preferences } from "@/generated/prisma/client";
import type { UserWithPreferences } from "@/types/user";

/**
 * Get user by ID with preferences
 */
export async function getUserById(userId: string): Promise<UserWithPreferences | null> {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: { user_preferences: true },
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
    data: {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      ...data,
      updatedAt: new Date(),
    },
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
    prisma.user_feeds.count({
      where: { userId },
    }),
    prisma.read_articles.count({
      where: { userId },
    }),
    prisma.articles.count({
      where: {
        feeds: {
          user_feeds: {
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

