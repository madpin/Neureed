import { createHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { z } from "zod";
import {
  getEffectiveFeedSettings,
  validateFeedSettings,
  type SummarizationSettings,
} from "@/lib/services/feed-settings-cascade";
import { shouldAutoGenerateSummaries } from "@/lib/services/admin-settings-service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Schema for updating summarization settings
 */
const summarizationSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  minContentLength: z.number().int().min(100).max(100000).optional(),
  includeKeyPoints: z.boolean().optional(),
  includeTopics: z.boolean().optional(),
});

/**
 * GET /api/feeds/[id]/summarization
 * Get effective summarization settings for a feed (with cascade)
 */
export const GET = createHandler(
  async ({ params, session }) => {
    const { id: feedId } = params;
    const userId = session!.user.id;

    logger.info(`[API] Getting summarization settings for feed ${feedId}`, {
      userId,
    });

    // Check if user is subscribed to this feed
    const userFeed = await prisma.user_feeds.findUnique({
      where: {
        userId_feedId: {
          userId,
          feedId,
        },
      },
      include: {
        feeds: true,
      },
    });

    if (!userFeed) {
      return {
        error: "Feed not found or you are not subscribed to it",
        status: 404,
      };
    }

    // Check if admin has enabled summarization system-wide
    const systemEnabled = await shouldAutoGenerateSummaries();

    // Get effective settings with cascade
    const effectiveSettings = await getEffectiveFeedSettings(userId, feedId);

    return {
      data: {
        feedId,
        feedTitle: userFeed.feeds.name,
        systemEnabled,
        effectiveSettings: effectiveSettings.summarization,
        source: effectiveSettings.source.summarization,
      },
    };
  },
  { requireAuth: true }
);

/**
 * PUT /api/feeds/[id]/summarization
 * Update summarization settings for a feed (user-level override)
 */
export const PUT = createHandler(
  async ({ params, body, session }) => {
    const { id: feedId } = params;
    const userId = session!.user.id;

    logger.info(`[API] Updating summarization settings for feed ${feedId}`, {
      userId,
      settings: body,
    });

    // Check if admin has enabled summarization
    const systemEnabled = await shouldAutoGenerateSummaries();
    if (!systemEnabled) {
      return {
        error:
          "Summarization is disabled system-wide. Contact your administrator.",
        status: 403,
      };
    }

    // Check if user is subscribed to this feed
    const userFeed = await prisma.user_feeds.findUnique({
      where: {
        userId_feedId: {
          userId,
          feedId,
        },
      },
    });

    if (!userFeed) {
      return {
        error: "Feed not found or you are not subscribed to it",
        status: 404,
      };
    }

    // Validate settings
    const validation = validateFeedSettings({
      summarization: body as Partial<SummarizationSettings>,
    });

    if (!validation.valid) {
      return {
        error: "Invalid settings",
        details: validation.errors,
        status: 400,
      };
    }

    // Get current settings
    const currentSettings = (userFeed.settings as any) || {};

    // Merge summarization settings
    const updatedSettings = {
      ...currentSettings,
      summarization: {
        ...(currentSettings.summarization || {}),
        ...(body as Partial<SummarizationSettings>),
      },
    };

    // Update in database
    await prisma.user_feeds.update({
      where: {
        userId_feedId: {
          userId,
          feedId,
        },
      },
      data: {
        settings: updatedSettings,
      },
    });

    // Get effective settings after update
    const effectiveSettings = await getEffectiveFeedSettings(userId, feedId);

    logger.info(`[API] Updated summarization settings for feed ${feedId}`, {
      userId,
      settings: updatedSettings.summarization,
    });

    return {
      data: {
        feedId,
        settings: updatedSettings.summarization,
        effectiveSettings: effectiveSettings.summarization,
      },
      message: "Summarization settings updated successfully",
    };
  },
  {
    requireAuth: true,
    bodySchema: summarizationSettingsSchema,
  }
);

/**
 * DELETE /api/feeds/[id]/summarization
 * Clear summarization settings for a feed (revert to defaults)
 */
export const DELETE = createHandler(
  async ({ params, session }) => {
    const { id: feedId } = params;
    const userId = session!.user.id;

    logger.info(`[API] Clearing summarization settings for feed ${feedId}`, {
      userId,
    });

    // Check if user is subscribed to this feed
    const userFeed = await prisma.user_feeds.findUnique({
      where: {
        userId_feedId: {
          userId,
          feedId,
        },
      },
    });

    if (!userFeed) {
      return {
        error: "Feed not found or you are not subscribed to it",
        status: 404,
      };
    }

    // Get current settings
    const currentSettings = (userFeed.settings as any) || {};

    // Remove summarization settings
    delete currentSettings.summarization;

    // Update in database
    await prisma.user_feeds.update({
      where: {
        userId_feedId: {
          userId,
          feedId,
        },
      },
      data: {
        settings: currentSettings,
      },
    });

    // Get effective settings after clearing
    const effectiveSettings = await getEffectiveFeedSettings(userId, feedId);

    logger.info(`[API] Cleared summarization settings for feed ${feedId}`, {
      userId,
    });

    return {
      data: {
        feedId,
        effectiveSettings: effectiveSettings.summarization,
        source: effectiveSettings.source.summarization,
      },
      message: "Summarization settings cleared, using defaults",
    };
  },
  { requireAuth: true }
);
