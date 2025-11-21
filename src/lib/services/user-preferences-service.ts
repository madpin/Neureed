import { prisma } from "../db";
import type { user_preferences } from "@prisma/client";
import { encrypt, decrypt, maskApiKey } from "../crypto";
import { logger } from "../logger";
import {
  validateUserPreferenceValue,
  getDefaultUserPreferences as getAdminDefaults,
  getSystemLLMCredentials,
} from "./admin-settings-service";

/**
 * Get user preferences (with decrypted API key masked for security)
 */
export async function getUserPreferences(userId: string): Promise<user_preferences | null> {
  const prefs = await prisma.user_preferences.findUnique({
    where: { userId },
  });

  if (!prefs) return null;

  // Decrypt and mask API key for display
  if (prefs.llmApiKey) {
    try {
      const decryptedKey = decrypt(prefs.llmApiKey);
      return {
        ...prefs,
        llmApiKey: decryptedKey ? maskApiKey(decryptedKey) : null,
      };
    } catch (error) {
      // If decryption fails (e.g., encryption key changed), clear the invalid key
      // User will need to re-enter their API key
      logger.warn("Failed to decrypt API key, clearing invalid value", { userId, error });
      await prisma.user_preferences.update({
        where: { userId },
        data: { llmApiKey: null },
      });
      return {
        ...prefs,
        llmApiKey: null,
      };
    }
  }

  return prefs;
}

/**
 * Get user preferences with decrypted API key (for internal use only)
 */
export async function getUserPreferencesWithDecryptedKey(userId: string): Promise<user_preferences | null> {
  const prefs = await prisma.user_preferences.findUnique({
    where: { userId },
  });

  if (!prefs) return null;

  // Decrypt API key
  if (prefs.llmApiKey) {
    try {
      const decryptedKey = decrypt(prefs.llmApiKey);
      return {
        ...prefs,
        llmApiKey: decryptedKey || null,
      };
    } catch (error) {
      // If decryption fails (e.g., encryption key changed), clear the invalid key
      logger.warn("Failed to decrypt API key for internal use, clearing invalid value", { userId, error });
      await prisma.user_preferences.update({
        where: { userId },
        data: { llmApiKey: null },
      });
      return {
        ...prefs,
        llmApiKey: null,
      };
    }
  }

  return prefs;
}

/**
 * Update user preferences with constraint validation
 */
