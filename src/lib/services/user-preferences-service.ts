import { prisma } from "../db";
import type { UserPreferences } from "@prisma/client";
import { encrypt, decrypt, maskApiKey } from "../crypto";

/**
 * Get user preferences (with decrypted API key masked for security)
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const prefs = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (!prefs) return null;

  // Decrypt and mask API key for display
  if (prefs.llmApiKey) {
    const decryptedKey = decrypt(prefs.llmApiKey);
    return {
      ...prefs,
      llmApiKey: decryptedKey ? maskApiKey(decryptedKey) : null,
    };
  }

  return prefs;
}

/**
 * Get user preferences with decrypted API key (for internal use only)
 */
export async function getUserPreferencesWithDecryptedKey(userId: string): Promise<UserPreferences | null> {
  const prefs = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (!prefs) return null;

  // Decrypt API key
  if (prefs.llmApiKey) {
    return {
      ...prefs,
      llmApiKey: decrypt(prefs.llmApiKey),
    };
  }

  return prefs;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  data: Partial<Omit<UserPreferences, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<UserPreferences> {
  // Encrypt API key if provided
  const processedData = { ...data };
  if (processedData.llmApiKey) {
    // Only encrypt if it's not already masked (doesn't contain bullets)
    if (!processedData.llmApiKey.includes("••••")) {
      processedData.llmApiKey = encrypt(processedData.llmApiKey);
    } else {
      // If it's masked, don't update it (keep existing)
      delete processedData.llmApiKey;
    }
  }

  // Check if preferences exist
  const existing = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  let updated: UserPreferences;
  if (existing) {
    updated = await prisma.userPreferences.update({
      where: { userId },
      data: processedData as any,
    });
  } else {
    // Create with defaults if doesn't exist
    updated = await prisma.userPreferences.create({
      data: {
        userId,
        ...getDefaultPreferences(),
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
 * Get default preferences
 */
export function getDefaultPreferences(): Omit<
  UserPreferences,
  "id" | "userId" | "createdAt" | "updatedAt"
> {
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
    llmModel: null,
    llmApiKey: null,
    llmBaseUrl: null,
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
    searchRecencyWeight: 0.3,
    searchRecencyDecayDays: 30,
  };
}

/**
 * Reset user preferences to defaults
 */
export async function resetUserPreferences(userId: string): Promise<UserPreferences> {
  return await prisma.userPreferences.update({
    where: { userId },
    data: getDefaultPreferences() as any,
  });
}

