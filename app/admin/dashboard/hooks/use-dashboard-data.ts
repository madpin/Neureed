import {
  useAdminMetrics,
  useCronHistoryFull,
  useEmbeddingConfig,
  useEmbeddingStats,
  useAdminUsers,
  useCacheStats,
  usePostgresStats,
  useRedisStats,
  useAdminSettings,
  useAdminConfig,
  useLLMConfig,
  useSummarizationConfig,
  type AdminMetrics,
  type CronHistoryResponse,
  type EmbeddingConfig,
  type EmbeddingStats,
  type CacheStats,
  type PostgresStats,
  type RedisStats,
  type AdminSettings,
  type LLMConfig,
  type SummarizationConfig,
} from "@/hooks/queries/use-admin";

/**
 * Consolidated dashboard data hook.
 * Fetches all admin data with unified polling and loading states.
 *
 * @param pollingInterval - Interval in milliseconds for auto-refresh (default: 30000ms)
 *
 * @example
 * ```tsx
 * const dashboard = useDashboardData();
 *
 * if (dashboard.isLoading) return <Spinner />;
 * if (dashboard.hasError) return <ErrorMessage />;
 *
 * return (
 *   <>
 *     <MetricsSection metrics={dashboard.data.metrics} />
 *     <JobsSection history={dashboard.data.cronHistory} />
 *     <StorageSection
 *       postgres={dashboard.data.postgresStats}
 *       redis={dashboard.data.redisStats}
 *     />
 *   </>
 * );
 * ```
 */
