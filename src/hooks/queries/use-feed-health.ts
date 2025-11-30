import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";

/**
 * React Query Hooks for Feed Health Management
 *
 * Provides hooks for monitoring and managing feed health status
 */

export interface FeedHealthStatus {
  feedId: string;
  healthStatus: "healthy" | "warning" | "error" | "disabled";
  consecutiveFailures: number;
  lastSuccessfulFetch: Date | null;
  lastError: string | null;
  httpStatus: number | null;
  redirectUrl: string | null;
}

export interface FeedErrorLog {
  id: string;
  feedId: string;
  errorType: string;
  errorMessage: string;
  httpStatus: number | null;
  timestamp: Date;
}

/**
 * Get health status for a specific feed
 */
export function useFeedHealth(feedId: string) {
  return useQuery<FeedHealthStatus | null>({
    queryKey: queryKeys.feeds.health(feedId),
    queryFn: async () => {
      const response = await fetch(`/api/feeds/${feedId}/health`);
      if (!response.ok) throw new Error("Failed to fetch feed health");
      const data = await response.json();
      return data.data;
    },
    enabled: !!feedId,
  });
}

/**
 * Get health status for multiple feeds
 */
export function useBulkFeedHealth(feedIds: string[]) {
  return useQuery<FeedHealthStatus[]>({
    queryKey: queryKeys.feeds.bulkHealth(feedIds),
    queryFn: async () => {
      const response = await fetch("/api/feeds/bulk-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedIds }),
      });
      if (!response.ok) throw new Error("Failed to fetch bulk feed health");
      const data = await response.json();
      return data.data;
    },
    enabled: feedIds.length > 0,
  });
}

/**
 * Get error logs for a feed
 */
export function useFeedErrorLogs(feedId: string, limit: number = 10) {
  return useQuery<FeedErrorLog[]>({
    queryKey: queryKeys.feeds.errorLogs(feedId, limit),
    queryFn: async () => {
      const response = await fetch(`/api/feeds/${feedId}/errors?limit=${limit}`);
      if (!response.ok) throw new Error("Failed to fetch error logs");
      const data = await response.json();
      return data.data;
    },
    enabled: !!feedId,
  });
}

/**
 * Get unhealthy feeds for current user
 */
export function useUnhealthyFeeds() {
  return useQuery<FeedHealthStatus[]>({
    queryKey: queryKeys.feeds.unhealthy(),
    queryFn: async () => {
      const response = await fetch("/api/feeds/unhealthy");
      if (!response.ok) throw new Error("Failed to fetch unhealthy feeds");
      const data = await response.json();
      return data.data;
    },
  });
}

/**
 * Reset feed health (clear failures and errors)
 */
export function useResetFeedHealth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedId: string) => {
      const response = await fetch(`/api/feeds/${feedId}/health/reset`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to reset feed health");
      return response.json();
    },
    onSuccess: (_, feedId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.health(feedId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.errorLogs(feedId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.unhealthy() });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
    },
  });
}

/**
 * Clear error logs for a feed
 */
export function useClearFeedErrors() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedId: string) => {
      const response = await fetch(`/api/feeds/${feedId}/errors`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to clear error logs");
      return response.json();
    },
    onSuccess: (_, feedId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.errorLogs(feedId) });
    },
  });
}

/**
 * Update auto-disable threshold for a feed
 */
export function useUpdateAutoDisableThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feedId, threshold }: { feedId: string; threshold: number }) => {
      const response = await fetch(`/api/feeds/${feedId}/auto-disable`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold }),
      });
      if (!response.ok) throw new Error("Failed to update auto-disable threshold");
      return response.json();
    },
    onSuccess: (_, { feedId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.detail(feedId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
    },
  });
}

/**
 * Toggle error notifications for a feed
 */
export function useToggleErrorNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feedId, enabled }: { feedId: string; enabled: boolean }) => {
      const response = await fetch(`/api/feeds/${feedId}/error-notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error("Failed to update error notifications");
      return response.json();
    },
    onSuccess: (_, { feedId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.detail(feedId) });
    },
  });
}
