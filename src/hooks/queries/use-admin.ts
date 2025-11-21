/**
 * Admin Query Hooks
 *
 * These hooks manage admin-related data fetching with polling support for real-time updates.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { apiGet, apiPost, apiDelete, apiPut } from "@/lib/query/api-client";

/**
 * Admin metrics
 */
export interface AdminMetrics {
  users: {
    total: number;
    active: number;
  };
  feeds: {
    total: number;
    active: number;
    errorCount: number;
  };
  articles: {
    total: number;
    withEmbeddings: number;
    recentCount: number;
  };
  storage: {
    postgres: {
      size: string;
      tables: number;
    };
    redis: {
      keys: number;
      memory: string;
    };
  };
  cron: {
    lastRun?: string;
    status: string;
  };
}

/**
 * Log entry for cron jobs
 */
export interface JobLogEntry {
  level: string;
  message: string;
  timestamp?: string;
}

/**
 * Cron job status
 */
export interface CronJobStatus {
  name: string;
  schedule: string;
  lastRun?: string;
  nextRun?: string;
  status: "idle" | "running" | "error";
  lastError?: string;
  logs?: JobLogEntry[];
}

/**
 * Job run entry with logs
 */
export interface JobRunEntry {
  id: number;
  status: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  result?: any;
  error?: string;
  logs?: JobLogEntry[];
}

/**
 * Job with history
 */
export interface JobWithHistory {
  name: string;
  schedule: string;
  lastRun?: JobRunEntry;
  nextRun?: string;
  status: "idle" | "running" | "error";
  lastError?: string;
  logs?: JobLogEntry[];
  recentRuns: JobRunEntry[];
}

/**
 * Cron history response
 */
export interface CronHistoryResponse {
  enabled: boolean;
  initialized: boolean;
  jobs: JobWithHistory[];
}

/**
 * Cron job history entry
 */
export interface CronJobHistoryEntry {
  id: number;
  jobName: string;
  startedAt: string;
  completedAt?: string;
  status: "running" | "completed" | "failed";
  duration?: number;
  logs?: string;
  error?: string;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memory: string;
  hitRate: number;
}

/**
 * Embedding config
 */
export interface EmbeddingConfig {
  provider: "openai" | "local";
  model: string;
  dimensions: number;
  enabled: boolean;
}

/**
 * Embedding stats
 */
export interface EmbeddingStats {
  total: number;
  withEmbeddings: number;
  withoutEmbeddings: number;
  percentage: number;
}

/**
 * User stats
 */
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  usersWithFeedback: number;
}

/**
 * User with counts
 */
export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "ADMIN" | "USER" | "GUEST";
  createdAt: string;
  _count: {
    userFeeds: number;
    readArticles: number;
    articleFeedback: number;
    userPatterns: number;
    userThemes: number;
  };
}

/**
 * Admin users response
 */
interface AdminUsersResponse {
  users: AdminUser[];
  stats: UserStats;
  pagination?: {
    page: number;
    limit: number;
    totalUsers: number;
    totalPages: number;
  };
}

/**
 * Admin users query params
 */
interface AdminUsersQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "email" | "createdAt";
  sortOrder?: "asc" | "desc";
}

/**
 * Postgres storage stats
 */
export interface PostgresStats {
  databaseSize: string;
  tables: Array<{
    tableName: string;
    totalSize: string;
    tableSize: string;
    indexSize: string;
    rowCount: number;
  }>;
  connectionInfo: {
    maxConnections: number;
    currentConnections: number;
    activeConnections: number;
    idleConnections: number;
  };
  cacheHitRatio: number;
  indexUsage: Array<{
    schemaName: string;
    tableName: string;
    indexName: string;
    indexScans: number;
    tupleReads: number;
    tupleFetches: number;
  }>;
  vacuumStats: Array<{
    schemaName: string;
    tableName: string;
    lastVacuum: string | null;
    lastAutoVacuum: string | null;
    lastAnalyze: string | null;
    lastAutoAnalyze: string | null;
  }>;
}

/**
 * Redis storage stats
 */
