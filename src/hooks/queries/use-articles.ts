/**
 * Articles Query Hooks
 *
 * These hooks manage article data fetching with infinite scroll, scoring, and mutations.
 */

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { apiGet, apiPost, apiDelete } from "@/lib/query/api-client";
import type { ArticleScore } from "@/lib/services/article-scoring-service";

// Re-export ArticleScore for convenience
export type { ArticleScore };

/**
 * Article type
 */
export interface Article {
  id: string;
  title: string;
  url: string;
  excerpt?: string;
  content?: string;
  author?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  feedId: string;
  feeds?: {
    id: string;
    name: string;
    url: string;
    imageUrl?: string;
  };
  topics?: string[];
  embedding?: unknown;
  isRead?: boolean;
  readAt?: string;
  relevanceScore?: number;
  // Additional fields from Prisma model
  contentHash?: string;
  guid?: string;
  imageUrl?: string;
  keyPoints?: string[];
  summary?: string;
}

/**
 * Article filters
 */
export interface ArticleFilters {
  feedId?: string;
  categoryId?: string;
  sortBy?: "publishedAt" | "relevance" | "title" | "feed" | "updatedAt";
  sortOrder?: "asc" | "desc";
  unreadOnly?: boolean;
  favoriteOnly?: boolean;
  search?: string;
  semanticSearch?: string;
  topicFilter?: string;
  // Search specific params
  minScore?: number;
  mode?: "semantic" | "hybrid";
  recencyWeight?: number;
  recencyDecayDays?: number;
  topic?: string;
}

/**
 * Pagination metadata
 */
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Articles response
 */
interface ArticlesResponse {
  articles: Article[];
  pagination: Pagination;
}

async function fetchArticle(articleId: string): Promise<Article> {
  const response = await apiGet<{ article: Article }>(`/api/articles/${articleId}`);
  return response.article;
}

/**
 * Fetch articles with pagination
 */
async function fetchArticles(
  filters: ArticleFilters & { page: number; limit: number }
): Promise<ArticlesResponse> {
  // If search query is present and long enough, use semantic search
  if (filters.search && filters.search.length >= 2) {
    const response = await apiPost<{ results: Article[]; pagination: Pagination }>(
      "/api/articles/semantic-search",
      {
        query: filters.search,
        limit: filters.limit,
        minScore: filters.minScore ?? 0.7,
        mode: filters.mode ?? "semantic",
        page: filters.page,
        recencyWeight: filters.recencyWeight ?? 0.3,
        recencyDecayDays: filters.recencyDecayDays ?? 30,
      }
    );
    
    return {
      articles: response.results,
      pagination: response.pagination,
    };
  }

  // If querying by topic, use the topics endpoint
  if (filters.topic) {
    const response = await apiGet<{ articles: Article[] }>(
      "/api/articles/topics", 
      {
        topic: filters.topic,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortDirection: filters.sortOrder
      }
    );
    
    // Mock pagination for topics as the endpoint currently doesn't support it fully
    return {
      articles: response.articles,
      pagination: {
        page: 1,
        limit: filters.limit,
        total: response.articles.length,
        totalPages: 1,
        hasMore: false
      }
    };
  }

  return await apiGet<ArticlesResponse>("/api/articles", filters as unknown as Record<string, unknown>);
}

/**
 * Fetch article scores
 */
async function fetchArticleScores(articleIds: string[]): Promise<ArticleScore[]> {
  const response = await apiPost<{ scores: ArticleScore[] }>(
    "/api/user/articles/scores",
    { articleIds }
  );
  return response.scores;
}

/**
 * Fetch related articles
 */
async function fetchRelatedArticles(
  articleId: string,
  limit = 5
): Promise<Article[]> {
  const response = await apiGet<{ results: Article[] }>(
    `/api/articles/${articleId}/related`,
    { limit }
  );
  return response.results;
}

/**
 * Fetch article summary
 */
async function fetchArticleSummary(articleId: string): Promise<{
  summary: string;
  keyPoints: string[];
  topics: string[];
}> {
  const response = await apiGet<{ summary: { summary: string; keyPoints: string[]; topics: string[] } }>(
    `/api/articles/${articleId}/summary`
  );
  return response.summary;
}

/**
 * Fetch article topics
 */
