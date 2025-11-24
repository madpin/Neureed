"use client";

import { useState } from "react";
import { ArticleCard } from "@/app/components/articles/ArticleCard";
import { RelevanceScoreBadge } from "./RelevanceScoreBadge";
import { MatchReasonTooltip } from "./MatchReasonTooltip";
import {
  useMatchingArticles,
  useSavedSearch,
  type GetMatchingArticlesOptions,
} from "@/hooks/queries/use-saved-searches";
import { EmptyState } from "@/app/components/layout/EmptyState";
import { LoadingSpinner } from "@/app/components/layout/LoadingSpinner";

interface SavedSearchViewProps {
  searchId: string;
  onArticleClick?: (articleId: string) => void;
}

/**
 * View component for displaying articles matching a saved search
 */
export function SavedSearchView({
  searchId,
  onArticleClick,
}: SavedSearchViewProps) {
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "combined">("relevance");
  const [options] = useState<GetMatchingArticlesOptions>({
    sortBy,
    limit: 50,
  });

  // Fetch saved search details
  const { data: savedSearch, isLoading: isLoadingSearch } = useSavedSearch(searchId);

  // Fetch matching articles
  const { data: matchData, isLoading: isLoadingArticles } = useMatchingArticles(
    searchId,
    options
  );

  if (isLoadingSearch || isLoadingArticles) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!savedSearch) {
    return (
      <EmptyState
        icon={
          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        }
        title="Saved search not found"
        description="This saved search may have been deleted."
      />
    );
  }

  const articles = matchData?.articles || [];
  const matches = matchData?.matches || [];
  const total = matchData?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{savedSearch.icon || "🔍"}</span>
            <h1 className="text-2xl font-bold text-foreground">
              {savedSearch.name}
            </h1>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <code className="text-sm font-mono text-foreground">
              {savedSearch.query}
            </code>
          </div>
        </div>

        {/* Sort Options */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="relevance">Sort by Relevance</option>
          <option value="date">Sort by Date</option>
          <option value="combined">Sort by Combined</option>
        </select>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 rounded-lg border border-border bg-muted/30 p-4">
        <div>
          <div className="text-2xl font-bold text-primary">{total}</div>
          <div className="text-xs text-secondary">Total Matches</div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <div className="text-sm text-foreground">
            Threshold: <span className="font-semibold">{Math.round(savedSearch.threshold * 100)}%</span>
          </div>
          <div className="text-xs text-secondary">Minimum match quality</div>
        </div>
        {savedSearch.notifyOnMatch && (
          <>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm text-foreground">
              <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Notifications enabled
            </div>
          </>
        )}
      </div>

      {/* Articles */}
      {articles.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          title="No matches yet"
          description="Articles matching this search will appear here as they're discovered."
        />
      ) : (
        <div className="grid gap-4">
          {articles.map((article, index) => {
            const match = matches.find((m) => m.articleId === article.id);

            return (
              <div key={article.id} className="relative">
                <ArticleCard
                  article={article}
                  onArticleClick={onArticleClick}
                />

                {/* Relevance Badge & Match Reason */}
                {match && (
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                    <RelevanceScoreBadge score={match.relevanceScore} />
                  </div>
                )}

                {match && (
                  <div className="mt-2 ml-4">
                    <MatchReasonTooltip
                      matchedTerms={match.matchedTerms}
                      matchReason={match.matchReason}
                      relevanceScore={match.relevanceScore}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Load More (if needed) */}
      {articles.length < total && (
        <div className="flex justify-center pt-6">
          <button
            className="rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Load more ({total - articles.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
