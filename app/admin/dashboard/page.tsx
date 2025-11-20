"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { formatLocalizedDate } from "@/lib/date-utils";
import { Tooltip } from "@/app/components/admin/Tooltip";
import type { User as UserType } from "@prisma/client";

type UserWithCount = UserType & {
  _count: {
    user_feeds: number;
    read_articles: number;
    article_feedback: number;
    user_patterns: number;
  };
};

type TabId = "overview" | "search" | "users" | "jobs" | "storage" | "config" | "llm-config";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
}

interface CacheStatus {
  connected: boolean;
  enabled: boolean;
}

interface EmbeddingStats {
  total: number;
  withEmbeddings: number;
  withoutEmbeddings: number;
  percentage: number;
}

interface EmbeddingConfig {
  provider: string;
  model: string;
  batchSize: number;
  apiKey?: string;
  autoGenerate: boolean;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  usersWithFeedback: number;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  _count: {
    userFeeds: number;
    readArticles: number;
    articleFeedback: number;
    userPatterns: number;
    userThemes: number;
  };
}

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  data?: any;
}

interface CronJobRun {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  result: any;
  error: string | null;
  logs?: LogEntry[];
}

interface CronJob {
  name: string;
  displayName: string;
  description: string;
  enabled: boolean;
  running: boolean;
  schedule: string;
  scheduleDescription: string;
  nextRun: string | null;
  lastRun: CronJobRun | null;
  recentRuns: CronJobRun[];
}

interface CronStatus {
  enabled: boolean;
  initialized: boolean;
  jobs: CronJob[];
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [embeddingStats, setEmbeddingStats] = useState<EmbeddingStats | null>(null);
  const [embeddingConfig, setEmbeddingConfig] = useState<EmbeddingConfig | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [users, setUsers] = useState<UserWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    loadMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      // Load all metrics in parallel
      const [cacheRes, embeddingStatsRes, embeddingConfigRes, usersRes] = await Promise.all([
        fetch("/api/admin/cache/stats"),
        fetch("/api/admin/embeddings"),
        fetch("/api/admin/embeddings/config"),
        fetch("/api/admin/users"),
      ]);

      if (cacheRes.ok) {
        const data = await cacheRes.json();
        setCacheStats(data.data?.stats || null);
        setCacheStatus(data.data?.status || null);
      }

      if (embeddingStatsRes.ok) {
        const data = await embeddingStatsRes.json();
        setEmbeddingStats(data.data?.stats || null);
      }