export interface RedisStats {
  connected: boolean;
  enabled: boolean;
  version: string | null;
  uptime: number | null;
  memory: {
    usedMemory: string | null;
    usedMemoryHuman: string | null;
    usedMemoryPeak: string | null;
    usedMemoryPeakHuman: string | null;
    maxMemory: string | null;
    maxMemoryHuman: string | null;
    memoryFragmentationRatio: number | null;
  };
  stats: {
    totalConnectionsReceived: number | null;
    totalCommandsProcessed: number | null;
    instantaneousOpsPerSec: number | null;
    keyspaceHits: number | null;
    keyspaceMisses: number | null;
    hitRate: number | null;
    evictedKeys: number | null;
    expiredKeys: number | null;
  };
  keyspace: Array<{
    dbIndex: number;
    keys: number;
    expires: number;
    avgTtl: number;
  }>;
  clients: {
    connectedClients: number | null;
    blockedClients: number | null;
  };
}

/**
 * Admin settings
 */
export interface AdminSettings {
  systemLLM: any; // Using any for brevity, can be more specific if needed
  providers: any;
  constraints: any;
  defaults: any;
  embeddingConfig: any;
  message?: string;
}

/**
 * Fetch admin metrics
 */
async function fetchAdminMetrics(): Promise<AdminMetrics> {
  return await apiGet<AdminMetrics>("/api/admin/metrics");
}

/**
 * Fetch Postgres stats
 */
async function fetchPostgresStats(): Promise<PostgresStats> {
  const response = await apiGet<{ stats: PostgresStats }>("/api/admin/storage/postgres");
  return response.stats;
}

/**
 * Fetch Redis stats
 */
async function fetchRedisStats(): Promise<RedisStats> {
  const response = await apiGet<{ stats: RedisStats }>("/api/admin/storage/redis");
  return response.stats;
}

/**
 * Fetch Admin settings
 */
async function fetchAdminSettings(): Promise<AdminSettings> {
  return await apiGet<AdminSettings>("/api/admin/settings");
}

/**
 * Fetch complete admin config
 */
async function fetchAdminConfig(): Promise<any> {
  return await apiGet("/api/admin/config");
}

/**
 * Fetch cron job status
 */
async function fetchCronStatus(): Promise<CronJobStatus[]> {
  const response = await apiGet<{ jobs: CronJobStatus[] }>("/api/admin/cron/status");
  return response.jobs;
}

/**
 * Fetch cron job history
 */
async function fetchCronHistory(jobName?: string): Promise<CronJobHistoryEntry[]> {
  const response = await apiGet<{ history: CronJobHistoryEntry[] }>(
    "/api/admin/cron/history",
    jobName ? { jobName } : undefined
  );
  return response.history;
}

/**
 * Fetch cron job history with all runs
 */
async function fetchCronHistoryFull(): Promise<CronHistoryResponse> {
  return await apiGet<CronHistoryResponse>("/api/admin/cron/history");
}

/**
 * Trigger a cron job manually
 */
async function triggerCronJob(jobName: string): Promise<void> {
  await apiPost("/api/admin/cron/trigger", { job: jobName });
}

/**
 * Fetch cache statistics
 */
async function fetchCacheStats(): Promise<CacheStats> {
  return await apiGet<CacheStats>("/api/admin/cache/stats");
}

/**
 * Clear cache
 */
async function clearCache(pattern?: string): Promise<void> {
  await apiPost("/api/admin/cache/clear", pattern ? { pattern } : undefined);
}

/**
 * Fetch embedding config
 */
async function fetchEmbeddingConfig(): Promise<EmbeddingConfig> {
  const response = await apiGet<{
    config: { provider: string; model: string; dimensions: number };
    autoGenerate: boolean;
    providers?: any;
  }>("/api/admin/embeddings/config");
  
  return {
    provider: (response.config?.provider || "openai") as "openai" | "local",
    model: response.config?.model || "unknown",
    dimensions: response.config?.dimensions || 0,
    enabled: response.autoGenerate || false,
  };
}

/**
 * Update embedding config
 */
async function updateEmbeddingConfig(config: Partial<EmbeddingConfig>): Promise<void> {
  await apiPost("/api/admin/embeddings/config", config);
}

/**
 * Update embedding provider
 */
async function updateEmbeddingProvider(provider: "openai" | "local"): Promise<void> {
  await apiPut("/api/admin/embeddings/provider", { provider });
}

/**
 * Fetch embedding stats
 */
async function fetchEmbeddingStats(): Promise<EmbeddingStats> {
  const response = await apiGet<{ stats: EmbeddingStats }>("/api/admin/embeddings");
  return response.stats;
}

/**
 * Fetch admin users
 */
