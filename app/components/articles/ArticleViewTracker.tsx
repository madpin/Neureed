"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ArticleViewTrackerProps {
  articleId: string;
  onReadStatusChange?: () => void;
}

export function ArticleViewTracker({ articleId, onReadStatusChange }: ArticleViewTrackerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const viewStartTime = useRef<number | null>(null);
  const estimatedTime = useRef<number | null>(null);
  const hasTrackedView = useRef(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [autoMarkAsRead, setAutoMarkAsRead] = useState<boolean | null>(null);

  // Load user preferences
  useEffect(() => {
    if (!session?.user) return;

    const loadPreferences = async () => {
      try {
        const response = await fetch("/api/user/preferences");
        if (response.ok) {
          const result = await response.json();
          // API wraps response in { success: true, data: { preferences } }
          if (result.data?.preferences) {
            setAutoMarkAsRead(result.data.preferences.autoMarkAsRead);
          }
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
        // Default to false if we can't load preferences
        setAutoMarkAsRead(false);
      }
    };

    loadPreferences();
  }, [session]);

  useEffect(() => {
    if (!session?.user || hasTrackedView.current || autoMarkAsRead === null) return;

    // Track view start and conditionally mark as read
    const trackView = async () => {
      try {
        // Track the view
        const response = await fetch(`/api/user/articles/${articleId}/view`, {
          method: "POST",
        });

        if (response.ok) {
          const result = await response.json();
          console.log("View tracking response:", result);
          // API wraps response in { success: true, data: { viewedAt, estimatedTime } }
          if (result.data?.estimatedTime) {
            viewStartTime.current = Date.now();
            estimatedTime.current = result.data.estimatedTime;
            hasTrackedView.current = true;
            console.log("View tracked successfully, estimatedTime:", result.data.estimatedTime);
          } else {
            console.error("No estimatedTime in response:", result);
          }
        } else {
          console.error("View tracking failed:", response.status, response.statusText);
        }

        // Mark article as read only if user preference is enabled
        if (autoMarkAsRead) {
          const readResponse = await fetch(`/api/user/articles/${articleId}/read`, {
            method: "POST",
          });

          if (readResponse.ok) {
            console.log("Article automatically marked as read");
            // Trigger sidebar refresh
            onReadStatusChange?.();
          } else {
            console.error("Failed to mark article as read:", readResponse.status);
          }
        }
      } catch (error) {
        console.error("Error tracking article view:", error);
      }
    };

    trackView();
  }, [articleId, session, autoMarkAsRead]);

  useEffect(() => {
    if (!session?.user) return;

    // Track exit on unmount or navigation
    const trackExit = async () => {
      if (
        !session?.user ||
        viewStartTime.current === null ||
        estimatedTime.current === null ||
        feedbackSubmitted
      ) {
        return;
      }

      const timeSpent = Math.floor((Date.now() - viewStartTime.current) / 1000);

      // Validate data before sending
      if (timeSpent < 0 || estimatedTime.current <= 0) {
        console.warn("Invalid tracking data:", { timeSpent, estimatedTime: estimatedTime.current });
        return;
      }

      const payload = {
        timeSpent,
        estimatedTime: estimatedTime.current,
      };

      console.log("Tracking article exit:", payload);

      try {
        // Use fetch instead of sendBeacon for better error handling
        const response = await fetch(`/api/user/articles/${articleId}/exit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          keepalive: true,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Exit tracking failed:", response.status, errorText);
        } else {
          const result = await response.json();
          console.log("Exit tracking success:", result);
        }
      } catch (error) {
        console.error("Error tracking article exit:", error);
      }
    };

    // Track on page unload
    window.addEventListener("beforeunload", trackExit);

    // Track on navigation (for SPA navigation)
    const handleRouteChange = () => {
      trackExit();
    };

    // Listen for route changes (Next.js specific)
    // Note: This is a simplified approach; in production you might want to use Next.js router events
    return () => {
      window.removeEventListener("beforeunload", trackExit);
      trackExit();
    };
  }, [articleId, session, feedbackSubmitted]);

  useEffect(() => {
    if (!session?.user) return;

    // Listen for explicit feedback events
    const handleFeedback = async (event: CustomEvent) => {
      if (event.detail.articleId === articleId) {
        setFeedbackSubmitted(true);

        try {
          await fetch(`/api/user/articles/${articleId}/feedback`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              feedbackValue: event.detail.value,
            }),
          });
        } catch (error) {
          console.error("Error submitting feedback:", error);
        }
      }
    };

    window.addEventListener(
      "article-feedback" as any,
      handleFeedback as any
    );

    return () => {
      window.removeEventListener(
        "article-feedback" as any,
        handleFeedback as any
      );
    };
  }, [articleId, session]);

  // This component doesn't render anything
  return null;
}

