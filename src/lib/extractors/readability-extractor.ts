import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { BaseExtractor } from "./base-extractor";
import type { ExtractorConfig, ExtractedContent } from "./types";
import { sanitizeHtml } from "@/lib/feed-parser";
import { logger } from "@/lib/logger";

/**
 * Readability-based content extractor
 * Uses Mozilla's Readability library to extract clean article content
 */
export class ReadabilityExtractor extends BaseExtractor {
  name = "readability";
  priority = 75; // Higher priority than basic RSS

  /**
   * Can handle any HTML URL
   */
  async canHandle(url: string, config?: ExtractorConfig): Promise<boolean> {
    if (!this.validateUrl(url)) {
      return false;
    }

    // Can handle any HTTP/HTTPS URL
    const urlObj = new URL(url);
    return ["http:", "https:"].includes(urlObj.protocol);
  }

  /**
   * Extract content using Readability
   */
  async extract(
    url: string,
    config?: ExtractorConfig
  ): Promise<ExtractedContent> {
    try {
      logger.info(`[Readability] Extracting content from ${url}`);

      // Validate URL
      if (!this.validateUrl(url)) {
        return this.createErrorResult(url, "Invalid URL");
      }

      // Fetch HTML with cookies/headers
      const response = await this.retry(() => this.fetchWithConfig(url, config));

      if (!response.ok) {
        if (this.requiresAuthentication(response)) {
          return this.createErrorResult(
            url,
            `Authentication required (${response.status})`
          );
        }
        return this.createErrorResult(
          url,
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Check content type
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        return this.createErrorResult(
          url,
          `Invalid content type: ${contentType}`
        );
      }

      // Get HTML content
      const html = await response.text();

      // Check for paywall indicators
    //   if (this.detectPaywall(html)) {
    //     return this.createErrorResult(
    //       url,
    //       "Paywall detected - authentication may be required"
    //     );
    //   }

      // Parse with JSDOM (suppress CSS errors - they don't affect content extraction)
      const dom = new JSDOM(html, {
        url,
        virtualConsole: new (require('jsdom').VirtualConsole)(),
      });
      const document = dom.window.document;

      // Extract with Readability
      const reader = new Readability(document, {
        keepClasses: false,
        charThreshold: 500, // Minimum content length
      });

      const article = reader.parse();

      if (!article) {
        return this.createErrorResult(
          url,
          "Failed to extract article content - page may not be an article"
        );
      }

      // Clean and sanitize content
      const cleanContent = sanitizeHtml(article.content);

      // Extract metadata
      const metadata = this.extractMetadata(document);

      // Generate excerpt if not available
      const excerpt =
        article.excerpt || this.extractExcerpt(cleanContent);

      // Extract image
      const imageUrl = this.extractImage(document, url);

      // Parse published date
      const publishedAt = metadata.publishedAt
        ? new Date(metadata.publishedAt)
        : undefined;

      logger.info(
        `[Readability] Successfully extracted: ${article.title} (${cleanContent.length} chars)`
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return this.createErrorResult(url, errorMessage);
    }
  }

  /**
   * Detect common paywall indicators
   */
  private detectPaywall(html: string): boolean {
    const paywallIndicators = [
      "paywall",
      "subscriber-only",
      "premium-content",
      "members-only",
      "subscription-required",
      "login-required",
      "register-to-read",
    ];

    const lowerHtml = html.toLowerCase();
    return paywallIndicators.some((indicator) => lowerHtml.includes(indicator));
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

    // Try first image in content
    const firstImage = document.querySelector("img");
    if (firstImage) {
      const imageUrl = firstImage.getAttribute("src");
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
export const readabilityExtractor = new ReadabilityExtractor();

