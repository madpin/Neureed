/**
 * Semantic Search Service
 * Provides vector similarity search functionality
 */

import { prisma } from "@/src/lib/db";
import { logger } from "@/src/lib/logger";
import { generateEmbedding } from "./embedding-service";
import type { Article, Feed } from "@prisma/client";
import type { EmbeddingProvider } from "@/src/lib/embeddings/types";

export interface SearchResult extends Article {
  similarity: number;
  feed?: Feed;
}

export interface SemanticSearchOptions {
  limit?: number;
  minScore?: number;
  feedIds?: string[];
  since?: Date;
  until?: Date;
}

/**
 * Search for similar articles using text query
 * Generates embedding for the query and finds similar articles
 */
export async function searchSimilarArticles(
  query: string,
  options: SemanticSearchOptions = {},
  provider?: EmbeddingProvider
): Promise<SearchResult[]> {
  const {
    limit = 10,
    minScore = 0.7,
    feedIds,
    since,
    until,
  } = options;

  try {
    // Generate embedding for the query
    const { embedding } = await generateEmbedding(query, provider);

    // Search by embedding
    return await searchByEmbedding(embedding, {
      limit,
      minScore,
      feedIds,
      since,
      until,
    });
  } catch (error) {
    logger.error("Semantic search failed", { error, query });
    throw error;
  }
}

/**
 * Search for articles by embedding vector
 * Uses pgvector's cosine distance operator (<=>)
 */
export async function searchByEmbedding(
  embedding: number[],
  options: SemanticSearchOptions = {}
): Promise<SearchResult[]> {
  const {
    limit = 10,
    minScore = 0.7,
    feedIds,
    since,
    until,
  } = options;

  try {
    // Build WHERE clause with parameterized conditions
    const embeddingStr = JSON.stringify(embedding);
    
    // Base query - exclude embedding column to avoid deserialization issues
    let query = `
      SELECT 
        id, "feedId", title, content, url, guid, author, excerpt, 
        "imageUrl", "contentHash", "publishedAt", "createdAt", "updatedAt",
        1 - (embedding <=> $1::vector) / 2 AS similarity
      FROM articles
      WHERE embedding IS NOT NULL
    `;

    const params: any[] = [embeddingStr];
    let paramIndex = 2;

    if (feedIds && feedIds.length > 0) {
      query += ` AND "feedId" = ANY($${paramIndex}::text[])`;
      params.push(feedIds);
      paramIndex++;
    }

    if (since) {
      query += ` AND "publishedAt" >= $${paramIndex}::timestamp`;
      params.push(since);
      paramIndex++;
    }

    if (until) {
      query += ` AND "publishedAt" <= $${paramIndex}::timestamp`;
      params.push(until);
      paramIndex++;
    }

    query += ` ORDER BY embedding <=> $1::vector LIMIT $${paramIndex}`;
    params.push(limit);

    // Execute query
    const results = await prisma.$queryRawUnsafe<Array<Article & { similarity: number }>>(
      query,
      ...params
    );

    // Filter by minimum score
    const filtered = results.filter((r) => r.similarity >= minScore);

    // Fetch feed data for each article
    const articleIds = filtered.map((r) => r.id);
    const articlesWithFeeds = await prisma.article.findMany({
      where: { id: { in: articleIds } },
      include: { feed: true },
    });

    // Merge feed data with similarity scores
    const resultsWithFeeds = filtered.map((result) => {
      const articleWithFeed = articlesWithFeeds.find((a) => a.id === result.id);
      return {
        ...result,
        feed: articleWithFeed?.feed,
      };
    }) as SearchResult[];

    logger.info("Semantic search completed", {
      totalResults: results.length,
      filteredResults: filtered.length,
      minScore,
    });

    return resultsWithFeeds;
  } catch (error) {
    logger.error("Embedding search failed", { error });
    throw error;
  }
}

/**
 * Find related articles for a given article
 * Uses the article's existing embedding
 */
