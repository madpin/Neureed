import { prisma } from "@/lib/db";
import { subscribeFeed } from "./user-feed-service";

/**
 * Default feeds that new users will be subscribed to automatically
 */
export const DEFAULT_FEEDS = [
  // Technology
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/feed",
    categoryName: "Technology",
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    categoryName: "Technology",
  },
  {
    name: "Hacker News",
    url: "https://hnrss.org/frontpage",
    categoryName: "Technology",
  },
  // News
  {
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    categoryName: "News",
  },
  // Science
  {
    name: "Nature",
    url: "https://www.nature.com/nature.rss",
    categoryName: "Science",
  },
  {
    name: "Science Daily",
    url: "https://www.sciencedaily.com/rss/all.xml",
    categoryName: "Science",
  },
  // Positive News
  {
    name: "Good News Network",
    url: "https://www.goodnewsnetwork.org/feed",
    categoryName: "Positive News",
  },
  {
    name: "Positive News",
    url: "https://www.positive.news/feed",
    categoryName: "Positive News",
  },
  // Satire
  {
    name: "The Onion",
    url: "https://www.theonion.com/rss",
    categoryName: "Satire",
  },
];

/**
 * Ensure all default feeds exist in the database
 * Creates feeds if they don't exist, along with their categories
 */
export async function ensureDefaultFeedsExist(): Promise<void> {
  console.log("🔄 Ensuring default feeds exist in database...");

  for (const feedData of DEFAULT_FEEDS) {
    try {
      // Ensure category exists
      const category = await prisma.categories.upsert({
        where: { name: feedData.categoryName },
        update: {},
        create: {
          id: `cat_${feedData.categoryName.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`,
          name: feedData.categoryName,
          description: `${feedData.categoryName} content`,
          updatedAt: new Date(),
        },
      });

      // Ensure feed exists
      const feed = await prisma.feeds.upsert({
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
          },
          updatedAt: new Date(),
        },
      });

      // Ensure feed-category association exists
      await prisma.feed_categories.upsert({
        where: {
          feedId_categoryId: {
            feedId: feed.id,
            categoryId: category.id,
          },
        },
        update: {},
        create: {
          feedId: feed.id,
          categoryId: category.id,
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
 */
export async function subscribeUserToDefaultFeeds(userId: string): Promise<void> {
  console.log(`🔄 Subscribing user ${userId} to default feeds...`);

  // First, ensure all default feeds exist in the database
  await ensureDefaultFeedsExist();

  let subscribedCount = 0;
  let skippedCount = 0;

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

      // Subscribe user to feed
      await subscribeFeed(userId, feed.id, feedData.name);
      subscribedCount++;
      console.log(`✅ Subscribed to: ${feedData.name}`);
    } catch (error) {
      console.error(`❌ Failed to subscribe to feed: ${feedData.name}`, error);
    }
  }

  console.log(
    `✅ User subscription complete: ${subscribedCount} subscribed, ${skippedCount} skipped`
  );
}

