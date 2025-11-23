/**
 * Test script to verify default feeds subscription
 * 
 * Usage:
 *   npx tsx scripts/test-default-feeds.ts
 */

import { prisma } from "../src/lib/db";
import { subscribeUserToDefaultFeeds, DEFAULT_FEEDS } from "../src/lib/services/default-feeds-service";


async function testDefaultFeeds() {
  console.log("🧪 Testing Default Feeds Subscription\n");

  try {
    // Create a test user
    const testUserId = `test_user_${Date.now()}`;
    console.log(`Creating test user: ${testUserId}`);
    
    const testUser = await prisma.user.create({
      data: {
        id: testUserId,
        email: `test_${Date.now()}@neureed.com`,
        name: "Test User for Default Feeds",
        emailVerified: new Date(),
        // updatedAt is auto-managed by Prisma via @updatedAt directive
      },
    });

    console.log(`✅ Test user created: ${testUser.email}\n`);

    // Subscribe user to default feeds
    console.log("Subscribing user to default feeds...\n");
    await subscribeUserToDefaultFeeds(testUser.id);

    // Verify subscriptions
    console.log("\n📊 Verifying subscriptions...\n");
    
    const userFeeds = await prisma.user_feeds.findMany({
      where: { userId: testUser.id },
      include: {
        feeds: true,
      },
    });

    console.log(`✅ User is subscribed to ${userFeeds.length} feeds\n`);

    // Check each default feed
    console.log("Checking default feeds:\n");
    for (const defaultFeed of DEFAULT_FEEDS) {
      const subscription = userFeeds.find(
        (uf) => uf.feeds.url === defaultFeed.url
      );
      
      if (subscription) {
        console.log(`✅ ${defaultFeed.name} - Subscribed`);
      } else {
        console.log(`❌ ${defaultFeed.name} - NOT subscribed`);
      }
    }

    console.log("\n📋 Subscription details:\n");
    userFeeds.forEach((uf) => {
      console.log(`  - ${uf.feeds.name} (${uf.feeds.url})`);
    });

    // Test idempotency - try subscribing again
    console.log("\n🔄 Testing idempotency (subscribing again)...\n");
    await subscribeUserToDefaultFeeds(testUser.id);

    const userFeedsAfter = await prisma.user_feeds.findMany({
      where: { userId: testUser.id },
    });

    if (userFeedsAfter.length === userFeeds.length) {
      console.log("✅ Idempotency test passed - no duplicate subscriptions");
    } else {
      console.log(
        `❌ Idempotency test failed - expected ${userFeeds.length}, got ${userFeedsAfter.length}`
      );
    }

    // Cleanup test user
    console.log("\n🧹 Cleaning up test data...");
    await prisma.user_feeds.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    console.log("✅ Test data cleaned up");

    console.log("\n🎉 All tests passed!\n");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  }
}

testDefaultFeeds()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

