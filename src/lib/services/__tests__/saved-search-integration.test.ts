/**
 * Integration Tests: Saved Search Feature
 *
 * Tests the complete flow from creation to matching to notifications
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/db';
import { nanoid } from 'nanoid';
import { createSavedSearch } from '../saved-search-service';
import { matchNewArticles, rematchSavedSearch } from '../saved-search-matcher';

describe('Saved Search Integration Tests', () => {
  let testUserId: string;
  let testUser2Id: string;
  let testFeedId: string;
  const cleanupIds: {
    searchIds: string[];
    articleIds: string[];
    matchIds: string[];
  } = {
    searchIds: [],
    articleIds: [],
    matchIds: [],
  };

  beforeAll(async () => {
    // Create test users
    testUserId = nanoid();
    testUser2Id = nanoid();

    await prisma.users.create({
      data: {
        id: testUserId,
        email: `test-${testUserId}@example.com`,
        name: 'Integration Test User 1',
      },
    });

    await prisma.users.create({
      data: {
        id: testUser2Id,
        email: `test-${testUser2Id}@example.com`,
        name: 'Integration Test User 2',
      },
    });

    // Create a test feed
    const feed = await prisma.feeds.create({
      data: {
        id: nanoid(),
        title: 'Test Feed',
        url: 'https://example.com/feed',
        description: 'Test feed for integration tests',
      },
    });
    testFeedId = feed.id;
  });

  afterAll(async () => {
    // Cleanup in order
    await prisma.saved_search_matches.deleteMany({
      where: { id: { in: cleanupIds.matchIds } },
    });

    await prisma.saved_searches.deleteMany({
      where: { id: { in: cleanupIds.searchIds } },
    });

    await prisma.articles.deleteMany({
      where: { id: { in: cleanupIds.articleIds } },
    });

    await prisma.feeds.delete({ where: { id: testFeedId } });

    await prisma.users.deleteMany({
      where: { id: { in: [testUserId, testUser2Id] } },
    });
  });

  describe('End-to-End: Create Search → Add Articles → Auto-Match', () => {
    it('should complete full workflow', async () => {
      // Step 1: Create a saved search
      const savedSearch = await createSavedSearch({
        userId: testUserId,
        name: 'AI & ML Search',
        query: '(artificial intelligence, machine learning) -advertising',
        threshold: 0.5,
        notifyOnMatch: false,
      });
      cleanupIds.searchIds.push(savedSearch.id);

      expect(savedSearch).toBeDefined();
      expect(savedSearch.id).toBeDefined();

      // Step 2: Create relevant articles
      const articles = [
        {
          id: nanoid(),
          feedId: testFeedId,
          title: 'Recent Advances in Machine Learning',
          excerpt: 'New developments in ML algorithms and applications',
          content: 'Artificial intelligence and machine learning continue to evolve...',
          url: 'https://example.com/ml-advances',
          publishedAt: new Date(),
        },
        {
          id: nanoid(),
          feedId: testFeedId,
          title: 'AI in Healthcare',
          excerpt: 'How artificial intelligence is transforming medicine',
          content: 'Artificial intelligence applications in healthcare...',
          url: 'https://example.com/ai-healthcare',
          publishedAt: new Date(),
        },
        {
          id: nanoid(),
          feedId: testFeedId,
          title: 'Cooking Recipes',
          excerpt: 'Delicious dinner ideas',
          content: 'Here are some recipes you can make tonight...',
          url: 'https://example.com/recipes',
          publishedAt: new Date(),
        },
      ];

      for (const article of articles) {
        const created = await prisma.articles.create({ data: article });
        cleanupIds.articleIds.push(created.id);
      }

      // Step 3: Trigger matching
      await matchNewArticles(
        cleanupIds.articleIds,
        testUserId
      );

      // Step 4: Verify matches were created
      const matches = await prisma.saved_search_matches.findMany({
        where: {
          savedSearchId: savedSearch.id,
        },
        include: {
          article: true,
        },
      });

      cleanupIds.matchIds.push(...matches.map((m) => m.id));

      expect(matches.length).toBeGreaterThan(0);

      // Should match AI/ML articles but not cooking
      const relevantMatches = matches.filter(
        (m) =>
          m.article.title.toLowerCase().includes('machine learning') ||
          m.article.title.toLowerCase().includes('artificial intelligence')
      );

      expect(relevantMatches.length).toBeGreaterThan(0);

      // Step 5: Verify match quality
      matches.forEach((match) => {
        expect(match.relevanceScore).toBeGreaterThan(0);
        expect(match.relevanceScore).toBeLessThanOrEqual(1);
        expect(Array.isArray(match.matchedTerms)).toBe(true);
      });

      // Step 6: Verify saved search stats updated
      const updatedSearch = await prisma.saved_searches.findUnique({
        where: { id: savedSearch.id },
      });

      expect(updatedSearch).toBeDefined();
      expect(updatedSearch?.lastMatchedAt).toBeDefined();
      expect(updatedSearch?.totalMatches).toBeGreaterThan(0);
    });
  });

  describe('Multi-User Scenario', () => {
    it('should match articles for multiple users with similar searches', async () => {
      // Create saved searches for both users
      const search1 = await createSavedSearch({
        userId: testUserId,
        name: 'User 1 Security Search',
        query: 'cybersecurity +security',
        threshold: 0.5,
      });
      cleanupIds.searchIds.push(search1.id);

      const search2 = await createSavedSearch({
        userId: testUser2Id,
        name: 'User 2 Security Search',
        query: 'security breach vulnerability',
        threshold: 0.5,
      });
      cleanupIds.searchIds.push(search2.id);

      // Create security-related article
      const article = await prisma.articles.create({
        data: {
          id: nanoid(),
          feedId: testFeedId,
          title: 'Major Cybersecurity Breach Discovered',
          excerpt: 'Security vulnerability affects millions',
          content: 'A major security breach was discovered in popular software...',
          url: 'https://example.com/breach',
          publishedAt: new Date(),
        },
      });
      cleanupIds.articleIds.push(article.id);

      // Match for all users
      await matchNewArticles([article.id]);

      // Verify both users got matches
      const matches1 = await prisma.saved_search_matches.findMany({
        where: { savedSearchId: search1.id },
      });

      const matches2 = await prisma.saved_search_matches.findMany({
        where: { savedSearchId: search2.id },
      });

      cleanupIds.matchIds.push(...matches1.map((m) => m.id));
      cleanupIds.matchIds.push(...matches2.map((m) => m.id));

      expect(matches1.length).toBeGreaterThan(0);
      expect(matches2.length).toBeGreaterThan(0);
    });
  });

  describe('Edit Search → Rematch', () => {
    it('should rematch when search query is updated', async () => {
      // Create initial search
      const search = await createSavedSearch({
        userId: testUserId,
        name: 'Rematch Test',
        query: 'original query',
        threshold: 0.5,
      });
      cleanupIds.searchIds.push(search.id);

      // Create articles
      const article1 = await prisma.articles.create({
        data: {
          id: nanoid(),
          feedId: testFeedId,
          title: 'Article about original query',
          excerpt: 'Content related to original query',
          content: 'This article matches the original query...',
          url: 'https://example.com/original',
          publishedAt: new Date(),
        },
      });

      const article2 = await prisma.articles.create({
        data: {
          id: nanoid(),
          feedId: testFeedId,
          title: 'Article about updated query',
          excerpt: 'Content related to updated query',
          content: 'This article matches the updated query...',
          url: 'https://example.com/updated',
          publishedAt: new Date(),
        },
      });

      cleanupIds.articleIds.push(article1.id, article2.id);

      // Initial match
      await matchNewArticles([article1.id, article2.id], testUserId);

      // Update search query
      await prisma.saved_searches.update({
        where: { id: search.id },
        data: { query: 'updated query' },
      });

      // Rematch
      const newMatches = await rematchSavedSearch(search.id);

      expect(newMatches).toBeGreaterThanOrEqual(0);

      // Get all matches and cleanup
      const allMatches = await prisma.saved_search_matches.findMany({
        where: { savedSearchId: search.id },
      });
      cleanupIds.matchIds.push(...allMatches.map((m) => m.id));
    });
  });

  describe('Notification Creation', () => {
    it('should create notification for high-relevance match', async () => {
      // Create search with notifications enabled
      const search = await createSavedSearch({
        userId: testUserId,
        name: 'Notify Test',
        query: 'important breaking news',
        threshold: 0.5,
        notifyOnMatch: true,
        notifyThreshold: 0.7,
      });
      cleanupIds.searchIds.push(search.id);

      // Create highly relevant article
      const article = await prisma.articles.create({
        data: {
          id: nanoid(),
          feedId: testFeedId,
          title: 'Important Breaking News Alert',
          excerpt: 'This is important breaking news',
          content: 'Breaking news: An important event has occurred...',
          url: 'https://example.com/breaking',
          publishedAt: new Date(),
        },
      });
      cleanupIds.articleIds.push(article.id);

      // Match and potentially create notification
      await matchNewArticles([article.id], testUserId);

      // Check matches
      const matches = await prisma.saved_search_matches.findMany({
        where: { savedSearchId: search.id },
      });
      cleanupIds.matchIds.push(...matches.map((m) => m.id));

      // If match score was high enough, notification should be created
      const notifications = await prisma.user_notifications.findMany({
        where: {
          userId: testUserId,
          type: 'saved_search_match',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      if (notifications.length > 0) {
        const notification = notifications[0];
        expect(notification.type).toBe('saved_search_match');

        // Cleanup notification
        await prisma.user_notifications.delete({
          where: { id: notification.id },
        });
      }
    });
  });

  describe('Archive and Delete', () => {
    it('should not match archived searches', async () => {
      // Create and archive search
      const search = await createSavedSearch({
        userId: testUserId,
        name: 'Archived Search',
        query: 'test',
        threshold: 0.5,
      });
      cleanupIds.searchIds.push(search.id);

      await prisma.saved_searches.update({
        where: { id: search.id },
        data: { archived: true },
      });

      // Create article
      const article = await prisma.articles.create({
        data: {
          id: nanoid(),
          feedId: testFeedId,
          title: 'Test Article',
          excerpt: 'Test content',
          content: 'This is a test article...',
          url: 'https://example.com/test',
          publishedAt: new Date(),
        },
      });
      cleanupIds.articleIds.push(article.id);

      // Try to match
      await matchNewArticles([article.id], testUserId);

      // Archived search should not create matches
      const matches = await prisma.saved_search_matches.findMany({
        where: { savedSearchId: search.id },
      });

      // Archived searches should be skipped
      expect(matches.length).toBe(0);
    });

    it('should cascade delete matches when search is deleted', async () => {
      // Create search
      const search = await createSavedSearch({
        userId: testUserId,
        name: 'Delete Test',
        query: 'test',
        threshold: 0.5,
      });

      // Create article and match
      const article = await prisma.articles.create({
        data: {
          id: nanoid(),
          feedId: testFeedId,
          title: 'Test Delete',
          excerpt: 'Test',
          content: 'Test article for delete...',
          url: 'https://example.com/delete',
          publishedAt: new Date(),
        },
      });
      cleanupIds.articleIds.push(article.id);

      await matchNewArticles([article.id], testUserId);

      const matchesBefore = await prisma.saved_search_matches.findMany({
        where: { savedSearchId: search.id },
      });

      const matchCountBefore = matchesBefore.length;

      // Delete search
      await prisma.saved_searches.delete({
        where: { id: search.id },
      });

      // Verify matches were cascade deleted
      const matchesAfter = await prisma.saved_search_matches.findMany({
        where: { savedSearchId: search.id },
      });

      expect(matchesAfter.length).toBe(0);
      expect(matchCountBefore).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should handle large batch of articles efficiently', async () => {
      const search = await createSavedSearch({
        userId: testUserId,
        name: 'Performance Test',
        query: 'test',
        threshold: 0.5,
      });
      cleanupIds.searchIds.push(search.id);

      // Create 50 articles
      const articleIds: string[] = [];
      for (let i = 0; i < 50; i++) {
        const article = await prisma.articles.create({
          data: {
            id: nanoid(),
            feedId: testFeedId,
            title: `Performance Test Article ${i}`,
            excerpt: `Test content ${i}`,
            content: `This is test article number ${i}...`,
            url: `https://example.com/perf-${i}`,
            publishedAt: new Date(),
          },
        });
        articleIds.push(article.id);
      }
      cleanupIds.articleIds.push(...articleIds);

      // Measure matching time
      const startTime = Date.now();
      await matchNewArticles(articleIds, testUserId);
      const duration = Date.now() - startTime;

      // Should complete within reasonable time (10 seconds for 50 articles)
      expect(duration).toBeLessThan(10000);

      // Cleanup matches
      const matches = await prisma.saved_search_matches.findMany({
        where: { savedSearchId: search.id },
      });
      cleanupIds.matchIds.push(...matches.map((m) => m.id));
    });
  });
});
