/**
 * Test script to verify feed-parser migration from rss-parser to @rowanmanning/feed-parser
 * 
 * This script tests the migrated feed parser with various feed types to ensure
 * compatibility and correct parsing behavior.
 * 
 * Usage: npx tsx scripts/test-feed-parser-migration.ts
 */

import { parseFeedUrl, validateFeedUrl, normalizeFeedUrl, isSafeFeedUrl } from "@/lib/feed-parser";
import { prisma } from "@/lib/db";

/**
 * Test feed URLs covering different formats and edge cases
 */
const TEST_FEEDS = [
  {
    name: "RSS 2.0 Feed",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    expectedFormat: "RSS 2.0",
  },
  {
    name: "Atom Feed",
    url: "https://github.com/github/roadmap/commits/main.atom",
    expectedFormat: "Atom",
  },
  {
    name: "RSS with Content:Encoded",
    url: "https://xkcd.com/rss.xml",
    expectedFormat: "RSS 2.0",
  },
  {
    name: "RSS with Media",
    url: "https://www.reddit.com/r/programming/.rss",
    expectedFormat: "RSS 2.0",
  },
];

interface TestResult {
  feedName: string;
  url: string;
  passed: boolean;
  error?: string;
  details?: {
    title?: string;
    itemCount?: number;
    hasContent?: boolean;
    hasAuthors?: boolean;
    hasImages?: boolean;
    hasDates?: boolean;
  };
}

/**
 * Test URL safety validation
 */
async function testUrlSafety(): Promise<void> {
  console.log("\n🔒 Testing URL Safety Validation...");
  
  const testCases = [
    { url: "https://example.com/feed.xml", shouldPass: true, name: "HTTPS URL" },
    { url: "http://example.com/feed.xml", shouldPass: true, name: "HTTP URL" },
    { url: "ftp://example.com/feed.xml", shouldPass: false, name: "FTP URL" },
    { url: "javascript:alert(1)", shouldPass: false, name: "JavaScript URL" },
    { url: "http://localhost/feed.xml", shouldPass: false, name: "Localhost" },
    { url: "http://127.0.0.1/feed.xml", shouldPass: false, name: "Loopback IP" },
    { url: "http://10.0.0.1/feed.xml", shouldPass: false, name: "Private IP (10.x)" },
    { url: "http://192.168.1.1/feed.xml", shouldPass: false, name: "Private IP (192.168.x)" },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = isSafeFeedUrl(testCase.url);
    const testPassed = result === testCase.shouldPass;
    
    if (testPassed) {
      console.log(`  ✅ ${testCase.name}: ${result ? "Safe" : "Blocked"}`);
      passed++;
    } else {
      console.log(`  ❌ ${testCase.name}: Expected ${testCase.shouldPass}, got ${result}`);
      failed++;
    }
  }
  
  console.log(`\n  Safety Tests: ${passed} passed, ${failed} failed`);
}

/**
 * Test URL normalization
 */
async function testUrlNormalization(): Promise<void> {
  console.log("\n🔧 Testing URL Normalization...");
  
  const testCases = [
    {
      input: "https://example.com/feed.xml?utm_source=test&utm_campaign=test",
      expected: "https://example.com/feed.xml",
      name: "Remove tracking params",
    },
    {
      input: "https://example.com/feed.xml?id=123",
      expected: "https://example.com/feed.xml?id=123",
      name: "Keep non-tracking params",
    },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = normalizeFeedUrl(testCase.input);
    const testPassed = result === testCase.expected;
    
    if (testPassed) {
      console.log(`  ✅ ${testCase.name}`);
      passed++;
    } else {
      console.log(`  ❌ ${testCase.name}: Expected "${testCase.expected}", got "${result}"`);
      failed++;
    }
  }
  
  console.log(`\n  Normalization Tests: ${passed} passed, ${failed} failed`);
}

/**
 * Test feed parsing with sample feeds
 */
