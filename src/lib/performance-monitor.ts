/**
 * Performance Monitoring Utilities
 *
 * Tools for measuring and monitoring component render performance.
 * Only active in development mode to avoid production overhead.
 */

/**
 * Measures the render time of a component
 *
 * @param componentName - Name of the component to measure
 * @returns Cleanup function to call when measurement is complete
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   const endMeasure = measureComponentRender('AdminDashboard');
 *   return endMeasure;
 * }, []);
 * ```
 */
export function measureComponentRender(componentName: string): () => void {
  // Only run in development on the client
  if (
    typeof window === 'undefined' ||
    process.env.NODE_ENV !== 'development'
  ) {
    return () => {};
  }

  const startMark = `${componentName}-start`;
  const endMark = `${componentName}-end`;
  const measureName = componentName;

  try {
    performance.mark(startMark);
  } catch (error) {
    console.warn(`Failed to mark start for ${componentName}:`, error);
    return () => {};
  }

  return () => {
    try {
      performance.mark(endMark);

      const measure = performance.measure(measureName, startMark, endMark);

      // Warn if render takes > 16ms (1 frame at 60fps)
      if (measure.duration > 16) {
        console.warn(
          `⚠️ Slow render: ${componentName} took ${measure.duration.toFixed(2)}ms (>16ms threshold)`
        );
      } else {
        console.log(
          `✓ ${componentName} rendered in ${measure.duration.toFixed(2)}ms`
        );
      }

      // Clean up marks and measures
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
    } catch (error) {
      // Silently fail - performance monitoring is non-critical
      console.debug(`Performance measurement failed for ${componentName}:`, error);
    }
  };
}

/**
 * Measures an async operation (e.g., data fetching, API call)
 *
 * @param operationName - Name of the operation to measure
 * @param operation - Async function to measure
 * @returns Result of the operation
 *
 * @example
 * ```tsx
 * const articles = await measureAsync('fetchArticles', async () => {
 *   return await fetch('/api/articles').then(r => r.json());
 * });
 * ```
 */
export async function measureAsync<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  if (
    typeof window === 'undefined' ||
    process.env.NODE_ENV !== 'development'
  ) {
    return operation();
  }

  const startMark = `${operationName}-async-start`;
  const endMark = `${operationName}-async-end`;
  const measureName = `${operationName}-async`;

  try {
    performance.mark(startMark);
    const result = await operation();
    performance.mark(endMark);

    const measure = performance.measure(measureName, startMark, endMark);

    console.log(
      `⏱️ ${operationName} completed in ${measure.duration.toFixed(2)}ms`
    );

    // Clean up
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);

    return result;
  } catch (error) {
    // Clean up on error
    try {
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Gets all performance entries of a specific type
 *
 * @param type - Type of performance entries to retrieve
 * @returns Array of performance entries
 */
export function getPerformanceEntries(
  type: 'navigation' | 'resource' | 'measure' | 'mark' | 'paint'
): PerformanceEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return performance.getEntriesByType(type);
  } catch (error) {
    console.warn(`Failed to get performance entries for type ${type}:`, error);
    return [];
  }
}

/**
 * Logs a summary of all measured renders
 */
export function logRenderSummary(): void {
  if (
    typeof window === 'undefined' ||
    process.env.NODE_ENV !== 'development'
  ) {
    return;
  }

  try {
    const measures = performance.getEntriesByType('measure');

    if (measures.length === 0) {
      console.log('No render measurements available');
      return;
    }

    console.group('🎯 Render Performance Summary');

    // Sort by duration (slowest first)
    const sorted = [...measures].sort((a, b) => b.duration - a.duration);

    sorted.forEach((measure, index) => {
      const emoji = measure.duration > 16 ? '🐌' : '⚡';
      console.log(
        `${emoji} ${index + 1}. ${measure.name}: ${measure.duration.toFixed(2)}ms`
      );
    });

    const avgDuration =
      measures.reduce((sum, m) => sum + m.duration, 0) / measures.length;
    console.log(`\n📊 Average: ${avgDuration.toFixed(2)}ms`);

    console.groupEnd();
  } catch (error) {
    console.warn('Failed to log render summary:', error);
  }
}

/**
 * Clears all performance measurements
 */
export function clearPerformanceData(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    performance.clearMarks();
    performance.clearMeasures();
    console.log('✓ Performance data cleared');
  } catch (error) {
    console.warn('Failed to clear performance data:', error);
  }
}

/**
 * Hook to automatically measure component render time
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   usePerformanceMonitor('MyComponent');
 *   // ... rest of component
 * }
 * ```
 */
export function usePerformanceMonitor(componentName: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  // This would normally use useEffect, but since this is a utility file
  // and we want to avoid React dependencies here, we'll provide this
  // as a pattern to follow rather than a hook implementation.
  //
  // Usage in components:
  // useEffect(() => {
  //   const endMeasure = measureComponentRender(componentName);
  //   return endMeasure;
  // }, []);
}

/**
 * Type definitions for performance metrics
 */
export interface PerformanceMetrics {
  componentName: string;
  duration: number;
  timestamp: number;
  exceedsThreshold: boolean;
}

/**
 * Collects performance metrics for a component
 */
export function collectMetrics(componentName: string, duration: number): PerformanceMetrics {
  return {
    componentName,
    duration,
    timestamp: Date.now(),
    exceedsThreshold: duration > 16, // 60fps threshold
  };
}
