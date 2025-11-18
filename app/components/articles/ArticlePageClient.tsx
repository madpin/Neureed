"use client";

import { useRef, useState, useCallback } from "react";
import { ArticleToolbar } from "./ArticleToolbar";
import { ArticleSummary, ArticleSummaryRef } from "./ArticleSummary";

interface ArticlePageClientProps {
  articleId: string;
  articleUrl: string;
  headerContent: React.ReactNode;
  mainContent: React.ReactNode;
  footerContent: React.ReactNode;
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
  initialSummary = null,
}: ArticlePageClientProps) {
  const summaryRef = useRef<ArticleSummaryRef>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [hasSummary, setHasSummary] = useState(!!initialSummary);

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
      />

      {/* AI Summary */}
      <ArticleSummary
        ref={summaryRef}
        articleId={articleId}
        initialSummary={initialSummary}
        autoExpand={!!initialSummary}
      />

      {/* Main Content (Article body) */}
      {mainContent}

      {/* Footer Content (Feedback, Related Articles) */}
      {footerContent}
    </article>
  );
}

