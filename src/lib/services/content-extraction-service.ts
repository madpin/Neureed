import { extractorRegistry } from "@/lib/extractors/extractor-registry";
import type {
  ExtractedContent,
  ExtractorConfig,
  ExtractionSettings,
} from "@/lib/extractors/types";
import { decrypt } from "@/lib/services/encryption-service";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";

/**
 * Content extraction service
 * Orchestrates extractors and manages extraction settings
 */

/**
 * Extract content from URL using feed settings
 */
export async function extractContent(
  url: string,
  feedId?: string
): Promise<ExtractedContent> {
  try {
    logger.info(`[ContentExtraction] Extracting content from ${url}`);

    // Get extraction settings if feedId provided
    let extractionSettings: ExtractionSettings | null = null;
    if (feedId) {
      const feed = await prisma.feeds.findUnique({
        where: { id: feedId },
        select: { settings: true },
      });

      if (feed?.settings && typeof feed.settings === "object") {
        const settings = feed.settings as any;
        extractionSettings = settings.extraction || null;
      }
    }

    // Build extractor config
    const config = await buildExtractorConfig(extractionSettings);

    // Determine preferred extractor
    const preferredExtractor = extractionSettings?.method || undefined;

    // Extract with fallback chain
    const result = await extractorRegistry.extractWithFallback(
      url,
      config,
      preferredExtractor
    );

    // Update feed test status if feedId provided
    if (feedId && extractionSettings) {
      await updateFeedTestStatus(feedId, result.success, result.error);
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`[ContentExtraction] Extraction failed: ${errorMessage}`);

    return {
      title: "",
      content: "",
      success: false,
      method: "none",
      error: errorMessage,
    };
  }
}

/**
 * Extract content with specific extractor
 */
export async function extractWithMethod(
  url: string,
  method: string,
  config?: ExtractorConfig
): Promise<ExtractedContent> {
  try {
    logger.info(`[ContentExtraction] Extracting with ${method} from ${url}`);
    return await extractorRegistry.extractWith(method, url, config);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`[ContentExtraction] Extraction failed: ${errorMessage}`);

    return {
      title: "",
      content: "",
      success: false,
      method,
      error: errorMessage,
    };
  }
}

/**
 * Test extraction with settings
 */
export async function testExtraction(
  url: string,
  settings?: Partial<ExtractionSettings>
): Promise<{
  success: boolean;
  method: string;
  title?: string;
  contentPreview?: string;
  error?: string;
  duration: number;
}> {
  const startTime = Date.now();

  try {
    logger.info(`[ContentExtraction] Testing extraction for ${url}`);

    // Build config from settings
    const config = await buildExtractorConfig(settings);

    // Extract
    const result = await extractorRegistry.extractWithFallback(
      url,
      config,
      settings?.method
    );

    const duration = Date.now() - startTime;

    // Create preview (first 500 chars)
    const contentPreview = result.content
      ? result.content.substring(0, 500) + (result.content.length > 500 ? "..." : "")
      : undefined;

    return {
      success: result.success,
      method: result.method,
      title: result.title || undefined,
      contentPreview,
      error: result.error,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      success: false,
      method: "none",
      error: errorMessage,
      duration,
    };
  }
}

/**
 * Build extractor config from extraction settings
 */
async function buildExtractorConfig(
  settings?: Partial<ExtractionSettings> | null
): Promise<ExtractorConfig> {
  const config: ExtractorConfig = {};

  if (!settings) {
    return config;
  }

  // Decrypt cookies if present
  if (settings.cookies?.value) {
    try {
      config.cookies = decrypt(settings.cookies.value);
    } catch (error) {
      logger.error(
        `[ContentExtraction] Failed to decrypt cookies: ${error}`
      );
    }
  }

  // Add headers
  if (settings.headers) {
    config.headers = settings.headers;
  }

  // Add custom selector
  if (settings.customSelector) {
    config.customSelector = settings.customSelector;
  }

  // Add timeout
  if (settings.timeout) {
    config.timeout = settings.timeout;
  }

  return config;
}

/**
 * Update feed test status
 */
async function updateFeedTestStatus(
  feedId: string,
  success: boolean,
  error?: string
): Promise<void> {
  try {
    const feed = await prisma.feeds.findUnique({
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

    // Update test status
    settings.extraction.lastTestedAt = new Date().toISOString();
    settings.extraction.lastTestStatus = success ? "success" : "failed";
    settings.extraction.lastTestError = error || null;

    await prisma.feeds.update({
      where: { id: feedId },
      data: { settings },
    });

    logger.info(
      `[ContentExtraction] Updated feed ${feedId} test status: ${success ? "success" : "failed"}`
    );
  } catch (error) {
    logger.error(
      `[ContentExtraction] Failed to update feed test status: ${error}`
    );
  }
}

/**
 * Get extractor metrics
 */
export function getExtractorMetrics() {
  return extractorRegistry.getAllMetrics();
}

/**
 * Reset extractor metrics
 */
export function resetExtractorMetrics(extractorName?: string) {
  if (extractorName) {
    extractorRegistry.resetMetrics(extractorName);
  } else {
    extractorRegistry.resetAllMetrics();
  }
}

