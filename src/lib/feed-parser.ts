import { parseFeed as parseRawFeed } from "@rowanmanning/feed-parser";
import { createHash } from "crypto";
import { decode as decodeHtmlEntities } from "he";
import * as iconv from "iconv-lite";
import { filterPlaceholderImage, extractFirstValidImageFromHtml } from "./image-utils";

/**
 * Type definitions for @rowanmanning/feed-parser
 */
interface RawFeed {
  title?: string;
  description?: string;
  url?: string;
  language?: string;
  image?: {
    url?: string;
    title?: string;
  };
  categories?: Array<{
    term?: string;
    label?: string;
  }>;
  items: RawFeedItem[];
}

interface RawFeedItem {
  title?: string;
  url?: string;
  id?: string;
  description?: string;
  content?: string;
  published?: Date;
  updated?: Date;
  authors?: Array<{
    name?: string;
    email?: string;
    url?: string;
  }>;
  categories?: Array<{
    term?: string;
    label?: string;
  }>;
  media?: Array<{
    url?: string;
    image?: string;
    type?: string;
    mimeType?: string;
    title?: string;
    length?: number;
  }>;
  // Image from media:thumbnail, itunes:image, or media:content
  image?: {
    url?: string;
    title?: string;
  };
}

/**
 * Fetch options for conditional requests (ETag/Last-Modified caching)
 */
export interface FetchOptions {
  etag?: string;
  lastModified?: string;
}

/**
 * Fetch result with caching headers
 */
export interface FetchResult {
  content: string;
  etag?: string;
  lastModified?: string;
  notModified: boolean;
}

/**
 * Feed parser timeout configuration
 */
const FETCH_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

/**
 * Fetch and decode feed with proper encoding handling
 * Supports both RSS and Atom feeds, conditional requests, timeouts, and retries
 */
