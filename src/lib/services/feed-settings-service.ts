import { prisma } from "@/lib/db";
import type { ExtractionSettings } from "@/lib/extractors/types";
import { encrypt, decrypt } from "@/lib/services/encryption-service";
import { testExtraction } from "@/lib/services/content-extraction-service";
import { logger } from "@/lib/logger";
import type { Feed } from "@prisma/client";

/**
 * Feed settings service
 * Manages extraction settings for feeds
 */

/**
 * Get extraction settings for a feed
 */
export async function getExtractionSettings(
  feedId: string
): Promise<ExtractionSettings | null> {
  try {
    const feed = await prisma.feed.findUnique({
      where: { id: feedId },
      select: { settings: true },
    });

    if (!feed?.settings || typeof feed.settings !== "object") {
      return null;
    }

    const settings = feed.settings as any;
    const extraction = settings.extraction;

    if (!extraction) {
      return null;
    }

    // Decrypt cookies if present
    if (extraction.cookies?.value) {
      try {
        extraction.cookies.value = decrypt(extraction.cookies.value);
      } catch (error) {
        logger.error(`[FeedSettings] Failed to decrypt cookies: ${error}`);
        extraction.cookies = undefined;
      }
    }

    return extraction;
  } catch (error) {
    logger.error(`[FeedSettings] Failed to get extraction settings: ${error}`);
    return null;
  }
}

/**
 * Update extraction settings for a feed
 */
export async function updateExtractionSettings(
  feedId: string,
  updates: Partial<ExtractionSettings> & { cookies?: string }
): Promise<ExtractionSettings> {
  try {
    // Get current settings
    const feed = await prisma.feed.findUnique({
      where: { id: feedId },
      select: { settings: true, url: true },
    });

    if (!feed) {
      throw new Error("Feed not found");
    }

    const currentSettings = (feed.settings as any) || {};
    const currentExtraction = currentSettings.extraction || {};

    // Build new extraction settings
    const newExtraction: any = {
      ...currentExtraction,
      ...updates,
    };

    // Encrypt cookies if provided
    if (updates.cookies) {
      const encryptedCookies = encrypt(updates.cookies);
      newExtraction.cookies = {
        format: "raw", // Will be auto-detected by parser
        value: encryptedCookies,
        updatedAt: new Date().toISOString(),
      };
    }

    // Update settings
    const updatedSettings = {
      ...currentSettings,
      extraction: newExtraction,
    };

    await prisma.feed.update({
      where: { id: feedId },
      data: { settings: updatedSettings },
    });

    logger.info(`[FeedSettings] Updated extraction settings for feed ${feedId}`);

    // Return decrypted settings
    if (newExtraction.cookies?.value) {
      try {
        newExtraction.cookies.value = decrypt(newExtraction.cookies.value);
      } catch (error) {
        logger.error(`[FeedSettings] Failed to decrypt cookies: ${error}`);
      }
    }

    return newExtraction;
  } catch (error) {
    logger.error(`[FeedSettings] Failed to update extraction settings: ${error}`);
    throw error;
  }
}

/**
 * Clear extraction settings for a feed
 */
export async function clearExtractionSettings(feedId: string): Promise<void> {
  try {
    const feed = await prisma.feed.findUnique({
      where: { id: feedId },
      select: { settings: true },
    });

    if (!feed) {
      throw new Error("Feed not found");
    }

    const currentSettings = (feed.settings as any) || {};
    delete currentSettings.extraction;

    await prisma.feed.update({
      where: { id: feedId },
      data: { settings: currentSettings },
    });

    logger.info(`[FeedSettings] Cleared extraction settings for feed ${feedId}`);
  } catch (error) {
    logger.error(`[FeedSettings] Failed to clear extraction settings: ${error}`);
    throw error;
  }
}

/**
 * Clear cookies for a feed
 */
