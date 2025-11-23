import { parseStringPromise, Builder } from "xml2js";
import type { feeds, categories } from "@/generated/prisma/client";

/**
 * Represents a parsed feed from OPML
 */
export interface OPMLFeed {
  title: string;
  xmlUrl: string;
  htmlUrl?: string;
  description?: string;
  type?: string;
  categories: string[];
}

/**
 * Represents a parsed OPML structure
 */
export interface ParsedOPML {
  title?: string;
  dateCreated?: Date;
  feeds: OPMLFeed[];
}

/**
 * Feed with category information for export
 */
export interface FeedWithCategories extends feeds {
  feed_categories?: Array<{
    categories: categories;
  }>;
}

/**
 * Parse OPML XML string and extract feeds with their categories
 */
export async function parseOPML(xmlString: string): Promise<ParsedOPML> {
  try {
    const result = await parseStringPromise(xmlString, {
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true,
    });

    if (!result.opml) {
      throw new Error("Invalid OPML file: missing opml root element");
    }

    const opml = result.opml;
    const head = opml.head || {};
    const body = opml.body || {};

    const feeds: OPMLFeed[] = [];

    // Recursive function to extract feeds from outline elements
    const extractFeeds = (outline: any, parentCategories: string[] = []) => {
      if (!outline) return;

      // Handle single outline or array of outlines
      const outlines = Array.isArray(outline) ? outline : [outline];

      for (const item of outlines) {
        // If outline has xmlUrl, it's a feed
        if (item.xmlUrl) {
          feeds.push({
            title: item.title || item.text || "Untitled Feed",
            xmlUrl: item.xmlUrl,
            htmlUrl: item.htmlUrl || item.url,
            description: item.description,
            type: item.type || "rss",
            categories: [...parentCategories],
          });
        } else if (item.text || item.title) {
          // If no xmlUrl but has text/title, it's a category
          const categoryName = item.text || item.title;
          const newCategories = [...parentCategories, categoryName];

          // Recursively process nested outlines
          if (item.outline) {
            extractFeeds(item.outline, newCategories);
          }
        } else if (item.outline) {
          // Outline without text/title but with children
          extractFeeds(item.outline, parentCategories);
        }
      }
    };

    // Start extraction from body outlines
    if (body.outline) {
      extractFeeds(body.outline);
    }

    return {
      title: head.title,
      dateCreated: head.dateCreated ? new Date(head.dateCreated) : undefined,
      feeds,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse OPML: ${error.message}`);
    }
    throw new Error("Failed to parse OPML: Unknown error");
  }
}

/**
 * Generate OPML XML from feeds
 */
export async function generateOPML(
  feeds: FeedWithCategories[],
  options: {
    title?: string;
    ownerName?: string;
    ownerEmail?: string;
  } = {}
): Promise<string> {
  // Group feeds by category
  const categoryMap = new Map<string, FeedWithCategories[]>();
  const uncategorizedFeeds: FeedWithCategories[] = [];

  for (const feed of feeds) {
    const categories = feed.feed_categories?.map((fc) => fc.categories.name) || [];

    if (categories.length === 0) {
      uncategorizedFeeds.push(feed);
    } else {
      // For feeds with multiple categories, add to each category
      for (const categoryName of categories) {
        const existing = categoryMap.get(categoryName) || [];
        existing.push(feed);
        categoryMap.set(categoryName, existing);
      }
    }
  }

  // Build outline structure
  const outlines: any[] = [];

  // Add categorized feeds
  for (const [categoryName, categoryFeeds] of categoryMap.entries()) {
    const categoryOutline = {
      $: {
        text: categoryName,
        title: categoryName,
      },
      outline: categoryFeeds.map((feed) => ({
        $: {
          type: "rss",
          text: feed.name,
          title: feed.name,
          xmlUrl: feed.url,
          htmlUrl: feed.siteUrl || undefined,
          description: feed.description || undefined,
        },
      })),
    };
    outlines.push(categoryOutline);
  }

  // Add uncategorized feeds
  for (const feed of uncategorizedFeeds) {
    outlines.push({
      $: {
        type: "rss",
        text: feed.name,
        title: feed.name,
        xmlUrl: feed.url,
        htmlUrl: feed.siteUrl || undefined,
        description: feed.description || undefined,
      },
    });
  }

  // Build OPML structure
  const opmlObject = {
    opml: {
      $: {
        version: "2.0",
      },
      head: {
        title: options.title || "Feed Subscriptions",
        dateCreated: new Date().toUTCString(),
        ...(options.ownerName && { ownerName: options.ownerName }),
        ...(options.ownerEmail && { ownerEmail: options.ownerEmail }),
      },
      body: {
        outline: outlines,
      },
    },
  };

  // Generate XML
  const builder = new Builder({
    xmldec: { version: "1.0", encoding: "UTF-8" },
    renderOpts: { pretty: true, indent: "  " },
  });

  return builder.buildObject(opmlObject);
}

/**
 * Validate OPML structure
 */
export function validateOPMLStructure(xmlString: string): {
  valid: boolean;
  error?: string;
} {
  try {
    // Basic XML validation
    if (!xmlString.trim().startsWith("<?xml") && !xmlString.trim().startsWith("<opml")) {
      return { valid: false, error: "Not a valid XML document" };
    }

    if (!xmlString.includes("<opml") || !xmlString.includes("</opml>")) {
      return { valid: false, error: "Missing OPML root element" };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown validation error",
    };
  }
}

/**
 * Extract feed URLs from OPML without full parsing
 * Useful for quick preview
 */
export async function extractFeedUrls(xmlString: string): Promise<string[]> {
  try {
    const parsed = await parseOPML(xmlString);
    return parsed.feeds.map((feed) => feed.xmlUrl);
  } catch (error) {
    throw new Error("Failed to extract feed URLs from OPML");
  }
}

/**
 * Count feeds in OPML without full parsing
 */
export async function countFeedsInOPML(xmlString: string): Promise<number> {
  try {
    const parsed = await parseOPML(xmlString);
    return parsed.feeds.length;
  } catch (error) {
    return 0;
  }
}

