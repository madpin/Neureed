import { prisma } from "../db";
import {
  applyPatternDecay,
  cleanupPatterns,
} from "../services/pattern-detection-service";
import { logger } from "../logger";

/**
 * Job to apply pattern decay and cleanup for all users
 * Should be run daily via cron job or scheduled task
 */
export async function runPatternDecayJob(): Promise<{
  usersProcessed: number;
  errors: number;
}> {
  logger.info("Starting pattern decay job");

  let usersProcessed = 0;
  let errors = 0;

  try {
    // Get all users who have patterns
    const usersWithPatterns = await prisma.userPattern.findMany({
      select: { userId: true },
      distinct: ["userId"],
    });

    logger.info(`Found ${usersWithPatterns.length} users with patterns`);

    // Process each user
    for (const { userId } of usersWithPatterns) {
      try {
        // Apply decay to old patterns
        await applyPatternDecay(userId);

        // Cleanup weak patterns
        await cleanupPatterns(userId);

        usersProcessed++;
      } catch (error) {
        logger.error(`Error processing patterns for user ${userId}:`, error);
        errors++;
      }
    }

    logger.info(
      `Pattern decay job completed. Processed: ${usersProcessed}, Errors: ${errors}`
    );

    return { usersProcessed, errors };
  } catch (error) {
    logger.error("Pattern decay job failed:", error);
    throw error;
  }
}

/**
 * Apply pattern decay for a specific user
 */
export async function runPatternDecayForUser(userId: string): Promise<void> {
  logger.info(`Running pattern decay for user ${userId}`);

  try {
    await applyPatternDecay(userId);
    await cleanupPatterns(userId);

    logger.info(`Pattern decay completed for user ${userId}`);
  } catch (error) {
    logger.error(`Error running pattern decay for user ${userId}:`, error);
    throw error;
  }
}

