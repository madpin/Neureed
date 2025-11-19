import { z } from "zod";
import { createHandler } from "@/lib/api-handler";
import { requireAuth } from "@/lib/middleware/auth-middleware";
import { prisma } from "@/lib/db";
import { validateFeedSettings } from "@/lib/services/feed-settings-cascade";

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
    const user = await requireAuth(session);
    const { categoryId } = params;

    // Check if category belongs to user
    const category = await prisma.userCategory.findUnique({
      where: {
        id: categoryId as string,
        userId: user.id,
      },
      include: {
        userFeedCategories: {
          include: {
            userFeed: {
              include: {
                feed: true,
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
      feedCount: category.userFeedCategories.length,
      feeds: category.userFeedCategories.map((ufc) => ({
        id: ufc.userFeed.feed.id,
        name: ufc.userFeed.customName || ufc.userFeed.feed.name,
      })),
    };
  }
);

/**
 * PUT /api/user/categories/[categoryId]/settings
 * Update category-level settings
 * These settings apply to all feeds in the category (unless overridden at feed level)
 */
export const PUT = createHandler(
  async ({ params, body, session }) => {
    const user = await requireAuth(session);
    const { categoryId } = params;
    const settings = body;

    // Validate settings
    const validation = validateFeedSettings(settings);
    if (!validation.valid) {
      throw new Error(`Invalid settings: ${validation.errors.join(", ")}`);
    }

    // Check if category belongs to user
    const category = await prisma.userCategory.findUnique({
      where: {
        id: categoryId as string,
        userId: user.id,
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
      ...(settings.refreshInterval !== undefined && {
        refreshInterval: settings.refreshInterval,
      }),
      ...(settings.maxArticlesPerFeed !== undefined && {
        maxArticlesPerFeed: settings.maxArticlesPerFeed,
      }),
      ...(settings.maxArticleAge !== undefined && {
        maxArticleAge: settings.maxArticleAge,
      }),
    };

    // Remove null values (they represent "use default")
    Object.keys(newSettings).forEach((key) => {
      if (newSettings[key] === null) {
        delete newSettings[key];
      }
    });

    // Update category settings
    const updatedCategory = await prisma.userCategory.update({
      where: {
        id: categoryId as string,
        userId: user.id,
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
  { bodySchema: categorySettingsSchema }
);

