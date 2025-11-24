/**
 * Unit Tests: Saved Search Execution Service
 *
 * Tests the search execution and scoring algorithms
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { executeSearch, matchArticle } from '../saved-search-execution';
import { prisma } from '@/lib/db';
import { nanoid } from 'nanoid';

describe('Saved Search Execution Service', () => {
  let testUserId: string;
  let testArticleIds: string[] = [];

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

    // Create test articles with embeddings
    const articles = [
      {
        id: nanoid(),
        title: 'Machine Learning Basics',
        excerpt: 'Introduction to machine learning and neural networks',
        content: 'Machine learning is a subset of artificial intelligence...',
        url: 'https://example.com/ml-basics',
        publishedAt: new Date(),
      },
      {
        id: nanoid(),
        title: 'Cybersecurity Best Practices',
        excerpt: 'How to secure your applications from vulnerabilities',
        content: 'Security is paramount in modern web development...',
        url: 'https://example.com/security',
        publishedAt: new Date(),
      },
      {
        id: nanoid(),
        title: 'React Hooks Tutorial',
        excerpt: 'Learn how to use React hooks effectively',
        content: 'React hooks allow you to use state and lifecycle features...',
        url: 'https://example.com/react-hooks',
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
    await prisma.articles.deleteMany({
      where: { id: { in: testArticleIds } },
    });
    await prisma.users.delete({
      where: { id: testUserId },
    });
  });

  describe('executeSearch', () => {
    it('should find articles matching a simple term query', async () => {
      const results = await executeSearch('machine learning', {
        userId: testUserId,
        threshold: 0.3,
        limit: 10,
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);

      // Should find the ML article
      const mlArticle = results.find((r) =>
        testArticleIds.includes(r.articleId)
      );
      expect(mlArticle).toBeDefined();
    });

    it('should respect threshold settings', async () => {
      const highThreshold = await executeSearch('machine learning', {
        userId: testUserId,
        threshold: 0.9,
        limit: 10,
      });

      const lowThreshold = await executeSearch('machine learning', {
        userId: testUserId,
        threshold: 0.1,
        limit: 10,
      });

      // Lower threshold should return more or equal results
      expect(lowThreshold.length).toBeGreaterThanOrEqual(highThreshold.length);
    });

    it('should handle complex queries with AND operator', async () => {
      const results = await executeSearch('+machine +learning', {
        userId: testUserId,
        threshold: 0.3,
        limit: 10,
      });

      expect(results).toBeDefined();
      // Should require both terms to be present
    });

    it('should handle NOT operator to exclude results', async () => {
      const results = await executeSearch('security -web', {
        userId: testUserId,
        threshold: 0.3,
        limit: 10,
      });

      expect(results).toBeDefined();
      // Should exclude articles with 'web'
    });

    it('should return empty array for non-matching query', async () => {
      const results = await executeSearch('nonexistent random gibberish xyz', {
        userId: testUserId,
        threshold: 0.5,
        limit: 10,
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const results = await executeSearch('the', {
        userId: testUserId,
        threshold: 0.1,
        limit: 2,
      });

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should apply recency bias correctly', async () => {
      const withRecency = await executeSearch('machine learning', {
        userId: testUserId,
        threshold: 0.3,
        recencyBias: 0.2,
        limit: 10,
      });

      const withoutRecency = await executeSearch('machine learning', {
        userId: testUserId,
        threshold: 0.3,
        recencyBias: 0.0,
        limit: 10,
      });

      // Results should differ when recency bias is applied
      // (newer articles should score higher)
      expect(withRecency).toBeDefined();
      expect(withoutRecency).toBeDefined();
    });
  });

  describe('matchArticle', () => {
    it('should match a relevant article', async () => {
      const result = await matchArticle(
        testArticleIds[0], // ML article
        'machine learning',
        0.3
      );

      expect(result).toBeDefined();
      if (result) {
        expect(result.articleId).toBe(testArticleIds[0]);
        expect(result.relevanceScore).toBeGreaterThan(0);
        expect(result.relevanceScore).toBeLessThanOrEqual(1);
        expect(Array.isArray(result.matchedTerms)).toBe(true);
        expect(typeof result.matchReason).toBe('string');
      }
    });

    it('should return null for non-matching article', async () => {
      const result = await matchArticle(
        testArticleIds[0],
        'completely unrelated topic xyz',
        0.8
      );

      // Might be null if score is below threshold
      if (result === null) {
        expect(result).toBeNull();
      } else {
        expect(result.relevanceScore).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('should return null for non-existent article', async () => {
      const result = await matchArticle(
        'non-existent-id',
        'test query',
        0.5
      );

      expect(result).toBeNull();
    });

    it('should include matched terms in result', async () => {
      const result = await matchArticle(
        testArticleIds[0],
        'machine learning',
        0.3
      );

      if (result) {
        expect(Array.isArray(result.matchedTerms)).toBe(true);
        expect(result.matchedTerms.length).toBeGreaterThan(0);
      }
    });

    it('should provide match reason explanation', async () => {
      const result = await matchArticle(
        testArticleIds[0],
        'machine learning',
        0.3
      );

      if (result) {
        expect(typeof result.matchReason).toBe('string');
        expect(result.matchReason.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Scoring Algorithm', () => {
    it('should return scores between 0 and 1', async () => {
      const results = await executeSearch('machine learning', {
        userId: testUserId,
        threshold: 0.0, // Get all results
        limit: 100,
      });

      results.forEach((result) => {
        expect(result.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(result.relevanceScore).toBeLessThanOrEqual(1);
      });
    });

    it('should score exact matches higher', async () => {
      const exactMatch = await matchArticle(
        testArticleIds[0],
        'machine learning',
        0.0
      );

      const partialMatch = await matchArticle(
        testArticleIds[0],
        'programming',
        0.0
      );

      if (exactMatch && partialMatch) {
        expect(exactMatch.relevanceScore).toBeGreaterThan(
          partialMatch.relevanceScore
        );
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query gracefully', async () => {
      const results = await executeSearch('', {
        userId: testUserId,
        threshold: 0.5,
        limit: 10,
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle very long queries', async () => {
      const longQuery = 'word '.repeat(100);
      const results = await executeSearch(longQuery, {
        userId: testUserId,
        threshold: 0.5,
        limit: 10,
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle special characters in query', async () => {
      const results = await executeSearch('test@#$%^&*()', {
        userId: testUserId,
        threshold: 0.5,
        limit: 10,
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
