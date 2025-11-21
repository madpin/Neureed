"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { FeedbackButtons } from "./FeedbackButtons";
import { RelevanceScore } from "./RelevanceScore";
import { formatSmartDate, toISOString } from "@/lib/date-utils";
import { type Article, useMarkArticleAsRead, useMarkArticleAsUnread } from "@/hooks/queries/use-articles";
import type { ArticleScore } from "@/lib/services/article-scoring-service";
import React from "react";

/**
 * Article Display Preferences
 */
export interface ArticleDisplayPreferences {
  density: "compact" | "normal" | "comfortable";
  showImage: boolean;
  showExcerpt: boolean;
  showAuthor: boolean;
  showFeedInfo: boolean;
  showDate: boolean;
  sectionOrder: string[];
}

interface ArticleCardProps {
  article: Article;
  displayPreferences?: ArticleDisplayPreferences;
  /** @deprecated Use displayPreferences instead */
  variant?: "compact" | "expanded";
  onReadStatusChange?: (articleId?: string, isRead?: boolean) => void;
  onArticleClick?: (articleId: string) => void;
  showRelevanceScore?: boolean;
  relevanceScore?: ArticleScore;
  similarity?: number;
}

// Default display preferences
const DEFAULT_PREFERENCES: ArticleDisplayPreferences = {
  density: "normal",
  showImage: true,
  showExcerpt: true,
  showAuthor: true,
  showFeedInfo: true,
  showDate: true,
  sectionOrder: ["feedInfo", "title", "excerpt", "actions"],
};

// Convert legacy variant prop to display preferences
function variantToPreferences(variant?: "compact" | "expanded"): Partial<ArticleDisplayPreferences> {
  if (!variant) return {};
  
  if (variant === "compact") {
    return {
      density: "compact",
      showImage: false,
      showExcerpt: false,
    };
  }
  
  return {
    density: "normal",
    showImage: true,
    showExcerpt: true,
  };
}

// Density-based CSS classes
function getDensityClasses(density: string) {
  switch (density) {
    case "compact":
      return {
        padding: "p-3",
        gap: "gap-2",
        titleSize: "text-base",
        metaSize: "text-xs",
        imageSize: "h-16 w-16",
      };
    case "comfortable":
      return {
        padding: "p-6",
        gap: "gap-5",
        titleSize: "text-xl",
        metaSize: "text-base",
        imageSize: "h-32 w-32",
      };
    case "normal":
    default:
      return {
        padding: "p-4",
        gap: "gap-4",
        titleSize: "text-lg",
        metaSize: "text-sm",
        imageSize: "h-24 w-24",
      };
  }
}

