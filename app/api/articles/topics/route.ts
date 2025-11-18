/**
 * Topics API
 * GET /api/articles/topics - Get all topics (topic cloud)
 * GET /api/articles/topics?topic=xyz - Get articles by topic
 */

import {
  getAllTopics,
  getArticlesByTopic,
} from "@/src/lib/services/summarization-service";
import { createHandler } from "@/src/lib/api-handler";

/**
 * GET /api/articles/topics
 * Get topics or articles by topic
 */
export const GET = createHandler(async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (topic) {
    // Get articles by topic
    const articles = await getArticlesByTopic(topic, limit);
    return { topic, articles };
  } else {
    // Get all topics
    const topics = await getAllTopics(limit);
    return { topics };
  }
});

