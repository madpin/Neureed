"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type TabId = "overview" | "cache" | "embeddings" | "users" | "jobs";

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

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [embeddingStats, setEmbeddingStats] = useState<EmbeddingStats | null>(null);
  const [embeddingConfig, setEmbeddingConfig] = useState<EmbeddingConfig | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      id: "cache",
      label: "Cache",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
    },
    {
      id: "embeddings",
      label: "Embeddings",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
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
        setEmbeddingConfig(data.data?.config || null);
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
    if (!confirm("Are you sure you want to clear all cache?")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/cache/clear", {
        method: "POST",
      });

      if (response.ok) {
        alert("Cache cleared successfully!");
        loadMetrics();
      } else {
        alert("Failed to clear cache");
      }
    } catch (error) {
      console.error("Failed to clear cache:", error);
      alert("Failed to clear cache");
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
        alert(
          `Generated embeddings for ${data.data.processed} articles!\nFailed: ${data.data.failed}\nTokens used: ${data.data.totalTokens}`
        );
        loadMetrics();
      }
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Failed to generate embeddings");
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
        alert(
          `Refreshed ${stats.totalFeeds} feeds successfully!\n` +
          `Successful: ${stats.successful}\n` +
          `Failed: ${stats.failed}\n` +
          `New articles: ${stats.totalNewArticles}\n` +
          `Updated articles: ${stats.totalUpdatedArticles}`
        );
      }
    } catch (error) {
      console.error("Refresh failed:", error);
      alert("Failed to refresh feeds");
    }
  };

  const handleCleanup = async () => {
    if (!confirm("Are you sure you want to run cleanup? This will remove old articles.")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/cleanup", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Cleanup completed! Removed ${data.data.deletedCount} old articles.`);
      }
    } catch (error) {
      console.error("Cleanup failed:", error);
      alert("Failed to run cleanup");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              System management and monitoring
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            Back to Home
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Vertical Tab Navigation */}
            <div className="w-56 flex-shrink-0">
              <nav className="space-y-1 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
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

              {activeTab === "cache" && (
                <CacheTab
                  cacheStatus={cacheStatus}
                  cacheStats={cacheStats}
                  onClearCache={handleClearCache}
                />
              )}

              {activeTab === "embeddings" && (
                <EmbeddingsTab
                  embeddingStats={embeddingStats}
                  embeddingConfig={embeddingConfig}
                  onGenerateEmbeddings={handleGenerateEmbeddings}
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
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          System Status
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${cacheStatus?.connected ? "bg-green-500" : "bg-red-500"}`}></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cache</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {cacheStatus?.connected ? "Connected" : "Disconnected"}
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Embeddings</span>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {embeddingStats?.percentage.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Coverage</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Users</span>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {userStats?.totalUsers || 0}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {userStats?.activeUsers || 0} active
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Cache Performance
          </h3>
          {cacheStats && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Hit Rate</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {(cacheStats.hitRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Hits</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {cacheStats.hits.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Misses</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {cacheStats.misses.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Embedding Status
          </h3>
          {embeddingStats && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Articles</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {embeddingStats.total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">With Embeddings</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {embeddingStats.withEmbeddings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Without Embeddings</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {embeddingStats.withoutEmbeddings.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Cache Tab
function CacheTab({
  cacheStatus,
  cacheStats,
  onClearCache,
}: {
  cacheStatus: CacheStatus | null;
  cacheStats: CacheStats | null;
  onClearCache: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Cache Status
          </h2>
          <div className="flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${
                cacheStatus?.connected ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {cacheStatus?.connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {cacheStats && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Cache Statistics
            </h2>
            <button
              onClick={onClearCache}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Clear Cache
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hits</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {cacheStats.hits.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Misses</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {cacheStats.misses.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hit Rate</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {(cacheStats.hitRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sets</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {cacheStats.sets.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Errors</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {cacheStats.errors.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Cache Efficiency</span>
              <span>{(cacheStats.hitRate * 100).toFixed(1)}%</span>
            </div>
            <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                style={{ width: `${cacheStats.hitRate * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Embeddings Tab
function EmbeddingsTab({
  embeddingStats,
  embeddingConfig,
  onGenerateEmbeddings,
}: {
  embeddingStats: EmbeddingStats | null;
  embeddingConfig: EmbeddingConfig | null;
  onGenerateEmbeddings: () => void;
}) {
  return (
    <div className="space-y-6">
      {embeddingStats && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Embedding Statistics
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {embeddingStats.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Articles</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {embeddingStats.withEmbeddings}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">With Embeddings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {embeddingStats.withoutEmbeddings}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Without Embeddings</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Coverage</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {embeddingStats.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full bg-blue-600 transition-all dark:bg-blue-500"
                style={{ width: `${embeddingStats.percentage}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={onGenerateEmbeddings}
              disabled={embeddingStats.withoutEmbeddings === 0}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Generate Embeddings ({embeddingStats.withoutEmbeddings} remaining)
            </button>
          </div>
        </div>
      )}

      {embeddingConfig && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Current Configuration
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Provider</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">
                {embeddingConfig.provider}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Model</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">
                {embeddingConfig.model}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Batch Size</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">
                {embeddingConfig.batchSize}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Auto Generate</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">
                {embeddingConfig.autoGenerate ? "Enabled" : "Disabled"}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

// Users Tab
function UsersTab({ users, userStats }: { users: User[]; userStats: UserStats | null }) {
  return (
    <div className="space-y-6">
      {userStats && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            User Statistics
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {userStats.totalUsers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
            </div>
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {userStats.activeUsers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {userStats.usersWithFeedback}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">With Feedback</div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          User List
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                  User
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                  Feeds
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                  Articles Read
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                  Feedback
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                  Patterns
                </th>
                <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 dark:border-gray-800"
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
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {user.name || "Unknown"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-gray-900 dark:text-gray-100">
                    {user._count.userFeeds}
                  </td>
                  <td className="py-3 text-gray-900 dark:text-gray-100">
                    {user._count.readArticles}
                  </td>
                  <td className="py-3 text-gray-900 dark:text-gray-100">
                    {user._count.articleFeedback}
                  </td>
                  <td className="py-3 text-gray-900 dark:text-gray-100">
                    {user._count.userPatterns}
                  </td>
                  <td className="py-3 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
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
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Manual Job Execution
        </h2>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Manually trigger background jobs for maintenance and updates
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Refresh All Feeds
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fetch new articles from all subscribed feeds
              </p>
            </div>
            <button
              onClick={onRefreshFeeds}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Run Now
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Generate Embeddings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate vector embeddings for articles without them
              </p>
            </div>
            <button
              onClick={onGenerateEmbeddings}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Run Now
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Cleanup Old Articles
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remove articles older than 90 days
              </p>
            </div>
            <button
              onClick={onCleanup}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              Run Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