export const ArticleCard = React.memo(({
  article,
  displayPreferences: propPreferences,
  variant,
  onReadStatusChange,
  onArticleClick,
  showRelevanceScore = false,
  relevanceScore,
  similarity,
}: ArticleCardProps) => {
  const pathname = usePathname();
  const [isRead, setIsRead] = useState(article.isRead || false);
  const [isTogglingRead, setIsTogglingRead] = useState(false);
  
  const markAsReadMutation = useMarkArticleAsRead();
  const markAsUnreadMutation = useMarkArticleAsUnread();

  // Merge preferences (prop > variant conversion > defaults)
  const preferences = useMemo(() => {
    const variantPrefs = variantToPreferences(variant);
    return {
      ...DEFAULT_PREFERENCES,
      ...variantPrefs,
      ...propPreferences,
    };
  }, [propPreferences, variant]);

  const densityClasses = useMemo(() => getDensityClasses(preferences.density), [preferences.density]);

  // Sync local state when article prop changes
  useEffect(() => {
    setIsRead(article.isRead || false);
  }, [article.isRead]);

  // Determine the article link based on current context
  const getArticleLink = () => {
    if (onArticleClick) {
      if (typeof window !== 'undefined') {
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.set('article', article.id);
        return `/?${currentParams.toString()}`;
      }
    }
    return `/articles/${article.id}`;
  };

  const articleLink = getArticleLink();

  const toggleReadStatus = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newReadStatus = !isRead;
    setIsRead(newReadStatus);
    setIsTogglingRead(true);
    
    try {
      if (newReadStatus) {
        await markAsReadMutation.mutateAsync(article.id);
      } else {
        await markAsUnreadMutation.mutateAsync(article.id);
      }

      onReadStatusChange?.(article.id, newReadStatus);
    } catch (error) {
      console.error("Failed to toggle read status:", error);
      setIsRead(!newReadStatus);
    } finally {
      setIsTogglingRead(false);
    }
  };

  const handleArticleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    if (onArticleClick) {
      e.preventDefault();
      onArticleClick(article.id);
    }
  };

  // Section render functions
  const sections = useMemo(() => {
    const sectionMap: Record<string, () => React.ReactElement | null> = {
      feedInfo: () => {
        if (!preferences.showFeedInfo && !preferences.showDate && !preferences.showAuthor) {
          return null;
        }

        return (
          <div key="feedInfo" className={`mb-2 flex items-center ${densityClasses.gap} ${densityClasses.metaSize} text-secondary flex-wrap`}>
            {preferences.showFeedInfo && article.feeds?.imageUrl && (
              <img
                src={article.feeds.imageUrl}
                alt={article.feeds.name}
                className="h-4 w-4 rounded-full"
              />
            )}
            {preferences.showFeedInfo && article.feeds && (
              <span className="font-medium">{article.feeds.name}</span>
            )}
            {(preferences.showFeedInfo || preferences.showDate) && (
              <span>•</span>
            )}
            {preferences.showDate && (
              <time dateTime={toISOString(article.publishedAt || null, article.createdAt)}>
                {formatSmartDate(article.publishedAt || null, article.createdAt)}
              </time>
            )}
            {preferences.showAuthor && article.author && (
              <>
                <span>•</span>
                <span>{article.author}</span>
              </>
            )}
          </div>
        );
      },

      image: () => {
        if (!preferences.showImage || !article.imageUrl) {
          return null;
        }

        return (
          <div key="image" className="flex-shrink-0">
            <img
              src={article.imageUrl}
              alt={article.title}
              className={`${densityClasses.imageSize} rounded-lg object-cover`}
            />
          </div>
        );
      },

      title: () => (
        <Link
          key="title"
          href={articleLink}
          className="group-hover:text-primary transition-colors"
          onClick={handleArticleClick}
        >
          <h3 className={`mb-2 ${densityClasses.titleSize} font-semibold leading-tight line-clamp-2`}>
            {article.title}
          </h3>
        </Link>
      ),

      excerpt: () => {
        if (!preferences.showExcerpt || !article.excerpt) {
          return null;
        }

        return (
          <p key="excerpt" className={`mb-3 ${densityClasses.metaSize} text-foreground line-clamp-2`}>
            {article.excerpt}
          </p>
        );
      },

      actions: () => (
        <div key="actions" className={`flex items-center justify-between ${densityClasses.gap}`}>
          <div className={`flex items-center ${densityClasses.gap}`}>
            <Link
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 ${densityClasses.metaSize} text-primary hover:underline`}
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
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Original
            </Link>
            
            <button
              onClick={toggleReadStatus}
              disabled={isTogglingRead}
              className={`inline-flex items-center gap-1 ${densityClasses.metaSize} text-secondary hover:text-foreground disabled:opacity-50 transition-colors`}
              title={isRead ? "Mark as unread" : "Mark as read"}
            >
              {isTogglingRead ? (
                <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isRead ? (
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
              {isRead ? "Read" : "Unread"}
            </button>
          </div>

          <FeedbackButtons articleId={article.id} variant="minimal" />
        </div>
      ),
    };

    return sectionMap;
  }, [article, articleLink, preferences, densityClasses, isRead, isTogglingRead, handleArticleClick, toggleReadStatus, onArticleClick]);

  // Determine if we need the split layout (image on left, content on right)
  const hasImage = preferences.showImage && article.imageUrl;
  const imageInOrder = preferences.sectionOrder.includes("image");

  return (
    <article className={`group rounded-lg border ${densityClasses.padding} transition-all relative ${
      isRead
        ? "border-border bg-muted opacity-75"
        : "border-border bg-background hover:shadow-md"
    }`}>
      {/* Overlays (top-right) */}
      <div className="absolute right-2 top-2 z-20 flex items-center gap-2 pointer-events-none">
        {similarity !== undefined && (
          <div className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-lg pointer-events-auto">
            {Math.round(similarity * 100)}% match
          </div>
        )}
        {showRelevanceScore && relevanceScore && (
          <div className="pointer-events-auto">
            <RelevanceScore score={relevanceScore} />
          </div>
        )}
      </div>

      {/* Reading Panel Indicator */}
      {onArticleClick && (
        <div className="absolute top-2 left-2 z-10" title="Opens in reading panel (Ctrl/Cmd+Click for new tab)">
          <div className="rounded-full bg-primary/10 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="h-3 w-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className={`flex ${densityClasses.gap} ${hasImage && imageInOrder ? '' : 'flex-col'}`}>
        {/* Render image first if it's in the order and exists */}
        {hasImage && imageInOrder && sections.image()}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {preferences.sectionOrder
            .filter(key => key !== "image") // Image handled separately for layout
            .map(key => sections[key]?.())
            .filter(Boolean)}
        </div>
      </div>
    </article>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memoization
  return (
    prevProps.article.id === nextProps.article.id &&
    prevProps.article.isRead === nextProps.article.isRead &&
    JSON.stringify(prevProps.displayPreferences) === JSON.stringify(nextProps.displayPreferences) &&
    prevProps.relevanceScore?.score === nextProps.relevanceScore?.score &&
    prevProps.similarity === nextProps.similarity &&
    prevProps.showRelevanceScore === nextProps.showRelevanceScore
  );
});

ArticleCard.displayName = "ArticleCard";
