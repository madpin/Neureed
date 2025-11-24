/**
 * Saved Search Service
 *
 * Service layer for managing saved searches.
 * Handles CRUD operations and querying matched articles.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";
import { parseQuery } from "./search-query-parser";
import { executeSearch, type SearchOptions } from "./saved-search-execution";
import type { saved_searches, articles } from "@/generated/prisma/client";
import type { EmbeddingProvider } from "@/lib/embeddings/types";

export interface CreateSavedSearchData {
  userId: string;
  name: string;
  query: string;
  icon?: string;
  threshold?: number;
  categoryId?: string;
  notifyOnMatch?: boolean;
  notifyThreshold?: number;
  dailyDigest?: boolean;
  recencyBias?: number;
  prioritySources?: string[];
}

export interface UpdateSavedSearchData {
  name?: string;
  query?: string;
  icon?: string;
  threshold?: number;
  categoryId?: string | null;
  notifyOnMatch?: boolean;
  notifyThreshold?: number;
  dailyDigest?: boolean;
  recencyBias?: number;
  prioritySources?: string[] | null;
  archived?: boolean;
}

export interface GetMatchingArticlesOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'date' | 'combined';
  startDate?: Date;
  endDate?: Date;
  feedIds?: string[];
  provider?: EmbeddingProvider;
}

export interface MatchingArticlesResult {
  articles: articles[];
  matches: Array<{
    id: string;
    relevanceScore: number;
    matchedTerms: any;
    matchReason: string | null;
    createdAt: Date;
  }>;
  total: number;
}

/**
 * Create a new saved search
 */
export async function createSavedSearch(
  data: CreateSavedSearchData
): Promise<saved_searches> {
  try {
    // Validate query syntax
    const parseResult = parseQuery(data.query);
    if (!parseResult.valid) {
      throw new Error(`Invalid query syntax: ${parseResult.errors.join(', ')}`);
    }

    // Create saved search
    const savedSearch = await prisma.saved_searches.create({
      data: {
        id: nanoid(),
        userId: data.userId,
        name: data.name,
        query: data.query,
        icon: data.icon || '🔍',
        threshold: data.threshold ?? 0.6,
        categoryId: data.categoryId || null,
        notifyOnMatch: data.notifyOnMatch ?? false,
        notifyThreshold: data.notifyThreshold ?? 0.85,
        dailyDigest: data.dailyDigest ?? false,
        recencyBias: data.recencyBias ?? 0.0,
        prioritySources: data.prioritySources ? (data.prioritySources as any) : null,
        archived: false,
      },
    });

    logger.info("Saved search created", {
      savedSearchId: savedSearch.id,
      userId: data.userId,
      name: data.name,
    });

    return savedSearch;
  } catch (error) {
    logger.error("Failed to create saved search", {
      error: error instanceof Error ? error.message : String(error),
      data,
    });
    throw error;
  }
}

/**
 * Update a saved search
 */
