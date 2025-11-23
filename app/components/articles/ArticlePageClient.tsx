"use client";

import { useRef, useState, useCallback } from "react";
import { ArticleToolbar } from "./ArticleToolbar";
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
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [hasSummary, setHasSummary] = useState(!!initialSummary);

  // Use React Query to fetch preferences
  const { data: preferencesData } = useUserPreferences();
  const preferences = preferencesData ? extractReadingPreferences(preferencesData) : null;

  // Linkify URLs in content on the client side
  useLinkifyContent(contentRef);

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

  return (
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
  );
}

