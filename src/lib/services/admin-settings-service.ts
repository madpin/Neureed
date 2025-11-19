/**
 * Admin Settings Service
 * Manages system-wide admin settings with database storage and environment variable fallback
 */

import { prisma } from "@/lib/db";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { AdminSettings } from "@prisma/client";
import { encrypt, decrypt, maskApiKey } from "@/lib/crypto";

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
  providerSource: "database" | "environment";
  model: string;
  batchSize: number;
}> {
  const autoGenerateSetting = await prisma.adminSettings.findUnique({
    where: { key: "embedding_auto_generate" },
  });

  const providerSetting = await prisma.adminSettings.findUnique({
    where: { key: "embedding_provider" },
  });

  const autoGenerate = autoGenerateSetting
    ? (autoGenerateSetting.value as boolean)
    : env.EMBEDDING_AUTO_GENERATE;
  const autoGenerateSource = autoGenerateSetting ? "database" : "environment";

  const provider = providerSetting
    ? (providerSetting.value as string)
    : env.EMBEDDING_PROVIDER;
  const providerSource = providerSetting ? "database" : "environment";

  return {
    autoGenerate,
    autoGenerateSource,
    provider,
    providerSource,
    model: env.EMBEDDING_MODEL,
    batchSize: env.EMBEDDING_BATCH_SIZE,
  };
}

/**
 * Get the active embedding provider
 * Checks database first, falls back to environment variable
 */
export async function getActiveEmbeddingProvider(): Promise<"openai" | "local"> {
  const dbSetting = await getAdminSetting<string>(
    "embedding_provider",
    env.EMBEDDING_PROVIDER
  );

  return (dbSetting ?? env.EMBEDDING_PROVIDER) as "openai" | "local";
}

/**
 * Update the active embedding provider
 */
export async function setActiveEmbeddingProvider(
  provider: "openai" | "local"
): Promise<void> {
  await updateAdminSetting(
    "embedding_provider",
    provider,
    "Active embedding provider (openai or local)"
  );
  logger.info("Embedding provider updated", { provider });
}

/**
 * Get default search recency weight
 * Used as system-wide default for new users
 */
export async function getDefaultSearchRecencyWeight(): Promise<number> {
  const dbSetting = await getAdminSetting<number>(
    "default_search_recency_weight",
    0.3
  );
  return dbSetting ?? 0.3;
}

/**
 * Get default search recency decay days
 * Used as system-wide default for new users
 */
export async function getDefaultSearchRecencyDecayDays(): Promise<number> {
  const dbSetting = await getAdminSetting<number>(
    "default_search_recency_decay_days",
    30
  );
  return dbSetting ?? 30;
}

/**
 * Get search recency configuration
 */
export async function getSearchRecencyConfiguration(): Promise<{
  defaultRecencyWeight: number;
  defaultRecencyWeightSource: "database" | "default";
  defaultRecencyDecayDays: number;
  defaultRecencyDecayDaysSource: "database" | "default";
}> {
  const weightSetting = await prisma.adminSettings.findUnique({
    where: { key: "default_search_recency_weight" },
  });

  const decayDaysSetting = await prisma.adminSettings.findUnique({
    where: { key: "default_search_recency_decay_days" },
  });

  const defaultRecencyWeight = weightSetting
    ? (weightSetting.value as number)
    : 0.3;
  const defaultRecencyWeightSource = weightSetting ? "database" : "default";

  const defaultRecencyDecayDays = decayDaysSetting
    ? (decayDaysSetting.value as number)
    : 30;
  const defaultRecencyDecayDaysSource = decayDaysSetting ? "database" : "default";

  return {
    defaultRecencyWeight,
    defaultRecencyWeightSource,
    defaultRecencyDecayDays,
    defaultRecencyDecayDaysSource,
  };
}

// ============================================================================
// System LLM Credentials
// ============================================================================

export interface SystemLLMCredentials {
  provider: "openai" | "ollama" | null;
  apiKey: string | null;
  baseUrl: string | null;
  model: string | null;
}

/**
 * Get system-wide LLM credentials (with masked API key for display)
 */
export async function getSystemLLMCredentials(
  maskKey: boolean = true
): Promise<SystemLLMCredentials> {
  const provider = await getAdminSetting<string>("system_llm_provider", null);
  const apiKey = await getAdminSetting<string>("system_llm_api_key", null);
  const baseUrl = await getAdminSetting<string>("system_llm_base_url", null);
  const model = await getAdminSetting<string>("system_llm_model", null);

  let decryptedKey: string | null = null;
  if (apiKey) {
    try {
      decryptedKey = decrypt(apiKey);
      if (maskKey) {
        decryptedKey = maskApiKey(decryptedKey);
      }
    } catch (error) {
      logger.warn("Failed to decrypt system LLM API key", { error });
      decryptedKey = null;
    }
  }

  return {
    provider: provider as "openai" | "ollama" | null,
    apiKey: decryptedKey,
    baseUrl,
    model,
  };
}

/**
 * Update system-wide LLM credentials (encrypts API key)
 */