async function fetchArticleTopics(): Promise<string[]> {
  const response = await apiGet<{ topics: string[] }>("/api/articles/topics");
  return response.topics;
}

/**
 * Fetch topics with counts
 */
async function fetchTopicsWithCounts(limit?: number): Promise<{ topic: string; count: number }[]> {
  const response = await apiGet<{ topics: { topic: string; count: number }[] }>("/api/articles/topics", { limit });
  return response.topics;
}

/**
 * Mark article as read
 */
async function markArticleAsRead(articleId: string): Promise<void> {
  await apiPost(`/api/user/articles/${articleId}/read`);
}

/**
 * Track article view
 */
async function trackArticleView(articleId: string): Promise<void> {
  await apiPost(`/api/user/articles/${articleId}/view`);
}

/**
 * Track article exit
 */
async function trackArticleExit(
  articleId: string,
  data: { timeSpent: number; estimatedTime: number }
): Promise<void> {
  await apiPost(`/api/user/articles/${articleId}/exit`, data);
}

/**
 * Fetch article feedback
 */
async function fetchArticleFeedback(articleId: string): Promise<{
  feedbackValue: number | null;
} | null> {
  const response = await apiGet<{ feedback: { feedbackValue: number } | null }>(
    `/api/user/articles/${articleId}/feedback`
  );
  return response.feedback;
}

/**
 * Submit article feedback
 */
async function submitArticleFeedback(
  articleId: string,
  feedbackValue: number
): Promise<void> {
  await apiPost(`/api/user/articles/${articleId}/feedback`, { feedbackValue });
}

/**
 * Delete article feedback
 */
async function deleteArticleFeedback(articleId: string): Promise<void> {
  await apiDelete(`/api/user/articles/${articleId}/feedback`);
}

export function useArticle(articleId: string) {
  return useQuery({
    queryKey: queryKeys.articles.detail(articleId),
    queryFn: () => fetchArticle(articleId),
    enabled: !!articleId,
  });
}

/**
 * Hook to fetch articles with pagination
 */
export function useArticles(filters: ArticleFilters, limit = 20) {
  return useQuery({
    queryKey: queryKeys.articles.list({ ...filters }),
    queryFn: () => fetchArticles({ ...filters, page: 1, limit }),
  });
}

/**
 * Hook to fetch articles with infinite scroll
 *
 * This replaces the old useInfiniteScroll hook with React Query's built-in infinite query support.
 *
 * @example
 * ```tsx
 * function ArticleList() {
 *   const {
 *     data,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetchingNextPage,
 *   } = useInfiniteArticles({ feedId: 1 });
 *
 *   const allArticles = data?.pages.flatMap(page => page.articles) ?? [];
 *
 *   return (
 *     <div>
 *       {allArticles.map(article => <ArticleCard key={article.id} article={article} />)}
 *       {hasNextPage && (
 *         <button onClick={() => fetchNextPage()}>
 *           Load More
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useInfiniteArticles(filters: ArticleFilters, limit = 20) {
  return useInfiniteQuery({
    queryKey: queryKeys.articles.infinite({ ...filters }),
    queryFn: ({ pageParam = 1 }) =>
      fetchArticles({ ...filters, page: pageParam, limit }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });
}

/**
 * Hook to fetch article scores
 */
