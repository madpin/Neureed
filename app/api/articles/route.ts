import { NextRequest } from "next/server";
import { getRecentArticles } from "@/src/lib/services/article-service";
import { articleQuerySchema } from "@/src/lib/validations/article-validation";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { getCurrentUser } from "@/src/lib/middleware/auth-middleware";
import { getUserFeedIds } from "@/src/lib/services/user-feed-service";
import { getReadArticles } from "@/src/lib/services/read-status-service";
import { prisma } from "@/src/lib/db";

/**
 * GET /api/articles
 * List articles with pagination and filtering
 * If user is authenticated, only shows articles from subscribed feeds and includes read status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryResult = articleQuerySchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      feedId: searchParams.get("feedId"),
      since: searchParams.get("since"),
      sort: searchParams.get("sort"),
      order: searchParams.get("order"),
    });

    if (!queryResult.success) {
      return apiError("Invalid query parameters", 400, queryResult.error.errors);
    }

    const { page, limit, feedId } = queryResult.data;

    // Check if user is authenticated
    const user = await getCurrentUser();
    
    // Get articles (filtered by feed if specified)
    let articles, total;
    
    if (user?.id) {
      // For authenticated users, filter by subscribed feeds
      const subscribedFeedIds = await getUserFeedIds(user.id);
      
      if (subscribedFeedIds.length === 0) {
        // User has no subscriptions
        return apiResponse({
          articles: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
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

      return apiResponse({
        articles: articlesWithReadStatus,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } else {
      // For unauthenticated users, show all articles
      if (feedId) {
        const { getArticlesByFeed } = await import("@/src/lib/services/article-service");
        ({ articles, total } = await getArticlesByFeed(feedId, { page, limit }));
      } else {
        ({ articles, total } = await getRecentArticles({ page, limit }));
      }

      return apiResponse({
        articles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  } catch (error) {
    console.error("Error fetching articles:", error);
    return apiError(
      "Failed to fetch articles",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

