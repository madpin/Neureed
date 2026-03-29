'use server';

/**
 * Server Actions for Article operations
 *
 * These actions replace the following API routes:
 * - GET /api/articles
 * - GET /api/articles/[id]
 * - DELETE /api/articles/[id]
 * - GET /api/articles/recent
 * - GET /api/articles/search
 * - POST /api/articles/semantic-search
 * - GET /api/articles/suggestions
 * - GET /api/articles/[id]/related
 * - GET /api/articles/[id]/summary
 */

import { auth } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  getArticle,
  deleteArticle,
  getRecentArticles,
  getArticlesByFeed,
  searchArticles,
} from '@/lib/services/article-service';
import { getUserFeedIds } from '@/lib/services/user-feed-service';
import { getReadArticles } from '@/lib/services/read-status-service';
import { searchSimilarArticles, findRelatedArticles, getSearchSuggestions } from '@/lib/services/semantic-search-service';
import { summarizeArticle } from '@/lib/services/summarization-service';
import { prisma } from '@/lib/db';

// Validation schemas
const articleQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  feedId: z.string().optional(),
  categoryId: z.string().optional(),
  sortBy: z.enum(['publishedAt', 'relevance', 'title', 'feed', 'updatedAt']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
});

const semanticSearchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().int().positive().max(50).optional().default(10),
  minScore: z.number().min(0).max(1).optional().default(0.7),
  useRecencyBoost: z.boolean().optional().default(true),
});

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

const suggestionsSchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters'),
  limit: z.number().int().positive().max(20).optional().default(5),
});

type ArticleQueryInput = z.infer<typeof articleQuerySchema>;
type SemanticSearchInput = z.infer<typeof semanticSearchSchema>;
type SearchQueryInput = z.infer<typeof searchQuerySchema>;
type SuggestionsInput = z.infer<typeof suggestionsSchema>;

/**
 * Get paginated list of articles
 * For authenticated users, filters by subscribed feeds and includes read status
 */
