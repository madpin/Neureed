"use client";

import { useState } from "react";

interface MatchReasonTooltipProps {
  matchedTerms: string[];
  matchReason?: string;
  relevanceScore: number;
}

/**
 * Tooltip component explaining why an article matched a saved search
 */
export function MatchReasonTooltip({
  matchedTerms,
  matchReason,
  relevanceScore,
}: MatchReasonTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors"
        title="Why this article matched"
      >
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
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Why this article?
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-lg border border-border bg-background p-4 shadow-lg"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* Score */}
          <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
            <span className="text-sm font-medium text-foreground">
              Match Quality
            </span>
            <span className="text-sm font-bold text-primary">
              {Math.round(relevanceScore * 100)}%
            </span>
          </div>

          {/* Matched Terms */}
          {matchedTerms.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
                Matched Terms
              </h4>
              <div className="flex flex-wrap gap-1">
                {matchedTerms.map((term, index) => (
                  <span
                    key={index}
                    className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Match Reason */}
          {matchReason && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
                Reason
              </h4>
              <p className="text-xs text-foreground leading-relaxed">
                {matchReason}
              </p>
            </div>
          )}

          {/* Arrow pointing down */}
          <div className="absolute left-4 top-full h-2 w-2 -translate-y-1 rotate-45 border-b border-r border-border bg-background"></div>
        </div>
      )}
    </div>
  );
}
