"use client";

import {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
  ForwardedRef,
} from "react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!!initialSummary);
  const [summary, setSummary] = useState<{
    summary: string;
    keyPoints: string[];
    topics: string[];
  } | null>(initialSummary);
  const [error, setError] = useState<string | null>(null);
  const [summaryRef, setSummaryRef] = useState<HTMLDivElement | null>(null);
  const [hasRequestedSummary, setHasRequestedSummary] = useState(
    !!initialSummary
  );

  const generateSummary = async () => {
    if (summary) {
      // If summary already exists, just expand and scroll to it
      setIsExpanded(true);
      scrollToSummary();
      return;
    }

    setHasRequestedSummary(true);
    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching summary for article:", articleId);
      const response = await fetch(`/api/articles/${articleId}/summary`);
      console.log("Response status:", response.status, response.statusText);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.log("Error response data:", errorData);
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorData = {};
        }
        
        const errorMessage = errorData.error || errorData.message || `Server error: ${response.status} ${response.statusText}`;
        console.error("Error message:", errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Success response data:", data);
      setSummary(data.data?.summary || null);
      setIsExpanded(true);
    } catch (err) {
      console.error("Error generating summary:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToSummary = () => {
    if (summaryRef) {
      summaryRef.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    generateSummary,
    isLoading,
    hasSummary: !!summary,
    scrollToSummary,
  }));

  // Auto-expand if requested
  useEffect(() => {
    if (autoExpand && summary) {
      setIsExpanded(true);
      setTimeout(scrollToSummary, 100);
    }
  }, [autoExpand, summary]);

  if (!hasRequestedSummary && !summary) {
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
        {summary && (
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
          {error}
        </div>
      )}

      {summary && isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Summary */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground/70">
              Summary
            </h3>
            <p className="text-foreground/70">{summary.summary}</p>
          </div>

          {/* Key Points */}
          {summary.keyPoints && summary.keyPoints.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground/70">
                Key Points
              </h3>
              <ul className="list-inside list-disc space-y-1 text-foreground/70">
                {summary.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Topics */}
          {summary.topics && summary.topics.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground/70">
                Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {summary.topics.map((topic, index) => (
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

      {summary && !isExpanded && (
        <p className="mt-4 text-sm text-foreground/70">
          Click "Expand" to view the AI-generated summary
        </p>
      )}

      {!summary && !isLoading && !error && hasRequestedSummary && (
        <p className="mt-4 text-sm text-foreground/70">
          Use the Summary button in the toolbar to generate an AI overview for this article.
        </p>
      )}
    </div>
  );
}

export const ArticleSummary = forwardRef(ArticleSummaryComponent);

