import { prisma } from "../db";
import { extractKeywords } from "./pattern-detection-service";
import { getUserPatternsMap } from "./pattern-detection-service";
import { stripHtml } from "../content-processor";
import { cacheGet, cacheSet, cacheGetMany, cacheSetMany } from "../cache/cache-service";
import { CacheKeys, CacheTTL } from "../cache/cache-keys";
import type { articles } from "@/generated/prisma/client";

/**
 * Article score result
 */
export interface ArticleScore {
  articleId: string;
  score: number; // 0-1 range
  matchingPatterns: Array<{
    keyword: string;
    weight: number;
    contribution: number;
  }>;
  explanation: string;
}

/**
 * Score a single article based on user patterns
 */
export async function scoreArticle(
  userId: string,
  articleId: string
): Promise<ArticleScore> {
  // Try to get from cache first
  const cacheKey = CacheKeys.articleScore(userId, articleId);
  const cached = await cacheGet<ArticleScore>(cacheKey);
  if (cached) {
    return cached;
  }

  // Get article
  const article = await prisma.articles.findUnique({
    where: { id: articleId },
    select: {
      id: true,
      title: true,
      content: true,
      excerpt: true,
    },
  });

  if (!article) {
    throw new Error("Article not found");
  }

  // Get user patterns
  const userPatterns = await getUserPatternsMap(userId);

  // If no patterns yet, return neutral score (but still cache it)
  if (userPatterns.size === 0) {
    const result: ArticleScore = {
      articleId,
      score: 0.5,
      matchingPatterns: [],
      explanation: "No learned patterns yet",
    };
    
    // Cache the neutral score
    await cacheSet(cacheKey, result, CacheTTL.articleScore);
    
    return result;
  }

  // Extract keywords from article
  const fullText = `${article.title} ${article.excerpt || ""} ${article.content}`;
  const articleKeywords = extractKeywords(fullText, 30);

  // Calculate score based on matching patterns
  let totalScore = 0;
  const matchingPatterns: Array<{
    keyword: string;
    weight: number;
    contribution: number;
  }> = [];

  for (const [keyword, relevance] of articleKeywords.entries()) {
    const patternWeight = userPatterns.get(keyword);
    if (patternWeight !== undefined) {
      const contribution = patternWeight * relevance;
      totalScore += contribution;
      matchingPatterns.push({
        keyword,
        weight: patternWeight,
        contribution,
      });
    }
  }

  // Normalize score to 0-1 range
  // We use a sigmoid-like function to map the raw score
  const normalizedScore = 1 / (1 + Math.exp(-totalScore * 5));

  // Sort matching patterns by absolute contribution
  matchingPatterns.sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
  );

  // Generate explanation
  const explanation = generateExplanation(normalizedScore, matchingPatterns);

  const result: ArticleScore = {
    articleId,
    score: normalizedScore,
    matchingPatterns: matchingPatterns.slice(0, 5), // Top 5 patterns
    explanation,
  };

  // Cache the result
  await cacheSet(cacheKey, result, CacheTTL.articleScore);

  return result;
}

/**
 * Score multiple articles efficiently
 */
