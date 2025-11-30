"use client";

import { useState } from "react";
import { Card, CardBody } from "@/app/components/ui";
import type { PostgresStats, RedisStats } from "@/hooks/queries/use-admin";

export interface StorageTabProps {
  /** PostgreSQL statistics */
  postgres: PostgresStats | undefined;
  /** Redis statistics */
  redis: RedisStats | undefined;
  /** Handler for clearing cache */
  onClearCache: () => void;
  /** Handler for database reset */
  onDatabaseReset: () => void;
  /** Whether database reset is in pending confirmation state */
  pendingDatabaseReset?: boolean;
}

/**
 * StorageTab component for monitoring PostgreSQL and Redis storage.
 * Displays database statistics, cache information, and provides dangerous actions.
 *
 * @example
 * ```tsx
 * <StorageTab
 *   postgres={postgresStats}
 *   redis={redisStats}
 *   onClearCache={handleClearCache}
 *   onDatabaseReset={handleDatabaseReset}
 *   pendingDatabaseReset={pending}
 * />
 * ```
 */
export function StorageTab({
  postgres,
  redis,
  onClearCache,
  onDatabaseReset,
  pendingDatabaseReset = false,
}: StorageTabProps) {
  // State for expanding tables list
  const [showAllTables, setShowAllTables] = useState(false);

  return (
    <div className="space-y-8">
      {/* PostgreSQL & Redis Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* PostgreSQL Database */}
        <Card className="bg-background shadow-sm">
          <CardBody>
            <h3 className="text-lg font-medium text-foreground mb-4">PostgreSQL Database</h3>
            <div className="space-y-4">
              <div className="flex justify-between p-3 rounded bg-muted/50">
                <span className="text-foreground/70">Total Size</span>
                <span className="font-medium font-mono">{postgres?.databaseSize || "Unknown"}</span>
              </div>
              <div className="flex justify-between p-3 rounded bg-muted/50">
                <span className="text-foreground/70">Active Connections</span>
                <span className="font-medium font-mono">
                  {postgres?.connectionInfo.activeConnections || 0} /{" "}
                  {postgres?.connectionInfo.maxConnections || "?"}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded bg-muted/50">
                <span className="text-foreground/70">Cache Hit Ratio</span>
                <span className="font-medium font-mono">
                  {(Number(postgres?.cacheHitRatio) || 0).toFixed(2)}%
                </span>
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
                    {(showAllTables ? postgres?.tables : postgres?.tables.slice(0, 5))?.map((table) => (
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
          </CardBody>
        </Card>

        {/* Redis Cache */}
        <Card className="bg-background shadow-sm">
          <CardBody>
            <h3 className="text-lg font-medium text-foreground mb-4">Redis Cache</h3>
            <div className="space-y-4">
              <div className="flex justify-between p-3 rounded bg-muted/50">
                <span className="text-foreground/70">Status</span>
                <span
                  className={`font-medium ${redis?.connected ? "text-green-600" : "text-red-600"}`}
                >
                  {redis?.connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded bg-muted/50">
                <span className="text-foreground/70">Memory Used</span>
                <span className="font-medium font-mono">
                  {redis?.memory.usedMemoryHuman || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded bg-muted/50">
                <span className="text-foreground/70">Peak Memory</span>
                <span className="font-medium font-mono">
                  {redis?.memory.usedMemoryPeakHuman || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded bg-muted/50">
                <span className="text-foreground/70">Hit Rate</span>
                <span className="font-medium font-mono">
                  {redis?.stats.hitRate ? (redis.stats.hitRate * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-foreground mb-2">Keyspace</h4>
              <div className="space-y-2">
                {redis?.keyspace.map((db) => (
                  <div
                    key={db.dbIndex}
                    className="flex justify-between text-xs p-2 bg-muted/30 rounded"
                  >
                    <span>DB {db.dbIndex}</span>
                    <span className="font-mono">{db.keys} keys</span>
                  </div>
                ))}
                {(!redis?.keyspace || redis.keyspace.length === 0) && (
                  <p className="text-xs text-foreground/50">No keys found</p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-900/10">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          {/* Clear Cache */}
          <div className="flex items-center justify-between p-4 bg-background rounded border border-red-100 dark:border-red-900/30">
            <div>
              <h4 className="font-medium text-foreground">Clear Cache</h4>
              <p className="text-sm text-foreground/60">
                Remove all cached data from Redis. This may temporarily impact performance.
              </p>
            </div>
            <button
              onClick={onClearCache}
              className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
            >
              Clear Cache
            </button>
          </div>

          {/* Reset Database */}
          <div className="flex items-center justify-between p-4 bg-background rounded border border-red-100 dark:border-red-900/30">
            <div>
              <h4 className="font-medium text-red-600 dark:text-red-400">Reset Database</h4>
              <p className="text-sm text-foreground/60">
                Permanently delete all feeds, articles, and embeddings. User accounts are preserved.
              </p>
            </div>
            <button
              onClick={onDatabaseReset}
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
