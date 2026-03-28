import { logger } from "@/lib/logger";

/**
 * Robots.txt parsing result
 */
export interface RobotsTxtInfo {
  crawlDelay?: number; // Crawl delay in milliseconds
  allowed: boolean; // Whether the path is allowed
  error?: string;
}

/**
 * Cache for robots.txt data to avoid repeated fetches
 * TTL: 24 hours
 */
const robotsCache = new Map<
  string,
  { data: RobotsTxtInfo; expiresAt: number }
>();

/**
 * Parse robots.txt content and extract crawl-delay
 */
function parseRobotsTxt(content: string, userAgent: string = "*"): RobotsTxtInfo {
  const lines = content.split("\n");
  let currentUserAgent: string | null = null;
  let crawlDelay: number | undefined;
  const disallowedPaths: string[] = [];
  const allowedPaths: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#")) continue;

    // User-agent directive
    if (trimmed.startsWith("user-agent:")) {
      const agent = trimmed.substring(11).trim();
      currentUserAgent = agent;
      continue;
    }

    // Only process if we're in the right user-agent section or wildcard
    if (
      currentUserAgent &&
      (currentUserAgent === userAgent.toLowerCase() ||
        currentUserAgent === "*")
    ) {
      // Crawl-delay directive
      if (trimmed.startsWith("crawl-delay:")) {
        const delayStr = trimmed.substring(12).trim();
        const delaySeconds = parseFloat(delayStr);
        if (!isNaN(delaySeconds)) {
          // Convert seconds to milliseconds
          crawlDelay = Math.max(crawlDelay || 0, delaySeconds * 1000);
        }
      }

      // Disallow directive
      if (trimmed.startsWith("disallow:")) {
        const path = trimmed.substring(9).trim();
        if (path) {
          disallowedPaths.push(path);
        }
      }

      // Allow directive
      if (trimmed.startsWith("allow:")) {
        const path = trimmed.substring(6).trim();
        if (path) {
          allowedPaths.push(path);
        }
      }
    }
  }

  return {
    crawlDelay,
    allowed: true, // Simplified - we'll assume allowed unless specific path checking is needed
  };
}

/**
 * Fetch and parse robots.txt for a domain
 * @param domain - Domain to fetch robots.txt from (e.g., "example.com")
 * @param userAgent - User agent to match in robots.txt (default: "*")
 * @returns Robots.txt info with crawl delay and allowed status
 */
export async function getRobotsTxtInfo(
  domain: string,
  userAgent: string = "*"
): Promise<RobotsTxtInfo> {
  const cacheKey = `${domain}:${userAgent}`;

  // Check cache first
  const cached = robotsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    logger.debug(`[RobotsTxt] Using cached robots.txt for ${domain}`);
    return cached.data;
  }

  try {
    // Construct robots.txt URL
    const robotsUrl = `https://${domain}/robots.txt`;

    logger.debug(`[RobotsTxt] Fetching robots.txt from ${robotsUrl}`);

    // Fetch robots.txt with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": userAgent,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // If robots.txt doesn't exist or is inaccessible, assume no restrictions
      logger.debug(`[RobotsTxt] robots.txt not found for ${domain}, assuming no restrictions`);
      const result: RobotsTxtInfo = { allowed: true };

      // Cache the result for 24 hours
      robotsCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      return result;
    }

    const content = await response.text();
    const result = parseRobotsTxt(content, userAgent);

    // Log crawl delay if found
    if (result.crawlDelay) {
      logger.info(`[RobotsTxt] Found crawl-delay for ${domain}: ${result.crawlDelay}ms`);
    }

    // Cache the result for 24 hours
    robotsCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    logger.warn(`[RobotsTxt] Failed to fetch robots.txt for ${domain}: ${errorMessage}`);

    // On error, assume no restrictions
    const result: RobotsTxtInfo = {
      allowed: true,
      error: errorMessage,
    };

    // Cache the error result for 1 hour to avoid repeated failures
    robotsCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + 60 * 60 * 1000,
    });

    return result;
  }
}

/**
 * Extract domain from URL
 * @param url - Full URL
 * @returns Domain (e.g., "example.com")
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    // Fallback: simple regex extraction
    const match = url.match(/^(?:https?:\/\/)?([^\/]+)/i);
    return match ? match[1] || "" : "";
  }
}

/**
 * Clear robots.txt cache for a specific domain
 * Useful for testing or if robots.txt has changed
 */
export function clearRobotsTxtCache(domain?: string): void {
  if (domain) {
    // Clear all entries for this domain
    const keysToDelete: string[] = [];
    for (const key of robotsCache.keys()) {
      if (key.startsWith(`${domain}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => robotsCache.delete(key));
    logger.info(`[RobotsTxt] Cleared cache for domain: ${domain}`);
  } else {
    // Clear entire cache
    robotsCache.clear();
    logger.info(`[RobotsTxt] Cleared entire robots.txt cache`);
  }
}

/**
 * Get cache statistics
 */
export function getRobotsTxtCacheStats(): {
  size: number;
  entries: Array<{ domain: string; crawlDelay?: number }>;
} {
  const entries = Array.from(robotsCache.entries()).map(([key, value]) => ({
    domain: key.split(":")[0] || "",
    crawlDelay: value.data.crawlDelay,
  }));

  return {
    size: robotsCache.size,
    entries,
  };
}
