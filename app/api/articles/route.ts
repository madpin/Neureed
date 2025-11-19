import { getRecentArticles } from "@/lib/services/article-service";
import { articleQuerySchema } from "@/lib/validations/article-validation";
import { createHandler } from "@/lib/api-handler";
import { getCurrentUser } from "@/lib/middleware/auth-middleware";
import { getUserFeedIds } from "@/lib/services/user-feed-service";
import { getReadArticles } from "@/lib/services/read-status-service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/articles
 * List articles with pagination and filtering
 * If user is authenticated, only shows articles from subscribed feeds and includes read status
 */
export const GET = createHandler(
  async ({ query }) => {
    const { page = 1, limit = 20, feedId, categoryId, sortBy, sortDirection } = query as any;

    // Check if user is authenticated
    const user = await getCurrentUser();
    
    // Get sort preferences from user preferences if not provided in query
    let finalSortBy: "publishedAt" | "relevance" | "title" | "feed" | "updatedAt" = (sortBy as any) || "publishedAt";
    let finalSortDirection: "asc" | "desc" = (sortDirection as any) || "desc";
    
    if (user?.id && !sortBy) {
      const userPrefs = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
        select: { articleSortOrder: true, articleSortDirection: true },
      });
      
      if (userPrefs) {
        finalSortBy = userPrefs.articleSortOrder as typeof finalSortBy;
        finalSortDirection = userPrefs.articleSortDirection as typeof finalSortDirection;
      }
    }
    
    // Get articles (filtered by feed or category if specified)
    let articles, total;
    
    if (user?.id) {
      // For authenticated users, filter by subscribed feeds
      let subscribedFeedIds = await getUserFeedIds(user.id);
      
      // If categoryId is provided, filter to only feeds in that category
      if (categoryId) {
        const categoryFeeds = await prisma.userFeedCategory.findMany({
          where: {
            userCategoryId: categoryId,
            userFeed: {
              userId: user.id,
            },
          },
          include: {
            userFeed: true,
          },
        });
        const categoryFeedIds = categoryFeeds.map((cf: { userFeed: { feedId: string } }) => cf.userFeed.feedId);
        subscribedFeedIds = subscribedFeedIds.filter((id: string) => categoryFeedIds.includes(id));
      }
      
      if (subscribedFeedIds.length === 0) {
        // User has no subscriptions or no feeds in the selected category
        return {
          articles: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      // Query articles from subscribed feeds
      const skip = (page - 1) * limit;
      
      const where = feedId
        ? { feedId, feed: { id: { in: subscribedFeedIds } } }
        : { feedId: { in: subscribedFeedIds } };

      // Build orderBy clause based on sort option
      let orderBy: any;
      
      if (finalSortBy === "relevance") {
        // For relevance sorting, we'll fetch scores and sort in memory
        // First get articles without specific ordering
        orderBy = { publishedAt: "desc" };
      } else if (finalSortBy === "title") {
        orderBy = { title: finalSortDirection };
      } else if (finalSortBy === "updatedAt") {
        orderBy = { updatedAt: finalSortDirection };
      } else if (finalSortBy === "feed") {
        orderBy = [
          { feed: { name: finalSortDirection } },
          { publishedAt: "desc" }
        ];
      } else {
        // Default to publishedAt
        orderBy = { publishedAt: finalSortDirection };
      }

      [articles, total] = await Promise.all([
        prisma.article.findMany({
          where,
          include: { feed: true },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.article.count({ where }),
      ]);

      // Add read status to articles
      const articleIds = articles.map((a) => a.id);
      const readStatuses = await getReadArticles(user.id, articleIds);
      const readMap = new Map(readStatuses.map((rs) => [rs.articleId, rs]));

      let articlesWithReadStatus = articles.map((article) => ({
        ...article,
        isRead: readMap.get(article.id)?.isRead || false,
        readAt: readMap.get(article.id)?.readAt,
      }));

      // If sorting by relevance, fetch scores and sort
      if (finalSortBy === "relevance") {
        const { scoreArticleBatch } = await import("@/lib/services/article-scoring-service");
        const scoreMap = await scoreArticleBatch(user.id, articleIds);
        
        articlesWithReadStatus = articlesWithReadStatus
          .map((article) => ({
            ...article,
            relevanceScore: scoreMap.get(article.id)?.score || 0,
          }))
          .sort((a, b) => {
            const scoreA = a.relevanceScore || 0;
            const scoreB = b.relevanceScore || 0;
            return finalSortDirection === "desc" ? scoreB - scoreA : scoreA - scoreB;
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
      // For unauthenticated users, show all articles
      const sortOptions = {
        page,
        limit,
        sortBy: finalSortBy,
        sortDirection: finalSortDirection,
      };
      
      if (feedId) {
        const { getArticlesByFeed } = await import("@/lib/services/article-service");
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
  },
  { querySchema: articleQuerySchema }
);

