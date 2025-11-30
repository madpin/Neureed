/**
 * API Routes: /api/saved-searches
 *
 * GET  - List all saved searches for the current user
 * POST - Create a new saved search
 */

import { createHandler } from "@/lib/api-handler";
import { z } from "zod";
import * as savedSearchService from "@/lib/services/saved-search-service";
import { matchNewArticles } from "@/lib/services/saved-search-matcher";
import { logger } from "@/lib/logger";

// Validation schema for creating a saved search
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

// Query schema for GET requests
const listQuerySchema = z.object({
  includeArchived: z.enum(['true', 'false']).optional().default('false').catch('false'),
});

/**
 * GET /api/saved-searches
 * List all saved searches for the current user
 */
export const GET = createHandler(
  async ({ session, query }) => {
    const userId = session!.user.id;
    const includeArchived = query.includeArchived === 'true';

    const savedSearches = await savedSearchService.getSavedSearches(
      userId,
      includeArchived
    );

    return { data: savedSearches };
  },
  {
    requireAuth: true,
    querySchema: listQuerySchema,
  }
);

/**
 * POST /api/saved-searches
 * Create a new saved search
 */
export const POST = createHandler(
  async ({ body, session }) => {
    const userId = session!.user.id;

    // Create the saved search
    const savedSearch = await savedSearchService.createSavedSearch({
      userId,
      ...body,
    });

    // Trigger initial matching in background (don't await)
    // This will match all recent articles against the new saved search
    matchNewArticles([], userId)
      .catch(error => {
        logger.error("Background matching failed for new saved search", {
          error: error instanceof Error ? error.message : String(error),
          savedSearchId: savedSearch.id,
        });
      });

    return {
      data: savedSearch,
      message: "Saved search created successfully. Matching articles in background.",
    };
  },
  {
    bodySchema: createSavedSearchSchema,
    requireAuth: true,
  }
);
