/**
 * Content processing utilities for articles
 */

/**
 * Process article content for display
 * - Sanitize HTML
 * - Convert relative URLs to absolute
 * - Add target="_blank" to external links
 * - Process images
 * - Link plain text URLs
 * - Embed YouTube videos
 */
export function processArticleContent(
  content: string,
  baseUrl: string
): string {
  let processed = content?.trim() ?? "";

  if (!processed) {
    return "";
  }

  if (!isLikelyHtml(processed)) {
    processed = formatPlainTextContent(processed);
  }

  // Convert relative URLs to absolute
  processed = resolveRelativeUrls(processed, baseUrl);

  // Add target="_blank" to all links
  processed = addTargetBlankToLinks(processed);

  // Process images (lazy loading, etc.)
  processed = processImages(processed);

  // Link plain text URLs in HTML content
  processed = linkifyHtmlContent(processed);

  // Embed YouTube videos
  processed = embedYouTubeVideos(processed);

  return processed;
}

/**
 * Convert relative URLs to absolute URLs
 */
function resolveRelativeUrls(html: string, baseUrl: string): string {
  try {
    const base = new URL(baseUrl);

    // Process href attributes
    html = html.replace(
      /href=["']([^"']+)["']/gi,
      (match, url) => {
        try {
          const absoluteUrl = new URL(url, base).toString();
          return `href="${absoluteUrl}"`;
        } catch {
          return match;
        }
      }
    );

    // Process src attributes
    html = html.replace(
      /src=["']([^"']+)["']/gi,
      (match, url) => {
        try {
          const absoluteUrl = new URL(url, base).toString();
          return `src="${absoluteUrl}"`;
        } catch {
          return match;
        }
      }
    );

    return html;
  } catch {
    return html;
  }
}

/**
 * Add target="_blank" and rel="noopener noreferrer" to all links
 */
function addTargetBlankToLinks(html: string): string {
  return html.replace(
    /<a\s+([^>]*?)>/gi,
    (match, attributes) => {
      // Check if target already exists
      if (/target\s*=/i.test(attributes)) {
        return match;
      }
      return `<a ${attributes} target="_blank" rel="noopener noreferrer">`;
    }
  );
}

/**
 * Process images (add lazy loading, alt text, etc.)
 * Handles img tags with srcset, sizes, and other complex attributes
 * Also handles multi-line img tags and fixes broken img tags
 */
function processImages(html: string): string {
  // First, fix broken img tags where the closing > appears too early
  // This handles cases where srcset/sizes attributes appear as text after the img tag
  html = fixBrokenImageTags(html);

  // Use a more robust regex that handles multi-line attributes and special characters
  // [\s\S] matches any character including newlines
  return html.replace(
    /<img\s+([\s\S]*?)>/gi,
    (match, attributes) => {
      // Normalize whitespace in attributes (collapse multiple spaces/newlines to single space)
      let newAttributes = attributes.replace(/\s+/g, ' ').trim();

      // Add loading="lazy" if not present
      if (!/loading\s*=/i.test(newAttributes)) {
        newAttributes += ' loading="lazy"';
      }

      // Add alt text if not present
      if (!/alt\s*=/i.test(newAttributes)) {
        newAttributes += ' alt=""';
      }

      return `<img ${newAttributes}>`;
    }
  );
}

/**
 * Fix broken img tags where attributes appear outside the tag
 * Example: <img src="..."> srcset="..." sizes="..." becomes <img src="..." srcset="..." sizes="">
 */
function fixBrokenImageTags(html: string): string {
  // Match img tag followed immediately by orphaned attributes (srcset, sizes, etc.)
  // This pattern looks for: <img ...> followed by attribute-like text
  return html.replace(
    /(<img\s+[^>]*?)>\s*((?:(?:srcset|sizes|width|height|style|class|id|data-[\w-]+)\s*=\s*["'][^"']*["']\s*)+)/gi,
    (match, imgTag, orphanedAttrs) => {
      // Move the orphaned attributes inside the img tag
      return `${imgTag} ${orphanedAttrs.trim()}>`;
    }
  );
}

/**
 * Determine if content likely already contains HTML structure
 */
function isLikelyHtml(content: string): boolean {
  const htmlTagPattern = /<\/?(?:[a-z][a-z0-9]*)\b[^>]*>/i;
  return htmlTagPattern.test(content);
}