export async function updateSystemLLMCredentials(
  credentials: Partial<SystemLLMCredentials>
): Promise<void> {
  if (credentials.provider !== undefined) {
    if (credentials.provider === null) {
      await deleteAdminSetting("system_llm_provider");
    } else {
      await updateAdminSetting(
        "system_llm_provider",
        credentials.provider,
        "System-wide LLM provider"
      );
    }
  }

  if (credentials.apiKey !== undefined) {
    if (credentials.apiKey === null || credentials.apiKey.trim() === "") {
      await deleteAdminSetting("system_llm_api_key");
    } else if (!credentials.apiKey.includes("••••")) {
      // Only encrypt if not masked
      const encryptedKey = encrypt(credentials.apiKey);
      await updateAdminSetting(
        "system_llm_api_key",
        encryptedKey,
        "Encrypted system-wide LLM API key"
      );
    }
  }

  if (credentials.baseUrl !== undefined) {
    if (credentials.baseUrl === null || credentials.baseUrl.trim() === "") {
      await deleteAdminSetting("system_llm_base_url");
    } else {
      await updateAdminSetting(
        "system_llm_base_url",
        credentials.baseUrl,
        "System-wide LLM base URL"
      );
    }
  }

  if (credentials.model !== undefined) {
    if (credentials.model === null || credentials.model.trim() === "") {
      await deleteAdminSetting("system_llm_model");
    } else {
      await updateAdminSetting(
        "system_llm_model",
        credentials.model,
        "System-wide LLM model"
      );
    }
  }

  logger.info("System LLM credentials updated", {
    provider: credentials.provider,
    hasApiKey: !!credentials.apiKey,
    hasBaseUrl: !!credentials.baseUrl,
    model: credentials.model,
  });
}

// ============================================================================
// Provider Control
// ============================================================================

export interface ProviderStatus {
  openai: boolean;
  local: boolean;
}

/**
 * Get provider enable/disable status
 */
export async function getProviderStatus(): Promise<ProviderStatus> {
  const openaiEnabled = await getAdminSetting<boolean>(
    "openai_provider_enabled",
    true
  );
  const localEnabled = await getAdminSetting<boolean>(
    "local_provider_enabled",
    true
  );

  return {
    openai: openaiEnabled ?? true,
    local: localEnabled ?? true,
  };
}

/**
 * Enable or disable a specific provider
 */
export async function setProviderEnabled(
  provider: "openai" | "local",
  enabled: boolean
): Promise<void> {
  const key = `${provider}_provider_enabled`;
  await updateAdminSetting(
    key,
    enabled,
    `Enable/disable ${provider} embedding provider`
  );

  logger.info("Provider status updated", { provider, enabled });
}

/**
 * Check if a specific provider is enabled
 */
export async function isProviderEnabled(
  provider: "openai" | "local"
): Promise<boolean> {
  const status = await getProviderStatus();
  return status[provider];
}

// ============================================================================
// User Preference Constraints
// ============================================================================

export interface UserConstraints {
  minRefreshInterval: number;
  maxRefreshInterval: number;
  minMaxArticlesPerFeed: number;
  maxMaxArticlesPerFeed: number;
  minMaxArticleAge: number;
  maxMaxArticleAge: number;
}

/**
 * Get all user preference constraints
 */
export async function getUserConstraints(): Promise<UserConstraints> {
  return {
    minRefreshInterval: (await getAdminSetting<number>("min_refresh_interval", 15)) ?? 15,
    maxRefreshInterval: (await getAdminSetting<number>("max_refresh_interval", 1440)) ?? 1440,
    minMaxArticlesPerFeed: (await getAdminSetting<number>("min_max_articles_per_feed", 50)) ?? 50,
    maxMaxArticlesPerFeed: (await getAdminSetting<number>("max_max_articles_per_feed", 5000)) ?? 5000,
    minMaxArticleAge: (await getAdminSetting<number>("min_max_article_age", 1)) ?? 1,
    maxMaxArticleAge: (await getAdminSetting<number>("max_max_article_age", 365)) ?? 365,
  };
}

/**
 * Update user preference constraints
 */
export async function updateUserConstraints(
  constraints: Partial<UserConstraints>
): Promise<void> {
  // Validate that min < max for each constraint pair
  const current = await getUserConstraints();
  const updated = { ...current, ...constraints };

  if (updated.minRefreshInterval >= updated.maxRefreshInterval) {
    throw new Error("minRefreshInterval must be less than maxRefreshInterval");
  }
  if (updated.minMaxArticlesPerFeed >= updated.maxMaxArticlesPerFeed) {
    throw new Error("minMaxArticlesPerFeed must be less than maxMaxArticlesPerFeed");
  }
  if (updated.minMaxArticleAge >= updated.maxMaxArticleAge) {
    throw new Error("minMaxArticleAge must be less than maxMaxArticleAge");
  }

  // Update each constraint
  for (const [key, value] of Object.entries(constraints)) {
    if (value !== undefined) {
      // Convert camelCase to snake_case
      const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      await updateAdminSetting(
        dbKey,
        value,
        `User preference constraint: ${key}`
      );
    }
  }

  logger.info("User constraints updated", constraints);
}

