/**
 * Manual Article Summarization API
 * POST /api/user/articles/summarize
 */

import { createHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { z } from "zod";
import {
  getArticlesNeedingSummarization,
  estimateSummarizationCosts,
} from "@/lib/services/article-summarization-service";
import { shouldAutoGenerateSummaries } from "@/lib/services/admin-settings-service";
import { batchSummarizeArticlesWithTracking } from "@/lib/services/summarization-service";

export const dynamic = "force-dynamic";

/**
 * Schema for summarization request
 */
const summarizeRequestSchema = z.object({
  feedId: z.string().optional(),
  articleIds: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

/**
 * Schema for GET query parameters
 */
const getSummarizeQuerySchema = z.object({
  feedId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

/**
 * GET /api/user/articles/summarize
 * Get pending articles that need summarization
 */
export const GET = createHandler(
  async ({ session, query }) => {
    const userId = session!.user.id;
    const feedId = query.feedId;
    const limit = query.limit || 50;

    logger.info("[API] Getting articles needing summarization", {
      userId,
      feedId,
      limit,
    });

    // Check if admin has enabled summarization
    const systemEnabled = await shouldAutoGenerateSummaries();
    if (!systemEnabled) {
      return {
        data: {
          articles: [],
          totalCount: 0,
          systemEnabled: false,
        },
        message: "Summarization is disabled system-wide",
      };
    }

    const result = await getArticlesNeedingSummarization(userId, {
      feedId,
      limit,
    });

    const costEstimate = await estimateSummarizationCosts(userId, feedId);

    return {
      data: {
        articles: result.articles,
        totalCount: result.totalCount,
        systemEnabled,
        costEstimate,
      },
    };
  },
  { requireAuth: true, querySchema: getSummarizeQuerySchema }
);

/**
 * POST /api/user/articles/summarize
 * Manually trigger summarization for specific articles
 */
export const POST = createHandler(
  async ({ session, body }) => {
    const userId = session!.user.id;
    const { feedId, articleIds, limit } = body as {
      feedId?: string;
      articleIds?: string[];
      limit?: number;
    };

    logger.info("[API] Manual summarization triggered", {
      userId,
      feedId,
      articleIdsCount: articleIds?.length,
      limit,
    });

    // Check if admin has enabled summarization
    const systemEnabled = await shouldAutoGenerateSummaries();
    if (!systemEnabled) {
      return {
        error: "Summarization is disabled system-wide",
        status: 403,
      };
    }

    // Get articles to summarize
    let targetArticleIds: string[] = [];

    if (articleIds && articleIds.length > 0) {
      // Use specific article IDs provided
      targetArticleIds = articleIds;
    } else {
      // Get pending articles
      const { articles } = await getArticlesNeedingSummarization(userId, {
        feedId,
        limit: limit || 10,
      });
      targetArticleIds = articles.map((a) => a.id);
    }

    if (targetArticleIds.length === 0) {
      return {
        data: {
          success: 0,
          failed: 0,
          message: "No articles need summarization",
        },
      };
    }

    logger.info("[API] Summarizing articles", {
      userId,
      count: targetArticleIds.length,
    });

    // Process summarization
    const result = await batchSummarizeArticlesWithTracking(targetArticleIds, {
      userId,
      includeKeyPoints: true,
      includeTopics: true,
    });

    // Create notification
    if (result.success > 0 || result.failed > 0) {
      try {
        const { createNotification } = await import(
          "@/lib/services/notification-service"
        );

        const parts = [];
        if (result.success > 0) {
          parts.push(
            `${result.success} article${result.success > 1 ? "s" : ""} summarized`
          );
        }
        if (result.failed > 0) {
          parts.push(`${result.failed} failed`);
        }

        await createNotification({
          userId,
          type: result.failed > 0 ? "warning" : "success",
          title: "Manual Summarization Complete",
          message: parts.join(", "),
          metadata: {
            manual: true,
            ...result,
          },
        });
      } catch (error) {
        logger.error("Failed to create notification", { error });
      }
    }

    return {
      data: {
        success: result.success,
        failed: result.failed,
        totalTokens: result.totalTokens,
        errors: result.errors.slice(0, 5), // Limit error details
      },
      message: `Summarized ${result.success} article${result.success !== 1 ? "s" : ""}${result.failed > 0 ? `, ${result.failed} failed` : ""}`,
    };
  },
  {
    requireAuth: true,
    bodySchema: summarizeRequestSchema,
  }
);