/**
 * Format plain text content into semantic HTML blocks safely
 */
function formatPlainTextContent(content: string): string {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  const blocks: string[] = [];

  let paragraphBuffer: string[] = [];
  let listBuffer: { type: "ul" | "ol"; items: string[] } | null = null;
  let codeBlock: { language?: string; lines: string[] } | null = null;

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    const text = paragraphBuffer.join(" ").replace(/\s+/g, " ").trim();
    if (text) {
      blocks.push(`<p>${formatInlineText(text)}</p>`);
    }
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (!listBuffer || !listBuffer.items.length) {
      listBuffer = null;
      return;
    }
    const items = listBuffer.items.map((item) => `<li>${item}</li>`).join("");
    blocks.push(`<${listBuffer.type}>${items}</${listBuffer.type}>`);
    listBuffer = null;
  };

  const flushCodeBlock = () => {
    if (!codeBlock) return;
    const codeHtml = escapeHtml(codeBlock.lines.join("\n"));
    const languageAttr = codeBlock.language
      ? ` data-language="${escapeAttribute(codeBlock.language)}"`
      : "";
    blocks.push(`<pre><code${languageAttr}>${codeHtml}</code></pre>`);
    codeBlock = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmedLine = rawLine.trim();

    if (codeBlock) {
      if (trimmedLine.startsWith("```")) {
        flushCodeBlock();
        continue;
      }
      codeBlock.lines.push(rawLine);
      continue;
    }

    if (trimmedLine.startsWith("```")) {
      flushParagraph();
      flushList();
      codeBlock = {
        language: trimmedLine.slice(3).trim() || undefined,
        lines: [],
      };
      continue;
    }

    if (!trimmedLine) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = Math.min(6, headingMatch[1].length);
      blocks.push(`<h${level}>${formatInlineText(headingMatch[2].trim())}</h${level}>`);
      continue;
    }

    if (trimmedLine.startsWith(">")) {
      flushParagraph();
      flushList();
      const quoteLines: string[] = [];
      let j = i;
      while (j < lines.length) {
        const current = lines[j].trim();
        if (!current.startsWith(">")) break;
        quoteLines.push(current.replace(/^>\s?/, ""));
        j++;
      }
      blocks.push(
        `<blockquote><p>${formatInlineText(
          quoteLines.join(" ").trim()
        )}</p></blockquote>`
      );
      i = j - 1;
      continue;
    }

    const bulletMatch = trimmedLine.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      flushParagraph();
      if (!listBuffer || listBuffer.type !== "ul") {
        flushList();
        listBuffer = { type: "ul", items: [] };
      }
      listBuffer.items.push(formatInlineText(bulletMatch[1].trim()));
      continue;
    }

    const orderedMatch = trimmedLine.match(/^(\d+)[.)]\s+(.+)/);
    if (orderedMatch) {
      flushParagraph();
      if (!listBuffer || listBuffer.type !== "ol") {
        flushList();
        listBuffer = { type: "ol", items: [] };
      }
      listBuffer.items.push(formatInlineText(orderedMatch[2].trim()));
      continue;
    }

    paragraphBuffer.push(trimmedLine);
  }

  flushParagraph();
  flushList();
  flushCodeBlock();

  return blocks.join("\n");
}

/**
 * Format inline text by escaping, linking URLs, and supporting inline code
 */
function formatInlineText(text: string): string {
  if (!text) return "";
  const segments = text.split(/`([^`]+)`/g);
  let result = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isCode = i % 2 === 1;

    if (isCode) {
      result += `<code>${escapeHtml(segment)}</code>`;
    } else {
      result += autoLinkText(segment);
    }
  }

  return result;
}

/**
 * Escape HTML and convert URLs into safe anchor tags
 */
function autoLinkText(text: string): string {
  const urlPattern = /(https?:\/\/[^\s<]+)/gi;
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlPattern.exec(text)) !== null) {
    const [url] = match;
    const start = match.index;
    const end = start + url.length;

    result += escapeHtml(text.slice(lastIndex, start));

    const safeHref = escapeAttribute(url);
    const safeLabel = escapeHtml(url);
    result += `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`;

    lastIndex = end;
  }

  result += escapeHtml(text.slice(lastIndex));
  return result;
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape attribute values
 */
function escapeAttribute(text: string): string {
  return escapeHtml(text).replace(/`/g, "&#96;");
}

