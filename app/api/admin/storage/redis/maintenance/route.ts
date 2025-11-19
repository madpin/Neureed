/**
 * Redis Maintenance Operations API
 * POST /api/admin/storage/redis/maintenance - Run Redis maintenance operations
 */

import { NextRequest } from "next/server";
import { getRedisClient } from "@/lib/cache/redis-client";
import { apiResponse, apiError } from "@/lib/api-response";
import { z } from "zod";

const maintenanceSchema = z.object({
  operation: z.enum(["flushdb", "flushall", "save", "bgsave", "bgrewriteaof"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operation } = maintenanceSchema.parse(body);

    const client = getRedisClient();
    if (!client) {
      return apiError("Redis is not available", 503);
    }

    let result: string;
    const startTime = Date.now();

    switch (operation) {
      case "flushdb":
        await client.flushdb();
        result = "Current database flushed successfully";
        break;

      case "flushall":
        await client.flushall();
        result = "All databases flushed successfully";
        break;

      case "save":
        await client.save();
        result = "Synchronous save completed";
        break;

      case "bgsave":
        await client.bgsave();
        result = "Background save initiated";
        break;

      case "bgrewriteaof":
        await client.bgrewriteaof();
        result = "Background AOF rewrite initiated";
        break;

      default:
        return apiError("Invalid operation", 400);
    }

    const duration = Date.now() - startTime;

    return apiResponse({
      message: result,
      duration: `${duration}ms`,
    });
  } catch (error) {
    console.error("Redis maintenance operation failed:", error);
    
    if (error instanceof z.ZodError) {
      return apiError("Invalid request: " + error.errors.map(e => e.message).join(", "), 400);
    }

    return apiError(
      error instanceof Error ? error.message : "Maintenance operation failed",
      500
    );
  }
}

