import { BaseExtractor } from "./base-extractor";
import type { ExtractorConfig, ExtractedContent, ParsedCookie } from "./types";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { sanitizeHtml } from "@/lib/feed-parser";

/**
 * Playwright-based content extractor for JavaScript-rendered content
 * Falls back gracefully if Playwright is not available
 */
export class PlaywrightExtractor extends BaseExtractor {
  name = "playwright";
  priority = 100; // Highest priority when enabled
  private playwrightAvailable: boolean | null = null;

  /**
   * Check if Playwright is available
   */
  private async checkPlaywrightAvailability(): Promise<boolean> {
    if (this.playwrightAvailable !== null) {
      return this.playwrightAvailable;
    }

    try {
      // Check if Playwright is enabled in config
      if (!env.PLAYWRIGHT_ENABLED) {
        this.playwrightAvailable = false;
        return false;
      }

      // Try to import Playwright
      await import("playwright");
      this.playwrightAvailable = true;
      logger.info("[Playwright] Playwright is available");
      return true;
    } catch {
      this.playwrightAvailable = false;
      logger.warn("[Playwright] Playwright is not available - install with: npm install playwright");
      return false;
    }
  }

  /**
   * Can handle any URL if Playwright is available and enabled
   */
  async canHandle(url: string, config?: ExtractorConfig): Promise<boolean> {
    if (!this.validateUrl(url)) {
      return false;
    }

    // Only available if Playwright is installed and enabled
    return await this.checkPlaywrightAvailability();
  }

  /**
   * Extract content using Playwright
   */
  async extract(
    url: string,
    config?: ExtractorConfig
  ): Promise<ExtractedContent> {
    try {
      // Check if Playwright is available
      const available = await this.checkPlaywrightAvailability();
      if (!available) {
        return this.createErrorResult(
          url,
          "Playwright is not available or not enabled"
        );
      }

      logger.info(`[Playwright] Extracting content from ${url}`);

      // Validate URL
      if (!this.validateUrl(url)) {
        return this.createErrorResult(url, "Invalid URL");
      }

      // Import Playwright dynamically
      const { chromium } = await import("playwright");

      // Launch browser
      const browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      try {
        const context = await browser.newContext({
          userAgent:
            config?.userAgent ||
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          extraHTTPHeaders: config?.headers || {},
        });

        // Add cookies if provided
        if (config?.cookies) {
          const parsedCookies = this.parseCookies(config.cookies);
          const playwrightCookies = this.convertCookiesForPlaywright(
            parsedCookies,
            url
          );
          await context.addCookies(playwrightCookies);
        }

        const page = await context.newPage();

        // Set timeout
        const timeout = config?.timeout || env.EXTRACTION_TIMEOUT;
        page.setDefaultTimeout(timeout);

        // Navigate to page
        const response = await page.goto(url, {
          waitUntil: "networkidle",
          timeout,
        });

        if (!response) {
          await browser.close();
          return this.createErrorResult(url, "Failed to load page");
        }

        if (!response.ok()) {
          await browser.close();
          if (this.requiresAuthentication(response as any)) {
            return this.createErrorResult(
              url,
              `Authentication required (${response.status()})`
            );
          }
          return this.createErrorResult(
            url,
            `HTTP ${response.status()}: ${response.statusText()}`
          );
        }

        // Wait for content to load (optional custom selector)
        if (config?.customSelector) {
          try {
            await page.waitForSelector(config.customSelector, {
              timeout: 5000,
            });
          } catch {
            logger.warn(
              `[Playwright] Custom selector not found: ${config.customSelector}`
            );
          }
        }

        // Get rendered HTML
        const html = await page.content();

        // Close browser
        await browser.close();

        // Parse with JSDOM and Readability
        const dom = new JSDOM(html, { url });
        const document = dom.window.document;

        const reader = new Readability(document, {
          keepClasses: false,
          charThreshold: 500,
        });

        const article = reader.parse();

        if (!article) {
          return this.createErrorResult(
            url,
            "Failed to extract article content"
          );
        }

        // Clean content
        const cleanContent = sanitizeHtml(article.content);

        // Extract metadata
        const metadata = this.extractMetadata(document);

        // Generate excerpt
        const excerpt =
          article.excerpt || this.extractExcerpt(cleanContent);

        // Extract image
        const imageUrl = this.extractImage(document, url);

        // Parse published date
        const publishedAt = metadata.publishedAt
          ? new Date(metadata.publishedAt)
          : undefined;

        logger.info(
          `[Playwright] Successfully extracted: ${article.title} (${cleanContent.length} chars)`
        );

        return this.createSuccessResult(article.title, cleanContent, {
          excerpt,
          author: article.byline || metadata.author,
          publishedAt,
          imageUrl,
          metadata: {
            siteName: metadata.siteName,
            lang: metadata.lang,
            textLength: article.length,
          },
        });
      } finally {
        // Ensure browser is closed
        await browser.close().catch(() => {});
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return this.createErrorResult(url, errorMessage);
    }
  }

  /**
   * Convert parsed cookies to Playwright format
   */
  private convertCookiesForPlaywright(
    cookies: ParsedCookie[],
    url: string
  ): Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
  }> {
    const urlObj = new URL(url);
    const defaultDomain = urlObj.hostname;

    return cookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain || defaultDomain,
      path: cookie.path || "/",
      expires: cookie.expires ? Math.floor(cookie.expires.getTime() / 1000) : undefined,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
    }));
  }

  /**
   * Extract metadata from document
   */
  private extractMetadata(document: Document): {
    author?: string;
    publishedAt?: string;
    siteName?: string;
    lang?: string;
  } {
    const metadata: {
      author?: string;
      publishedAt?: string;
      siteName?: string;
      lang?: string;
    } = {};

    // Extract author
    const authorMeta =
      document.querySelector('meta[name="author"]') ||
      document.querySelector('meta[property="article:author"]');
    if (authorMeta) {
      metadata.author = authorMeta.getAttribute("content") || undefined;
    }

    // Extract published date
    const dateMeta =
      document.querySelector('meta[property="article:published_time"]') ||
      document.querySelector('meta[name="publication_date"]') ||
      document.querySelector('meta[name="date"]');
    if (dateMeta) {
      metadata.publishedAt = dateMeta.getAttribute("content") || undefined;
    }

    // Extract site name
    const siteNameMeta =
      document.querySelector('meta[property="og:site_name"]') ||
      document.querySelector('meta[name="application-name"]');
    if (siteNameMeta) {
      metadata.siteName = siteNameMeta.getAttribute("content") || undefined;
    }

    // Extract language
    const htmlLang = document.documentElement.lang;
    if (htmlLang) {
      metadata.lang = htmlLang;
    }

    return metadata;
  }

  /**
   * Extract featured image from document
   */
  private extractImage(document: Document, baseUrl: string): string | undefined {
    // Try Open Graph image
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      const imageUrl = ogImage.getAttribute("content");
      if (imageUrl) {
        return this.resolveUrl(imageUrl, baseUrl);
      }
    }

    // Try Twitter card image
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) {
      const imageUrl = twitterImage.getAttribute("content");
      if (imageUrl) {
        return this.resolveUrl(imageUrl, baseUrl);
      }
    }

    // Try first article image
    const articleImage = document.querySelector("article img");
    if (articleImage) {
      const imageUrl = articleImage.getAttribute("src");
      if (imageUrl) {
        return this.resolveUrl(imageUrl, baseUrl);
      }
    }

    return undefined;
  }
}

/**
 * Create and export singleton instance
 */
export const playwrightExtractor = new PlaywrightExtractor();