export async function updateSavedSearch(
  id: string,
  userId: string,
  updates: UpdateSavedSearchData
): Promise<saved_searches> {
  try {
    // Verify ownership
    const existing = await prisma.saved_searches.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Saved search not found: ${id}`);
    }

    if (existing.userId !== userId) {
      throw new Error("Unauthorized: You don't own this saved search");
    }

    // Validate query syntax if being updated
    if (updates.query) {
      const parseResult = parseQuery(updates.query);
      if (!parseResult.valid) {
        throw new Error(`Invalid query syntax: ${parseResult.errors.join(', ')}`);
      }
    }

    // Update saved search
    const savedSearch = await prisma.saved_searches.update({
      where: { id },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.query !== undefined && { query: updates.query }),
        ...(updates.icon !== undefined && { icon: updates.icon }),
        ...(updates.threshold !== undefined && { threshold: updates.threshold }),
        ...(updates.categoryId !== undefined && { categoryId: updates.categoryId }),
        ...(updates.notifyOnMatch !== undefined && { notifyOnMatch: updates.notifyOnMatch }),
        ...(updates.notifyThreshold !== undefined && { notifyThreshold: updates.notifyThreshold }),
        ...(updates.dailyDigest !== undefined && { dailyDigest: updates.dailyDigest }),
        ...(updates.recencyBias !== undefined && { recencyBias: updates.recencyBias }),
        ...(updates.prioritySources !== undefined && { prioritySources: updates.prioritySources as any }),
        ...(updates.archived !== undefined && { archived: updates.archived }),
      },
    });

    logger.info("Saved search updated", {
      savedSearchId: id,
      userId,
      updates: Object.keys(updates),
    });

    return savedSearch;
  } catch (error) {
    logger.error("Failed to update saved search", {
      error: error instanceof Error ? error.message : String(error),
      id,
      userId,
    });
    throw error;
  }
}

/**
 * Delete a saved search
 */
export async function deleteSavedSearch(
  id: string,
  userId: string
): Promise<void> {
  try {
    // Verify ownership
    const existing = await prisma.saved_searches.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Saved search not found: ${id}`);
    }

    if (existing.userId !== userId) {
      throw new Error("Unauthorized: You don't own this saved search");
    }

    // Delete saved search (cascades to matches)
    await prisma.saved_searches.delete({
      where: { id },
    });

    logger.info("Saved search deleted", {
      savedSearchId: id,
      userId,
    });
  } catch (error) {
    logger.error("Failed to delete saved search", {
      error: error instanceof Error ? error.message : String(error),
      id,
      userId,
    });
    throw error;
  }
}

/**
 * Get all saved searches for a user
 */
