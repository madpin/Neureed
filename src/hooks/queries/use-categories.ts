/**
 * Categories Query Hooks
 *
 * These hooks manage category data fetching and mutations with optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/query/api-client";

/**
 * Category type
 */
export interface Category {
  id: string;
  name: string;
  color?: string;
  order?: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  feedCount?: number;
}

/**
 * Category with feeds
 */
export interface CategoryWithFeeds extends Category {
  feeds?: Array<{
    id: string;
    title: string;
    url: string;
  }>;
}

/**
 * Fetch all categories
 */
async function fetchCategories(): Promise<Category[]> {
  const response = await apiGet<{ categories: Category[] }>("/api/user/categories");
  return response.categories;
}

/**
 * Fetch category states (expanded/collapsed)
 */
async function fetchCategoryStates(): Promise<Record<string, boolean>> {
  // Category states are stored in user preferences
  const response = await apiGet<{ preferences: { categoryStates?: Record<string, boolean> | null } }>(
    "/api/user/preferences"
  );
  return response.preferences.categoryStates || {};
}

/**
 * Create a new category
 */
async function createCategory(data: {
  name: string;
  color?: string;
}): Promise<Category> {
  const response = await apiPost<{ category: Category }>("/api/user/categories", data);
  return response.category;
}

/**
 * Update a category
 */
async function updateCategory(
  categoryId: string,
  data: { name?: string; color?: string }
): Promise<Category> {
  const response = await apiPut<{ category: Category }>(
    `/api/user/categories/${categoryId}`,
    data
  );
  return response.category;
}

/**
 * Delete a category
 */
async function deleteCategory(categoryId: string): Promise<void> {
  await apiDelete(`/api/user/categories/${categoryId}`);
}

/**
 * Reorder categories
 */
async function reorderCategories(categoryIds: string[]): Promise<void> {
  await apiPost("/api/user/categories/reorder", { categoryIds });
}

/**
 * Assign feeds to a category
 */
async function assignFeedsToCategory(
  categoryId: string,
  feedIds: string[]
): Promise<void> {
  await apiPut(`/api/user/categories/${categoryId}/feeds`, { feedIds });
}

/**
 * Update category state (expanded/collapsed)
 */
async function updateCategoryState(
  categoryId: string,
  expanded: boolean
): Promise<void> {
  // Get current states
  const currentStates = await fetchCategoryStates();
  const newStates = { ...currentStates, [categoryId]: expanded };

  // Update via preferences
  await apiPut("/api/user/preferences", { categoryStates: newStates });
}

/**
 * Hook to fetch all categories
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: fetchCategories,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

/**
 * Hook to fetch category states
 */
export function useCategoryStates() {
  return useQuery({
    queryKey: queryKeys.categories.states(),
    queryFn: fetchCategoryStates,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.grouped() });
    },
  });
}

/**
 * Hook to update a category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, data }: {
      categoryId: string;
      data: { name?: string; color?: string };
    }) => updateCategory(categoryId, data),
    // Optimistic update
    onMutate: async ({ categoryId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.list() });

      const previousCategories = queryClient.getQueryData<Category[]>(
        queryKeys.categories.list()
      );

      queryClient.setQueryData<Category[]>(
        queryKeys.categories.list(),
        (old = []) =>
          old.map((cat) =>
            cat.id === categoryId ? { ...cat, ...data } : cat
          )
      );

      return { previousCategories };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(
          queryKeys.categories.list(),
          context.previousCategories
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.grouped() });
    },
  });
}

/**
 * Hook to delete a category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    // Optimistic update
    onMutate: async (categoryId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.list() });

      const previousCategories = queryClient.getQueryData<Category[]>(
        queryKeys.categories.list()
      );

      queryClient.setQueryData<Category[]>(
        queryKeys.categories.list(),
        (old = []) => old.filter((cat) => cat.id !== categoryId)
      );

      return { previousCategories };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(
          queryKeys.categories.list(),
          context.previousCategories
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.grouped() });
    },
  });
}

/**
 * Hook to reorder categories
 */
export function useReorderCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderCategories,
    // Optimistic update
    onMutate: async (categoryIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.list() });

      const previousCategories = queryClient.getQueryData<Category[]>(
        queryKeys.categories.list()
      );

      // Reorder based on the new order
      queryClient.setQueryData<Category[]>(
        queryKeys.categories.list(),
        (old = []) => {
          const orderMap = new Map(categoryIds.map((id, index) => [id, index]));
          return [...old].sort(
            (a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999)
          );
        }
      );

      return { previousCategories };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(
          queryKeys.categories.list(),
          context.previousCategories
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

/**
 * Hook to assign feeds to a category
 */
export function useAssignFeedsToCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, feedIds }: {
      categoryId: string;
      feedIds: string[];
    }) => assignFeedsToCategory(categoryId, feedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
    },
  });
}

/**
 * Hook to update category state (expanded/collapsed)
 */
export function useUpdateCategoryState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, expanded }: {
      categoryId: string;
      expanded: boolean;
    }) => updateCategoryState(categoryId, expanded),
    // Optimistic update
    onMutate: async ({ categoryId, expanded }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.states() });

      const previousStates = queryClient.getQueryData<Record<string, boolean>>(
        queryKeys.categories.states()
      );

      queryClient.setQueryData<Record<string, boolean>>(
        queryKeys.categories.states(),
        (old = {}) => ({ ...old, [categoryId]: expanded })
      );

      return { previousStates };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousStates) {
        queryClient.setQueryData(
          queryKeys.categories.states(),
          context.previousStates
        );
      }
    },
    onSettled: () => {
      // Also update user preferences cache
      queryClient.invalidateQueries({ queryKey: queryKeys.user.preferences() });
    },
  });
}
