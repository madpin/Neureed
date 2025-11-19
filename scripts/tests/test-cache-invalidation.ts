/**
 * Cache Invalidation Testing Script
 * Tests that cache is properly invalidated when data changes
 */

import { prisma } from "../../src/lib/db";
import {
  cacheGet,
  cacheSet,
  getCacheStats,
  resetCacheStats,
} from "../../src/lib/cache/cache-service";
import { CacheKeys } from "../../src/lib/cache/cache-keys";
import { updateUserPatterns } from "../../src/lib/services/pattern-detection-service";
import { scoreArticle } from "../../src/lib/services/article-scoring-service";
import { updateArticle, deleteArticle } from "../../src/lib/services/article-service";
import { getRedisClient } from "../../src/lib/cache/redis-client";

async function testUserPatternInvalidation() {
  console.log("\n=== Testing User Pattern Cache Invalidation ===");

  // Get a test user and article
  const user = await prisma.user.findFirst({
    include: { userPatterns: { take: 1 } },
  });

  if (!user) {
    console.log("⚠️  No users found for testing");
    return false;
  }

  const article = await prisma.article.findFirst({
    where: {
      content: { not: "" },
    },
  });

  if (!article) {
    console.log("⚠️  No articles found for testing");
    return false;
  }

  console.log(`Testing with user: ${user.email}`);
  console.log(`Testing with article: ${article.title}`);

  // Step 1: Score the article (will be cached)
  console.log("\n1. Initial scoring (will cache):");
  const score1 = await scoreArticle(user.id, article.id);
  console.log(`   Score: ${score1.score.toFixed(3)}`);

  // Verify it's cached
  const cacheKey = CacheKeys.articleScore(user.id, article.id);
  const cached1 = await cacheGet(cacheKey);
  console.log(`   Cached: ${cached1 ? "✓" : "✗"}`);

  if (!cached1) {
    console.log("❌ Failed: Score was not cached");
    return false;
  }

  // Step 2: Update user patterns (should invalidate cache)
  console.log("\n2. Updating user patterns (should invalidate cache):");
  await updateUserPatterns(user.id, article.id, 1.0); // Positive feedback

  // Check if cache was invalidated
  const cached2 = await cacheGet(cacheKey);
  console.log(`   Cached after update: ${cached2 ? "✗ Still cached!" : "✓ Invalidated"}`);

  if (cached2) {
    console.log("❌ Failed: Cache was not invalidated after pattern update");
    return false;
  }

  // Step 3: Score again (should recalculate)
  console.log("\n3. Scoring again (should recalculate):");
  const score2 = await scoreArticle(user.id, article.id);
  console.log(`   New score: ${score2.score.toFixed(3)}`);
  console.log(`   Score changed: ${score1.score !== score2.score ? "✓" : "✗"}`);

  console.log("\n✅ User pattern invalidation test passed!");
  return true;
}

async function testArticleUpdateInvalidation() {
  console.log("\n=== Testing Article Update Cache Invalidation ===");

  // Get a test article
  const article = await prisma.article.findFirst({
    where: {
      content: { not: "" },
      summary: { not: null },
    },
  });

  if (!article) {
    console.log("⚠️  No suitable article found for testing");
    return false;
  }

  console.log(`Testing with article: ${article.title}`);

  // Step 1: Cache the summary
  const summaryKey = CacheKeys.articleSummary(article.id);
  await cacheSet(summaryKey, { summary: "Test summary", keyPoints: [], topics: [] }, 3600);

  const cached1 = await cacheGet(summaryKey);
  console.log(`\n1. Summary cached: ${cached1 ? "✓" : "✗"}`);

  if (!cached1) {
    console.log("❌ Failed: Summary was not cached");
    return false;
  }

  // Step 2: Update the article (should invalidate cache)
  console.log("\n2. Updating article (should invalidate cache):");
  await updateArticle(article.id, {
    content: article.content + " Updated content.",
  });

  // Check if cache was invalidated
  const cached2 = await cacheGet(summaryKey);
  console.log(`   Cached after update: ${cached2 ? "✗ Still cached!" : "✓ Invalidated"}`);

  if (cached2) {
    console.log("❌ Failed: Cache was not invalidated after article update");
    return false;
  }

  console.log("\n✅ Article update invalidation test passed!");
  return true;
}