async function fetchAdminUsers(params?: AdminUsersQueryParams): Promise<AdminUsersResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.search) queryParams.append("search", params.search);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);
  
  const queryString = queryParams.toString();
  const url = queryString ? `/api/admin/users?${queryString}` : "/api/admin/users";
  
  const response = await apiGet<AdminUsersResponse>(url);
  return response;
}

/**
 * Reset database
 */
async function resetDatabase(): Promise<{
  feeds: number;
  articles: number;
  categories: number;
  userFeeds: number;
  totalDeleted: number;
}> {
  const response = await apiPost<{
    feeds: number;
    articles: number;
    categories: number;
    userFeeds: number;
    totalDeleted: number;
  }>("/api/admin/database/reset");
  return response;
}

/**
 * Run cleanup
 */
async function runCleanup(): Promise<{ deletedCount: number }> {
  const response = await apiPost<{ deletedCount: number }>("/api/admin/cleanup");
  return response;
}

/**
 * Trigger feed refresh
 */
async function triggerFeedRefresh(): Promise<{
  stats: {
    totalFeeds: number;
    successful: number;
    failed: number;
    totalNewArticles: number;
    totalUpdatedArticles: number;
  };
}> {
  const response = await apiPost<{
    stats: {
      totalFeeds: number;
      successful: number;
      failed: number;
      totalNewArticles: number;
      totalUpdatedArticles: number;
    };
  }>("/api/jobs/refresh-feeds");
  return response;
}

/**
 * Trigger embedding generation
 */
async function triggerEmbeddingGeneration(params: { batchSize: number; maxBatches: number }): Promise<{
  processed: number;
  failed: number;
  totalTokens: number;
}> {
  const response = await apiPost<{
    processed: number;
    failed: number;
    totalTokens: number;
  }>("/api/jobs/generate-embeddings", params);
  return response;
}

/**
 * Delete all embeddings
 */
async function deleteAllEmbeddings(): Promise<{ cleared: number }> {
  return await apiDelete("/api/admin/embeddings");
}

/**
 * Hook to fetch admin metrics with optional polling
 *
 * @param refetchInterval - Optional interval in milliseconds for auto-refresh (default: disabled)
 *
 * @example
 * ```tsx
 * // Poll every 30 seconds
 * const { data: metrics } = useAdminMetrics(30000);
 * ```
 */
export function useAdminMetrics(refetchInterval?: number) {
  return useQuery({
    queryKey: queryKeys.admin.metrics(),
    queryFn: fetchAdminMetrics,
    refetchInterval,
  });
}

/**
 * Hook to fetch Postgres stats
 */
export function usePostgresStats(refetchInterval?: number) {
  return useQuery({
    queryKey: queryKeys.admin.storage.postgres(),
    queryFn: fetchPostgresStats,
    refetchInterval,
  });
}

/**
 * Hook to fetch Redis stats
 */
export function useRedisStats(refetchInterval?: number) {
  return useQuery({
    queryKey: queryKeys.admin.storage.redis(),
    queryFn: fetchRedisStats,
    refetchInterval,
  });
}

/**
 * Hook to fetch Admin settings
 */
export function useAdminSettings() {
  return useQuery({
    queryKey: queryKeys.admin.settings("all"),
    queryFn: fetchAdminSettings,
  });
}

/**
 * Hook to fetch complete admin config
 */
export function useAdminConfig() {
  return useQuery({
    queryKey: queryKeys.admin.config(),
    queryFn: fetchAdminConfig,
  });
}

/**
 * Hook to fetch cron job status with optional polling
 */
export function useCronStatus(refetchInterval?: number) {
  return useQuery({
    queryKey: queryKeys.admin.cron.status(),
    queryFn: fetchCronStatus,
    refetchInterval,
  });
}

/**
 * Hook to fetch cron job history
 */
export function useCronHistory(jobName?: string) {
  return useQuery({
    queryKey: queryKeys.admin.cron.history(jobName),
    queryFn: () => fetchCronHistory(jobName),
  });
}

/**
 * Hook to fetch full cron job history with all runs
 */
export function useCronHistoryFull(refetchInterval?: number) {
  return useQuery({
    queryKey: queryKeys.admin.cron.history(),
    queryFn: fetchCronHistoryFull,
    refetchInterval,
  });
}

/**
 * Hook to trigger a cron job manually
 */
export function useTriggerCronJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerCronJob,
    onSuccess: () => {
      // Refetch cron status and history
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.cron.status() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.cron.history() });
    },
  });
}

/**
 * Hook to fetch cache statistics with optional polling
 */
