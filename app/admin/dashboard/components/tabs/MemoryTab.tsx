"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@/app/components/ui";
import { MetricCard } from "../shared/MetricCard";
import { ConfirmButton } from "../shared/ConfirmButton";
import { toast } from "sonner";

export interface MemoryTabProps {
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
}

interface MemoryData {
  current: {
    rss: string;
    rssMB: string;
    heapTotal: string;
    heapTotalMB: string;
    heapUsed: string;
    heapUsedMB: string;
    heapUsedPercent: string;
    external: string;
    arrayBuffers: string;
    timestamp: number;
  };
  pressure: {
    level: "normal" | "moderate" | "high" | "critical";
    heapUsedPercent: number;
    rssUsedMB: number;
    recommendation: string;
  };
  history: {
    samples: Array<{
      timestamp: number;
      heapUsedMB: string;
      heapTotalMB: string;
      rssMB: string;
      heapUsedPercent: string;
    }>;
    maxSamples: number;
    startTime: number;
  };
  trend: {
    direction: "increasing" | "decreasing" | "stable";
    change: string;
  };
  uptime: number;
  uptimeFormatted: string;
  monitoring: {
    enabled: boolean;
  };
}

// Icons
const MemoryIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
    />
  </svg>
);

const ChartIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

/**
 * MemoryTab component displays real-time memory usage and monitoring.
 */
export function MemoryTab({ refreshInterval = 10000 }: MemoryTabProps) {
  const [memoryData, setMemoryData] = useState<MemoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isForceGCLoading, setIsForceGCLoading] = useState(false);

  // Fetch memory data
  const fetchMemoryData = async () => {
    try {
      const response = await fetch("/api/admin/memory");
      if (!response.ok) {
        throw new Error("Failed to fetch memory data");
      }
      const result = await response.json();
      setMemoryData(result.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching memory data:", error);
      toast.error("Failed to fetch memory data");
      setIsLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchMemoryData();
    const interval = setInterval(fetchMemoryData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Force garbage collection
  const handleForceGC = async () => {
    setIsForceGCLoading(true);
    try {
      const response = await fetch("/api/admin/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "force-gc" }),
      });

      const result = await response.json();

      if (response.ok && result.data?.success) {
        toast.success(
          `Garbage collection completed. Heap: ${result.data.heapUsedMB}MB (${result.data.heapUsedPercent}%)`
        );
        // Refresh data
        await fetchMemoryData();
      } else {
        toast.error(result.error || "Failed to force garbage collection");
      }
    } catch (error) {
      console.error("Error forcing GC:", error);
      toast.error("Failed to force garbage collection");
    } finally {
      setIsForceGCLoading(false);
    }
  };

  // Get pressure color
  const getPressureColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "moderate":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-green-600 bg-green-50 border-green-200";
    }
  };

  // Get trend icon
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "increasing":
        return "↗";
      case "decreasing":
        return "↘";
      default:
        return "→";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-2 text-lg">Loading memory data...</div>
          <div className="text-sm text-muted-foreground">
            Fetching real-time metrics
          </div>
        </div>
      </div>
    );
  }

  if (!memoryData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-2 text-lg">No memory data available</div>
          <div className="text-sm text-muted-foreground">
            Memory monitoring may be disabled
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Memory Pressure Alert */}
      {memoryData.pressure?.level && memoryData.pressure.level !== "normal" && (
        <Card
          className={`border-2 ${getPressureColor(memoryData.pressure.level)}`}
        >
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="mb-1 text-lg font-semibold uppercase">
                  {memoryData.pressure.level} Memory Pressure
                </h3>
                <p className="text-sm">{memoryData.pressure.recommendation}</p>
              </div>
              <div className="text-2xl font-bold">
                {memoryData.current?.heapUsedPercent || "0"}%
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Current Memory Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* RSS (Total Memory) */}
        <MetricCard
          title="RSS Memory"
          value={memoryData.current?.rssMB || "0"}
          subtitle="Resident Set Size"
          icon={<MemoryIcon />}
          iconColor="blue"
          footer={{
            label: "Formatted",
            value: memoryData.current?.rss || "0 B",
          }}
        />

        {/* Heap Used */}
        <MetricCard
          title="Heap Used"
          value={memoryData.current?.heapUsedMB || "0"}
          subtitle={`${memoryData.current?.heapUsedPercent || "0"}% of ${memoryData.current?.heapTotalMB || "0"}MB`}
          icon={<ChartIcon />}
          iconColor="purple"
          footer={{
            label: "Trend",
            value: `${getTrendIcon(memoryData.trend?.direction || "stable")} ${memoryData.trend?.change || "0"}%`,
          }}
        />

        {/* External Memory */}
        <MetricCard
          title="External"
          value={memoryData.current?.external || "0 B"}
          subtitle="C++ Objects & ArrayBuffers"
          icon={<MemoryIcon />}
          iconColor="green"
          footer={{
            label: "ArrayBuffers",
            value: memoryData.current?.arrayBuffers || "0 B",
          }}
        />
      </div>

      {/* Memory History Chart */}
      <Card>
        <CardBody>
          <h3 className="mb-4 text-lg font-semibold">
            Memory Usage History (Last {memoryData.history?.samples?.length || 0}{" "}
            samples)
          </h3>
          <div className="space-y-2">
            {(memoryData.history?.samples || [])
              .slice(-10)
              .reverse()
              .map((sample, index) => {
                const percent = parseFloat(sample.heapUsedPercent);
                const barColor =
                  percent >= 95
                    ? "bg-red-500"
                    : percent >= 85
                      ? "bg-orange-500"
                      : percent >= 70
                        ? "bg-yellow-500"
                        : "bg-green-500";

                return (
                  <div key={sample.timestamp} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-muted-foreground">
                      {new Date(sample.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="flex-1">
                      <div className="h-6 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full ${barColor} transition-all duration-300`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right text-sm font-medium">
                      {sample.heapUsedMB}MB ({sample.heapUsedPercent}%)
                    </div>
                  </div>
                );
              })}
          </div>
        </CardBody>
      </Card>

      {/* System Information */}
      <Card>
        <CardBody>
          <h3 className="mb-4 text-lg font-semibold">System Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Uptime</div>
              <div className="text-lg font-medium">
                {memoryData.uptimeFormatted || "0s"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Monitoring Status
              </div>
              <div className="text-lg font-medium">
                {memoryData.monitoring?.enabled ? (
                  <span className="text-green-600">Enabled</span>
                ) : (
                  <span className="text-red-600">Disabled</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Pressure Level
              </div>
              <div className="text-lg font-medium capitalize">
                {memoryData.pressure?.level || "unknown"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">History Samples</div>
              <div className="text-lg font-medium">
                {memoryData.history?.samples?.length || 0} /{" "}
                {memoryData.history?.maxSamples || 0}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <Card>
        <CardBody>
          <h3 className="mb-4 text-lg font-semibold">Memory Actions</h3>
          <div className="flex gap-4">
            <ConfirmButton
              onConfirm={handleForceGC}
              disabled={isForceGCLoading}
              variant="warning"
              confirmText="Force garbage collection?"
              warningDescription="This may cause a brief pause in processing."
            >
              Force Garbage Collection
            </ConfirmButton>
            <button
              onClick={fetchMemoryData}
              disabled={isLoading}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Refresh Data
            </button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Note: Garbage collection requires Node.js to be started with the
            --expose-gc flag.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