/**
 * Validate a user preference value against constraints
 */
export async function validateUserPreference(
  field: keyof UserConstraints,
  value: number
): Promise<{ valid: boolean; error?: string }> {
  const constraints = await getUserConstraints();

  switch (field) {
    case "minRefreshInterval":
    case "maxRefreshInterval":
      if (field === "minRefreshInterval" && value < 1) {
        return { valid: false, error: "Minimum refresh interval must be at least 1 minute" };
      }
      if (field === "maxRefreshInterval" && value > 10080) {
        return { valid: false, error: "Maximum refresh interval cannot exceed 1 week (10080 minutes)" };
      }
      break;
    case "minMaxArticlesPerFeed":
    case "maxMaxArticlesPerFeed":
      if (field === "minMaxArticlesPerFeed" && value < 10) {
        return { valid: false, error: "Minimum articles per feed must be at least 10" };
      }
      if (field === "maxMaxArticlesPerFeed" && value > 10000) {
        return { valid: false, error: "Maximum articles per feed cannot exceed 10,000" };
      }
      break;
    case "minMaxArticleAge":
    case "maxMaxArticleAge":
      if (field === "minMaxArticleAge" && value < 1) {
        return { valid: false, error: "Minimum article age must be at least 1 day" };
      }
      if (field === "maxMaxArticleAge" && value > 730) {
        return { valid: false, error: "Maximum article age cannot exceed 2 years (730 days)" };
      }
      break;
  }

  return { valid: true };
}

/**
 * Validate user preference value against admin constraints
 */
export async function validateUserPreferenceValue(
  preferenceType: "refreshInterval" | "maxArticlesPerFeed" | "maxArticleAge",
  value: number
): Promise<{ valid: boolean; error?: string }> {
  const constraints = await getUserConstraints();

  switch (preferenceType) {
    case "refreshInterval":
      if (value < constraints.minRefreshInterval) {
        return {
          valid: false,
          error: `Refresh interval must be at least ${constraints.minRefreshInterval} minutes`,
        };
      }
      if (value > constraints.maxRefreshInterval) {
        return {
          valid: false,
          error: `Refresh interval cannot exceed ${constraints.maxRefreshInterval} minutes`,
        };
      }
      break;

    case "maxArticlesPerFeed":
      if (value < constraints.minMaxArticlesPerFeed) {
        return {
          valid: false,
          error: `Maximum articles per feed must be at least ${constraints.minMaxArticlesPerFeed}`,
        };
      }
      if (value > constraints.maxMaxArticlesPerFeed) {
        return {
          valid: false,
          error: `Maximum articles per feed cannot exceed ${constraints.maxMaxArticlesPerFeed}`,
        };
      }
      break;

    case "maxArticleAge":
      if (value < constraints.minMaxArticleAge) {
        return {
          valid: false,
          error: `Maximum article age must be at least ${constraints.minMaxArticleAge} days`,
        };
      }
      if (value > constraints.maxMaxArticleAge) {
        return {
          valid: false,
          error: `Maximum article age cannot exceed ${constraints.maxMaxArticleAge} days`,
        };
      }
      break;
  }

  return { valid: true };
}

// ============================================================================
// Default User Preferences
// ============================================================================

export interface DefaultUserPreferences {
  embeddingsEnabled: boolean;
  searchRecencyWeight: number;
  searchRecencyDecayDays: number;
}

/**
 * Get default user preferences for new users
 */
export async function getDefaultUserPreferences(): Promise<DefaultUserPreferences> {
  return {
    embeddingsEnabled: (await getAdminSetting<boolean>("default_embeddings_enabled", false)) ?? false,
    searchRecencyWeight: (await getAdminSetting<number>("default_search_recency_weight", 0.3)) ?? 0.3,
    searchRecencyDecayDays: (await getAdminSetting<number>("default_search_recency_decay_days", 30)) ?? 30,
  };
}

/**
 * Update default user preferences
 */
export async function updateDefaultUserPreferences(
  defaults: Partial<DefaultUserPreferences>
): Promise<void> {
  if (defaults.embeddingsEnabled !== undefined) {
    await updateAdminSetting(
      "default_embeddings_enabled",
      defaults.embeddingsEnabled,
      "Default embeddings enabled for new users"
    );
  }

  if (defaults.searchRecencyWeight !== undefined) {
    if (defaults.searchRecencyWeight < 0 || defaults.searchRecencyWeight > 1) {
      throw new Error("Search recency weight must be between 0 and 1");
    }
    await updateAdminSetting(
      "default_search_recency_weight",
      defaults.searchRecencyWeight,
      "Default search recency weight for new users"
    );
  }

  if (defaults.searchRecencyDecayDays !== undefined) {
    if (defaults.searchRecencyDecayDays < 1 || defaults.searchRecencyDecayDays > 365) {
      throw new Error("Search recency decay days must be between 1 and 365");
    }
    await updateAdminSetting(
      "default_search_recency_decay_days",
      defaults.searchRecencyDecayDays,
      "Default search recency decay days for new users"
    );
  }

  logger.info("Default user preferences updated", defaults);
}

