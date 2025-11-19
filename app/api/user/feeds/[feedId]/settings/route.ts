import { z } from "zod";
import { createHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { 
  getEffectiveFeedSettings, 
  validateFeedSettings 
} from "@/lib/services/feed-settings-cascade";

export const dynamic = "force-dynamic";

/**
 * Feed settings schema
 */
const feedSettingsSchema = z.object({
  refreshInterval: z.number().min(15).max(1440).optional().nullable(),
  maxArticlesPerFeed: z.number().min(50).max(5000).optional().nullable(),
  maxArticleAge: z.number().min(1).max(365).optional().nullable(),
});

/**
 * GET /api/user/feeds/[feedId]/settings
 * Get effective settings for a user's feed subscription
 */
export const GET = createHandler(
  async ({ params, session }) => {
    const { feedId } = params;

    // Check if user is subscribed to this feed
    const userFeed = await prisma.userFeed.findUnique({
      where: {
        userId_feedId: {
          userId: session!.user!.id,
          feedId: feedId as string,
        },
      },
    });

    if (!userFeed) {
      throw new Error("Feed not found or not subscribed");
    }

    // Get effective settings
    const effectiveSettings = await getEffectiveFeedSettings(session!.user!.id, feedId as string);

    // Get feed-specific overrides
    const feedSettings = userFeed.settings as any;

    return {
      effective: effectiveSettings,
      overrides: {
        refreshInterval: feedSettings?.refreshInterval ?? null,
        maxArticlesPerFeed: feedSettings?.maxArticlesPerFeed ?? null,
        maxArticleAge: feedSettings?.maxArticleAge ?? null,
      },
    };
  },
  { requireAuth: true }
);

/**
 * PUT /api/user/feeds/[feedId]/settings
 * Update feed-specific settings for a user's subscription
 */
export const PUT = createHandler(
  async ({ params, body, session }) => {
    const { feedId } = params;
    
    // Convert null to undefined for validation
    const settings = {
      refreshInterval: body.refreshInterval ?? undefined,
      maxArticlesPerFeed: body.maxArticlesPerFeed ?? undefined,
      maxArticleAge: body.maxArticleAge ?? undefined,
    };

    // Validate settings
    const validation = validateFeedSettings(settings);
    if (!validation.valid) {
      throw new Error(`Invalid settings: ${validation.errors.join(", ")}`);
    }

    // Check if user is subscribed to this feed
    const userFeed = await prisma.userFeed.findUnique({
      where: {
        userId_feedId: {
          userId: session!.user!.id,
          feedId: feedId as string,
        },
      },
    });

    if (!userFeed) {
      throw new Error("Feed not found or not subscribed");
    }

    // Get existing settings
    const existingSettings = (userFeed.settings as any) || {};

    // Merge with new settings (null values remove overrides)
    const newSettings = {
      ...existingSettings,
      ...(body.refreshInterval !== undefined && {
        refreshInterval: body.refreshInterval,
      }),
      ...(body.maxArticlesPerFeed !== undefined && {
        maxArticlesPerFeed: body.maxArticlesPerFeed,
      }),
      ...(body.maxArticleAge !== undefined && {
        maxArticleAge: body.maxArticleAge,
      }),
    };

    // Remove null values (they represent "use default")
    Object.keys(newSettings).forEach((key) => {
      if (newSettings[key] === null) {
        delete newSettings[key];
      }
    });

    // Update user feed settings
    const updatedUserFeed = await prisma.userFeed.update({
      where: {
        userId_feedId: {
          userId: session!.user!.id,
          feedId: feedId as string,
        },
      },
      data: {
        settings: newSettings,
      },
    });

    // Get effective settings after update
    const effectiveSettings = await getEffectiveFeedSettings(session!.user!.id, feedId as string);

    return {
      success: true,
      settings: updatedUserFeed.settings,
      effective: effectiveSettings,
    };
  },
  { bodySchema: feedSettingsSchema, requireAuth: true }
);

