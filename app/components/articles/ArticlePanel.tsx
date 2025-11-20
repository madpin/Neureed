"use client";

import { useState, useEffect } from "react";
import { ArticleViewTracker } from "./ArticleViewTracker";
import { ArticleToolbar } from "./ArticleToolbar";
import { ArticleSummary, ArticleSummaryRef } from "./ArticleSummary";
import { ArticleFeedbackSection } from "./ArticleFeedbackSection";
import { RelatedArticles } from "./RelatedArticles";
import { processArticleContent, estimateReadingTime } from "@/lib/content-processor";
import type { Article, Feed } from "@prisma/client";
import { useRef, useCallback } from "react";
import { formatLocalizedDateTime, toISOString as formatISOString } from "@/lib/date-utils";

interface ReadingPreferences {
  readingFontFamily: string;
  readingFontSize: number;
  readingLineHeight: number;
  readingParagraphSpacing: number;
  breakLineSpacing: number;
  showReadingTime: boolean;
}

function getReadingStyles(preferences: ReadingPreferences | null): React.CSSProperties {
  if (!preferences) return {};
  
  return {
    fontFamily: preferences.readingFontFamily,
    fontSize: `${preferences.readingFontSize}px`,
    lineHeight: preferences.readingLineHeight,
    '--paragraph-spacing': `${preferences.readingParagraphSpacing}rem`,
    '--break-line-spacing': `${preferences.breakLineSpacing}rem`,
  } as React.CSSProperties;
}

interface ArticleWithFeed extends Article {
  feed: Feed;
}

interface ArticlePanelProps {
  articleId: string;
  onClose: () => void;
  onReadStatusChange?: () => void;
}

function normalizeKeyPoints(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((point) => (typeof point === "string" ? point : String(point)))
      .filter((point) => point.length > 0);
  }
  return [];
}

export function ArticlePanel({ articleId, onClose, onReadStatusChange }: ArticlePanelProps) {
  const [article, setArticle] = useState<ArticleWithFeed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const summaryRef = useRef<ArticleSummaryRef>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [hasSummary, setHasSummary] = useState(false);
  const [preferences, setPreferences] = useState<ReadingPreferences | null>(null);
  const [readingTime, setReadingTime] = useState<number>(0);

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
        setHasSummary(!!(data.data?.article?.summary || data.article?.summary || data.summary));
        
        // Calculate reading time
        if (articleData?.content) {
          const time = estimateReadingTime(articleData.content);
          setReadingTime(time);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load article");
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch("/api/user/preferences");
        if (response.ok) {
          const data = await response.json();
          const prefs = data.data?.preferences;
          if (prefs) {
            setPreferences({
              readingFontFamily: prefs.readingFontFamily || "Georgia",
              readingFontSize: prefs.readingFontSize || 18,
              readingLineHeight: prefs.readingLineHeight || 1.7,
              readingParagraphSpacing: prefs.readingParagraphSpacing || 1.5,
              breakLineSpacing: prefs.breakLineSpacing || 0.75,
              showReadingTime: prefs.showReadingTime !== undefined ? prefs.showReadingTime : true,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load preferences:", err);
        // Use defaults if preferences can't be loaded
        setPreferences({
          readingFontFamily: "Georgia",
          readingFontSize: 18,
          readingLineHeight: 1.7,
          readingParagraphSpacing: 1.5,
          breakLineSpacing: 0.75,
          showReadingTime: true,
        });
      }
    };

    fetchPreferences();
  }, []);

  const handleGenerateSummary = useCallback(async () => {
    if (!summaryRef.current) return;

    setIsGeneratingSummary(true);
    try {
      await summaryRef.current.generateSummary();
      setHasSummary(true);
    } finally {
      setIsGeneratingSummary(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-foreground/70">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-8">
        <div className="text-center">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Failed to load article
          </h3>
          <p className="text-sm text-foreground/60">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const processedContent = processArticleContent(article.content, article.url);
  const initialSummary =
    article.summary && article.keyPoints && article.topics
      ? {
          summary: article.summary,
          keyPoints: normalizeKeyPoints(article.keyPoints),
          topics: Array.isArray(article.topics) ? article.topics : [],
        }
      : null;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* View Tracker */}
      <ArticleViewTracker articleId={article.id} onReadStatusChange={onReadStatusChange} />

      {/* Header with controls */}
      <div className="flex-shrink-0 border-b border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-lg p-2 hover:bg-muted"
              title="Close panel (Esc)"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <span className="text-sm font-medium text-foreground/70 truncate">
              Reading Panel
            </span>
          </div>
          <a
            href={`/articles/${article.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted border-border"
            title="Open in full page"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span className="hidden sm:inline">Full Page</span>
          </a>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <article className="mx-auto max-w-4xl px-4 py-6">
          {/* Featured Image */}
          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="mb-6 w-full rounded-lg object-cover"
              style={{ maxHeight: "300px" }}
            />
          )}

          {/* Feed Info */}
          <div className="mb-3 flex items-center gap-3 text-sm text-foreground/70">
            {article.feed.imageUrl && (
              <img
                src={article.feed.imageUrl}
                alt={article.feed.name}
                className="h-6 w-6 rounded-full"
              />
            )}
            <span className="font-medium">{article.feed.name}</span>
            <span>•</span>
            <time dateTime={formatISOString(article.publishedAt, article.createdAt)}>
              {formatLocalizedDateTime(article.publishedAt, article.createdAt)}
            </time>
            {article.author && (
              <>
                <span>•</span>
                <span>By {article.author}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="mb-4 text-3xl font-bold leading-tight text-foreground">
            {article.title}
          </h1>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="mb-6 text-lg leading-relaxed text-foreground/70 dark:text-foreground/40">
              {article.excerpt}
            </p>
          )}

          {/* Toolbar */}
          <ArticleToolbar
            articleUrl={article.url}
            onGenerateSummary={handleGenerateSummary}
            isGeneratingSummary={isGeneratingSummary}
            hasSummary={hasSummary}
            readingTime={readingTime}
            showReadingTime={preferences?.showReadingTime}
          />

          {/* AI Summary */}
          <ArticleSummary
            ref={summaryRef}
            articleId={article.id}
            initialSummary={initialSummary}
            autoExpand={!!initialSummary}
          />

          {/* Content */}
          <div
            className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:underline dark:prose-a:text-blue-400 [&_p]:mb-[var(--paragraph-spacing)] [&_br]:block [&_br]:mb-[var(--break-line-spacing)]"
            style={{
              ...getReadingStyles(preferences),
            }}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />

          {/* Feedback Section */}
          <ArticleFeedbackSection articleId={article.id} />

          {/* Related Articles */}
          <div className="mt-12">
            <RelatedArticles articleId={article.id} limit={4} minScore={0.65} />
          </div>
        </article>
      </div>
    </div>
  );
}

