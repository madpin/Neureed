"use client";

interface ArticleToolbarProps {
  articleUrl: string;
  onGenerateSummary: () => void;
  isGeneratingSummary?: boolean;
  hasSummary?: boolean;
}

export function ArticleToolbar({
  articleUrl,
  onGenerateSummary,
  isGeneratingSummary = false,
  hasSummary = false,
}: ArticleToolbarProps) {
  return (
    <div className="sticky top-0 z-10 -mx-4 mb-4 border-y border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95">
      <div className="flex items-center justify-between gap-3">
        <a
          href={articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50 dark:focus:ring-offset-gray-900"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Read Original
        </a>

          <button
            onClick={onGenerateSummary}
            disabled={isGeneratingSummary}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
            title={hasSummary ? "View AI summary" : "Generate AI summary"}
          >
            {isGeneratingSummary ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
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

