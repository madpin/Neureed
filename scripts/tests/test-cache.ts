/**
 * Cache Testing Script
 * Tests Redis cache functionality and identifies issues
 */

import { prisma } from "../../src/lib/db";
import {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheGetMany,
  cacheSetMany,
  getCacheStats,
  resetCacheStats,
  cacheGetOrSet,
} from "../../src/lib/cache/cache-service";
import { getRedisClient, isRedisAvailable, getRedisStatus } from "../../src/lib/cache/redis-client";
import { CacheKeys, CacheTTL } from "../../src/lib/cache/cache-keys";
import { summarizeArticle } from "../../src/lib/services/summarization-service";
import { scoreArticle, scoreArticleBatch } from "../../src/lib/services/article-scoring-service";
import { logger } from "../../src/lib/logger";

async function testRedisConnection() {
  console.log("\n=== Testing Redis Connection ===");
  
  const status = getRedisStatus();
  console.log("Redis Status:", status);
  
  const available = await isRedisAvailable();
  console.log("Redis Available:", available);
  
  const client = getRedisClient();
  console.log("Redis Client:", client ? "Connected" : "Not connected");
  
  if (client) {
    try {
      const info = await client.info("server");
      console.log("Redis Server Info:", info.split("\r\n").slice(0, 5).join("\n"));
    } catch (error) {
      console.error("Error getting Redis info:", error);
    }
  }
}

async function testBasicCacheOperations() {
  console.log("\n=== Testing Basic Cache Operations ===");
  
  // Reset stats
  resetCacheStats();
  
  // Test 1: Set and Get
  console.log("\n1. Testing cacheSet and cacheGet:");
  const testKey = "test:basic:key";
  const testValue = { foo: "bar", timestamp: Date.now() };
  
  const setResult = await cacheSet(testKey, testValue, 60);
  console.log("  Set result:", setResult);
  
  const getValue = await cacheGet(testKey);
  console.log("  Get result:", getValue);
  console.log("  Values match:", JSON.stringify(getValue) === JSON.stringify(testValue));
  
  // Test 2: Get non-existent key
  console.log("\n2. Testing cache miss:");
  const missValue = await cacheGet("test:nonexistent:key");
  console.log("  Miss result:", missValue);
  
  // Test 3: Delete
  console.log("\n3. Testing cacheDelete:");
  const deleteResult = await cacheDelete(testKey);
  console.log("  Delete result:", deleteResult);
  
  const afterDelete = await cacheGet(testKey);
  console.log("  After delete:", afterDelete);
  
  // Test 4: Batch operations
  console.log("\n4. Testing batch operations:");
  const batchEntries = [
    { key: "test:batch:1", value: { id: 1 }, ttl: 60 },
    { key: "test:batch:2", value: { id: 2 }, ttl: 60 },
    { key: "test:batch:3", value: { id: 3 }, ttl: 60 },
  ];
  
  const batchSetResult = await cacheSetMany(batchEntries);
  console.log("  Batch set result:", batchSetResult);
  
  const batchGetResult = await cacheGetMany(["test:batch:1", "test:batch:2", "test:batch:3"]);
  console.log("  Batch get result:", batchGetResult);
  
  // Test 5: cacheGetOrSet
  console.log("\n5. Testing cacheGetOrSet:");
  let fetchCount = 0;
  const fetchFn = async () => {
    fetchCount++;
    return { fetched: true, count: fetchCount };
  };
  
  const firstCall = await cacheGetOrSet("test:getorset:key", fetchFn, 60);
  console.log("  First call (should fetch):", firstCall, "Fetch count:", fetchCount);
  
  const secondCall = await cacheGetOrSet("test:getorset:key", fetchFn, 60);
  console.log("  Second call (should use cache):", secondCall, "Fetch count:", fetchCount);
  
  // Show stats
  const stats = getCacheStats();
  console.log("\nCache Stats:", stats);
}

async function testArticleSummarizationCache() {
  console.log("\n=== Testing Article Summarization Cache ===");
  
  // Get a test article
  const article = await prisma.articles.findFirst({
    where: {
      content: { not: null },
    },
    select: { id: true, title: true },
  });
  
  if (!article) {
    console.log("No articles found for testing");
    return;
  }
  
  console.log(`Testing with article: ${article.title}`);
  
  // Check if summary is cached
  const cacheKey = CacheKeys.articleSummary(article.id);
  console.log(`Cache key: ${cacheKey}`);
  
  const cachedBefore = await cacheGet(cacheKey);
  console.log("Cached before:", cachedBefore ? "Yes" : "No");
  
  // Clear cache for this article
  await cacheDelete(cacheKey);
  
  // First call - should generate and cache
  console.log("\nFirst call (should generate):");
  const startTime1 = Date.now();
  try {
    const summary1 = await summarizeArticle(article.id);
    const duration1 = Date.now() - startTime1;
    console.log("  Duration:", duration1, "ms");
    console.log("  Summary length:", summary1.summary.length);
    console.log("  Key points:", summary1.keyPoints.length);
    
    // Second call - should use cache
    console.log("\nSecond call (should use cache):");
    const startTime2 = Date.now();
    const summary2 = await summarizeArticle(article.id);
    const duration2 = Date.now() - startTime2;
    console.log("  Duration:", duration2, "ms");
    console.log("  Summary length:", summary2.summary.length);
    console.log("  Speed improvement:", Math.round(duration1 / duration2), "x faster");
    
    // Verify cache was used
    const cachedAfter = await cacheGet(cacheKey);
    console.log("\nCached after:", cachedAfter ? "Yes" : "No");
    
  } catch (error) {
    console.error("Error during summarization test:", error);
  }
}

