import { prisma } from "@/lib/db";
import { generateContentHash } from "@/lib/feed-parser";
import type { articles } from "@/generated/prisma/client";
import type { ParsedArticle } from "@/lib/feed-parser";

/**
 * Find duplicate article by GUID, URL, or content hash
 */
export async function findDuplicateArticle(
  article: ParsedArticle,
  feedId: string
): Promise<articles | null> {
  // Strategy 1: Check by GUID (most reliable)
  if (article.guid) {
    const byGuid = await prisma.articles.findFirst({
      where: {
        feedId,
        guid: article.guid,
      },
    });
    if (byGuid) return byGuid;
  }

  // Strategy 2: Check by URL (secondary method)
  if (article.link) {
    const byUrl = await prisma.articles.findFirst({
      where: {
        url: article.link,
      },
    });
    if (byUrl) return byUrl;
  }

  // Strategy 3: Check by content hash (for articles without GUID)
  if (!article.guid && article.content) {
    const contentHash = generateContentHash(article.content);
    const byHash = await prisma.articles.findFirst({
      where: {
        feedId,
        contentHash,
      },
    });
    if (byHash) return byHash;
  }

  return null;
}

/**
 * Determine if an article should be updated
 * Returns true if content has changed significantly
 */
export async function shouldUpdateArticle(
  existing: articles,
  parsed: ParsedArticle
): Promise<boolean> {
  // Check if content hash has changed
  const newContentHash = generateContentHash(parsed.content);
  
  if (existing.contentHash && existing.contentHash !== newContentHash) {
    return true;
  }

  // Check if title has changed
  if (existing.title !== parsed.title) {
    return true;
  }

  // Check if published date has changed significantly
  if (parsed.publishedAt && existing.publishedAt) {
    const timeDiff = Math.abs(
      parsed.publishedAt.getTime() - existing.publishedAt.getTime()
    );
    // If difference is more than 1 minute, consider it changed
    if (timeDiff > 60000) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate similarity score between two articles (0-1)
 * Used for detecting near-duplicates
 */
export function calculateSimilarity(article1: string, article2: string): number {
  // Simple Jaccard similarity based on words
  const words1 = new Set(
    article1.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  );
  const words2 = new Set(
    article2.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  );

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  if (union.size === 0) return 0;

  return intersection.size / union.size;
}

/**
 * Check if two articles are near-duplicates
 * Returns true if similarity is above threshold
 */
export function areNearDuplicates(
  article1: string,
  article2: string,
  threshold = 0.8
): boolean {
  const similarity = calculateSimilarity(article1, article2);
  return similarity >= threshold;
}

/**
 * Deduplicate a list of parsed articles
 * Returns unique articles only
 */
export function deduplicateParsedArticles(
  articles: ParsedArticle[]
): ParsedArticle[] {
  const seen = new Set<string>();
  const unique: ParsedArticle[] = [];

  for (const article of articles) {
    // Create a unique key based on GUID or URL
    const key = article.guid || article.link;
    
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(article);
  }

  return unique;
}

