"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArticlePageClient } from "@/app/components/articles/ArticlePageClient";
import { ArticleFeedbackSection } from "@/app/components/articles/ArticleFeedbackSection";
import { RelatedArticles } from "@/app/components/articles/RelatedArticles";
import { processArticleContent, estimateReadingTime } from "@/lib/content-processor";
import { formatLocalizedDateTime } from "@/lib/date-utils";
import type { Article, Feed } from "@prisma/client";

type ArticleWithFeed = Article & { feed: Feed };

/**
 * Standalone article page - displays article in full page view
 * This is used when reading panel is disabled or when opening articles in a new tab
 */
export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;
  const [article, setArticle] = useState<ArticleWithFeed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/articles/${articleId}`);
        if (!response.ok) {
          throw new Error("Failed to load article");
        }
        const data = await response.json();
        const articleData = data.data?.article || data.article || data;
        setArticle(articleData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load article");
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-foreground/70">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-red-600 dark:text-red-400">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-foreground/70 mb-4">{error || "Article not found"}</p>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const processedContent = processArticleContent(article.content || "", article.url);
  const readingTime = estimateReadingTime(article.content || "");
  const publishedDate = article.publishedAt ? formatLocalizedDateTime(article.publishedAt) : null;

  // Parse summary if it's a JSON string, otherwise pass through
  let parsedSummary = null;
  if (article.summary) {
    if (typeof article.summary === "string") {
      try {
        // Try to parse as JSON
        parsedSummary = JSON.parse(article.summary);
      } catch {
        // If it's not valid JSON, it might be a plain string summary
        // In that case, we don't have a structured summary to pass
        parsedSummary = null;
      }
    } else {
      parsedSummary = article.summary;
    }
  }

  // Header content (image, metadata, title, excerpt)
  const headerContent = (
    <>
      {article.imageUrl && (
        <div className="mb-6 -mx-4 overflow-hidden rounded-lg">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-auto max-h-96 object-cover"
          />
        </div>
      )}

      {/* Feed and Date */}
      <div className="mb-4 flex items-center gap-2 text-sm text-foreground/60">
        {article.feed && (
          <>
            {article.feed.imageUrl && (
              <img
                src={article.feed.imageUrl}
                alt={article.feed.name}
                className="h-5 w-5 rounded-full"
              />
            )}
            <span className="font-medium">{article.feed.name}</span>
            {publishedDate && <span>•</span>}
          </>
        )}
        {publishedDate && <time dateTime={article.publishedAt?.toISOString()}>{publishedDate}</time>}
      </div>

      {/* Title */}
      <h1 className="mb-4 text-4xl font-bold text-foreground">{article.title}</h1>

      {/* Excerpt */}
      {article.excerpt && (
        <p className="mb-6 text-lg text-foreground/70 leading-relaxed">{article.excerpt}</p>
      )}
    </>
  );

  // Footer content (feedback, related articles)
  const footerContent = (
    <>
      <ArticleFeedbackSection articleId={article.id} />
      <div className="mt-12">
        <RelatedArticles articleId={article.id} limit={4} minScore={0.65} />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Feed
            </button>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <span>View Original</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <ArticlePageClient
        articleId={article.id}
        articleUrl={article.url}
        headerContent={headerContent}
        mainContent={<div dangerouslySetInnerHTML={{ __html: processedContent }} />}
        footerContent={footerContent}
        readingTime={readingTime}
        initialSummary={parsedSummary}
      />
    </div>
  );
}
