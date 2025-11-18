import { NextRequest, NextResponse } from "next/server";
import { testFeedExtractionSettings } from "@/src/lib/services/feed-settings-service";
import { testExtraction } from "@/src/lib/services/content-extraction-service";
import { testExtractionSchema } from "@/src/lib/validations/extraction-validation";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { logger } from "@/src/lib/logger";
import { prisma } from "@/src/lib/db";

/**
 * POST /api/feeds/[id]/test-extraction
 * Test extraction configuration for a feed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    logger.info(`[API] Testing extraction for feed ${id}`);

    // Validate request body
    const validation = testExtractionSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        `Validation error: ${validation.error.errors.map((e) => e.message).join(", ")}`,
        400
      );
    }

    const testConfig = validation.data;

    // Get feed
    const feed = await prisma.feed.findUnique({
      where: { id },
      select: { url: true, settings: true, articles: { take: 1, orderBy: { publishedAt: 'desc' } } },
    });

    if (!feed) {
      return apiError("Feed not found", 404);
    }

    // Determine URL to test
    // If no URL provided, try to use the most recent article URL
    let testUrl = testConfig.url;
    if (!testUrl) {
      if (feed.articles.length > 0 && feed.articles[0].url) {
        testUrl = feed.articles[0].url;
      } else {
        return apiError("No article URL available to test. Please add a URL parameter or refresh the feed first.", 400);
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
      return apiResponse({ result }, 200);
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

    return apiResponse({ result }, 200);
  } catch (error) {
    logger.error(`[API] Test extraction failed: ${error}`);
    return apiError(
      error instanceof Error ? error.message : "Test extraction failed",
      500
    );
  }
}

