import { Card, CardBody } from "@/app/components/ui";
import { MetricCard } from "../shared/MetricCard";
import type { AdminMetrics, CacheStats } from "@/hooks/queries/use-admin";

export interface OverviewTabProps {
  /** Admin metrics data */
  metrics: AdminMetrics | undefined;
  /** Cache statistics */
  cacheStats: CacheStats | undefined;
}

// Icons for metric cards
const UsersIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const FeedsIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"
    />
  </svg>
);

const ArticlesIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
    />
  </svg>
);

/**
 * OverviewTab component displays system metrics and status.
 * Shows user stats, feed stats, article stats, storage usage, and cache performance.
 *
 * @example
 * ```tsx
 * <OverviewTab
 *   metrics={metrics}
 *   cacheStats={cacheStats}
 * />
 * ```
 */
export function OverviewTab({ metrics, cacheStats }: OverviewTabProps) {
  return (
    <div className="grid gap-6">
      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Users Metric */}
        <MetricCard
          title="Users"
          value={metrics?.users?.total || 0}
          subtitle="Total Registered Users"
          icon={<UsersIcon />}
          iconColor="blue"
          footer={{
            label: "Active (30d)",
            value: metrics?.users?.active || 0,
          }}
        />

        {/* Feeds Metric */}
        <MetricCard
          title="Feeds"
          value={metrics?.feeds.total || 0}
          subtitle="Total Feeds"
          icon={<FeedsIcon />}
          iconColor="green"
          footer={{
            label: "With Errors",
            value: metrics?.feeds.errorCount || 0,
            valueClassName:
              (metrics?.feeds.errorCount || 0) > 0
                ? "text-red-500"
                : "text-foreground",
          }}
        />

        {/* Articles Metric */}
        <MetricCard
          title="Articles"
          value={metrics?.articles.total || 0}
          subtitle="Total Articles"
          icon={<ArticlesIcon />}
          iconColor="purple"
          footer={{
            label: "With Embeddings",
            value: metrics?.articles.withEmbeddings || 0,
          }}
        />
      </div>

      {/* Storage & System Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Storage Stats */}
        <Card className="bg-background shadow-sm">
          <CardBody>
            <h3 className="mb-4 text-lg font-medium text-foreground">Storage Usage</h3>
            <div className="space-y-4">
              {/* PostgreSQL Database */}
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-foreground/70">PostgreSQL Database</span>
                  <span className="font-medium font-mono">
                    {metrics?.storage.postgres.size || "Unknown"}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: "100%" }}></div>
                </div>
                <p className="mt-1 text-xs text-foreground/50">
                  {metrics?.storage.postgres.tables || 0} tables
                </p>
              </div>

              {/* Redis Cache */}
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-foreground/70">Redis Cache</span>
                  <span className="font-medium text-foreground">
                    {metrics?.storage.redis.memory || "Unknown"}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: "100%" }}></div>
                </div>
                <p className="mt-1 text-xs text-foreground/50">
                  {metrics?.storage.redis.keys || 0} keys
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Cache Performance */}
        <Card className="bg-background shadow-sm">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">Cache Performance</h3>
              <div
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  cacheStats
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {cacheStats ? "Connected" : "Disconnected"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded bg-muted p-3">
                <div className="text-2xl font-bold text-foreground">
                  {(cacheStats?.hitRate || 0).toFixed(1)}%
                </div>
                <div className="text-xs text-foreground/60">Hit Rate</div>
              </div>
              <div className="rounded bg-muted p-3">
                <div className="text-2xl font-bold text-foreground">
                  {cacheStats?.hits || 0}
                </div>
                <div className="text-xs text-foreground/60">Total Hits</div>
              </div>
              <div className="rounded bg-muted p-3">
                <div className="text-2xl font-bold text-foreground">
                  {cacheStats?.misses || 0}
                </div>
                <div className="text-xs text-foreground/60">Total Misses</div>
              </div>
              <div className="rounded bg-muted p-3">
                <div className="text-2xl font-bold text-foreground">
                  {cacheStats?.keys || 0}
                </div>
                <div className="text-xs text-foreground/60">Cached Keys</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
