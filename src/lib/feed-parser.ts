import Parser from "rss-parser";
import { createHash } from "crypto";
import { decode as decodeHtmlEntities } from "he";
import * as iconv from "iconv-lite";

// Ensure Parser is available
if (!Parser) {
  throw new Error("rss-parser module not loaded correctly");
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
 * Feed parser configuration
 * Supports both RSS 2.0 and Atom 1.0 feeds
 */
const PARSER_CONFIG = {
  timeout: 30000, // 30 seconds
  maxRedirects: 5,
  headers: {
    "User-Agent": "NeuReed/1.0 (RSS/Atom Reader)",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
    "Accept-Charset": "utf-8",
  },
  customFields: {
    feed: [
      "subtitle", // Atom feed subtitle
      "image",    // RSS feed image
      "logo",     // Atom feed logo
      "icon",     // Atom feed icon
    ],
    item: [
      // Media enclosures
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      // Content fields (RSS)
      ["content:encoded", "contentEncoded"],
      ["description", "description"],
      // Atom-specific fields
      ["summary", "summary"],
      ["content", "content"],
      // Author fields
      ["dc:creator", "creator"],
      ["author", "author"],
    ],
  },
  defaultRSS: 2.0,
  xml2js: {
    normalize: true,
    normalizeTags: true,
    trim: true,
  },
};

/**
 * Initialize RSS parser with custom configuration
 */
const parser = new Parser(PARSER_CONFIG);

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
    const feed = await parser.parseString(xmlContent);

    // Extract and ensure imageUrl is a string
    let imageUrl = extractFeedImage(feed);
    
    // Extra safety: if somehow an array got through, take first element
    if (Array.isArray(imageUrl)) {
      imageUrl = imageUrl[0];
    }

    return {
      title: feed.title || "Untitled Feed",
      description: (feed.description as string) || (feed.subtitle as string) || undefined,
      link: feed.link || undefined,
      imageUrl: imageUrl,
      items: feed.items.map((item) => parseArticle(item)),
    };
  } catch (error) {
    if (error instanceof Error) {
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
      console.error("Invalid protocol:", urlObj.protocol);
      return false;
    }

    // Try to parse the feed with encoding handling
    console.log("Attempting to parse feed:", url);
    const xmlContent = await fetchFeedWithEncoding(url);
    const result = await parser.parseString(xmlContent);
    console.log("Feed parsed successfully:", result.title);
    return true;
  } catch (error) {
    console.error("Feed validation error:", error);
    return false;
  }
}

/**
 * Parse a single feed item into an article
 * Handles both RSS and Atom item formats
 */
function parseArticle(item: Parser.Item): ParsedArticle {
  // Extract content (prefer content:encoded over description)
  const content = extractContent(item);
  
  // Extract excerpt
  const excerpt = extractExcerpt(item, content);
  
  // Extract image
  const imageUrl = extractArticleImage(item, content);
  
  // Parse published date (Atom uses isoDate, RSS uses pubDate)
  // If no date is provided, use current time as fallback
  let publishedAt: Date | undefined;
  if (item.isoDate) {
    publishedAt = new Date(item.isoDate);
  } else if (item.pubDate) {
    publishedAt = new Date(item.pubDate);
  } else {
    // Fallback to current time if no date is provided by the feed
    // This ensures articles always have a timestamp for sorting
    publishedAt = new Date();
  }

  // Extract author (handle both RSS and Atom formats)
  const author = extractAuthor(item);

  // Decode HTML entities from all text fields
  const decodedTitle = item.title ? decodeHtmlEntities(item.title) : "Untitled";
  const decodedContent = content ? decodeHtmlEntities(content) : "";
  const decodedExcerpt = excerpt ? decodeHtmlEntities(excerpt) : undefined;
  const decodedAuthor = author ? decodeHtmlEntities(author) : undefined;

  // Generate fallback URL if link is missing (Atom uses id as fallback)
  const link = item.link || (item.guid && item.guid.startsWith('http') ? item.guid : undefined) || (item as any).id;
  
  return {
    title: decodedTitle,
    link: link || "",
    guid: item.guid || (item as any).id || undefined,
    content: sanitizeHtml(decodedContent),
    excerpt: decodedExcerpt ? sanitizeHtml(decodedExcerpt) : undefined,
    author: decodedAuthor || undefined,
    // Always include publishedAt (validated or fallback to current time)
    publishedAt: publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : new Date(),
    imageUrl,
  };
}

