import { NextRequest } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/database/reset
 * Reset database by clearing all feed, category, embedding, and article-related data
 */
export const POST = apiHandler(async (req: NextRequest) => {
  logger.info("Starting database reset...");

  try {
    // Delete data in the correct order to respect foreign key constraints
    // Start with dependent tables first
    
    // 1. Delete article-related data
    const deletedReadArticles = await db.readArticle.deleteMany({});
    logger.info(`Deleted ${deletedReadArticles.count} read articles`);

    const deletedArticleFeedback = await db.articleFeedback.deleteMany({});
    logger.info(`Deleted ${deletedArticleFeedback.count} article feedback entries`);

    // 2. Delete articles (this will also clear embeddings since they're part of articles)
    const deletedArticles = await db.article.deleteMany({});
    logger.info(`Deleted ${deletedArticles.count} articles (including embeddings)`);

    // 3. Delete user feed category assignments
    const deletedUserFeedCategories = await db.userFeedCategory.deleteMany({});
    logger.info(`Deleted ${deletedUserFeedCategories.count} user feed category assignments`);

    // 4. Delete user feeds
    const deletedUserFeeds = await db.userFeed.deleteMany({});
    logger.info(`Deleted ${deletedUserFeeds.count} user feed subscriptions`);

    // 5. Delete user categories
    const deletedUserCategories = await db.userCategory.deleteMany({});
    logger.info(`Deleted ${deletedUserCategories.count} user categories`);

    // 6. Delete feed categories (junction table)
    const deletedFeedCategories = await db.feedCategory.deleteMany({});
    logger.info(`Deleted ${deletedFeedCategories.count} feed category assignments`);

    // 7. Delete feeds
    const deletedFeeds = await db.feed.deleteMany({});
    logger.info(`Deleted ${deletedFeeds.count} feeds`);

    // 8. Delete categories
    const deletedCategories = await db.category.deleteMany({});
    logger.info(`Deleted ${deletedCategories.count} categories`);

    // 9. Delete user patterns (related to article feedback)
    const deletedUserPatterns = await db.userPattern.deleteMany({});
    logger.info(`Deleted ${deletedUserPatterns.count} user patterns`);

    const summary = {
      readArticles: deletedReadArticles.count,
      articleFeedback: deletedArticleFeedback.count,
      articles: deletedArticles.count,
      userFeedCategories: deletedUserFeedCategories.count,
      userFeeds: deletedUserFeeds.count,
      userCategories: deletedUserCategories.count,
      feedCategories: deletedFeedCategories.count,
      feeds: deletedFeeds.count,
      categories: deletedCategories.count,
      userPatterns: deletedUserPatterns.count,
      totalDeleted:
        deletedReadArticles.count +
        deletedArticleFeedback.count +
        deletedArticles.count +
        deletedUserFeedCategories.count +
        deletedUserFeeds.count +
        deletedUserCategories.count +
        deletedFeedCategories.count +
        deletedFeeds.count +
        deletedCategories.count +
        deletedUserPatterns.count,
    };

    logger.info("Database reset completed successfully", summary);

    return {
      success: true,
      message: "Database reset completed successfully",
      data: summary,
    };
  } catch (error) {
    logger.error("Failed to reset database:", error);
    throw error;
  }
});

