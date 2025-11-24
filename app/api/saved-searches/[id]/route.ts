/**
 * API Routes: /api/saved-searches/[id]
 *
 * GET    - Get a specific saved search by ID
 * PUT    - Update a saved search
 * DELETE - Delete a saved search
 */

import { createHandler } from "@/lib/api-handler";
import { z } from "zod";
import * as savedSearchService from "@/lib/services/saved-search-service";
import { rematchSavedSearch } from "@/lib/services/saved-search-matcher";
import { logger } from "@/lib/logger";

// Validation schema for updating a saved search
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

/**
 * GET /api/saved-searches/[id]
 * Get a specific saved search by ID
 */
export const GET = createHandler(
  async ({ session, params }) => {
    const userId = session!.user.id;
    const { id } = params;

    const savedSearch = await savedSearchService.getSavedSearchById(id, userId);

    if (!savedSearch) {
      throw new Error(`Saved search not found: ${id}`);
    }

    // Get statistics
    const stats = await savedSearchService.getSavedSearchStats(id, userId);

    return {
      data: {
        ...savedSearch,
        stats,
      },
    };
  },
  { requireAuth: true }
);

/**
 * PUT /api/saved-searches/[id]
 * Update a saved search
 */
export const PUT = createHandler(
  async ({ body, session, params }) => {
    const userId = session!.user.id;
    const { id } = params;

    // Check if query was updated
    const queryUpdated = body.query !== undefined;

    // Update the saved search
    const savedSearch = await savedSearchService.updateSavedSearch(
      id,
      userId,
      body
    );

    // If query was updated, trigger rematch in background
    if (queryUpdated) {
      rematchSavedSearch(id)
        .catch(error => {
          logger.error("Background rematch failed after query update", {
            error: error instanceof Error ? error.message : String(error),
            savedSearchId: id,
          });
        });
    }

    return {
      data: savedSearch,
      message: queryUpdated
        ? "Saved search updated. Rematching articles in background."
        : "Saved search updated successfully.",
    };
  },
  {
    bodySchema: updateSavedSearchSchema,
    requireAuth: true,
  }
);

/**
 * DELETE /api/saved-searches/[id]
 * Delete a saved search
 */
export const DELETE = createHandler(
  async ({ session, params }) => {
    const userId = session!.user.id;
    const { id } = params;

    await savedSearchService.deleteSavedSearch(id, userId);

    return {
      data: { success: true },
      message: "Saved search deleted successfully.",
    };
  },
  { requireAuth: true }
);
