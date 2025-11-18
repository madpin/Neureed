/**
 * Content extraction types and interfaces
 */

/**
 * Configuration for content extraction
 */
export interface ExtractorConfig {
  /** Cookies to use for authentication (raw format) */
  cookies?: string;
  /** Custom HTTP headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Custom CSS selector for content extraction */
  customSelector?: string;
  /** User agent string */
  userAgent?: string;
}

/**
 * Result of content extraction
 */
export interface ExtractedContent {
  /** Article title */
  title: string;
  /** Main content (HTML) */
  content: string;
  /** Short excerpt or summary */
  excerpt?: string;
  /** Article author */
  author?: string;
  /** Publication date */
  publishedAt?: Date;
  /** Featured image URL */
  imageUrl?: string;
  /** Whether extraction was successful */
  success: boolean;
  /** Extraction method used */
  method: string;
  /** Error message if extraction failed */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Content extractor interface
 * All extractors must implement this interface
 */
export interface ContentExtractor {
  /** Unique name of the extractor */
  name: string;
  
  /** Priority (higher = preferred, default = 50) */
  priority?: number;
  
  /**
   * Check if this extractor can handle the given URL
   * @param url - URL to check
   * @param config - Optional configuration
   * @returns True if extractor can handle this URL
   */
  canHandle(url: string, config?: ExtractorConfig): Promise<boolean>;
  
  /**
   * Extract content from URL
   * @param url - URL to extract from
   * @param config - Extraction configuration
   * @returns Extracted content
   */
  extract(url: string, config?: ExtractorConfig): Promise<ExtractedContent>;
}

/**
 * Extraction method types
 */
export type ExtractionMethod = "rss" | "readability" | "playwright" | "custom";

/**
 * Cookie storage format
 */
export interface CookieStore {
  /** Cookie format */
  format: "json" | "netscape" | "header" | "raw";
  /** Encrypted cookie value */
  value: string;
  /** Cookie expiration date */
  expiresAt?: Date;
  /** Cookie domain */
  domain?: string;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Content merge strategy
 */
export type ContentMergeStrategy = "replace" | "prepend" | "append";

/**
 * Extraction settings stored in Feed.settings
 */
export interface ExtractionSettings {
  /** Extraction method to use */
  method: ExtractionMethod;
  /** Whether authentication is required */
  requiresAuth: boolean;
  /** How to merge extracted content with RSS content */
  contentMergeStrategy?: ContentMergeStrategy;
  /** Encrypted cookies */
  cookies?: CookieStore;
  /** Custom HTTP headers */
  headers?: Record<string, string>;
  /** Custom CSS selector for content */
  customSelector?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Last test timestamp */
  lastTestedAt?: Date;
  /** Last test status */
  lastTestStatus?: "success" | "failed" | "pending";
  /** Last test error message */
  lastTestError?: string;
}

/**
 * Parsed cookie object
 */
export interface ParsedCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

/**
 * Extraction test result
 */
export interface ExtractionTestResult {
  success: boolean;
  method: string;
  title?: string;
  contentPreview?: string;
  error?: string;
  duration: number;
  timestamp: Date;
}

/**
 * Extractor performance metrics
 */
export interface ExtractorMetrics {
  extractorName: string;
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  averageDuration: number;
  lastUsed: Date;
}

