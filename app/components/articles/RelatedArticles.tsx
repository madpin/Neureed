"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatLocalizedDate } from "@/lib/date-utils";
import { useUserPreferences } from "@/hooks/queries/use-user-preferences";
import { useRelatedArticles } from "@/hooks/queries/use-articles";

interface RelatedArticle {
  id: string;
  title: string;
  excerpt?: string;
  imageUrl?: string;
  publishedAt?: string;
  similarity: number;
  feeds: {
    name: string;
  };
}

interface ApiResponse {
  data: {
    results: RelatedArticle[];
    count: number;
    message?: string;
  };
}

interface RelatedArticlesProps {
  articleId: string;
  limit?: number;
  minScore?: number;
}

export function RelatedArticles({
  articleId,
  limit = 6,
  minScore = 0.7,
}: RelatedArticlesProps) {
  const { data: session } = useSession();
  const { data: preferences } = useUserPreferences();
  const { data: relatedArticles, isLoading, error } = useRelatedArticles(
    articleId,
    limit
  );

  const showExcerpts = preferences?.showRelatedExcerpts ?? false;
  const articles = relatedArticles || [];

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background p-6 border-border bg-background">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Related Articles
        </h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-3/4 rounded bg-muted bg-background"></div>
              <div className="mt-2 h-3 w-full rounded bg-muted bg-background"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNoEmbedding = errorMessage.includes("no embedding") || errorMessage.includes("Article has no embedding");

    if (isNoEmbedding) {
      return (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
            Related Articles
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Semantic search is not yet available for this article. Generate embeddings to enable related article recommendations.
          </p>
          <a
            href="/settings"
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Go to Settings to generate embeddings →
          </a>
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load related articles: {errorMessage}
        </p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-6 border-border bg-background">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Related Articles
        </h3>
        <p className="text-sm text-foreground/70">
          No related articles found
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background p-6 border-border bg-background">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Related Articles
      </h3>

      <div className="space-y-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/?article=${article.id}`}
            className="group block rounded-lg border border-border p-4 transition-all hover:border-blue-500 hover:shadow-md border-border dark:hover:border-blue-500"
          >
            <div className="flex gap-4">
              <div className="flex-1 min-w-0">
                {showExcerpts ? (
                  // Expanded mode: Title on top, excerpt below, metadata at bottom
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                        {article.title}
                      </h4>
                    </div>
                    {article.excerpt && (
                      <p className="mt-1 line-clamp-2 text-xs text-foreground/70">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-foreground/60 dark:text-foreground/60">
                      <span>{article.feeds?.name || "Unknown"}</span>
                      {article.publishedAt && (
                        <>
                          <span>•</span>
                          <span>
                            {formatLocalizedDate(article.publishedAt)}
                          </span>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  // Compact mode: Everything on one line
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <h4 className="line-clamp-1 text-sm font-medium text-foreground group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400 flex-shrink truncate">
                        {article.title}
                      </h4>
                      <span className="flex-shrink-0 text-xs text-foreground/60 dark:text-foreground/60">
                        •
                      </span>
                      <span className="flex-shrink-0 text-xs text-foreground/60 dark:text-foreground/60">
                        {article.feeds?.name || "Unknown"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

