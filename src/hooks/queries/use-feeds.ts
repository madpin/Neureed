/**
 * Feeds Query Hooks
 *
 * These hooks manage feed data fetching and mutations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/query/api-client";

/**
 * Feed type
 */
export interface Feed {
  id: string;
  name: string;
  url: string;
  description?: string;
  siteUrl?: string;
  imageUrl?: string;
  lastFetched?: string;
  errorCount?: number;
  lastError?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * User feed subscription
 */
export interface UserFeed extends Feed {
  subscribedAt?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  unreadCount?: number;
  settings?: {
    refreshInterval?: number;
    maxArticlesPerFeed?: number;
    maxArticleAge?: number;
  };
}

/**
 * Grouped feeds by category
 */
export interface GroupedFeeds {
  categories: Array<{
    id: string;
    name: string;
    color?: string;
    feeds: UserFeed[];
  }>;
  uncategorized: UserFeed[];
}

/**
 * Fetch all available feeds
 */
async function fetchFeeds(): Promise<Feed[]> {
  const response = await apiGet<{ feeds: Feed[] }>("/api/feeds");
  return response.feeds;
}

/**
 * UserFeed with subscription status (for includeAll mode)
 */
export interface UserFeedWithSubscription extends UserFeed {
  isSubscribed: boolean;
}

/**
 * Fetch user's subscribed feeds
 */
async function fetchUserFeeds(includeAll = false): Promise<UserFeed[] | UserFeedWithSubscription[]> {
  const response = await apiGet<any>("/api/user/feeds",
    includeAll ? { includeAll: true } : {}
  );
  
  if (includeAll) {
    return response.feeds;
  }
  
  // Map subscriptions to UserFeed structure
  return (response.subscriptions || []).map((sub: any) => ({
    ...sub.feeds,
    // Override name with custom name if it exists
    name: sub.customName || sub.feeds.name,
    // Add subscription specific fields
    subscribedAt: sub.createdAt,
    category: sub.category,
    // Preserve feed settings (extraction, etc.) and add user subscription settings
    settings: {
      ...(sub.feeds.settings || {}), // Keep feed-level settings (extraction, etc.)
      refreshInterval: sub.refreshInterval,
      maxArticlesPerFeed: sub.maxArticlesPerFeed,
      maxArticleAge: sub.maxArticleAge,
    },
    // Store original name for reference
    _originalName: sub.feeds.name,
    _subscriptionId: sub.id,
  }));
}

/**
 * Fetch feeds grouped by category
 */
async function fetchGroupedFeeds(): Promise<GroupedFeeds> {
  const response = await apiGet<GroupedFeeds>("/api/user/feeds", {
    groupByCategory: true,
  });
  return response;
}

/**
 * Subscribe to a feed
 */
async function subscribeFeed(feedId: string): Promise<void> {
  await apiPost(`/api/user/feeds`, { feedId });
}

/**
 * Unsubscribe from a feed
 */
async function unsubscribeFeed(feedId: string): Promise<void> {
  await apiDelete(`/api/user/feeds/${feedId}`);
}

/**
 * Validate a feed URL
 */
async function validateFeed(url: string): Promise<{
  valid: boolean;
  feed?: Partial<Feed>;
  error?: string;
}> {
  return await apiPost("/api/feeds/validate", { url });
}

/**
 * Add a new feed
 */
async function addFeed(url: string): Promise<Feed> {
  const response = await apiPost<{ feed: Feed }>("/api/feeds", { url });
  return response.feed;
}

/**
 * Update feed settings
 */
async function updateFeedSettings(
  feedId: string,
  settings: {
    refreshInterval?: number;
    maxArticlesPerFeed?: number;
    maxArticleAge?: number;
  }
): Promise<void> {
  await apiPut(`/api/user/feeds/${feedId}/settings`, settings);
}

/**
 * Refresh a specific feed
 */
async function refreshFeed(feedId: string): Promise<void> {
  await apiPost(`/api/feeds/${feedId}/refresh`);
}

/**
 * Refresh all user feeds
 */
async function refreshAllFeeds(): Promise<void> {
  await apiPost("/api/user/feeds/refresh");
}

/**
 * Delete a feed (system-wide)
 */
async function deleteFeed(feedId: string): Promise<void> {
  await apiDelete(`/api/feeds/${feedId}`);
}

async function removeFeedFromCategories(userFeedId: string): Promise<void> {
  await apiDelete(`/api/user/feeds/${userFeedId}/categories`);
}

/**
 * Hook to fetch all available feeds
 */
export function useFeeds() {
  return useQuery({
    queryKey: queryKeys.feeds.list(),
    queryFn: fetchFeeds,
  });
}

/**
 * Hook to fetch user's subscribed feeds
 * @param includeAll - If true, includes all available feeds with subscription status
 */
export function useUserFeeds(includeAll = false) {
  return useQuery({
    queryKey: [...queryKeys.feeds.userFeeds(), includeAll ? "all" : "subscribed"],
    queryFn: () => fetchUserFeeds(includeAll),
  });
}

/**
 * Hook to fetch feeds grouped by category
 */
export function useGroupedFeeds() {
  return useQuery({
    queryKey: queryKeys.feeds.grouped(),
    queryFn: fetchGroupedFeeds,
  });
}

export function useRemoveFeedFromCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFeedFromCategories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

/**
 * Hook to subscribe to a feed
 */
export function useSubscribeFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subscribeFeed,
    onSuccess: () => {
      // Invalidate all feed-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
      // Also invalidate articles since new feed articles will appear
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
    },
  });
}

