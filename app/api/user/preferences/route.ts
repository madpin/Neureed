import {
  getUserPreferences,
  updateUserPreferences,
} from "@/src/lib/services/user-preferences-service";
import { z } from "zod";
import { createHandler } from "@/src/lib/api-handler";

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

