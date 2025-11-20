import { prisma } from "../db";
import type { read_articles } from "@prisma/client";
import type { ReadArticleStatus } from "@/types/user";

/**
 * Mark an article as read
 */
export async function markAsRead(userId: string, articleId: string): Promise<read_articles> {
  return await prisma.read_articles.upsert({
    where: {
      userId_articleId: {
        userId,
        articleId,
      },
    },
    create: {
      id: `read_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      articleId,
    },
    update: {
      readAt: new Date(),
    },
  });
}

/**
 * Mark an article as unread
 */
export async function markAsUnread(userId: string, articleId: string): Promise<void> {
  await prisma.read_articles.delete({
    where: {
      userId_articleId: {
        userId,
        articleId,
      },
    },
  });
}

/**
 * Check if an article is read by a user
 */
export async function isArticleRead(userId: string, articleId: string): Promise<boolean> {
  const readArticle = await prisma.read_articles.findUnique({
    where: {
      userId_articleId: {
        userId,
        articleId,
      },
    },
  });
  return !!readArticle;
}

/**
 * Get read status for multiple articles (bulk check)
 */
export async function getReadArticles(
  userId: string,
  articleIds: string[]
): Promise<ReadArticleStatus[]> {
  const readArticles = await prisma.read_articles.findMany({
    where: {
      userId,
      articleId: { in: articleIds },
    },
  });

  const readMap = new Map(readArticles.map((ra) => [ra.articleId, ra]));

  return articleIds.map((articleId) => {
    const readArticle = readMap.get(articleId);
    return {
      articleId,
      isRead: !!readArticle,
      readAt: readArticle?.readAt,
    };
  });
}

/**
 * Get total count of read articles for a user
 */
export async function getUserReadCount(userId: string): Promise<number> {
  return await prisma.read_articles.count({
    where: { userId },
  });
}

/**
 * Get recently read articles for a user
 */
export async function getRecentlyReadArticles(
  userId: string,
  limit: number = 10
): Promise<read_articles[]> {
  return await prisma.read_articles.findMany({
    where: { userId },
    orderBy: { readAt: "desc" },
    take: limit,
    include: {
      articles: {
        include: {
          feeds: true,
        },
      },
    },
  });
}

/**
 * Mark multiple articles as read
 */
export async function markMultipleAsRead(
  userId: string,
  articleIds: string[]
): Promise<number> {
  const results = await Promise.allSettled(
    articleIds.map((articleId) => markAsRead(userId, articleId))
  );
  return results.filter((r) => r.status === "fulfilled").length;
}

