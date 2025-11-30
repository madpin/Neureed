/**
 * Saved Search Execution Service
 *
 * Executes parsed queries against the article database.
 * Combines semantic search (embeddings) with keyword matching.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { parseQuery, extractTerms, type QueryNode } from "./search-query-parser";
import { searchSimilarArticles, type SemanticSearchOptions } from "./semantic-search-service";
import { generateEmbedding } from "./embedding-service";
import type { articles } from "@/generated/prisma/client";
import type { EmbeddingProvider } from "@/lib/embeddings/types";

export interface SearchResult {
  articleId: string;
  relevanceScore: number;  // 0.0 - 1.0
  matchedTerms: string[];
  matchReason: string;
}

export interface SearchOptions {
  userId: string;
  threshold?: number;
  recencyBias?: number;
  prioritySources?: string[];
  limit?: number;
  offset?: number;
  since?: Date;
  until?: Date;
  provider?: EmbeddingProvider;
}

/**
 * Article data required for matching operations
 */
interface ArticleForMatching {
  title: string;
  content: string;
  excerpt: string | null;
}

/**
 * Compute cosine similarity between two embeddings
 * Returns similarity score normalized to 0-1 range
 *
 * @param embedding1 - First embedding vector
 * @param embedding2 - Second embedding vector
 * @returns Similarity score (0-1), where 1 is identical and 0 is opposite
 */
function computeCosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error(`Embeddings must have same dimensions (got ${embedding1.length} and ${embedding2.length})`);
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    const val1 = embedding1[i];
    const val2 = embedding2[i];
    if (val1 === undefined || val2 === undefined) continue;

    dotProduct += val1 * val2;
    norm1 += val1 * val1;
    norm2 += val2 * val2;
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  // Cosine similarity ranges from -1 to 1, normalize to 0-1
  const cosineSim = dotProduct / (norm1 * norm2);
  return (cosineSim + 1) / 2;
}

/**
 * Calculate keyword matching score using TF-IDF-like approach
 */
function calculateKeywordScore(article: ArticleForMatching, terms: string[]): {
  score: number;
  matchedTerms: string[];
} {
  const matchedTerms: string[] = [];
  let totalScore = 0;

  const searchableText = `${article.title} ${article.excerpt || ''} ${article.content}`.toLowerCase();

  for (const term of terms) {
    const termLower = term.toLowerCase();

    // Count occurrences
    const regex = new RegExp(`\\b${termLower}\\b`, 'gi');
    const matches = searchableText.match(regex);
    const occurrences = matches ? matches.length : 0;

    if (occurrences > 0) {
      matchedTerms.push(term);

      // Calculate TF (term frequency) with logarithmic scaling
      const tf = 1 + Math.log(occurrences);

      // Give higher weight to title matches
      const titleMatches = article.title.toLowerCase().match(regex);
      const titleBoost = titleMatches ? 2.0 : 1.0;

      totalScore += tf * titleBoost;
    }
  }

  // Normalize score to 0-1 range
  const normalizedScore = Math.min(totalScore / (terms.length * 3), 1.0);

  return {
    score: normalizedScore,
    matchedTerms,
  };
}

/**
 * Evaluate boolean expression (AND/OR/NOT logic)
 */
function evaluateBoolean(
  ast: QueryNode,
  article: ArticleForMatching,
  semanticScore: number
): boolean {
  const searchableText = `${article.title} ${article.excerpt || ''} ${article.content}`.toLowerCase();

  function evaluate(node: QueryNode): boolean {
    switch (node.type) {
      case 'term':
        if (!node.value) return true;
        const termRegex = new RegExp(`\\b${node.value.toLowerCase()}\\b`, 'i');
        return termRegex.test(searchableText);

      case 'phrase':
        if (!node.value) return true;
        return searchableText.includes(node.value.toLowerCase());

      case 'and':
        if (!node.children || node.children.length === 0) return true;
        return node.children.every(evaluate);

      case 'or':
        if (!node.children || node.children.length === 0) return true;
        return node.children.some(evaluate);

      case 'not':
        if (!node.children || node.children.length === 0) return true;
        const notChild = node.children[0];
        if (!notChild) return true;
        return !evaluate(notChild);

      case 'group':
        if (!node.children || node.children.length === 0) return true;
        const groupChild = node.children[0];
        if (!groupChild) return true;
        return evaluate(groupChild);

      default:
        return true;
    }
  }

  return evaluate(ast);
}

/**
 * Generate explanation for why an article matched
 */