export function useCacheStats(refetchInterval?: number) {
  return useQuery({
    queryKey: queryKeys.admin.cache.stats(),
    queryFn: fetchCacheStats,
    refetchInterval,
  });
}

/**
 * Hook to clear cache
 */
export function useClearCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearCache,
    onSuccess: () => {
      // Refetch cache stats
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.cache.stats() });
      // Also invalidate all queries since cache is cleared
      queryClient.invalidateQueries();
    },
  });
}

/**
 * Hook to fetch embedding config
 */
export function useEmbeddingConfig() {
  return useQuery({
    queryKey: queryKeys.admin.embeddings.config(),
    queryFn: fetchEmbeddingConfig,
  });
}

/**
 * Hook to update embedding config
 */
export function useUpdateEmbeddingConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEmbeddingConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.embeddings.config() });
    },
  });
}

/**
 * Hook to update embedding provider
 */
export function useUpdateEmbeddingProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEmbeddingProvider,
    onSuccess: () => {
      // Force immediate refetch by invalidating and refetching
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.embeddings.config() });
      queryClient.refetchQueries({ queryKey: queryKeys.admin.embeddings.config() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.embeddings.all() });
      queryClient.refetchQueries({ queryKey: queryKeys.admin.embeddings.all() });
      // Also invalidate metrics since they show embedding stats
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.metrics() });
    },
  });
}

/**
 * Hook to fetch embedding stats
 */
export function useEmbeddingStats(refetchInterval?: number) {
  return useQuery({
    queryKey: queryKeys.admin.embeddings.all(),
    queryFn: fetchEmbeddingStats,
    refetchInterval,
  });
}

/**
 * Hook to fetch admin users
 */
export function useAdminUsers(params?: AdminUsersQueryParams, refetchInterval?: number) {
  return useQuery({
    queryKey: [...queryKeys.admin.users(), params],
    queryFn: () => fetchAdminUsers(params),
    refetchInterval,
  });
}

/**
 * Hook to reset database
 */
export function useResetDatabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetDatabase,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

/**
 * Hook to run cleanup
 */
export function useRunCleanup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runCleanup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
    },
  });
}

/**
 * Hook to trigger feed refresh
 */
export function useTriggerFeedRefresh() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerFeedRefresh,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
    },
  });
}

/**
 * Hook to trigger embedding generation
 */
export function useTriggerEmbeddingGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerEmbeddingGeneration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.embeddings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.metrics() });
    },
  });
}

/**
 * Hook to delete all embeddings
 */
export function useDeleteAllEmbeddings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllEmbeddings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.embeddings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.metrics() });
    },
  });
}

/**
 * Update user role
 */
async function updateUserRole(userId: string, role: string): Promise<void> {
  await apiPut(`/api/admin/users/${userId}/role`, { role });
}

/**
 * Hook to update user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}

/**
 * LLM Config type
 */
export interface LLMConfig {
  provider: string;
  apiKey?: string;
  baseUrl?: string;
  summaryModel?: string;
  embeddingModel?: string;
  digestModel?: string;
  // Source information
  providerSource?: string;
  apiKeySource?: string;
  baseUrlSource?: string;
  summaryModelSource?: string;
  embeddingModelSource?: string;
  digestModelSource?: string;
}

/**
 * Fetch LLM config
 */
async function fetchLLMConfig(): Promise<{ config: LLMConfig }> {
  const response = await apiGet<{ config: LLMConfig }>("/api/admin/llm/config");
  return response;
}

/**
 * Update LLM config
 */
async function updateLLMConfig(config: Partial<LLMConfig>): Promise<{ config: LLMConfig }> {
  const response = await apiPut<{ config: LLMConfig }>("/api/admin/llm/config", config);
  return response;
}

/**
 * Test LLM config
 */
async function testLLMConfig(config: Partial<LLMConfig>): Promise<any> {
  const response = await apiPost<any>("/api/admin/llm/config/test", config);
  return response;
}

/**
 * Hook to fetch LLM config
 */
export function useLLMConfig() {
  return useQuery({
    queryKey: ['admin', 'llm', 'config'],
    queryFn: fetchLLMConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update LLM config
 */
export function useUpdateLLMConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLLMConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'llm', 'config'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.embeddings.all() });
    },
  });
}

/**
 * Hook to test LLM config
 */
export function useTestLLMConfig() {
  return useMutation({
    mutationFn: testLLMConfig,
  });
}
