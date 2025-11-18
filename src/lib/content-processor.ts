/**
 * Content processing utilities for articles
 */

/**
 * Process article content for display
 * - Sanitize HTML
 * - Convert relative URLs to absolute
 * - Add target="_blank" to external links
 * - Process images
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
 */
function processImages(html: string): string {
  return html.replace(
    /<img\s+([^>]*?)>/gi,
    (match, attributes) => {
      let newAttributes = attributes;

      // Add loading="lazy" if not present
      if (!/loading\s*=/i.test(attributes)) {
        newAttributes += ' loading="lazy"';
      }

      // Add alt text if not present
      if (!/alt\s*=/i.test(attributes)) {
        newAttributes += ' alt=""';
      }

      return `<img ${newAttributes}>`;
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

