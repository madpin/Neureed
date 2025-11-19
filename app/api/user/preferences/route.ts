import {
  getUserPreferences,
  updateUserPreferences,
} from "@/lib/services/user-preferences-service";
import { z } from "zod";
import { createHandler } from "@/lib/api-handler";
import { articleSortOrderSchema, articleSortDirectionSchema } from "@/lib/validations/article-validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/preferences
 * Get user preferences
 */
export const GET = createHandler(
  async ({ session }) => {
    const preferences = await getUserPreferences(session!.user!.id);
    return { preferences };
  },
  { requireAuth: true }
);

const preferencesSchema = z.object({
  theme: z.string().optional(), // Allow any string for custom themes
  fontSize: z.string().optional(), // Allow any string for custom font sizes
  articlesPerPage: z.number().int().min(5).max(100).optional(),
  defaultView: z.enum(["compact", "expanded"]).optional(),
  showReadArticles: z.boolean().optional(),
  autoMarkAsRead: z.boolean().optional(),
  showRelatedExcerpts: z.boolean().optional(),
  bounceThreshold: z.number().min(0.1).max(0.5).optional(),
  showLowRelevanceArticles: z.boolean().optional(),
  // LLM Settings
  llmProvider: z.enum(["openai", "ollama"]).nullable().optional(),
  llmModel: z.string().nullable().optional(),
  llmApiKey: z.string().nullable().optional(),
  llmBaseUrl: z.string().url().nullable().optional(),
  // Reading Panel Settings
  readingPanelEnabled: z.boolean().optional(),
  readingPanelPosition: z.enum(["right", "left", "top", "bottom"]).optional(),
  readingPanelSize: z.number().int().min(30).max(70).optional(),
  // Sidebar Settings
  sidebarCollapsed: z.boolean().optional(),
  categoryStates: z.record(z.boolean()).optional(),
  // Reading Typography Settings
  readingFontFamily: z.string().optional(),
  readingFontSize: z.number().int().min(12).max(32).optional(),
  readingLineHeight: z.number().min(1.2).max(2.5).optional(),
  readingParagraphSpacing: z.number().min(0.5).max(3).optional(),
  breakLineSpacing: z.number().min(0.25).max(2).optional(),
  showReadingTime: z.boolean().optional(),
  // Feed Refresh & Cleanup Settings
  defaultRefreshInterval: z.number().int().min(15).max(1440).optional(),
  defaultMaxArticlesPerFeed: z.number().int().min(50).max(5000).optional(),
  defaultMaxArticleAge: z.number().int().min(1).max(365).optional(),
  // Article Sorting Settings
  articleSortOrder: articleSortOrderSchema.optional(),
  articleSortDirection: articleSortDirectionSchema.optional(),
  // Infinite Scroll Settings
  infiniteScrollMode: z.enum(["auto", "button", "both"]).optional(),
  // Semantic Search Recency Settings
  searchRecencyWeight: z.number().min(0).max(1).optional(),
  searchRecencyDecayDays: z.number().int().min(1).max(365).optional(),
});

/**
 * PUT /api/user/preferences
 * Update user preferences
 */
export const PUT = createHandler(
  async ({ body, session }) => {
    console.log("Received preferences update:", body);
    console.log("Validated data:", body);
    
    const preferences = await updateUserPreferences(session!.user!.id, body);
    console.log("Updated preferences:", preferences);

    return {
      preferences,
      message: "Preferences updated successfully",
    };
  },
  { bodySchema: preferencesSchema, requireAuth: true }
);

