import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";

/**
 * React Query Hooks for Bulk Feed Operations
 *
 * Provides hooks for performing operations on multiple feeds at once
 */

export interface BulkUpdateResult {
  success: boolean;
  updatedCount: number;
  failedIds: string[];
  errors: string[];
}

/**
 * Bulk update feed category
 */
export function useBulkUpdateFeedCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feedIds, categoryId }: { feedIds: string[]; categoryId: string | null }) => {
      const response = await fetch("/api/feeds/bulk/category", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedIds, categoryId }),
      });
      if (!response.ok) throw new Error("Failed to update feed categories");
      const data = await response.json();
      return data.data as BulkUpdateResult;
    },
    onSuccess: () => {
      // Invalidate all feed-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

/**
 * Bulk update feed tags
 */
export function useBulkUpdateFeedTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      feedIds,
      action,
      tags,
    }: {
      feedIds: string[];
      action: "add" | "remove" | "replace";
      tags: string[];
    }) => {
      const response = await fetch("/api/feeds/bulk/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedIds, action, tags }),
      });
      if (!response.ok) throw new Error("Failed to update feed tags");
      const data = await response.json();
      return data.data as BulkUpdateResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
    },
  });
}

/**
 * Bulk update feed settings
 */
export function useBulkUpdateFeedSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      feedIds,
      settings,
    }: {
      feedIds: string[];
      settings: {
        refreshInterval?: number;
        maxArticlesPerFeed?: number;
        maxArticleAge?: number;
      };
    }) => {
      const response = await fetch("/api/feeds/bulk/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedIds, settings }),
      });
      if (!response.ok) throw new Error("Failed to update feed settings");
      const data = await response.json();
      return data.data as BulkUpdateResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
    },
  });
}

/**
 * Bulk delete feeds
 */
export function useBulkDeleteFeeds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedIds: string[]) => {
      const response = await fetch("/api/feeds/bulk/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedIds }),
      });
      if (!response.ok) throw new Error("Failed to delete feeds");
      const data = await response.json();
      return data.data as BulkUpdateResult;
    },
    onSuccess: () => {
      // Invalidate all feed-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

/**
 * Bulk refresh feeds
 */
export function useBulkRefreshFeeds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedIds: string[]) => {
      const response = await fetch("/api/feeds/bulk/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedIds }),
      });
      if (!response.ok) throw new Error("Failed to refresh feeds");
      const data = await response.json();
      return data.data as BulkUpdateResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
    },
  });
}
