/**
 * Analytics Query Hooks
 *
 * These hooks manage user analytics data fetching including feedback stats and patterns.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { apiGet, apiPost } from "@/lib/query/api-client";

/**
 * Feedback stats
 */
export interface FeedbackStats {
  totalFeedback: number;
  thumbsUp: number;
  thumbsDown: number;
  bounces: number;
  completions: number;
  averageTimeSpent: number | null;
}

/**
 * Pattern stats
 */
export interface PatternStats {
  totalPatterns: number;
  positivePatterns: number;
  negativePatterns: number;
  strongestPositive: {
    keyword: string;
    weight: number;
    feedbackCount: number;
  } | null;
  strongestNegative: {
    keyword: string;
    weight: number;
    feedbackCount: number;
  } | null;
}

/**
 * User pattern
 */
export interface Pattern {
  id: string;
  keyword: string;
  weight: number;
  feedbackCount: number;
  updatedAt: string;
}

/**
 * Fetch feedback stats
 */
async function fetchFeedbackStats(): Promise<FeedbackStats> {
  const response = await apiGet<{ stats: FeedbackStats }>("/api/user/feedback/stats");
  return response.stats;
}

/**
 * Fetch pattern stats
 */
async function fetchPatternStats(): Promise<PatternStats> {
  const response = await apiGet<{ stats: PatternStats }>("/api/user/patterns/stats");
  return response.stats;
}

/**
 * Fetch user patterns
 */
async function fetchPatterns(): Promise<Pattern[]> {
  const response = await apiGet<{ patterns: Pattern[] }>("/api/user/patterns");
  return response.patterns;
}

/**
 * Reset user patterns
 */
async function resetPatterns(): Promise<void> {
  await apiPost("/api/user/patterns/reset");
}

/**
 * Hook to fetch feedback stats
 */
export function useFeedbackStats() {
  return useQuery({
    queryKey: queryKeys.analytics.feedback(),
    queryFn: fetchFeedbackStats,
  });
}

/**
 * Hook to fetch pattern stats
 */
export function usePatternStats() {
  return useQuery({
    queryKey: queryKeys.analytics.patterns.stats(),
    queryFn: fetchPatternStats,
  });
}

/**
 * Hook to fetch user patterns
 */
export function usePatterns() {
  return useQuery({
    queryKey: queryKeys.analytics.patterns.list(),
    queryFn: fetchPatterns,
  });
}

/**
 * Hook to reset user patterns
 */
export function useResetPatterns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetPatterns,
    onSuccess: () => {
      // Invalidate all analytics queries
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
      // Also invalidate article scores since they depend on patterns
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.scores([]) }); // Ideally invalidate all scores
      // But scores query key requires specific IDs. We might need a broader invalidation or just "articles"
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
    },
  });
}