export async function scoreArticleBatch(
  userId: string,
  articleIds: string[]
): Promise<Map<string, ArticleScore>> {
  // Try to get cached scores first
  const cacheKeys = articleIds.map(id => CacheKeys.articleScore(userId, id));
  const cachedScores = await cacheGetMany<ArticleScore>(cacheKeys);
  
  const scores = new Map<string, ArticleScore>();
  const uncachedIds: string[] = [];
  
  // Separate cached and uncached
  articleIds.forEach((id, index) => {
    const cached = cachedScores[index];
    if (cached) {
      scores.set(id, cached);
    } else {
      uncachedIds.push(id);
    }
  });
  
  // If all cached, return early
  if (uncachedIds.length === 0) {
    return scores;
  }

  // Get uncached articles
  const articles = await prisma.articles.findMany({
    where: {
      id: {
        in: uncachedIds,
      },
    },
    select: {
      id: true,
      title: true,
      content: true,
      excerpt: true,
    },
  });

  // Get user patterns once
  const userPatterns = await getUserPatternsMap(userId);

  // If no patterns yet, return neutral scores for all
  if (userPatterns.size === 0) {
    for (const article of articles) {
      scores.set(article.id, {
        articleId: article.id,
        score: 0.5,
        matchingPatterns: [],
        explanation: "No learned patterns yet",
      });
    }
    return scores;
  }

  // Score each article
  for (const article of articles) {
    const fullText = `${article.title} ${article.excerpt || ""} ${article.content}`;
    const articleKeywords = extractKeywords(fullText, 30);

    let totalScore = 0;
    const matchingPatterns: Array<{
      keyword: string;
      weight: number;
      contribution: number;
    }> = [];

    for (const [keyword, relevance] of articleKeywords.entries()) {
      const patternWeight = userPatterns.get(keyword);
      if (patternWeight !== undefined) {
        const contribution = patternWeight * relevance;
        totalScore += contribution;
        matchingPatterns.push({
          keyword,
          weight: patternWeight,
          contribution,
        });
      }
    }

    const normalizedScore = 1 / (1 + Math.exp(-totalScore * 5));

    matchingPatterns.sort(
      (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
    );

    const explanation = generateExplanation(normalizedScore, matchingPatterns);

    const articleScore: ArticleScore = {
      articleId: article.id,
      score: normalizedScore,
      matchingPatterns: matchingPatterns.slice(0, 5),
      explanation,
    };
    
    scores.set(article.id, articleScore);
  }
  
  // Cache all newly computed scores
  const cacheEntries = Array.from(scores.entries()).map(([id, score]) => ({
    key: CacheKeys.articleScore(userId, id),
    value: score,
    ttl: CacheTTL.articleScore,
  }));
  
  if (cacheEntries.length > 0) {
    await cacheSetMany(cacheEntries);
  }

  return scores;
}

/**
 * Generate human-readable explanation for score
 */
function generateExplanation(
  score: number,
  matchingPatterns: Array<{
    keyword: string;
    weight: number;
    contribution: number;
  }>
): string {
  if (matchingPatterns.length === 0) {
    return "No matching patterns";
  }

  const topPatterns = matchingPatterns.slice(0, 3);
  const positivePatterns = topPatterns.filter((p) => p.contribution > 0);
  const negativePatterns = topPatterns.filter((p) => p.contribution < 0);

  if (score >= 0.7) {
    if (positivePatterns.length > 0) {
      const keywords = positivePatterns.map((p) => p.keyword).join(", ");
      return `Highly relevant - matches your interests: ${keywords}`;
    }
    return "Highly relevant based on your preferences";
  } else if (score >= 0.5) {
    return "Moderately relevant based on your preferences";
  } else if (score >= 0.3) {
    if (negativePatterns.length > 0) {
      const keywords = negativePatterns.map((p) => p.keyword).join(", ");
      return `Less relevant - contains topics you typically skip: ${keywords}`;
    }
    return "Less relevant based on your preferences";
  } else {
    if (negativePatterns.length > 0) {
      const keywords = negativePatterns.map((p) => p.keyword).join(", ");
      return `Not relevant - contains topics you dislike: ${keywords}`;
    }
    return "Not relevant based on your preferences";
  }
}

/**
 * Get score explanation for display
 */
export function getScoreExplanation(score: ArticleScore): {
  color: string;
  label: string;
  tooltip: string;
} {
  const { score: value, matchingPatterns, explanation } = score;

  let color: string;
  let label: string;

  if (value >= 0.7) {
    color = "green";
    label = "High";
  } else if (value >= 0.5) {
    color = "blue";
    label = "Medium";
  } else if (value >= 0.3) {
    color = "yellow";
    label = "Low";
  } else {
    color = "red";
    label = "Very Low";
  }

  const tooltip =
    matchingPatterns.length > 0
      ? `${explanation}\n\nTop patterns:\n${matchingPatterns
          .slice(0, 3)
          .map((p) => `• ${p.keyword} (${p.contribution > 0 ? "+" : ""}${(p.contribution * 100).toFixed(1)}%)`)
          .join("\n")}`
      : explanation;

  return { color, label, tooltip };
}

/**
 * Filter articles by minimum score
 */
export async function filterArticlesByScore(
  userId: string,
  articleIds: string[],
  minScore: number = 0.4
): Promise<string[]> {
  const scores = await scoreArticleBatch(userId, articleIds);

  return articleIds.filter((id) => {
    const score = scores.get(id);
    return score && score.score >= minScore;
  });
}

/**
 * Sort articles by score
 */
export async function sortArticlesByScore(
  userId: string,
  articleIds: string[],
  order: "asc" | "desc" = "desc"
): Promise<string[]> {
  const scores = await scoreArticleBatch(userId, articleIds);

  return articleIds.sort((a, b) => {
    const scoreA = scores.get(a)?.score ?? 0.5;
    const scoreB = scores.get(b)?.score ?? 0.5;
    return order === "desc" ? scoreB - scoreA : scoreA - scoreB;
  });
}

