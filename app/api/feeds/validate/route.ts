import { NextRequest } from "next/server";
import { parseFeedUrl, validateFeedUrl, normalizeFeedUrl, isSafeFeedUrl } from "@/src/lib/feed-parser";
import { validateFeedSchema } from "@/src/lib/validations/feed-validation";
import { apiResponse, apiError } from "@/src/lib/api-response";

/**
 * POST /api/feeds/validate
 * Validate a feed URL before adding it
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = validateFeedSchema.safeParse(body);
    if (!validationResult.success) {
      return apiError(
        "Invalid input",
        400,
        validationResult.error.errors
      );
    }

    const { url } = validationResult.data;
    const normalizedUrl = normalizeFeedUrl(url);

    // Check if URL is safe
    if (!isSafeFeedUrl(normalizedUrl)) {
      return apiResponse({
        valid: false,
        error: "Invalid or unsafe URL",
      });
    }

    // Validate feed
    const isValid = await validateFeedUrl(normalizedUrl);

    if (!isValid) {
      return apiResponse({
        valid: false,
        error: "Unable to parse feed or invalid feed format",
      });
    }

    // Get feed info
    try {
      const feedInfo = await parseFeedUrl(normalizedUrl);
      return apiResponse({
        valid: true,
        feedInfo: {
          title: feedInfo.title,
          description: feedInfo.description,
          link: feedInfo.link,
          imageUrl: feedInfo.imageUrl,
          itemCount: feedInfo.items.length,
        },
      });
    } catch (error) {
      return apiResponse({
        valid: false,
        error: "Unable to fetch feed information",
      });
    }
  } catch (error) {
    console.error("Error validating feed:", error);
    return apiError(
      "Failed to validate feed",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

