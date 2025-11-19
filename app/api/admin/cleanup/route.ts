import { NextRequest } from "next/server";
import { z } from "zod";
import {
  cleanupOldArticles,
  getCleanupStats,
} from "@/lib/services/article-cleanup-service";
import { apiResponse, apiError } from "@/lib/api-response";

/**
 * Request schema
 */
const cleanupSchema = z.object({
  maxAge: z.number().int().min(1).max(365).optional().default(90),
  maxArticlesPerFeed: z.number().int().min(10).max(10000).optional().default(1000),
  dryRun: z.boolean().optional().default(false),
});

/**
 * POST /api/admin/cleanup
 * Manually trigger article cleanup
 * 
 * This endpoint should be protected with admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // const session = await getServerSession();
    // if (!session || !session.user.isAdmin) {
    //   return apiError("Unauthorized", 401);
    // }

    const body = await request.json();

    // Validate input
    const validationResult = cleanupSchema.safeParse(body);
    if (!validationResult.success) {
      return apiError(
        "Invalid input",
        400,
        validationResult.error.errors
      );
    }

    const { maxAge, maxArticlesPerFeed, dryRun } = validationResult.data;

    // Execute cleanup
    const result = await cleanupOldArticles({
      maxAge,
      maxArticlesPerFeed,
      preserveStarred: true,
      dryRun,
    });

    return apiResponse({
      success: true,
      deleted: result.deleted,
      preserved: result.preserved,
      dryRun: result.dryRun,
      details: result.details,
    });
  } catch (error) {
    console.error("Error running cleanup:", error);
    return apiError(
      "Failed to run cleanup",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * GET /api/admin/cleanup
 * Get cleanup statistics
 */
export async function GET() {
  try {
    // TODO: Add admin authentication check here

    const stats = await getCleanupStats();

    return apiResponse({
      stats,
    });
  } catch (error) {
    console.error("Error getting cleanup stats:", error);
    return apiError(
      "Failed to get cleanup stats",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

