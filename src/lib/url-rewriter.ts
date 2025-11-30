/**
 * URL Rewriting Utility
 *
 * Rewrites URLs in HTML content to convert relative URLs to absolute URLs
 * and proxy external resources through our API endpoint.
 */

import { JSDOM } from "jsdom";

/**
 * Rewrite URLs in HTML content
 *
 * @param html - The HTML content to process
 * @param baseUrl - The base URL of the original page
 * @param proxyEndpoint - The proxy endpoint URL (e.g., "/api/proxy")
 * @returns HTML with rewritten URLs
 */
export function rewriteUrls(html: string, baseUrl: string, proxyEndpoint: string = "/api/proxy"): string {
  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Convert base URL to URL object for easier manipulation
    const base = new URL(baseUrl);

    /**
     * Convert a relative or absolute URL to an absolute URL
     */
    function toAbsoluteUrl(url: string | null): string | null {
      if (!url) return null;

      // Skip data: URLs, javascript: URLs, mailto:, tel:, etc.
      if (url.startsWith("data:") ||
          url.startsWith("javascript:") ||
          url.startsWith("mailto:") ||
          url.startsWith("tel:") ||
          url.startsWith("#")) {
        return url;
      }

      try {
        // Convert to absolute URL
        const absoluteUrl = new URL(url, base);
        return absoluteUrl.href;
      } catch {
        // If URL parsing fails, return original
        return url;
      }
    }

    /**
     * Proxy a resource URL through our endpoint
     */
    function proxyResourceUrl(url: string | null): string | null {
      if (!url) return null;

      const absoluteUrl = toAbsoluteUrl(url);
      if (!absoluteUrl) return url;

      // Don't proxy data: URLs or special schemes
      if (absoluteUrl.startsWith("data:") ||
          absoluteUrl.startsWith("javascript:") ||
          absoluteUrl.startsWith("mailto:") ||
          absoluteUrl.startsWith("tel:") ||
          absoluteUrl.startsWith("#")) {
        return absoluteUrl;
      }

      // Proxy through our endpoint
      return `${proxyEndpoint}?url=${encodeURIComponent(absoluteUrl)}&type=resource`;
    }

    // Rewrite <img src="...">
    document.querySelectorAll("img[src]").forEach((img) => {
      const src = img.getAttribute("src");
      const proxiedSrc = proxyResourceUrl(src);
      if (proxiedSrc) {
        img.setAttribute("src", proxiedSrc);
      }
    });

    // Rewrite <img srcset="...">
    document.querySelectorAll("img[srcset]").forEach((img) => {
      const srcset = img.getAttribute("srcset");
      if (srcset) {
        const rewrittenSrcset = srcset
          .split(",")
          .map((entry) => {
            const [url, descriptor] = entry.trim().split(/\s+/);
            if (!url) return '';
            const proxiedUrl = proxyResourceUrl(url);
            return descriptor ? `${proxiedUrl} ${descriptor}` : proxiedUrl;
          })
          .filter(Boolean)
          .join(", ");
        img.setAttribute("srcset", rewrittenSrcset);
      }
    });

    // Rewrite <link href="..."> (CSS, icons, etc.)
    document.querySelectorAll("link[href]").forEach((link) => {
      const href = link.getAttribute("href");
      const rel = link.getAttribute("rel");

      // Proxy stylesheets and icons
      if (rel && (rel.includes("stylesheet") || rel.includes("icon"))) {
        const proxiedHref = proxyResourceUrl(href);
        if (proxiedHref) {
          link.setAttribute("href", proxiedHref);
        }
      } else {
        // For other links, just make them absolute
        const absoluteHref = toAbsoluteUrl(href);
        if (absoluteHref) {
          link.setAttribute("href", absoluteHref);
        }
      }
    });

    // Rewrite <script src="...">
    document.querySelectorAll("script[src]").forEach((script) => {
      const src = script.getAttribute("src");
      const proxiedSrc = proxyResourceUrl(src);
      if (proxiedSrc) {
        script.setAttribute("src", proxiedSrc);
      }
    });

    // Rewrite <a href="...">
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      const absoluteHref = toAbsoluteUrl(href);
      if (absoluteHref) {
        a.setAttribute("href", absoluteHref);
        // Make external links open in new tab
        if (!absoluteHref.startsWith(base.origin)) {
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
        }
      }
    });

    // Rewrite <source src="..."> (for video/audio)
    document.querySelectorAll("source[src]").forEach((source) => {
      const src = source.getAttribute("src");
      const proxiedSrc = proxyResourceUrl(src);
      if (proxiedSrc) {
        source.setAttribute("src", proxiedSrc);
      }
    });

    // Rewrite <video src="..."> and <audio src="...">
    document.querySelectorAll("video[src], audio[src]").forEach((media) => {
      const src = media.getAttribute("src");
      const proxiedSrc = proxyResourceUrl(src);
      if (proxiedSrc) {
        media.setAttribute("src", proxiedSrc);
      }
    });

    // Rewrite inline styles with url()
    document.querySelectorAll("[style]").forEach((element) => {
      const style = element.getAttribute("style");
      if (style && style.includes("url(")) {
        const rewrittenStyle = style.replace(/url\(['"]?([^'"\)]+)['"]?\)/gi, (match, url) => {
          const proxiedUrl = proxyResourceUrl(url);
          return `url("${proxiedUrl}")`;
        });
        element.setAttribute("style", rewrittenStyle);
      }
    });

    // Rewrite CSS in <style> tags
    document.querySelectorAll("style").forEach((styleTag) => {
      let css = styleTag.textContent || "";
      if (css.includes("url(")) {
        css = css.replace(/url\(['"]?([^'"\)]+)['"]?\)/gi, (match, url) => {
          const proxiedUrl = proxyResourceUrl(url);
          return `url("${proxiedUrl}")`;
        });
        styleTag.textContent = css;
      }
    });

    // Remove any existing <base> tag to prevent URL resolution issues
    // The <base> tag would cause our /api/proxy URLs to be resolved incorrectly
    const existingBase = document.querySelector("base");
    if (existingBase) {
      existingBase.remove();
    }

    // Inject script to communicate iframe height to parent
    const heightScript = document.createElement("script");
    heightScript.textContent = `
      (function() {
        function updateHeight() {
          const height = Math.max(
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight,
            document.body.scrollHeight,
            document.body.offsetHeight
          );
          window.parent.postMessage({ type: 'iframe-height', height: height }, '*');
        }

        // Update height when page loads
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', updateHeight);
        } else {
          updateHeight();
        }

        // Update height when images load
        window.addEventListener('load', updateHeight);

        // Update height periodically for dynamic content
        setInterval(updateHeight, 1000);
      })();
    `;
    document.body?.appendChild(heightScript);

    return dom.serialize();
  } catch (error) {
    console.error("Error rewriting URLs:", error);
    // Return original HTML if rewriting fails
    return html;
  }
}

/**
 * Extract and resolve the base URL from HTML content
 * Checks for <base> tag, falls back to provided baseUrl
 */
export function extractBaseUrl(html: string, defaultBase: string): string {
  try {
    const dom = new JSDOM(html);
    const baseTag = dom.window.document.querySelector("base[href]");
    if (baseTag) {
      const baseHref = baseTag.getAttribute("href");
      if (baseHref) {
        // Resolve base href relative to default base
        return new URL(baseHref, defaultBase).href;
      }
    }
  } catch (error) {
    // Ignore errors, use default
  }
  return defaultBase;
}