function generateMatchReason(
  article: ArticleForMatching,
  matchedTerms: string[],
  semanticScore: number,
  keywordScore: number,
  finalScore: number
): string {
  const reasons: string[] = [];

  if (matchedTerms.length > 0) {
    reasons.push(`Matched terms: ${matchedTerms.join(', ')}`);
  }

  if (semanticScore > 0.7) {
    reasons.push(`High semantic similarity (${(semanticScore * 100).toFixed(1)}%)`);
  } else if (semanticScore > 0.5) {
    reasons.push(`Moderate semantic similarity (${(semanticScore * 100).toFixed(1)}%)`);
  }

  if (keywordScore > 0.5) {
    reasons.push(`Strong keyword match (${(keywordScore * 100).toFixed(1)}%)`);
  }

  return reasons.length > 0
    ? reasons.join(' • ')
    : `Overall relevance: ${(finalScore * 100).toFixed(1)}%`;
}

/**
 * Execute a saved search query against the article database
 */
export async function executeSearch(
  query: string,
  options: SearchOptions
): Promise<SearchResult[]> {
  const {
    userId,
    threshold = 0.6,
    recencyBias = 0.0,
    prioritySources = [],
    limit = 50,
    offset = 0,
    since,
    until,
    provider,
  } = options;

  try {
    // Parse the query
    const parseResult = parseQuery(query);
    if (!parseResult.valid) {
      logger.error("Invalid query syntax", { query, errors: parseResult.errors });
      throw new Error(`Invalid query syntax: ${parseResult.errors.join(', ')}`);
    }

    // Extract terms for keyword matching
    const terms = extractTerms(parseResult.ast);

    // Calculate recency weight from recency bias
    const recencyWeight = Math.min(Math.max(recencyBias, 0), 1);

    // Perform semantic search using the full query
    const semanticSearchOptions: SemanticSearchOptions = {
      limit: limit * 3, // Get more results for filtering
      minScore: 0.3, // Lower threshold for initial retrieval
      feedIds: prioritySources.length > 0 ? prioritySources : undefined,
      since,
      until,
      recencyWeight,
      recencyDecayDays: 30,
    };

    const semanticResults = await searchSimilarArticles(
      query,
      semanticSearchOptions,
      provider
    );

    // Also get recent articles for keyword matching (if semantic search returns few results)
    let allArticles = semanticResults;

    if (semanticResults.length < limit) {
      // Fetch recent articles that weren't in semantic results
      const semanticIds = new Set(semanticResults.map(r => r.id));

      const whereClause: any = {
        id: { notIn: Array.from(semanticIds) },
      };

      if (prioritySources.length > 0) {
        whereClause.feedId = { in: prioritySources };
      }

      if (since) {
        whereClause.publishedAt = { ...whereClause.publishedAt, gte: since };
      }

      if (until) {
        whereClause.publishedAt = { ...whereClause.publishedAt, lte: until };
      }

      const additionalArticles = await prisma.articles.findMany({
        where: whereClause,
        orderBy: { publishedAt: 'desc' },
        take: limit * 2,
      });

      allArticles = [
        ...semanticResults,
        ...additionalArticles.map(a => ({ ...a, similarity: 0.3 })),
      ];
    }

    // Calculate combined scores for each article
    const results: SearchResult[] = [];

    for (const article of allArticles) {
      // Apply boolean filter
      const passesBoolean = evaluateBoolean(parseResult.ast, article, article.similarity || 0);
      if (!passesBoolean) {
        continue;
      }

      // Calculate keyword score
      const keywordResult = calculateKeywordScore(article, terms);

      // Combined score: weighted average of semantic and keyword scores
      const semanticScore = article.similarity || 0;
      const keywordScore = keywordResult.score;

      // Weight: 60% semantic, 40% keyword
      const semanticWeight = 0.6;
      const keywordWeight = 0.4;

      let combinedScore = semanticWeight * semanticScore + keywordWeight * keywordScore;

      // Apply recency multiplier if recency bias is enabled
      if (recencyBias > 0 && article.publishedAt) {
        const ageInDays = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
        const recencyMultiplier = 1 + recencyBias * Math.exp(-ageInDays / 30);
        combinedScore *= recencyMultiplier;
      }

      // Normalize to 0-1
      combinedScore = Math.min(combinedScore, 1.0);

      // Apply threshold
      if (combinedScore < threshold) {
        continue;
      }

      // Generate match reason
      const matchReason = generateMatchReason(
        article,
        keywordResult.matchedTerms,
        semanticScore,
        keywordScore,
        combinedScore
      );

      results.push({
        articleId: article.id,
        relevanceScore: combinedScore,
        matchedTerms: keywordResult.matchedTerms,
        matchReason,
      });
    }

    // Sort by relevance score (descending)
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limit);

    logger.info("Saved search executed", {
      query,
      userId,
      totalResults: results.length,
      returnedResults: paginatedResults.length,
      threshold,
    });

    return paginatedResults;
  } catch (error) {
    logger.error("Saved search execution failed", {
      error: error instanceof Error ? error.message : String(error),
      query,
      userId,
    });
    throw error;
  }
}

