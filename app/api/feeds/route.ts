import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
import { apiResponse, apiError } from "@/src/lib/api-response";
import { getCurrentUser } from "@/src/lib/middleware/auth-middleware";
import { subscribeFeed } from "@/src/lib/services/user-feed-service";

/**
 * GET /api/feeds
 * List all feeds with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryResult = feedQuerySchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      category: searchParams.get("category"),
      search: searchParams.get("search"),
    });

    if (!queryResult.success) {
      return apiError("Invalid query parameters", 400, queryResult.error.errors);
    }

    const { page, limit, category, search } = queryResult.data;

    // Handle search
    if (search && search.trim()) {
      const feeds = await searchFeeds(search);
      return apiResponse({
        feeds,
        total: feeds.length,
        page: 1,
        limit: feeds.length,
      });
    }

    // Handle category filter
    if (category && category.trim()) {
      const feeds = await getFeedsByCategory(category);
      return apiResponse({
        feeds,
        total: feeds.length,
        page: 1,
        limit: feeds.length,
      });
    }

    // Get all feeds with pagination
    const { feeds, total } = await getAllFeeds({ page, limit });

    return apiResponse({
      feeds,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching feeds:", error);
    return apiError(
      "Failed to fetch feeds",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * POST /api/feeds
 * Create a new feed and auto-subscribe the user if authenticated
 * If feed already exists, just subscribe the user to it
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = createFeedSchema.safeParse(body);
    if (!validationResult.success) {
      return apiError(
        "Invalid input",
        400,
        validationResult.error.errors
      );
    }

    const { url, name, categoryIds } = validationResult.data;

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
        
        return apiResponse({ 
          feed,
          articlesAdded: refreshResult.newArticles,
          refreshSuccess: refreshResult.success,
          subscribed,
          isNewFeed: true
        }, 201);
      } catch (refreshError) {
        // Feed was created but article fetch failed - still return success
        console.error("Failed to fetch articles for new feed:", refreshError);
        return apiResponse({ 
          feed,
          articlesAdded: 0,
          refreshSuccess: false,
          subscribed,
          isNewFeed: true,
          warning: "Feed created but failed to fetch articles. Try refreshing manually."
        }, 201);
      }
    } else {
      // Existing feed - just return it
      return apiResponse({ 
        feed,
        subscribed,
        isNewFeed: false,
        message: subscribed ? "Subscribed to existing feed" : "Feed already exists"
      }, 200);
    }
  } catch (error) {
    console.error("Error creating feed:", error);

    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes("Invalid") || error.message.includes("unsafe")) {
        return apiError(error.message, 400);
      }
      if (error.message.includes("unable to parse")) {
        return apiError("Invalid feed URL or unable to parse feed", 422);
      }
    }

    return apiError(
      "Failed to create feed",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

