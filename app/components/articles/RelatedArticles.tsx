"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatLocalizedDate } from "@/lib/date-utils";

interface RelatedArticle {
  id: string;
  title: string;
  excerpt?: string;
  imageUrl?: string;
  publishedAt?: string;
  similarity: number;
  feed: {
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
  const [articles, setArticles] = useState<RelatedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noEmbedding, setNoEmbedding] = useState(false);
  const [showExcerpts, setShowExcerpts] = useState(false);

  // Fetch user preferences
  useEffect(() => {
    async function fetchPreferences() {
      if (!session?.user) {
        setShowExcerpts(false);
        return;
      }

      try {
        const response = await fetch("/api/user/preferences");
        if (response.ok) {
          const data = await response.json();
          setShowExcerpts(data.data?.preferences?.showRelatedExcerpts || false);
        }
      } catch (err) {
        console.error("Failed to fetch preferences:", err);
      }
    }

    fetchPreferences();
  }, [session]);

  useEffect(() => {
    async function fetchRelatedArticles() {
      try {
        const response = await fetch(
          `/api/articles/${articleId}/related?limit=${limit}&minScore=${minScore}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch related articles");
        }

        const data: ApiResponse = await response.json();
        setArticles(data.data.results || []);
        
        // Check if the message indicates no embedding
        if (data.data.message?.includes("no embedding")) {
          setNoEmbedding(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRelatedArticles();
  }, [articleId, limit, minScore]);

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
    // Check if it's a "no embedding" error
    const isNoEmbedding = error.includes("no embedding") || error.includes("Article has no embedding");
    
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
          Failed to load related articles: {error}
        </p>
      </div>
    );
  }

  if (articles.length === 0) {
    // Show helpful message if no embedding exists
    if (noEmbedding) {
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
              {article.imageUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="h-16 w-16 rounded object-cover"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                {showExcerpts ? (
                  // Expanded mode: Title on top, excerpt below, metadata at bottom
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                        {article.title}
                      </h4>
                      <span className="flex-shrink-0 rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {Math.round(article.similarity * 100)}%
                      </span>
                    </div>
                    {article.excerpt && (
                      <p className="mt-1 line-clamp-2 text-xs text-foreground/70">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-foreground/60 dark:text-foreground/60">
                      <span>{article.feed.name}</span>
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
                        {article.feed.name}
                      </span>
                    </div>
                    <span className="flex-shrink-0 rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {Math.round(article.similarity * 100)}%
                    </span>
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

