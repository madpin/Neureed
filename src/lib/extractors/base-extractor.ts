import type {
  ContentExtractor,
  ExtractorConfig,
  ExtractedContent,
  ParsedCookie,
} from "./types";
import { env } from "@/env";
import { logger } from "@/lib/logger";

/**
 * Base extractor class with common functionality
 * All extractors should extend this class
 */
export abstract class BaseExtractor implements ContentExtractor {
  abstract name: string;
  priority: number = 50;

  abstract canHandle(
    url: string,
    config?: ExtractorConfig
  ): Promise<boolean>;
  abstract extract(
    url: string,
    config?: ExtractorConfig
  ): Promise<ExtractedContent>;

  /**
   * Parse cookies from various formats
   * Supports: JSON, Netscape, Header string, Raw key=value pairs
   */
  protected parseCookies(cookieString: string): ParsedCookie[] {
    const cookies: ParsedCookie[] = [];

    try {
      // Try JSON format first
      const jsonCookies = JSON.parse(cookieString);
      if (Array.isArray(jsonCookies)) {
        return jsonCookies.map((c) => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          expires: c.expires ? new Date(c.expires) : undefined,
          httpOnly: c.httpOnly,
          secure: c.secure,
          sameSite: c.sameSite,
        }));
      }
    } catch {
      // Not JSON, continue with other formats
    }

    // Try Netscape format or raw key=value pairs
    const lines = cookieString.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith("#")) continue;

      // Netscape format: domain flag path secure expiration name value
      if (trimmed.includes("\t")) {
        const parts = trimmed.split("\t");
        if (parts.length >= 7 && parts[0] && parts[2] && parts[3] && parts[4] && parts[5] && parts[6]) {
          cookies.push({
            name: parts[5],
            value: parts[6],
            domain: parts[0],
            path: parts[2],
            secure: parts[3] === "TRUE",
            expires: parts[4] !== "0" ? new Date(parseInt(parts[4]) * 1000) : undefined,
          });
          continue;
        }
      }

      // Simple key=value format
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match && match[1] && match[2]) {
        cookies.push({
          name: match[1].trim(),
          value: match[2].trim(),
        });
      }
    }

    return cookies;
  }

  /**
   * Convert parsed cookies to Cookie header string
   */
  protected cookiesToHeader(cookies: ParsedCookie[]): string {
    return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  }

  /**
   * Fetch URL with cookies and headers
   */
  protected async fetchWithConfig(
    url: string,
    config?: ExtractorConfig
  ): Promise<Response> {
    const headers: Record<string, string> = {
      "User-Agent":
        config?.userAgent ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      ...config?.headers,
    };

    // Add cookies if provided
    if (config?.cookies) {
      const parsedCookies = this.parseCookies(config.cookies);
      if (parsedCookies.length > 0) {
        headers["Cookie"] = this.cookiesToHeader(parsedCookies);
      }
    }

    const timeout = config?.timeout || env.EXTRACTION_TIMEOUT;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      // If response is 429 (Too Many Requests), throw error with response attached
      // This allows retry logic to access the response and handle it specially
      if (response.status === 429) {
        const error = new Error(`Rate limited (429) when fetching ${url}`) as Error & { response: Response };
        error.response = response;
        throw error;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Validate URL before extraction
   */
  protected validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ["http:", "https:"].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Create error result
   */
  protected createErrorResult(
    url: string,
    error: string,
    method: string = this.name
  ): ExtractedContent {
    logger.error(`[${method}] Extraction failed for ${url}: ${error}`);
    return {
      title: "",
      content: "",
      success: false,
      method,
      error,
    };
  }

  /**
   * Create success result
   */
  protected createSuccessResult(
    title: string,
    content: string,
    options: {
      excerpt?: string;
      author?: string;
      publishedAt?: Date;
      imageUrl?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): ExtractedContent {
    return {
      title,
      content,
      excerpt: options.excerpt,
      author: options.author,
      publishedAt: options.publishedAt,
      imageUrl: options.imageUrl,
      success: true,
      method: this.name,
      metadata: options.metadata,
    };
  }

  /**
   * Extract excerpt from content
   */
  protected extractExcerpt(content: string, maxLength: number = 200): string {
    // Remove HTML tags
    const plainText = content.replace(/<[^>]*>/g, " ");
    // Remove extra whitespace
    const cleaned = plainText.replace(/\s+/g, " ").trim();
    // Truncate
    if (cleaned.length <= maxLength) {
      return cleaned;
    }
    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > 0
      ? truncated.substring(0, lastSpace) + "..."
      : truncated + "...";
  }

  /**
   * Retry logic for extraction with enhanced 429 handling
   */
  protected async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    let lastResponse: Response | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if error contains response information (for 429 handling)
        if (
          error !== null &&
          typeof error === "object" &&
          "response" in error &&
          (error as { response: unknown }).response instanceof Response
        ) {
          lastResponse = (error as { response: Response }).response;
        }

        logger.warn(
          `[${this.name}] Retry ${i + 1}/${maxRetries} failed: ${lastError.message}`
        );

        if (i < maxRetries - 1) {
          let waitTime = delay * (i + 1); // Default exponential backoff

          // Enhanced handling for 429 (Too Many Requests)
          if (lastResponse?.status === 429) {
            // Parse Retry-After header if present
            const retryAfter = lastResponse.headers.get("Retry-After");

            if (retryAfter) {
              // Retry-After can be in seconds or a date
              const retryAfterSeconds = parseInt(retryAfter);
              if (!isNaN(retryAfterSeconds)) {
                waitTime = retryAfterSeconds * 1000;
                logger.info(
                  `[${this.name}] 429 response with Retry-After: ${retryAfterSeconds}s. Waiting ${waitTime}ms`
                );
              } else {
                // Try parsing as HTTP date
                const retryAfterDate = new Date(retryAfter);
                if (!isNaN(retryAfterDate.getTime())) {
                  waitTime = Math.max(0, retryAfterDate.getTime() - Date.now());
                  logger.info(
                    `[${this.name}] 429 response with Retry-After date. Waiting ${waitTime}ms`
                  );
                }
              }
            } else {
              // No Retry-After header, use aggressive backoff
              // 30s, 60s, 120s for successive 429 responses
              waitTime = Math.min(30 * 1000 * Math.pow(2, i), 120 * 1000);
              logger.info(
                `[${this.name}] 429 response without Retry-After. Using backoff: ${waitTime}ms`
              );
            }
          }

          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError || new Error("Retry failed");
  }

  /**
   * Parse HTTP status code from error
   * Helper method for extracting status codes from fetch errors
   */
  protected getHttpStatusFromError(error: unknown): number | undefined {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as any).response;
      if (response instanceof Response) {
        return response.status;
      }
    }
    return undefined;
  }

  /**
   * Check if response indicates authentication is required
   */
  protected requiresAuthentication(response: Response): boolean {
    if (response.status === 401 || response.status === 403) {
      return true;
    }

    // Check for common paywall indicators in content
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return false;
    }

    return false; // Will be checked in content later
  }

  /**
   * Resolve relative URLs to absolute
   */
  protected resolveUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).toString();
    } catch {
      return url;
    }
  }
}

