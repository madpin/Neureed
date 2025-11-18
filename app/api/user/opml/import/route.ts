import { NextRequest } from "next/server";
import { parseOPML, validateOPMLStructure } from "@/src/lib/services/opml-service";
import { findOrCreateCategory } from "@/src/lib/services/category-service";
import {
  validateAndCreateFeed,
  getFeedByUrl,
} from "@/src/lib/services/feed-service";
import {
  subscribeFeed,
  isUserSubscribed,
} from "@/src/lib/services/user-feed-service";
import {
  validateOPMLFileSize,
  validateOPMLFileType,
} from "@/src/lib/validations/opml-validation";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { getCurrentUser } from "@/src/lib/middleware/auth-middleware";

/**
 * POST /api/user/opml/import
 * Import OPML file and create feeds/subscriptions
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("Unauthorized", 401);
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("No file provided", 400);
    }

    // Validate file size
    const sizeValidation = validateOPMLFileSize(file.size);
    if (!sizeValidation.valid) {
      return apiError(sizeValidation.error || "Invalid file size", 400);
    }

    // Validate file type
    const typeValidation = validateOPMLFileType(file.name, file.type);
    if (!typeValidation.valid) {
      return apiError(typeValidation.error || "Invalid file type", 400);
    }

    // Read file content
    const xmlContent = await file.text();

    // Validate OPML structure
    const structureValidation = validateOPMLStructure(xmlContent);
    if (!structureValidation.valid) {
      return apiError(
        structureValidation.error || "Invalid OPML structure",
        400
      );
    }

    // Parse OPML
    let parsedOPML;
    try {
      parsedOPML = await parseOPML(xmlContent);
    } catch (error) {
      return apiError(
        error instanceof Error ? error.message : "Failed to parse OPML file",
        400
      );
    }

    if (!parsedOPML.feeds || parsedOPML.feeds.length === 0) {
      return apiError("No feeds found in OPML file", 400);
    }

    // Process feeds
    const results = {
      totalFeeds: parsedOPML.feeds.length,
      feedsCreated: 0,
      feedsSkipped: 0,
      subscriptionsAdded: 0,
      categoriesCreated: 0,
      errors: [] as Array<{ feedUrl: string; feedTitle: string; error: string }>,
    };

    const createdCategories = new Set<string>();

    // Process each feed
    for (const opmlFeed of parsedOPML.feeds) {
      try {
        // Create/find categories for this feed
        const categoryIds: string[] = [];

        for (const categoryName of opmlFeed.categories) {
          try {
            const category = await findOrCreateCategory(categoryName);
            categoryIds.push(category.id);

            if (!createdCategories.has(category.id)) {
              createdCategories.add(category.id);
              // Only count as created if it was just created
              const existing = await findOrCreateCategory(categoryName);
              if (existing.id === category.id) {
                results.categoriesCreated++;
              }
            }
          } catch (error) {
            console.error(`Failed to create/find category ${categoryName}:`, error);
          }
        }

        // Check if feed already exists
        let feed = await getFeedByUrl(opmlFeed.xmlUrl);
        let isNewFeed = false;

        if (!feed) {
          // Create new feed
          try {
            feed = await validateAndCreateFeed(
              opmlFeed.xmlUrl,
              opmlFeed.title,
              categoryIds
            );
            isNewFeed = true;
            results.feedsCreated++;
          } catch (error) {
            // If feed creation fails, skip this feed
            results.feedsSkipped++;
            results.errors.push({
              feedUrl: opmlFeed.xmlUrl,
              feedTitle: opmlFeed.title,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to create feed",
            });
            continue;
          }
        } else {
          results.feedsSkipped++;
        }

        // Subscribe user to feed if not already subscribed
        const alreadySubscribed = await isUserSubscribed(user.id, feed.id);

        if (!alreadySubscribed) {
          try {
            await subscribeFeed(user.id, feed.id, opmlFeed.title);
            results.subscriptionsAdded++;

            // If feed existed but user wasn't subscribed, refresh articles
            if (!isNewFeed) {
              // Optionally trigger feed refresh in background
              const { refreshFeed } = await import(
                "@/src/lib/services/feed-refresh-service"
              );
              refreshFeed(feed.id).catch((err) => {
                console.error(`Failed to refresh feed ${feed.id}:`, err);
              });
            }
          } catch (error) {
            console.error(`Failed to subscribe to feed ${feed.id}:`, error);
            results.errors.push({
              feedUrl: opmlFeed.xmlUrl,
              feedTitle: opmlFeed.title,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to subscribe to feed",
            });
          }
        }

        // Trigger article refresh for new feeds
        if (isNewFeed) {
          try {
            const { refreshFeed } = await import(
              "@/src/lib/services/feed-refresh-service"
            );
            // Run in background, don't wait
            refreshFeed(feed.id).catch((err) => {
              console.error(`Failed to refresh new feed ${feed.id}:`, err);
            });
          } catch (error) {
            // Non-critical error, just log it
            console.error(`Failed to trigger refresh for feed ${feed.id}:`, error);
          }
        }
      } catch (error) {
        results.errors.push({
          feedUrl: opmlFeed.xmlUrl,
          feedTitle: opmlFeed.title,
          error:
            error instanceof Error
              ? error.message
              : "Unexpected error processing feed",
        });
      }
    }

    return apiResponse({
      success: true,
      summary: results,
      message: `Successfully imported ${results.subscriptionsAdded} feed subscription(s)`,
    });
  } catch (error) {
    console.error("OPML import error:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to import OPML file",
      500
    );
  }
}