export async function updateUserPreferences(
  userId: string,
  data: Partial<Omit<user_preferences, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<user_preferences> {
  // Validate user preferences against admin constraints
  if (data.defaultRefreshInterval !== undefined) {
    const validation = await validateUserPreferenceValue(
      "refreshInterval",
      data.defaultRefreshInterval
    );
    if (!validation.valid) {
      throw new Error(validation.error);
    }
  }

  if (data.defaultMaxArticlesPerFeed !== undefined) {
    const validation = await validateUserPreferenceValue(
      "maxArticlesPerFeed",
      data.defaultMaxArticlesPerFeed
    );
    if (!validation.valid) {
      throw new Error(validation.error);
    }
  }

  if (data.defaultMaxArticleAge !== undefined) {
    const validation = await validateUserPreferenceValue(
      "maxArticleAge",
      data.defaultMaxArticleAge
    );
    if (!validation.valid) {
      throw new Error(validation.error);
    }
  }

  // Encrypt API key if provided
  const processedData = { ...data };
  if (processedData.llmApiKey !== undefined) {
    // If the API key is null or empty, just pass it through (clear it)
    if (!processedData.llmApiKey || processedData.llmApiKey.trim() === "") {
      processedData.llmApiKey = null;
    }
    // Only encrypt if it's not already masked (doesn't contain bullets)
    else if (!processedData.llmApiKey.includes("••••")) {
      processedData.llmApiKey = encrypt(processedData.llmApiKey);
    } else {
      // If it's masked, don't update it (keep existing)
      delete processedData.llmApiKey;
    }
  }

  // Check if preferences exist
  const existing = await prisma.user_preferences.findUnique({
    where: { userId },
  });

  let updated: user_preferences;
  if (existing) {
    updated = await prisma.user_preferences.update({
      where: { userId },
      data: processedData as any,
    });
  } else {
    // Create with defaults if doesn't exist (inherit from admin defaults)
    const defaults = await getDefaultPreferences();
    updated = await prisma.user_preferences.create({
      data: {
        userId,
        ...defaults,
        ...processedData,
      } as any,
    });
  }

  // Return with masked API key
  if (updated.llmApiKey) {
    const decryptedKey = decrypt(updated.llmApiKey);
    return {
      ...updated,
      llmApiKey: decryptedKey ? maskApiKey(decryptedKey) : null,
    };
  }

  return updated;
}

/**
 * Get default preferences (inherit from admin defaults where applicable)
 */
export async function getDefaultPreferences(): Promise<
  Omit<user_preferences, "id" | "userId" | "createdAt" | "updatedAt">
> {
  // Get admin-defined defaults
  const adminDefaults = await getAdminDefaults();

  return {
    theme: "system",
    fontSize: "medium",
    articlesPerPage: 20,
    defaultView: "expanded",
    showReadArticles: true,
    autoMarkAsRead: false,
    showRelatedExcerpts: false,
    bounceThreshold: 0.25,
    showLowRelevanceArticles: true,
    llmProvider: null,
    llmApiKey: null,
    llmBaseUrl: null,
    llmSummaryModel: null,
    llmEmbeddingModel: null,
    llmDigestModel: null,
    embeddingsEnabled: adminDefaults.embeddingsEnabled, // Inherit from admin
    readingPanelEnabled: false,
    readingPanelPosition: "right",
    readingPanelSize: 50,
    sidebarCollapsed: false,
    categoryStates: null,
    readingFontFamily: "Georgia",
    readingFontSize: 18,
    readingLineHeight: 1.7,
    readingParagraphSpacing: 1.5,
    breakLineSpacing: 0.75,
    showReadingTime: true,
    defaultRefreshInterval: 60,
    defaultMaxArticlesPerFeed: 500,
    defaultMaxArticleAge: 90,
    articleSortOrder: "publishedAt",
    articleSortDirection: "desc",
    infiniteScrollMode: "both",
    searchRecencyWeight: adminDefaults.searchRecencyWeight, // Inherit from admin
    searchRecencyDecayDays: adminDefaults.searchRecencyDecayDays, // Inherit from admin
    // Article Display Customization
    showArticleImage: true,
    showArticleExcerpt: true,
    showArticleAuthor: true,
    showArticleFeedInfo: true,
    showArticleDate: true,
    articleCardSectionOrder: ["feedInfo", "title", "excerpt", "actions"],
    articleCardDensity: "normal",
  };
}

/**
 * Get user preferences with system LLM credentials merged
 * If user hasn't set their own credentials, use system credentials
 */
export async function getUserPreferencesWithSystemFallback(
  userId: string
): Promise<user_preferences | null> {
  const userPrefs = await getUserPreferencesWithDecryptedKey(userId);
  if (!userPrefs) return null;

  // If user doesn't have their own LLM credentials, use system credentials
  if (!userPrefs.llmProvider || !userPrefs.llmApiKey) {
    const systemCreds = await getSystemLLMCredentials(false);
    
    return {
      ...userPrefs,
      llmProvider: userPrefs.llmProvider || systemCreds.provider,
      llmApiKey: userPrefs.llmApiKey || systemCreds.apiKey,
      llmBaseUrl: userPrefs.llmBaseUrl || systemCreds.baseUrl,
      // Feature-specific models inherit from system if not set
      llmSummaryModel: userPrefs.llmSummaryModel || systemCreds.model,
      llmEmbeddingModel: userPrefs.llmEmbeddingModel || systemCreds.model,
      llmDigestModel: userPrefs.llmDigestModel || systemCreds.model,
    };
  }

  return userPrefs;
}

/**
 * Reset user preferences to defaults
 */
export async function resetUserPreferences(userId: string): Promise<user_preferences> {
  return await prisma.user_preferences.update({
    where: { userId },
    data: getDefaultPreferences() as any,
  });
}

