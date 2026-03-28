import { prisma } from "@/lib/db";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import {
  getRobotsTxtInfo,
  extractDomain,
} from "./robots-txt-parser";

/**
 * In-memory map for tracking last extraction time per domain
 * This provides fast lookups without hitting the database on every extraction
 */
const domainTimestamps = new Map<string, number>();

/**
 * Extraction rate limiter service
 * Manages per-domain rate limiting for content extraction to prevent blocking
 */
export class ExtractionRateLimiter {
  /**
   * Check if extraction is allowed for a URL based on rate limits
   * @param url - URL to check
   * @param feedId - Optional feed ID to check feed-specific settings
   * @returns true if extraction is allowed, false if should wait
   */
  async canExtract(url: string, feedId?: string): Promise<boolean> {
    const domain = extractDomain(url);
    if (!domain) return true; // Invalid domain, allow

    const requiredDelay = await this.getRequiredDelay(domain, feedId);
    const lastExtraction = domainTimestamps.get(domain);

    if (!lastExtraction) {
      // First extraction for this domain, allow
      return true;
    }

    const timeSinceLastExtraction = Date.now() - lastExtraction;
    return timeSinceLastExtraction >= requiredDelay;
  }

  /**
   * Wait until extraction is allowed for a URL
   * Blocks until the rate limit window has passed
   * @param url - URL to extract
   * @param feedId - Optional feed ID for feed-specific settings
   */
  async waitForSlot(url: string, feedId?: string): Promise<void> {
    const domain = extractDomain(url);
    if (!domain) return; // Invalid domain, skip waiting

    const requiredDelay = await this.getRequiredDelay(domain, feedId);
    const lastExtraction = domainTimestamps.get(domain);

    if (!lastExtraction) {
      // First extraction for this domain, no wait needed
      return;
    }

    const timeSinceLastExtraction = Date.now() - lastExtraction;
    const waitTime = requiredDelay - timeSinceLastExtraction;

    if (waitTime > 0) {
      logger.info(
        `[RateLimiter] Waiting ${Math.round(waitTime)}ms before extracting from ${domain}`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Record that an extraction occurred for a domain
   * Updates in-memory timestamp and database log
   * @param url - URL that was extracted
   * @param success - Whether the extraction succeeded
   * @param error - Optional error message if extraction failed
   * @param httpStatus - Optional HTTP status code
   */
  async recordExtraction(
    url: string,
    success: boolean,
    error?: string,
    httpStatus?: number
  ): Promise<void> {
    const domain = extractDomain(url);
    if (!domain) return;

    const now = Date.now();

    // Update in-memory timestamp
    domainTimestamps.set(domain, now);

    // Update database log
    try {
      await this.updateDomainLog(domain, success, error, httpStatus);
    } catch (dbError) {
      logger.error(
        `[RateLimiter] Failed to update domain log for ${domain}: ${dbError}`
      );
      // Don't throw - extraction succeeded, database logging is secondary
    }
  }

  /**
   * Get the required delay for a domain in milliseconds
   * Considers:
   * 1. Feed-specific extractionDelayMs override
   * 2. robots.txt crawl-delay directive
   * 3. Environment variable EXTRACTION_DELAY_MS default
   * 4. Adaptive delay based on 429 responses
   * @param domain - Domain to check
   * @param feedId - Optional feed ID for feed-specific settings
   * @returns Required delay in milliseconds
   */
  private async getRequiredDelay(
    domain: string,
    feedId?: string
  ): Promise<number> {
    let delay = env.EXTRACTION_DELAY_MS; // Default from environment

    // Check feed-specific override
    if (feedId) {
      try {
        const feed = await prisma.feeds.findUnique({
          where: { id: feedId },
          select: { extractionDelayMs: true, respectRobotsTxt: true },
        });

        if (feed?.extractionDelayMs) {
          delay = feed.extractionDelayMs;
          logger.debug(
            `[RateLimiter] Using feed-specific delay for ${domain}: ${delay}ms`
          );
        }

        // Check robots.txt if enabled for this feed
        if (feed?.respectRobotsTxt !== false) {
          const robotsDelay = await this.getRobotsCrawlDelay(domain);
          if (robotsDelay && robotsDelay > delay) {
            delay = robotsDelay;
            logger.debug(
              `[RateLimiter] Using robots.txt crawl-delay for ${domain}: ${delay}ms`
            );
          }
        }
      } catch (error) {
        logger.warn(
          `[RateLimiter] Failed to fetch feed settings for ${feedId}: ${error}`
        );
        // Continue with default delay
      }
    } else {
      // No feed ID, check robots.txt if globally enabled
      if (env.EXTRACTION_RESPECT_ROBOTS_TXT) {
        const robotsDelay = await this.getRobotsCrawlDelay(domain);
        if (robotsDelay && robotsDelay > delay) {
          delay = robotsDelay;
        }
      }
    }

    // Check for adaptive delay based on 429 responses
    const adaptiveDelay = await this.getAdaptiveDelay(domain);
    if (adaptiveDelay > delay) {
      delay = adaptiveDelay;
      logger.info(
        `[RateLimiter] Using adaptive delay for ${domain} due to previous rate limiting: ${delay}ms`
      );
    }

    return delay;
  }

  /**
   * Get crawl-delay from robots.txt for a domain
   * @param domain - Domain to check
   * @returns Crawl delay in milliseconds, or undefined if not specified
   */
  private async getRobotsCrawlDelay(domain: string): Promise<number | undefined> {
    try {
      const robotsInfo = await getRobotsTxtInfo(domain);
      return robotsInfo.crawlDelay;
    } catch (error) {
      logger.debug(
        `[RateLimiter] Failed to get robots.txt for ${domain}: ${error}`
      );
      return undefined;
    }
  }

  /**
   * Get adaptive delay based on previous 429 responses
   * Increases delay if domain has been rate limiting us
   * @param domain - Domain to check
   * @returns Adaptive delay in milliseconds
   */
  private async getAdaptiveDelay(domain: string): Promise<number> {
    try {
      const domainLog = await prisma.domain_extraction_log.findUnique({
        where: { domain },
        select: { rateLimitCount: true, lastError: true },
      });

      if (!domainLog || domainLog.rateLimitCount === 0) {
        return 0; // No rate limiting, no adaptive delay
      }

      // Progressive backoff based on rate limit count
      // 1-2 rate limits: 10s delay
      // 3-5 rate limits: 30s delay
      // 6-10 rate limits: 60s delay
      // 10+ rate limits: 120s delay
      if (domainLog.rateLimitCount >= 10) {
        return 120 * 1000; // 2 minutes
      } else if (domainLog.rateLimitCount >= 6) {
        return 60 * 1000; // 1 minute
      } else if (domainLog.rateLimitCount >= 3) {
        return 30 * 1000; // 30 seconds
      } else {
        return 10 * 1000; // 10 seconds
      }
    } catch (error) {
      logger.warn(
        `[RateLimiter] Failed to get adaptive delay for ${domain}: ${error}`
      );
      return 0;
    }
  }

  /**
   * Update domain extraction log in database
   * @param domain - Domain that was extracted
   * @param success - Whether extraction succeeded
   * @param error - Optional error message
   * @param httpStatus - Optional HTTP status code
   */
  private async updateDomainLog(
    domain: string,
    success: boolean,
    error?: string,
    httpStatus?: number
  ): Promise<void> {
    const now = new Date();

    // Check if this is a 429 (rate limit) response
    const is429 = httpStatus === 429;

    await prisma.domain_extraction_log.upsert({
      where: { domain },
      create: {
        id: `domain-${domain}-${Date.now()}`,
        domain,
        lastExtractedAt: now,
        failureCount: success ? 0 : 1,
        lastError: error,
        rateLimitCount: is429 ? 1 : 0,
      },
      update: {
        lastExtractedAt: now,
        failureCount: success
          ? 0
          : { increment: 1 },
        lastError: error,
        rateLimitCount: is429
          ? { increment: 1 }
          : undefined,
      },
    });

    // Log rate limit event
    if (is429) {
      logger.warn(
        `[RateLimiter] Domain ${domain} returned 429 (Too Many Requests). Adaptive delay will be applied.`
      );
    }
  }

  /**
   * Reset rate limit count for a domain
   * Useful after a long period of no extraction or manual reset
   * @param domain - Domain to reset
   */
  async resetRateLimitCount(domain: string): Promise<void> {
    try {
      await prisma.domain_extraction_log.update({
        where: { domain },
        data: {
          rateLimitCount: 0,
          failureCount: 0,
          lastError: null,
        },
      });

      logger.info(`[RateLimiter] Reset rate limit count for domain: ${domain}`);
    } catch (error) {
      logger.error(
        `[RateLimiter] Failed to reset rate limit count for ${domain}: ${error}`
      );
    }
  }

  /**
   * Get statistics for all domains
   */
  async getDomainStats(): Promise<
    Array<{
      domain: string;
      lastExtractedAt: Date;
      failureCount: number;
      rateLimitCount: number;
      crawlDelay?: number;
    }>
  > {
    const logs = await prisma.domain_extraction_log.findMany({
      orderBy: { lastExtractedAt: "desc" },
      take: 100,
    });

    return logs.map((log) => ({
      domain: log.domain,
      lastExtractedAt: log.lastExtractedAt,
      failureCount: log.failureCount,
      rateLimitCount: log.rateLimitCount,
      crawlDelay: log.crawlDelay || undefined,
    }));
  }

  /**
   * Clear in-memory timestamps
   * Useful for testing or when you want to force fresh delay calculations
   */
  clearInMemoryCache(): void {
    domainTimestamps.clear();
    logger.info("[RateLimiter] Cleared in-memory domain timestamps");
  }
}

/**
 * Singleton instance of the rate limiter
 */
export const extractionRateLimiter = new ExtractionRateLimiter();