async function testArticleScoringCache() {
  console.log("\n=== Testing Article Scoring Cache ===");
  
  // Get a test user with patterns
  const user = await prisma.user.findFirst({
    include: {
      patterns: { take: 5 },
    },
  });
  
  if (!user) {
    console.log("No users found for testing");
    return;
  }
  
  console.log(`Testing with user: ${user.email}`);
  console.log(`User has ${user.patterns.length} patterns`);
  
  // Get some articles
  const articles = await prisma.articles.findMany({
    take: 5,
    select: { id: true, title: true },
  });
  
  if (articles.length === 0) {
    console.log("No articles found for testing");
    return;
  }
  
  console.log(`Testing with ${articles.length} articles`);
  
  // Clear cache for these articles
  for (const article of articles) {
    await cacheDelete(CacheKeys.articleScore(user.id, article.id));
  }
  
  // Test single article scoring
  console.log("\n1. Single article scoring:");
  const testArticle = articles[0];
  
  const startTime1 = Date.now();
  const score1 = await scoreArticle(user.id, testArticle.id);
  const duration1 = Date.now() - startTime1;
  console.log(`  First call: ${duration1}ms - Score: ${score1.score.toFixed(3)}`);
  
  const startTime2 = Date.now();
  const score2 = await scoreArticle(user.id, testArticle.id);
  const duration2 = Date.now() - startTime2;
  console.log(`  Second call: ${duration2}ms - Score: ${score2.score.toFixed(3)}`);
  console.log(`  Speed improvement: ${Math.round(duration1 / duration2)}x faster`);
  
  // Test batch scoring
  console.log("\n2. Batch article scoring:");
  const articleIds = articles.map(a => a.id);
  
  // Clear cache
  for (const id of articleIds) {
    await cacheDelete(CacheKeys.articleScore(user.id, id));
  }
  
  const startTime3 = Date.now();
  const scores1 = await scoreArticleBatch(user.id, articleIds);
  const duration3 = Date.now() - startTime3;
  console.log(`  First batch call: ${duration3}ms - Scored ${scores1.size} articles`);
  
  const startTime4 = Date.now();
  const scores2 = await scoreArticleBatch(user.id, articleIds);
  const duration4 = Date.now() - startTime4;
  console.log(`  Second batch call: ${duration4}ms - Scored ${scores2.size} articles`);
  console.log(`  Speed improvement: ${Math.round(duration3 / duration4)}x faster`);
}

async function testCacheInvalidation() {
  console.log("\n=== Testing Cache Invalidation ===");
  
  // This test checks if cache is properly invalidated when data changes
  const user = await prisma.user.findFirst();
  
  if (!user) {
    console.log("No users found for testing");
    return;
  }
  
  const article = await prisma.articles.findFirst();
  
  if (!article) {
    console.log("No articles found for testing");
    return;
  }
  
  // Score an article (will be cached)
  const cacheKey = CacheKeys.articleScore(user.id, article.id);
  const score1 = await scoreArticle(user.id, article.id);
  console.log("Initial score:", score1.score.toFixed(3));
  
  // Check cache
  const cached = await cacheGet(cacheKey);
  console.log("Is cached:", cached ? "Yes" : "No");
  
  // Simulate pattern update (this should invalidate cache)
  console.log("\nNote: Currently, cache invalidation when patterns change is NOT implemented");
  console.log("This is a potential issue that needs to be addressed");
}

async function testCacheKeyCollisions() {
  console.log("\n=== Testing Cache Key Collisions ===");
  
  // Test if cache keys are unique enough
  const user1 = "user1";
  const user2 = "user2";
  const article1 = "article1";
  const article2 = "article2";
  
  const keys = [
    CacheKeys.articleScore(user1, article1),
    CacheKeys.articleScore(user1, article2),
    CacheKeys.articleScore(user2, article1),
    CacheKeys.articleScore(user2, article2),
    CacheKeys.userPatterns(user1),
    CacheKeys.userPatterns(user2),
    CacheKeys.articleSummary(article1),
    CacheKeys.articleSummary(article2),
  ];
  
  console.log("Generated keys:");
  keys.forEach(key => console.log(`  ${key}`));
  
  const uniqueKeys = new Set(keys);
  console.log(`\nUnique keys: ${uniqueKeys.size}/${keys.length}`);
  console.log("No collisions:", uniqueKeys.size === keys.length ? "✓" : "✗");
}

