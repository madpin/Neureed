"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, apiPost } from "@/lib/query/api-client";
import { queryKeys } from "@/lib/query/query-keys";

function truncateDetail(text: string, max = 240): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

interface ArticleExtractionWarningProps {
  articleId: string;
  extractionStatus?: string;
  extractionError?: string | null;
}

/**
 * Shown when server-side full-page extraction failed and the reader is seeing RSS-only body.
 */
export function ArticleExtractionWarning({
  articleId,
  extractionStatus,
  extractionError,
}: ArticleExtractionWarningProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  if (extractionStatus !== "FAILED") {
    return null;
  }

  const handleRetry = async () => {
    setLoading(true);
    try {
      await apiPost<{ articleId: string }>(`/api/articles/${articleId}/extract`, {});
      await queryClient.invalidateQueries({ queryKey: queryKeys.articles.detail(articleId) });
      toast.success("Full article text loaded");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Could not extract article";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const detail =
    extractionError && extractionError.length > 0
      ? truncateDetail(extractionError)
      : null;

  return (
    <div
      role="alert"
      className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/50 dark:bg-amber-500/15 dark:text-amber-100"
    >
      <p className="font-medium">Full article could not be loaded from the website</p>
      <p className="mt-1 text-amber-900/85 dark:text-amber-100/85">
        You may be seeing only the feed preview. Try again, or open the original page.
      </p>
      {detail && (
        <p className="mt-2 font-mono text-xs text-amber-900/70 dark:text-amber-100/70">
          {detail}
        </p>
      )}
      <div className="mt-3">
        <button
          type="button"
          disabled={loading}
          onClick={handleRetry}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
        >
          {loading ? "Retrying…" : "Retry extraction"}
        </button>
      </div>
    </div>
  );
}
