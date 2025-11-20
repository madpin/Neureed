import { testFeedExtractionSettings } from "@/lib/services/feed-settings-service";
import { testExtraction } from "@/lib/services/content-extraction-service";
import { testExtractionSchema } from "@/lib/validations/extraction-validation";
import { createHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/feeds/[id]/test-extraction
 * Test extraction configuration for a feed
 */
export const POST = createHandler(
  async ({ params, body }) => {
    const { id } = params;

    logger.info(`[API] Testing extraction for feed ${id}`);

    const testConfig = body;

    // Get feed
    const feed = await prisma.feeds.findUnique({
      where: { id },
      select: { url: true, settings: true, articles: { take: 1, orderBy: { publishedAt: 'desc' } } },
    });

    if (!feed) {
      throw new Error("Feed not found");
    }

    // Determine URL to test
    // If no URL provided, try to use the most recent article URL
    let testUrl = testConfig.url;
    if (!testUrl) {
      if (feed.articles.length > 0 && feed.articles[0].url) {
        testUrl = feed.articles[0].url;
      } else {
        throw new Error("No article URL available to test. Please add a URL parameter or refresh the feed first.");
      }
    }

    // If no custom config provided, use feed settings
    if (
      !testConfig.method &&
      !testConfig.cookies &&
      !testConfig.headers &&
      !testConfig.customSelector
    ) {
      // Test with feed's existing settings
      const result = await testFeedExtractionSettings(id);
      return { result };
    }

    // Test with custom config
    const settings: any = {};

    if (testConfig.method) {
      settings.method = testConfig.method;
    }

    if (testConfig.cookies) {
      settings.cookies = {
        format: "raw",
        value: testConfig.cookies, // Will be encrypted by service
        updatedAt: new Date(),
      };
    }

    if (testConfig.headers) {
      settings.headers = testConfig.headers;
    }

    if (testConfig.customSelector) {
      settings.customSelector = testConfig.customSelector;
    }

    if (testConfig.timeout) {
      settings.timeout = testConfig.timeout;
    }

    const result = await testExtraction(testUrl, settings);

    return { result };
  },
  { bodySchema: testExtractionSchema }
);

