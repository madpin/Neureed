"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { ArticleCard, type ArticleDisplayPreferences } from "./ArticleCard";
import { LoadingSpinner, LoadingSkeleton } from "@/app/components/layout/LoadingSpinner";
import { EmptyState } from "@/app/components/layout/EmptyState";
import { useArticleScores, type ArticleScore, type Article } from "@/hooks/queries/use-articles";
import { useUserPreferences } from "@/hooks/queries/use-user-preferences";

interface ArticleListProps {
  articles: Article[];
  isLoading?: boolean;
  variant?: "compact" | "expanded";
  onArticleSelect?: (articleId: string) => void;
  onReadStatusChange?: () => void;
  // Infinite scroll props
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  loadMoreRef?: React.RefObject<HTMLDivElement>;
  infiniteScrollMode?: "auto" | "button" | "both";
}

export function ArticleList({
  articles,
  isLoading = false,
  variant = "compact",
  onArticleSelect,
  onReadStatusChange,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  loadMoreRef,
  infiniteScrollMode = "both",
}: ArticleListProps) {
  const { data: session } = useSession();
  const { data: preferences } = useUserPreferences();

  // Extract article IDs and use React Query to fetch scores
  const articleIds = useMemo(
    () => articles.map((a) => a.id),
    [articles]
  );

  const { data: scoresData } = useArticleScores(
    session?.user ? articleIds : []
  );

  // Convert scores array to Map for easy lookup
  const scores = useMemo(() => {
    const scoresMap = new Map<string, ArticleScore>();
    if (scoresData) {
      scoresData.forEach((score) => {
        scoresMap.set(String(score.articleId), score);
      });
    }
    return scoresMap;
  }, [scoresData]);

  // Build display preferences from user preferences
  const displayPreferences = useMemo<ArticleDisplayPreferences>(() => ({
    density: (preferences?.articleCardDensity as "compact" | "normal" | "comfortable") || "normal",
    showImage: preferences?.showArticleImage ?? true,
    showExcerpt: preferences?.showArticleExcerpt ?? true,
    showAuthor: preferences?.showArticleAuthor ?? true,
    showFeedInfo: preferences?.showArticleFeedInfo ?? true,
    showDate: preferences?.showArticleDate ?? true,
    sectionOrder: (preferences?.articleCardSectionOrder as string[]) || ["feedInfo", "title", "excerpt", "actions"],
  }), [preferences]);

  if (isLoading) {
    return <LoadingSkeleton count={5} />;
  }

  if (articles.length === 0) {
    return (
      <EmptyState
        icon={
          <svg
            className="h-16 w-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        }
        title="No articles yet"
        description="Add some feeds to start reading articles"
      />
    );
  }

  const showAutoLoad = infiniteScrollMode === "auto" || infiniteScrollMode === "both";
  const showButton = infiniteScrollMode === "button" || infiniteScrollMode === "both";

  return (
    <div className="space-y-4">
      {articles.map((article) => {
        const score = scores.get(article.id);
        const hasSimilarity = 'similarity' in article && article.similarity !== undefined;
        const similarity = hasSimilarity ? (article as any).similarity : undefined;

        return (
          <ArticleCard 
            key={article.id}
            article={article}
            displayPreferences={displayPreferences}
            variant={variant}
            onArticleClick={onArticleSelect}
            onReadStatusChange={onReadStatusChange}
            showRelevanceScore={!!score}
            relevanceScore={score}
            similarity={similarity}
          />
        );
      })}

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="py-8">
          <LoadingSpinner size="md" text="Loading more articles..." />
        </div>
      )}

      {/* Load More button */}
      {showButton && hasMore && !isLoadingMore && onLoadMore && (
        <div className="flex justify-center py-8">
          <button
            onClick={onLoadMore}
            className="rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Load More Articles
          </button>
        </div>
      )}

      {/* Infinite scroll trigger (auto-load) - placed at the very bottom */}
      {showAutoLoad && hasMore && !isLoadingMore && loadMoreRef && (
        <div ref={loadMoreRef} className="h-4" />
      )}

      {/* End of results message */}
      {!hasMore && articles.length > 0 && (
        <div className="flex justify-center py-8">
          <p className="text-sm text-foreground/60">
            You&apos;ve reached the end of the list
          </p>
        </div>
      )}
    </div>
  );
}