export async function findRelatedArticles(
  articleId: string,
  options: Omit<SemanticSearchOptions, "feedIds"> & { excludeSameFeed?: boolean } = {}
): Promise<SearchResult[]> {
  const {
    limit = 10,
    minScore = 0.7,
    since,
    until,
    excludeSameFeed = false,
  } = options;

  try {
    // Check if article exists and has embedding using raw query
    // We need to use raw query because embedding is Unsupported type
    const articleCheck = await prisma.$queryRaw<Array<{ id: string; feedId: string; hasEmbedding: boolean }>>`
      SELECT id, "feedId", (embedding IS NOT NULL) as "hasEmbedding"
      FROM articles
      WHERE id = ${articleId}
    `;

    if (!articleCheck || articleCheck.length === 0) {
      throw new Error("Article not found");
    }

    const article = articleCheck[0];
    if (!article.hasEmbedding) {
      throw new Error("Article has no embedding");
    }

    // Now fetch the actual embedding using the article's embedding directly in the query
    // We don't need to deserialize it - we'll use it directly in the vector comparison
    
    // Build query using a subquery to get the source article's embedding
    // This avoids having to deserialize the embedding in Prisma
    let query = `
      SELECT 
        a.id, a."feedId", a.title, a.content, a.url, a.guid, a.author, a.excerpt, 
        a."imageUrl", a."contentHash", a."publishedAt", a."createdAt", a."updatedAt",
        1 - (a.embedding <=> source.embedding) / 2 AS similarity
      FROM articles a
      CROSS JOIN (SELECT embedding FROM articles WHERE id = $1) source
      WHERE a.embedding IS NOT NULL
        AND a.id != $1
    `;

    const params: any[] = [articleId];
    let paramIndex = 2;

    if (excludeSameFeed) {
      query += ` AND a."feedId" != $${paramIndex}`;
      params.push(article.feedId);
      paramIndex++;
    }

    if (since) {
      query += ` AND a."publishedAt" >= $${paramIndex}::timestamp`;
      params.push(since);
      paramIndex++;
    }

    if (until) {
      query += ` AND a."publishedAt" <= $${paramIndex}::timestamp`;
      params.push(until);
      paramIndex++;
    }

    query += ` ORDER BY a.embedding <=> source.embedding LIMIT $${paramIndex}`;
    params.push(limit);

    // Query for similar articles
    const results = await prisma.$queryRawUnsafe<Array<Article & { similarity: number }>>(
      query,
      ...params
    );

    // Filter by minimum score
    const filtered = results.filter((r) => r.similarity >= minScore);

    // Fetch feed data for each article
    const articleIds = filtered.map((r) => r.id);
    const articlesWithFeeds = await prisma.article.findMany({
      where: { id: { in: articleIds } },
      include: { feed: true },
    });

    // Merge feed data with similarity scores
    const resultsWithFeeds = filtered.map((result) => {
      const articleWithFeed = articlesWithFeeds.find((a) => a.id === result.id);
      return {
        ...result,
        feed: articleWithFeed?.feed,
      };
    }) as SearchResult[];

    logger.info("Found related articles", {
      articleId,
      totalResults: results.length,
      filteredResults: filtered.length,
    });

    return resultsWithFeeds;
  } catch (error) {
    logger.error("Failed to find related articles", { error, articleId });
    throw error;
  }
}

/**
 * Hybrid search: Combine semantic search with keyword search
 * Uses both vector similarity and text matching
 */
export async function hybridSearch(
  query: string,
  options: SemanticSearchOptions = {},
  provider?: EmbeddingProvider
): Promise<{
  semantic: SearchResult[];
  keyword: Article[];
  combined: SearchResult[];
}> {
  const { limit = 10, feedIds, since, until } = options;

  try {
    // Perform semantic search
    const semanticResults = await searchSimilarArticles(
      query,
      { limit, feedIds, since, until },
      provider
    );

    // Perform keyword search
    const keywordResults = await prisma.article.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
              { excerpt: { contains: query, mode: "insensitive" } },
            ],
          },
          feedIds && feedIds.length > 0 ? { feedId: { in: feedIds } } : {},
          since ? { publishedAt: { gte: since } } : {},
          until ? { publishedAt: { lte: until } } : {},
        ],
      },
      take: limit,
      orderBy: { publishedAt: "desc" },
    });

    // Combine results (semantic results take priority)
    const semanticIds = new Set(semanticResults.map((r) => r.id));
    const uniqueKeyword = keywordResults.filter((r) => !semanticIds.has(r.id));

    const combined = [
      ...semanticResults,
      ...uniqueKeyword.slice(0, limit - semanticResults.length).map((r) => ({
        ...r,
        similarity: 0.5, // Give keyword matches a default similarity score
      })),
    ];

    logger.info("Hybrid search completed", {
      query,
      semanticCount: semanticResults.length,
      keywordCount: keywordResults.length,
      combinedCount: combined.length,
    });

    return {
      semantic: semanticResults,
      keyword: keywordResults,
      combined,
    };
  } catch (error) {
    logger.error("Hybrid search failed", { error, query });
    throw error;
  }
}

/**
 * Get search suggestions based on partial query
 * Returns articles with titles matching the query
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 5
): Promise<Array<{ id: string; title: string; feedId: string }>> {
  if (query.length < 2) {
    return [];
  }

  try {
    const results = await prisma.article.findMany({
      where: {
        title: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        title: true,
        feedId: true,
      },
      take: limit,
      orderBy: {
        publishedAt: "desc",
      },
    });

    return results;
  } catch (error) {
    logger.error("Failed to get search suggestions", { error, query });
    return [];
  }
}

