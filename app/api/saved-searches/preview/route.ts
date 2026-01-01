/**
 * API Route: /api/saved-searches/preview
 *
 * POST - Preview search results without saving
 */

import { createHandler } from "@/lib/api-handler";
import { z } from "zod";
import * as savedSearchService from "@/lib/services/saved-search-service";

export const dynamic = "force-dynamic";

// Validation schema for preview request
const previewSearchSchema = z.object({
  query: z.string().min(1),
  threshold: z.number().min(0).max(1).optional(),
  recencyBias: z.number().min(0).max(1).optional(),
  prioritySources: z.array(z.string()).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

/**
 * POST /api/saved-searches/preview
 * Preview search results without saving the search
 */
export const POST = createHandler(
  async ({ body, session }) => {
    const userId = session!.user.id;

    // Preview the search
    const result = await savedSearchService.previewSearch(
      body.query,
      userId,
      {
        threshold: body.threshold,
        recencyBias: body.recencyBias,
        prioritySources: body.prioritySources,
        limit: body.limit || 50,
        offset: body.offset || 0,
      }
    );

    return {
      data: {
        results: result.results,
        total: result.total,
        message: "This is a preview. Create a saved search to track matches automatically.",
      },
    };
  },
  {
    bodySchema: previewSearchSchema,
    requireAuth: true,
  }
);
