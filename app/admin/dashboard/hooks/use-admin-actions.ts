import { toast } from "sonner";
import {
  useClearCache,
  useRunCleanup,
  useResetDatabase,
  useTriggerFeedRefresh,
  useTriggerEmbeddingGeneration,
} from "@/hooks/queries/use-admin";

/**
 * Consolidated hook for admin mutation actions.
 * Provides handlers with toast notifications and loading states.
 *
 * @example
 * ```tsx
 * const actions = useAdminActions();
 *
 * // Use in QuickActionsBar
 * <QuickActionsBar
 *   onRefreshFeeds={actions.handleRefreshFeeds}
 *   onGenerateEmbeddings={actions.handleGenerateEmbeddings}
 *   onCleanup={actions.handleCleanup}
 *   onClearCache={actions.handleClearCache}
 *   loading={actions.isLoading}
 * />
 * ```
 */
export function useAdminActions() {
  // Mutations
  const clearCache = useClearCache();
  const runCleanup = useRunCleanup();
  const resetDatabase = useResetDatabase();
  const triggerFeedRefresh = useTriggerFeedRefresh();
  const triggerEmbeddingGeneration = useTriggerEmbeddingGeneration();

  /**
   * Clear all cache data.
   * Note: Use with ConfirmButton for two-click confirmation.
   */
  const handleClearCache = async () => {
    try {
      await clearCache.mutateAsync(undefined);
      toast.success("Cache cleared successfully!");
    } catch (error) {
      console.error("Failed to clear cache:", error);
      toast.error("Failed to clear cache");
      throw error; // Re-throw for ConfirmButton error handling
    }
  };

  /**
   * Generate embeddings for articles without embeddings.
   * Processes up to 250 articles (5 batches of 50).
   */
  const handleGenerateEmbeddings = async () => {
    try {
      const result = await triggerEmbeddingGeneration.mutateAsync({
        batchSize: 50,
        maxBatches: 5,
      });
      toast.success(
        `Generated embeddings for ${result.processed} articles! ` +
          `Failed: ${result.failed}, Tokens used: ${result.totalTokens}`
      );
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate embeddings");
      throw error;
    }
  };

  /**
   * Refresh all feeds to fetch new articles.
   */
  const handleRefreshFeeds = async () => {
    try {
      const data = await triggerFeedRefresh.mutateAsync();
      const stats = data.stats;
      toast.success(
        `Refreshed ${stats.totalFeeds} feeds successfully! ` +
          `Successful: ${stats.successful}, ` +
          `Failed: ${stats.failed}, ` +
          `New articles: ${stats.totalNewArticles}, ` +
          `Updated articles: ${stats.totalUpdatedArticles}`
      );
    } catch (error) {
      console.error("Refresh failed:", error);
      toast.error("Failed to refresh feeds");
      throw error;
    }
  };

  /**
   * Run cleanup to remove articles older than 90 days.
   * Note: Use with ConfirmButton for two-click confirmation.
   */
  const handleCleanup = async () => {
    try {
      const data = await runCleanup.mutateAsync();
      toast.success(`Cleanup completed! Removed ${data.deletedCount} old articles.`);
    } catch (error) {
      console.error("Cleanup failed:", error);
      toast.error("Failed to run cleanup");
      throw error;
    }
  };

  /**
   * Reset the entire database (DANGEROUS!).
   * Deletes all feeds, articles, categories, and embeddings.
   * Note: Use with ConfirmButton with long timeout (10s).
   */
  const handleDatabaseReset = async () => {
    try {
      const summary = await resetDatabase.mutateAsync();
      toast.success(
        `Database reset completed! ` +
          `Deleted: ${summary.feeds} feeds, ${summary.articles} articles, ` +
          `${summary.categories} categories, ${summary.userFeeds} subscriptions. ` +
          `Total: ${summary.totalDeleted} records`,
        { duration: 10000 }
      );
    } catch (error) {
      console.error("Database reset failed:", error);
      toast.error("Failed to reset database");
      throw error;
    }
  };

  return {
    // Handler functions
    handleClearCache,
    handleGenerateEmbeddings,
    handleRefreshFeeds,
    handleCleanup,
    handleDatabaseReset,

    // Loading states
    isLoading: {
      clearCache: clearCache.isPending,
      embeddings: triggerEmbeddingGeneration.isPending,
      refreshFeeds: triggerFeedRefresh.isPending,
      cleanup: runCleanup.isPending,
      databaseReset: resetDatabase.isPending,
    },

    // Individual mutation objects (in case needed for more control)
    mutations: {
      clearCache,
      runCleanup,
      resetDatabase,
      triggerFeedRefresh,
      triggerEmbeddingGeneration,
    },
  };
}