export async function clearCookies(feedId: string): Promise<void> {
  try {
    const feed = await prisma.feed.findUnique({
      where: { id: feedId },
      select: { settings: true },
    });

    if (!feed) {
      throw new Error("Feed not found");
    }

    const currentSettings = (feed.settings as any) || {};
    if (currentSettings.extraction) {
      delete currentSettings.extraction.cookies;

      await prisma.feed.update({
        where: { id: feedId },
        data: { settings: currentSettings },
      });

      logger.info(`[FeedSettings] Cleared cookies for feed ${feedId}`);
    }
  } catch (error) {
    logger.error(`[FeedSettings] Failed to clear cookies: ${error}`);
    throw error;
  }
}

/**
 * Test extraction settings for a feed
 */
export async function testFeedExtractionSettings(feedId: string): Promise<{
  success: boolean;
  method: string;
  title?: string;
  contentPreview?: string;
  error?: string;
  duration: number;
}> {
  try {
    const feed = await prisma.feed.findUnique({
      where: { id: feedId },
      select: { 
        url: true, 
        settings: true,
        articles: {
          take: 1,
          orderBy: { publishedAt: 'desc' },
          select: { url: true }
        }
      },
    });

    if (!feed) {
      throw new Error("Feed not found");
    }

    // Get the most recent article URL
    if (!feed.articles || feed.articles.length === 0 || !feed.articles[0].url) {
      return {
        success: false,
        method: "none",
        error: "No articles found in this feed. Please refresh the feed first.",
        duration: 0,
      };
    }

    const articleUrl = feed.articles[0].url;

    // Get extraction settings
    const settings = (feed.settings as any)?.extraction;

    // Test extraction on the article URL
    const result = await testExtraction(articleUrl, settings);

    // Update test status
    await updateTestStatus(feedId, result.success, result.error);

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`[FeedSettings] Test extraction failed: ${errorMessage}`);

    return {
      success: false,
      method: "none",
      error: errorMessage,
      duration: 0,
    };
  }
}

/**
 * Update test status in feed settings
 */
async function updateTestStatus(
  feedId: string,
  success: boolean,
  error?: string
): Promise<void> {
  try {
    const feed = await prisma.feed.findUnique({
      where: { id: feedId },
      select: { settings: true },
    });

    if (!feed?.settings || typeof feed.settings !== "object") {
      return;
    }

    const settings = feed.settings as any;
    if (!settings.extraction) {
      return;
    }

    settings.extraction.lastTestedAt = new Date().toISOString();
    settings.extraction.lastTestStatus = success ? "success" : "failed";
    settings.extraction.lastTestError = error || null;

    await prisma.feed.update({
      where: { id: feedId },
      data: { settings },
    });
  } catch (error) {
    logger.error(`[FeedSettings] Failed to update test status: ${error}`);
  }
}

/**
 * Check if feed has extraction settings
 */
export async function hasExtractionSettings(feedId: string): Promise<boolean> {
  try {
    const feed = await prisma.feed.findUnique({
      where: { id: feedId },
      select: { settings: true },
    });

    if (!feed?.settings || typeof feed.settings !== "object") {
      return false;
    }

    const settings = feed.settings as any;
    return !!settings.extraction;
  } catch (error) {
    logger.error(`[FeedSettings] Failed to check extraction settings: ${error}`);
    return false;
  }
}

/**
 * Get all feeds with extraction settings
 */
export async function getFeedsWithExtractionSettings(): Promise<Feed[]> {
  try {
    const feeds = await prisma.feed.findMany({
      where: {
        settings: {
          path: ["extraction"],
          not: null as any,
        },
      },
    });

    return feeds;
  } catch (error) {
    logger.error(
      `[FeedSettings] Failed to get feeds with extraction settings: ${error}`
    );
    return [];
  }
}

/**
 * Delete all articles from a feed
 */
export async function deleteAllArticles(feedId: string): Promise<number> {
  try {
    const result = await prisma.article.deleteMany({
      where: { feedId },
    });

    logger.info(`[FeedSettings] Deleted ${result.count} articles from feed ${feedId}`);
    return result.count;
  } catch (error) {
    logger.error(`[FeedSettings] Failed to delete articles: ${error}`);
    throw error;
  }
}

