/**
 * Memory Monitor
 *
 * Real-time memory monitoring with pressure detection and automatic throttling.
 * Emits events when memory thresholds are crossed.
 */

import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';
import { env } from '@/env';

export interface MemoryStats {
  rss: number; // Resident Set Size (total memory)
  heapTotal: number; // Total heap allocated
  heapUsed: number; // Heap currently used
  external: number; // C++ objects bound to JS
  arrayBuffers: number; // ArrayBuffers and SharedArrayBuffers
  timestamp: number;
}

export interface MemoryPressure {
  level: 'normal' | 'moderate' | 'high' | 'critical';
  heapUsedPercent: number;
  rssUsedMB: number;
  recommendation: string;
}

export interface MemoryHistory {
  stats: MemoryStats[];
  maxSamples: number;
  startTime: number;
}

class MemoryMonitor extends EventEmitter {
  private intervalId: NodeJS.Timeout | null = null;
  private history: MemoryStats[] = [];
  private readonly maxHistorySamples = 60; // Keep last 60 samples (10 minutes at 10s interval)
  private readonly startTime = Date.now();
  private currentPressure: MemoryPressure['level'] = 'normal';

  /**
   * Start monitoring memory usage
   */
  start(): void {
    if (this.intervalId) {
      logger.warn('Memory monitor already running');
      return;
    }

    if (!env.ENABLE_MEMORY_MONITORING) {
      logger.info('Memory monitoring disabled via ENABLE_MEMORY_MONITORING');
      return;
    }

    const interval = env.MEMORY_MONITOR_INTERVAL;

    logger.info('Starting memory monitor', {
      interval: `${interval}ms`,
      thresholds: {
        moderate: `${env.MEMORY_MODERATE_THRESHOLD}%`,
        high: `${env.MEMORY_HIGH_THRESHOLD}%`,
        critical: `${env.MEMORY_CRITICAL_THRESHOLD}%`,
      },
    });

    this.intervalId = setInterval(() => {
      this.checkMemory();
    }, interval);

    // Initial check
    this.checkMemory();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Memory monitor stopped');
    }
  }

  /**
   * Check current memory usage and emit events
   */
  private checkMemory(): void {
    const memUsage = process.memoryUsage();
    const stats: MemoryStats = {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      timestamp: Date.now(),
    };

    // Add to history
    this.history.push(stats);
    if (this.history.length > this.maxHistorySamples) {
      this.history.shift();
    }

    // Calculate pressure
    const pressure = this.calculatePressure(stats);

    // Emit pressure change event if level changed
    if (pressure.level !== this.currentPressure) {
      const previousLevel = this.currentPressure;
      this.currentPressure = pressure.level;

      logger.warn('Memory pressure level changed', {
        from: previousLevel,
        to: pressure.level,
        heapUsedPercent: pressure.heapUsedPercent.toFixed(1),
        rssMB: (pressure.rssUsedMB).toFixed(0),
        recommendation: pressure.recommendation,
      });

      this.emit('pressure-change', pressure, previousLevel);
    }

    // Emit periodic stats
    this.emit('stats', stats, pressure);

    // Log warnings for non-normal pressure
    if (pressure.level !== 'normal') {
      logger.warn('Memory pressure detected', {
        level: pressure.level,
        heapUsedPercent: pressure.heapUsedPercent.toFixed(1),
        heapUsedMB: (stats.heapUsed / 1024 / 1024).toFixed(0),
        heapTotalMB: (stats.heapTotal / 1024 / 1024).toFixed(0),
        rssMB: (stats.rss / 1024 / 1024).toFixed(0),
        recommendation: pressure.recommendation,
      });
    }
  }

  /**
   * Calculate memory pressure level
   */
  private calculatePressure(stats: MemoryStats): MemoryPressure {
    const heapUsedPercent = (stats.heapUsed / stats.heapTotal) * 100;
    const rssUsedMB = stats.rss / 1024 / 1024;

    let level: MemoryPressure['level'] = 'normal';
    let recommendation = 'Memory usage is normal';

    if (heapUsedPercent >= env.MEMORY_CRITICAL_THRESHOLD) {
      level = 'critical';
      recommendation = 'CRITICAL: Reduce concurrent operations immediately. Consider restarting.';
    } else if (heapUsedPercent >= env.MEMORY_HIGH_THRESHOLD) {
      level = 'high';
      recommendation = 'HIGH: Reduce feed refresh concurrency and batch sizes.';
    } else if (heapUsedPercent >= env.MEMORY_MODERATE_THRESHOLD) {
      level = 'moderate';
      recommendation = 'MODERATE: Monitor closely. Consider reducing batch sizes.';
    }

    return {
      level,
      heapUsedPercent,
      rssUsedMB,
      recommendation,
    };
  }

  /**
   * Get current memory stats
   */
  getCurrentStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    return {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      timestamp: Date.now(),
    };
  }

  /**
   * Get current memory pressure
   */
  getCurrentPressure(): MemoryPressure {
    const stats = this.getCurrentStats();
    return this.calculatePressure(stats);
  }

  /**
   * Get memory history
   */
  getHistory(): MemoryHistory {
    return {
      stats: [...this.history],
      maxSamples: this.maxHistorySamples,
      startTime: this.startTime,
    };
  }

  /**
   * Get memory statistics summary
   */
  getSummary(): {
    current: MemoryStats;
    pressure: MemoryPressure;
    history: MemoryHistory;
    uptime: number;
  } {
    const current = this.getCurrentStats();
    const pressure = this.calculatePressure(current);
    const history = this.getHistory();

    return {
      current,
      pressure,
      history,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Force garbage collection if available
   */
  forceGC(): boolean {
    if (global.gc) {
      logger.info('Forcing garbage collection');
      global.gc();
      return true;
    }
    logger.warn('Garbage collection not available (run with --expose-gc)');
    return false;
  }

  /**
   * Check if monitoring is active
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

// Singleton instance
export const memoryMonitor = new MemoryMonitor();

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Get memory usage percentage
 */
export function getMemoryUsagePercent(stats: MemoryStats): number {
  return (stats.heapUsed / stats.heapTotal) * 100;
}
