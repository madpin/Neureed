/**
 * Query Keys Factory
 *
 * This file defines all query keys used in the application for React Query.
 * Using a factory pattern ensures type-safety and consistency across the codebase.
 *
 * Benefits:
 * - Type-safe query keys
 * - Easy to refactor and maintain
 * - Centralized query key management
 * - Prevents typos and inconsistencies
 * - Supports hierarchical invalidation
 *
 * Example usage:
 * ```typescript
 * // In a hook
 * const { data } = useQuery({
 *   queryKey: queryKeys.articles.list({ feedId: 1 }),
 *   queryFn: () => fetchArticles({ feedId: 1 })
 * });
 *
 * // Invalidate all articles queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
 *
 * // Invalidate specific feed's articles
 * queryClient.invalidateQueries({ queryKey: queryKeys.articles.list({ feedId: 1 }) });
 * ```
 */

export const queryKeys = {
  // User-related queries
  user: {
    all: ["user"] as const,
    preferences: () => [...queryKeys.user.all, "preferences"] as const,
    patterns: () => [...queryKeys.user.all, "patterns"] as const,
    patternStats: () => [...queryKeys.user.all, "patternStats"] as const,
    feedbackStats: () => [...queryKeys.user.all, "feedbackStats"] as const,
  },

  // Articles queries
  articles: {
    all: ["articles"] as const,
    lists: () => [...queryKeys.articles.all, "list"] as const,
    list: (filters: {
      feedId?: string;
      categoryId?: string;
      sortBy?: string;
      sortOrder?: string;
      unreadOnly?: boolean;
      favoriteOnly?: boolean;
      search?: string;
      semanticSearch?: string;
      topicFilter?: string;
      minScore?: number;
      mode?: "semantic" | "hybrid";
      recencyWeight?: number;
      recencyDecayDays?: number;
      topic?: string;
    }) => [...queryKeys.articles.lists(), filters] as const,
    infinite: (filters: {
      feedId?: string;
      categoryId?: string;
      sortBy?: string;
      sortOrder?: string;
      unreadOnly?: boolean;
      favoriteOnly?: boolean;
      search?: string;
      semanticSearch?: string;
      topicFilter?: string;
      minScore?: number;
      mode?: "semantic" | "hybrid";
      recencyWeight?: number;
      recencyDecayDays?: number;
    }) => [...queryKeys.articles.lists(), "infinite", filters] as const,
    detail: (id: string) => [...queryKeys.articles.all, "detail", id] as const,
    related: (id: string, limit?: number) =>
      [...queryKeys.articles.all, "related", id, limit] as const,
    scores: (articleIds: string[]) =>
      [...queryKeys.articles.all, "scores", articleIds] as const,
    summary: (id: string) => [...queryKeys.articles.all, "summary", id] as const,
    keypoints: (id: string) => [...queryKeys.articles.all, "keypoints", id] as const,
    feedback: (id: string) => [...queryKeys.articles.all, "feedback", id] as const,
    topics: () => [...queryKeys.articles.all, "topics"] as const,
    suggestions: (limit?: number) =>
      [...queryKeys.articles.all, "suggestions", limit] as const,
    recent: (limit?: number) => [...queryKeys.articles.all, "recent", limit] as const,
    search: (query: string, options?: { semanticSearch?: boolean }) =>
      [...queryKeys.articles.all, "search", query, options] as const,
    embeddingStatus: () => [...queryKeys.articles.all, "embeddingStatus"] as const,
  },

  // Feeds queries
  feeds: {
    all: ["feeds"] as const,
    lists: () => [...queryKeys.feeds.all, "list"] as const,
    list: () => [...queryKeys.feeds.lists()] as const,
    detail: (id: string) => [...queryKeys.feeds.all, "detail", id] as const,
    settings: (id: string) => [...queryKeys.feeds.all, "settings", id] as const,
    userFeeds: () => [...queryKeys.feeds.all, "userFeeds"] as const,
    grouped: () => [...queryKeys.feeds.all, "grouped"] as const,
  },

  // Categories queries
  categories: {
    all: ["categories"] as const,
    lists: () => [...queryKeys.categories.all, "list"] as const,
    list: () => [...queryKeys.categories.lists()] as const,
    detail: (id: string) => [...queryKeys.categories.all, "detail", id] as const,
    settings: (id: string) => [...queryKeys.categories.all, "settings", id] as const,
    states: () => [...queryKeys.categories.all, "states"] as const,
  },

  // Admin queries
  admin: {
    all: ["admin"] as const,
    users: () => [...queryKeys.admin.all, "users"] as const,
    config: () => [...queryKeys.admin.all, "config"] as const,
    cache: {
      stats: () => [...queryKeys.admin.all, "cache", "stats"] as const,
    },
    embeddings: {
      all: () => [...queryKeys.admin.all, "embeddings"] as const,
      config: () => [...queryKeys.admin.all, "embeddings", "config"] as const,
      costs: () => [...queryKeys.admin.all, "embeddings", "costs"] as const,
      provider: () => [...queryKeys.admin.all, "embeddings", "provider"] as const,
    },
    cron: {
      status: () => [...queryKeys.admin.all, "cron", "status"] as const,
      history: (jobName?: string) =>
        [...queryKeys.admin.all, "cron", "history", jobName] as const,
    },
    storage: {
      postgres: () => [...queryKeys.admin.all, "storage", "postgres"] as const,
      redis: () => [...queryKeys.admin.all, "storage", "redis"] as const,
    },
    llm: {
      config: () => [...queryKeys.admin.all, "llm", "config"] as const,
    },
    settings: (key: string) => [...queryKeys.admin.all, "settings", key] as const,
    metrics: () => [...queryKeys.admin.all, "metrics"] as const,
  },

  // OPML queries
  opml: {
    all: ["opml"] as const,
    export: (options: { categoryIds?: string[]; feedIds?: string[] }) =>
      [...queryKeys.opml.all, "export", options] as const,
  },

  // Analytics queries
  analytics: {
    all: ["analytics"] as const,
    feedback: () => [...queryKeys.analytics.all, "feedback"] as const,
    patterns: {
      all: () => [...queryKeys.analytics.all, "patterns"] as const,
      list: () => [...queryKeys.analytics.all, "patterns", "list"] as const,
      stats: () => [...queryKeys.analytics.all, "patterns", "stats"] as const,
    },
  },
} as const;

/**
 * Helper type for query keys (simplified - just use readonly string arrays)
 */
export type QueryKey = readonly unknown[];
