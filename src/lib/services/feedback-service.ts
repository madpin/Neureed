import { prisma } from "../db";
import type { article_feedback } from "@prisma/client";
import { estimateReadingTime } from "../content-processor";

/**
 * Feedback types
 */
export type FeedbackType = "explicit" | "implicit";
export type ExplicitFeedbackValue = 1.0 | -1.0; // thumbs up or down
export type ImplicitFeedbackValue = -0.5; // bounce

/**
 * Record explicit feedback (thumbs up/down)
 */
export async function recordExplicitFeedback(
  userId: string,
  articleId: string,
  feedbackValue: ExplicitFeedbackValue
): Promise<article_feedback> {
  // Get article to calculate estimated reading time
  const article = await prisma.articles.findUnique({
    where: { id: articleId },
    select: { content: true },
  });

  if (!article) {
    throw new Error("Article not found");
  }

  const estimatedTime = estimateReadingTime(article.content) * 60; // Convert to seconds

  return await prisma.article_feedback.upsert({
    where: {
      userId_articleId: {
        userId,
        articleId,
      },
    },
    create: {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      articleId,
      feedbackType: "explicit",
      feedbackValue,
      estimatedTime,
      updatedAt: new Date(),
    },
    update: {
      feedbackType: "explicit",
      feedbackValue,
      estimatedTime,
      updatedAt: new Date(),
    },
  });
}

/**
 * Record article view (when user opens article)
 */
export async function recordArticleView(
  userId: string,
  articleId: string
): Promise<{ viewedAt: Date; estimatedTime: number }> {
  // Get article to calculate estimated reading time
  const article = await prisma.articles.findUnique({
    where: { id: articleId },
    select: { content: true },
  });

  if (!article) {
    throw new Error("Article not found");
  }

  const estimatedTime = estimateReadingTime(article.content) * 60; // Convert to seconds

  // Return view timestamp and estimated time for client-side tracking
  return {
    viewedAt: new Date(),
    estimatedTime,
  };
}

/**
 * Record article exit and detect bounce or completion
 */
export async function recordArticleExit(
  userId: string,
  articleId: string,
  timeSpent: number, // in seconds
  estimatedTime: number // in seconds
): Promise<article_feedback | null> {
  // Get user's bounce threshold preference
  const preferences = await prisma.user_preferences.findUnique({
    where: { userId },
    select: { bounceThreshold: true },
  });

  const bounceThreshold = preferences?.bounceThreshold ?? 0.25;
  const completionThreshold = 0.9; // 90% or more of reading time

  // Calculate reading percentage
  const readingPercentage = timeSpent / estimatedTime;

  // Check if user already gave explicit feedback
  const existingFeedback = await prisma.article_feedback.findUnique({
    where: {
      userId_articleId: {
        userId,
        articleId,
      },
    },
  });

  // Don't override explicit feedback with implicit feedback
  if (existingFeedback && existingFeedback.feedbackType === "explicit") {
    return existingFeedback;
  }

  // Check if this qualifies as a completion (90%+ reading time)
  const isCompletion = readingPercentage >= completionThreshold;
  
  // Check if this qualifies as a bounce (less than threshold)
  const isBounce = readingPercentage < bounceThreshold;

  // If neither bounce nor completion, don't record implicit feedback
  if (!isBounce && !isCompletion) {
    return null;
  }

  // Determine feedback value
  let feedbackValue: number;
  if (isCompletion) {
    feedbackValue = 0.5; // Half thumbs up for reading 90%+
  } else {
    feedbackValue = -0.5; // Half thumbs down for quick bounce
  }

  // Record implicit feedback
  return await prisma.article_feedback.upsert({
    where: {
      userId_articleId: {
        userId,
        articleId,
      },
    },
    create: {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      articleId,
      feedbackType: "implicit",
      feedbackValue,
      timeSpent,
      estimatedTime,
      updatedAt: new Date(),
    },
    update: {
      feedbackType: "implicit",
      feedbackValue,
      timeSpent,
      estimatedTime,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get user's feedback for a specific article
 */
export async function getUserFeedbackForArticle(
  userId: string,
  articleId: string
): Promise<article_feedback | null> {
  return await prisma.article_feedback.findUnique({
    where: {
      userId_articleId: {
        userId,
        articleId,
      },
    },
  });
}

/**
 * Get feedback statistics for a user
 */
export async function getFeedbackStats(userId: string): Promise<{
  totalFeedback: number;
  thumbsUp: number;
  thumbsDown: number;
  bounces: number;
  completions: number;
  averageTimeSpent: number | null;
}> {
  const allFeedback = await prisma.article_feedback.findMany({
    where: { userId },
    select: {
      feedbackType: true,
      feedbackValue: true,
      timeSpent: true,
    },
  });

  const thumbsUp = allFeedback.filter(
    (f) => f.feedbackType === "explicit" && f.feedbackValue === 1.0
  ).length;

  const thumbsDown = allFeedback.filter(
    (f) => f.feedbackType === "explicit" && f.feedbackValue === -1.0
  ).length;

  const bounces = allFeedback.filter(
    (f) => f.feedbackType === "implicit" && f.feedbackValue === -0.5
  ).length;

  const completions = allFeedback.filter(
    (f) => f.feedbackType === "implicit" && f.feedbackValue === 0.5
  ).length;

  const timeSpentValues = allFeedback
    .filter((f) => f.timeSpent !== null)
    .map((f) => f.timeSpent as number);

  const averageTimeSpent =
    timeSpentValues.length > 0
      ? timeSpentValues.reduce((sum, time) => sum + time, 0) /
        timeSpentValues.length
      : null;

  return {
    totalFeedback: allFeedback.length,
    thumbsUp,
    thumbsDown,
    bounces,
    completions,
    averageTimeSpent,
  };
}

/**
 * Delete feedback for an article
 */
export async function deleteFeedback(
  userId: string,
  articleId: string
): Promise<void> {
  await prisma.article_feedback.delete({
    where: {
      userId_articleId: {
        userId,
        articleId,
      },
    },
  });
}

/**
 * Get all feedback for a user (for pattern detection)
 */
export async function getUserFeedback(userId: string): Promise<
  Array<{
    articleId: string;
    feedbackValue: number;
    feedbackType: string;
    articles: {
      title: string;
      content: string;
      excerpt: string | null;
    };
  }>
> {
  return await prisma.article_feedback.findMany({
    where: { userId },
    include: {
      articles: {
        select: {
          title: true,
          content: true,
          excerpt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get recent feedback (for real-time pattern updates)
 */
export async function getRecentFeedback(
  userId: string,
  since: Date
): Promise<
  Array<{
    articleId: string;
    feedbackValue: number;
    feedbackType: string;
    articles: {
      title: string;
      content: string;
      excerpt: string | null;
    };
  }>
> {
  return await prisma.article_feedback.findMany({
    where: {
      userId,
      createdAt: {
        gte: since,
      },
    },
    include: {
      articles: {
        select: {
          title: true,
          content: true,
          excerpt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

