'use server';

/**
 * Server Actions for Saved Search operations
 *
 * These actions replace the following API routes:
 * - GET /api/saved-searches
 * - POST /api/saved-searches
 * - GET /api/saved-searches/[id]
 * - PUT /api/saved-searches/[id]
 * - DELETE /api/saved-searches/[id]
 * - GET /api/saved-searches/[id]/articles
 * - POST /api/saved-searches/[id]/rematch
 * - POST /api/saved-searches/preview
 * - GET /api/saved-searches/templates
 * - GET /api/saved-searches/insights
 */

import { auth } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import * as savedSearchService from '@/lib/services/saved-search-service';
import { matchNewArticles, rematchSavedSearch } from '@/lib/services/saved-search-matcher';
import {
  getAllTemplates,
  getTemplatesByCategory,
  searchTemplates,
  getTemplateCategories,
  getPopularTemplates,
  getTemplateById,
} from '@/lib/services/search-templates-service';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// Validation schemas
const createSavedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  query: z.string().min(1),
  icon: z.string().optional(),
  threshold: z.number().min(0).max(1).optional(),
  categoryId: z.string().optional(),
  notifyOnMatch: z.boolean().optional(),
  notifyThreshold: z.number().min(0).max(1).optional(),
  dailyDigest: z.boolean().optional(),
  recencyBias: z.number().min(0).max(1).optional(),
  prioritySources: z.array(z.string()).optional(),
});

const updateSavedSearchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  query: z.string().min(1).optional(),
  icon: z.string().optional(),
  threshold: z.number().min(0).max(1).optional(),
  categoryId: z.string().nullable().optional(),
  notifyOnMatch: z.boolean().optional(),
  notifyThreshold: z.number().min(0).max(1).optional(),
  dailyDigest: z.boolean().optional(),
  recencyBias: z.number().min(0).max(1).optional(),
  prioritySources: z.array(z.string()).nullable().optional(),
  archived: z.boolean().optional(),
});

const listQuerySchema = z.object({
  includeArchived: z.boolean().optional().default(false),
});

const articlesQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
  sortBy: z.enum(['relevance', 'date', 'combined']).optional().default('relevance'),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  feedIds: z.array(z.string()).optional(),
});

