"use client";

import type { ArticleScore } from "@/src/lib/services/article-scoring-service";

interface RelevanceScoreProps {
  score: ArticleScore;
  showTooltip?: boolean;
}

export function RelevanceScore({
  score,
  showTooltip = true,
}: RelevanceScoreProps) {
  const getColorClasses = (value: number) => {
    if (value >= 0.7) {
      return {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-400",
        border: "border-green-300 dark:border-green-700",
        dot: "bg-green-500",
      };
    } else if (value >= 0.5) {
      return {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-400",
        border: "border-blue-300 dark:border-blue-700",
        dot: "bg-blue-500",
      };
    } else if (value >= 0.3) {
      return {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-700 dark:text-yellow-400",
        border: "border-yellow-300 dark:border-yellow-700",
        dot: "bg-yellow-500",
      };
    } else {
      return {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
        border: "border-red-300 dark:border-red-700",
        dot: "bg-red-500",
      };
    }
  };

  const getLabel = (value: number) => {
    if (value >= 0.7) return "High";
    if (value >= 0.5) return "Medium";
    if (value >= 0.3) return "Low";
    return "Very Low";
  };

  const colors = getColorClasses(score.score);
  const label = getLabel(score.score);

  const tooltipContent = (
    <div className="max-w-xs">
      <p className="mb-2 font-medium">{score.explanation}</p>
      {score.matchingPatterns.length > 0 && (
        <div className="mt-2 space-y-1">
          <p className="text-xs font-semibold">Top matching patterns:</p>
          {score.matchingPatterns.slice(0, 3).map((pattern, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="truncate">{pattern.keyword}</span>
              <span
                className={
                  pattern.contribution > 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }
              >
                {pattern.contribution > 0 ? "+" : ""}
                {(pattern.contribution * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="group relative inline-flex items-center">
      <div
        className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.border}`}
      >
        <div className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
        <span>{label}</span>
      </div>

      {showTooltip && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 transform rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-lg group-hover:block">
          {tooltipContent}
          <div className="absolute left-1/2 top-full -translate-x-1/2 transform border-4 border-transparent border-t-foreground" />
        </div>
      )}
    </div>
  );
}