export async function getArticlesAction(input: ArticleQueryInput) {
  try {
    const validated = articleQuerySchema.parse(input);
    const { page, limit, feedId, categoryId, sortBy, sortDirection } = validated;

    const session = await auth();
    const userId = session?.user?.id;

    // Get sort preferences from user preferences if not provided
    let finalSortBy = sortBy || 'publishedAt';
    let finalSortDirection = sortDirection || 'desc';

    if (userId && !sortBy) {
      const userPrefs = await prisma.user_preferences.findUnique({
        where: { userId },
        select: { articleSortOrder: true, articleSortDirection: true },
      });

      if (userPrefs) {
        finalSortBy = userPrefs.articleSortOrder as typeof finalSortBy;
        finalSortDirection = userPrefs.articleSortDirection as typeof finalSortDirection;
      }
    }

    let articles, total;

    if (userId) {
      // For authenticated users, filter by subscribed feeds
      let subscribedFeedIds = await getUserFeedIds(userId);

      // If categoryId is provided, filter to only feeds in that category
      if (categoryId) {
        const categoryFeeds = await prisma.user_feed_categories.findMany({
          where: {
            userCategoryId: categoryId,
            user_feeds: { userId },
          },
          include: { user_feeds: true },
        });
        const categoryFeedIds = categoryFeeds.map(cf => cf.user_feeds.feedId);
        subscribedFeedIds = subscribedFeedIds.filter(id => categoryFeedIds.includes(id));
      }

      if (subscribedFeedIds.length === 0) {
        return {
          articles: [],
          pagination: { page, limit, total: 0, totalPages: 0, hasMore: false },
        };
      }

      // Query articles from subscribed feeds
      const skip = (page - 1) * limit;
      const where = feedId
        ? { feedId, feeds: { id: { in: subscribedFeedIds } } }
        : { feedId: { in: subscribedFeedIds } };

      // Build orderBy clause
      let orderBy: any;
      if (finalSortBy === 'relevance') {
        orderBy = [
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ];
      } else if (finalSortBy === 'title') {
        orderBy = { title: finalSortDirection };
      } else if (finalSortBy === 'updatedAt') {
        orderBy = { updatedAt: finalSortDirection };
      } else if (finalSortBy === 'feed') {
        orderBy = [
          { feeds: { name: finalSortDirection } },
          { publishedAt: finalSortDirection },
          { createdAt: finalSortDirection },
        ];
      } else {
        orderBy = [
          { publishedAt: finalSortDirection },
          { createdAt: finalSortDirection },
        ];
      }

      [articles, total] = await Promise.all([
        prisma.articles.findMany({
          where,
          include: { feeds: true },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.articles.count({ where }),
      ]);

      // Add read status
      const articleIds = articles.map(a => a.id);
      const readStatuses = await getReadArticles(userId, articleIds);
      const readMap = new Map(readStatuses.map(rs => [rs.articleId, rs]));

      let articlesWithReadStatus = articles.map(article => ({
        ...article,
        isRead: readMap.get(article.id)?.isRead || false,
        readAt: readMap.get(article.id)?.readAt,
      }));

      // Sort by relevance if needed
      if (finalSortBy === 'relevance') {
        const { scoreArticleBatch } = await import('@/lib/services/article-scoring-service');
        const scoreMap = await scoreArticleBatch(userId, articleIds);

        articlesWithReadStatus = articlesWithReadStatus
          .map(article => ({
            ...article,
            relevanceScore: scoreMap.get(article.id)?.score || 0,
          }))
          .sort((a, b) => {
            const scoreA = a.relevanceScore || 0;
            const scoreB = b.relevanceScore || 0;
            return finalSortDirection === 'desc' ? scoreB - scoreA : scoreA - scoreB;
          });
      }

      return {
        articles: articlesWithReadStatus,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page < Math.ceil(total / limit),
        },
      };
    } else {
      // For unauthenticated users
      const sortOptions = { page, limit, sortBy: finalSortBy, sortDirection: finalSortDirection };

      if (feedId) {
        ({ articles, total } = await getArticlesByFeed(feedId, sortOptions));
      } else {
        ({ articles, total } = await getRecentArticles(sortOptions));
      }

      return {
        articles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page < Math.ceil(total / limit),
        },
      };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Get a single article by ID
 */
export async function getArticleAction(id: string) {
  if (!id) {
    throw new Error('Article ID is required');
  }

  const article = await getArticle(id);

  if (!article) {
    throw new Error('Article not found');
  }

  return { article };
}

/**
 * Delete an article
 * Requires authentication (admin only in production)
 */
export async function deleteArticleAction(id: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!id) {
    throw new Error('Article ID is required');
  }

  const article = await getArticle(id);
  if (!article) {
    throw new Error('Article not found');
  }

  await deleteArticle(id);

  revalidatePath('/');
  revalidatePath(`/articles/${id}`);

  return { success: true };
}

/**
 * Search articles with text query
 */
export async function searchArticlesAction(input: SearchQueryInput) {
  try {
    const validated = searchQuerySchema.parse(input);
    const { q, page, limit } = validated;

    const session = await auth();
    const userId = session?.user?.id;

    // searchArticles takes query string as first param
    const results = await searchArticles(q, { page, limit, userId });

    return results;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Semantic search using vector embeddings
 */
export async function semanticSearchAction(input: SemanticSearchInput) {
  try {
    const validated = semanticSearchSchema.parse(input);
    const { query, limit, minScore, useRecencyBoost } = validated;

    const session = await auth();
    const userId = session?.user?.id;

    const results = await searchSimilarArticles(query, {
      limit,
      minScore,
      recencyWeight: useRecencyBoost ? 0.3 : 0,
    });

    return { results };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Get search suggestions based on query
 */
export async function getSearchSuggestionsAction(input: SuggestionsInput) {
  try {
    const validated = suggestionsSchema.parse(input);
    const { q, limit } = validated;

    const suggestions = await getSearchSuggestions(q, limit);

    return {
      query: q,
      suggestions,
      count: suggestions.length,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Get related articles for a given article
 */
export async function getRelatedArticlesAction(articleId: string, limit = 5) {
  if (!articleId) {
    throw new Error('Article ID is required');
  }

  const related = await findRelatedArticles(articleId, { limit });

  return { related };
}

/**
 * Generate article summary
 */
export async function generateArticleSummaryAction(articleId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!articleId) {
    throw new Error('Article ID is required');
  }

  const summary = await summarizeArticle(articleId, {
    userId: session.user.id,
  });

  return { summary };
}
