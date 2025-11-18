/**
 * Cache Key Generation
 * Centralized cache key management with namespacing
 */

export const CacheKeys = {
  // Article scores
  articleScore: (userId: string, articleId: string) =>
    `score:${userId}:${articleId}`,
  articleScoreBatch: (userId: string) => `scores:${userId}`,

  // User patterns
  userPatterns: (userId: string) => `patterns:${userId}`,
  userPatternsMap: (userId: string) => `patterns:map:${userId}`,

  // Embeddings
  articleEmbedding: (articleId: string) => `embedding:${articleId}`,
  embeddingBatch: (prefix: string) => `embeddings:${prefix}`,

  // Semantic search
  semanticSearch: (query: string, limit: number) =>
    `search:${Buffer.from(query).toString("base64").substring(0, 50)}:${limit}`,
  relatedArticles: (articleId: string, limit: number) =>
    `related:${articleId}:${limit}`,

  // LLM summaries
  articleSummary: (articleId: string) => `summary:${articleId}`,
  articleKeyPoints: (articleId: string) => `keypoints:${articleId}`,
  articleTopics: (articleId: string) => `topics:${articleId}`,

  // Feed metadata
  feedMetadata: (feedId: string) => `feed:${feedId}`,
  feedArticles: (feedId: string, page: number) =>
    `feed:articles:${feedId}:${page}`,

  // User preferences
  userPreferences: (userId: string) => `prefs:${userId}`,
  userTheme: (userId: string) => `theme:${userId}`,

  // Statistics
  cacheStats: () => "stats:cache",
  apiMetrics: (endpoint: string) => `metrics:${endpoint}`,
};

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CacheTTL = {
  // Short-lived (15 minutes)
  userPatterns: 15 * 60,
  semanticSearch: 30 * 60,

  // Medium-lived (1 hour)
  articleScore: 60 * 60,
  feedMetadata: 60 * 60,
  userPreferences: 60 * 60,

  // Long-lived (24 hours)
  articleEmbedding: 24 * 60 * 60,
  relatedArticles: 24 * 60 * 60,

  // Very long-lived (7 days)
  articleSummary: 7 * 24 * 60 * 60,
  articleKeyPoints: 7 * 24 * 60 * 60,
  articleTopics: 7 * 24 * 60 * 60,
};

/**
 * Get all cache keys matching a pattern
 */
export function getCachePattern(pattern: string): string {
  return `*${pattern}*`;
}

/**
 * Invalidation patterns
 */
export const InvalidationPatterns = {
  userScores: (userId: string) => `score:${userId}:*`,
  userPatterns: (userId: string) => `patterns:${userId}*`,
  article: (articleId: string) => `*:${articleId}*`,
  feed: (feedId: string) => `feed:${feedId}*`,
  user: (userId: string) => `*:${userId}:*`,
};

