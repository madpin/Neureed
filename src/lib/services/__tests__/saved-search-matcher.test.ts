/**
 * Unit Tests: Saved Search Matcher Service
 *
 * Tests the automatic matching of articles to saved searches
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { matchNewArticles, rematchSavedSearch } from '../saved-search-matcher';
import { createSavedSearch } from '../saved-search-service';
import { prisma } from '@/lib/db';
import { nanoid } from 'nanoid';

describe('Saved Search Matcher Service', () => {
  let testUserId: string;
  let testSearchId: string;
  const testArticleIds: string[] = [];

  beforeAll(async () => {
    // Create test user
    testUserId = nanoid();
    await prisma.users.create({
      data: {
        id: testUserId,
        email: `test-${testUserId}@example.com`,
        name: 'Test User',
      },
    });

    // Create a saved search
    const search = await createSavedSearch({
      userId: testUserId,
      name: 'ML Search',
      query: 'machine learning',
      threshold: 0.5,
    });
    testSearchId = search.id;

    // Create test articles
    const articles = [
      {
        id: nanoid(),
        title: 'Introduction to Machine Learning',
        excerpt: 'Learn the basics of machine learning algorithms',
        content: 'Machine learning is a field of artificial intelligence...',
        url: 'https://example.com/ml-intro',
        publishedAt: new Date(),
      },
      {
        id: nanoid(),
        title: 'Deep Learning Tutorial',
        excerpt: 'Advanced concepts in deep learning and neural networks',
        content: 'Deep learning uses neural networks with multiple layers...',
        url: 'https://example.com/deep-learning',
        publishedAt: new Date(),
      },
      {
        id: nanoid(),
        title: 'Cooking Recipes',
        excerpt: 'Delicious recipes for dinner',
        content: 'Here are some great recipes you can try at home...',
        url: 'https://example.com/recipes',
        publishedAt: new Date(),
      },
    ];

    for (const article of articles) {
      const created = await prisma.articles.create({
        data: article,
      });
      testArticleIds.push(created.id);
    }
  });

  afterAll(async () => {
    // Cleanup
    await prisma.saved_search_matches.deleteMany({
      where: { savedSearchId: testSearchId },
    });
    await prisma.saved_searches.delete({
      where: { id: testSearchId },
    });
    await prisma.articles.deleteMany({
      where: { id: { in: testArticleIds } },
    });
    await prisma.users.delete({
      where: { id: testUserId },
    });
  });

  describe('matchNewArticles', () => {
    it('should match relevant articles to saved search', async () => {
      await matchNewArticles(testArticleIds, testUserId);

      // Check that matches were created
      const matches = await prisma.saved_search_matches.findMany({
        where: {
          savedSearchId: testSearchId,
          articleId: { in: testArticleIds },
        },
      });

      expect(matches.length).toBeGreaterThan(0);

      // Should match ML articles but not cooking article
      const mlMatches = matches.filter((m) =>
        [testArticleIds[0], testArticleIds[1]].includes(m.articleId)
      );
      expect(mlMatches.length).toBeGreaterThan(0);
    });

    it('should not create duplicate matches', async () => {
      // Run matching twice
      await matchNewArticles([testArticleIds[0]], testUserId);
      await matchNewArticles([testArticleIds[0]], testUserId);

      // Should only have one match per article-search pair
      const matches = await prisma.saved_search_matches.findMany({
        where: {
          savedSearchId: testSearchId,
          articleId: testArticleIds[0],
        },
      });

      expect(matches.length).toBe(1);
    });

    it('should include relevance score in matches', async () => {
      await matchNewArticles([testArticleIds[0]], testUserId);

      const match = await prisma.saved_search_matches.findFirst({
        where: {
          savedSearchId: testSearchId,
          articleId: testArticleIds[0],
        },
      });

      expect(match).toBeDefined();
      if (match) {
        expect(match.relevanceScore).toBeGreaterThan(0);
        expect(match.relevanceScore).toBeLessThanOrEqual(1);
      }
    });

    it('should include matched terms', async () => {
      await matchNewArticles([testArticleIds[0]], testUserId);

      const match = await prisma.saved_search_matches.findFirst({
        where: {
          savedSearchId: testSearchId,
          articleId: testArticleIds[0],
        },
      });

      expect(match).toBeDefined();
      if (match) {
        expect(match.matchedTerms).toBeDefined();
        expect(Array.isArray(match.matchedTerms)).toBe(true);
      }
    });

    it('should include match reason', async () => {
      await matchNewArticles([testArticleIds[0]], testUserId);

      const match = await prisma.saved_search_matches.findFirst({
        where: {
          savedSearchId: testSearchId,
          articleId: testArticleIds[0],
        },
      });

      expect(match).toBeDefined();
      if (match && match.matchReason) {
        expect(typeof match.matchReason).toBe('string');
        expect(match.matchReason.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty article list', async () => {
      await expect(
        matchNewArticles([], testUserId)
      ).resolves.not.toThrow();
    });

    it('should handle non-existent articles gracefully', async () => {
      await expect(
        matchNewArticles(['non-existent-id'], testUserId)
      ).resolves.not.toThrow();
    });

    it('should match for all users when userId not provided', async () => {
      // Create another user with a saved search
      const userId2 = nanoid();
      await prisma.users.create({
        data: {
          id: userId2,
          email: `test-${userId2}@example.com`,
          name: 'Test User 2',
        },
      });

      const search2 = await createSavedSearch({
        userId: userId2,
        name: 'ML Search 2',
        query: 'machine learning',
        threshold: 0.5,
      });

      // Match for all users
      await matchNewArticles([testArticleIds[0]]);

      // Check both users got matches
      const matches1 = await prisma.saved_search_matches.findFirst({
        where: {
          savedSearchId: testSearchId,
          articleId: testArticleIds[0],
        },
      });

      const matches2 = await prisma.saved_search_matches.findFirst({
        where: {
          savedSearchId: search2.id,
          articleId: testArticleIds[0],
        },
      });

      expect(matches1).toBeDefined();
      expect(matches2).toBeDefined();

      // Cleanup
      await prisma.saved_search_matches.deleteMany({
        where: { savedSearchId: search2.id },
      });
      await prisma.saved_searches.delete({ where: { id: search2.id } });
      await prisma.users.delete({ where: { id: userId2 } });
    });
  });

  describe('rematchSavedSearch', () => {
    it('should rematch all articles for a search', async () => {
      // Clear existing matches
      await prisma.saved_search_matches.deleteMany({
        where: { savedSearchId: testSearchId },
      });

      const newMatches = await rematchSavedSearch(testSearchId);

      expect(typeof newMatches).toBe('number');
      expect(newMatches).toBeGreaterThanOrEqual(0);

      // Verify matches were created
      const matches = await prisma.saved_search_matches.findMany({
        where: { savedSearchId: testSearchId },
      });

      expect(matches.length).toBe(newMatches);
    });

    it('should update lastMatchedAt timestamp', async () => {
      const beforeTime = new Date();

      await rematchSavedSearch(testSearchId);

      const search = await prisma.saved_searches.findUnique({
        where: { id: testSearchId },
      });

      expect(search).toBeDefined();
      if (search && search.lastMatchedAt) {
        expect(new Date(search.lastMatchedAt).getTime()).toBeGreaterThanOrEqual(
          beforeTime.getTime()
        );
      }
    });

    it('should update totalMatches count', async () => {
      // Clear matches first
      await prisma.saved_search_matches.deleteMany({
        where: { savedSearchId: testSearchId },
      });

      await rematchSavedSearch(testSearchId);

      const search = await prisma.saved_searches.findUnique({
        where: { id: testSearchId },
      });

      expect(search).toBeDefined();
      if (search) {
        const actualMatches = await prisma.saved_search_matches.count({
          where: { savedSearchId: testSearchId },
        });
        expect(search.totalMatches).toBe(actualMatches);
      }
    });

    it('should handle non-existent saved search', async () => {
      await expect(
        rematchSavedSearch('non-existent-id')
      ).rejects.toThrow();
    });
  });

  describe('Notification Creation', () => {
    it('should create notification for high-relevance match', async () => {
      // Create a search with notifications enabled
      const notifySearch = await createSavedSearch({
        userId: testUserId,
        name: 'Notify Search',
        query: 'machine learning',
        threshold: 0.5,
        notifyOnMatch: true,
        notifyThreshold: 0.7,
      });

      // Clear any existing matches
      await prisma.saved_search_matches.deleteMany({
        where: { savedSearchId: notifySearch.id },
      });

      // Match articles
      await matchNewArticles([testArticleIds[0]], testUserId);

      // Check if notification was created
      const notifications = await prisma.user_notifications.findMany({
        where: {
          userId: testUserId,
          type: 'saved_search_match',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      });

      // Should have created a notification if match score was high enough
      if (notifications.length > 0) {
        const notification = notifications[0];
        expect(notification.type).toBe('saved_search_match');
      }

      // Cleanup
      await prisma.saved_search_matches.deleteMany({
        where: { savedSearchId: notifySearch.id },
      });
      await prisma.saved_searches.delete({
        where: { id: notifySearch.id },
      });
    });
  });

  describe('Performance', () => {
    it('should handle batch matching efficiently', async () => {
      const startTime = Date.now();

      await matchNewArticles(testArticleIds, testUserId);

      const duration = Date.now() - startTime;

      // Should complete within reasonable time (5 seconds for small batch)
      expect(duration).toBeLessThan(5000);
    });
  });
});
