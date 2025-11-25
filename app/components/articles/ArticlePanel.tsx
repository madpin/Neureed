"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArticleViewTracker } from "./ArticleViewTracker";
import { ArticleToolbar, ViewMode } from "./ArticleToolbar";
import { ArticleSummary, ArticleSummaryRef } from "./ArticleSummary";
import { ArticleFeedbackSection } from "./ArticleFeedbackSection";
import { RelatedArticles } from "./RelatedArticles";
import { LoadingSpinner } from "@/app/components/layout/LoadingSpinner";
import { processArticleContent, estimateReadingTime } from "@/lib/content-processor";
import { formatLocalizedDateTime, toISOString as formatISOString } from "@/lib/date-utils";
import { useArticle } from "@/hooks/queries/use-articles";
import { useUserPreferences, type UserPreferences } from "@/hooks/queries/use-user-preferences";
import { useLinkifyContent } from "@/hooks/use-linkify-content";

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

interface ArticlePanelProps {
  articleId: string;
  onClose: () => void;
  onReadStatusChange?: () => void;
  variant?: "panel" | "inline" | "standalone";
}

function normalizeKeyPoints(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((point) => (typeof point === "string" ? point : String(point)))
      .filter((point) => point.length > 0);
  }
  return [];
}

export function ArticlePanel({ articleId, onClose, onReadStatusChange, variant = "panel" }: ArticlePanelProps) {
  const summaryRef = useRef<ArticleSummaryRef>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [hasSummary, setHasSummary] = useState(false);
  const [readingTime, setReadingTime] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>("extracted");
  const [iframeError, setIframeError] = useState(false);

  // Use React Query hooks
  const { data: article, isLoading, error } = useArticle(articleId);
  const { data: userPrefs } = useUserPreferences();

  // Linkify URLs in content on the client side
  useLinkifyContent(contentRef);
  
  // Map user preferences to reading preferences
  const preferences: ReadingPreferences | null = userPrefs ? {
    readingFontFamily: userPrefs.readingFontFamily || "Georgia",
    readingFontSize: userPrefs.readingFontSize || 18,
    readingLineHeight: userPrefs.readingLineHeight || 1.7,
    readingParagraphSpacing: userPrefs.readingParagraphSpacing || 1.5,
    breakLineSpacing: userPrefs.breakLineSpacing || 0.75,
    showReadingTime: userPrefs.showReadingTime !== undefined ? userPrefs.showReadingTime : true,
  } : null;

  // Effect to calculate reading time and check for summary
  useEffect(() => {
    if (article) {
      setHasSummary(!!article.summary);

      if (article.content) {
        const time = estimateReadingTime(article.content);
        setReadingTime(time);
      }
    }
  }, [article]);

  // Reset view mode and iframe error when article changes
  useEffect(() => {
    setViewMode("extracted");
    setIframeError(false);
  }, [articleId]);

  // Listen for iframe height messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'iframe-height' && iframeRef.current) {
        const height = event.data.height;
        if (height && height > 0) {
          iframeRef.current.style.height = `${height}px`;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    setIframeError(false);
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
        <LoadingSpinner size="lg" text="Loading article..." />
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
          <p className="text-sm text-foreground/60">{error ? (error as Error).message : "Unknown error"}</p>
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

  const processedContent = processArticleContent(article.content || "", article.url);
  const initialSummary =
    article.summary && article.keyPoints && article.topics
      ? {
          summary: article.summary,
          keyPoints: normalizeKeyPoints(article.keyPoints),
          topics: Array.isArray(article.topics) ? article.topics : [],
        }
      : null;

  // Container classes based on variant
  const containerClasses = variant === "inline"
    ? "flex h-full flex-col bg-background"
    : "flex h-full flex-col bg-background";

  return (
    <div className={containerClasses}>
      {/* View Tracker */}
      <ArticleViewTracker articleId={article.id} estimatedTime={readingTime * 60} onReadStatusChange={onReadStatusChange} />

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
            <div className="group relative">
              <svg
                className="h-4 w-4 text-foreground/50 cursor-help"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-50 w-64 rounded-lg border border-border bg-background p-3 shadow-lg text-xs">
                <p className="text-foreground/80">
                  Customize panel position, size, and other settings in <strong>Preferences → Reading</strong>
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Original View Toggle */}
            <button
              onClick={() => handleViewModeChange(viewMode === "original" ? "extracted" : "original")}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "original"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-border hover:bg-muted"
              }`}
              title={viewMode === "original" ? "View extracted content" : "View original website"}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span className="hidden sm:inline">Original</span>
            </button>

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
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === "original" ? (
          /* Original Website View - Iframe Only */
          <div className="h-full w-full bg-white">
            {iframeError ? (
              <div className="flex items-center justify-center p-12 h-full">
                <div className="max-w-md text-center">
                  <svg
                    className="mx-auto mb-4 h-16 w-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    Unable to Display Website
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    This website cannot be displayed in an embedded frame due to security restrictions set by the website.
                  </p>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open in New Tab
                  </a>
                </div>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                src={`/api/proxy?url=${encodeURIComponent(article.url)}&type=html`}
                className="w-full bg-white"
                style={{ height: "300vh", minHeight: "2000px", colorScheme: "light" }}
                scrolling="no"
                title={article.title}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                onError={() => setIframeError(true)}
              />
            )}
          </div>
        ) : (
          /* Extracted Content View - Constrained Width */
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
              {article.feeds?.imageUrl && (
                <img
                  src={article.feeds.imageUrl}
                  alt={article.feeds.name}
                  className="h-6 w-6 rounded-full"
                />
              )}
              <span className="font-medium">{article.feeds?.name}</span>
              <span>•</span>
              <time dateTime={formatISOString(article.publishedAt || null, article.createdAt)}>
                {formatLocalizedDateTime(article.publishedAt || null, article.createdAt)}
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
              ref={contentRef}
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
        )}
      </div>
    </div>
  );
}