const previewSearchSchema = z.object({
  query: z.string().min(1),
  threshold: z.number().min(0).max(1).optional(),
  recencyBias: z.number().min(0).max(1).optional(),
  prioritySources: z.array(z.string()).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

const templatesQuerySchema = z.object({
  category: z.enum(['technology', 'news', 'research', 'jobs', 'custom']).optional(),
  keyword: z.string().optional(),
  popular: z.boolean().optional(),
  suggest: z.boolean().optional(),
  categories: z.boolean().optional(),
  id: z.string().optional(),
});

type CreateSavedSearchInput = z.infer<typeof createSavedSearchSchema>;
type UpdateSavedSearchInput = z.infer<typeof updateSavedSearchSchema>;
type ListQueryInput = z.infer<typeof listQuerySchema>;
type ArticlesQueryInput = z.infer<typeof articlesQuerySchema>;
type PreviewSearchInput = z.infer<typeof previewSearchSchema>;
type TemplatesQueryInput = z.infer<typeof templatesQuerySchema>;

/**
 * List all saved searches for the current user
 */
export async function getSavedSearchesAction(input?: ListQueryInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const validated = listQuerySchema.parse(input || {});
    const { includeArchived } = validated;

    const savedSearches = await savedSearchService.getSavedSearches(
      session.user.id,
      includeArchived
    );

    return { data: savedSearches };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Create a new saved search
 */
export async function createSavedSearchAction(input: CreateSavedSearchInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const validated = createSavedSearchSchema.parse(input);

    const savedSearch = await savedSearchService.createSavedSearch({
      userId: session.user.id,
      ...validated,
    });

    // Trigger initial matching in background (don't await)
    matchNewArticles([], session.user.id).catch(error => {
      logger.error('Background matching failed for new saved search', {
        error: error instanceof Error ? error.message : String(error),
        savedSearchId: savedSearch.id,
      });
    });

    revalidatePath('/');

    return {
      data: savedSearch,
      message: 'Saved search created successfully. Matching articles in background.',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Get a specific saved search by ID
 */
export async function getSavedSearchAction(id: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!id) {
    throw new Error('Saved search ID is required');
  }

  const savedSearch = await savedSearchService.getSavedSearchById(id, session.user.id);

  if (!savedSearch) {
    throw new Error(`Saved search not found: ${id}`);
  }

  const stats = await savedSearchService.getSavedSearchStats(id, session.user.id);

  return {
    data: {
      ...savedSearch,
      stats,
    },
  };
}

/**
 * Update a saved search
 */
export async function updateSavedSearchAction(id: string, input: UpdateSavedSearchInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!id) {
    throw new Error('Saved search ID is required');
  }

  try {
    const validated = updateSavedSearchSchema.parse(input);

    // Check if query was updated
    const queryUpdated = validated.query !== undefined;

    const savedSearch = await savedSearchService.updateSavedSearch(
      id,
      session.user.id,
      validated
    );

    // If query was updated, trigger rematch in background
    if (queryUpdated) {
      rematchSavedSearch(id).catch(error => {
        logger.error('Background rematch failed after query update', {
          error: error instanceof Error ? error.message : String(error),
          savedSearchId: id,
        });
      });
    }

    revalidatePath('/');

    return {
      data: savedSearch,
      message: queryUpdated
        ? 'Saved search updated. Rematching articles in background.'
        : 'Saved search updated successfully.',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Delete a saved search
 */
export async function deleteSavedSearchAction(id: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!id) {
    throw new Error('Saved search ID is required');
  }

  await savedSearchService.deleteSavedSearch(id, session.user.id);

  revalidatePath('/');

  return {
    data: { success: true },
    message: 'Saved search deleted successfully.',
  };
}

/**
 * Get matching articles for a saved search
 */
export async function getSavedSearchArticlesAction(id: string, input?: ArticlesQueryInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!id) {
    throw new Error('Saved search ID is required');
  }

  try {
    const validated = articlesQuerySchema.parse(input || {});
    const { limit, offset, sortBy, startDate, endDate, feedIds } = validated;

    const result = await savedSearchService.getMatchingArticles(id, session.user.id, {
      limit,
      offset,
      sortBy,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      feedIds,
    });

    return {
      data: {
        articles: result.articles,
        matches: result.matches,
        total: result.total,
        pagination: {
          limit,
          offset,
          hasMore: offset + result.articles.length < result.total,
        },
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Trigger rematch for a saved search
 */
export async function rematchSavedSearchAction(id: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!id) {
    throw new Error('Saved search ID is required');
  }

  // Verify ownership
  const savedSearch = await savedSearchService.getSavedSearchById(id, session.user.id);
  if (!savedSearch) {
    throw new Error(`Saved search not found: ${id}`);
  }

  // Trigger rematch
  const newMatches = await rematchSavedSearch(id);

  revalidatePath('/');

  return {
    data: {
      savedSearchId: id,
      newMatches,
    },
    message: `Rematch completed. Found ${newMatches} matching articles.`,
  };
}

/**
 * Preview search results without saving
 */
export async function previewSearchAction(input: PreviewSearchInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const validated = previewSearchSchema.parse(input);

    const result = await savedSearchService.previewSearch(
      validated.query,
      session.user.id,
      {
        threshold: validated.threshold,
        recencyBias: validated.recencyBias,
        prioritySources: validated.prioritySources,
        limit: validated.limit || 50,
        offset: validated.offset || 0,
      }
    );

    return {
      data: {
        results: result.results,
        total: result.total,
        message: 'This is a preview. Create a saved search to track matches automatically.',
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Get search templates
 */
export async function getSearchTemplatesAction(input?: TemplatesQueryInput) {
  try {
    const validated = templatesQuerySchema.parse(input || {});
    const { category, keyword, popular, suggest, categories, id } = validated;

    const session = await auth();

    // Get specific template by ID
    if (id) {
      const template = getTemplateById(id);
      if (!template) {
        throw new Error('Template not found');
      }
      return { data: template };
    }

    // Get template categories
    if (categories) {
      const categoryList = getTemplateCategories();
      return { data: categoryList };
    }

    // Get popular templates
    if (popular) {
      const templates = getPopularTemplates(10);
      return { data: templates };
    }

    // Get suggested templates based on user's feeds
    if (suggest && session?.user.id) {
      // In a real implementation, we would fetch user's feed topics
      // For now, return popular templates
      const templates = getPopularTemplates();
      return { data: templates };
    }

    // Search by keyword
    if (keyword) {
      const templates = searchTemplates(keyword);
      return { data: templates };
    }

    // Filter by category
    if (category) {
      const templates = getTemplatesByCategory(category);
      return { data: templates };
    }

    // Return all templates
    const templates = getAllTemplates();
    return { data: templates };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Get performance insights for user's saved searches
 */
export async function getSavedSearchInsightsAction() {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    // Get all saved searches for the user
    const savedSearches = await prisma.saved_searches.findMany({
      where: {
        userId: session.user.id,
        archived: false,
      },
      include: {
        matches: {
          include: {
            article: {
              include: {
                read_articles: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    // Calculate insights for each search
    const insights = savedSearches.map(search => {
      const matches = search.matches;
      const totalMatches = matches.length;

      // New matches in last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const newMatchesLast24h = matches.filter(m => m.createdAt > yesterday).length;

      // Average relevance score
      const avgRelevanceScore =
        totalMatches > 0
          ? matches.reduce((sum, m) => sum + m.relevanceScore, 0) / totalMatches
          : 0;

      // Engagement rate (percentage of matched articles that were read)
      const readArticles = matches.filter(m => m.article.read_articles.length > 0).length;
      const engagementRate = totalMatches > 0 ? (readArticles / totalMatches) * 100 : 0;

      // Determine trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (newMatchesLast24h > 5) {
        trend = 'up';
      } else if (newMatchesLast24h === 0 && totalMatches > 0) {
        trend = 'down';
      }

      // Determine status
      let status: 'productive' | 'underperforming' | 'inactive' = 'productive';
      if (totalMatches === 0 || !search.lastMatchedAt) {
        status = 'inactive';
      } else if (totalMatches < 5 || avgRelevanceScore < 0.5) {
        status = 'underperforming';
      }

      // Check if inactive (no matches in last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (search.lastMatchedAt && new Date(search.lastMatchedAt) < sevenDaysAgo) {
        status = 'inactive';
      }

      return {
        id: search.id,
        name: search.name,
        icon: search.icon || '🔍',
        totalMatches,
        newMatchesLast24h,
        avgRelevanceScore,
        engagementRate,
        trend,
        status,
        lastMatchedAt: search.lastMatchedAt?.toISOString() || null,
      };
    });

    // Calculate overall stats
    const stats = {
      totalSearches: savedSearches.length,
      activeSearches: insights.filter(i => i.status !== 'inactive').length,
      totalMatches: insights.reduce((sum, i) => sum + i.totalMatches, 0),
      avgMatchesPerSearch:
        savedSearches.length > 0
          ? insights.reduce((sum, i) => sum + i.totalMatches, 0) / savedSearches.length
          : 0,
    };

    logger.info('Fetched saved search insights', {
      userId: session.user.id,
      totalSearches: stats.totalSearches,
      totalMatches: stats.totalMatches,
    });

    return {
      data: {
        insights,
        stats,
      },
    };
  } catch (error) {
    logger.error('Failed to fetch saved search insights', {
      error: error instanceof Error ? error.message : String(error),
      userId: session.user.id,
    });

    throw new Error('Failed to fetch insights');
  }
}
