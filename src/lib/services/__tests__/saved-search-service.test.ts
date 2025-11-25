/**
 * Unit Tests: Saved Search Service
 *
 * Tests CRUD operations and business logic for saved searches
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  getSavedSearches,
  getSavedSearchById,
  previewSearch,
  getSavedSearchStats,
} from '../saved-search-service';
import { prisma } from '@/lib/db';
import { nanoid } from 'nanoid';

describe('Saved Search Service', () => {
  let testUserId: string;
  let testUserId2: string;
  let testCategoryId: string;
  const createdSearchIds: string[] = [];

  beforeAll(async () => {
    // Create test users
    testUserId = nanoid();
    testUserId2 = nanoid();

    await prisma.users.create({
      data: {
        id: testUserId,
        email: `test-${testUserId}@example.com`,
        name: 'Test User 1',
      },
    });

    await prisma.users.create({
      data: {
        id: testUserId2,
        email: `test-${testUserId2}@example.com`,
        name: 'Test User 2',
      },
    });

    // Create test category
    const category = await prisma.user_categories.create({
      data: {
        id: nanoid(),
        userId: testUserId,
        name: 'Test Category',
        displayOrder: 0,
      },
    });
    testCategoryId = category.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.saved_searches.deleteMany({
      where: { id: { in: createdSearchIds } },
    });
    await prisma.user_categories.delete({
      where: { id: testCategoryId },
    });
    await prisma.users.deleteMany({
      where: { id: { in: [testUserId, testUserId2] } },
    });
  });

  describe('createSavedSearch', () => {
    it('should create a saved search with valid data', async () => {
      const search = await createSavedSearch({
        userId: testUserId,
        name: 'Test Search',
        query: 'machine learning',
        icon: '🤖',
        threshold: 0.7,
      });

      expect(search).toBeDefined();
      expect(search.id).toBeDefined();
      expect(search.name).toBe('Test Search');
      expect(search.query).toBe('machine learning');
      expect(search.icon).toBe('🤖');
      expect(search.threshold).toBe(0.7);
      expect(search.userId).toBe(testUserId);

      createdSearchIds.push(search.id);
    });

    it('should create with default values', async () => {
      const search = await createSavedSearch({
        userId: testUserId,
        name: 'Minimal Search',
        query: 'test',
      });

      expect(search.icon).toBe('🔍');
      expect(search.threshold).toBe(0.6);
      expect(search.notifyOnMatch).toBe(false);
      expect(search.archived).toBe(false);

      createdSearchIds.push(search.id);
    });

    it('should validate query syntax', async () => {
      await expect(
        createSavedSearch({
          userId: testUserId,
          name: 'Invalid Search',
          query: '((unbalanced',
        })
      ).rejects.toThrow(/Invalid query syntax/);
    });

    it('should create with category', async () => {
      const search = await createSavedSearch({
        userId: testUserId,
        name: 'Categorized Search',
        query: 'test',
        categoryId: testCategoryId,
      });

      expect(search.categoryId).toBe(testCategoryId);

      createdSearchIds.push(search.id);
    });

    it('should create with notification settings', async () => {
      const search = await createSavedSearch({
        userId: testUserId,
        name: 'Notified Search',
        query: 'test',
        notifyOnMatch: true,
        notifyThreshold: 0.9,
        dailyDigest: true,
      });

      expect(search.notifyOnMatch).toBe(true);
      expect(search.notifyThreshold).toBe(0.9);
      expect(search.dailyDigest).toBe(true);

      createdSearchIds.push(search.id);
    });

    it('should reject empty query', async () => {
      await expect(
        createSavedSearch({
          userId: testUserId,
          name: 'Empty Query',
          query: '',
        })
      ).rejects.toThrow(/Query cannot be empty/);
    });
  });

  describe('updateSavedSearch', () => {
    let searchId: string;

    beforeEach(async () => {
      const search = await createSavedSearch({
        userId: testUserId,
        name: 'Update Test',
        query: 'original query',
      });
      searchId = search.id;
      createdSearchIds.push(searchId);
    });

    it('should update name and query', async () => {
      const updated = await updateSavedSearch(searchId, testUserId, {
        name: 'Updated Name',
        query: 'updated query',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.query).toBe('updated query');
    });

    it('should update threshold and settings', async () => {
      const updated = await updateSavedSearch(searchId, testUserId, {
        threshold: 0.8,
        recencyBias: 0.2,
        notifyOnMatch: true,
      });

      expect(updated.threshold).toBe(0.8);
      expect(updated.recencyBias).toBe(0.2);
      expect(updated.notifyOnMatch).toBe(true);
    });

    it('should validate query syntax on update', async () => {
      await expect(
        updateSavedSearch(searchId, testUserId, {
          query: '((invalid',
        })
      ).rejects.toThrow(/Invalid query syntax/);
    });

    it('should enforce ownership', async () => {
      await expect(
        updateSavedSearch(searchId, testUserId2, {
          name: 'Unauthorized Update',
        })
      ).rejects.toThrow(/Unauthorized/);
    });

    it('should handle non-existent search', async () => {
      await expect(
        updateSavedSearch('non-existent-id', testUserId, {
          name: 'Update',
        })
      ).rejects.toThrow(/not found/);
    });

    it('should archive search', async () => {
      const updated = await updateSavedSearch(searchId, testUserId, {
        archived: true,
      });

      expect(updated.archived).toBe(true);
    });
  });

  describe('deleteSavedSearch', () => {
    it('should delete existing search', async () => {
      const search = await createSavedSearch({
        userId: testUserId,
        name: 'To Delete',
        query: 'test',
      });

      await deleteSavedSearch(search.id, testUserId);

      const deleted = await prisma.saved_searches.findUnique({
        where: { id: search.id },
      });

      expect(deleted).toBeNull();
    });

    it('should enforce ownership on delete', async () => {
      const search = await createSavedSearch({
        userId: testUserId,
        name: 'Protected',
        query: 'test',
      });
      createdSearchIds.push(search.id);

      await expect(
        deleteSavedSearch(search.id, testUserId2)
      ).rejects.toThrow(/Unauthorized/);
    });

    it('should handle non-existent search', async () => {
      await expect(
        deleteSavedSearch('non-existent-id', testUserId)
      ).rejects.toThrow(/not found/);
    });
  });

  describe('getSavedSearches', () => {
    beforeEach(async () => {
      // Create multiple searches
      const searches = await Promise.all([
        createSavedSearch({
          userId: testUserId,
          name: 'Active Search 1',
          query: 'test1',
        }),
        createSavedSearch({
          userId: testUserId,
          name: 'Active Search 2',
          query: 'test2',
        }),
        createSavedSearch({
          userId: testUserId,
          name: 'Archived Search',
          query: 'test3',
        }),
      ]);

      createdSearchIds.push(...searches.map((s) => s.id));

      // Archive one
      await updateSavedSearch(searches[2].id, testUserId, { archived: true });
    });

    it('should return only active searches by default', async () => {
      const searches = await getSavedSearches(testUserId);

      expect(searches.length).toBeGreaterThanOrEqual(2);
      expect(searches.every((s) => !s.archived)).toBe(true);
    });

    it('should include archived when requested', async () => {
      const searches = await getSavedSearches(testUserId, true);

      expect(searches.some((s) => s.archived)).toBe(true);
    });

    it('should return empty array for user with no searches', async () => {
      const searches = await getSavedSearches(testUserId2);

      expect(searches).toEqual([]);
    });
  });

  describe('getSavedSearchById', () => {
    let searchId: string;

    beforeEach(async () => {
      const search = await createSavedSearch({
        userId: testUserId,
        name: 'Get By ID Test',
        query: 'test',
      });
      searchId = search.id;
      createdSearchIds.push(searchId);
    });

    it('should return search for owner', async () => {
      const search = await getSavedSearchById(searchId, testUserId);

      expect(search).toBeDefined();
      expect(search?.id).toBe(searchId);
    });

    it('should enforce ownership', async () => {
      await expect(
        getSavedSearchById(searchId, testUserId2)
      ).rejects.toThrow(/Unauthorized/);
    });

    it('should return null for non-existent search', async () => {
      const search = await getSavedSearchById('non-existent-id', testUserId);

      expect(search).toBeNull();
    });
  });

  describe('previewSearch', () => {
    it('should preview search without saving', async () => {
      const preview = await previewSearch('test query', testUserId, {
        threshold: 0.5,
        limit: 10,
      });

      expect(preview).toBeDefined();
      expect(Array.isArray(preview.results)).toBe(true);
      expect(typeof preview.total).toBe('number');
    });

    it('should validate query syntax', async () => {
      await expect(
        previewSearch('((invalid', testUserId)
      ).rejects.toThrow(/Invalid query syntax/);
    });

    it('should respect limit parameter', async () => {
      const preview = await previewSearch('test', testUserId, {
        threshold: 0.1,
        limit: 5,
      });

      expect(preview.results.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getSavedSearchStats', () => {
    it('should return stats for search', async () => {
      const search = await createSavedSearch({
        userId: testUserId,
        name: 'Stats Test',
        query: 'test',
      });
      createdSearchIds.push(search.id);

      const stats = await getSavedSearchStats(search.id, testUserId);

      expect(stats).toBeDefined();
      expect(typeof stats.totalMatches).toBe('number');
      expect(typeof stats.newMatchesLast24h).toBe('number');
      expect(typeof stats.avgRelevanceScore).toBe('number');
      expect(stats.avgRelevanceScore).toBeGreaterThanOrEqual(0);
      expect(stats.avgRelevanceScore).toBeLessThanOrEqual(1);
    });

    it('should enforce ownership', async () => {
      const search = await createSavedSearch({
        userId: testUserId,
        name: 'Protected Stats',
        query: 'test',
      });
      createdSearchIds.push(search.id);

      await expect(
        getSavedSearchStats(search.id, testUserId2)
      ).rejects.toThrow(/Unauthorized/);
    });
  });
});