async function fetchFeedWithEncoding(
  url: string,
  options?: FetchOptions
): Promise<FetchResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
      
      const headers: Record<string, string> = {
        "User-Agent": "NeuReed/1.0 (RSS/Atom Reader; +https://github.com/neureed)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.1",
      };
      
      // Add conditional request headers for bandwidth optimization
      if (options?.etag) {
        headers["If-None-Match"] = options.etag;
      }
      if (options?.lastModified) {
        headers["If-Modified-Since"] = options.lastModified;
      }
      
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Handle 304 Not Modified
      if (response.status === 304) {
        return {
          content: "",
          etag: response.headers.get("etag") || options?.etag,
          lastModified: response.headers.get("last-modified") || options?.lastModified,
          notModified: true,
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      // Try to detect encoding from XML declaration or Content-Type header
      const contentType = response.headers.get("content-type") || "";
      let encoding = 'utf-8';
      
      // Check Content-Type header first
      const charsetMatch = contentType.match(/charset=([^;\s]+)/i);
      if (charsetMatch && charsetMatch[1]) {
        encoding = charsetMatch[1].toLowerCase().replace(/["']/g, '');
      } else {
        // Fall back to XML declaration
        const firstBytes = uint8Array.slice(0, 200);
        const asciiText = new TextDecoder('ascii').decode(firstBytes);
        const encodingMatch = asciiText.match(/encoding=["']([^"']+)["']/i);
        if (encodingMatch && encodingMatch[1]) {
          encoding = encodingMatch[1].toLowerCase();
        }
      }
      
      // Normalize encoding names and decode
      const content = decodeWithEncoding(uint8Array, encoding);
      
      return {
        content,
        etag: response.headers.get("etag") || undefined,
        lastModified: response.headers.get("last-modified") || undefined,
        notModified: false,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on abort (timeout) or client errors
      if (lastError.name === 'AbortError') {
        throw new Error(`Feed fetch timeout after ${FETCH_TIMEOUT}ms`);
      }
      
      // Retry on network errors
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
        continue;
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch feed');
}

/**
 * Decode buffer with specified encoding
 */
function decodeWithEncoding(uint8Array: Uint8Array, encoding: string): string {
  // Normalize encoding names
  const normalizedEncoding = encoding.toLowerCase().replace(/-/g, '');
  
  // Map common encoding aliases
  const encodingMap: Record<string, string> = {
    'latin1': 'iso-8859-1',
    'iso88591': 'iso-8859-1',
    'windows1252': 'windows-1252',
    'cp1252': 'windows-1252',
    'iso885915': 'iso-8859-15',
    'utf8': 'utf-8',
  };
  
  const targetEncoding = encodingMap[normalizedEncoding] || encoding;
  
  // Use iconv-lite for non-UTF-8 encodings
  if (targetEncoding !== 'utf-8' && iconv.encodingExists(targetEncoding)) {
    return iconv.decode(Buffer.from(uint8Array), targetEncoding);
  }
  
  // Default to UTF-8
  return new TextDecoder('utf-8').decode(uint8Array);
}

/**
 * Parsed feed data structure
 */
export interface ParsedFeed {
  title: string;
  description?: string;
  link?: string;
  language?: string;
  imageUrl?: string;
  categories?: string[];
  items: ParsedArticle[];
  // Caching headers for conditional requests
  etag?: string;
  lastModified?: string;
}

/**
 * Parsed article data structure
 */
export interface ParsedArticle {
  title: string;
  link: string;
  guid?: string;
  content: string;
  excerpt?: string;
  author?: string;
  publishedAt?: Date;
  imageUrl?: string;
  categories?: string[];
}

/**
 * Parse an RSS 2.0 or Atom 1.0 feed from a URL
 * @param url - The feed URL to parse
 * @param options - Optional fetch options for conditional requests
 * @returns Parsed feed data with articles, or null if not modified (304)
 * @throws Error if feed cannot be parsed or fetched
 */
export async function parseFeedUrl(
  url: string,
  options?: FetchOptions
): Promise<ParsedFeed | null> {
  try {
    // Fetch with proper encoding handling, timeout, and retries
    const result = await fetchFeedWithEncoding(url, options);
    
    // Return null for 304 Not Modified responses
    if (result.notModified) {
      return null;
    }
    
    const feed = parseRawFeed(result.content) as RawFeed;

    // Extract and ensure imageUrl is a string
    let imageUrl = extractFeedImage(feed);
    
    // Extra safety: if somehow an array got through, take first element
    if (Array.isArray(imageUrl)) {
      imageUrl = imageUrl[0];
    }
    
    // Extract categories
    const categories = feed.categories
      ?.map(cat => cat.label || cat.term)
      .filter((c): c is string => !!c);

    return {
      title: feed.title || "Untitled Feed",
      description: feed.description || undefined,
      link: feed.url || undefined,
      language: feed.language || undefined,
      imageUrl: imageUrl,
      categories: categories?.length ? categories : undefined,
      items: feed.items.map((item) => parseArticle(item)),
      etag: result.etag,
      lastModified: result.lastModified,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific INVALID_FEED error from @rowanmanning/feed-parser
      if ((error as any).code === 'INVALID_FEED') {
        throw new Error(`Failed to parse feed: Invalid feed format`);
      }
      throw new Error(`Failed to parse feed: ${error.message}`);
    }
    throw new Error("Failed to parse feed: Unknown error");
  }
}

/**
 * Validate if a URL is a valid RSS/Atom feed
 * @param url - The feed URL to validate
 * @returns True if valid feed, false otherwise
 */
export async function validateFeedUrl(url: string): Promise<boolean> {
  try {
    // Basic URL validation
    const urlObj = new URL(url);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return false;
    }

    // Try to parse the feed with encoding handling
    const result = await fetchFeedWithEncoding(url);
    if (result.notModified || !result.content) {
      return false;
    }
    parseRawFeed(result.content) as RawFeed;
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a URL looks like an image based on extension
 */
function looksLikeImageUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    return imageExtensions.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * Parse a single feed item into an article
 * Handles both RSS and Atom item formats
 */
function parseArticle(item: RawFeedItem): ParsedArticle {
  // Extract content (prefer content over description)
  const content = extractContent(item);
  
  // Extract excerpt
  const excerpt = extractExcerpt(item, content);
  
  // Extract image
  const imageUrl = extractArticleImage(item, content);
  
  // Parse published date
  // Dates are parsed with their timezone offset and converted to UTC for storage
  // If no date is provided, use current time as fallback
  let publishedAt: Date | undefined;
  if (item.published) {
    publishedAt = new Date(item.published);
  } else if (item.updated) {
    publishedAt = new Date(item.updated);
  } else {
    // Fallback to current time if no date is provided by the feed
    // This ensures articles always have a timestamp for sorting
    publishedAt = new Date();
  }
  
  // Validate the parsed date - if invalid, use current time
  if (publishedAt && isNaN(publishedAt.getTime())) {
    publishedAt = new Date();
  }

  // Extract author (handle both RSS and Atom formats)
  const author = extractAuthor(item);
  
  // Extract categories/tags
  const categories = item.categories
    ?.map(cat => cat.label || cat.term)
    .filter((c): c is string => !!c);

  // Decode HTML entities from all text fields
  const decodedTitle = item.title ? decodeHtmlEntities(item.title) : "Untitled";
  const decodedContent = content ? decodeHtmlEntities(content) : "";
  const decodedExcerpt = excerpt ? decodeHtmlEntities(excerpt) : undefined;
  const decodedAuthor = author ? decodeHtmlEntities(author) : undefined;

  // Generate fallback URL if link is missing (use id as fallback)
  const link = item.url || (item.id && item.id.startsWith('http') ? item.id : undefined);
  
  return {
    title: decodedTitle,
    link: link || "",
    guid: item.id || undefined,
    content: sanitizeHtml(decodedContent),
    excerpt: decodedExcerpt ? sanitizeHtml(decodedExcerpt) : undefined,
    author: decodedAuthor || undefined,
    // publishedAt is already validated above and guaranteed to be a valid Date
    publishedAt,
    imageUrl,
    categories: categories?.length ? categories : undefined,
  };
}

/**
 * Extract author from feed item
 * Handles both RSS and Atom formats
 */
function extractAuthor(item: RawFeedItem): string | undefined {
  // @rowanmanning/feed-parser provides authors as an array
  if (item.authors && item.authors.length > 0) {
    const firstAuthor = item.authors[0];
    if (firstAuthor) {
      if (firstAuthor.name) {
        return firstAuthor.name;
      } else if (firstAuthor.email) {
        return firstAuthor.email;
      }
    }
  }

  return undefined;
}

/**
 * Extract content from feed item (prefer content over description)
 * Handles both RSS and Atom formats
 */
function extractContent(item: RawFeedItem): string {
  // @rowanmanning/feed-parser provides content and description
  // Prefer content (which includes content:encoded from RSS) over description
  const rawContent = item.content || item.description || "";
  
  // Format plain text CDATA content with paragraph breaks
  return formatPlainTextContent(rawContent);
}

/**
 * Break long CDATA/plain text into paragraphs by adding HTML breaks after sentence boundaries.
 * Only applies if the text has no existing line breaks or HTML tags (typical of CDATA blocks).
 * Converts sentence breaks to <br><br> for proper HTML display.
 */
function formatPlainTextContent(text: string): string {
  // Skip if already has line breaks or HTML tags
  if (text.includes('\n') || text.includes('\r') || /<[a-z][\s\S]*>/i.test(text)) {
    return text;
  }
  
  // Common abbreviations that shouldn't trigger a line break
  const abbreviations = [
    'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr', 'Rev', 'Gen', 'Col', 'Lt', 'Sgt',
    'St', 'Ave', 'Blvd', 'Rd', 'Inc', 'Corp', 'Ltd', 'Co', 'vs', 'etc', 'al',
    'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    'Fig', 'No', 'Vol', 'pp', 'ed', 'trans', 'approx', 'est', 'min', 'max'
  ];
  
  // Build regex pattern: sentence-ending punctuation followed by space and capital letter
  // BUT NOT after single capital letter (initials like "J. K.") or known abbreviations
  return text.replace(/([.!?])\s+([A-Z])/g, (match, punct, nextChar, offset) => {
    // Get the word before the punctuation
    const textBefore = text.substring(0, offset as number);
    const wordBeforeMatch = textBefore.match(/(\S+)$/);
    const wordBefore = wordBeforeMatch?.[1] ?? '';
    
    // Don't break after single capital letter (initials like "J." or "A.")
    if (/^[A-Z]$/.test(wordBefore)) {
      return match;
    }
    
    // Don't break after common abbreviations
    if (abbreviations.some(abbr => wordBefore.toLowerCase() === abbr.toLowerCase())) {
      return match;
    }
    
    // This looks like a real sentence boundary
    return `${punct}<br><br>${nextChar}`;
  });
}

/**
 * Extract excerpt from feed item
 */
function extractExcerpt(item: RawFeedItem, content: string): string | undefined {
  // If description is different from content, use it as excerpt
  if (item.description && item.description !== content) {
    const processed = formatPlainTextContent(item.description);
    return processed.substring(0, 500);
  }

  // Otherwise, generate excerpt from content
  const plainText = content.replace(/<[^>]*>/g, "").trim();
  if (plainText.length > 200) {
    return plainText.substring(0, 200) + "...";
  }

  return plainText || undefined;
}

/**
 * Extract image URL from feed metadata
 * Supports both RSS and Atom formats
 * Filters out placeholder images
 */
function extractFeedImage(feed: RawFeed): string | undefined {
  // @rowanmanning/feed-parser provides image as an object with url
  if (feed.image?.url) {
    return filterPlaceholderImage(feed.image.url);
  }
  
  return undefined;
}

/**
 * Extract image URL from article
 * Filters out placeholder images and prioritizes real images
 */
function extractArticleImage(item: RawFeedItem, content: string): string | undefined {
  // Collect all candidate images
  const candidates: (string | undefined)[] = [];
  
  // 1. Check item.image first (includes media:thumbnail, itunes:image, media:content images)
  // This is the primary source for article header images
  if (item.image?.url) {
    candidates.push(item.image.url);
  }

  // 2. Check media array for image types (enclosures and media:content)
  if (item.media && item.media.length > 0) {
    // First, check for media items with explicit image property (thumbnails)
    for (const media of item.media) {
      if (media.image) {
        candidates.push(media.image);
      }
    }
    // Then, find image media items by type or mimeType
    for (const media of item.media) {
      const isImage = media.type === "image" || 
                      media.mimeType?.startsWith("image/") ||
                      media.type?.startsWith("image");
      if (media.url && isImage) {
        candidates.push(media.url);
      }
    }
    // Only use untyped media if URL looks like an image
    const firstMedia = item.media[0];
    if (firstMedia?.url && looksLikeImageUrl(firstMedia.url)) {
      candidates.push(firstMedia.url);
    }
  }

  // 3. Extract from content as fallback - use the new function that filters placeholders
  const contentImage = extractFirstValidImageFromHtml(content);
  if (contentImage) {
    candidates.push(contentImage);
  }

  // Return the first non-placeholder image
  for (const candidate of candidates) {
    const filtered = filterPlaceholderImage(candidate);
    if (filtered) {
      return filtered;
    }
  }
  
  return undefined;
}

/**
 * Extract first image URL from HTML content
 * @param html - HTML content to search
 * @returns First image URL found, or null
 * @deprecated Use extractFirstValidImageFromHtml from image-utils.ts instead
 */
export function extractImageFromContent(html: string): string | null {
  // Use the new function that filters out placeholder images
  return extractFirstValidImageFromHtml(html);
}

/**
 * Generate a hash of content for deduplication
 * @param content - Content to hash
 * @returns SHA-256 hash of content
 */
export function generateContentHash(content: string): string {
  return createHash("sha256").update(content.trim()).digest("hex");
}

/**
 * Sanitize HTML content (basic sanitization)
 * Removes dangerous tags and attributes
 * @param html - HTML to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Remove script tags and their content (use [\s\S] to match across newlines)
  let sanitized = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");

  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[\s\S]*?<\/style>/gi, "");

  // Remove event handlers (onclick, onerror, etc.)
  // Be more careful to only match within tag boundaries
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>"']+/gi, "");

  // Remove javascript: protocol from href and src attributes
  sanitized = sanitized.replace(/(href|src)\s*=\s*["']javascript:[^"']*["']/gi, "");

  // Remove data: protocol with text/html (can be used for XSS)
  sanitized = sanitized.replace(/(src)\s*=\s*["']data:text\/html[^"']*["']/gi, "");

  // Remove data attributes with long values (typically contain JSON for widgets)
  // This helps clean up embedded product data and tracking information
  sanitized = sanitized.replace(/\s+data-[\w-]+\s*=\s*["'][^"']{200,}["']/gi, "");

  return sanitized.trim();
}

/**
 * Normalize feed URL (remove tracking parameters, normalize format)
 * @param url - URL to normalize
 * @returns Normalized URL
 */
export function normalizeFeedUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Remove common tracking parameters
    const trackingParams = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    trackingParams.forEach((param) => urlObj.searchParams.delete(param));
    
    return urlObj.toString();
  } catch {
    return url;
  }
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
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Check if a URL is safe to fetch (prevent SSRF attacks)
 * @param url - URL to check
 * @returns True if safe, false otherwise
 */
export function isSafeFeedUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Only allow HTTP and HTTPS
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return false;
    }

    // Block private IP ranges
    const hostname = urlObj.hostname.toLowerCase();
    
    // Block localhost
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return false;
    }

    // Block private IPv4 ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = hostname.match(ipv4Regex);
    if (ipv4Match && ipv4Match[1] && ipv4Match[2] && ipv4Match[3] && ipv4Match[4]) {
      const a = Number(ipv4Match[1]);
      const b = Number(ipv4Match[2]);
      const c = Number(ipv4Match[3]);
      const d = Number(ipv4Match[4]);

      // 10.0.0.0/8
      if (a === 10) return false;

      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) return false;

      // 192.168.0.0/16
      if (a === 192 && b === 168) return false;

      // 169.254.0.0/16 (link-local)
      if (a === 169 && b === 254) return false;
    }

    // Block private IPv6 ranges
    if (hostname.includes(":")) {
      // Block fc00::/7 (unique local addresses)
      if (hostname.startsWith("fc") || hostname.startsWith("fd")) {
        return false;
      }
      // Block fe80::/10 (link-local)
      if (hostname.startsWith("fe8") || hostname.startsWith("fe9") || 
          hostname.startsWith("fea") || hostname.startsWith("feb")) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

