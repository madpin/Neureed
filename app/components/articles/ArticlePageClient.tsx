"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ArticleToolbar, ViewMode } from "./ArticleToolbar";
import { ArticleSummary, ArticleSummaryRef } from "./ArticleSummary";
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

function extractReadingPreferences(prefs: UserPreferences): ReadingPreferences {
  return {
    readingFontFamily: prefs.readingFontFamily || "Georgia",
    readingFontSize: prefs.readingFontSize || 18,
    readingLineHeight: prefs.readingLineHeight || 1.7,
    readingParagraphSpacing: prefs.readingParagraphSpacing || 1.5,
    breakLineSpacing: prefs.breakLineSpacing || 0.75,
    showReadingTime: prefs.showReadingTime !== undefined ? prefs.showReadingTime : true,
  };
}

interface ArticlePageClientProps {
  articleId: string;
  articleUrl: string;
  headerContent: React.ReactNode;
  content: string; // Changed from mainContent ReactNode to content string
  footerContent: React.ReactNode;
  readingTime?: number;
  initialSummary?: {
    summary: string;
    keyPoints: string[];
    topics: string[];
  } | null;
}

export function ArticlePageClient({
  articleId,
  articleUrl,
  headerContent,
  content,
  footerContent,
  readingTime,
  initialSummary = null,
}: ArticlePageClientProps) {
  const summaryRef = useRef<ArticleSummaryRef>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [hasSummary, setHasSummary] = useState(!!initialSummary);
  const [viewMode, setViewMode] = useState<ViewMode>("extracted");
  const [iframeError, setIframeError] = useState(false);

  // Use React Query to fetch preferences
  const { data: preferencesData } = useUserPreferences();
  const preferences = preferencesData ? extractReadingPreferences(preferencesData) : null;

  // Linkify URLs in content on the client side
  useLinkifyContent(contentRef);

  // Reset iframe error when view mode changes
  useEffect(() => {
    if (viewMode === "original") {
      setIframeError(false);
    }
  }, [viewMode]);

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

  return (
    <>
      {viewMode === "original" ? (
        /* Original Website View - Full Screen Iframe */
        <div className="fixed inset-0 bg-white" style={{ paddingTop: "60px" }}>
          {/* Floating Toggle Button */}
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={() => handleViewModeChange("extracted")}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-lg hover:bg-gray-50"
              title="View extracted content"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Close Original</span>
            </button>
          </div>

          {iframeError ? (
            <div className="flex h-full items-center justify-center p-12">
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
                  href={articleUrl}
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
              src={`/api/proxy?url=${encodeURIComponent(articleUrl)}&type=html`}
              className="h-full w-full bg-white"
              style={{ colorScheme: "light" }}
              scrolling="no"
              title={`Original article from ${articleUrl}`}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
              onError={() => setIframeError(true)}
            />
          )}
        </div>
      ) : (
        /* Extracted Content View */
        <article className="mx-auto max-w-4xl px-4 py-8">
          {/* Header Content (Image, Metadata, Title, Excerpt) */}
          {headerContent}

          {/* Sticky Toolbar - sticks to top when scrolled past */}
          <ArticleToolbar
            articleUrl={articleUrl}
            onGenerateSummary={handleGenerateSummary}
            isGeneratingSummary={isGeneratingSummary}
            hasSummary={hasSummary}
            readingTime={readingTime}
            showReadingTime={preferences?.showReadingTime}
          />

          {/* View Mode Toggle */}
          <div className="mb-4 flex justify-center">
            <button
              onClick={() => handleViewModeChange("original")}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              title="View original website"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span>View Original Website</span>
            </button>
          </div>

          {/* AI Summary */}
          <ArticleSummary
            ref={summaryRef}
            articleId={articleId}
            initialSummary={initialSummary}
            autoExpand={!!initialSummary}
          />

          {/* Main Content (Article body) */}
          <div
            ref={contentRef}
            className="prose prose-lg max-w-none dark:prose-invert [&_p]:mb-[var(--paragraph-spacing)] [&_br]:block [&_br]:mb-[var(--break-line-spacing)]"
            style={{
              ...getReadingStyles(preferences),
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Footer Content (Feedback, Related Articles) */}
          {footerContent}
        </article>
      )}
    </>
  );
}

