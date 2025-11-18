import { prisma } from "@/src/lib/db";
import { generateContentHash } from "@/src/lib/feed-parser";
import {
  findDuplicateArticle,
  shouldUpdateArticle,
  deduplicateParsedArticles,
} from "./article-deduplication";
import type { Article, Prisma } from "@prisma/client";
import type { ParsedArticle } from "@/src/lib/feed-parser";

/**
 * Input types for article operations
 */
export interface CreateArticleInput {
  feedId: string;
  title: string;
  content: string;
  url: string;
  guid?: string;
  author?: string;
  excerpt?: string;
  imageUrl?: string;
  publishedAt?: Date;
}

export interface UpdateArticleInput {
  title?: string;
  content?: string;
  excerpt?: string;
  imageUrl?: string;
  author?: string;
  publishedAt?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface SearchOptions extends PaginationOptions {
  feedId?: string;
  since?: Date;
  sort?: "publishedAt" | "createdAt";
  order?: "asc" | "desc";
}

export interface UpsertResult {
  created: number;
  updated: number;
  skipped: number;
  articleIds: string[]; // IDs of newly created articles
}

/**
 * Upsert multiple articles with deduplication
 */
export async function upsertArticles(
  feedId: string,
  articles: ParsedArticle[]
): Promise<UpsertResult> {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const articleIds: string[] = [];

  // Deduplicate within the batch first
  const uniqueArticles = deduplicateParsedArticles(articles);

  for (const article of uniqueArticles) {
    try {
      // Skip articles without valid URLs
      if (!article.link || article.link.trim() === '') {
        console.log(`Skipping article without URL: ${article.title}`);
        skipped++;
        continue;
      }

      // Check for duplicates
      const existing = await findDuplicateArticle(article, feedId);

      if (existing) {
        // Check if we should update
        const shouldUpdate = await shouldUpdateArticle(existing, article);
        
        if (shouldUpdate) {
          console.log(`[ArticleService] Updating existing article: ${article.title} (content length: ${article.content?.length || 0})`);
          await updateArticle(existing.id, {
            title: article.title,
            content: article.content,
            excerpt: article.excerpt,
            imageUrl: article.imageUrl,
            author: article.author,
            publishedAt: article.publishedAt,
          });
          updated++;
        } else {
          console.log(`[ArticleService] Skipping unchanged article: ${article.title}`);
          skipped++;
        }
      } else {
        // Create new article
        try {
          console.log(`[ArticleService] Creating new article: ${article.title} (content length: ${article.content?.length || 0})`);
          const newArticle = await createArticle({
            feedId,
            title: article.title,
            content: article.content,
            url: article.link,
            guid: article.guid,
            author: article.author,
            excerpt: article.excerpt,
            imageUrl: article.imageUrl,
            publishedAt: article.publishedAt,
          });
          articleIds.push(newArticle.id);
          created++;
        } catch (createError: any) {
          // Handle unique constraint violation (article already exists)
          if (createError.code === 'P2002') {
            // Article already exists (race condition or duplicate URL)
            console.log(`Article already exists, skipping: ${article.title}`);
            skipped++;
          } else {
            throw createError;
          }
        }
      }
    } catch (error) {
      console.error(`Error upserting article: ${article.title}`, error);
      skipped++;
    }
  }

  return { created, updated, skipped, articleIds };
}

/**
 * Create a new article
 */
export async function createArticle(
  data: CreateArticleInput
): Promise<Article> {
  const contentHash = generateContentHash(data.content);

  return prisma.article.create({
    data: {
      feedId: data.feedId,
      title: data.title,
      content: data.content,
      url: data.url,
      guid: data.guid,
      author: data.author,
      excerpt: data.excerpt,
      imageUrl: data.imageUrl,
      contentHash,
      publishedAt: data.publishedAt,
    },
  });
}

/**
 * Get a single article by ID
 */
export async function getArticle(id: string) {
  return prisma.article.findUnique({
    where: { id },
    include: {
      feed: true,
    },
  });
}

/**
 * Get articles by feed with pagination
 */
export async function getArticlesByFeed(
  feedId: string,
  options: PaginationOptions = {}
): Promise<{ articles: Article[]; total: number }> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { feedId },
      skip,
      take: limit,
      orderBy: { publishedAt: "desc" },
      include: {
        feed: true,
      },
    }),
    prisma.article.count({
      where: { feedId },
    }),
  ]);

  return { articles, total };
}

