"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatLocalizedDate } from "@/src/lib/date-utils";

type TabId = "overview" | "cache" | "embeddings" | "users" | "jobs" | "database";

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
    {
      id: "database",
      label: "Database",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
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

  const handleDatabaseReset = async () => {
    const confirmMessage = 
      "⚠️ WARNING: This will permanently delete ALL of the following:\n\n" +
      "• All feeds and their articles\n" +
      "• All categories (global and user-specific)\n" +
      "• All embeddings\n" +
      "• All user feed subscriptions\n" +
      "• All read article tracking\n" +
      "• All article feedback and patterns\n\n" +
      "User accounts and preferences will be preserved.\n\n" +
      "This action CANNOT be undone!\n\n" +
      "Type 'RESET' in the next prompt to confirm.";

    if (!confirm(confirmMessage)) {
      return;
    }

    const confirmation = prompt("Type 'RESET' to confirm database reset:");
    if (confirmation !== "RESET") {
      alert("Database reset cancelled. Confirmation text did not match.");
      return;
    }

    try {
      const response = await fetch("/api/admin/database/reset", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        const summary = data.data;
        alert(
          `Database reset completed successfully!\n\n` +
          `Deleted:\n` +
          `• ${summary.feeds} feeds\n` +
          `• ${summary.articles} articles (including embeddings)\n` +
          `• ${summary.categories} global categories\n` +
          `• ${summary.userCategories} user categories\n` +
          `• ${summary.userFeeds} user feed subscriptions\n` +
          `• ${summary.readArticles} read article records\n` +
          `• ${summary.articleFeedback} feedback entries\n` +
          `• ${summary.userPatterns} user patterns\n\n` +
          `Total records deleted: ${summary.totalDeleted}`
        );
        loadMetrics();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to reset database: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Database reset failed:", error);
      alert("Failed to reset database");
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
          <Link
            href="/"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
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

              {activeTab === "database" && (
                <DatabaseTab onDatabaseReset={handleDatabaseReset} />
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
      <div className="rounded-lg border border-border bg-background p-6 shadow-sm border-border bg-background">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          System Status
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${cacheStatus?.connected ? "bg-green-500" : "bg-red-500"}`}></div>
              <span className="text-sm font-medium text-foreground/70">Cache</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {cacheStatus?.connected ? "Connected" : "Disconnected"}
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <span className="text-sm font-medium text-foreground/70">Embeddings</span>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {embeddingStats?.percentage.toFixed(0)}%
            </p>
            <p className="text-xs text-foreground/70">Coverage</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
            <span className="text-sm font-medium text-foreground/70">Users</span>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {userStats?.totalUsers || 0}
            </p>
            <p className="text-xs text-foreground/70">
              {userStats?.activeUsers || 0} active
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm border-border bg-background">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Cache Performance
          </h3>
          {cacheStats && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-foreground/70">Hit Rate</span>
                <span className="font-semibold text-foreground">
                  {(cacheStats.hitRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-foreground/70">Total Hits</span>
                <span className="font-semibold text-foreground">
                  {cacheStats.hits.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-foreground/70">Total Misses</span>
                <span className="font-semibold text-foreground">
                  {cacheStats.misses.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-background p-6 shadow-sm border-border bg-background">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Embedding Status
          </h3>
          {embeddingStats && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-foreground/70">Total Articles</span>
                <span className="font-semibold text-foreground">
                  {embeddingStats.total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-foreground/70">With Embeddings</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {embeddingStats.withEmbeddings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-foreground/70">Without Embeddings</span>
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
      <div className="rounded-lg border border-border bg-background p-6 shadow-sm border-border bg-background">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            Cache Status
          </h2>
          <div className="flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${
                cacheStatus?.connected ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            <span className="text-sm text-foreground/70">
              {cacheStatus?.connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {cacheStats && (
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm border-border bg-background">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Cache Statistics
            </h2>
            <button
              onClick={onClearCache}
              className="rounded-lg border border-red-300 bg-background px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 bg-background dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Clear Cache
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
            <div>
              <p className="text-sm text-foreground/70">Hits</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {cacheStats.hits.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground/70">Misses</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {cacheStats.misses.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground/70">Hit Rate</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {(cacheStats.hitRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground/70">Sets</p>
              <p className="text-3xl font-bold text-foreground">
                {cacheStats.sets.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground/70">Errors</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {cacheStats.errors.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-foreground/70">
              <span>Cache Efficiency</span>
              <span>{(cacheStats.hitRate * 100).toFixed(1)}%</span>
            </div>
            <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-muted bg-background">
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

  useEffect(() => {
    if (embeddingConfig) {
      setAutoGenerate(embeddingConfig.autoGenerate);
    }
  }, [embeddingConfig]);

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
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm border-border bg-background">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Configuration
          </h2>
          
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
    </div>
  );
}

// Users Tab
function UsersTab({ users, userStats }: { users: User[]; userStats: UserStats | null }) {
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
                    {user._count.userFeeds}
                  </td>
                  <td className="py-3 text-foreground">
                    {user._count.readArticles}
                  </td>
                  <td className="py-3 text-foreground">
                    {user._count.articleFeedback}
                  </td>
                  <td className="py-3 text-foreground">
                    {user._count.userPatterns}
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
  return (
    <div className="space-y-6">
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
            <button
              onClick={onRefreshFeeds}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Run Now
            </button>
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
            <button
              onClick={onGenerateEmbeddings}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Run Now
            </button>
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