export function useArticleScores(articleIds: string[]) {
  return useQuery({
    queryKey: queryKeys.articles.scores(articleIds),
    queryFn: () => fetchArticleScores(articleIds),
    enabled: articleIds.length > 0,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch related articles
 */
export function useRelatedArticles(articleId: string, limit = 5) {
  return useQuery({
    queryKey: queryKeys.articles.related(articleId, limit),
    queryFn: () => fetchRelatedArticles(articleId, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch article summary
 * By default, this is lazy - it won't fetch until manually triggered or enabled
 */
export function useArticleSummary(articleId: string, enabled = false) {
  return useQuery({
    queryKey: queryKeys.articles.summary(articleId),
    queryFn: () => fetchArticleSummary(articleId),
    staleTime: Infinity, // Summaries don't change
    enabled, // Only fetch when explicitly enabled
  });
}

/**
 * Hook to generate article summary (triggers the query)
 */
export function useGenerateArticleSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fetchArticleSummary,
    onSuccess: (data, articleId) => {
      // Update the cache with the generated summary
      queryClient.setQueryData(
        queryKeys.articles.summary(articleId),
        data
      );
    },
  });
}

/**
 * Hook to fetch article topics
 */
export function useArticleTopics() {
  return useQuery({
    queryKey: queryKeys.articles.topics(),
    queryFn: fetchArticleTopics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch topics with counts
 */
export function useTopicsWithCounts(limit?: number) {
  return useQuery({
    queryKey: [...queryKeys.articles.topics(), "counts", limit],
    queryFn: () => fetchTopicsWithCounts(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to mark article as read
 */
export function useMarkArticleAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markArticleAsRead,
    onSuccess: (_data, articleId) => {
      // Optimistically update all article queries
      // We need to handle both infinite queries and regular queries
      queryClient.setQueriesData<ArticlesResponse | { pages: ArticlesResponse[], pageParams: any[] }>(
        { queryKey: queryKeys.articles.lists() },
        (old) => {
          if (!old) return old;

          // Handle infinite query data structure
          if ('pages' in old && Array.isArray(old.pages)) {
            return {
              ...old,
              pages: old.pages.map(page => ({
                ...page,
                articles: page.articles.map((article) =>
                  article.id === articleId
                    ? { ...article, isRead: true, readAt: new Date().toISOString() }
                    : article
                )
              }))
            };
          }

          // Handle regular query data structure
          if ('articles' in old && Array.isArray(old.articles)) {
            return {
              ...old,
              articles: old.articles.map((article) =>
                article.id === articleId
                  ? { ...article, isRead: true, readAt: new Date().toISOString() }
                  : article
              ),
            };
          }

          return old;
        }
      );

      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
    },
  });
}

/**
 * Unmark article as read
 */
async function unmarkArticleAsRead(articleId: string): Promise<void> {
  await apiDelete(`/api/user/articles/${articleId}/read`);
}

/**
 * Hook to unmark article as read
 */
export function useMarkArticleAsUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unmarkArticleAsRead,
    onSuccess: (_data, articleId) => {
      // Optimistically update all article queries
      queryClient.setQueriesData<ArticlesResponse | { pages: ArticlesResponse[], pageParams: any[] }>(
        { queryKey: queryKeys.articles.lists() },
        (old) => {
          if (!old) return old;

          // Handle infinite query data structure
          if ('pages' in old && Array.isArray(old.pages)) {
            return {
              ...old,
              pages: old.pages.map(page => ({
                ...page,
                articles: page.articles.map((article) =>
                  article.id === articleId
                    ? { ...article, isRead: false, readAt: undefined }
                    : article
                )
              }))
            };
          }

          // Handle regular query data structure
          if ('articles' in old && Array.isArray(old.articles)) {
            return {
              ...old,
              articles: old.articles.map((article) =>
                article.id === articleId
                  ? { ...article, isRead: false, readAt: undefined }
                  : article
              ),
            };
          }

          return old;
        }
      );

      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
    },
  });
}

/**
 * Hook to track article view
 */
export function useTrackArticleView() {
  return useMutation({
    mutationFn: trackArticleView,
  });
}

/**
 * Hook to track article exit
 */
export function useTrackArticleExit() {
  return useMutation({
    mutationFn: ({ articleId, data }: {
      articleId: string;
      data: { timeSpent: number; estimatedTime: number };
    }) => trackArticleExit(articleId, data),
  });
}

/**
 * Hook to fetch article feedback
 */
export function useArticleFeedback(articleId: string) {
  return useQuery({
    queryKey: queryKeys.articles.feedback(articleId),
    queryFn: () => fetchArticleFeedback(articleId),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to submit article feedback
 */
export function useSubmitArticleFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ articleId, feedbackValue }: {
      articleId: string;
      feedbackValue: number;
    }) => submitArticleFeedback(articleId, feedbackValue),
    onSuccess: (_data, variables) => {
      // Update the feedback query cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.articles.feedback(variables.articleId)
      });
      // Invalidate article scores and patterns
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.patterns() });
    },
  });
}

/**
 * Hook to delete article feedback
 */
export function useDeleteArticleFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteArticleFeedback,
    onSuccess: (_data, articleId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.articles.feedback(articleId)
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.patterns() });
    },
  });
}
