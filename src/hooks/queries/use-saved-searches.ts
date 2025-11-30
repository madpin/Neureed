/**
 * Saved Searches Query Hooks
 *
 * These hooks manage saved search data fetching and mutations.
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/query/api-client";
import type { Article } from "./use-articles";

/**
 * Saved Search type
 */
export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query: string;
  icon?: string;
  threshold: number;
  categoryId?: string;

  // Notification settings
  notifyOnMatch: boolean;
  notifyThreshold: number;
  dailyDigest: boolean;

  // Advanced settings
  recencyBias: number;
  prioritySources?: string[]; // Array of feed IDs

  // Metadata
  createdAt: string;
  updatedAt: string;
  lastMatchedAt?: string;
  totalMatches: number;
  archived: boolean;

  // Relations
  category?: {
    id: string;
    name: string;
    icon?: string;
  };
}

/**
 * Saved Search Match type
 */
export interface SavedSearchMatch {
  id: string;
  savedSearchId: string;
  articleId: string;
  relevanceScore: number;
  matchedTerms: string[];
  matchReason?: string;
  createdAt: string;
  notified: boolean;

  // Relations
  article?: Article;
}

/**
 * Create Saved Search input
 */
export interface CreateSavedSearchInput {
  name: string;
  query: string;
  icon?: string;
  threshold?: number;
  categoryId?: string;
  notifyOnMatch?: boolean;
  notifyThreshold?: number;
  dailyDigest?: boolean;
  recencyBias?: number;
  prioritySources?: string[];
}

/**
 * Update Saved Search input
 */
export interface UpdateSavedSearchInput {
  name?: string;
  query?: string;
  icon?: string;
  threshold?: number;
  categoryId?: string;
  notifyOnMatch?: boolean;
  notifyThreshold?: number;
  dailyDigest?: boolean;
  recencyBias?: number;
  prioritySources?: string[];
  archived?: boolean;
}

/**
 * Get matching articles options
 */
export interface GetMatchingArticlesOptions {
  limit?: number;
  offset?: number;
  sortBy?: "relevance" | "date" | "combined";
  startDate?: Date;
  endDate?: Date;
  feedIds?: string[];
}

/**
 * Get matching articles response
 */
export interface GetMatchingArticlesResponse {
  articles: Article[];
  matches: SavedSearchMatch[];
  total: number;
  pagination?: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Fetch all saved searches
 */
async function fetchSavedSearches(
  includeArchived = false
): Promise<SavedSearch[]> {
  const response = await apiGet<{ data: SavedSearch[] }>(
    "/api/saved-searches",
    { includeArchived }
  );
  return response.data;
}

/**
 * Fetch a single saved search by ID
 */
async function fetchSavedSearch(id: string): Promise<SavedSearch> {
  const response = await apiGet<{ data: SavedSearch }>(
    `/api/saved-searches/${id}`
  );
  return response.data;
}

/**
 * Create a new saved search
 */
async function createSavedSearch(
  input: CreateSavedSearchInput
): Promise<SavedSearch> {
  const response = await apiPost<{ data: SavedSearch }>(
    "/api/saved-searches",
    input
  );
  return response.data;
}

/**
 * Update a saved search
 */
async function updateSavedSearch(
  id: string,
  input: UpdateSavedSearchInput
): Promise<SavedSearch> {
  const response = await apiPut<{ data: SavedSearch }>(
    `/api/saved-searches/${id}`,
    input
  );
  return response.data;
}

/**
 * Delete a saved search
 */
async function deleteSavedSearch(id: string): Promise<void> {
  await apiDelete(`/api/saved-searches/${id}`);
}

/**
 * Get articles matching a saved search
 */
async function getMatchingArticles(
  id: string,
  options?: GetMatchingArticlesOptions
): Promise<GetMatchingArticlesResponse> {
  const response = await apiGet<{ data: GetMatchingArticlesResponse }>(
    `/api/saved-searches/${id}/articles`,
    options as Record<string, unknown>
  );
  return response.data;
}

/**
 * Preview search results without saving
 */
async function previewSearch(query: string): Promise<Article[]> {
  const response = await apiPost<{ data: Article[] }>(
    `/api/saved-searches/preview`,
    { query }
  );
  return response.data;
}

/**
 * Trigger rematch for a saved search
 */
async function rematchSavedSearch(id: string): Promise<{ newMatches: number }> {
  const response = await apiPost<{ data: { newMatches: number } }>(
    `/api/saved-searches/${id}/rematch`,
    {}
  );
  return response.data;
}

/**
 * Hook: Fetch all saved searches
 */
export function useSavedSearches(includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.savedSearches.list(includeArchived),
    queryFn: () => fetchSavedSearches(includeArchived),
  });
}

/**
 * Hook: Fetch a single saved search
 */
export function useSavedSearch(id: string) {
  return useQuery({
    queryKey: queryKeys.savedSearches.detail(id),
    queryFn: () => fetchSavedSearch(id),
    enabled: !!id,
  });
}

/**
 * Hook: Create saved search
 */
export function useCreateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSavedSearch,
    onSuccess: () => {
      // Invalidate saved searches list
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedSearches.lists(),
      });
    },
  });
}

/**
 * Hook: Update saved search
 */
export function useUpdateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSavedSearchInput }) =>
      updateSavedSearch(id, input),
    onSuccess: (_, variables) => {
      // Invalidate saved searches list and detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedSearches.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedSearches.detail(variables.id),
      });
    },
  });
}

/**
 * Hook: Delete saved search
 */
export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSavedSearch,
    onSuccess: () => {
      // Invalidate saved searches list
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedSearches.lists(),
      });
    },
  });
}

/**
 * Hook: Get matching articles for a saved search
 */
export function useMatchingArticles(
  id: string,
  options?: GetMatchingArticlesOptions
) {
  return useQuery({
    queryKey: queryKeys.savedSearches.articles(id, options),
    queryFn: () => getMatchingArticles(id, options),
    enabled: !!id,
  });
}

/**
 * Hook: Get matching articles with infinite scroll
 */
export function useInfiniteMatchingArticles(
  id: string,
  options?: Omit<GetMatchingArticlesOptions, 'offset' | 'limit'>,
  limit = 20
) {
  return useInfiniteQuery({
    queryKey: queryKeys.savedSearches.articles(id, { ...options, limit }),
    queryFn: ({ pageParam = 0 }) =>
      getMatchingArticles(id, { ...options, limit, offset: pageParam }),
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (!lastPage || !lastPage.articles) return undefined;
      const currentOffset = lastPageParam as number;
      const hasMore = currentOffset + lastPage.articles.length < lastPage.total;
      return hasMore ? currentOffset + limit : undefined;
    },
    initialPageParam: 0,
    enabled: !!id,
  });
}

/**
 * Hook: Preview search results
 */
export function usePreviewSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.savedSearches.preview(query),
    queryFn: () => previewSearch(query),
    enabled: query.length >= 2,
  });
}

/**
 * Hook: Rematch saved search
 */
export function useRematchSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rematchSavedSearch,
    onSuccess: (_, id) => {
      // Invalidate saved search detail and articles
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedSearches.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedSearches.articles(id),
      });
    },
  });
}
