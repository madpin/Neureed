import { createHandler } from "@/lib/api-handler";
import { isSafeFeedUrl } from "@/lib/feed-parser";
import { rewriteUrls, extractBaseUrl } from "@/lib/url-rewriter";
import { NextResponse } from "next/server";
import { z } from "zod";

// Simple in-memory cache
const cache = new Map<string, { content: string; contentType: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const RESOURCE_CACHE_TTL = 15 * 60 * 1000; // 15 minutes for static resources
const MAX_CACHE_SIZE = 100; // Max number of cached entries
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB limit

// Clean expired cache entries
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > RESOURCE_CACHE_TTL) {
      cache.delete(key);
    }
  }
}

// LRU eviction if cache is too large
function enforceCacheSizeLimit() {
  if (cache.size > MAX_CACHE_SIZE) {
    // Remove oldest 20% of entries
    const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.2);
    const sortedEntries = Array.from(cache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );
    for (let i = 0; i < entriesToRemove; i++) {
      const entry = sortedEntries[i];
      if (entry) {
        cache.delete(entry[0]);
      }
    }
  }
}

const proxySchema = z.object({
  url: z.string().url("Invalid URL format"),
  type: z.enum(["html", "resource"]).optional().default("html"),
});

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export const GET = createHandler(
  async ({ query }) => {
    const { url, type } = query;

    // Security: Validate URL to prevent SSRF attacks
    if (!isSafeFeedUrl(url)) {
      throw new Error("Invalid or unsafe URL. Cannot access private networks or local resources.");
    }

    // Check cache
    const cacheKey = `${type}:${url}`;
    const cached = cache.get(cacheKey);
    const ttl = type === "resource" ? RESOURCE_CACHE_TTL : CACHE_TTL;

    if (cached && Date.now() - cached.timestamp < ttl) {
      return new NextResponse(cached.content, {
        headers: {
          "Content-Type": cached.contentType,
          "X-Proxied-From": url,
          "X-Cache": "HIT",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NeuReed/1.0; +https://neureed.com)",
          Accept:
            type === "html"
              ? "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
              : "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content size
      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
        throw new Error("Response too large");
      }

      const contentType = response.headers.get("content-type") || "application/octet-stream";

      // Handle HTML content with URL rewriting
      if (type === "html" && contentType.includes("text/html")) {
        let html = await response.text();

        // Check size after fetching
        if (html.length > MAX_RESPONSE_SIZE) {
          throw new Error("Response too large");
        }

        // Extract base URL from HTML (in case there's a <base> tag)
        const baseUrl = extractBaseUrl(html, url);

        // Rewrite URLs
        html = rewriteUrls(html, baseUrl, "/api/proxy");

        // Cache the result
        cache.set(cacheKey, {
          content: html,
          contentType: "text/html; charset=utf-8",
          timestamp: Date.now(),
        });

        // Clean cache periodically
        if (Math.random() < 0.1) {
          // 10% chance
          cleanCache();
          enforceCacheSizeLimit();
        }

        return new NextResponse(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Proxied-From": url,
            "X-Cache": "MISS",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      // Handle resources (CSS, JS, images, etc.)
      if (type === "resource") {
        // For resources, we need to handle them appropriately
        const buffer = await response.arrayBuffer();

        // Check size
        if (buffer.byteLength > MAX_RESPONSE_SIZE) {
          throw new Error("Resource too large");
        }

        // For CSS, we might need to rewrite URLs in it too
        if (contentType.includes("text/css")) {
          let css = new TextDecoder().decode(buffer);

          // Rewrite url() references in CSS
          const urlPattern = /url\(['"]?([^'"\)]+)['"]?\)/gi;
          css = css.replace(urlPattern, (match, resourceUrl) => {
            try {
              // Make absolute
              const absoluteUrl = new URL(resourceUrl, url).href;
              // Proxy through our endpoint
              const proxiedUrl = `/api/proxy?url=${encodeURIComponent(absoluteUrl)}&type=resource`;
              return `url("${proxiedUrl}")`;
            } catch {
              return match; // Keep original if URL parsing fails
            }
          });

          // Cache CSS
          cache.set(cacheKey, {
            content: css,
            contentType: contentType,
            timestamp: Date.now(),
          });

          return new NextResponse(css, {
            headers: {
              "Content-Type": contentType,
              "X-Proxied-From": url,
              "X-Cache": "MISS",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          });
        }

        // For other resources (images, JS, fonts, etc.), return as-is
        // Cache binary content as base64 string
        const base64 = Buffer.from(buffer).toString("base64");
        cache.set(cacheKey, {
          content: base64,
          contentType: contentType,
          timestamp: Date.now(),
        });

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": contentType,
            "X-Proxied-From": url,
            "X-Cache": "MISS",
            "Cache-Control": "public, max-age=3600", // Cache resources for 1 hour
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      // Fallback: return as-is
      const content = await response.text();
      return new NextResponse(content, {
        headers: {
          "Content-Type": contentType,
          "X-Proxied-From": url,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Request timeout: The website took too long to respond");
        }
        throw error;
      }

      throw new Error("Failed to fetch content from URL");
    }
  },
  {
    querySchema: proxySchema,
    requireAuth: true, // Require authentication to use proxy
  }
);