export function useDashboardData(pollingInterval: number = 30000) {
  // Real-time data (with polling)
  const metricsQuery = useAdminMetrics(pollingInterval);
  const cronHistoryQuery = useCronHistoryFull(pollingInterval);
  const cacheStatsQuery = useCacheStats(pollingInterval);
  const embeddingStatsQuery = useEmbeddingStats(pollingInterval);
  const postgresStatsQuery = usePostgresStats(pollingInterval);
  const redisStatsQuery = useRedisStats(pollingInterval);

  // Configuration data (no polling, less frequent updates)
  const embeddingConfigQuery = useEmbeddingConfig();
  const adminSettingsQuery = useAdminSettings();
  const adminConfigQuery = useAdminConfig();
  const llmConfigQuery = useLLMConfig();
  const summarizationConfigQuery = useSummarizationConfig();

  // Users query (optional polling, typically used with search params)
  // We'll expose a separate function to control this since it has parameters
  const adminUsersQuery = useAdminUsers(undefined, pollingInterval);

  /**
   * Check if any critical queries are loading (initial load only).
   * Excludes already-loaded queries that are just refetching.
   */
  const isInitialLoading =
    metricsQuery.isLoading ||
    cronHistoryQuery.isLoading ||
    cacheStatsQuery.isLoading ||
    embeddingStatsQuery.isLoading ||
    postgresStatsQuery.isLoading ||
    redisStatsQuery.isLoading ||
    embeddingConfigQuery.isLoading ||
    adminSettingsQuery.isLoading ||
    llmConfigQuery.isLoading;

  /**
   * Check if any queries are fetching (includes background refetches).
   */
  const isFetching =
    metricsQuery.isFetching ||
    cronHistoryQuery.isFetching ||
    cacheStatsQuery.isFetching ||
    embeddingStatsQuery.isFetching ||
    postgresStatsQuery.isFetching ||
    redisStatsQuery.isFetching ||
    embeddingConfigQuery.isFetching ||
    adminSettingsQuery.isFetching ||
    adminConfigQuery.isFetching ||
    llmConfigQuery.isFetching ||
    summarizationConfigQuery.isFetching ||
    adminUsersQuery.isFetching;

  /**
   * Check if any queries have errors.
   */
  const hasError =
    metricsQuery.isError ||
    cronHistoryQuery.isError ||
    cacheStatsQuery.isError ||
    embeddingStatsQuery.isError ||
    postgresStatsQuery.isError ||
    redisStatsQuery.isError ||
    embeddingConfigQuery.isError ||
    adminSettingsQuery.isError ||
    adminConfigQuery.isError ||
    llmConfigQuery.isError ||
    summarizationConfigQuery.isError ||
    adminUsersQuery.isError;

  /**
   * Collect all errors for debugging.
   */
  const errors = [
    metricsQuery.error,
    cronHistoryQuery.error,
    cacheStatsQuery.error,
    embeddingStatsQuery.error,
    postgresStatsQuery.error,
    redisStatsQuery.error,
    embeddingConfigQuery.error,
    adminSettingsQuery.error,
    adminConfigQuery.error,
    llmConfigQuery.error,
    summarizationConfigQuery.error,
    adminUsersQuery.error,
  ].filter((error) => error != null);

  return {
    // Consolidated data object
    data: {
      metrics: metricsQuery.data as AdminMetrics | undefined,
      cronHistory: cronHistoryQuery.data as CronHistoryResponse | undefined,
      cacheStats: cacheStatsQuery.data as CacheStats | undefined,
      embeddingStats: embeddingStatsQuery.data as EmbeddingStats | undefined,
      embeddingConfig: embeddingConfigQuery.data as EmbeddingConfig | undefined,
      postgresStats: postgresStatsQuery.data as PostgresStats | undefined,
      redisStats: redisStatsQuery.data as RedisStats | undefined,
      adminSettings: adminSettingsQuery.data as AdminSettings | undefined,
      adminConfig: adminConfigQuery.data,
      llmConfig: llmConfigQuery.data?.config as LLMConfig | undefined,
      summarizationConfig: summarizationConfigQuery.data as SummarizationConfig | undefined,
      users: adminUsersQuery.data,
    },

    // Aggregated loading states
    loading: {
      isInitialLoading, // True only on first load (no data yet)
      isFetching, // True when any query is fetching (including background)
      metrics: metricsQuery.isLoading,
      cronHistory: cronHistoryQuery.isLoading,
      cacheStats: cacheStatsQuery.isLoading,
      embeddingStats: embeddingStatsQuery.isLoading,
      embeddingConfig: embeddingConfigQuery.isLoading,
      postgresStats: postgresStatsQuery.isLoading,
      redisStats: redisStatsQuery.isLoading,
      adminSettings: adminSettingsQuery.isLoading,
      adminConfig: adminConfigQuery.isLoading,
      llmConfig: llmConfigQuery.isLoading,
      summarizationConfig: summarizationConfigQuery.isLoading,
      users: adminUsersQuery.isLoading,
    },

    // Aggregated error states
    errors: {
      hasError,
      all: errors,
      metrics: metricsQuery.error,
      cronHistory: cronHistoryQuery.error,
      cacheStats: cacheStatsQuery.error,
      embeddingStats: embeddingStatsQuery.error,
      embeddingConfig: embeddingConfigQuery.error,
      postgresStats: postgresStatsQuery.error,
      redisStats: redisStatsQuery.error,
      adminSettings: adminSettingsQuery.error,
      adminConfig: adminConfigQuery.error,
      llmConfig: llmConfigQuery.error,
      summarizationConfig: summarizationConfigQuery.error,
      users: adminUsersQuery.error,
    },

    // Individual query objects (for advanced control)
    queries: {
      metrics: metricsQuery,
      cronHistory: cronHistoryQuery,
      cacheStats: cacheStatsQuery,
      embeddingStats: embeddingStatsQuery,
      embeddingConfig: embeddingConfigQuery,
      postgresStats: postgresStatsQuery,
      redisStats: redisStatsQuery,
      adminSettings: adminSettingsQuery,
      adminConfig: adminConfigQuery,
      llmConfig: llmConfigQuery,
      summarizationConfig: summarizationConfigQuery,
      users: adminUsersQuery,
    },

    // Helpers
    isReady: !isInitialLoading && !hasError,
  };
}