/**
 * Extract author from feed item
 * Handles both RSS (dc:creator, author) and Atom (author) formats
 */
function extractAuthor(item: Parser.Item): string | undefined {
  const customItem = item as Parser.Item & {
    creator?: string;
    author?: string | { name?: string; email?: string };
    "dc:creator"?: string;
  };

  // Try dc:creator first (Dublin Core, common in RSS)
  if (customItem["dc:creator"]) {
    return customItem["dc:creator"];
  }
  
  // Try creator field
  if (customItem.creator) {
    return customItem.creator;
  }
  
  // Handle Atom author object format
  if (customItem.author) {
    if (typeof customItem.author === "string") {
      return customItem.author;
    } else if (customItem.author.name) {
      return customItem.author.name;
    } else if (customItem.author.email) {
      return customItem.author.email;
    }
  }
  
  return undefined;
}

/**
 * Extract content from feed item (prefer content:encoded over description)
 * Handles both RSS (content:encoded, description) and Atom (content, summary) formats
 */
function extractContent(item: Parser.Item): string {
  const customItem = item as Parser.Item & {
    contentEncoded?: string;
    "content:encoded"?: string;
    content?: string;
    summary?: string;
  };

  // Priority: content:encoded > contentEncoded > content > description > summary
  return (
    customItem["content:encoded"] ||
    customItem.contentEncoded ||
    customItem.content ||
    item.content ||
    item.contentSnippet ||
    customItem.summary ||
    item.summary ||
    ""
  );
}

/**
 * Extract excerpt from feed item
 */
function extractExcerpt(item: Parser.Item, content: string): string | undefined {
  // If description is different from content, use it as excerpt
  if (item.contentSnippet && item.contentSnippet !== content) {
    return item.contentSnippet.substring(0, 500);
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
 * Supports both RSS (image) and Atom (logo/icon) formats
 */
function extractFeedImage(feed: Parser.Output<unknown>): string | undefined {
  const customFeed = feed as Parser.Output<unknown> & {
    image?: { url?: string; link?: string } | string | string[];
    logo?: string | string[];  // Atom feed logo
    icon?: string | string[];  // Atom feed icon
    itunes?: { image?: string | string[] };
  };

  // Handle different image formats
  let imageUrl: string | undefined;

  // Try RSS image first
  if (typeof customFeed.image === "string") {
    imageUrl = customFeed.image;
  } else if (Array.isArray(customFeed.image)) {
    imageUrl = customFeed.image[0];
  } else if (customFeed.image?.url) {
    imageUrl = customFeed.image.url;
  }
  
  // Try Atom logo
  if (!imageUrl && customFeed.logo) {
    if (Array.isArray(customFeed.logo)) {
      imageUrl = customFeed.logo[0];
    } else {
      imageUrl = customFeed.logo;
    }
  }
  
  // Try Atom icon
  if (!imageUrl && customFeed.icon) {
    if (Array.isArray(customFeed.icon)) {
      imageUrl = customFeed.icon[0];
    } else {
      imageUrl = customFeed.icon;
    }
  }
  
  // Try iTunes image
  if (!imageUrl && customFeed.itunes?.image) {
    if (Array.isArray(customFeed.itunes.image)) {
      imageUrl = customFeed.itunes.image[0];
    } else {
      imageUrl = customFeed.itunes.image;
    }
  }

  return imageUrl;
}

/**
 * Extract image URL from article
 */
function extractArticleImage(item: Parser.Item, content: string): string | undefined {
  const customItem = item as Parser.Item & {
    mediaContent?: { $?: { url?: string } };
    mediaThumbnail?: { $?: { url?: string } };
    enclosure?: { url?: string; type?: string };
  };

  // Check media:content
  if (customItem.mediaContent?.$?.url) {
    return customItem.mediaContent.$.url;
  }

  // Check media:thumbnail
  if (customItem.mediaThumbnail?.$?.url) {
    return customItem.mediaThumbnail.$.url;
  }

  // Check enclosure (if it's an image)
  if (
    customItem.enclosure?.url &&
    customItem.enclosure.type?.startsWith("image/")
  ) {
    return customItem.enclosure.url;
  }

  // Check item.enclosure (standard format)
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image/")) {
    return item.enclosure.url;
  }

  // Extract from content
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

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, "");

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

