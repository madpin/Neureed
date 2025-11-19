"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ArticleCard } from "./ArticleCard";
import { RelevanceScore } from "./RelevanceScore";
import type { Article, Feed } from "@prisma/client";
import type { ArticleScore } from "@/lib/services/article-scoring-service";

interface ArticleWithFeed extends Article {
  feed: Feed;
}

interface ArticleListProps {
  articles: ArticleWithFeed[];
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
  const [scores, setScores] = useState<Map<string, ArticleScore>>(new Map());
  const [isLoadingScores, setIsLoadingScores] = useState(false);

  // Fetch article scores when user is logged in
  useEffect(() => {
    if (!session?.user || articles.length === 0) return;

    const fetchScores = async () => {
      setIsLoadingScores(true);
      try {
        const articleIds = articles.map((a) => a.id);
        const response = await fetch("/api/user/articles/scores", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ articleIds }),
        });

        if (response.ok) {
          const result = await response.json();
          const scoresMap = new Map<string, ArticleScore>();
          // API wraps response in { success: true, data: { scores: [...] } }
          if (result.data?.scores) {
            result.data.scores.forEach((score: ArticleScore) => {
              scoresMap.set(score.articleId, score);
            });
          }
          setScores(scoresMap);
        }
      } catch (error) {
        console.error("Error fetching article scores:", error);
      } finally {
        setIsLoadingScores(false);
      }
    };

    fetchScores();
  }, [session, articles]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg bg-muted bg-background"
          />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="mb-4 h-16 w-16 text-foreground/50"
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
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          No articles yet
        </h3>
        <p className="text-sm text-foreground/60">
          Add some feeds to start reading articles
        </p>
      </div>
    );
  }

  const showAutoLoad = infiniteScrollMode === "auto" || infiniteScrollMode === "both";
  const showButton = infiniteScrollMode === "button" || infiniteScrollMode === "both";

  return (
    <div className="space-y-4">
      {articles.map((article) => {
        const score = scores.get(article.id);
        const shouldDim = score && score.score < 0.4;
        const opacity = shouldDim ? 0.6 : 1;
        const hasSimilarity = 'similarity' in article && article.similarity !== undefined;

        return (
          <div
            key={article.id}
            style={{ opacity }}
            className="relative transition-opacity"
          >
            {(score || hasSimilarity) && (
              <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                {hasSimilarity && (
                  <div className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-lg">
                    {Math.round((article as any).similarity * 100)}% match
                  </div>
                )}
                {score && <RelevanceScore score={score} />}
              </div>
            )}
            <ArticleCard 
              article={article} 
              variant={variant} 
              onArticleClick={onArticleSelect}
              onReadStatusChange={onReadStatusChange}
            />
          </div>
        );
      })}

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <span className="ml-3 text-sm text-foreground/70">Loading more articles...</span>
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

