/**
 * Embedding Generation Background Job
 * Processes articles without embeddings on a schedule
 */

import cron from "node-cron";
import { logger } from "@/lib/logger";
import {
  getArticlesWithoutEmbeddings,
  generateBatchEmbeddings,
  getEmbeddingStats,
} from "@/lib/services/article-embedding-service";
import { env } from "@/env";

let embeddingJobTask: cron.ScheduledTask | null = null;
let isRunning = false;

/**
 * Process articles without embeddings
 */
export async function processArticlesWithoutEmbeddings(
  batchSize: number = 50,
  maxBatches: number = 10
): Promise<{
  processed: number;
  failed: number;
  totalTokens: number;
  batchesProcessed: number;
}> {
  if (isRunning) {
    logger.warn("Embedding generation job already running, skipping");
    return { processed: 0, failed: 0, totalTokens: 0, batchesProcessed: 0 };
  }

  isRunning = true;
  let totalProcessed = 0;
  let totalFailed = 0;
  let totalTokens = 0;
  let batchesProcessed = 0;

  try {
    logger.info("Starting embedding generation job", { batchSize, maxBatches });

    for (let i = 0; i < maxBatches; i++) {
      // Get articles without embeddings
      const articles = await getArticlesWithoutEmbeddings(batchSize);

      if (articles.length === 0) {
        logger.info("No more articles without embeddings");
        break;
      }

      logger.info(`Processing batch ${i + 1}/${maxBatches}`, {
        count: articles.length,
      });

      // Generate embeddings
      const result = await generateBatchEmbeddings(
        articles.map((a) => a.id),
        env.EMBEDDING_PROVIDER
      );

      totalProcessed += result.processed;
      totalFailed += result.failed;
      totalTokens += result.totalTokens;
      batchesProcessed++;

      // Log progress
      logger.info(`Batch ${i + 1} completed`, {
        processed: result.processed,
        failed: result.failed,
        tokens: result.totalTokens,
      });

      // If we processed fewer articles than batch size, we're done
      if (articles.length < batchSize) {
        break;
      }

      // Small delay between batches to avoid overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Get final stats
    const stats = await getEmbeddingStats();
    logger.info("Embedding generation job completed", {
      totalProcessed,
      totalFailed,
      totalTokens,
      batchesProcessed,
      stats,
    });

    return {
      processed: totalProcessed,
      failed: totalFailed,
      totalTokens,
      batchesProcessed,
    };
  } catch (error) {
    logger.error("Embedding generation job failed", { error });
    throw error;
  } finally {
    isRunning = false;
  }
}

/**
 * Start the embedding generation cron job
 * Default: Every hour
 */
export function startEmbeddingGenerationJob(
  schedule: string = "0 * * * *"
): void {
  if (embeddingJobTask) {
    logger.warn("Embedding generation job already started");
    return;
  }

  logger.info("Starting embedding generation cron job", { schedule });

  embeddingJobTask = cron.schedule(schedule, async () => {
    try {
      await processArticlesWithoutEmbeddings();
    } catch (error) {
      logger.error("Embedding generation cron job failed", { error });
    }
  });

  logger.info("Embedding generation cron job started successfully");
}

/**
 * Stop the embedding generation cron job
 */
export function stopEmbeddingGenerationJob(): void {
  if (embeddingJobTask) {
    embeddingJobTask.stop();
    embeddingJobTask = null;
    logger.info("Embedding generation cron job stopped");
  }
}

/**
 * Check if the job is currently running
 */
export function isEmbeddingJobRunning(): boolean {
  return isRunning;
}

/**
 * Get job status
 */
export function getEmbeddingJobStatus(): {
  scheduled: boolean;
  running: boolean;
} {
  return {
    scheduled: embeddingJobTask !== null,
    running: isRunning,
  };
}

