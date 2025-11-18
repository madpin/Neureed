/**
 * Manual Embedding Generation API
 * POST /api/jobs/generate-embeddings
 */

import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { logger } from "@/src/lib/logger";
import {
  processArticlesWithoutEmbeddings,
  getEmbeddingJobStatus,
} from "@/src/lib/jobs/embedding-generation-job";
import { getEmbeddingStats } from "@/src/lib/services/article-embedding-service";

/**
 * POST - Manually trigger embedding generation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const batchSize = body.batchSize || 50;
    const maxBatches = body.maxBatches || 10;
    const dryRun = body.dryRun || false;

    logger.info("Manual embedding generation triggered", {
      batchSize,
      maxBatches,
      dryRun,
    });

    if (dryRun) {
      // Just return stats without processing
      const stats = await getEmbeddingStats();
      return apiResponse({
        dryRun: true,
        stats,
        message: "Dry run - no embeddings generated",
      });
    }

    // Check if job is already running
    const status = getEmbeddingJobStatus();
    if (status.running) {
      return apiResponse(
        {
          message: "Embedding generation job is already running",
          status,
        },
        409
      );
    }

    // Process articles
    const result = await processArticlesWithoutEmbeddings(
      batchSize,
      maxBatches
    );

    // Get updated stats
    const stats = await getEmbeddingStats();

    return apiResponse({
      ...result,
      stats,
      message: `Processed ${result.processed} articles, ${result.failed} failed`,
    });
  } catch (error) {
    logger.error("Manual embedding generation failed", { error });
    return apiError(
      "Failed to generate embeddings",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}

/**
 * GET - Get embedding generation status
 */
export async function GET() {
  try {
    const status = getEmbeddingJobStatus();
    const stats = await getEmbeddingStats();

    return apiResponse({
      status,
      stats,
    });
  } catch (error) {
    logger.error("Failed to get embedding generation status", { error });
    return apiError(
      "Failed to get status",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}

