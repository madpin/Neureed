"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Article, Feed } from "@prisma/client";
import { FeedbackButtons } from "./FeedbackButtons";

interface ArticleWithFeed extends Article {
  feed: Feed;
  isRead?: boolean;
  readAt?: Date;
}

interface ArticleCardProps {
  article: ArticleWithFeed;
  variant?: "compact" | "expanded";
  onReadStatusChange?: (articleId: string, isRead: boolean) => void;
  onArticleClick?: (articleId: string) => void;
}

export function ArticleCard({ article, variant = "compact", onReadStatusChange, onArticleClick }: ArticleCardProps) {
  const pathname = usePathname();
  const [isRead, setIsRead] = useState(article.isRead || false);
  const [isTogglingRead, setIsTogglingRead] = useState(false);

  // Sync local state when article prop changes (e.g., after page refresh)
  useEffect(() => {
    setIsRead(article.isRead || false);
  }, [article.isRead]);

  // Determine the article link based on current context
  const getArticleLink = () => {
    // Extract feedId from current path if we're on a feed page
    const feedMatch = pathname?.match(/^\/feeds\/([^\/]+)/);
    
    if (feedMatch) {
      const feedId = feedMatch[1];
      return `/feeds/${feedId}/articles/${article.id}`;
    }
    
    // Default to article route (will redirect to home with query param)
    return `/articles/${article.id}`;
  };

  const articleLink = getArticleLink();

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Unknown date";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Unknown date";
    
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const toggleReadStatus = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsTogglingRead(true);
    try {
      const method = isRead ? "DELETE" : "POST";
      const response = await fetch(`/api/user/articles/${article.id}/read`, {
        method,
      });

      if (response.ok) {
        const newReadStatus = !isRead;
        setIsRead(newReadStatus);
        onReadStatusChange?.(article.id, newReadStatus);
      }
    } catch (error) {
      console.error("Failed to toggle read status:", error);
    } finally {
      setIsTogglingRead(false);
    }
  };

  const handleArticleClick = (e: React.MouseEvent) => {
    // Allow Ctrl/Cmd+click to open in new tab
    if (e.ctrlKey || e.metaKey) {
      console.log("[ArticleCard] Ctrl/Cmd+click detected, allowing default behavior");
      return;
    }

    // If onArticleClick is provided (reading panel mode), use it
    if (onArticleClick) {
      console.log("[ArticleCard] Opening in reading panel:", article.id);
      e.preventDefault();
      onArticleClick(article.id);
    } else {
      console.log("[ArticleCard] No onArticleClick handler, navigating normally");
    }
    // Otherwise, let the Link handle navigation normally
  };

  return (
    <article className={`group rounded-lg border p-4 transition-all ${
      isRead
        ? "border-border bg-muted opacity-75"
        : "border-border bg-background hover:shadow-md"
    }`}>
      <div className="flex gap-4">
        {/* Image */}
        {variant === "expanded" && article.imageUrl && (
          <div className="flex-shrink-0">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="h-24 w-24 rounded-lg object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Feed Info */}
          <div className="mb-2 flex items-center gap-2 text-xs text-secondary">
            {article.feed?.imageUrl && (
              <img
                src={article.feed.imageUrl}
                alt={article.feed.name}
                className="h-4 w-4 rounded-full"
              />
            )}
            {article.feed && (
              <span className="font-medium">{article.feed.name}</span>
            )}
            <span>•</span>
            <time dateTime={article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined}>
              {formatDate(article.publishedAt)}
            </time>
            {article.author && (
              <>
                <span>•</span>
                <span>{article.author}</span>
              </>
            )}
          </div>

          {/* Title */}
          <Link
            href={articleLink}
            className="group-hover:text-primary transition-colors"
            onClick={handleArticleClick}
          >
            <h3 className="mb-2 text-lg font-semibold leading-tight line-clamp-2">
              {article.title}
            </h3>
          </Link>

          {/* Excerpt */}
          {variant === "expanded" && article.excerpt && (
            <p className="mb-3 text-sm text-foreground line-clamp-2">
              {article.excerpt}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
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
              
              {/* Read/Unread Toggle */}
              <button
                onClick={toggleReadStatus}
                disabled={isTogglingRead}
                className="inline-flex items-center gap-1 text-xs text-secondary hover:text-foreground disabled:opacity-50 transition-colors"
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

            {/* Minimal Feedback Buttons */}
            <FeedbackButtons articleId={article.id} variant="minimal" />
          </div>
        </div>
      </div>
    </article>
  );
}

