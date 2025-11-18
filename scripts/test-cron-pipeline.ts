#!/usr/bin/env tsx
/**
 * Comprehensive Cron Pipeline Test
 * Tests the entire feed refresh pipeline from cron to article display
 */

import { PrismaClient } from "@prisma/client";
import { refreshFeed } from "../src/lib/services/feed-refresh-service";
import { getFeedsToRefresh, getUserFeedsToRefresh } from "../src/lib/services/feed-service";
import { getSchedulerStatus } from "../src/lib/jobs/scheduler";

const prisma = new PrismaClient();

async function main() {
  console.log("=".repeat(80));
  console.log("CRON PIPELINE DIAGNOSTIC TEST");
  console.log("=".repeat(80));
  console.log();

  // 1. Check scheduler status
  console.log("1. Checking Scheduler Status...");
  console.log("-".repeat(80));
  try {
    const status = getSchedulerStatus();
    console.log("✓ Scheduler Status:");
    console.log(`  - Initialized: ${status.initialized}`);
    console.log(`  - Enabled: ${status.enabled}`);
    console.log(`  - ENABLE_CRON_JOBS env: ${process.env.ENABLE_CRON_JOBS || 'not set (defaults to true)'}`);
    console.log(`  - FEED_REFRESH_SCHEDULE: ${process.env.FEED_REFRESH_SCHEDULE || 'not set (defaults to */30 * * * *)'}`);
  } catch (error) {
    console.error("✗ Failed to get scheduler status:", error);
  }
  console.log();

  // 2. Check database connection
  console.log("2. Checking Database Connection...");
  console.log("-".repeat(80));
  try {
    await prisma.$connect();
    console.log("✓ Database connected successfully");
  } catch (error) {
    console.error("✗ Database connection failed:", error);
    process.exit(1);
  }
  console.log();

  // 3. Check for feeds
  console.log("3. Checking Feeds...");
  console.log("-".repeat(80));
  const allFeeds = await prisma.feed.findMany({
    include: {
      _count: {
        select: { articles: true },
      },
    },
  });
  console.log(`✓ Total feeds in database: ${allFeeds.length}`);
  
  if (allFeeds.length > 0) {
    console.log("\nFeed Details:");
    for (const feed of allFeeds.slice(0, 5)) {
      console.log(`  - ${feed.name}`);
      console.log(`    URL: ${feed.url}`);
      console.log(`    Articles: ${feed._count.articles}`);
      console.log(`    Last Fetched: ${feed.lastFetched ? feed.lastFetched.toISOString() : 'Never'}`);
      console.log(`    Error Count: ${feed.errorCount}`);
    }
    if (allFeeds.length > 5) {
      console.log(`  ... and ${allFeeds.length - 5} more`);
    }
  }
  console.log();

  // 4. Check feeds due for refresh (system-wide)
  console.log("4. Checking Feeds Due for Refresh (System-wide)...");
  console.log("-".repeat(80));
  try {
    const dueFeeds = await getFeedsToRefresh();
    console.log(`✓ Feeds due for refresh: ${dueFeeds.length}`);
    if (dueFeeds.length > 0) {
      console.log("\nDue Feeds:");
      for (const feed of dueFeeds.slice(0, 3)) {
        console.log(`  - ${feed.name} (last fetched: ${feed.lastFetched ? feed.lastFetched.toISOString() : 'Never'})`);
      }
    }
  } catch (error) {
    console.error("✗ Failed to get feeds due for refresh:", error);
  }
  console.log();

  // 5. Check user subscriptions
  console.log("5. Checking User Subscriptions...");
  console.log("-".repeat(80));
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { userFeeds: true },
      },
    },
  });
  console.log(`✓ Total users: ${users.length}`);
  
  if (users.length > 0) {
    const firstUser = users[0];
    console.log(`\nTesting with user: ${firstUser.email} (${firstUser.id})`);
    console.log(`  - Subscribed feeds: ${firstUser._count.userFeeds}`);
    
    // Check user's feeds due for refresh
    try {
      const userDueFeeds = await getUserFeedsToRefresh(firstUser.id);
      console.log(`  - Feeds due for refresh: ${userDueFeeds.length}`);
      
      if (userDueFeeds.length > 0) {
        console.log("\n  User's Due Feeds:");
        for (const item of userDueFeeds.slice(0, 3)) {
          console.log(`    - ${item.feed.name}`);
          console.log(`      Refresh Interval: ${item.refreshInterval} minutes`);
          console.log(`      Last Fetched: ${item.feed.lastFetched ? item.feed.lastFetched.toISOString() : 'Never'}`);
        }
      }
    } catch (error) {
      console.error("✗ Failed to get user's feeds due for refresh:", error);
    }
  }
  console.log();

  // 6. Test manual feed refresh
  console.log("6. Testing Manual Feed Refresh...");
  console.log("-".repeat(80));
  if (allFeeds.length > 0) {
    const testFeed = allFeeds[0];
    console.log(`Testing refresh for: ${testFeed.name}`);
    console.log(`URL: ${testFeed.url}`);
    
    try {
      const result = await refreshFeed(testFeed.id);
      console.log("✓ Refresh completed:");
      console.log(`  - Success: ${result.success}`);
      console.log(`  - New Articles: ${result.newArticles}`);
      console.log(`  - Updated Articles: ${result.updatedArticles}`);
      console.log(`  - Duration: ${result.duration}ms`);
      if (result.cleanupResult) {
        console.log(`  - Cleanup: ${result.cleanupResult.deleted} articles deleted`);
      }
      if (result.error) {
        console.log(`  - Error: ${result.error}`);
      }
      
      // Check updated feed
      const updatedFeed = await prisma.feed.findUnique({
        where: { id: testFeed.id },
        include: {
          _count: {
            select: { articles: true },
          },
        },
      });
      
      if (updatedFeed) {
        console.log("\n  Updated Feed Status:");
        console.log(`  - Last Fetched: ${updatedFeed.lastFetched?.toISOString()}`);
        console.log(`  - Total Articles: ${updatedFeed._count.articles}`);
        console.log(`  - Error Count: ${updatedFeed.errorCount}`);
      }
    } catch (error) {
      console.error("✗ Feed refresh failed:", error);
    }
  } else {
    console.log("⚠ No feeds to test");
  }
  console.log();

  // 7. Check recent articles
  console.log("7. Checking Recent Articles...");
  console.log("-".repeat(80));
  const recentArticles = await prisma.article.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      feed: {
        select: { name: true },
      },
    },
  });
  
  console.log(`✓ Recent articles: ${recentArticles.length}`);
  if (recentArticles.length > 0) {
    console.log("\nMost Recent Articles:");
    for (const article of recentArticles) {
      console.log(`  - ${article.title}`);
      console.log(`    Feed: ${article.feed.name}`);
      console.log(`    Created: ${article.createdAt.toISOString()}`);
      console.log(`    Published: ${article.publishedAt?.toISOString() || 'N/A'}`);
    }
  }
  console.log();

  console.log("=".repeat(80));
  console.log("DIAGNOSTIC TEST COMPLETE");
  console.log("=".repeat(80));
  console.log();
  console.log("Next Steps:");
  console.log("1. Check server logs for [Instrumentation] messages");
  console.log("2. Verify ENABLE_CRON_JOBS is not set to 'false' in .env");
  console.log("3. Restart the dev server to trigger instrumentation.ts");
  console.log("4. Use the admin API endpoints:");
  console.log("   - GET /api/admin/cron/status - Check cron status");
  console.log("   - POST /api/admin/cron/trigger - Manually trigger jobs");
  console.log();

  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

