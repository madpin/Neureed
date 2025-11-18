"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FeedbackStats {
  totalFeedback: number;
  thumbsUp: number;
  thumbsDown: number;
  bounces: number;
  completions: number;
  averageTimeSpent: number | null;
}

interface PatternStats {
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

interface Pattern {
  id: string;
  keyword: string;
  weight: number;
  feedbackCount: number;
  updatedAt: string;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [patternStats, setPatternStats] = useState<PatternStats | null>(null);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllPatterns, setShowAllPatterns] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      loadAnalytics();
    }
  }, [status, router]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [feedbackRes, patternStatsRes, patternsRes] = await Promise.all([
        fetch("/api/user/feedback/stats"),
        fetch("/api/user/patterns/stats"),
        fetch("/api/user/patterns"),
      ]);

      if (feedbackRes.ok) {
        const data = await feedbackRes.json();
        setFeedbackStats(data.data?.stats || null);
      }

      if (patternStatsRes.ok) {
        const data = await patternStatsRes.json();
        setPatternStats(data.data?.stats || null);
      }

      if (patternsRes.ok) {
        const data = await patternsRes.json();
        setPatterns(data.data?.patterns || []);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const displayedPatterns = showAllPatterns ? patterns : patterns.slice(0, 10);
  const positivePatterns = patterns.filter((p) => p.weight > 0);
  const negativePatterns = patterns.filter((p) => p.weight < 0);

  // Calculate progress towards effective personalization
  const MIN_FEEDBACK_FOR_PERSONALIZATION = 10;
  const totalFeedback = feedbackStats?.totalFeedback || 0;
  const feedbackProgress = Math.min(
    (totalFeedback / MIN_FEEDBACK_FOR_PERSONALIZATION) * 100,
    100
  );
  const feedbackNeeded = Math.max(
    0,
    MIN_FEEDBACK_FOR_PERSONALIZATION - totalFeedback
  );
  const isPersonalizationActive = totalFeedback >= MIN_FEEDBACK_FOR_PERSONALIZATION;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Learning Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              See how NeuReed is learning your preferences
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Home
            </Link>
          </div>
        </div>

        {/* Personalization Status */}
        {!isPersonalizationActive && totalFeedback > 0 && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-700 dark:bg-blue-900/20">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Building Your Profile
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {feedbackNeeded} more {feedbackNeeded === 1 ? "rating" : "ratings"} needed to activate personalization
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {totalFeedback}/{MIN_FEEDBACK_FOR_PERSONALIZATION}
                </div>
              </div>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-blue-200 dark:bg-blue-800">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500 dark:bg-blue-400"
                style={{ width: `${feedbackProgress}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">
              💡 Keep rating articles! Once you reach {MIN_FEEDBACK_FOR_PERSONALIZATION} ratings, 
              we'll start showing relevance scores and personalizing your feed.
            </p>
          </div>
        )}

        {isPersonalizationActive && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white dark:bg-green-500">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Personalization Active
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your feed is now personalized based on {totalFeedback} ratings and {patterns.length} learned patterns
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Statistics */}
        <div className="mb-6 rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Feedback Statistics
          </h2>
          {feedbackStats ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {feedbackStats.totalFeedback}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Feedback
                </div>
              </div>
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {feedbackStats.thumbsUp}
                </div>
                <div className="text-sm text-muted-foreground">
                  Thumbs Up
                </div>
              </div>
              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {feedbackStats.thumbsDown}
                </div>
                <div className="text-sm text-muted-foreground">
                  Thumbs Down
                </div>
              </div>
              <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {feedbackStats.completions}
                </div>
                <div className="text-sm text-muted-foreground">
                  Completions (90%+)
                </div>
              </div>
              <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {feedbackStats.bounces}
                </div>
                <div className="text-sm text-muted-foreground">
                  Quick Bounces
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No feedback data yet. Start rating articles to see your statistics!
            </p>
          )}
        </div>

        {/* Pattern Statistics */}
        <div className="mb-6 rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Pattern Statistics
          </h2>
          {patternStats && patternStats.totalPatterns > 0 ? (
            <div>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-muted p-4">
                  <div className="text-2xl font-bold text-foreground">
                    {patternStats.totalPatterns}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Patterns
                  </div>
                </div>
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {patternStats.positivePatterns}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Positive Patterns
                  </div>
                </div>
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {patternStats.negativePatterns}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Negative Patterns
                  </div>
                </div>
              </div>

              {/* Strongest Patterns */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {patternStats.strongestPositive && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20">
                    <h3 className="mb-2 text-sm font-semibold text-green-900 dark:text-green-100">
                      Most Liked Topic
                    </h3>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {patternStats.strongestPositive.keyword}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Weight: {(patternStats.strongestPositive.weight * 100).toFixed(1)}% •{" "}
                      {patternStats.strongestPositive.feedbackCount} interactions
                    </div>
                  </div>
                )}
                {patternStats.strongestNegative && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
                    <h3 className="mb-2 text-sm font-semibold text-red-900 dark:text-red-100">
                      Most Disliked Topic
                    </h3>
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">
                      {patternStats.strongestNegative.keyword}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Weight: {(patternStats.strongestNegative.weight * 100).toFixed(1)}% •{" "}
                      {patternStats.strongestNegative.feedbackCount} interactions
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No patterns learned yet. Keep rating articles to build your preferences!
            </p>
          )}
        </div>

        {/* Learned Patterns */}
        {patterns.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Learned Patterns
              </h2>
              {patterns.length > 10 && (
                <button
                  onClick={() => setShowAllPatterns(!showAllPatterns)}
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  {showAllPatterns ? "Show Less" : `Show All (${patterns.length})`}
                </button>
              )}
            </div>

            {/* Pattern Tabs */}
            <div className="mb-4 flex gap-2 border-b border-border">
              <button className="border-b-2 border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                All ({patterns.length})
              </button>
            </div>

            {/* Pattern List */}
            <div className="space-y-2">
              {displayedPatterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        pattern.weight > 0
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {pattern.weight > 0 ? "+" : "-"}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {pattern.keyword}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pattern.feedbackCount} interactions
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-semibold ${
                        pattern.weight > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {pattern.weight > 0 ? "+" : ""}
                      {(pattern.weight * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(pattern.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {patterns.length === 0 && feedbackStats?.totalFeedback === 0 && (
          <div className="rounded-lg border border-border bg-card p-12 text-center shadow-sm">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 6 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Start Building Your Profile
            </h3>
            <p className="mb-4 text-muted-foreground">
              Rate articles with thumbs up or down to help NeuReed learn your preferences
            </p>
            <Link
              href="/"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              Browse Articles
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

