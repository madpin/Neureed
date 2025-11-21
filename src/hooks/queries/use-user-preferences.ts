/**
 * User Preferences Query Hooks
 *
 * These hooks manage user preference data fetching and mutations.
 * User preferences are cached and shared across all components.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { apiGet, apiPut } from "@/lib/query/api-client";

/**
 * User preferences type (matching the API response)
 */
export interface UserPreferences {
  theme?: string;
  fontSize?: string;
  articlesPerPage?: number;
  /** @deprecated Use articleCardDensity instead */
  defaultView?: "compact" | "expanded";
  showReadArticles?: boolean;
  autoMarkAsRead?: boolean;
  showRelatedExcerpts?: boolean;
  bounceThreshold?: number;
  showLowRelevanceArticles?: boolean;
  llmProvider?: string | null;
  llmApiKey?: string | null;
  llmBaseUrl?: string | null;
  llmSummaryModel?: string | null;
  llmEmbeddingModel?: string | null;
  llmDigestModel?: string | null;
  embeddingsEnabled?: boolean;
  readingPanelEnabled?: boolean;
  readingPanelPosition?: string;
  readingPanelSize?: number;
  sidebarCollapsed?: boolean;
  categoryStates?: Record<string, boolean> | null;
  readingFontFamily?: string;
  readingFontSize?: number;
  readingLineHeight?: number;
  readingParagraphSpacing?: number;
  breakLineSpacing?: number;
  showReadingTime?: boolean;
  defaultRefreshInterval?: number;
  defaultMaxArticlesPerFeed?: number;
  defaultMaxArticleAge?: number;
  articleSortOrder?: string;
  articleSortDirection?: string;
  infiniteScrollMode?: string;
  searchRecencyWeight?: number;
  searchRecencyDecayDays?: number;
  // Article Display Customization
  articleCardDensity?: "compact" | "normal" | "comfortable";
  showArticleImage?: boolean;
  showArticleExcerpt?: boolean;
  showArticleAuthor?: boolean;
  showArticleFeedInfo?: boolean;
  showArticleDate?: boolean;
  articleCardSectionOrder?: string[];
}

interface UserPreferencesResponse {
  preferences: UserPreferences;
}

/**
 * Fetch user preferences
 */
async function fetchUserPreferences(): Promise<UserPreferences> {
  const response = await apiGet<UserPreferencesResponse>("/api/user/preferences");
  return response.preferences;
}

/**
 * Update user preferences
 */
async function updateUserPreferences(
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  const response = await apiPut<UserPreferencesResponse>(
    "/api/user/preferences",
    preferences
  );
  return response.preferences;
}

/**
 * Hook to fetch user preferences
 *
 * This hook provides cached access to user preferences with automatic
 * background updates. The data is shared across all components.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data: preferences, isLoading } = useUserPreferences();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return <div>Theme: {preferences?.theme}</div>;
 * }
 * ```
 */
export function useUserPreferences() {
  return useQuery({
    queryKey: queryKeys.user.preferences(),
    queryFn: fetchUserPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes - preferences don't change often
  });
}

/**
 * Hook to update user preferences
 *
 * This hook provides a mutation to update user preferences with optimistic updates.
 * The cache is automatically updated on success.
 *
 * @example
 * ```tsx
 * function PreferencesModal() {
 *   const updatePreferences = useUpdateUserPreferences();
 *
 *   const handleSave = () => {
 *     updatePreferences.mutate({ theme: "dark" });
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserPreferences,
    // Optimistic update
    onMutate: async (newPreferences) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.user.preferences() });

      // Snapshot the previous value
      const previousPreferences = queryClient.getQueryData<UserPreferences>(
        queryKeys.user.preferences()
      );

      // Optimistically update to the new value
      queryClient.setQueryData<UserPreferences>(
        queryKeys.user.preferences(),
        (old) => ({ ...old, ...newPreferences })
      );

      // Return context with the previous value
      return { previousPreferences };
    },
    // If mutation fails, use the context to roll back
    onError: (_error, _variables, context) => {
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          queryKeys.user.preferences(),
          context.previousPreferences
        );
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.preferences() });
    },
  });
}

/**
 * Hook to update a single preference value
 *
 * Convenience hook for updating just one preference field.
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const updatePreference = useUpdatePreference();
 *
 *   return (
 *     <button onClick={() => updatePreference.mutate({ theme: "dark" })}>
 *       Toggle Theme
 *     </button>
 *   );
 * }
 * ```
 */
export function useUpdatePreference() {
  return useUpdateUserPreferences();
}

/**
 * Reset user patterns (learned preferences)
 */
async function resetPatterns(): Promise<void> {
  const response = await fetch("/api/user/patterns/reset", {
    method: "POST",
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to reset patterns" }));
    throw new Error(error.error || "Failed to reset patterns");
  }
}

/**
 * Hook to reset user patterns
 *
 * This hook provides a mutation to reset all learned user patterns/preferences.
 *
 * @example
 * ```tsx
 * function ResetButton() {
 *   const resetPatterns = useResetPatterns();
 *
 *   const handleReset = () => {
 *     if (confirm("Reset all learned patterns?")) {
 *       resetPatterns.mutate();
 *     }
 *   };
 *
 *   return <button onClick={handleReset}>Reset Learning</button>;
 * }
 * ```
 */
export function useResetPatterns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetPatterns,
    onSuccess: () => {
      // Invalidate pattern-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user.patterns() });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
    },
  });
}