async function testFeedParsing(): Promise<TestResult[]> {
  console.log("\n📡 Testing Feed Parsing...");
  const results: TestResult[] = [];
  
  for (const testFeed of TEST_FEEDS) {
    console.log(`\n  Testing: ${testFeed.name}`);
    console.log(`  URL: ${testFeed.url}`);
    
    try {
      // Validate feed
      const isValid = await validateFeedUrl(testFeed.url);
      if (!isValid) {
        results.push({
          feedName: testFeed.name,
          url: testFeed.url,
          passed: false,
          error: "Feed validation failed",
        });
        console.log(`    ❌ Validation failed`);
        continue;
      }
      
      // Parse feed
      const parsed = await parseFeedUrl(testFeed.url);
      
      // Verify basic structure
      const hasTitle = !!parsed.title;
      const hasItems = parsed.items.length > 0;
      const firstItem = parsed.items[0];
      
      const hasContent = !!firstItem?.content;
      const hasAuthors = !!firstItem?.author;
      const hasImages = !!firstItem?.imageUrl || !!parsed.imageUrl;
      const hasDates = !!firstItem?.publishedAt;
      
      // Check for required fields
      const allChecks = hasTitle && hasItems && hasContent;
      
      results.push({
        feedName: testFeed.name,
        url: testFeed.url,
        passed: allChecks,
        details: {
          title: parsed.title,
          itemCount: parsed.items.length,
          hasContent,
          hasAuthors,
          hasImages,
          hasDates,
        },
      });
      
      // Log results
      console.log(`    ✅ Feed Title: ${parsed.title}`);
      console.log(`    ✅ Items: ${parsed.items.length}`);
      console.log(`    ${hasContent ? "✅" : "⚠️ "} Content: ${hasContent ? "Present" : "Missing"}`);
      console.log(`    ${hasAuthors ? "✅" : "⚠️ "} Authors: ${hasAuthors ? "Present" : "Missing"}`);
      console.log(`    ${hasImages ? "✅" : "⚠️ "} Images: ${hasImages ? "Present" : "Missing"}`);
      console.log(`    ${hasDates ? "✅" : "⚠️ "} Dates: ${hasDates ? "Present" : "Missing"}`);
      
      if (firstItem) {
        console.log(`\n    Sample Item:`);
        console.log(`      Title: ${firstItem.title}`);
        console.log(`      Link: ${firstItem.link}`);
        console.log(`      GUID: ${firstItem.guid || "N/A"}`);
        console.log(`      Author: ${firstItem.author || "N/A"}`);
        console.log(`      Published: ${firstItem.publishedAt || "N/A"}`);
        console.log(`      Content Length: ${firstItem.content?.length || 0} chars`);
        console.log(`      Excerpt: ${firstItem.excerpt?.substring(0, 100) || "N/A"}...`);
      }
      
    } catch (error) {
      results.push({
        feedName: testFeed.name,
        url: testFeed.url,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`    ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return results;
}

/**
 * Test with existing feeds from database
 */
async function testExistingFeeds(): Promise<TestResult[]> {
  console.log("\n💾 Testing Existing Database Feeds...");
  
  try {
    // Get a sample of feeds from database (max 5)
    const feeds = await prisma.feeds.findMany({
      take: 5,
      where: {
        errorCount: { lt: 5 }, // Only test feeds that aren't already problematic
      },
      orderBy: {
        lastFetched: "desc",
      },
    });
    
    if (feeds.length === 0) {
      console.log("  ⚠️  No feeds found in database");
      return [];
    }
    
    console.log(`  Found ${feeds.length} feeds to test\n`);
    const results: TestResult[] = [];
    
    for (const feed of feeds) {
      console.log(`  Testing: ${feed.name}`);
      console.log(`  URL: ${feed.url}`);
      
      try {
        const parsed = await parseFeedUrl(feed.url);
        
        const hasItems = parsed.items.length > 0;
        const firstItem = parsed.items[0];
        const hasContent = !!firstItem?.content;
        
        results.push({
          feedName: feed.name,
          url: feed.url,
          passed: hasItems && hasContent,
          details: {
            title: parsed.title,
            itemCount: parsed.items.length,
            hasContent,
            hasAuthors: !!firstItem?.author,
            hasImages: !!firstItem?.imageUrl || !!parsed.imageUrl,
            hasDates: !!firstItem?.publishedAt,
          },
        });
        
        console.log(`    ✅ Parsed successfully: ${parsed.items.length} items`);
        
      } catch (error) {
        results.push({
          feedName: feed.name,
          url: feed.url,
          passed: false,
          error: error instanceof Error ? error.message : String(error),
        });
        console.log(`    ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return results;
    
  } catch (error) {
    console.log(`  ❌ Database error: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log("🧪 Feed Parser Migration Test Suite");
  console.log("=" .repeat(60));
  
  try {
    // Test 1: URL Safety
    await testUrlSafety();
    
    // Test 2: URL Normalization
    await testUrlNormalization();
    
    // Test 3: Sample feed parsing
    const sampleResults = await testFeedParsing();
    
    // Test 4: Existing database feeds
    const dbResults = await testExistingFeeds();
    
    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Test Summary");
    console.log("=".repeat(60));
    
    const allResults = [...sampleResults, ...dbResults];
    const passed = allResults.filter(r => r.passed).length;
    const failed = allResults.filter(r => !r.passed).length;
    
    console.log(`\nTotal Feeds Tested: ${allResults.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log("\n❌ Failed Feeds:");
      allResults.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.feedName}: ${r.error}`);
      });
    }
    
    console.log("\n" + "=".repeat(60));
    
    if (failed === 0) {
      console.log("✅ All tests passed! Migration appears successful.");
      process.exit(0);
    } else {
      console.log("⚠️  Some tests failed. Please review the errors above.");
      process.exit(1);
    }
    
  } catch (error) {
    console.error("\n❌ Test suite error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
main();

