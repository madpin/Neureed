"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { formatLocalizedDate } from "@/lib/date-utils";
import { Tooltip } from "@/app/components/admin/Tooltip";
import { 
  useAdminMetrics, 
  useCronStatus, 
  useEmbeddingConfig, 
  useEmbeddingStats,
  useAdminUsers,
  useCacheStats,
  usePostgresStats,
  useRedisStats,
  useAdminSettings,
  useClearCache,
  useRunCleanup,
  useResetDatabase,
  useTriggerCronJob,
  useTriggerFeedRefresh,
  useTriggerEmbeddingGeneration,
  useLLMConfig,
  useUpdateLLMConfig,
  useTestLLMConfig,
  type AdminMetrics,
  type CronJobStatus,
  type EmbeddingConfig,
  type EmbeddingStats,
  type UserStats,
  type AdminUser,
  type CacheStats as CacheStatsType,
  type CronJobHistoryEntry,
  type PostgresStats,
  type RedisStats,
  type AdminSettings
} from "@/hooks/queries/use-admin";
import { useQueryClient } from "@tanstack/react-query";

type TabId = "overview" | "search" | "users" | "jobs" | "storage" | "config" | "llm-config";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

// Cache status is not in the hook types yet, defining locally or inferring from hook result
interface CacheStatus {
  connected: boolean;
  enabled: boolean;
}

