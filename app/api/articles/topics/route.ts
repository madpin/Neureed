/**
 * Topics API
 * GET /api/articles/topics - Get all topics (topic cloud)
 * GET /api/articles/topics?topic=xyz - Get articles by topic
 */

import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/src/lib/api-response";
import {
  getAllTopics,
  getArticlesByTopic,
} from "@/src/lib/services/summarization-service";

/**
 * GET /api/articles/topics
 * Get topics or articles by topic
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (topic) {
      // Get articles by topic
      const articles = await getArticlesByTopic(topic, limit);
      return apiResponse({ topic, articles });
    } else {
      // Get all topics
      const topics = await getAllTopics(limit);
      return apiResponse({ topics });
    }
  } catch (error) {
    console.error("Error fetching topics:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch topics",
      500
    );
  }
}