/**
 * Match a single article against a query
 * Used for matching new articles against existing saved searches
 *
 * @param articleId - Article ID to match
 * @param query - Query string (for keyword matching and boolean logic)
 * @param threshold - Minimum relevance score threshold (0-1)
 * @param provider - Optional embedding provider (only used if queryEmbedding not provided)
 * @param queryEmbedding - Optional pre-computed query embedding (for performance)
 * @returns SearchResult if match found above threshold, null otherwise
 */
export async function matchArticle(
  articleId: string,
  query: string,
  threshold: number,
  provider?: EmbeddingProvider,
  queryEmbedding?: number[]
): Promise<SearchResult | null> {
  try {
    // Fetch the article with its embedding in a single query
    const result = await prisma.$queryRaw<Array<{
      id: string;
      feedId: string;
      title: string;
      content: string;
      excerpt: string | null;
      url: string;
      guid: string;
      author: string | null;
      imageUrl: string | null;
      contentHash: string;
      publishedAt: Date;
      createdAt: Date;
      updatedAt: Date;
      embedding: string | null;
    }>>`
      SELECT
        id, "feedId", title, content, excerpt, url, guid, author,
        "imageUrl", "contentHash", "publishedAt", "createdAt", "updatedAt",
        embedding::text as embedding
      FROM articles
      WHERE id = ${articleId}
    `;

    const article = result[0];
    if (!article) {
      logger.warn("Article not found for matching", { articleId });
      return null;
    }

    // Parse the query
    const parseResult = parseQuery(query);
    if (!parseResult.valid) {
      logger.error("Invalid query syntax", { query, errors: parseResult.errors });
      return null;
    }

    // Extract terms for keyword matching
    const terms = extractTerms(parseResult.ast);

    // Calculate semantic score by computing cosine similarity directly
    let semanticScore = 0;

    if (article.embedding) {
      try {
        // Parse article embedding from pgvector format "[0.1,0.2,...]"
        const articleEmbedding = JSON.parse(article.embedding) as number[];

        // Get or generate query embedding
        let finalQueryEmbedding = queryEmbedding;
        if (!finalQueryEmbedding) {
          logger.debug("Generating query embedding (no pre-computed embedding provided)", {
            query,
            articleId,
          });
          const embeddingResult = await generateEmbedding(query, provider);
          finalQueryEmbedding = embeddingResult.embedding;
        }

        // Compute cosine similarity directly
        semanticScore = computeCosineSimilarity(finalQueryEmbedding, articleEmbedding);

        logger.debug("Computed semantic similarity", {
          articleId,
          semanticScore: semanticScore.toFixed(3),
          usedPreComputedEmbedding: !!queryEmbedding,
        });
      } catch (error) {
        logger.debug("Failed to compute semantic similarity", {
          articleId,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue with keyword matching only
      }
    } else {
      logger.debug("Article has no embedding, using keyword matching only", {
        articleId,
      });
    }

    // Apply boolean filter
    const passesBoolean = evaluateBoolean(parseResult.ast, article, semanticScore);
    if (!passesBoolean) {
      logger.debug("Article failed boolean filter", { articleId, query });
      return null;
    }

    // Calculate keyword score
    const keywordResult = calculateKeywordScore(article, terms);

    // Combined score: 60% semantic, 40% keyword
    const semanticWeight = 0.6;
    const keywordWeight = 0.4;
    const combinedScore = Math.min(
      semanticWeight * semanticScore + keywordWeight * keywordResult.score,
      1.0
    );

    logger.debug("Match scoring", {
      articleId,
      semanticScore: semanticScore.toFixed(3),
      keywordScore: keywordResult.score.toFixed(3),
      combinedScore: combinedScore.toFixed(3),
      threshold,
      passes: combinedScore >= threshold,
    });

    // Apply threshold
    if (combinedScore < threshold) {
      return null;
    }

    // Generate match reason
    const matchReason = generateMatchReason(
      article,
      keywordResult.matchedTerms,
      semanticScore,
      keywordResult.score,
      combinedScore
    );

    return {
      articleId: article.id,
      relevanceScore: combinedScore,
      matchedTerms: keywordResult.matchedTerms,
      matchReason,
    };
  } catch (error) {
    logger.error("Article matching failed", {
      error: error instanceof Error ? error.message : String(error),
      articleId,
      query,
    });
    return null;
  }
}
