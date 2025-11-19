import type {
  ContentExtractor,
  ExtractorConfig,
  ExtractedContent,
  ExtractorMetrics,
} from "./types";
import { logger } from "@/lib/logger";
import { playwrightExtractor } from "./playwright-extractor";
import { readabilityExtractor } from "./readability-extractor";

/**
 * Extractor registry for managing and orchestrating content extractors
 */
class ExtractorRegistry {
  private extractors: Map<string, ContentExtractor> = new Map();
  private metrics: Map<string, ExtractorMetrics> = new Map();

  constructor() {
    // Register default extractors
    this.registerExtractor(playwrightExtractor);
    this.registerExtractor(readabilityExtractor);
  }

  /**
   * Register a new extractor
   */
  registerExtractor(extractor: ContentExtractor): void {
    this.extractors.set(extractor.name, extractor);
    
    // Initialize metrics
    if (!this.metrics.has(extractor.name)) {
      this.metrics.set(extractor.name, {
        extractorName: extractor.name,
        totalAttempts: 0,
        successCount: 0,
        failureCount: 0,
        averageDuration: 0,
        lastUsed: new Date(),
      });
    }

    logger.info(`[ExtractorRegistry] Registered extractor: ${extractor.name}`);
  }

  /**
   * Unregister an extractor
   */
  unregisterExtractor(name: string): void {
    this.extractors.delete(name);
    logger.info(`[ExtractorRegistry] Unregistered extractor: ${name}`);
  }

  /**
   * Get extractor by name
   */
  getExtractor(name: string): ContentExtractor | undefined {
    return this.extractors.get(name);
  }

  /**
   * Get all registered extractors sorted by priority
   */
  getAllExtractors(): ContentExtractor[] {
    return Array.from(this.extractors.values()).sort(
      (a, b) => (b.priority || 50) - (a.priority || 50)
    );
  }

  /**
   * Find the best extractor for a URL
   */
  async findExtractor(
    url: string,
    config?: ExtractorConfig
  ): Promise<ContentExtractor | null> {
    const extractors = this.getAllExtractors();

    for (const extractor of extractors) {
      try {
        const canHandle = await extractor.canHandle(url, config);
        if (canHandle) {
          logger.info(
            `[ExtractorRegistry] Selected extractor: ${extractor.name} for ${url}`
          );
          return extractor;
        }
      } catch (error) {
        logger.warn(
          `[ExtractorRegistry] Error checking extractor ${extractor.name}: ${error}`
        );
      }
    }

    logger.warn(`[ExtractorRegistry] No suitable extractor found for ${url}`);
    return null;
  }

  /**
   * Extract content with fallback chain
   * Tries extractors in priority order until one succeeds
   */
  async extractWithFallback(
    url: string,
    config?: ExtractorConfig,
    preferredExtractor?: string
  ): Promise<ExtractedContent> {
    const extractors = this.getAllExtractors();
    const errors: Array<{ extractor: string; error: string }> = [];

    // Try preferred extractor first if specified
    if (preferredExtractor) {
      const extractor = this.getExtractor(preferredExtractor);
      if (extractor) {
        try {
          const canHandle = await extractor.canHandle(url, config);
          if (canHandle) {
            const result = await this.extractWithMetrics(
              extractor,
              url,
              config
            );
            if (result.success) {
              return result;
            }
            errors.push({
              extractor: extractor.name,
              error: result.error || "Unknown error",
            });
          }
        } catch (error) {
          errors.push({
            extractor: extractor.name,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    // Try all extractors in priority order
    for (const extractor of extractors) {
      // Skip if already tried as preferred
      if (extractor.name === preferredExtractor) {
        continue;
      }

      try {
        const canHandle = await extractor.canHandle(url, config);
        if (!canHandle) {
          continue;
        }

        const result = await this.extractWithMetrics(extractor, url, config);
        if (result.success) {
          logger.info(
            `[ExtractorRegistry] Successfully extracted with ${extractor.name}`
          );
          return result;
        }

        errors.push({
          extractor: extractor.name,
          error: result.error || "Unknown error",
        });
      } catch (error) {
        errors.push({
          extractor: extractor.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // All extractors failed
    const errorMessage = errors
      .map((e) => `${e.extractor}: ${e.error}`)
      .join("; ");

    logger.error(
      `[ExtractorRegistry] All extractors failed for ${url}: ${errorMessage}`
    );

    return {
      title: "",
      content: "",
      success: false,
      method: "none",
      error: `All extractors failed: ${errorMessage}`,
    };
  }

  /**
   * Extract content with a specific extractor
   */
  async extractWith(
    extractorName: string,
    url: string,
    config?: ExtractorConfig
  ): Promise<ExtractedContent> {
    const extractor = this.getExtractor(extractorName);
    if (!extractor) {
      return {
        title: "",
        content: "",
        success: false,
        method: extractorName,
        error: `Extractor not found: ${extractorName}`,
      };
    }

    return this.extractWithMetrics(extractor, url, config);
  }

  /**
   * Extract content and track metrics
   */
  private async extractWithMetrics(
    extractor: ContentExtractor,
    url: string,
    config?: ExtractorConfig
  ): Promise<ExtractedContent> {
    const startTime = Date.now();
    const metrics = this.metrics.get(extractor.name);

    if (metrics) {
      metrics.totalAttempts++;
      metrics.lastUsed = new Date();
    }

    try {
      const result = await extractor.extract(url, config);
      const duration = Date.now() - startTime;

      if (metrics) {
        if (result.success) {
          metrics.successCount++;
        } else {
          metrics.failureCount++;
        }

        // Update average duration
        metrics.averageDuration =
          (metrics.averageDuration * (metrics.totalAttempts - 1) + duration) /
          metrics.totalAttempts;
      }

      logger.info(
        `[ExtractorRegistry] ${extractor.name} extraction took ${duration}ms`
      );

      return result;
    } catch (error) {
      if (metrics) {
        metrics.failureCount++;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `[ExtractorRegistry] ${extractor.name} extraction failed: ${errorMessage}`
      );

      return {
        title: "",
        content: "",
        success: false,
        method: extractor.name,
        error: errorMessage,
      };
    }
  }

  /**
   * Get metrics for an extractor
   */
  getMetrics(extractorName: string): ExtractorMetrics | undefined {
    return this.metrics.get(extractorName);
  }

  /**
   * Get metrics for all extractors
   */
  getAllMetrics(): ExtractorMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Reset metrics for an extractor
   */
  resetMetrics(extractorName: string): void {
    const metrics = this.metrics.get(extractorName);
    if (metrics) {
      metrics.totalAttempts = 0;
      metrics.successCount = 0;
      metrics.failureCount = 0;
      metrics.averageDuration = 0;
    }
  }

  /**
   * Reset all metrics
   */
  resetAllMetrics(): void {
    for (const metrics of this.metrics.values()) {
      metrics.totalAttempts = 0;
      metrics.successCount = 0;
      metrics.failureCount = 0;
      metrics.averageDuration = 0;
    }
  }
}

/**
 * Singleton instance
 */
export const extractorRegistry = new ExtractorRegistry();