      if (embeddingConfigRes.ok) {
        const data = await embeddingConfigRes.json();
        const responseData = data.data;
        if (responseData?.config) {
          setEmbeddingConfig({
            provider: responseData.config.provider,
            model: responseData.config.model,
            batchSize: responseData.config.batchSize,
            autoGenerate: responseData.autoGenerate ?? false,
          });
        }
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.data?.users || []);
        setUserStats(data.data?.stats || null);
      }
    } catch (error) {
      console.error("Failed to load metrics:", error);
    } finally {
      setIsLoading(false);
    }
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
      const response = await fetch("/api/admin/cache/clear", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Cache cleared successfully!");
        loadMetrics();
      } else {
        toast.error("Failed to clear cache");
      }
    } catch (error) {
      console.error("Failed to clear cache:", error);
      toast.error("Failed to clear cache");
    }
  };

  const handleGenerateEmbeddings = async () => {
    try {
      const response = await fetch("/api/jobs/generate-embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 50, maxBatches: 5 }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          `Generated embeddings for ${data.data.processed} articles! Failed: ${data.data.failed}, Tokens used: ${data.data.totalTokens}`
        );
        loadMetrics();
      }
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate embeddings");
    }
  };

  const handleRefreshFeeds = async () => {
    try {
      const response = await fetch("/api/jobs/refresh-feeds", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        const stats = data.data.stats;
        toast.success(
          `Refreshed ${stats.totalFeeds} feeds successfully! ` +
          `Successful: ${stats.successful}, ` +
          `Failed: ${stats.failed}, ` +
          `New articles: ${stats.totalNewArticles}, ` +
          `Updated articles: ${stats.totalUpdatedArticles}`
        );
      }
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
      const response = await fetch("/api/admin/cleanup", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Cleanup completed! Removed ${data.data.deletedCount} old articles.`);
      } else {
        toast.error("Failed to run cleanup");
      }
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
      const response = await fetch("/api/admin/database/reset", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        const summary = data.data;
        toast.success(
          `Database reset completed! ` +
          `Deleted: ${summary.feeds} feeds, ${summary.articles} articles, ` +
          `${summary.categories} categories, ${summary.userFeeds} subscriptions. ` +
          `Total: ${summary.totalDeleted} records`,
          { duration: 10000 }
        );
        loadMetrics();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`Failed to reset database: ${errorData.error || "Unknown error"}`);
      }
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Vertical Tab Navigation */}
            <div className="w-56 flex-shrink-0">
              <nav className="space-y-1 rounded-lg border border-border bg-background p-2 border-border bg-background">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white"
                        : "text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1">
              {activeTab === "overview" && (
                <OverviewTab
                  cacheStatus={cacheStatus}
                  cacheStats={cacheStats}
                  embeddingStats={embeddingStats}
                  userStats={userStats}
                />
              )}

              {activeTab === "search" && (
                <SearchTab
                  embeddingStats={embeddingStats}
                  embeddingConfig={embeddingConfig}
                  onGenerateEmbeddings={handleGenerateEmbeddings}
                  onSettingsUpdate={loadMetrics}
                />
              )}

              {activeTab === "users" && (
                <UsersTab users={users} userStats={userStats} />
              )}

              {activeTab === "jobs" && (
                <JobsTab
                  onRefreshFeeds={handleRefreshFeeds}
                  onGenerateEmbeddings={handleGenerateEmbeddings}
                  onCleanup={handleCleanup}
                />
              )}

              {activeTab === "storage" && (
                <StorageTab
                  cacheStats={cacheStats}
                  cacheStatus={cacheStatus}
                  onClearCache={handleClearCache}
                  onDatabaseReset={handleDatabaseReset}
                />
              )}

              {activeTab === "config" && (
                <ConfigurationTab />
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

// Overview Tab
function OverviewTab({
  cacheStatus,
  cacheStats,
  embeddingStats,
  userStats,
}: {
  cacheStatus: CacheStatus | null;
  cacheStats: CacheStats | null;
  embeddingStats: EmbeddingStats | null;
  userStats: UserStats | null;
}) {
  const [storageStats, setStorageStats] = useState<any>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);

  useEffect(() => {
    loadStorageStats();
    const interval = setInterval(loadStorageStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStorageStats = async () => {
    try {
      const [pgRes, redisRes] = await Promise.all([
        fetch("/api/admin/storage/postgres"),
        fetch("/api/admin/storage/redis"),
      ]);

      const storage: any = {};

      if (pgRes.ok) {
        const data = await pgRes.json();
        storage.postgres = data.data?.stats;
      }

      if (redisRes.ok) {
        const data = await redisRes.json();
        storage.redis = data.data?.stats;
      }

      setStorageStats(storage);
    } catch (error) {
      console.error("Failed to load storage stats:", error);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* System Health Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* PostgreSQL Status */}
        <div className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm transition-all hover:shadow-md dark:from-blue-950/50 dark:to-blue-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">PostgreSQL</p>
              <p className="mt-2 text-3xl font-bold text-blue-900 dark:text-blue-100">
                {storageStats?.postgres?.databaseSize || "—"}
              </p>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                {storageStats?.postgres?.connectionInfo?.activeConnections || 0} active connections
              </p>
            </div>
            <div className="rounded-lg bg-blue-200/50 p-3 dark:bg-blue-800/50">
              <svg className="h-6 w-6 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
          </div>
          {storageStats?.postgres && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
                <span>Cache Hit Ratio</span>
                <span className="font-semibold">{(storageStats.postgres.cacheHitRatio * 100).toFixed(0)}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-400 transition-all"
                  style={{ width: `${storageStats.postgres.cacheHitRatio * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Redis Status */}
        <div className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-red-50 to-red-100 p-6 shadow-sm transition-all hover:shadow-md dark:from-red-950/50 dark:to-red-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Redis Cache</p>
              <p className="mt-2 text-3xl font-bold text-red-900 dark:text-red-100">
                {storageStats?.redis?.memory?.usedMemoryHuman || "—"}
              </p>
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {storageStats?.redis?.keyspace?.reduce((sum: number, db: any) => sum + db.keys, 0)?.toLocaleString() || 0} keys
              </p>
            </div>
            <div className="rounded-lg bg-red-200/50 p-3 dark:bg-red-800/50">
              <svg className="h-6 w-6 text-red-700 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
          </div>
          {storageStats?.redis?.stats && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-red-700 dark:text-red-300">
                <span>Hit Rate</span>
                <span className="font-semibold">{(storageStats.redis.stats.hitRate * 100).toFixed(0)}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-red-200 dark:bg-red-800">
                <div
                  className="h-full bg-red-600 dark:bg-red-400 transition-all"
                  style={{ width: `${storageStats.redis.stats.hitRate * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Embeddings Status */}
        <div className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-sm transition-all hover:shadow-md dark:from-purple-950/50 dark:to-purple-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Embeddings</p>
              <p className="mt-2 text-3xl font-bold text-purple-900 dark:text-purple-100">
                {embeddingStats?.percentage.toFixed(0)}%
              </p>
              <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                {embeddingStats?.withEmbeddings.toLocaleString() || 0} / {embeddingStats?.total.toLocaleString() || 0} articles
              </p>
            </div>
            <div className="rounded-lg bg-purple-200/50 p-3 dark:bg-purple-800/50">
              <svg className="h-6 w-6 text-purple-700 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>
          {embeddingStats && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-300">
                <span>Coverage</span>
                <span className="font-semibold">{embeddingStats.percentage.toFixed(1)}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-purple-200 dark:bg-purple-800">
                <div
                  className="h-full bg-purple-600 dark:bg-purple-400 transition-all"
                  style={{ width: `${embeddingStats.percentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Users Status */}
        <div className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-green-50 to-green-100 p-6 shadow-sm transition-all hover:shadow-md dark:from-green-950/50 dark:to-green-900/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Users</p>
              <p className="mt-2 text-3xl font-bold text-green-900 dark:text-green-100">
                {userStats?.totalUsers || 0}
              </p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                {userStats?.activeUsers || 0} active users
              </p>
            </div>
            <div className="rounded-lg bg-green-200/50 p-3 dark:bg-green-800/50">
              <svg className="h-6 w-6 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          {userStats && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-green-700 dark:text-green-300">
                <span>With Feedback</span>
                <span className="font-semibold">{userStats.usersWithFeedback}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-green-200 dark:bg-green-800">
                <div
                  className="h-full bg-green-600 dark:bg-green-400 transition-all"
                  style={{ width: `${userStats.totalUsers > 0 ? (userStats.usersWithFeedback / userStats.totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Storage Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* PostgreSQL Details */}
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">PostgreSQL Details</h3>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              storageStats?.postgres ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${storageStats?.postgres ? "bg-green-600 dark:bg-green-400" : "bg-gray-600 dark:bg-gray-400"}`}></span>
              {storageStats?.postgres ? "Connected" : "Loading..."}
            </span>
          </div>
          
          {storageStats?.postgres ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-foreground/60">Max Connections</p>
                  <p className="text-2xl font-bold text-foreground">{storageStats.postgres.connectionInfo.maxConnections}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/60">Current</p>
                  <p className="text-2xl font-bold text-foreground">{storageStats.postgres.connectionInfo.currentConnections}</p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-foreground/70">Connection Usage</span>
                  <span className="font-medium text-foreground">
                    {((storageStats.postgres.connectionInfo.currentConnections / storageStats.postgres.connectionInfo.maxConnections) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                    style={{ width: `${(storageStats.postgres.connectionInfo.currentConnections / storageStats.postgres.connectionInfo.maxConnections) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-foreground/60">Active</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {storageStats.postgres.connectionInfo.activeConnections}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-foreground/60">Idle</p>
                  <p className="text-lg font-semibold text-foreground">
                    {storageStats.postgres.connectionInfo.idleConnections}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* Redis Details */}
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Redis Details</h3>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              storageStats?.redis?.connected ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${storageStats?.redis?.connected ? "bg-green-600 dark:bg-green-400" : "bg-gray-600 dark:bg-gray-400"}`}></span>
              {storageStats?.redis?.connected ? "Connected" : storageStats?.redis?.enabled ? "Disconnected" : "Disabled"}
            </span>
          </div>
          
          {storageStats?.redis?.connected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-foreground/60">Memory Used</p>
                  <p className="text-2xl font-bold text-foreground">{storageStats.redis.memory.usedMemoryHuman}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/60">Peak Memory</p>
                  <p className="text-2xl font-bold text-foreground">{storageStats.redis.memory.usedMemoryPeakHuman}</p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-foreground/70">Fragmentation Ratio</span>
                  <span className={`font-medium ${
                    storageStats.redis.memory.memoryFragmentationRatio > 1.5 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"
                  }`}>
                    {storageStats.redis.memory.memoryFragmentationRatio.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-foreground/60">
                  {storageStats.redis.memory.memoryFragmentationRatio > 1.5 ? "⚠️ High fragmentation - consider restart" : "✓ Healthy"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-foreground/60">Ops/Sec</p>
                  <p className="text-lg font-semibold text-foreground">
                    {storageStats.redis.stats.instantaneousOpsPerSec.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-foreground/60">Clients</p>
                  <p className="text-lg font-semibold text-foreground">
                    {storageStats.redis.clients.connectedClients}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-foreground/60">
              {storageStats?.redis?.enabled ? "Redis is not connected" : "Redis is disabled"}
            </div>
          )}
        </div>
      </div>

      {/* Application Cache Stats */}
      {cacheStats && (
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Application Cache Performance</h3>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{cacheStats.hits.toLocaleString()}</p>
              <p className="mt-1 text-xs text-foreground/60">Hits</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{cacheStats.misses.toLocaleString()}</p>
              <p className="mt-1 text-xs text-foreground/60">Misses</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{(cacheStats.hitRate * 100).toFixed(1)}%</p>
              <p className="mt-1 text-xs text-foreground/60">Hit Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{cacheStats.sets.toLocaleString()}</p>
              <p className="mt-1 text-xs text-foreground/60">Sets</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{cacheStats.errors.toLocaleString()}</p>
              <p className="mt-1 text-xs text-foreground/60">Errors</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-foreground/70">Cache Efficiency</span>
              <span className="font-medium text-foreground">{(cacheStats.hitRate * 100).toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 transition-all"
                style={{ width: `${cacheStats.hitRate * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Search Tab (Embeddings & Semantic Search)
function SearchTab({
  embeddingStats,
  embeddingConfig,
  onGenerateEmbeddings,
  onSettingsUpdate,
}: {
  embeddingStats: EmbeddingStats | null;
  embeddingConfig: EmbeddingConfig | null;
  onGenerateEmbeddings: () => void;
  onSettingsUpdate: () => void;
}) {
  const [autoGenerate, setAutoGenerate] = useState(embeddingConfig?.autoGenerate ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Provider settings
  const [activeProvider, setActiveProvider] = useState<"openai" | "local">(embeddingConfig?.provider as "openai" | "local" || "local");
  const [providerStatus, setProviderStatus] = useState<{
    openai: { available: boolean; error?: string };
    local: { available: boolean; error?: string };
  } | null>(null);
  const [isLoadingProvider, setIsLoadingProvider] = useState(true);
  const [isSwitchingProvider, setIsSwitchingProvider] = useState(false);
  const [providerMessage, setProviderMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Search recency settings
  const [recencyWeight, setRecencyWeight] = useState(0.3);
  const [recencyDecayDays, setRecencyDecayDays] = useState(30);
  const [isLoadingRecency, setIsLoadingRecency] = useState(true);
  const [isSavingRecency, setIsSavingRecency] = useState(false);
  const [recencySaveMessage, setRecencySaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Track if this is initial load vs manual provider change
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Only sync from embeddingConfig on initial load
    if (embeddingConfig && isInitialLoad) {
      setAutoGenerate(embeddingConfig.autoGenerate);
      setActiveProvider(embeddingConfig.provider as "openai" | "local");
      setIsInitialLoad(false);
    } else if (embeddingConfig) {
      // After initial load, only update autoGenerate, not provider
      setAutoGenerate(embeddingConfig.autoGenerate);
    }
  }, [embeddingConfig, isInitialLoad]);

  // Load provider status
  useEffect(() => {
    loadProviderStatus();
  }, []);

  // Load recency settings
  useEffect(() => {
    loadRecencySettings();
  }, []);

  const loadProviderStatus = async () => {
    setIsLoadingProvider(true);
    try {
      const response = await fetch("/api/admin/embeddings/provider");
      
      if (response.ok) {
        const data = await response.json();
        setActiveProvider(data.data.activeProvider);
        setProviderStatus({
          openai: {
            available: data.data.providers.openai.available,
            error: data.data.providers.openai.error,
          },
          local: {
            available: data.data.providers.local.available,
            error: data.data.providers.local.error,
          },
        });
      }
    } catch (error) {
      console.error("Failed to load provider status:", error);
    } finally {
      setIsLoadingProvider(false);
    }
  };

  const handleSwitchProvider = async (provider: "openai" | "local") => {
    if (provider === activeProvider) return;
    
    setIsSwitchingProvider(true);
    setProviderMessage(null);

    try {
      const response = await fetch("/api/admin/embeddings/provider", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      
      // Immediately update UI state - this takes precedence over config updates
      setActiveProvider(provider);
      setProviderMessage({ type: "success", text: result.data.message });
      
      // Reload provider availability status (but keep the provider we just set)
      try {
        const statusResponse = await fetch("/api/admin/embeddings/provider");
        if (statusResponse.ok) {
          const data = await statusResponse.json();
          setProviderStatus({
            openai: {
              available: data.data.providers.openai.available,
              error: data.data.providers.openai.error,
            },
            local: {
              available: data.data.providers.local.available,
              error: data.data.providers.local.error,
            },
          });
        }
      } catch (error) {
        console.error("Failed to reload provider status:", error);
      }
      
      // Notify parent to reload (won't override activeProvider now)
      setTimeout(() => {
        onSettingsUpdate();
      }, 300);

      // Clear success message after 5 seconds
      setTimeout(() => setProviderMessage(null), 5000);
    } catch (error) {
      console.error("Failed to switch provider:", error);
      setProviderMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to switch provider",
      });
    } finally {
      setIsSwitchingProvider(false);
    }
  };

  const loadRecencySettings = async () => {
    setIsLoadingRecency(true);
    try {
      // Load recency weight
      const weightResponse = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "default_search_recency_weight" }),
      });
      
      if (weightResponse.ok) {
        const weightData = await weightResponse.json();
        if (weightData.data?.value !== null && weightData.data?.value !== undefined) {
          setRecencyWeight(weightData.data.value);
        }
      }

      // Load recency decay days
      const decayResponse = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "default_search_recency_decay_days" }),
      });
      
      if (decayResponse.ok) {
        const decayData = await decayResponse.json();
        if (decayData.data?.value !== null && decayData.data?.value !== undefined) {
          setRecencyDecayDays(decayData.data.value);
        }
      }
    } catch (error) {
      console.error("Failed to load recency settings:", error);
    } finally {
      setIsLoadingRecency(false);
    }
  };

  const handleToggleAutoGenerate = async () => {
    const newValue = !autoGenerate;
    setAutoGenerate(newValue);
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "embedding_auto_generate",
          value: newValue,
          description: "Automatically generate embeddings when importing feed articles",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Setting saved:", result);

      setSaveMessage({ type: "success", text: "Setting saved successfully" });
      
      // Wait a bit before reloading to avoid race condition
      setTimeout(() => {
        onSettingsUpdate();
      }, 100);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save setting:", error);
      setSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save setting",
      });
      // Revert on error
      setAutoGenerate(!newValue);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRecencySetting = async (key: string, value: number, description: string) => {
    setIsSavingRecency(true);
    setRecencySaveMessage(null);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          value,
          description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      setRecencySaveMessage({ type: "success", text: "Setting saved successfully" });
      
      // Clear success message after 3 seconds
      setTimeout(() => setRecencySaveMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save recency setting:", error);
      setRecencySaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save setting",
      });
    } finally {
      setIsSavingRecency(false);
    }
  };

  const handleRecencyWeightChange = (value: number) => {
    setRecencyWeight(value);
    handleSaveRecencySetting(
      "default_search_recency_weight",
      value,
      "Default recency weight for semantic search (0-1)"
    );
  };

  const handleRecencyDecayDaysChange = (value: number) => {
    setRecencyDecayDays(value);
    handleSaveRecencySetting(
      "default_search_recency_decay_days",
      value,
      "Default recency decay period in days for semantic search"
    );
  };

  return (
    <div className="space-y-6">
      {embeddingStats && (
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm border-border bg-background">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Embedding Statistics
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {embeddingStats.total}
              </div>
              <div className="text-sm text-foreground/70">Total Articles</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {embeddingStats.withEmbeddings}
              </div>
              <div className="text-sm text-foreground/70">With Embeddings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {embeddingStats.withoutEmbeddings}
              </div>
              <div className="text-sm text-foreground/70">Without Embeddings</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/70">Coverage</span>
              <span className="font-medium text-foreground">
                {embeddingStats.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted bg-background">
              <div
                className="h-full bg-blue-600 transition-all dark:bg-blue-500"
                style={{ width: `${embeddingStats.percentage}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-4">
            <Tooltip content="Generate vector embeddings for articles that don't have them yet. This enables semantic search functionality.">
              <button
                onClick={onGenerateEmbeddings}
                disabled={embeddingStats.withoutEmbeddings === 0}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Generate Embeddings ({embeddingStats.withoutEmbeddings} remaining)
              </button>
            </Tooltip>
          </div>
        </div>
      )}

      {embeddingConfig && (
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm border-border bg-background">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Configuration
          </h2>
          
          {/* Provider Selection */}
          <div className="mb-6 rounded-lg border border-border bg-muted/50 p-4">
            <h3 className="font-medium text-foreground mb-3">Embedding Provider</h3>
            <p className="text-sm text-foreground/70 mb-4">
              Choose between OpenAI (fast, paid) or Local WASM (free, slower) for generating embeddings
            </p>
            
            {isLoadingProvider ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* OpenAI Provider Option */}
                <button
                  onClick={() => handleSwitchProvider("openai")}
                  disabled={isSwitchingProvider}
                  className={`w-full text-left rounded-lg border-2 p-4 transition-all ${
                    activeProvider === "openai"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-border hover:border-blue-300 dark:hover:border-blue-700"
                  } ${
                    isSwitchingProvider
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">OpenAI</span>
                        {activeProvider === "openai" && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                            Active
                          </span>
                        )}
                        {providerStatus?.openai.available ? (
                          <span className="text-xs text-green-600 dark:text-green-400">✓ Available</span>
                        ) : (
                          <span className="text-xs text-red-600 dark:text-red-400">✗ Not Available</span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/70 mt-1">
                        Fast, high-quality embeddings. Costs ~$0.065 per 1,000 articles.
                      </p>
                      {!providerStatus?.openai.available && providerStatus?.openai.error && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                          ⚠️ {providerStatus.openai.error} - Users can still provide their own API keys in preferences.
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                {/* Local Provider Option */}
                <button
                  onClick={() => handleSwitchProvider("local")}
                  disabled={isSwitchingProvider || !providerStatus?.local.available}
                  className={`w-full text-left rounded-lg border-2 p-4 transition-all ${
                    activeProvider === "local"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-border hover:border-blue-300 dark:hover:border-blue-700"
                  } ${
                    !providerStatus?.local.available
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">Local (WASM)</span>
                        {activeProvider === "local" && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                            Active
                          </span>
                        )}
                        {providerStatus?.local.available ? (
                          <span className="text-xs text-green-600 dark:text-green-400">✓ Available</span>
                        ) : (
                          <span className="text-xs text-red-600 dark:text-red-400">✗ Not Available</span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/70 mt-1">
                        Free, runs locally using WebAssembly. Slower (~500ms per article).
                      </p>
                      {!providerStatus?.local.available && providerStatus?.local.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                          {providerStatus.local.error}
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                {/* Provider Message */}
                {providerMessage && (
                  <div
                    className={`rounded-lg p-3 text-sm ${
                      providerMessage.type === "success"
                        ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    }`}
                  >
                    {providerMessage.text}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Auto-generate toggle */}
          <div className="mb-6 rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label htmlFor="auto-generate-toggle" className="font-medium text-foreground block">
                  Auto-generate on Import
                </label>
                <p className="text-sm text-foreground/70 mt-1">
                  Automatically generate embeddings when new articles are imported from feeds
                </p>
                {saveMessage && (
                  <p
                    className={`text-xs mt-2 ${
                      saveMessage.type === "success" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {saveMessage.text}
                  </p>
                )}
              </div>
              <div className="ml-4">
                <button
                  id="auto-generate-toggle"
                  type="button"
                  role="switch"
                  aria-checked={autoGenerate}
                  onClick={handleToggleAutoGenerate}
                  disabled={isSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    autoGenerate ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoGenerate ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-foreground/70">Provider</dt>
              <dd className="font-medium text-foreground">
                {embeddingConfig.provider}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground/70">Model</dt>
              <dd className="font-medium text-foreground">
                {embeddingConfig.model}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground/70">Batch Size</dt>
              <dd className="font-medium text-foreground">
                {embeddingConfig.batchSize}
              </dd>
            </div>
          </dl>
          
          <p className="text-xs text-foreground/60 italic mt-4">
            Provider, model, and batch size are configured via environment variables
          </p>
        </div>
      )}

      {/* Search Recency Settings */}
      <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Search Recency Settings
        </h2>
        <p className="mb-6 text-sm text-foreground/70">
          Configure default recency scoring for semantic search. These settings apply to new users and can be overridden in individual user preferences.
        </p>

        {isLoadingRecency ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recency Weight Slider */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Default Recency Weight: {Math.round(recencyWeight * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={recencyWeight * 100}
                onChange={(e) => handleRecencyWeightChange(parseInt(e.target.value) / 100)}
                disabled={isSavingRecency}
                className="w-full"
              />
              <p className="mt-2 text-xs text-foreground/60">
                Controls how much to prioritize recent articles in search results. 
                0% = pure semantic similarity, 100% = only recency matters. 
                Recommended: 20-40% for balanced results.
              </p>
            </div>

            {/* Recency Decay Days Slider */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Default Recency Decay Period: {recencyDecayDays} days
              </label>
              <input
                type="range"
                min="7"
                max="180"
                step="7"
                value={recencyDecayDays}
                onChange={(e) => handleRecencyDecayDaysChange(parseInt(e.target.value))}
                disabled={isSavingRecency}
                className="w-full"
              />
              <p className="mt-2 text-xs text-foreground/60">
                How quickly article recency importance fades. Shorter periods favor very recent articles. 
                Recommended: 30 days for news, 60-90 days for general content.
              </p>
            </div>

            {/* Save Message */}
            {recencySaveMessage && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  recencySaveMessage.type === "success"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {recencySaveMessage.text}
              </div>
            )}

            {/* Info Box */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
              <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-200">
                How Recency Scoring Works
              </h3>
              <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                <li>• Combines semantic similarity with time-based decay</li>
                <li>• Uses exponential decay: recent articles get higher scores</li>
                <li>• With 30-day decay: today = 100%, 30 days = 37%, 60 days = 14%</li>
                <li>• Users can customize these settings in their preferences</li>
                <li>• Changes here only affect new users or users without custom settings</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Users Tab
function UsersTab({ users, userStats }: { users: UserWithCount[]; userStats: UserStats | null }) {
  return (
    <div className="space-y-6">
      {userStats && (
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm border-border bg-background">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            User Statistics
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {userStats.totalUsers}
              </div>
              <div className="text-sm text-foreground/70">Total Users</div>
            </div>
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {userStats.activeUsers}
              </div>
              <div className="text-sm text-foreground/70">Active Users</div>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {userStats.usersWithFeedback}
              </div>
              <div className="text-sm text-foreground/70">With Feedback</div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-background p-6 shadow-sm border-border bg-background">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          User List
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border border-border">
                <th className="pb-3 text-left text-sm font-medium text-foreground/70">
                  User
                </th>
                <th className="pb-3 text-left text-sm font-medium text-foreground/70">
                  Feeds
                </th>
                <th className="pb-3 text-left text-sm font-medium text-foreground/70">
                  Articles Read
                </th>
                <th className="pb-3 text-left text-sm font-medium text-foreground/70">
                  Feedback
                </th>
                <th className="pb-3 text-left text-sm font-medium text-foreground/70">
                  Patterns
                </th>
                <th className="pb-3 text-left text-sm font-medium text-foreground/70">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || "User"}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                          {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-foreground">
                          {user.name || "Unknown"}
                        </div>
                        <div className="text-sm text-foreground/60">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-foreground">
                    {user._count.user_feeds}
                  </td>
                  <td className="py-3 text-foreground">
                    {user._count.read_articles}
                  </td>
                  <td className="py-3 text-foreground">
                    {user._count.article_feedback}
                  </td>
                  <td className="py-3 text-foreground">
                    {user._count.user_patterns}
                  </td>
                  <td className="py-3 text-sm text-foreground/60">
                    {formatLocalizedDate(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Jobs Tab
function JobsTab({
  onRefreshFeeds,
  onGenerateEmbeddings,
  onCleanup,
}: {
  onRefreshFeeds: () => void;
  onGenerateEmbeddings: () => void;
  onCleanup: () => void;
}) {
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);
  const [isLoadingCron, setIsLoadingCron] = useState(true);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  useEffect(() => {
    loadCronStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadCronStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadCronStatus() {
    try {
      const response = await fetch("/api/admin/cron/history");
      if (response.ok) {
        const data = await response.json();
        console.log("Cron status response:", data);
        
        // Handle success response format { success: true, data: { ... } }
        if (data.success && data.data && data.data.jobs) {
          setCronStatus(data.data);
        } else if (data.data && data.data.jobs) {
          // Fallback for direct data format
          setCronStatus(data.data);
        } else if (data.jobs) {
          // Fallback for unwrapped format
          setCronStatus(data);
        } else {
          console.error("Invalid cron status response structure:", data);
          setCronStatus(null);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch cron status:", response.status, errorData);
        toast.error(`Failed to load cron status: ${errorData.error || response.statusText}`);
        setCronStatus(null);
      }
    } catch (error) {
      console.error("Failed to load cron status:", error);
      toast.error("Failed to load cron status");
      setCronStatus(null);
    } finally {
      setIsLoadingCron(false);
    }
  }

  const getStatusBadge = (status: string, running: boolean) => {
    if (running) {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <span className="mr-1 h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          Running
        </span>
      );
    }
    
    if (status === "success") {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
          ✓ Success
        </span>
      );
    }
    
    if (status === "failed") {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
          ✗ Failed
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
        {status}
      </span>
    );
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatRelativeTime = (date: string | null) => {
    if (!date) return "Never";
    const now = new Date().getTime();
    const then = new Date(date).getTime();
    const diff = now - then;
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const formatNextRunTime = (nextRun: string | null) => {
    if (!nextRun) return "N/A";
    const now = new Date().getTime();
    const then = new Date(nextRun).getTime();
    const diff = then - now;
    
    if (diff < 0) return "Overdue";
    if (diff < 60000) return `in ${Math.floor(diff / 1000)}s`;
    if (diff < 3600000) return `in ${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `in ${Math.floor(diff / 3600000)}h`;
    return `in ${Math.floor(diff / 86400000)}d`;
  };

  return (
    <div className="space-y-6">
      {/* Scheduled Tasks Status */}
      <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Scheduled Tasks Status
        </h2>
        
        {isLoadingCron ? (
          <div className="text-center py-8 text-foreground/70">Loading...</div>
        ) : !cronStatus || !cronStatus.jobs ? (
          <div className="text-center py-8 text-red-600">Failed to load cron status</div>
        ) : (
          <div className="space-y-6">
            {cronStatus.jobs.map((job) => (
              <div key={job.name} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{job.displayName}</h3>
                      {getStatusBadge(job.lastRun?.status || "unknown", job.running)}
                      {!job.enabled && (
                        <span className="text-xs text-foreground/50">(Disabled)</span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/70 mt-1">{job.description}</p>
                    <p className="text-xs text-foreground/50 mt-1">
                      Schedule: {job.scheduleDescription}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-foreground/50 mb-1">Last Run</div>
                    <div className="text-sm font-medium text-foreground">
                      {job.lastRun ? formatRelativeTime(job.lastRun.startedAt) : "Never"}
                    </div>
                    {job.lastRun && (
                      <div className="text-xs text-foreground/50">
                        Duration: {formatDuration(job.lastRun.duration)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-foreground/50 mb-1">Next Run</div>
                    <div className="text-sm font-medium text-foreground">
                      {job.enabled ? formatNextRunTime(job.nextRun) : "Disabled"}
                    </div>
                    {job.nextRun && job.enabled && (
                      <div className="text-xs text-foreground/50">
                        {new Date(job.nextRun).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-foreground/50 mb-1">Stats</div>
                    {job.lastRun?.result && (
                      <div className="text-xs text-foreground">
                        {job.name === "feed-refresh" && (
                          <>
                            {job.lastRun.result.newArticles || 0} new articles
                            {job.lastRun.result.articlesCleanedUp ? `, ${job.lastRun.result.articlesCleanedUp} cleaned` : ""}
                          </>
                        )}
                        {job.name === "cleanup" && (
                          <>
                            {job.lastRun.result.deleted || 0} deleted
                            {job.lastRun.result.vacuumRun && ", vacuum run"}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Runs */}
                {job.recentRuns && job.recentRuns.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs text-foreground/50 mb-2">Recent Executions</div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {job.recentRuns.slice(0, 10).map((run) => (
                        <div
                          key={run.id}
                          className="flex items-center justify-between py-2 px-3 rounded bg-background/50 hover:bg-background border border-border/50 cursor-pointer"
                          onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-foreground/70">
                                {new Date(run.startedAt).toLocaleString()}
                              </div>
                              {expandedRun === run.id && (
                                <div className="mt-2 space-y-2">
                                  {run.result && (
                                    <div>
                                      <div className="text-xs font-semibold text-foreground/70 mb-1">Result:</div>
                                      <div className="text-xs text-foreground/50 font-mono bg-background/50 p-2 rounded">
                                        {JSON.stringify(run.result, null, 2)}
                                      </div>
                                    </div>
                                  )}
                                  {run.error && (
                                    <div>
                                      <div className="text-xs font-semibold text-red-600 mb-1">Error:</div>
                                      <div className="text-xs text-red-600">
                                        {run.error}
                                      </div>
                                    </div>
                                  )}
                                  {run.logs && run.logs.length > 0 && (
                                    <div>
                                      <div className="text-xs font-semibold text-foreground/70 mb-1">
                                        Logs ({run.logs.length} entries):
                                      </div>
                                      <div className="text-xs font-mono bg-background/50 p-2 rounded max-h-64 overflow-y-auto space-y-1">
                                        {run.logs.map((log, idx) => (
                                          <div
                                            key={idx}
                                            className={`${
                                              log.level === "error"
                                                ? "text-red-600"
                                                : log.level === "warn"
                                                ? "text-yellow-600"
                                                : log.level === "debug"
                                                ? "text-gray-500"
                                                : "text-foreground/70"
                                            }`}
                                          >
                                            <span className="text-foreground/50">
                                              [{new Date(log.timestamp).toLocaleTimeString()}]
                                            </span>{" "}
                                            <span className="font-semibold uppercase">[{log.level}]</span>{" "}
                                            {log.message}
                                            {log.data && (
                                              <div className="ml-4 text-foreground/50">
                                                {JSON.stringify(log.data)}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-foreground/50">
                              {formatDuration(run.duration)}
                            </div>
                            <div>{getStatusBadge(run.status, false)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Job Execution */}
      <div className="rounded-lg border border-border bg-background p-6 shadow-sm border-border bg-background">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Manual Job Execution
        </h2>
        <p className="mb-6 text-sm text-foreground/70">
          Manually trigger background jobs for maintenance and updates
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4 border-border">
            <div>
              <h3 className="font-medium text-foreground">
                Refresh All Feeds
              </h3>
              <p className="text-sm text-foreground/70">
                Fetch new articles from all subscribed feeds
              </p>
            </div>
            <Tooltip content="Manually trigger feed refresh to fetch the latest articles from all RSS/Atom feeds">
              <button
                onClick={onRefreshFeeds}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Run Now
              </button>
            </Tooltip>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4 border-border">
            <div>
              <h3 className="font-medium text-foreground">
                Generate Embeddings
              </h3>
              <p className="text-sm text-foreground/70">
                Generate vector embeddings for articles without them
              </p>
            </div>
            <Tooltip content="Process up to 250 articles (5 batches of 50) to generate AI embeddings for semantic search">
              <button
                onClick={onGenerateEmbeddings}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Run Now
              </button>
            </Tooltip>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4 border-border">
            <div>
              <h3 className="font-medium text-foreground">
                Cleanup Old Articles
              </h3>
              <p className="text-sm text-foreground/70">
                Remove articles older than 90 days
              </p>
            </div>
            <Tooltip content="Delete articles older than 90 days to free up database space. Click twice to confirm.">
              <button
                onClick={onCleanup}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                Run Now
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}

// Storage Tab
function StorageTab({
  cacheStats,
  cacheStatus,
  onClearCache,
  onDatabaseReset,
}: {
  cacheStats: CacheStats | null;
  cacheStatus: CacheStatus | null;
  onClearCache: () => void;
  onDatabaseReset: () => void;
}) {
  const [postgresStats, setPostgresStats] = useState<any>(null);
  const [redisStats, setRedisStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPerformingMaintenance, setIsPerformingMaintenance] = useState(false);

  useEffect(() => {
    loadStorageStats();
    const interval = setInterval(loadStorageStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStorageStats = async () => {
    try {
      const [pgRes, redisRes] = await Promise.all([
        fetch("/api/admin/storage/postgres"),
        fetch("/api/admin/storage/redis"),
      ]);

      if (pgRes.ok) {
        const data = await pgRes.json();
        setPostgresStats(data.data?.stats || null);
      }

      if (redisRes.ok) {
        const data = await redisRes.json();
        setRedisStats(data.data?.stats || null);
      }
    } catch (error) {
      console.error("Failed to load storage stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostgresMaintenance = async (operation: string, table?: string) => {
    setIsPerformingMaintenance(true);
    try {
      const response = await fetch("/api/admin/storage/postgres/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation, table }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`${data.data.message} (${data.data.duration})`);
        loadStorageStats();
      } else {
        const error = await response.json();
        toast.error(`Maintenance failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Maintenance failed:", error);
      toast.error("Maintenance operation failed");
    } finally {
      setIsPerformingMaintenance(false);
    }
  };

  const [pendingFlush, setPendingFlush] = useState<string | null>(null);

  const handleRedisMaintenance = async (operation: string) => {
    // For destructive operations, require confirmation
    if (operation === "flushall" || operation === "flushdb") {
      if (pendingFlush !== operation) {
        setPendingFlush(operation);
        toast.warning(`${operation.toUpperCase()}?`, {
          description: `This will delete ${operation === "flushall" ? "ALL" : "current database"} data! Click again to confirm.`,
          duration: 5000,
        });
        setTimeout(() => setPendingFlush(null), 5000);
        return;
      }
      setPendingFlush(null);
    }

    setIsPerformingMaintenance(true);
    try {
      const response = await fetch("/api/admin/storage/redis/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`${data.data.message} (${data.data.duration})`);
        loadStorageStats();
      } else {
        const error = await response.json();
        toast.error(`Maintenance failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Maintenance failed:", error);
      toast.error("Maintenance operation failed");
    } finally {
      setIsPerformingMaintenance(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PostgreSQL Storage */}
      <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">PostgreSQL Storage</h2>
          <Tooltip content="Reload storage statistics from PostgreSQL and Redis">
            <button
              onClick={() => loadStorageStats()}
              className="rounded-lg border border-border px-3 py-1 text-sm hover:bg-muted"
            >
              Refresh
            </button>
          </Tooltip>
        </div>

        {postgresStats && (
          <>
            {/* Database Overview */}
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <div className="text-sm text-foreground/70">Database Size</div>
                <div className="text-2xl font-bold text-foreground">{postgresStats.databaseSize}</div>
              </div>
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <div className="text-sm text-foreground/70">Cache Hit Ratio</div>
                <div className="text-2xl font-bold text-foreground">
                  {(postgresStats.cacheHitRatio * 100).toFixed(1)}%
                </div>
              </div>
              <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                <div className="text-sm text-foreground/70">Active Connections</div>
                <div className="text-2xl font-bold text-foreground">
                  {postgresStats.connectionInfo.activeConnections}
                </div>
              </div>
              <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
                <div className="text-sm text-foreground/70">Total Connections</div>
                <div className="text-2xl font-bold text-foreground">
                  {postgresStats.connectionInfo.currentConnections} / {postgresStats.connectionInfo.maxConnections}
                </div>
              </div>
            </div>

            {/* Maintenance Actions */}
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-foreground">Maintenance Operations</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Tooltip content="Reclaim storage from deleted rows and prevent transaction ID wraparound">
                  <button
                    onClick={() => handlePostgresMaintenance("vacuum")}
                    disabled={isPerformingMaintenance}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    VACUUM
                  </button>
                </Tooltip>
                <Tooltip content="Update query planner statistics for better query performance">
                  <button
                    onClick={() => handlePostgresMaintenance("analyze")}
                    disabled={isPerformingMaintenance}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    ANALYZE
                  </button>
                </Tooltip>
                <Tooltip content="Combine VACUUM and ANALYZE in one operation (recommended for regular maintenance)">
                  <button
                    onClick={() => handlePostgresMaintenance("vacuum_analyze")}
                    disabled={isPerformingMaintenance}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    VACUUM ANALYZE
                  </button>
                </Tooltip>
                <Tooltip content="Rebuild all indexes to remove bloat and improve performance (can be slow)">
                  <button
                    onClick={() => handlePostgresMaintenance("reindex")}
                    disabled={isPerformingMaintenance}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    REINDEX
                  </button>
                </Tooltip>
              </div>
              <p className="mt-2 text-xs text-foreground/60">
                These operations help optimize database performance and reclaim storage space.
              </p>
            </div>

            {/* Table Sizes */}
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-foreground">Table Sizes</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 text-left text-foreground/70">Table</th>
                      <th className="pb-2 text-right text-foreground/70">Total Size</th>
                      <th className="pb-2 text-right text-foreground/70">Table Size</th>
                      <th className="pb-2 text-right text-foreground/70">Index Size</th>
                      <th className="pb-2 text-right text-foreground/70">Rows</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postgresStats.tables.slice(0, 10).map((table: any) => (
                      <tr key={table.tableName} className="border-b border-border">
                        <td className="py-2 text-foreground">{table.tableName}</td>
                        <td className="py-2 text-right font-mono text-foreground">{table.totalSize}</td>
                        <td className="py-2 text-right font-mono text-foreground/70">{table.tableSize}</td>
                        <td className="py-2 text-right font-mono text-foreground/70">{table.indexSize}</td>
                        <td className="py-2 text-right font-mono text-foreground/70">{table.rowCount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Redis Storage */}
      <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Redis Storage</h2>
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${redisStats?.connected ? "bg-green-500" : "bg-red-500"}`}></span>
            <span className="text-sm text-foreground/70">
              {redisStats?.connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {redisStats?.connected ? (
          <>
            {/* Redis Overview */}
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <div className="text-sm text-foreground/70">Memory Used</div>
                <div className="text-2xl font-bold text-foreground">{redisStats.memory.usedMemoryHuman}</div>
              </div>
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <div className="text-sm text-foreground/70">Hit Rate</div>
                <div className="text-2xl font-bold text-foreground">
                  {(redisStats.stats.hitRate * 100).toFixed(1)}%
                </div>
              </div>
              <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                <div className="text-sm text-foreground/70">Total Keys</div>
                <div className="text-2xl font-bold text-foreground">
                  {redisStats.keyspace.reduce((sum: number, db: any) => sum + db.keys, 0).toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
                <div className="text-sm text-foreground/70">Connected Clients</div>
                <div className="text-2xl font-bold text-foreground">
                  {redisStats.clients.connectedClients}
                </div>
              </div>
            </div>

            {/* Maintenance Actions */}
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-foreground">Maintenance Operations</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                <Tooltip content="Synchronously save dataset to disk (blocks all clients until complete)">
                  <button
                    onClick={() => handleRedisMaintenance("save")}
                    disabled={isPerformingMaintenance}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    SAVE
                  </button>
                </Tooltip>
                <Tooltip content="Save dataset to disk in the background (non-blocking, recommended)">
                  <button
                    onClick={() => handleRedisMaintenance("bgsave")}
                    disabled={isPerformingMaintenance}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    BGSAVE
                  </button>
                </Tooltip>
                <Tooltip content="Rewrite and optimize the Append-Only File to reduce its size">
                  <button
                    onClick={() => handleRedisMaintenance("bgrewriteaof")}
                    disabled={isPerformingMaintenance}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    BGREWRITEAOF
                  </button>
                </Tooltip>
                <Tooltip content="Delete all keys in the current database (DESTRUCTIVE - click twice to confirm)">
                  <button
                    onClick={() => handleRedisMaintenance("flushdb")}
                    disabled={isPerformingMaintenance}
                    className="w-full rounded-lg border border-red-300 bg-background px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    FLUSHDB
                  </button>
                </Tooltip>
                <Tooltip content="Delete ALL keys in ALL databases (VERY DESTRUCTIVE - click twice to confirm)">
                  <button
                    onClick={() => handleRedisMaintenance("flushall")}
                    disabled={isPerformingMaintenance}
                    className="w-full rounded-lg border border-red-300 bg-background px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    FLUSHALL
                  </button>
                </Tooltip>
              </div>
              <p className="mt-2 text-xs text-foreground/60">
                SAVE: Synchronous save. BGSAVE: Background save. BGREWRITEAOF: Rewrite AOF file. FLUSHDB/FLUSHALL: Delete data (dangerous).
              </p>
            </div>

            {/* Redis Stats */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-3 text-lg font-semibold text-foreground">Memory Stats</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-foreground/70">Used Memory Peak</dt>
                    <dd className="font-mono text-foreground">{redisStats.memory.usedMemoryPeakHuman}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/70">Fragmentation Ratio</dt>
                    <dd className="font-mono text-foreground">{redisStats.memory.memoryFragmentationRatio.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/70">Evicted Keys</dt>
                    <dd className="font-mono text-foreground">{redisStats.stats.evictedKeys.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/70">Expired Keys</dt>
                    <dd className="font-mono text-foreground">{redisStats.stats.expiredKeys.toLocaleString()}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="mb-3 text-lg font-semibold text-foreground">Operations Stats</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-foreground/70">Total Commands</dt>
                    <dd className="font-mono text-foreground">{redisStats.stats.totalCommandsProcessed.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/70">Ops/Sec</dt>
                    <dd className="font-mono text-foreground">{redisStats.stats.instantaneousOpsPerSec.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/70">Keyspace Hits</dt>
                    <dd className="font-mono text-foreground">{redisStats.stats.keyspaceHits.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground/70">Keyspace Misses</dt>
                    <dd className="font-mono text-foreground">{redisStats.stats.keyspaceMisses.toLocaleString()}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-foreground/70">
            {redisStats?.enabled ? "Redis is not connected" : "Redis is disabled"}
          </div>
        )}
      </div>

      {/* Cache Management (Application-level) */}
      {cacheStats && (
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Application Cache</h2>
            <Tooltip content="Clear all application-level cache (Redis will be flushed). Click twice to confirm.">
              <button
                onClick={onClearCache}
                className="rounded-lg border border-red-300 bg-background px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Clear Cache
              </button>
            </Tooltip>
          </div>

          <p className="mb-4 text-sm text-foreground/70">
            Application-level cache statistics tracked by the cache service layer.
          </p>

          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <div className="text-sm text-foreground/70">Hits</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {cacheStats.hits.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <div className="text-sm text-foreground/70">Misses</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {cacheStats.misses.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="text-sm text-foreground/70">Hit Rate</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {(cacheStats.hitRate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
              <div className="text-sm text-foreground/70">Sets</div>
              <div className="text-2xl font-bold text-foreground">
                {cacheStats.sets.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
              <div className="text-sm text-foreground/70">Errors</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {cacheStats.errors.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-foreground/70">
              <span>Cache Efficiency</span>
              <span>{(cacheStats.hitRate * 100).toFixed(1)}%</span>
            </div>
            <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                style={{ width: `${cacheStats.hitRate * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Database Reset (Danger Zone) */}
      <div className="rounded-lg border-2 border-red-300 bg-background p-6 shadow-sm dark:border-red-700">
        <div className="mb-4 flex items-start gap-3">
          <svg
            className="h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-200">
              Danger Zone: Database Reset
            </h2>
            <p className="mt-2 text-sm text-red-800 dark:text-red-300">
              This operation will permanently delete all feeds, articles, categories, embeddings, and related data.
              User accounts and preferences will be preserved.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm text-foreground/70">
          <p className="font-medium">What will be deleted:</p>
          <ul className="ml-4 space-y-1">
            <li>• All feeds and their articles</li>
            <li>• All categories (global and user-specific)</li>
            <li>• All embeddings and AI-generated content</li>
            <li>• All user feed subscriptions</li>
            <li>• All read article tracking</li>
            <li>• All article feedback and learned patterns</li>
          </ul>
          <p className="font-medium text-green-600 dark:text-green-400 mt-3">
            ✓ User accounts and preferences will be preserved
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <Tooltip content="DANGER: Permanently delete all feeds, articles, categories, and embeddings. User accounts will be preserved. Click twice within 10 seconds to confirm.">
            <button
              onClick={onDatabaseReset}
              className="rounded-lg border-2 border-red-600 bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 hover:border-red-700 dark:border-red-500 dark:bg-red-500 dark:hover:bg-red-600 dark:hover:border-red-600"
            >
              Reset Database
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

// Configuration Tab
function ConfigurationTab() {
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch("/api/admin/config");
      if (response.ok) {
        const data = await response.json();
        setConfig(data.data);
      } else {
        toast.error("Failed to load configuration");
      }
    } catch (error) {
      console.error("Failed to load configuration:", error);
      toast.error("Failed to load configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set([
      "auth", "embeddings", "llm", "cache", "extraction", 
      "cron", "nextjs", "tailwind", "typescript", "envvars"
    ]));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="rounded-lg border border-border bg-background p-6 text-center">
        <p className="text-foreground/70">Failed to load configuration</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Environment Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm dark:from-blue-950/30 dark:to-blue-900/20">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Environment</p>
            <div className="rounded-lg bg-blue-600/10 p-2 dark:bg-blue-400/10">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {config.overview.environment}
          </p>
          <p className="mt-2 text-sm text-blue-700 dark:text-blue-400">
            {config.overview.totalEnvVars} env variables
          </p>
        </div>

        {/* Server Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-green-50 to-green-100 p-6 shadow-sm dark:from-green-950/30 dark:to-green-900/20">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">Server</p>
            <div className="rounded-lg bg-green-600/10 p-2 dark:bg-green-400/10">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100">
            Node {config.server.nodeVersion}
          </p>
          <p className="mt-2 text-sm text-green-700 dark:text-green-400">
            Next.js {config.server.nextVersion}
          </p>
        </div>

        {/* Database Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-sm dark:from-purple-950/30 dark:to-purple-900/20">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Database</p>
            <div className="rounded-lg bg-purple-600/10 p-2 dark:bg-purple-400/10">
              <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
            {config.database.type}
          </p>
          <p className="mt-2 text-sm text-purple-700 dark:text-purple-400">
            Prisma {config.database.prismaVersion}
          </p>
        </div>

        {/* Features Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-orange-50 to-orange-100 p-6 shadow-sm dark:from-orange-950/30 dark:to-orange-900/20">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Features</p>
            <div className="rounded-lg bg-orange-600/10 p-2 dark:bg-orange-400/10">
              <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
            {config.overview.enabledFeatures}
          </p>
          <p className="mt-2 text-sm text-orange-700 dark:text-orange-400">
            enabled features
          </p>
        </div>
      </div>

      {/* Enabled Features Summary */}
      {config.overview.enabledFeaturesList && config.overview.enabledFeaturesList.length > 0 && (
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Enabled Features</h3>
          <div className="flex flex-wrap gap-2">
            {config.overview.enabledFeaturesList.map((feature: string) => (
              <span
                key={feature}
                className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expand/Collapse All Button */}
      <div className="flex justify-end">
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Expandable Configuration Sections */}
      <div className="space-y-4">
        {/* Authentication Configuration */}
        <div className="rounded-lg border border-border bg-background shadow-sm">
          <button
            onClick={() => toggleSection("auth")}
            className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-lg font-semibold text-foreground">Authentication Configuration</h3>
            </div>
            <svg
              className={`h-5 w-5 text-foreground/70 transition-transform ${expandedSections.has("auth") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has("auth") && (
            <div className="border-t border-border p-6">
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-foreground/70">NextAuth URL</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.authentication.nextAuthUrl}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">NextAuth Secret</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.authentication.nextAuthSecret}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Trust Host</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.authentication.authTrustHost ? "Enabled" : "Disabled"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Configured Providers</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.authentication.providers.join(", ") || "None"}</dd>
                </div>
              </dl>
              
              <div className="mt-6">
                <h4 className="mb-3 text-sm font-semibold text-foreground">OAuth Providers</h4>
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-muted/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Google</span>
                      <span className={`text-xs ${config.authentication.google.configured ? "text-green-600 dark:text-green-400" : "text-foreground/60"}`}>
                        {config.authentication.google.configured ? "✓ Configured" : "Not configured"}
                      </span>
                    </div>
                    {config.authentication.google.configured && (
                      <p className="mt-1 text-xs text-foreground/60">Client ID: {config.authentication.google.clientId}</p>
                    )}
                  </div>
                  
                  <div className="rounded-lg border border-border bg-muted/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">GitHub</span>
                      <span className={`text-xs ${config.authentication.github.configured ? "text-green-600 dark:text-green-400" : "text-foreground/60"}`}>
                        {config.authentication.github.configured ? "✓ Configured" : "Not configured"}
                      </span>
                    </div>
                    {config.authentication.github.configured && (
                      <p className="mt-1 text-xs text-foreground/60">Client ID: {config.authentication.github.clientId}</p>
                    )}
                  </div>
                  
                  <div className="rounded-lg border border-border bg-muted/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{config.authentication.oauth.providerName}</span>
                      <span className={`text-xs ${config.authentication.oauth.configured ? "text-green-600 dark:text-green-400" : "text-foreground/60"}`}>
                        {config.authentication.oauth.configured ? "✓ Configured" : "Not configured"}
                      </span>
                    </div>
                    {config.authentication.oauth.configured && (
                      <>
                        <p className="mt-1 text-xs text-foreground/60">Client ID: {config.authentication.oauth.clientId}</p>
                        <p className="text-xs text-foreground/60">Issuer: {config.authentication.oauth.issuer}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Embedding & AI Configuration */}
        <div className="rounded-lg border border-border bg-background shadow-sm">
          <button
            onClick={() => toggleSection("embeddings")}
            className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <h3 className="text-lg font-semibold text-foreground">Embedding & AI Configuration</h3>
            </div>
            <svg
              className={`h-5 w-5 text-foreground/70 transition-transform ${expandedSections.has("embeddings") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has("embeddings") && (
            <div className="border-t border-border p-6">
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Provider</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{config.embeddings.provider}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Model</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.embeddings.model}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Batch Size</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.embeddings.batchSize}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Auto Generate</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.embeddings.autoGenerate ? "Enabled" : "Disabled"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">OpenAI API Key</dt>
                  <dd className="mt-1 font-mono text-xs text-foreground/60">{config.embeddings.openaiApiKey}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">OpenAI Base URL</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.embeddings.openaiBaseUrl}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* LLM Configuration */}
        <div className="rounded-lg border border-border bg-background shadow-sm">
          <button
            onClick={() => toggleSection("llm")}
            className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-lg font-semibold text-foreground">LLM Configuration</h3>
            </div>
            <svg
              className={`h-5 w-5 text-foreground/70 transition-transform ${expandedSections.has("llm") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has("llm") && (
            <div className="border-t border-border p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-foreground/70">
                  Configure system-level LLM settings (API keys, models, endpoints)
                </p>
                <Link
                  href="/admin/llm-config"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Configure LLM Settings
                </Link>
              </div>
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Provider</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{config.llm.provider}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Model</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.llm.model}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Ollama Base URL</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.llm.ollamaBaseUrl}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">OpenAI API Key</dt>
                  <dd className="mt-1 font-mono text-xs text-foreground/60">{config.llm.openaiApiKey}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Cache & Storage */}
        <div className="rounded-lg border border-border bg-background shadow-sm">
          <button
            onClick={() => toggleSection("cache")}
            className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              <h3 className="text-lg font-semibold text-foreground">Cache & Storage</h3>
            </div>
            <svg
              className={`h-5 w-5 text-foreground/70 transition-transform ${expandedSections.has("cache") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has("cache") && (
            <div className="border-t border-border p-6">
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Cache Enabled</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.cache.enabled ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Redis URL</dt>
                  <dd className="mt-1 font-mono text-xs text-foreground/60">{config.cache.redisUrl}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Redis Password</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.cache.redisPassword}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Content Extraction */}
        <div className="rounded-lg border border-border bg-background shadow-sm">
          <button
            onClick={() => toggleSection("extraction")}
            className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-foreground">Content Extraction</h3>
            </div>
            <svg
              className={`h-5 w-5 text-foreground/70 transition-transform ${expandedSections.has("extraction") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has("extraction") && (
            <div className="border-t border-border p-6">
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Playwright Enabled</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.contentExtraction.playwrightEnabled ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Extraction Timeout</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.contentExtraction.extractionTimeout}ms</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Encryption</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.contentExtraction.encryptionConfigured ? "Configured" : "Not configured"}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Cron Jobs */}
        <div className="rounded-lg border border-border bg-background shadow-sm">
          <button
            onClick={() => toggleSection("cron")}
            className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-foreground">Cron Jobs</h3>
            </div>
            <svg
              className={`h-5 w-5 text-foreground/70 transition-transform ${expandedSections.has("cron") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has("cron") && (
            <div className="border-t border-border p-6">
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Cron Jobs Enabled</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.cronJobs.enabled ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Feed Refresh Schedule</dt>
                  <dd className="mt-1 font-mono text-sm text-foreground">{config.cronJobs.feedRefreshSchedule}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Cleanup Schedule</dt>
                  <dd className="mt-1 font-mono text-sm text-foreground">{config.cronJobs.cleanupSchedule}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Next.js Configuration */}
        <div className="rounded-lg border border-border bg-background shadow-sm">
          <button
            onClick={() => toggleSection("nextjs")}
            className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <h3 className="text-lg font-semibold text-foreground">Next.js Configuration</h3>
            </div>
            <svg
              className={`h-5 w-5 text-foreground/70 transition-transform ${expandedSections.has("nextjs") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has("nextjs") && (
            <div className="border-t border-border p-6">
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Output Mode</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.nextjs.output}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Server Actions Body Size Limit</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.nextjs.serverActions.bodySizeLimit}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Next.js Version</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.server.nextVersion}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">React Version</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.server.reactVersion}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Tailwind Configuration */}
        <div className="rounded-lg border border-border bg-background shadow-sm">
          <button
            onClick={() => toggleSection("tailwind")}
            className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <h3 className="text-lg font-semibold text-foreground">Tailwind Configuration</h3>
            </div>
            <svg
              className={`h-5 w-5 text-foreground/70 transition-transform ${expandedSections.has("tailwind") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has("tailwind") && (
            <div className="border-t border-border p-6">
              <div className="mb-4">
                <dt className="text-sm font-medium text-foreground/70 mb-2">Available Themes ({config.tailwind.themesCount})</dt>
                <dd className="flex flex-wrap gap-2">
                  {config.tailwind.themes.map((theme: string) => (
                    <span key={theme} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {theme}
                    </span>
                  ))}
                </dd>
              </div>
            </div>
          )}
        </div>

        {/* Environment Variables */}
        <div className="rounded-lg border border-border bg-background shadow-sm">
          <button
            onClick={() => toggleSection("envvars")}
            className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <h3 className="text-lg font-semibold text-foreground">Environment Variables</h3>
            </div>
            <svg
              className={`h-5 w-5 text-foreground/70 transition-transform ${expandedSections.has("envvars") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has("envvars") && (
            <div className="border-t border-border p-6">
              {config.environmentVariables && (
                <div className="space-y-6">
                  {/* System Variables */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">System</h4>
                    <dl className="grid gap-3 md:grid-cols-2">
                      {Object.entries(config.environmentVariables.system).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-muted/50 p-3">
                          <dt className="text-xs font-medium text-foreground/70">{key}</dt>
                          <dd className="mt-1 font-mono text-xs text-foreground">{value as string}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* Authentication Variables */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Authentication</h4>
                    <dl className="grid gap-3 md:grid-cols-2">
                      {Object.entries(config.environmentVariables.authentication).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-muted/50 p-3">
                          <dt className="text-xs font-medium text-foreground/70">{key}</dt>
                          <dd className="mt-1 font-mono text-xs text-foreground">{value as string}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* Embeddings Variables */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Embeddings</h4>
                    <dl className="grid gap-3 md:grid-cols-2">
                      {Object.entries(config.environmentVariables.embeddings).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-muted/50 p-3">
                          <dt className="text-xs font-medium text-foreground/70">{key}</dt>
                          <dd className="mt-1 font-mono text-xs text-foreground">{value as string}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* LLM Variables */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">LLM</h4>
                    <dl className="grid gap-3 md:grid-cols-2">
                      {Object.entries(config.environmentVariables.llm).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-muted/50 p-3">
                          <dt className="text-xs font-medium text-foreground/70">{key}</dt>
                          <dd className="mt-1 font-mono text-xs text-foreground">{value as string}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* Cache Variables */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Cache</h4>
                    <dl className="grid gap-3 md:grid-cols-2">
                      {Object.entries(config.environmentVariables.cache).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-muted/50 p-3">
                          <dt className="text-xs font-medium text-foreground/70">{key}</dt>
                          <dd className="mt-1 font-mono text-xs text-foreground">{value as string}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* Extraction Variables */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Content Extraction</h4>
                    <dl className="grid gap-3 md:grid-cols-2">
                      {Object.entries(config.environmentVariables.extraction).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-muted/50 p-3">
                          <dt className="text-xs font-medium text-foreground/70">{key}</dt>
                          <dd className="mt-1 font-mono text-xs text-foreground">{value as string}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* Cron Variables */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Cron Jobs</h4>
                    <dl className="grid gap-3 md:grid-cols-2">
                      {Object.entries(config.environmentVariables.cron).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-muted/50 p-3">
                          <dt className="text-xs font-medium text-foreground/70">{key}</dt>
                          <dd className="mt-1 font-mono text-xs text-foreground">{value as string}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TypeScript Configuration */}
        <div className="rounded-lg border border-border bg-background shadow-sm">
          <button
            onClick={() => toggleSection("typescript")}
            className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <h3 className="text-lg font-semibold text-foreground">TypeScript Configuration</h3>
            </div>
            <svg
              className={`h-5 w-5 text-foreground/70 transition-transform ${expandedSections.has("typescript") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has("typescript") && (
            <div className="border-t border-border p-6">
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Target</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.typescript.target}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Module</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.typescript.module}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">Strict Mode</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.typescript.strict ? "Enabled" : "Disabled"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-foreground/70">TypeScript Version</dt>
                  <dd className="mt-1 text-sm text-foreground">{config.server.typeScriptVersion}</dd>
                </div>
              </dl>
              <div className="mt-4">
                <dt className="text-sm font-medium text-foreground/70 mb-2">Path Aliases</dt>
                <dd className="rounded-lg bg-muted/50 p-3">
                  <pre className="text-xs text-foreground/80">{JSON.stringify(config.typescript.paths, null, 2)}</pre>
                </dd>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Database Tab
function DatabaseTab({
  onDatabaseReset,
}: {
  onDatabaseReset: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-background p-6 shadow-sm border-border bg-background">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Database Management
        </h2>
        <p className="mb-6 text-sm text-foreground/70">
          Dangerous operations that affect the entire database
        </p>

        <div className="space-y-4">
          {/* Warning Banner */}
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <svg
                className="h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-200">
                  Danger Zone
                </h3>
                <p className="mt-1 text-sm text-red-800 dark:text-red-300">
                  These operations are irreversible and will permanently delete data.
                  Use with extreme caution.
                </p>
              </div>
            </div>
          </div>

          {/* Database Reset */}
          <div className="rounded-lg border-2 border-red-200 bg-background p-4 dark:border-red-800">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-foreground">
                  Reset Database
                </h3>
                <p className="mt-1 text-sm text-foreground/70">
                  Permanently delete all feeds, articles, categories, embeddings, and related data.
                </p>
                <div className="mt-3 space-y-1 text-sm text-foreground/60">
                  <p>• All feeds and their articles will be deleted</p>
                  <p>• All categories (global and user-specific) will be removed</p>
                  <p>• All embeddings will be cleared</p>
                  <p>• All user feed subscriptions will be removed</p>
                  <p>• All read article tracking will be cleared</p>
                  <p>• All article feedback and learned patterns will be deleted</p>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    ✓ User accounts and preferences will be preserved
                  </p>
                </div>
              </div>
              <button
                onClick={onDatabaseReset}
                className="flex-shrink-0 rounded-lg border-2 border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 hover:border-red-700 dark:border-red-500 dark:bg-red-500 dark:hover:bg-red-600 dark:hover:border-red-600"
              >
                Reset Database
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Information Panel */}
      <div className="rounded-lg border border-border bg-background p-6 shadow-sm border-border bg-background">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          What Gets Deleted?
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-foreground mb-2">Content Data</h3>
            <ul className="space-y-1 text-sm text-foreground/70">
              <li>• Feeds table - All RSS/Atom feed sources</li>
              <li>• Articles table - All article content and metadata</li>
              <li>• Categories table - Global category definitions</li>
              <li>• Feed Categories table - Feed-to-category mappings</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-2">User Data</h3>
            <ul className="space-y-1 text-sm text-foreground/70">
              <li>• User Feeds table - User feed subscriptions</li>
              <li>• User Categories table - User-specific categories</li>
              <li>• User Feed Categories table - User feed organization</li>
              <li>• Read Articles table - Article read tracking</li>
              <li>• Article Feedback table - User feedback on articles</li>
              <li>• User Patterns table - Learned user preferences</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-2">AI Data</h3>
            <ul className="space-y-1 text-sm text-foreground/70">
              <li>• Embeddings - Vector embeddings stored in articles</li>
              <li>• Summaries - LLM-generated article summaries</li>
              <li>• Key Points - Extracted article highlights</li>
              <li>• Topics - Detected article topics/tags</li>
            </ul>
          </div>
          <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
            <h3 className="font-medium text-green-900 dark:text-green-200 mb-2">
              What Is Preserved?
            </h3>
            <ul className="space-y-1 text-sm text-green-800 dark:text-green-300">
              <li>• User accounts (authentication data)</li>
              <li>• User preferences (UI settings, theme, etc.)</li>
              <li>• Admin settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// LLM Configuration Tab
function LLMConfigTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
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

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/llm/config");
      
      if (response.ok) {
        const data = await response.json();
        const config = data.data.config;
        
        setProvider(config.provider || "openai");
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
    } catch (error) {
      console.error("Failed to load LLM config:", error);
      toast.error("Failed to load LLM configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/admin/llm/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKey || null,
          baseUrl: baseUrl || null,
          summaryModel: summaryModel || null,
          embeddingModel: embeddingModel || null,
          digestModel: digestModel || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      setSaveMessage({ type: "success", text: "Configuration saved successfully" });
      toast.success("LLM configuration saved");
      
      // Reload to get masked key
      await loadConfig();
      
      // Clear API key input
      setApiKey("");

      // Clear success message after 5 seconds
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error) {
      console.error("Failed to save LLM config:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save configuration";
      setSaveMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/admin/llm/config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKey || null,
          baseUrl: baseUrl || null,
          summaryModel: summaryModel || null,
          embeddingModel: embeddingModel || null,
          digestModel: digestModel || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
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
    } finally {
      setIsTesting(false);
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
              disabled={isTesting || isSaving}
              className="rounded-lg border border-blue-600 bg-transparent px-6 py-2 font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-blue-900/20"
            >
              {isTesting ? "Testing..." : "Test Configuration"}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isTesting}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isSaving ? "Saving..." : "Save Configuration"}
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
