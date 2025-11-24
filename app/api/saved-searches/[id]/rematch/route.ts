/**
 * API Route: /api/saved-searches/[id]/rematch
 *
 * POST - Trigger rematch for a saved search
 */

import { createHandler } from "@/lib/api-handler";
import { rematchSavedSearch } from "@/lib/services/saved-search-matcher";
import { getSavedSearchById } from "@/lib/services/saved-search-service";

/**
 * POST /api/saved-searches/[id]/rematch
 * Trigger rematch for a saved search
 * This will delete existing matches and re-run the search against all recent articles
 */
export const POST = createHandler(
  async ({ session, params }) => {
    const userId = session!.user.id;
    const { id } = params;

    // Verify ownership
    const savedSearch = await getSavedSearchById(id, userId);
    if (!savedSearch) {
      throw new Error(`Saved search not found: ${id}`);
    }

    // Trigger rematch
    const newMatches = await rematchSavedSearch(id);

    return {
      data: {
        savedSearchId: id,
        newMatches,
      },
      message: `Rematch completed. Found ${newMatches} matching articles.`,
    };
  },
  { requireAuth: true }
);
