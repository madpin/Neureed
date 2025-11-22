import { parseFeed as parseRawFeed } from "@rowanmanning/feed-parser";
import { createHash } from "crypto";
import { decode as decodeHtmlEntities } from "he";
import * as iconv from "iconv-lite";

/**
 * Type definitions for @rowanmanning/feed-parser
 */
interface RawFeed {
  title?: string;
  description?: string;
  url?: string;
  image?: {
    url?: string;
    title?: string;
  };
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
  media?: Array<{
    url?: string;
    type?: string;
    title?: string;
  }>;
}

/**
 * Fetch and decode feed with proper encoding handling
 * Supports both RSS and Atom feeds
 */
async function fetchFeedWithEncoding(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "NeuReed/1.0 (RSS/Atom Reader)",
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  
  // Try to detect encoding from XML declaration
  const firstBytes = uint8Array.slice(0, 200);
  const asciiText = new TextDecoder('ascii').decode(firstBytes);
  const encodingMatch = asciiText.match(/encoding=["']([^"']+)["']/i);
  
  let encoding = 'utf-8';
  if (encodingMatch) {
    encoding = encodingMatch[1].toLowerCase();
  }
  
  // Convert to UTF-8 if needed
  if (encoding === 'iso-8859-1' || encoding === 'latin1') {
    return iconv.decode(Buffer.from(uint8Array), 'iso-8859-1');
  } else if (encoding === 'windows-1252') {
    return iconv.decode(Buffer.from(uint8Array), 'windows-1252');
  } else {
    // Assume UTF-8
    return new TextDecoder('utf-8').decode(uint8Array);
  }
}

/**
 * Parsed feed data structure
 */
export interface ParsedFeed {
  title: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  items: ParsedArticle[];
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
}

/**
 * Feed parser timeout configuration
 */
const FETCH_TIMEOUT = 30000; // 30 seconds

/**
 * Parse an RSS 2.0 or Atom 1.0 feed from a URL
 * @param url - The feed URL to parse
 * @returns Parsed feed data with articles
 * @throws Error if feed cannot be parsed or fetched
 */
export async function parseFeedUrl(url: string): Promise<ParsedFeed> {
  try {
    // Fetch with proper encoding handling
    const xmlContent = await fetchFeedWithEncoding(url);
    const feed = parseRawFeed(xmlContent) as RawFeed;

    // Extract and ensure imageUrl is a string
    let imageUrl = extractFeedImage(feed);
    
    // Extra safety: if somehow an array got through, take first element
    if (Array.isArray(imageUrl)) {
      imageUrl = imageUrl[0];
    }

    return {
      title: feed.title || "Untitled Feed",
      description: feed.description || undefined,
      link: feed.url || undefined,
      imageUrl: imageUrl,
      items: feed.items.map((item) => parseArticle(item)),
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
    const xmlContent = await fetchFeedWithEncoding(url);
    const result = parseRawFeed(xmlContent) as RawFeed;
    return true;
  } catch (error) {
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
    if (firstAuthor.name) {
      return firstAuthor.name;
    } else if (firstAuthor.email) {
      return firstAuthor.email;
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
  return item.content || item.description || "";
}

/**
 * Extract excerpt from feed item
 */
function extractExcerpt(item: RawFeedItem, content: string): string | undefined {
  // If description is different from content, use it as excerpt
  if (item.description && item.description !== content) {
    return item.description.substring(0, 500);
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
 */
function extractFeedImage(feed: RawFeed): string | undefined {
  // @rowanmanning/feed-parser provides image as an object with url
  if (feed.image?.url) {
    return feed.image.url;
  }
  
  return undefined;
}

/**
 * Extract image URL from article
 */
function extractArticleImage(item: RawFeedItem, content: string): string | undefined {
  // Check media array (includes enclosures and media:content)
  if (item.media && item.media.length > 0) {
    // Find first image media item
    for (const media of item.media) {
      if (media.url && media.type?.startsWith("image/")) {
        return media.url;
      }
    }
    // If no explicit image type, use first media with URL
    if (item.media[0].url) {
      return item.media[0].url;
    }
  }

  // Extract from content as fallback
  return extractImageFromContent(content) || undefined;
}

/**
 * Extract first image URL from HTML content
 * @param html - HTML content to search
 * @returns First image URL found, or null
 */
export function extractImageFromContent(html: string): string | null {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
  const match = html.match(imgRegex);
  return match ? match[1] : null;
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
    if (ipv4Match) {
      const [, a, b, c, d] = ipv4Match.map(Number);
      
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

