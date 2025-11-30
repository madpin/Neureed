'use server';

/**
 * Server Actions for User Preferences operations
 *
 * These actions replace the following API routes:
 * - GET /api/user/preferences
 * - PUT /api/user/preferences
 */

import { auth } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  getUserPreferences,
  updateUserPreferences,
} from '@/lib/services/user-preferences-service';
import {
  articleSortOrderSchema,
  articleSortDirectionSchema,
} from '@/lib/validations/article-validation';

// Validation schema for user preferences
const preferencesSchema = z.object({
  theme: z.string().optional(),
  fontSize: z.string().optional(),
  articlesPerPage: z.number().int().min(5).max(100).optional(),
  defaultView: z.enum(['compact', 'expanded']).optional(),
  showReadArticles: z.boolean().optional(),
  autoMarkAsRead: z.boolean().optional(),
  showRelatedExcerpts: z.boolean().optional(),
  bounceThreshold: z.number().min(0.1).max(0.5).optional(),
  showLowRelevanceArticles: z.boolean().optional(),
  // LLM Settings - Shared
  llmProvider: z.enum(['openai', 'ollama']).nullable().optional(),
  llmApiKey: z.string().nullable().optional(),
  llmBaseUrl: z.string().url().or(z.literal('')).nullable().optional(),
  // LLM Settings - Feature-specific Models
  llmSummaryModel: z.string().nullable().optional(),
  llmEmbeddingModel: z.string().nullable().optional(),
  llmDigestModel: z.string().nullable().optional(),
  // Embedding Settings
  embeddingsEnabled: z.boolean().optional(),
  // Reading Panel Settings
  readingPanelEnabled: z.boolean().optional(),
  readingPanelPosition: z.enum(['right', 'left', 'top', 'bottom']).optional(),
  readingPanelSize: z.number().int().min(30).max(70).optional(),
  // Reading Mode Settings
  readingMode: z.enum(['side_panel', 'inline', 'standalone']).optional(),
  inlineAutoScroll: z.boolean().optional(),
  // Sidebar Settings
  sidebarCollapsed: z.boolean().optional(),
  sidebarWidth: z.number().int().min(10).max(40).optional(),
  categoryStates: z.record(z.string(), z.boolean()).nullable().optional(),
  // Reading Typography Settings
  readingFontFamily: z.string().optional(),
  readingFontSize: z.number().int().min(12).max(32).optional(),
  readingLineHeight: z.number().min(1.2).max(2.5).optional(),
  readingParagraphSpacing: z.number().min(0.5).max(3).optional(),
  breakLineSpacing: z.number().min(0.25).max(2).optional(),
  showReadingTime: z.boolean().optional(),
  // Feed Refresh & Cleanup Settings
  defaultRefreshInterval: z.number().int().min(1).max(10080).optional(),
  defaultMaxArticlesPerFeed: z.number().int().min(10).max(10000).optional(),
  defaultMaxArticleAge: z.number().int().min(1).max(730).optional(),
  // Article Sorting Settings
  articleSortOrder: articleSortOrderSchema.optional(),
  articleSortDirection: articleSortDirectionSchema.optional(),
  // Infinite Scroll Settings
  infiniteScrollMode: z.enum(['auto', 'button', 'both']).optional(),
  // Semantic Search Recency Settings
  searchRecencyWeight: z.number().min(0).max(1).optional(),
  searchRecencyDecayDays: z.number().int().min(1).max(365).optional(),
  // Article Display Customization Settings
  articleCardDensity: z.enum(['compact', 'normal', 'comfortable']).optional(),
  showArticleImage: z.boolean().optional(),
  showArticleExcerpt: z.boolean().optional(),
  showArticleAuthor: z.boolean().optional(),
  showArticleFeedInfo: z.boolean().optional(),
  showArticleDate: z.boolean().optional(),
  articleCardSectionOrder: z.array(z.string()).optional(),
  // Article Border & Spacing Customization
  articleCardBorderWidth: z.enum(['none', 'thin', 'normal', 'thick']).optional(),
  articleCardBorderRadius: z.enum(['sharp', 'slight', 'normal', 'rounded']).optional(),
  articleCardBorderContrast: z.enum(['subtle', 'medium', 'strong']).optional(),
  articleCardSpacing: z
    .enum(['none', 'compact', 'normal', 'comfortable', 'spacious'])
    .optional(),
});

type PreferencesInput = z.infer<typeof preferencesSchema>;

/**
 * Get user preferences
 */
export async function getUserPreferencesAction() {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const preferences = await getUserPreferences(session.user.id);

  return { preferences };
}

/**
 * Update user preferences
 */
export async function updateUserPreferencesAction(input: PreferencesInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const validated = preferencesSchema.parse(input);

    const preferences = await updateUserPreferences(session.user.id, validated);

    revalidatePath('/');

    return {
      preferences,
      message: 'Preferences updated successfully',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}