/**
 * Generate excerpt from HTML content
 * @param html - HTML content
 * @param maxLength - Maximum length of excerpt
 * @returns Plain text excerpt
 */
export function generateExcerpt(html: string, maxLength = 200): string {
  // Remove HTML tags
  const plainText = html.replace(/<[^>]*>/g, " ");

  // Remove extra whitespace
  const cleaned = plainText.replace(/\s+/g, " ").trim();

  // Truncate to max length
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Find last space before max length
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
}

/**
 * Estimate reading time in minutes
 * @param content - Article content (HTML or plain text)
 * @returns Estimated reading time in minutes
 */
export function estimateReadingTime(content: string): number {
  const plainText = content.replace(/<[^>]*>/g, "");
  const words = plainText.trim().split(/\s+/).length;
  const wordsPerMinute = 200;
  const minutes = Math.ceil(words / wordsPerMinute);
  return Math.max(1, minutes); // At least 1 minute
}

/**
 * Calculate content length (word count)
 * @param content - Article content
 * @returns Word count
 */
export function calculateWordCount(content: string): number {
  const plainText = content.replace(/<[^>]*>/g, "");
  return plainText.trim().split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Strip all HTML tags from content
 * @param html - HTML content
 * @returns Plain text
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Validate content length
 * @param content - Content to validate
 * @param minLength - Minimum length in characters
 * @param maxLength - Maximum length in characters
 * @returns True if valid, false otherwise
 */
export function validateContentLength(
  content: string,
  minLength = 10,
  maxLength = 1000000
): boolean {
  const length = content.length;
  return length >= minLength && length <= maxLength;
}

/**
 * Convert plain text URLs in HTML to clickable links
 * @param html - HTML content
 * @returns HTML with linkified URLs
 */
export function linkifyHtmlContent(html: string): string {
  // URL pattern that matches http:// and https:// URLs not already in href or src attributes
  // This regex looks for URLs that are NOT preceded by href=" or src="
  const urlPattern = /(?<!href="|src="|href='|src=')(https?:\/\/[^\s<>"']+)(?![^<]*<\/a>)/gi;
  
  return html.replace(urlPattern, (url) => {
    // Remove trailing punctuation that might be part of the sentence
    let cleanUrl = url;
    const trailingPunctuation = /[.,;:!?)]$/;
    let suffix = '';
    
    while (trailingPunctuation.test(cleanUrl)) {
      suffix = cleanUrl[cleanUrl.length - 1] + suffix;
      cleanUrl = cleanUrl.slice(0, -1);
    }
    
    const safeHref = escapeAttribute(cleanUrl);
    const safeLabel = escapeHtml(cleanUrl);
    
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>${suffix}`;
  });
}

/**
 * Embed YouTube videos from URLs
 * @param html - HTML content
 * @returns HTML with embedded YouTube videos
 */
export function embedYouTubeVideos(html: string): string {
  // YouTube URL patterns
  const youtubePatterns = [
    // youtube.com/watch?v=VIDEO_ID
    /(?:https?:)?\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&\?][^\s<]*)?/gi,
    // youtu.be/VIDEO_ID
    /(?:https?:)?\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:[&\?][^\s<]*)?/gi,
    // youtube.com/embed/VIDEO_ID
    /(?:https?:)?\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:[&\?][^\s<]*)?/gi,
  ];

  let processed = html;

  for (const pattern of youtubePatterns) {
    processed = processed.replace(pattern, (match, videoId) => {
      // Don't embed if already in an iframe
      const beforeMatch = processed.substring(0, processed.indexOf(match));
      if (beforeMatch.includes('<iframe') && !beforeMatch.includes('</iframe>')) {
        return match;
      }

      // Create responsive YouTube embed
      const embedHtml = `
        <div class="youtube-embed-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1.5rem 0;">
          <iframe
            src="https://www.youtube.com/embed/${videoId}"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            loading="lazy"
          ></iframe>
        </div>
        <p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">
          Original: <a href="${match}" target="_blank" rel="noopener noreferrer">${match}</a>
        </p>
      `;

      return embedHtml;
    });
  }

  return processed;
}