/**
 * Hook to unsubscribe from a feed
 */
export function useUnsubscribeFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unsubscribeFeed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
    },
  });
}

/**
 * Hook to delete a feed (system-wide)
 */
export function useDeleteFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFeed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
    },
  });
}

/**
 * Hook to validate a feed URL
 */
export function useValidateFeed() {
  return useMutation({
    mutationFn: validateFeed,
  });
}

/**
 * Hook to add a new feed
 */
export function useAddFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addFeed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
    },
  });
}

/**
 * Hook to update feed settings
 */
export function useUpdateFeedSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feedId, settings }: {
      feedId: string;
      settings: {
        refreshInterval?: number;
        maxArticlesPerFeed?: number;
        maxArticleAge?: number;
      };
    }) => updateFeedSettings(feedId, settings),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.feeds.settings(variables.feedId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.userFeeds() });
    },
  });
}

/**
 * Hook to refresh a specific feed
 */
export function useRefreshFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshFeed,
    onMutate: async () => {
      // Show loading toast immediately
      return { toastId: Date.now() };
    },
    onSuccess: () => {
      // Invalidate articles and notifications to show newly fetched content
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Hook to refresh all feeds
 */
export function useRefreshAllFeeds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshAllFeeds,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
    },
  });
}

/**
 * Bulk settings update type
 */
export interface BulkSettingsUpdate {
  refreshInterval?: number;
  maxArticlesPerFeed?: number;
  maxArticleAge?: number;
  extractionMethod?: "rss" | "readability" | "playwright";
}

/**
 * Hook to bulk update feed settings
 */
export function useBulkUpdateFeedSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      feedIds, 
      settings 
    }: { 
      feedIds: string[]; 
      settings: BulkSettingsUpdate;
    }) => {
      const promises: Promise<any>[] = [];

      // Check if any user feed settings are being updated
      const hasUserFeedSettings = 
        settings.refreshInterval !== undefined ||
        settings.maxArticlesPerFeed !== undefined ||
        settings.maxArticleAge !== undefined;

      if (hasUserFeedSettings) {
        // Build user feed settings object with only defined values
        const userFeedSettings: {
          refreshInterval?: number;
          maxArticlesPerFeed?: number;
          maxArticleAge?: number;
        } = {};

        if (settings.refreshInterval !== undefined) {
          userFeedSettings.refreshInterval = settings.refreshInterval;
        }
        if (settings.maxArticlesPerFeed !== undefined) {
          userFeedSettings.maxArticlesPerFeed = settings.maxArticlesPerFeed;
        }
        if (settings.maxArticleAge !== undefined) {
          userFeedSettings.maxArticleAge = settings.maxArticleAge;
        }

        // Update user feed settings (per-user)
        feedIds.forEach(feedId => {
          promises.push(
            apiPut(`/api/user/feeds/${feedId}/settings`, userFeedSettings)
          );
        });
      }

      // Update extraction method (system-wide)
      if (settings.extractionMethod !== undefined) {
        feedIds.forEach(feedId => {
          promises.push(
            apiPut(`/api/feeds/${feedId}/settings`, {
              method: settings.extractionMethod,
            })
          );
        });
      }

      const results = await Promise.allSettled(promises);

      // Log any errors for debugging
      const errors = results
        .filter((r): r is PromiseRejectedResult => r.status === "rejected")
        .map(r => r.reason);
      
      if (errors.length > 0) {
        console.error("Bulk update errors:", errors);
      }

      return {
        total: results.length,
        successful: results.filter((r) => r.status === "fulfilled").length,
        failed: results.filter((r) => r.status === "rejected").length,
        results,
        errors,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
    },
    onError: (error) => {
      console.error("Bulk update failed:", error);
    },
  });
}
