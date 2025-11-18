import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { withAuth } from "@/src/lib/middleware/auth-middleware";
import {
  getUserPreferences,
  updateUserPreferences,
} from "@/src/lib/services/user-preferences-service";
import { z } from "zod";

/**
 * GET /api/user/preferences
 * Get user preferences
 */
export async function GET(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const preferences = await getUserPreferences(user.id);
      return apiResponse({ preferences });
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      return apiError(
        "Failed to fetch preferences",
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  });
}

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
});

/**
 * PUT /api/user/preferences
 * Update user preferences
 */
export async function PUT(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json();
      console.log("Received preferences update:", body);
      
      const result = preferencesSchema.safeParse(body);

      if (!result.success) {
        console.error("Validation failed:", result.error.errors);
        return apiError("Invalid request body", 400, result.error.errors);
      }

      console.log("Validated data:", result.data);
      const preferences = await updateUserPreferences(user.id, result.data);
      console.log("Updated preferences:", preferences);

      return apiResponse({
        preferences,
        message: "Preferences updated successfully",
      });
    } catch (error) {
      console.error("Error updating user preferences:", error);
      return apiError(
        "Failed to update preferences",
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  });
}

