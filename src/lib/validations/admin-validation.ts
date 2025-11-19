/**
 * Validation schemas for admin settings
 */

import { z } from "zod";

// ============================================================================
// System LLM Credentials
// ============================================================================

export const systemLLMCredentialsSchema = z.object({
  provider: z.enum(["openai", "ollama"]).nullable().optional(),
  apiKey: z.string().nullable().optional(),
  baseUrl: z.string().url().nullable().optional(),
  model: z.string().nullable().optional(),
});

export type SystemLLMCredentialsInput = z.infer<typeof systemLLMCredentialsSchema>;

// ============================================================================
// Provider Control
// ============================================================================

export const providerStatusSchema = z.object({
  openai: z.boolean().optional(),
  local: z.boolean().optional(),
});

export type ProviderStatusInput = z.infer<typeof providerStatusSchema>;

export const setProviderEnabledSchema = z.object({
  provider: z.enum(["openai", "local"]),
  enabled: z.boolean(),
});

export type SetProviderEnabledInput = z.infer<typeof setProviderEnabledSchema>;

// ============================================================================
// User Preference Constraints
// ============================================================================

export const userConstraintsSchema = z.object({
  minRefreshInterval: z.number().int().min(1).max(10080).optional(),
  maxRefreshInterval: z.number().int().min(1).max(10080).optional(),
  minMaxArticlesPerFeed: z.number().int().min(10).max(10000).optional(),
  maxMaxArticlesPerFeed: z.number().int().min(10).max(10000).optional(),
  minMaxArticleAge: z.number().int().min(1).max(730).optional(),
  maxMaxArticleAge: z.number().int().min(1).max(730).optional(),
}).refine(
  (data) => {
    // Validate min < max relationships
    if (data.minRefreshInterval !== undefined && data.maxRefreshInterval !== undefined) {
      if (data.minRefreshInterval >= data.maxRefreshInterval) {
        return false;
      }
    }
    if (data.minMaxArticlesPerFeed !== undefined && data.maxMaxArticlesPerFeed !== undefined) {
      if (data.minMaxArticlesPerFeed >= data.maxMaxArticlesPerFeed) {
        return false;
      }
    }
    if (data.minMaxArticleAge !== undefined && data.maxMaxArticleAge !== undefined) {
      if (data.minMaxArticleAge >= data.maxMaxArticleAge) {
        return false;
      }
    }
    return true;
  },
  {
    message: "Minimum values must be less than maximum values",
  }
);

export type UserConstraintsInput = z.infer<typeof userConstraintsSchema>;

// ============================================================================
// Default User Preferences
// ============================================================================

export const defaultUserPreferencesSchema = z.object({
  embeddingsEnabled: z.boolean().optional(),
  searchRecencyWeight: z.number().min(0).max(1).optional(),
  searchRecencyDecayDays: z.number().int().min(1).max(365).optional(),
});

export type DefaultUserPreferencesInput = z.infer<typeof defaultUserPreferencesSchema>;

// ============================================================================
// Generic Admin Setting
// ============================================================================

export const adminSettingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  description: z.string().optional(),
});

export type AdminSettingInput = z.infer<typeof adminSettingSchema>;

