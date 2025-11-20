import { z } from "zod";
import { createHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { validateFeedSettings } from "@/lib/services/feed-settings-cascade";

export const dynamic = "force-dynamic";

/**
 * Category settings schema (same as feed settings)
 */
const categorySettingsSchema = z.object({
  refreshInterval: z.number().min(15).max(1440).optional().nullable(),
  maxArticlesPerFeed: z.number().min(50).max(5000).optional().nullable(),
  maxArticleAge: z.number().min(1).max(365).optional().nullable(),
});

/**
 * GET /api/user/categories/[categoryId]/settings
 * Get settings for a user's category
 */
export const GET = createHandler(
  async ({ params, session }) => {
    const { categoryId } = params;

    // Check if category belongs to user
    const category = await prisma.user_categories.findUnique({
      where: {
        id: categoryId as string,
        userId: session!.user!.id,
      },
      include: {
        user_feed_categories: {
          include: {
            user_feeds: {
              include: {
                feeds: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    // Get category settings
    const categorySettings = (category.settings as any) || {};

    return {
      settings: {
        refreshInterval: categorySettings.refreshInterval ?? null,
        maxArticlesPerFeed: categorySettings.maxArticlesPerFeed ?? null,
        maxArticleAge: categorySettings.maxArticleAge ?? null,
      },
      feedCount: category.user_feed_categories.length,
      feeds: category.user_feed_categories.map((ufc) => ({
        id: ufc.user_feeds.feeds.id,
        name: ufc.user_feeds.customName || ufc.user_feeds.feeds.name,
      })),
    };
  },
  { requireAuth: true }
);

/**
 * PUT /api/user/categories/[categoryId]/settings
 * Update category-level settings
 * These settings apply to all feeds in the category (unless overridden at feed level)
 */
export const PUT = createHandler(
  async ({ params, body, session }) => {
    const { categoryId } = params;
    
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

    // Check if category belongs to user
    const category = await prisma.user_categories.findUnique({
      where: {
        id: categoryId as string,
        userId: session!.user!.id,
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    // Get existing settings
    const existingSettings = (category.settings as any) || {};

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

    // Update category settings
    const updatedCategory = await prisma.user_categories.update({
      where: {
        id: categoryId as string,
        userId: session!.user!.id,
      },
      data: {
        settings: newSettings,
      },
    });

    return {
      success: true,
      settings: updatedCategory.settings,
    };
  },
  { bodySchema: categorySettingsSchema, requireAuth: true }
);

