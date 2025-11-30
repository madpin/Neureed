/**
 * Memory Monitoring API
 *
 * GET  /api/admin/memory - Get current memory stats and history
 * POST /api/admin/memory - Trigger memory management actions (GC, etc.)
 */

import { createHandler } from "@/lib/api-handler";
import { memoryMonitor, formatBytes, getMemoryUsagePercent } from "@/lib/memory-monitor";
import { prisma } from "@/lib/db";
import { z } from "zod";

/**
 * GET /api/admin/memory
 * Returns current memory statistics and history
 */
export const GET = createHandler(
  async ({ session }) => {
    // Check admin role
    const userRole = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { role: true },
    });

    if (userRole?.role !== "ADMIN") {
      return {
        error: "Forbidden: Admin access required",
        status: 403,
      };
    }

    const summary = memoryMonitor.getSummary();

    // Calculate trends
    const history = summary.history.stats;
    const trend = calculateTrend(history);

    // Format for client
    const formatted = {
      current: {
        rss: formatBytes(summary.current.rss),
        rssMB: (summary.current.rss / 1024 / 1024).toFixed(2),
        heapTotal: formatBytes(summary.current.heapTotal),
        heapTotalMB: (summary.current.heapTotal / 1024 / 1024).toFixed(2),
        heapUsed: formatBytes(summary.current.heapUsed),
        heapUsedMB: (summary.current.heapUsed / 1024 / 1024).toFixed(2),
        heapUsedPercent: getMemoryUsagePercent(summary.current).toFixed(2),
        external: formatBytes(summary.current.external),
        arrayBuffers: formatBytes(summary.current.arrayBuffers),
        timestamp: summary.current.timestamp,
      },
      pressure: summary.pressure,
      history: {
        samples: history.map((stat) => ({
          timestamp: stat.timestamp,
          heapUsedMB: (stat.heapUsed / 1024 / 1024).toFixed(2),
          heapTotalMB: (stat.heapTotal / 1024 / 1024).toFixed(2),
          rssMB: (stat.rss / 1024 / 1024).toFixed(2),
          heapUsedPercent: getMemoryUsagePercent(stat).toFixed(2),
        })),
        maxSamples: summary.history.maxSamples,
        startTime: summary.history.startTime,
      },
      trend,
      uptime: summary.uptime,
      uptimeFormatted: formatUptime(summary.uptime),
      monitoring: {
        enabled: memoryMonitor.isRunning(),
      },
    };

    return { data: formatted };
  },
  {
    requireAuth: true,
  }
);

/**
 * POST /api/admin/memory
 * Trigger memory management actions
 */
const actionSchema = z.object({
  action: z.enum(["force-gc", "start-monitor", "stop-monitor"]),
});

export const POST = createHandler(
  async ({ body, session }) => {
    // Check admin role
    const userRole = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { role: true },
    });

    if (userRole?.role !== "ADMIN") {
      return {
        error: "Forbidden: Admin access required",
        status: 403,
      };
    }

    const { action } = body;

    switch (action) {
      case "force-gc":
        const gcSuccess = memoryMonitor.forceGC();
        if (gcSuccess) {
          // Get memory stats after GC
          const afterGC = memoryMonitor.getCurrentStats();
          return {
            data: {
              success: true,
              message: "Garbage collection triggered",
              heapUsedMB: (afterGC.heapUsed / 1024 / 1024).toFixed(2),
              heapUsedPercent: getMemoryUsagePercent(afterGC).toFixed(2),
            },
          };
        } else {
          return {
            error: "Garbage collection not available (requires --expose-gc flag)",
            status: 500,
          };
        }

      case "start-monitor":
        if (memoryMonitor.isRunning()) {
          return {
            data: {
              success: false,
              message: "Memory monitor already running",
            },
          };
        }
        memoryMonitor.start();
        return {
          data: {
            success: true,
            message: "Memory monitor started",
          },
        };

      case "stop-monitor":
        if (!memoryMonitor.isRunning()) {
          return {
            data: {
              success: false,
              message: "Memory monitor not running",
            },
          };
        }
        memoryMonitor.stop();
        return {
          data: {
            success: true,
            message: "Memory monitor stopped",
          },
        };

      default:
        return {
          error: "Invalid action",
          status: 400,
        };
    }
  },
  {
    bodySchema: actionSchema,
    requireAuth: true,
  }
);

/**
 * Calculate memory usage trend
 */
function calculateTrend(history: Array<{ heapUsed: number; heapTotal: number; timestamp: number }>) {
  if (history.length < 2) {
    return { direction: "stable", change: 0 };
  }

  // Compare last 5 samples with previous 5 samples
  const recentCount = Math.min(5, Math.floor(history.length / 2));
  const recent = history.slice(-recentCount);
  const previous = history.slice(-recentCount * 2, -recentCount);

  if (previous.length === 0) {
    return { direction: "stable", change: 0 };
  }

  // Calculate percentage directly for partial memory stats
  const calcPercent = (s: { heapUsed: number; heapTotal: number }) => (s.heapUsed / s.heapTotal) * 100;

  const recentAvg = recent.reduce((sum, s) => sum + calcPercent(s), 0) / recent.length;
  const previousAvg = previous.reduce((sum, s) => sum + calcPercent(s), 0) / previous.length;

  const change = recentAvg - previousAvg;

  let direction: "increasing" | "decreasing" | "stable" = "stable";
  if (change > 2) {
    direction = "increasing";
  } else if (change < -2) {
    direction = "decreasing";
  }

  return {
    direction,
    change: change.toFixed(2),
  };
}

/**
 * Format uptime to human-readable string
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}
