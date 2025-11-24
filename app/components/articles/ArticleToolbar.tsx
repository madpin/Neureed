"use client";

export type ViewMode = "extracted" | "original";

interface ArticleToolbarProps {
  articleUrl: string;
  onGenerateSummary: () => void;
  isGeneratingSummary?: boolean;
  hasSummary?: boolean;
  readingTime?: number;
  showReadingTime?: boolean;
}

export function ArticleToolbar({
  articleUrl,
  onGenerateSummary,
  isGeneratingSummary = false,
  hasSummary = false,
  readingTime,
  showReadingTime = true,
}: ArticleToolbarProps) {
  return (
    <div className="md:sticky top-0 z-10 -mx-4 mb-4 border-y border-border bg-background/95 px-4 py-3 backdrop-blur-sm border-border bg-background/95">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {showReadingTime && readingTime !== undefined && (
            <div className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground/80 bg-background dark:text-foreground/40">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">
                {readingTime} {readingTime === 1 ? 'min' : 'mins'} read
              </span>
              <span className="sm:hidden">
                {readingTime} {readingTime === 1 ? 'min' : 'mins'}
              </span>
            </div>
          )}
        </div>

          <button
            onClick={onGenerateSummary}
            disabled={isGeneratingSummary}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            title={hasSummary ? "View AI summary" : "Generate AI summary"}
          >
            {isGeneratingSummary ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-blue-600"></div>
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : (
              <>
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {hasSummary ? "View Summary" : "Generate Summary"}
                </span>
                <span className="sm:hidden">Summary</span>
              </>
            )}
          </button>
        </div>
    </div>
  );
}

