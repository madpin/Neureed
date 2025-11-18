"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ArticleToolbar } from "./ArticleToolbar";
import { ArticleSummary, ArticleSummaryRef } from "./ArticleSummary";

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
    // @ts-ignore - CSS custom properties
    '--paragraph-spacing': `${preferences.readingParagraphSpacing}rem`,
    // @ts-ignore - CSS custom properties
    '--break-line-spacing': `${preferences.breakLineSpacing}rem`,
  };
}

interface ArticlePageClientProps {
  articleId: string;
  articleUrl: string;
  headerContent: React.ReactNode;
  mainContent: React.ReactNode;
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
  mainContent,
  footerContent,
  readingTime,
  initialSummary = null,
}: ArticlePageClientProps) {
  const summaryRef = useRef<ArticleSummaryRef>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [hasSummary, setHasSummary] = useState(!!initialSummary);
  const [preferences, setPreferences] = useState<ReadingPreferences | null>(null);

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
        className="[&>div]:prose [&>div]:prose-lg [&>div]:max-w-none [&>div]:dark:prose-invert [&_p]:mb-[var(--paragraph-spacing)] [&_br]:block [&_br]:mb-[var(--break-line-spacing)]"
        style={{
          ...getReadingStyles(preferences),
        }}
      >
        {mainContent}
      </div>

      {/* Footer Content (Feedback, Related Articles) */}
      {footerContent}
    </article>
  );
}

