"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useUserPreferences } from "@/hooks/queries/use-user-preferences";
import {
  useTrackArticleView,
  useMarkArticleAsRead,
  useTrackArticleExit,
} from "@/hooks/queries/use-articles";

interface ArticleViewTrackerProps {
  articleId: string;
  estimatedTime: number; // in seconds
  onReadStatusChange?: () => void;
}

export function ArticleViewTracker({ articleId, estimatedTime, onReadStatusChange }: ArticleViewTrackerProps) {
  const { data: session } = useSession();
  const { data: preferences } = useUserPreferences();
  const trackView = useTrackArticleView();
  const markAsRead = useMarkArticleAsRead();
  const trackExit = useTrackArticleExit();

  const viewStartTime = useRef<number | null>(null);
  const hasTrackedView = useRef(false);

  const autoMarkAsRead = preferences?.autoMarkAsRead ?? false;

  // Track view on mount
  useEffect(() => {
    if (!session?.user || hasTrackedView.current) return;

    trackView.mutate(articleId, {
      onSuccess: () => {
        viewStartTime.current = Date.now();
        hasTrackedView.current = true;

        // Mark as read if preference is enabled
        if (autoMarkAsRead) {
          markAsRead.mutate(articleId, {
            onSuccess: () => {
              onReadStatusChange?.();
            },
          });
        }
      },
    });
  }, [articleId, session, autoMarkAsRead]);

  // Track exit on unmount
  useEffect(() => {
    if (!session?.user) return;

    const handleExit = () => {
      if (viewStartTime.current === null) return;

      const timeSpent = Math.floor((Date.now() - viewStartTime.current) / 1000);
      if (timeSpent < 0) return;

      // Don't track if estimatedTime is not yet calculated (0 or negative)
      if (estimatedTime <= 0) return;

      trackExit.mutate({
        articleId,
        data: {
          timeSpent,
          estimatedTime,
        },
      });
    };

    window.addEventListener("beforeunload", handleExit);

    return () => {
      window.removeEventListener("beforeunload", handleExit);
      handleExit();
    };
  }, [articleId, session]);

  return null;
}