/**
 * Get recent articles across all feeds
 */
export async function getRecentArticles(
  options: PaginationOptions = {}
): Promise<{ articles: Article[]; total: number }> {
  const page = options.page || 1;
  const limit = options.limit || 50;
  const skip = (page - 1) * limit;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      skip,
      take: limit,
      orderBy: { publishedAt: "desc" },
      include: {
        feed: true,
      },
    }),
    prisma.article.count(),
  ]);

  return { articles, total };
}

/**
 * Search articles by title or content
 */
export async function searchArticles(
  query: string,
  options: SearchOptions = {}
): Promise<{ articles: Article[]; total: number }> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;
  const sort = options.sort || "publishedAt";
  const order = options.order || "desc";

  const where: Prisma.ArticleWhereInput = {
    OR: [
      { title: { contains: query, mode: "insensitive" } },
      { content: { contains: query, mode: "insensitive" } },
      { excerpt: { contains: query, mode: "insensitive" } },
    ],
  };

  if (options.feedId) {
    where.feedId = options.feedId;
  }

  if (options.since) {
    where.publishedAt = { gte: options.since };
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort]: order },
      include: {
        feed: true,
      },
    }),
    prisma.article.count({ where }),
  ]);

  return { articles, total };
}

/**
 * Update an article
 */
export async function updateArticle(
  id: string,
  data: UpdateArticleInput
): Promise<Article> {
  const updateData: Prisma.ArticleUpdateInput = {
    ...data,
  };

  // Recalculate content hash if content changed
  if (data.content) {
    updateData.contentHash = generateContentHash(data.content);
  }

  return prisma.article.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Mark article as updated (when content changes)
 */
export async function markArticleAsUpdated(
  guid: string,
  newContent: string
): Promise<void> {
  const contentHash = generateContentHash(newContent);

  await prisma.article.updateMany({
    where: { guid },
    data: {
      content: newContent,
      contentHash,
      updatedAt: new Date(),
    },
  });
}

/**
 * Delete an article
 */
export async function deleteArticle(id: string): Promise<void> {
  await prisma.article.delete({
    where: { id },
  });
}

/**
 * Delete old articles before a certain date
 */
export async function deleteOldArticles(beforeDate: Date): Promise<number> {
  const result = await prisma.article.deleteMany({
    where: {
      createdAt: {
        lt: beforeDate,
      },
    },
  });

  return result.count;
}

/**
 * Delete all articles from a feed
 */
export async function deleteArticlesByFeed(feedId: string): Promise<number> {
  const result = await prisma.article.deleteMany({
    where: { feedId },
  });

  return result.count;
}

/**
 * Get article count by feed
 */
export async function getArticleCountByFeed(feedId: string): Promise<number> {
  return prisma.article.count({
    where: { feedId },
  });
}

/**
 * Get total article count
 */
export async function getTotalArticleCount(): Promise<number> {
  return prisma.article.count();
}

/**
 * Get articles published in a time range
 */
export async function getArticlesByDateRange(
  startDate: Date,
  endDate: Date,
  options: PaginationOptions = {}
): Promise<{ articles: Article[]; total: number }> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.ArticleWhereInput = {
    publishedAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take: limit,
      orderBy: { publishedAt: "desc" },
      include: {
        feed: true,
      },
    }),
    prisma.article.count({ where }),
  ]);

  return { articles, total };
}

