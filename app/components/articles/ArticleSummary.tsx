"use client";

import {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
  ForwardedRef,
} from "react";
import {
  useArticleSummary,
  useGenerateArticleSummary,
} from "@/hooks/queries/use-articles";

interface ArticleSummaryProps {
  articleId: string;
  autoExpand?: boolean;
  initialSummary?: {
    summary: string;
    keyPoints: string[];
    topics: string[];
  } | null;
}

export interface ArticleSummaryRef {
  generateSummary: () => Promise<void>;
  isLoading: boolean;
  hasSummary: boolean;
  scrollToSummary: () => void;
}

function ArticleSummaryComponent(
  {
    articleId,
    autoExpand = false,
    initialSummary = null,
  }: ArticleSummaryProps,
  ref: ForwardedRef<ArticleSummaryRef>,
) {
  // If we have an initial summary, we start with it expanded if requested
  // But we only request data from API if we don't have initial summary AND it's explicitly requested
  const [isExpanded, setIsExpanded] = useState(autoExpand || !!initialSummary);
  const [summaryRef, setSummaryRef] = useState<HTMLDivElement | null>(null);
  
  // We only want to fetch if we don't have initial summary and the user requested it
  const [hasRequestedSummary, setHasRequestedSummary] = useState(false);

  // Use React Query hooks
  // We enable the query only when requested
  const { data: summaryData, isLoading: isQueryLoading, error: queryError } = useArticleSummary(
    articleId, 
    hasRequestedSummary && !initialSummary
  );
  
  const generateMutation = useGenerateArticleSummary();

  const scrollToSummary = () => {
    if (summaryRef) {
      summaryRef.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const generateSummary = async () => {
    const currentSummary = summaryData || initialSummary;

    if (currentSummary) {
      // If summary already exists, just expand and scroll to it
      setIsExpanded(true);
      scrollToSummary();
      return;
    }

    setHasRequestedSummary(true);

    // If we don't have data, we might need to trigger generation explicitly if the query doesn't auto-trigger
    // The useArticleSummary query will try to fetch. If it fails (404), we might want to trigger generation.
    // But useGenerateArticleSummary is specifically for *generating* (POST), while useArticleSummary is for *fetching* (GET).
    // The previous code used generateMutation.mutateAsync.
    
    try {
      await generateMutation.mutateAsync(articleId);
      setIsExpanded(true);
      scrollToSummary(); // Scroll after generation
    } catch (err) {
      console.error("Error generating summary:", err);
    }
  };

  const isLoading = generateMutation.isPending || (hasRequestedSummary && isQueryLoading && !initialSummary);
  const error = generateMutation.error || queryError;
  const displaySummary = summaryData || initialSummary;

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    generateSummary,
    isLoading,
    hasSummary: !!displaySummary,
    scrollToSummary,
  }));

  // Auto-expand if requested
  useEffect(() => {
    if (autoExpand && displaySummary) {
      setIsExpanded(true);
      // Small delay to ensure rendering before scroll
      setTimeout(scrollToSummary, 100);
    }
  }, [autoExpand, displaySummary]);

  if (!hasRequestedSummary && !displaySummary && !isLoading) {
    return null;
  }

  return (
    <div
      ref={setSummaryRef}
      className="my-8 rounded-lg border border-border bg-background p-6 shadow-sm border-border bg-background"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">
          AI Summary
        </h2>
        {displaySummary && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        )}
      </div>

      {isLoading && (
        <div className="mt-4 flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <span className="ml-3 text-foreground/70">
            Generating summary...
          </span>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error instanceof Error ? error.message : "An error occurred"}
        </div>
      )}

      {displaySummary && isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Summary */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground/70">
              Summary
            </h3>
            <p className="text-foreground/70">{displaySummary.summary}</p>
          </div>

          {/* Key Points */}
          {displaySummary.keyPoints && displaySummary.keyPoints.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground/70">
                Key Points
              </h3>
              <ul className="list-inside list-disc space-y-1 text-foreground/70">
                {displaySummary.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Topics */}
          {displaySummary.topics && displaySummary.topics.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground/70">
                Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {displaySummary.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {displaySummary && !isExpanded && (
        <p className="mt-4 text-sm text-foreground/70">
          Click &quot;Expand&quot; to view the AI-generated summary
        </p>
      )}

      {!displaySummary && !isLoading && !error && hasRequestedSummary && (
        <p className="mt-4 text-sm text-foreground/70">
          Use the Summary button in the toolbar to generate an AI overview for this article.
        </p>
      )}
    </div>
  );
}

export const ArticleSummary = forwardRef(ArticleSummaryComponent);
