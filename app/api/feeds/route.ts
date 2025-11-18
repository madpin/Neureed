import {
  getAllFeeds,
  validateAndCreateFeed,
  searchFeeds,
  getFeedsByCategory,
} from "@/src/lib/services/feed-service";
import {
  createFeedSchema,
  feedQuerySchema,
} from "@/src/lib/validations/feed-validation";
import { createHandler } from "@/src/lib/api-handler";
import { getCurrentUser } from "@/src/lib/middleware/auth-middleware";
import { subscribeFeed } from "@/src/lib/services/user-feed-service";

/**
 * GET /api/feeds
 * List all feeds with pagination and filtering
 */
export const GET = createHandler(
  async ({ query }) => {
    const { page, limit, category, search } = query;

    // Handle search
    if (search && search.trim()) {
      const feeds = await searchFeeds(search);
      return {
        feeds,
        total: feeds.length,
        page: 1,
        limit: feeds.length,
      };
    }

    // Handle category filter
    if (category && category.trim()) {
      const feeds = await getFeedsByCategory(category);
      return {
        feeds,
        total: feeds.length,
        page: 1,
        limit: feeds.length,
      };
    }

    // Get all feeds with pagination
    const { feeds, total } = await getAllFeeds({ page, limit });

    return {
      feeds,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
  { querySchema: feedQuerySchema }
);

/**
 * POST /api/feeds
 * Create a new feed and auto-subscribe the user if authenticated
 * If feed already exists, just subscribe the user to it
 */
export const POST = createHandler(
  async ({ body, session }) => {
    const { url, name, categoryIds } = body;

    let feed;
    let isNewFeed = false;

    try {
      // Try to create the feed
      feed = await validateAndCreateFeed(url, name, categoryIds);
      isNewFeed = true;
    } catch (error) {
      // If feed already exists, get it instead
      if (error instanceof Error && error.message.includes("already exists")) {
        const { getFeedByUrl } = await import("@/src/lib/services/feed-service");
        feed = await getFeedByUrl(url);
        
        if (!feed) {
          throw new Error("Feed exists but could not be retrieved");
        }
      } else {
        throw error;
      }
    }

    // Auto-subscribe user if authenticated
    const user = await getCurrentUser();
    let subscribed = false;
    
    if (user?.id) {
      try {
        // Use the custom name provided by the user, or default to feed name
        const customName = name || feed.name;
        await subscribeFeed(user.id, feed.id, customName);
        subscribed = true;
      } catch (subscribeError) {
        // Check if already subscribed
        const { isUserSubscribed } = await import("@/src/lib/services/user-feed-service");
        subscribed = await isUserSubscribed(user.id, feed.id);
        
        if (!subscribed) {
          console.error("Failed to auto-subscribe user to feed:", subscribeError);
        }
      }
    }

    // If it's a new feed, automatically fetch articles
    if (isNewFeed) {
      try {
        const { refreshFeed } = await import("@/src/lib/services/feed-refresh-service");
        const refreshResult = await refreshFeed(feed.id);
        
        return { 
          feed,
          articlesAdded: refreshResult.newArticles,
          refreshSuccess: refreshResult.success,
          subscribed,
          isNewFeed: true
        };
      } catch (refreshError) {
        // Feed was created but article fetch failed - still return success
        console.error("Failed to fetch articles for new feed:", refreshError);
        return { 
          feed,
          articlesAdded: 0,
          refreshSuccess: false,
          subscribed,
          isNewFeed: true,
          warning: "Feed created but failed to fetch articles. Try refreshing manually."
        };
      }
    } else {
      // Existing feed - just return it
      return { 
        feed,
        subscribed,
        isNewFeed: false,
        message: subscribed ? "Subscribed to existing feed" : "Feed already exists"
      };
    }
  },
  { bodySchema: createFeedSchema }
);