export async function getSavedSearches(
  userId: string,
  includeArchived: boolean = false
): Promise<saved_searches[]> {
  try {
    const savedSearches = await prisma.saved_searches.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { archived: false }),
      },
      orderBy: [
        { archived: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return savedSearches;
  } catch (error) {
    logger.error("Failed to get saved searches", {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    throw error;
  }
}

/**
 * Get a saved search by ID
 */
export async function getSavedSearchById(
  id: string,
  userId: string
): Promise<saved_searches | null> {
  try {
    const savedSearch = await prisma.saved_searches.findUnique({
      where: { id },
    });

    if (!savedSearch) {
      return null;
    }

    // Verify ownership
    if (savedSearch.userId !== userId) {
      throw new Error("Unauthorized: You don't own this saved search");
    }

    return savedSearch;
  } catch (error) {
    logger.error("Failed to get saved search", {
      error: error instanceof Error ? error.message : String(error),
      id,
      userId,
    });
    throw error;
  }
}

/**
 * Get matching articles for a saved search
 */
export async function getMatchingArticles(
  savedSearchId: string,
  userId: string,
  options: GetMatchingArticlesOptions = {}
): Promise<MatchingArticlesResult> {
  try {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'relevance',
      startDate,
      endDate,
      feedIds,
      provider,
    } = options;

    // Verify ownership
    const savedSearch = await getSavedSearchById(savedSearchId, userId);
    if (!savedSearch) {
      throw new Error(`Saved search not found: ${savedSearchId}`);
    }

    // Build where clause
    const whereClause: any = {
      savedSearchId,
    };

    if (startDate || endDate) {
      whereClause.article = {
        ...(startDate && { publishedAt: { gte: startDate } }),
        ...(endDate && { publishedAt: { lte: endDate } }),
      };
    }

    if (feedIds && feedIds.length > 0) {
      whereClause.article = {
        ...whereClause.article,
        feedId: { in: feedIds },
      };
    }

    // Determine sort order
    let orderBy: any = { relevanceScore: 'desc' };
    if (sortBy === 'date') {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'combined') {
      // For combined sort, we'll fetch and sort in memory
      orderBy = [
        { relevanceScore: 'desc' },
        { createdAt: 'desc' },
      ];
    }

    // Fetch matches with articles
    const [matches, total] = await Promise.all([
      prisma.saved_search_matches.findMany({
        where: whereClause,
        include: {
          article: true,
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.saved_search_matches.count({ where: whereClause }),
    ]);

    // Extract articles and match metadata, filtering out deleted articles
    const validMatches = matches.filter(m => m.article !== null);
    const articles = validMatches.map(m => m.article);
    const matchMetadata = validMatches.map(m => ({
      id: m.id,
      relevanceScore: m.relevanceScore,
      matchedTerms: m.matchedTerms,
      matchReason: m.matchReason,
      createdAt: m.createdAt,
    }));

    logger.info("Retrieved matching articles", {
      savedSearchId,
      userId,
      total,
      returned: articles.length,
      filtered: matches.length - validMatches.length,
    });

    return {
      articles,
      matches: matchMetadata,
      total: validMatches.length, // Return count of valid articles, not total matches
    };
  } catch (error) {
    logger.error("Failed to get matching articles", {
      error: error instanceof Error ? error.message : String(error),
      savedSearchId,
      userId,
    });
    throw error;
  }
}

/**
 * Preview search results without saving
 * Useful for testing queries before creating a saved search
 */
export async function previewSearch(
  query: string,
  userId: string,
  options: Omit<SearchOptions, 'userId'> = {}
): Promise<{
  results: Array<{
    article: articles;
    relevanceScore: number;
    matchedTerms: string[];
    matchReason: string;
  }>;
  total: number;
}> {
  try {
    // Validate query
    const parseResult = parseQuery(query);
    if (!parseResult.valid) {
      throw new Error(`Invalid query syntax: ${parseResult.errors.join(', ')}`);
    }

    // Execute search
    const searchResults = await executeSearch(query, {
      ...options,
      userId,
    });

    // Fetch article details
    const articleIds = searchResults.map(r => r.articleId);
    const articles = await prisma.articles.findMany({
      where: {
        id: { in: articleIds },
      },
    });

    // Create article map for quick lookup
    const articleMap = new Map(articles.map(a => [a.id, a]));

    // Combine results with articles
    const results = searchResults
      .map(result => {
        const article = articleMap.get(result.articleId);
        if (!article) return null;

        return {
          article,
          relevanceScore: result.relevanceScore,
          matchedTerms: result.matchedTerms,
          matchReason: result.matchReason,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    logger.info("Search preview executed", {
      userId,
      query,
      totalResults: results.length,
    });

    return {
      results,
      total: results.length,
    };
  } catch (error) {
    logger.error("Failed to preview search", {
      error: error instanceof Error ? error.message : String(error),
      query,
      userId,
    });
    throw error;
  }
}

/**
 * Get saved search statistics
 */
export async function getSavedSearchStats(
  savedSearchId: string,
  userId: string
): Promise<{
  totalMatches: number;
  newMatchesLast24h: number;
  avgRelevanceScore: number;
  lastMatchedAt: Date | null;
}> {
  try {
    // Verify ownership
    const savedSearch = await getSavedSearchById(savedSearchId, userId);
    if (!savedSearch) {
      throw new Error(`Saved search not found: ${savedSearchId}`);
    }

    // Calculate stats
    const [totalMatches, recentMatches, avgScore] = await Promise.all([
      prisma.saved_search_matches.count({
        where: { savedSearchId },
      }),
      prisma.saved_search_matches.count({
        where: {
          savedSearchId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.saved_search_matches.aggregate({
        where: { savedSearchId },
        _avg: { relevanceScore: true },
      }),
    ]);

    return {
      totalMatches,
      newMatchesLast24h: recentMatches,
      avgRelevanceScore: avgScore._avg.relevanceScore || 0,
      lastMatchedAt: savedSearch.lastMatchedAt,
    };
  } catch (error) {
    logger.error("Failed to get saved search stats", {
      error: error instanceof Error ? error.message : String(error),
      savedSearchId,
      userId,
    });
    throw error;
  }
}
