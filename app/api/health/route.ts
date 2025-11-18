import { NextRequest } from "next/server";
import { checkDatabaseHealth, checkPgVectorExtension } from "@/src/lib/db";
import { successResponse, errorResponse } from "@/src/lib/api-response";
import { logger } from "@/src/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Health check endpoint
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  try {
    logger.info("Health check requested");

    // Check database connection
    const dbHealth = await checkDatabaseHealth();
    
    // Check pgvector extension
    const pgVectorHealth = await checkPgVectorExtension();

    const isHealthy = dbHealth.healthy && pgVectorHealth.enabled;

    const healthData = {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: dbHealth.healthy,
        message: dbHealth.message,
      },
      pgvector: {
        enabled: pgVectorHealth.enabled,
        message: pgVectorHealth.message,
      },
    };

    if (isHealthy) {
      logger.info("Health check passed", healthData);
      return successResponse(healthData, "Service is healthy");
    } else {
      logger.warn("Health check failed", healthData);
      return errorResponse("Service is unhealthy", 503);
    }
  } catch (error) {
    logger.error("Health check error", error);
    return errorResponse("Health check failed", 503);
  }
}