async function analyzeCurrentCacheUsage() {
  console.log("\n=== Analyzing Current Cache Usage ===");
  
  const client = getRedisClient();
  if (!client) {
    console.log("Redis client not available");
    return;
  }
  
  try {
    // Get all keys
    const allKeys = await client.keys("*");
    console.log(`Total keys in cache: ${allKeys.length}`);
    
    // Group by prefix
    const keysByPrefix = new Map<string, number>();
    for (const key of allKeys) {
      const prefix = key.split(":")[0];
      keysByPrefix.set(prefix, (keysByPrefix.get(prefix) || 0) + 1);
    }
    
    console.log("\nKeys by prefix:");
    for (const [prefix, count] of Array.from(keysByPrefix.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${prefix}: ${count}`);
    }
    
    // Check TTLs
    console.log("\nSample TTLs:");
    for (const key of allKeys.slice(0, 5)) {
      const ttl = await client.ttl(key);
      console.log(`  ${key}: ${ttl}s (${Math.round(ttl / 60)} minutes)`);
    }
    
    // Get memory usage
    const memory = await client.info("memory");
    const usedMemory = memory.match(/used_memory_human:([^\r\n]+)/)?.[1];
    console.log(`\nMemory usage: ${usedMemory}`);
    
  } catch (error) {
    console.error("Error analyzing cache:", error);
  }
}

async function identifyIssues() {
  console.log("\n=== Identifying Cache Issues ===");
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Issue 1: Check if cache invalidation is implemented
  console.log("\n1. Cache Invalidation:");
  const hasInvalidation = false; // We know this from code review
  if (!hasInvalidation) {
    issues.push("Cache is NOT invalidated when user patterns are updated");
    recommendations.push("Add cache invalidation in updateUserPatterns() function");
    recommendations.push("Use InvalidationPatterns.userScores(userId) to clear affected scores");
  }
  
  // Issue 2: Check cache stats
  const stats = getCacheStats();
  console.log("\n2. Cache Hit Rate:");
  console.log(`  Hits: ${stats.hits}`);
  console.log(`  Misses: ${stats.misses}`);
  console.log(`  Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
  
  if (stats.hitRate < 0.3 && stats.hits + stats.misses > 100) {
    issues.push(`Low cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
    recommendations.push("Review cache TTL values - they might be too short");
    recommendations.push("Check if cache keys are being generated consistently");
  }
  
  // Issue 3: Check if Redis is properly configured
  const status = getRedisStatus();
  console.log("\n3. Redis Configuration:");
  console.log(`  Enabled: ${status.enabled}`);
  console.log(`  Connected: ${status.connected}`);
  
  if (!status.enabled || !status.connected) {
    issues.push("Redis is not properly configured or connected");
    recommendations.push("Check REDIS_URL and CACHE_ENABLED environment variables");
  }
  
  // Issue 4: Check for potential memory issues
  const client = getRedisClient();
  if (client) {
    try {
      const info = await client.info("memory");
      const maxMemory = info.match(/maxmemory:(\d+)/)?.[1];
      if (maxMemory === "0") {
        issues.push("Redis has no maxmemory limit set");
        recommendations.push("Set maxmemory and maxmemory-policy in Redis config");
        recommendations.push("Recommended: maxmemory 256mb, maxmemory-policy allkeys-lru");
      }
    } catch (error) {
      console.error("Error checking Redis memory config:", error);
    }
  }
  
  // Summary
  console.log("\n=== Summary ===");
  if (issues.length === 0) {
    console.log("✓ No major issues found!");
  } else {
    console.log(`\n⚠️  Found ${issues.length} issue(s):`);
    issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
    
    console.log(`\n💡 Recommendations:`);
    recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`));
  }
}

async function main() {
  console.log("=================================================");
  console.log("         Redis Cache Testing & Analysis         ");
  console.log("=================================================");
  
  try {
    await testRedisConnection();
    await testBasicCacheOperations();
    await testCacheKeyCollisions();
    await analyzeCurrentCacheUsage();
    
    // These tests require actual data and LLM access
    // Uncomment if you want to run them
    // await testArticleSummarizationCache();
    // await testArticleScoringCache();
    // await testCacheInvalidation();
    
    await identifyIssues();
    
    console.log("\n=================================================");
    console.log("                Test Complete                    ");
    console.log("=================================================");
    
  } catch (error) {
    console.error("\n❌ Error during testing:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

