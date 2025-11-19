import { parseFeedUrl, validateFeedUrl, normalizeFeedUrl, isSafeFeedUrl } from "@/lib/feed-parser";
import { validateFeedSchema } from "@/lib/validations/feed-validation";
import { createHandler } from "@/lib/api-handler";
import { apiResponse } from "@/lib/api-response";

/**
 * POST /api/feeds/validate
 * Validate a feed URL before adding it
 */
export const POST = createHandler(
  async ({ body }) => {
    const { url } = body;
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
  },
  { bodySchema: validateFeedSchema }
);

