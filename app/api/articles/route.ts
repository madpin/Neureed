import { getRecentArticles } from "@/src/lib/services/article-service";
import { articleQuerySchema } from "@/src/lib/validations/article-validation";
import { createHandler } from "@/src/lib/api-handler";
import { getCurrentUser } from "@/src/lib/middleware/auth-middleware";
import { getUserFeedIds } from "@/src/lib/services/user-feed-service";
import { getReadArticles } from "@/src/lib/services/read-status-service";
import { prisma } from "@/src/lib/db";

/**
 * GET /api/articles
 * List articles with pagination and filtering
 * If user is authenticated, only shows articles from subscribed feeds and includes read status
 */
export const GET = createHandler(
  async ({ query }) => {
    const { page, limit, feedId, categoryId } = query;

    // Check if user is authenticated
    const user = await getCurrentUser();
    
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

      [articles, total] = await Promise.all([
        prisma.article.findMany({
          where,
          include: { feed: true },
          orderBy: { publishedAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.article.count({ where }),
      ]);

      // Add read status to articles
      const articleIds = articles.map((a) => a.id);
      const readStatuses = await getReadArticles(user.id, articleIds);
      const readMap = new Map(readStatuses.map((rs) => [rs.articleId, rs]));

      const articlesWithReadStatus = articles.map((article) => ({
        ...article,
        isRead: readMap.get(article.id)?.isRead || false,
        readAt: readMap.get(article.id)?.readAt,
      }));

      return {
        articles: articlesWithReadStatus,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } else {
      // For unauthenticated users, show all articles
      if (feedId) {
        const { getArticlesByFeed } = await import("@/src/lib/services/article-service");
        ({ articles, total } = await getArticlesByFeed(feedId, { page, limit }));
      } else {
        ({ articles, total } = await getRecentArticles({ page, limit }));
      }

      return {
        articles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
  },
  { querySchema: articleQuerySchema }
);

