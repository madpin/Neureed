"use client";

import { useState, useEffect } from "react";

interface RelevanceScoreBadgeProps {
  score: number; // 0.0 - 1.0
  className?: string;
  compact?: boolean; // Force compact mode
}

/**
 * Badge component to display relevance score for saved search matches
 * Shows condensed dots on mobile, full percentage on desktop
 */
export function RelevanceScoreBadge({
  score,
  className = "",
  compact = false
}: RelevanceScoreBadgeProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine color based on score
  const getColorClasses = (score: number) => {
    if (score >= 0.85) {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    } else if (score >= 0.7) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    } else if (score >= 0.6) {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    } else {
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  // Get dot color (for mobile)
  const getDotColor = (score: number) => {
    if (score >= 0.85) return "bg-green-500";
    else if (score >= 0.7) return "bg-blue-500";
    else if (score >= 0.6) return "bg-yellow-500";
    else return "bg-gray-500";
  };

  const percentage = Math.round(score * 100);
  const colorClasses = getColorClasses(score);
  const dotColor = getDotColor(score);
  const showCompact = compact || isMobile;

  // Calculate number of filled dots (1-3 dots based on score)
  const filledDots = score >= 0.85 ? 3 : score >= 0.7 ? 2 : 1;

  if (showCompact) {
    // Mobile: Show condensed dots
    return (
      <span
        className={`inline-flex items-center gap-0.5 ${className}`}
        title={`Relevance: ${percentage}%`}
      >
        {[1, 2, 3].map((dot) => (
          <span
            key={dot}
            className={`h-1.5 w-1.5 rounded-full ${
              dot <= filledDots ? dotColor : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
        ))}
      </span>
    );
  }

  // Desktop: Show full badge with percentage
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses} ${className}`}
      title={`Relevance: ${percentage}%`}
    >
      <svg
        className="h-3 w-3"
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
      {percentage}%
    </span>
  );
}