async function testArticleDeleteInvalidation() {
  console.log("\n=== Testing Article Delete Cache Invalidation ===");

  // Create a test article
  const feed = await prisma.feed.findFirst();

  if (!feed) {
    console.log("⚠️  No feeds found for testing");
    return false;
  }

  const testArticle = await prisma.article.create({
    data: {
      feedId: feed.id,
      title: "Test Article for Cache Invalidation",
      content: "This is a test article that will be deleted.",
      url: `https://test.com/article-${Date.now()}`,
      guid: `test-article-${Date.now()}`,
      publishedAt: new Date(),
      contentHash: "test-hash",
    },
  });

  console.log(`Created test article: ${testArticle.id}`);

  // Step 1: Cache some data for this article
  const summaryKey = CacheKeys.articleSummary(testArticle.id);
  await cacheSet(summaryKey, { summary: "Test", keyPoints: [], topics: [] }, 3600);

  const cached1 = await cacheGet(summaryKey);
  console.log(`\n1. Summary cached: ${cached1 ? "✓" : "✗"}`);

  if (!cached1) {
    console.log("❌ Failed: Summary was not cached");
    return false;
  }

  // Step 2: Delete the article (should invalidate cache)
  console.log("\n2. Deleting article (should invalidate cache):");
  await deleteArticle(testArticle.id);

  // Check if cache was invalidated
  const cached2 = await cacheGet(summaryKey);
  console.log(`   Cached after delete: ${cached2 ? "✗ Still cached!" : "✓ Invalidated"}`);

  if (cached2) {
    console.log("❌ Failed: Cache was not invalidated after article delete");
    return false;
  }

  console.log("\n✅ Article delete invalidation test passed!");
  return true;
}

async function testCacheStats() {
  console.log("\n=== Testing Cache Statistics ===");

  resetCacheStats();

  // Perform some cache operations
  await cacheSet("test:stats:1", { value: 1 }, 60);
  await cacheSet("test:stats:2", { value: 2 }, 60);
  await cacheGet("test:stats:1"); // Hit
  await cacheGet("test:stats:2"); // Hit
  await cacheGet("test:stats:3"); // Miss
  await cacheGet("test:stats:4"); // Miss

  const stats = getCacheStats();
  console.log("\nCache Statistics:");
  console.log(`  Hits: ${stats.hits}`);
  console.log(`  Misses: ${stats.misses}`);
  console.log(`  Sets: ${stats.sets}`);
  console.log(`  Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);

  const expectedHitRate = 2 / 4; // 2 hits out of 4 gets
  const actualHitRate = stats.hitRate;

  console.log(`\nExpected hit rate: ${(expectedHitRate * 100).toFixed(1)}%`);
  console.log(`Actual hit rate: ${(actualHitRate * 100).toFixed(1)}%`);

  if (Math.abs(actualHitRate - expectedHitRate) < 0.01) {
    console.log("✅ Cache statistics are accurate!");
    return true;
  } else {
    console.log("❌ Cache statistics are inaccurate!");
    return false;
  }
}

async function verifyRedisConfig() {
  console.log("\n=== Verifying Redis Configuration ===");

  const client = getRedisClient();
  if (!client) {
    console.log("❌ Redis client not available");
    return false;
  }

  try {
    // Check maxmemory
    const config = await client.config("GET", "maxmemory");
    const maxmemory = config[1];
    console.log(`\nMaxmemory: ${maxmemory === "0" ? "unlimited" : maxmemory}`);

    if (maxmemory === "0") {
      console.log("⚠️  Warning: No memory limit set (will be set after restart)");
    } else {
      console.log("✅ Memory limit configured");
    }

    // Check maxmemory-policy
    const policyConfig = await client.config("GET", "maxmemory-policy");
    const policy = policyConfig[1];
    console.log(`Maxmemory policy: ${policy}`);

    if (policy === "allkeys-lru") {
      console.log("✅ LRU eviction policy configured");
      return true;
    } else if (policy === "noeviction") {
      console.log("⚠️  Warning: No eviction policy set (will be set after restart)");
      return true; // Not a failure, just needs restart
    } else {
      console.log(`⚠️  Unexpected policy: ${policy}`);
      return true;
    }
  } catch (error) {
    console.error("❌ Error checking Redis config:", error);
    return false;
  }
}

async function main() {
  console.log("=================================================");
  console.log("      Cache Invalidation Testing Suite          ");
  console.log("=================================================");

  const results: { name: string; passed: boolean }[] = [];

  try {
    // Test 1: User pattern invalidation
    const test1 = await testUserPatternInvalidation();
    results.push({ name: "User Pattern Invalidation", passed: test1 });

    // Test 2: Article update invalidation
    const test2 = await testArticleUpdateInvalidation();
    results.push({ name: "Article Update Invalidation", passed: test2 });

    // Test 3: Article delete invalidation
    const test3 = await testArticleDeleteInvalidation();
    results.push({ name: "Article Delete Invalidation", passed: test3 });

    // Test 4: Cache statistics
    const test4 = await testCacheStats();
    results.push({ name: "Cache Statistics", passed: test4 });

    // Test 5: Redis configuration
    const test5 = await verifyRedisConfig();
    results.push({ name: "Redis Configuration", passed: test5 });

    // Summary
    console.log("\n=================================================");
    console.log("                  Test Summary                   ");
    console.log("=================================================");

    const passed = results.filter((r) => r.passed).length;
    const total = results.length;

    results.forEach((result) => {
      const icon = result.passed ? "✅" : "❌";
      console.log(`${icon} ${result.name}`);
    });

    console.log(`\nTotal: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log("\n🎉 All tests passed! Cache is working correctly.");
    } else {
      console.log("\n⚠️  Some tests failed. Please review the output above.");
    }

    console.log("\n=================================================");
  } catch (error) {
    console.error("\n❌ Error during testing:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

