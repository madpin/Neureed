import { prisma } from "../db";
import { stripHtml } from "../content-processor";
import type { UserPattern } from "@prisma/client";

/**
 * Common English stop words to filter out
 */
const STOP_WORDS = new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can",
  "did",
  "do",
  "does",
  "doing",
  "don",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "has",
  "have",
  "having",
  "he",
  "her",
  "here",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "itself",
  "just",
  "me",
  "might",
  "more",
  "most",
  "must",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "now",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "re",
  "s",
  "same",
  "she",
  "should",
  "so",
  "some",
  "such",
  "t",
  "than",
  "that",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "whom",
  "why",
  "will",
  "with",
  "would",
  "you",
  "your",
  "yours",
  "yourself",
  "yourselves",
]);

/**
 * Extract keywords from text using TF-IDF
 */
export function extractKeywords(
  text: string,
  maxKeywords: number = 20
): Map<string, number> {
  // Strip HTML and convert to lowercase
  const plainText = stripHtml(text).toLowerCase();

  // Tokenize: split by non-word characters
  const words = plainText.split(/\W+/).filter((word) => word.length > 2);

  // Calculate term frequency (TF)
  const termFrequency = new Map<string, number>();
  let totalWords = 0;

  for (const word of words) {
    if (STOP_WORDS.has(word)) continue;

    totalWords++;
    termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
  }

  // Normalize TF by total words
  const normalizedTF = new Map<string, number>();
  for (const [word, count] of termFrequency.entries()) {
    normalizedTF.set(word, count / totalWords);
  }

  // For single document, we use TF with a simple heuristic:
  // Prioritize words that appear multiple times but not too frequently
  // (very frequent words are likely common, very rare words might be noise)
  const scoredKeywords = new Map<string, number>();

  for (const [word, tf] of normalizedTF.entries()) {
    const rawCount = termFrequency.get(word) || 0;

    // Score based on frequency, but penalize very common words
    // Sweet spot: words that appear 2-10 times in the document
    let score = tf;
    if (rawCount >= 2 && rawCount <= 10) {
      score *= 1.5; // Boost words in the sweet spot
    } else if (rawCount > 10) {
      score *= 0.5; // Penalize very common words
    }

    scoredKeywords.set(word, score);
  }

  // Sort by score and take top keywords
  const sortedKeywords = Array.from(scoredKeywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords);

  return new Map(sortedKeywords);
}

/**
 * Update user patterns based on feedback
 */
export async function updateUserPatterns(
  userId: string,
  articleId: string,
  feedbackValue: number
): Promise<void> {
  // Get article content
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: {
      title: true,
      content: true,
      excerpt: true,
    },
  });

  if (!article) {
    throw new Error("Article not found");
  }

  // Extract keywords from article
  const fullText = `${article.title} ${article.excerpt || ""} ${article.content}`;
  const keywords = extractKeywords(fullText, 15);

  // Update patterns for each keyword
  const updatePromises = Array.from(keywords.entries()).map(
    async ([keyword, relevance]) => {
      // Calculate weight change based on feedback value and keyword relevance
      const weightChange = feedbackValue * relevance * 0.1; // Scale down the impact

      await prisma.userPattern.upsert({
        where: {
          userId_keyword: {
            userId,
            keyword,
          },
        },
        create: {
          userId,
          keyword,
          weight: weightChange,
          feedbackCount: 1,
        },
        update: {
          weight: {
            increment: weightChange,
          },
          feedbackCount: {
            increment: 1,
          },
          updatedAt: new Date(),
        },
      });
    }
  );

  await Promise.all(updatePromises);

  // Apply pattern decay and cleanup
  await applyPatternDecay(userId);
  await cleanupPatterns(userId);
}

/**
 * Get user patterns
 */
export async function getUserPatterns(
  userId: string,
  limit?: number
): Promise<UserPattern[]> {
  return await prisma.userPattern.findMany({
    where: { userId },
    orderBy: [{ weight: "desc" }],
    take: limit,
  });
}

/**
 * Get user patterns as a map (for efficient scoring)
 */
export async function getUserPatternsMap(
  userId: string
): Promise<Map<string, number>> {
  const patterns = await getUserPatterns(userId);
  return new Map(patterns.map((p) => [p.keyword, p.weight]));
}

/**
 * Apply time-based decay to patterns
 * Patterns older than 30 days start to decay
 */
export async function applyPatternDecay(userId: string): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get patterns older than 30 days
  const oldPatterns = await prisma.userPattern.findMany({
    where: {
      userId,
      updatedAt: {
        lt: thirtyDaysAgo,
      },
    },
  });

  // Apply decay: reduce weight by 10% for each 30-day period
  const updatePromises = oldPatterns.map(async (pattern) => {
    const daysSinceUpdate = Math.floor(
      (Date.now() - pattern.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const thirtyDayPeriods = Math.floor(daysSinceUpdate / 30);
    const decayFactor = Math.pow(0.9, thirtyDayPeriods);

    const newWeight = pattern.weight * decayFactor;

    await prisma.userPattern.update({
      where: { id: pattern.id },
      data: { weight: newWeight },
    });
  });

  await Promise.all(updatePromises);
}

/**
 * Cleanup patterns with low weights or limit to top N
 */
export async function cleanupPatterns(
  userId: string,
  maxPatterns: number = 100
): Promise<void> {
  // Delete patterns with very low absolute weight
  await prisma.userPattern.deleteMany({
    where: {
      userId,
      weight: {
        gt: -0.1,
        lt: 0.1,
      },
    },
  });

  // Get all patterns ordered by absolute weight
  const allPatterns = await prisma.userPattern.findMany({
    where: { userId },
    orderBy: [
      // We can't order by absolute value directly, so we'll fetch all and filter
    ],
  });

  // Sort by absolute weight
  const sortedPatterns = allPatterns.sort(
    (a, b) => Math.abs(b.weight) - Math.abs(a.weight)
  );

  // If we have more than maxPatterns, delete the weakest ones
  if (sortedPatterns.length > maxPatterns) {
    const patternsToDelete = sortedPatterns.slice(maxPatterns);
    const idsToDelete = patternsToDelete.map((p) => p.id);

    await prisma.userPattern.deleteMany({
      where: {
        id: {
          in: idsToDelete,
        },
      },
    });
  }
}

/**
 * Reset all patterns for a user
 */
export async function resetUserPatterns(userId: string): Promise<void> {
  await prisma.userPattern.deleteMany({
    where: { userId },
  });
}

/**
 * Get pattern statistics
 */
export async function getPatternStats(userId: string): Promise<{
  totalPatterns: number;
  positivePatterns: number;
  negativePatterns: number;
  strongestPositive: UserPattern | null;
  strongestNegative: UserPattern | null;
}> {
  const patterns = await getUserPatterns(userId);

  const positivePatterns = patterns.filter((p) => p.weight > 0);
  const negativePatterns = patterns.filter((p) => p.weight < 0);

  const strongestPositive =
    positivePatterns.length > 0
      ? positivePatterns.reduce((max, p) => (p.weight > max.weight ? p : max))
      : null;

  const strongestNegative =
    negativePatterns.length > 0
      ? negativePatterns.reduce((min, p) => (p.weight < min.weight ? p : min))
      : null;

  return {
    totalPatterns: patterns.length,
    positivePatterns: positivePatterns.length,
    negativePatterns: negativePatterns.length,
    strongestPositive,
    strongestNegative,
  };
}

