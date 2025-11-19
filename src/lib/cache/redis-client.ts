/**
 * Redis Client Wrapper
 * Manages Redis connection with connection pooling and error handling
 */

import Redis from "ioredis";
import { logger } from "../logger";

let redisClient: Redis | null = null;

/**
 * Get Redis client instance (singleton)
 */
export function getRedisClient(): Redis | null {
  // Check if caching is enabled
  const cacheEnabled = process.env.CACHE_ENABLED !== "false";
  if (!cacheEnabled) {
    return null;
  }

  // Return existing client if available
  if (redisClient) {
    return redisClient;
  }

  try {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    const redisPassword = process.env.REDIS_PASSWORD;

    redisClient = new Redis(redisUrl, {
      password: redisPassword,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true;
        }
        return false;
      },
      lazyConnect: true, // Don't connect immediately
    });

    // Handle connection events
    redisClient.on("connect", () => {
      logger.info("Redis client connected");
    });

    redisClient.on("ready", () => {
      logger.info("Redis client ready");
    });

    redisClient.on("error", (err) => {
      logger.error("Redis client error", { error: err.message });
    });

    redisClient.on("close", () => {
      logger.warn("Redis client connection closed");
    });

    redisClient.on("reconnecting", () => {
      logger.info("Redis client reconnecting");
    });

    // Connect to Redis
    redisClient.connect().catch((err) => {
      logger.error("Failed to connect to Redis", { error: err.message });
      redisClient = null;
    });

    return redisClient;
  } catch (error) {
    logger.error("Failed to initialize Redis client", { error });
    return null;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info("Redis client disconnected");
  }
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.ping();
    return true;
  } catch (error) {
    logger.error("Redis ping failed", { error });
    return false;
  }
}

/**
 * Get Redis connection status
 */
export function getRedisStatus(): {
  connected: boolean;
  enabled: boolean;
} {
  const enabled = process.env.CACHE_ENABLED !== "false";
  const connected = redisClient?.status === "ready";

  return { connected, enabled };
}

