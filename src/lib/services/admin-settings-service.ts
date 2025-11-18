/**
 * Admin Settings Service
 * Manages system-wide admin settings with database storage and environment variable fallback
 */

import { prisma } from "@/src/lib/db";
import { env } from "@/src/env";
import { logger } from "@/src/lib/logger";
import { AdminSettings } from "@prisma/client";

/**
 * Get a specific admin setting by key
 * Falls back to environment variable if not found in database
 */
export async function getAdminSetting<T = any>(
  key: string,
  envFallback?: T
): Promise<T | null> {
  try {
    const setting = await prisma.adminSettings.findUnique({
      where: { key },
    });

    if (setting) {
      return setting.value as T;
    }

    // Return environment fallback if provided
    return envFallback !== undefined ? envFallback : null;
  } catch (error) {
    logger.error("Failed to get admin setting", { key, error });
    return envFallback !== undefined ? envFallback : null;
  }
}

/**
 * Update or create an admin setting
 */
export async function updateAdminSetting(
  key: string,
  value: any,
  description?: string
): Promise<AdminSettings> {
  try {
    const setting = await prisma.adminSettings.upsert({
      where: { key },
      update: {
        value,
        description: description || undefined,
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
        description,
      },
    });

    logger.info("Admin setting updated", { key, value });
    return setting;
  } catch (error) {
    logger.error("Failed to update admin setting", { key, error });
    throw error;
  }
}

/**
 * Get all admin settings
 */
export async function getAllAdminSettings(): Promise<AdminSettings[]> {
  try {
    return await prisma.adminSettings.findMany({
      orderBy: { key: "asc" },
    });
  } catch (error) {
    logger.error("Failed to get all admin settings", { error });
    return [];
  }
}

/**
 * Delete an admin setting
 */
export async function deleteAdminSetting(key: string): Promise<void> {
  try {
    await prisma.adminSettings.delete({
      where: { key },
    });
    logger.info("Admin setting deleted", { key });
  } catch (error) {
    logger.error("Failed to delete admin setting", { key, error });
    throw error;
  }
}

/**
 * Helper function to check if embeddings should be auto-generated
 * Checks database first, falls back to environment variable
 */
export async function shouldAutoGenerateEmbeddings(): Promise<boolean> {
  const dbSetting = await getAdminSetting<boolean>(
    "embedding_auto_generate",
    env.EMBEDDING_AUTO_GENERATE
  );

  return dbSetting ?? env.EMBEDDING_AUTO_GENERATE;
}

/**
 * Get embedding configuration with both DB and env values
 */
export async function getEmbeddingConfiguration(): Promise<{
  autoGenerate: boolean;
  autoGenerateSource: "database" | "environment";
  provider: string;
  model: string;
  batchSize: number;
}> {
  const dbSetting = await prisma.adminSettings.findUnique({
    where: { key: "embedding_auto_generate" },
  });

  const autoGenerate = dbSetting
    ? (dbSetting.value as boolean)
    : env.EMBEDDING_AUTO_GENERATE;
  const autoGenerateSource = dbSetting ? "database" : "environment";

  return {
    autoGenerate,
    autoGenerateSource,
    provider: env.EMBEDDING_PROVIDER,
    model: env.EMBEDDING_MODEL,
    batchSize: env.EMBEDDING_BATCH_SIZE,
  };
}