// Helper to format duration
const formatDuration = (ms: number | null) => {
  if (ms === null) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Get initial tab from URL or use "overview" as default
  const initialTab = (searchParams.get("tab") as TabId) || "overview";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [favoriteTabs, setFavoriteTabs] = useState<TabId[]>([]);

  // Queries with 30s polling
  const pollingInterval = 30000;
  const { data: metrics, isLoading: isLoadingMetrics } = useAdminMetrics(pollingInterval);
  const { data: cronStatus } = useCronStatus(pollingInterval);
  const { data: cacheStats } = useCacheStats(pollingInterval);
  const { data: embeddingStats } = useEmbeddingStats(pollingInterval);
  const { data: embeddingConfig } = useEmbeddingConfig();
  const { data: adminUsersData } = useAdminUsers(pollingInterval);
  const { data: postgresStats } = usePostgresStats(pollingInterval);
  const { data: redisStats } = useRedisStats(pollingInterval);
  const { data: adminSettings } = useAdminSettings();
  
  // Mutations
  const clearCache = useClearCache();
  const runCleanup = useRunCleanup();
  const resetDatabase = useResetDatabase();
  const triggerCronJob = useTriggerCronJob();
  const triggerFeedRefresh = useTriggerFeedRefresh();
  const triggerEmbeddingGeneration = useTriggerEmbeddingGeneration();

  // Local state for confirmations
  const [pendingClearCache, setPendingClearCache] = useState(false);
  const [pendingCleanup, setPendingCleanup] = useState(false);
  const [pendingDatabaseReset, setPendingDatabaseReset] = useState(false);

  const tabs: Tab[] = [
    {
      id: "overview",
      label: "Overview",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: "search",
      label: "Search",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      id: "users",
      label: "Users",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: "jobs",
      label: "Jobs",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "storage",
      label: "Storage",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
    },
    {
      id: "config",
      label: "Configuration",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "llm-config",
      label: "LLM Config",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
  ];

  // Load favorite tabs from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("admin-favorite-tabs");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavoriteTabs(parsed);
        }
      } catch (e) {
        console.error("Failed to parse favorite tabs:", e);
      }
    }
  }, []);

  // Sync activeTab with URL parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as TabId;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Update URL when activeTab changes
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams);
    params.set("tab", tabId);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Toggle favorite status for a tab
  const toggleFavorite = (tabId: TabId) => {
    setFavoriteTabs((prev) => {
      const newFavorites = prev.includes(tabId)
        ? prev.filter((id) => id !== tabId)
        : [...prev, tabId];
      localStorage.setItem("admin-favorite-tabs", JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const handleClearCache = async () => {
    if (!pendingClearCache) {
      setPendingClearCache(true);
      toast.warning("Clear all cache?", {
        description: "Click the button again to confirm. This will remove all cached data.",
        duration: 5000,
      });
      setTimeout(() => setPendingClearCache(false), 5000);
      return;
    }

    setPendingClearCache(false);
    try {
      await clearCache.mutateAsync(undefined);
      toast.success("Cache cleared successfully!");
    } catch (error) {
      console.error("Failed to clear cache:", error);
      toast.error("Failed to clear cache");
    }
  };

  const handleGenerateEmbeddings = async () => {
    try {
      const result = await triggerEmbeddingGeneration.mutateAsync({ batchSize: 50, maxBatches: 5 });
      toast.success(
        `Generated embeddings for ${result.processed} articles! Failed: ${result.failed}, Tokens used: ${result.totalTokens}`
      );
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate embeddings");
    }
  };

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
    }
  };

  const handleCleanup = async () => {
    if (!pendingCleanup) {
      setPendingCleanup(true);
      toast.warning("Run cleanup?", {
        description: "Click again to confirm. This will remove articles older than 90 days.",
        duration: 5000,
      });
      setTimeout(() => setPendingCleanup(false), 5000);
      return;
    }

    setPendingCleanup(false);
    try {
      const data = await runCleanup.mutateAsync();
      toast.success(`Cleanup completed! Removed ${data.deletedCount} old articles.`);
    } catch (error) {
      console.error("Cleanup failed:", error);
      toast.error("Failed to run cleanup");
    }
  };

  const handleDatabaseReset = async () => {
    if (!pendingDatabaseReset) {
      setPendingDatabaseReset(true);
      toast.error("⚠️ DANGER: Reset Database?", {
        description: "This will PERMANENTLY DELETE all feeds, articles, categories, and embeddings. Click again within 10 seconds to confirm.",
        duration: 10000,
      });
      setTimeout(() => setPendingDatabaseReset(false), 10000);
      return;
    }

    setPendingDatabaseReset(false);
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
    }
  };

  return (
    <div className="min-h-screen bg-muted bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-foreground/70">
              System management and monitoring
            </p>
          </div>
          <Tooltip content="Return to the main application">
            <Link
              href="/"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Back to Home
            </Link>
          </Tooltip>
        </div>

        {isLoadingMetrics ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Vertical Tab Navigation */}
            <div className="w-56 flex-shrink-0">
              <nav className="space-y-1 rounded-lg border border-border bg-background p-2 border-border bg-background">
                {/* Favorite tabs section */}
                {favoriteTabs.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                      Favorites
                    </div>
                    {tabs
                      .filter((tab) => favoriteTabs.includes(tab.id))
                      .map((tab) => (
                        <div key={`fav-${tab.id}`} className="relative group">
                          <button
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                              activeTab === tab.id
                                ? "bg-blue-600 text-white"
                                : "text-foreground/80 hover:bg-muted"
                            }`}
                          >
                            {tab.icon}
                            {tab.label}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(tab.id);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove from favorites"
                          >
                            <svg className="h-4 w-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    <div className="my-2 border-t border-border" />
                  </>
                )}

                {/* All tabs */}
                {tabs
                  .filter((tab) => !favoriteTabs.includes(tab.id))
                  .map((tab) => (
                    <div key={tab.id} className="relative group">
                      <button
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? "bg-blue-600 text-white"
                            : "text-foreground/80 hover:bg-muted"
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(tab.id);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Add to favorites"
                      >
                        <svg className="h-4 w-4 text-foreground/30 hover:text-yellow-500 fill-current transition-colors" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </button>
                    </div>
                  ))}
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-6">
              {/* Quick Actions Bar (Always visible) */}
              <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-background p-4 shadow-sm">
                <div className="flex items-center gap-2 mr-auto">
                  <h2 className="text-sm font-semibold uppercase text-foreground/50 tracking-wider">Quick Actions</h2>
                </div>
                <button
                  onClick={handleRefreshFeeds}
                  disabled={triggerFeedRefresh.isPending}
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {triggerFeedRefresh.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Refresh Feeds
                </button>
                <button
                  onClick={handleGenerateEmbeddings}
                  disabled={triggerEmbeddingGeneration.isPending}
                  className="flex items-center gap-2 rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {triggerEmbeddingGeneration.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  Generate Embeddings
                </button>
                <button
                  onClick={handleCleanup}
                  disabled={pendingCleanup || runCleanup.isPending}
                  className="flex items-center gap-2 rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Cleanup Old Articles
                </button>
                <button
                  onClick={handleClearCache}
                  disabled={pendingClearCache || clearCache.isPending}
                  className="flex items-center gap-2 rounded-md bg-gray-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Clear Cache
                </button>
              </div>

              {activeTab === "overview" && (
                <div className="grid gap-6">
                  {/* Metrics Grid */}
                  <div className="grid gap-6 md:grid-cols-3">
                    {/* Users Card */}
                    <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-foreground">Users</h3>
                        <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-3xl font-bold text-foreground">{metrics?.users.total || 0}</div>
                        <p className="text-sm text-foreground/60">Total Registered Users</p>
                      </div>
                      <div className="mt-4 border-t border-border pt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground/70">Active (30d)</span>
                          <span className="font-medium text-foreground">{metrics?.users.active || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Feeds Card */}
                    <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-foreground">Feeds</h3>
                        <div className="rounded-full bg-green-100 p-2 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-3xl font-bold text-foreground">{metrics?.feeds.total || 0}</div>
                        <p className="text-sm text-foreground/60">Total Feeds</p>
                      </div>
                      <div className="mt-4 border-t border-border pt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground/70">With Errors</span>
                          <span className={`font-medium ${(metrics?.feeds.errorCount || 0) > 0 ? "text-red-500" : "text-foreground"}`}>
                            {metrics?.feeds.errorCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Articles Card */}
                    <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-foreground">Articles</h3>
                        <div className="rounded-full bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-3xl font-bold text-foreground">{metrics?.articles.total || 0}</div>
                        <p className="text-sm text-foreground/60">Total Articles</p>
                      </div>
                      <div className="mt-4 border-t border-border pt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground/70">With Embeddings</span>
                          <span className="font-medium text-foreground">{metrics?.articles.withEmbeddings || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Storage & System Status */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Storage Stats */}
                    <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
                      <h3 className="mb-4 text-lg font-medium text-foreground">Storage Usage</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="text-foreground/70">PostgreSQL Database</span>
                            <span className="font-medium font-mono">{metrics?.storage.postgres.size || "Unknown"}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-blue-600" style={{ width: '100%' }}></div>
                          </div>
                          <p className="mt-1 text-xs text-foreground/50">{metrics?.storage.postgres.tables || 0} tables</p>
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="text-foreground/70">Redis Cache</span>
                            <span className="font-medium text-foreground">{metrics?.storage.redis.memory || "Unknown"}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: '100%' }}></div>
                          </div>
                          <p className="mt-1 text-xs text-foreground/50">{metrics?.storage.redis.keys || 0} keys</p>
                        </div>
                      </div>
                    </div>

                    {/* Cache Status */}
                    <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-foreground">Cache Performance</h3>
                        <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                          // We assume enabled/connected if we have stats
                          cacheStats ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {cacheStats ? "Connected" : "Disconnected"}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded bg-muted p-3">
                          <div className="text-2xl font-bold text-foreground">{(cacheStats?.hitRate || 0).toFixed(1)}%</div>
                          <div className="text-xs text-foreground/60">Hit Rate</div>
                        </div>
                        <div className="rounded bg-muted p-3">
                          <div className="text-2xl font-bold text-foreground">{cacheStats?.hits || 0}</div>
                          <div className="text-xs text-foreground/60">Total Hits</div>
                        </div>
                        <div className="rounded bg-muted p-3">
                          <div className="text-2xl font-bold text-foreground">{cacheStats?.misses || 0}</div>
                          <div className="text-xs text-foreground/60">Total Misses</div>
                        </div>
                        <div className="rounded bg-muted p-3">
                          <div className="text-2xl font-bold text-foreground">{cacheStats?.keys || 0}</div>
                          <div className="text-xs text-foreground/60">Cached Keys</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "search" && (
                <SearchTab embeddingStats={embeddingStats} embeddingConfig={embeddingConfig} />
              )}

              {activeTab === "users" && (
                <UsersTab users={adminUsersData?.users || []} stats={adminUsersData?.stats || null} />
              )}

              {activeTab === "jobs" && (
                <JobsTab jobs={cronStatus || []} />
              )}

              {activeTab === "storage" && (
                <StorageTab 
                  postgres={postgresStats} 
                  redis={redisStats}
                  handleClearCache={handleClearCache}
                  handleDatabaseReset={handleDatabaseReset}
                  pendingDatabaseReset={pendingDatabaseReset}
                />
              )}

              {activeTab === "config" && (
                <ConfigTab settings={adminSettings} />
              )}

              {activeTab === "llm-config" && (
                <LLMConfigTab />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-components (using existing types)

function SearchTab({ embeddingStats, embeddingConfig }: { embeddingStats: EmbeddingStats | null | undefined, embeddingConfig: EmbeddingConfig | null | undefined }) {
  return (
    <div className="space-y-6">
      {/* Search Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-2">Embeddings Coverage</h3>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold text-foreground">{(embeddingStats?.percentage || 0).toFixed(1)}%</div>
            <div className="mb-1 text-sm text-foreground/60">of articles</div>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full bg-purple-600 transition-all duration-500" 
              style={{ width: `${embeddingStats?.percentage || 0}%` }}
            ></div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-2">Vector Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-foreground/70">With Embeddings</span>
              <span className="font-medium text-foreground">{embeddingStats?.withEmbeddings || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/70">Pending</span>
              <span className="font-medium text-foreground">{embeddingStats?.withoutEmbeddings || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/70">Total Articles</span>
              <span className="font-medium text-foreground">{embeddingStats?.total || 0}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-2">Configuration</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-foreground/70">Provider</span>
              <span className="font-medium text-foreground capitalize">{embeddingConfig?.provider || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/70">Model</span>
              <span className="font-medium text-foreground truncate max-w-[150px]" title={embeddingConfig?.model}>
                {embeddingConfig?.model || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/70">Dimensions</span>
              <span className="font-medium text-foreground">{embeddingConfig?.dimensions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/70">Auto-Generate</span>
              <span className={`font-medium ${embeddingConfig?.enabled ? "text-green-600" : "text-yellow-600"}`}>
                {embeddingConfig?.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersTab({ users, stats }: { users: AdminUser[], stats: UserStats | null }) {
  return (
    <div className="space-y-6">
      {/* User Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-2">Total Users</h3>
          <div className="text-3xl font-bold text-foreground">{stats?.totalUsers || 0}</div>
        </div>
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-2">Active Users (30d)</h3>
          <div className="text-3xl font-bold text-foreground">{stats?.activeUsers || 0}</div>
        </div>
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-2">Providing Feedback</h3>
          <div className="text-3xl font-bold text-foreground">{stats?.usersWithFeedback || 0}</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-border bg-background shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-foreground/70">
              <tr>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Joined</th>
                <th className="px-6 py-3 font-medium text-center">Feeds</th>
                <th className="px-6 py-3 font-medium text-center">Articles Read</th>
                <th className="px-6 py-3 font-medium text-center">Feedback</th>
                <th className="px-6 py-3 font-medium text-center">Patterns</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img src={user.image} alt="" className="h-8 w-8 rounded-full" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {user.name?.[0] || user.email[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-foreground">{user.name || "Unnamed User"}</div>
                        <div className="text-xs text-foreground/60">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-foreground/70">
                    {formatLocalizedDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-center">{user._count.userFeeds}</td>
                  <td className="px-6 py-4 text-center">{user._count.readArticles}</td>
                  <td className="px-6 py-4 text-center">{user._count.articleFeedback}</td>
                  <td className="px-6 py-4 text-center">{user._count.userPatterns}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-foreground/50">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function JobsTab({ jobs }: { jobs: CronJobStatus[] }) {
  // Helper to trigger manual run
  const triggerJobMutation = useTriggerCronJob();
  
  const handleTrigger = (jobName: string) => {
    triggerJobMutation.mutate(jobName, {
      onSuccess: () => toast.success(`Triggered job: ${jobName}`),
      onError: () => toast.error(`Failed to trigger job: ${jobName}`)
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <div key={job.name} className="rounded-lg border border-border bg-background p-6 shadow-sm flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-foreground">{job.name}</h3>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                job.status === "running" 
                  ? "bg-blue-100 text-blue-800 animate-pulse" 
                  : job.status === "error"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
              }`}>
                {job.status}
              </div>
            </div>
            
            <div className="space-y-2 text-sm flex-1">
              <div className="flex justify-between">
                <span className="text-foreground/60">Schedule:</span>
                <span className="font-mono text-foreground/80">{job.schedule}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Last Run:</span>
                <span className="text-foreground/80">{job.lastRun ? formatLocalizedDate(job.lastRun) : "Never"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Next Run:</span>
                <span className="text-foreground/80">{job.nextRun ? formatLocalizedDate(job.nextRun) : "Unknown"}</span>
              </div>
              {job.lastError && (
                <div className="mt-2 p-2 rounded bg-red-50 text-red-800 text-xs break-all dark:bg-red-900/20 dark:text-red-200">
                  {job.lastError}
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-border">
              <button
                onClick={() => handleTrigger(job.name)}
                disabled={job.status === "running" || triggerJobMutation.isPending}
                className="w-full rounded-md bg-background border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Run Now
              </button>
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="col-span-full py-12 text-center text-foreground/50">
            No cron jobs configured
          </div>
        )}
      </div>
    </div>
  );
}

function StorageTab({ 
  postgres, 
  redis, 
  handleClearCache, 
  handleDatabaseReset,
  pendingDatabaseReset 
}: { 
  postgres: PostgresStats | undefined, 
  redis: RedisStats | undefined, 
  handleClearCache: () => void,
  handleDatabaseReset: () => void,
  pendingDatabaseReset: boolean
}) {
  // State for expanding tables list
  const [showAllTables, setShowAllTables] = useState(false);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">PostgreSQL Database</h3>
          <div className="space-y-4">
            <div className="flex justify-between p-3 rounded bg-muted/50">
              <span className="text-foreground/70">Total Size</span>
              <span className="font-medium font-mono">{postgres?.databaseSize || "Unknown"}</span>
            </div>
            <div className="flex justify-between p-3 rounded bg-muted/50">
              <span className="text-foreground/70">Active Connections</span>
              <span className="font-medium font-mono">{postgres?.connectionInfo.activeConnections || 0} / {postgres?.connectionInfo.maxConnections || "?"}</span>
            </div>
            <div className="flex justify-between p-3 rounded bg-muted/50">
              <span className="text-foreground/70">Cache Hit Ratio</span>
              <span className="font-medium font-mono">{(Number(postgres?.cacheHitRatio) || 0).toFixed(2)}%</span>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Top Tables by Size</h4>
            <div className="space-y-2 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-foreground/60 border-b border-border">
                    <th className="pb-1">Table</th>
                    <th className="pb-1 text-right">Rows</th>
                    <th className="pb-1 text-right">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllTables ? postgres?.tables : postgres?.tables.slice(0, 5))?.map(table => (
                    <tr key={table.tableName}>
                      <td className="py-1">{table.tableName}</td>
                      <td className="py-1 text-right">{table.rowCount}</td>
                      <td className="py-1 text-right">{table.totalSize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {postgres?.tables && postgres.tables.length > 5 && (
              <button 
                onClick={() => setShowAllTables(!showAllTables)}
                className="mt-2 text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                {showAllTables ? "Show Less" : `Show All (${postgres.tables.length})`}
              </button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">Redis Cache</h3>
          <div className="space-y-4">
            <div className="flex justify-between p-3 rounded bg-muted/50">
              <span className="text-foreground/70">Status</span>
              <span className={`font-medium ${redis?.connected ? "text-green-600" : "text-red-600"}`}>
                {redis?.connected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="flex justify-between p-3 rounded bg-muted/50">
              <span className="text-foreground/70">Memory Used</span>
              <span className="font-medium font-mono">{redis?.memory.usedMemoryHuman || "Unknown"}</span>
            </div>
            <div className="flex justify-between p-3 rounded bg-muted/50">
              <span className="text-foreground/70">Peak Memory</span>
              <span className="font-medium font-mono">{redis?.memory.usedMemoryPeakHuman || "Unknown"}</span>
            </div>
            <div className="flex justify-between p-3 rounded bg-muted/50">
              <span className="text-foreground/70">Hit Rate</span>
              <span className="font-medium font-mono">{redis?.stats.hitRate ? (redis.stats.hitRate * 100).toFixed(1) : 0}%</span>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Keyspace</h4>
            <div className="space-y-2">
              {redis?.keyspace.map(db => (
                <div key={db.dbIndex} className="flex justify-between text-xs p-2 bg-muted/30 rounded">
                  <span>DB {db.dbIndex}</span>
                  <span className="font-mono">{db.keys} keys</span>
                </div>
              ))}
              {(!redis?.keyspace || redis.keyspace.length === 0) && (
                <p className="text-xs text-foreground/50">No keys found</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-900/10">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-background rounded border border-red-100 dark:border-red-900/30">
            <div>
              <h4 className="font-medium text-foreground">Clear Cache</h4>
              <p className="text-sm text-foreground/60">Remove all cached data from Redis. This may temporarily impact performance.</p>
            </div>
            <button
              onClick={handleClearCache}
              className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
            >
              Clear Cache
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-background rounded border border-red-100 dark:border-red-900/30">
            <div>
              <h4 className="font-medium text-red-600 dark:text-red-400">Reset Database</h4>
              <p className="text-sm text-foreground/60">Permanently delete all feeds, articles, and embeddings. User accounts are preserved.</p>
            </div>
            <button
              onClick={handleDatabaseReset}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-colors ${
                pendingDatabaseReset ? "bg-red-700 hover:bg-red-800" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {pendingDatabaseReset ? "Confirm Reset?" : "Reset Database"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigTab({ settings }: { settings: AdminSettings | undefined }) {
  if (!settings) {
    return <div className="p-6 text-center text-foreground/50">Loading configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <h3 className="text-lg font-medium text-foreground mb-4">System Configuration</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded bg-muted/30 border border-border">
              <h4 className="font-medium text-foreground mb-2">LLM Status</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Provider:</span>
                  <span className="font-medium">{settings.embeddingConfig?.provider || "Not configured"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Embedding Model:</span>
                  <span className="font-medium">{settings.embeddingConfig?.model || "Not configured"}</span>
                </div>
              </div>
            </div>
            <div className="p-4 rounded bg-muted/30 border border-border">
              <h4 className="font-medium text-foreground mb-2">Constraints</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Max Feeds/User:</span>
                  <span className="font-medium">{settings.constraints?.maxFeedsPerUser || "Unlimited"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Max Articles/Feed:</span>
                  <span className="font-medium">{settings.constraints?.maxArticlesPerFeed || 500}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <h3 className="text-lg font-medium text-foreground mb-4">Default User Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(settings.defaults || {}).map(([key, value]) => (
            <div key={key} className="p-3 rounded bg-muted/20 border border-border">
              <div className="text-xs text-foreground/50 uppercase mb-1">{key}</div>
              <div className="font-medium text-sm truncate" title={String(value)}>
                {String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// LLM Configuration Tab
function LLMConfigTab() {
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Use React Query hooks
  const { data: configData, isLoading } = useLLMConfig();
  const updateConfig = useUpdateLLMConfig();
  const testConfig = useTestLLMConfig();
  
  // Form state
  const [provider, setProvider] = useState<"openai" | "ollama">("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [summaryModel, setSummaryModel] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("");
  const [digestModel, setDigestModel] = useState("");
  
  // Masked API key and sources for display
  const [maskedKey, setMaskedKey] = useState("");
  const [sources, setSources] = useState<{
    provider: string;
    apiKey: string;
    baseUrl: string;
    summaryModel: string;
    embeddingModel: string;
    digestModel: string;
  }>({
    provider: "environment",
    apiKey: "none",
    baseUrl: "none",
    summaryModel: "environment",
    embeddingModel: "environment",
    digestModel: "environment",
  });

  // Update form when data loads
  useEffect(() => {
    if (configData?.config) {
      const config = configData.config;
      setProvider(config.provider as "openai" | "ollama" || "openai");
      setBaseUrl(config.baseUrl || "");
      setSummaryModel(config.summaryModel || "");
      setEmbeddingModel(config.embeddingModel || "");
      setDigestModel(config.digestModel || "");
      setMaskedKey(config.apiKey || "");
      
      // Set sources
      setSources({
        provider: config.providerSource || "environment",
        apiKey: config.apiKeySource || "none",
        baseUrl: config.baseUrlSource || "none",
        summaryModel: config.summaryModelSource || "environment",
        embeddingModel: config.embeddingModelSource || "environment",
        digestModel: config.digestModelSource || "environment",
      });
    }
  }, [configData]);

  const handleSave = async () => {
    setSaveMessage(null);

    try {
      await updateConfig.mutateAsync({
        provider,
        apiKey: apiKey || undefined,
        baseUrl: baseUrl || undefined,
        summaryModel: summaryModel || undefined,
        embeddingModel: embeddingModel || undefined,
        digestModel: digestModel || undefined,
      });

      setSaveMessage({ type: "success", text: "Configuration saved successfully" });
      toast.success("LLM configuration saved");
      
      // Clear API key input
      setApiKey("");

      // Clear success message after 5 seconds
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error) {
      console.error("Failed to save LLM config:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save configuration";
      setSaveMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage);
    }
  };

  const handleTest = async () => {
    setSaveMessage(null);

    try {
      const result = await testConfig.mutateAsync({
        provider,
        apiKey: apiKey || undefined,
        baseUrl: baseUrl || undefined,
        summaryModel: summaryModel || undefined,
        embeddingModel: embeddingModel || undefined,
        digestModel: digestModel || undefined,
      });

      const testResults = result.data?.results;

      if (!testResults || !testResults.success) {
        // Test failed - show detailed error
        const errors: string[] = [];
        
        if (testResults?.embedding && !testResults.embedding.success) {
          errors.push(`Embedding: ${testResults.embedding.error || "Failed"}`);
        }
        
        if (testResults?.summary && !testResults.summary.success) {
          errors.push(`Summary: ${testResults.summary.error || "Failed"}`);
        }
        
        if (testResults?.error) {
          errors.push(testResults.error);
        }
        
        const errorMessage = errors.length > 0 
          ? errors.join(" | ") 
          : "Configuration test failed";
        
        setSaveMessage({ type: "error", text: errorMessage });
        toast.error("LLM configuration test failed");
      } else {
        // Test successful
        const details: string[] = [];
        
        if (testResults.embedding?.success) {
          details.push(`Embedding: ✓ ${testResults.embedding.model} (${testResults.embedding.testTime}ms)`);
        }
        
        if (testResults.summary?.success) {
          details.push(`Summary: ✓ ${testResults.summary.model} (${testResults.summary.testTime}ms)`);
        }
        
        const successMessage = details.length > 0
          ? `Tests passed! ${details.join(" | ")}`
          : "Configuration test successful!";
        
        setSaveMessage({ type: "success", text: successMessage });
        toast.success("LLM configuration test successful");
      }

      // Clear message after 10 seconds (longer for detailed messages)
      setTimeout(() => setSaveMessage(null), 10000);
    } catch (error) {
      console.error("Failed to test LLM config:", error);
      const errorMessage = error instanceof Error ? error.message : "Configuration test failed";
      setSaveMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Helper to render source badge
  const SourceBadge = ({ source }: { source: string }) => {
    if (source === "database") {
      return (
        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
          [Database Override]
        </span>
      );
    } else if (source === "environment") {
      return (
        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
          [Environment Variable]
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">System LLM Configuration</h2>
        <p className="mt-2 text-foreground/70">
          System-wide LLM configuration hierarchy: <strong>Environment Variables (.env)</strong> → <strong>Database Overrides (this form)</strong> → <strong>User Preferences</strong>
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          Environment variables provide the base system defaults. Database settings here override those defaults. Users can further override with their own credentials in preferences.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">LLM Provider</h3>
        
        <div className="space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              Provider
              <SourceBadge source={sources.provider} />
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as "openai" | "ollama")}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground"
            >
              <option value="openai">OpenAI</option>
              <option value="ollama">Ollama</option>
            </select>
            <p className="mt-1 text-sm text-foreground/60">
              Choose between OpenAI (cloud-based) or Ollama (self-hosted). Current: <strong>{provider}</strong>
            </p>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              API Key {provider === "openai" && "(optional)"}
              <SourceBadge source={sources.apiKey} />
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={maskedKey || "Enter API key..."}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground"
            />
            <p className="mt-1 text-sm text-foreground/60">
              {provider === "openai" 
                ? "Optional: Provide a system-wide API key. Users can also use their own keys."
                : "Your Ollama API key (if authentication is enabled)"}
            </p>
            {maskedKey && (
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                ✓ Current key: {maskedKey}
              </p>
            )}
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              Base URL (optional)
              <SourceBadge source={sources.baseUrl} />
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={provider === "openai" ? "https://api.openai.com/v1" : "http://localhost:11434"}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground"
            />
            <p className="mt-1 text-sm text-foreground/60">
              {provider === "openai" 
                ? "Use a custom OpenAI-compatible API endpoint"
                : "Your Ollama server URL"}
            </p>
          </div>

          {/* Model Names */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3">
              Model Configuration
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
              Specify different models for different features
            </p>
            
            <div className="space-y-4">
              {/* Summary Model */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  Summary Model
                  <SourceBadge source={sources.summaryModel} />
                </label>
                <input
                  type="text"
                  value={summaryModel}
                  onChange={(e) => setSummaryModel(e.target.value)}
                  placeholder={provider === "openai" ? "gpt-4o-mini" : "llama2"}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground"
                />
                <p className="mt-1 text-sm text-foreground/60">
                  Model for generating article summaries. Current: <strong>{summaryModel || "not set"}</strong>
                </p>
              </div>

              {/* Embedding Model */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  Embedding Model
                  <SourceBadge source={sources.embeddingModel} />
                </label>
                <input
                  type="text"
                  value={embeddingModel}
                  onChange={(e) => setEmbeddingModel(e.target.value)}
                  placeholder={provider === "openai" ? "text-embedding-3-small" : "nomic-embed-text"}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground"
                />
                <p className="mt-1 text-sm text-foreground/60">
                  Model for generating vector embeddings for semantic search. Current: <strong>{embeddingModel || "not set"}</strong>
                </p>
              </div>

              {/* Digest Model */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  Digest Model
                  <SourceBadge source={sources.digestModel} />
                </label>
                <input
                  type="text"
                  value={digestModel}
                  onChange={(e) => setDigestModel(e.target.value)}
                  placeholder={provider === "openai" ? "gpt-4o-mini" : "llama2"}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground"
                />
                <p className="mt-1 text-sm text-foreground/60">
                  Model for generating daily digests (future feature). Current: <strong>{digestModel || "not set"}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={testConfig.isPending || updateConfig.isPending}
              className="rounded-lg border border-blue-600 bg-transparent px-6 py-2 font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-blue-900/20"
            >
              {testConfig.isPending ? "Testing..." : "Test Configuration"}
            </button>
            <button
              onClick={handleSave}
              disabled={updateConfig.isPending || testConfig.isPending}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {updateConfig.isPending ? "Saving..." : "Save Configuration"}
            </button>
          </div>

          {/* Status Message */}
          {saveMessage && (
            <div
              className={`rounded-lg p-4 ${
                saveMessage.type === "success"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              }`}
            >
              {saveMessage.text}
            </div>
          )}
        </div>
      </div>

      {/* Information Panel */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
        <h3 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">
          💡 How It Works
        </h3>
        <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
          <li>
            <strong>Environment Variables</strong> (from .env file) provide system-wide defaults
            <ul className="ml-4 mt-1 space-y-1">
              <li>• LLM_PROVIDER, OPENAI_API_KEY, OPENAI_BASE_URL</li>
              <li>• LLM_SUMMARY_MODEL, EMBEDDING_MODEL, LLM_DIGEST_MODEL</li>
            </ul>
          </li>
          <li>
            <strong>Database Overrides</strong> (set here) take precedence over environment variables
          </li>
          <li>
            <strong>User Preferences</strong> override both system settings with personal credentials
          </li>
          <li>
            For OpenAI: System credentials are optional - users can always provide their own keys
          </li>
        </ul>
      </div>
      
      {/* Environment Variables Reference */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="font-medium text-foreground mb-2">
          Environment Variables Reference
        </h3>
        <p className="text-sm text-foreground/70 mb-3">
          Configure these in your .env file for system-wide defaults:
        </p>
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">LLM_PROVIDER</span>
            <span className="text-foreground/60">=</span>
            <span className="text-foreground/80">&quot;openai&quot; | &quot;ollama&quot;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">OPENAI_API_KEY</span>
            <span className="text-foreground/60">=</span>
            <span className="text-foreground/80">&quot;sk-...&quot;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">OPENAI_BASE_URL</span>
            <span className="text-foreground/60">=</span>
            <span className="text-foreground/80">&quot;https://api.openai.com/v1&quot;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">LLM_SUMMARY_MODEL</span>
            <span className="text-foreground/60">=</span>
            <span className="text-foreground/80">&quot;gpt-4o-mini&quot;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">EMBEDDING_MODEL</span>
            <span className="text-foreground/60">=</span>
            <span className="text-foreground/80">&quot;text-embedding-3-small&quot;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">LLM_DIGEST_MODEL</span>
            <span className="text-foreground/60">=</span>
            <span className="text-foreground/80">&quot;gpt-4o-mini&quot;</span>
          </div>
        </div>
      </div>
    </div>
  );
}
