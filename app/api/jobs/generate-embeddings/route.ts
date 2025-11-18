/**
 * Manual Embedding Generation API
 * POST /api/jobs/generate-embeddings
 */

import { logger } from "@/src/lib/logger";
import {
  processArticlesWithoutEmbeddings,
  getEmbeddingJobStatus,
} from "@/src/lib/jobs/embedding-generation-job";
import { getEmbeddingStats } from "@/src/lib/services/article-embedding-service";
import { createHandler } from "@/src/lib/api-handler";
import { apiResponse } from "@/src/lib/api-response";

/**
 * POST - Manually trigger embedding generation
 */
export const POST = createHandler(async ({ body }) => {
  const batchSize = body?.batchSize || 50;
  const maxBatches = body?.maxBatches || 10;
  const dryRun = body?.dryRun || false;

  logger.info("Manual embedding generation triggered", {
    batchSize,
    maxBatches,
    dryRun,
  });

  if (dryRun) {
    // Just return stats without processing
    const stats = await getEmbeddingStats();
    return {
      dryRun: true,
      stats,
      message: "Dry run - no embeddings generated",
    };
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

  return {
    ...result,
    stats,
    message: `Processed ${result.processed} articles, ${result.failed} failed`,
  };
});

/**
 * GET - Get embedding generation status
 */
export const GET = createHandler(async () => {
  const status = getEmbeddingJobStatus();
  const stats = await getEmbeddingStats();

  return {
    status,
    stats,
  };
});

