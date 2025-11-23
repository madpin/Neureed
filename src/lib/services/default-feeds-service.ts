import { prisma } from "@/lib/db";
import { subscribeFeed } from "./user-feed-service";
import {
  createUserCategory,
  getUserCategoryByName,
  assignFeedToCategory,
} from "./user-category-service";

/**
 * Default feeds that new users will be subscribed to automatically
 */
export const DEFAULT_FEEDS = [
  // Technology
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/feed",
    categoryName: "Technology",
    categoryIcon: "💻",
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    categoryName: "Technology",
    categoryIcon: "💻",
  },
  {
    name: "Hacker News",
    url: "https://hnrss.org/frontpage",
    categoryName: "Technology",
    categoryIcon: "💻",
  },
  // News
  {
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    categoryName: "News",
    categoryIcon: "📰",
  },
  // Science
  {
    name: "Nature",
    url: "https://www.nature.com/nature.rss",
    categoryName: "Science",
    categoryIcon: "🔬",
  },
  {
    name: "Science Daily",
    url: "https://www.sciencedaily.com/rss/all.xml",
    categoryName: "Science",
    categoryIcon: "🔬",
  },
  // Positive News
  {
    name: "Good News Network",
    url: "https://www.goodnewsnetwork.org/feed",
    categoryName: "Positive News",
    categoryIcon: "😊",
  },
  {
    name: "Positive News",
    url: "https://www.positive.news/feed",
    categoryName: "Positive News",
    categoryIcon: "😊",
  },
  // Satire
  {
    name: "The Onion",
    url: "https://www.theonion.com/rss",
    categoryName: "Satire",
    categoryIcon: "🧅",
  },
];

/**
 * Ensure all default feeds exist in the database
 * Creates feeds if they don't exist (without creating categories)
 */
export async function ensureDefaultFeedsExist(): Promise<void> {
  console.log("🔄 Ensuring default feeds exist in database...");

  for (const feedData of DEFAULT_FEEDS) {
    try {
      // Ensure feed exists (don't create global categories anymore)
      await prisma.feeds.upsert({
        where: { url: feedData.url },
        update: {
          name: feedData.name, // Update name in case it changed
        },
        create: {
          id: `feed_${feedData.name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`,
          name: feedData.name,
          url: feedData.url,
          settings: {
            refreshInterval: 3600, // 1 hour default
            extraction: {
              method: "readability", // Default extraction method
            },
          },
        },
      });

      console.log(`✅ Ensured feed exists: ${feedData.name}`);
    } catch (error) {
      console.error(`❌ Failed to ensure feed exists: ${feedData.name}`, error);
    }
  }

  console.log("✅ All default feeds ensured");
}

/**
 * Subscribe a new user to all default feeds
 * This should be called when a user is created
 * Creates user categories and assigns feeds to them
 */
export async function subscribeUserToDefaultFeeds(userId: string): Promise<void> {
  console.log(`🔄 Subscribing user ${userId} to default feeds...`);

  // First, ensure all default feeds exist in the database
  await ensureDefaultFeedsExist();

  let subscribedCount = 0;
  let skippedCount = 0;
  const categoryMap = new Map<string, string>(); // categoryName -> categoryId

  for (const feedData of DEFAULT_FEEDS) {
    try {
      // Find the feed by URL
      const feed = await prisma.feeds.findUnique({
        where: { url: feedData.url },
      });

      if (!feed) {
        console.warn(`⚠️  Feed not found: ${feedData.name} (${feedData.url})`);
        continue;
      }

      // Check if user is already subscribed
      const existingSubscription = await prisma.user_feeds.findUnique({
        where: {
          userId_feedId: {
            userId,
            feedId: feed.id,
          },
        },
      });

      if (existingSubscription) {
        console.log(`⏭️  User already subscribed to: ${feedData.name}`);
        skippedCount++;
        continue;
      }

      // Ensure user category exists (create once per category name)
      let categoryId = categoryMap.get(feedData.categoryName);
      if (!categoryId) {
        let userCategory = await getUserCategoryByName(userId, feedData.categoryName);
        if (!userCategory) {
          console.log(`📁 Creating user category: ${feedData.categoryName}`);
          userCategory = await createUserCategory(
            userId,
            feedData.categoryName,
            `${feedData.categoryName} content`,
            undefined,
            feedData.categoryIcon
          );
        }
        categoryId = userCategory.id;
        categoryMap.set(feedData.categoryName, categoryId);
      }

      // Subscribe user to feed
      const userFeed = await subscribeFeed(userId, feed.id, feedData.name);

      // Assign feed to user category
      await assignFeedToCategory(userId, userFeed.id, categoryId);

      subscribedCount++;
      console.log(`✅ Subscribed to: ${feedData.name} (${feedData.categoryName})`);
    } catch (error) {
      console.error(`❌ Failed to subscribe to feed: ${feedData.name}`, error);
    }
  }

  console.log(
    `✅ User subscription complete: ${subscribedCount} subscribed, ${skippedCount} skipped`
  );
}

