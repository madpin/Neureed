"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface FeedbackButtonsProps {
  articleId: string;
  variant?: "minimal" | "prominent";
  onFeedbackChange?: (feedbackValue: number | null) => void;
}

export function FeedbackButtons({
  articleId,
  variant = "prominent",
  onFeedbackChange,
}: FeedbackButtonsProps) {
  const { data: session } = useSession();
  const [feedback, setFeedback] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch existing feedback on mount
  useEffect(() => {
    if (!session?.user) return;

    const fetchFeedback = async () => {
      try {
        const response = await fetch(`/api/user/articles/${articleId}/feedback`);
        if (response.ok) {
          const result = await response.json();
          // API wraps response in { success: true, data: { feedback: ... } }
          if (result.data?.feedback) {
            setFeedback(result.data.feedback.feedbackValue);
          }
        }
      } catch (error) {
        console.error("Error fetching feedback:", error);
      }
    };

    fetchFeedback();
  }, [articleId, session]);

  const handleFeedback = async (value: number) => {
    if (!session?.user) {
      toast.error("Please sign in to provide feedback");
      return;
    }

    setIsLoading(true);

    try {
      // If clicking the same button, remove feedback
      if (feedback === value) {
        const response = await fetch(`/api/user/articles/${articleId}/feedback`, {
          method: "DELETE",
        });

        if (response.ok) {
          setFeedback(null);
          onFeedbackChange?.(null);
        }
      } else {
        // Submit new feedback
        const response = await fetch(`/api/user/articles/${articleId}/feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ feedbackValue: value }),
        });

        if (response.ok) {
          setFeedback(value);
          onFeedbackChange?.(value);
        }
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user) {
    return null; // Don't show feedback buttons if not logged in
  }

  if (variant === "minimal") {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleFeedback(1.0)}
          disabled={isLoading}
          className={`p-1 rounded transition-colors ${
            feedback === 1.0
              ? "text-green-600 dark:text-green-400"
              : "text-foreground/50 hover:text-green-600 dark:hover:text-green-400"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          title="Like this article"
          aria-label="Like"
        >
          <svg
            className="h-4 w-4"
            fill={feedback === 1.0 ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>
        </button>
        <button
          onClick={() => handleFeedback(-1.0)}
          disabled={isLoading}
          className={`p-1 rounded transition-colors ${
            feedback === -1.0
              ? "text-red-600 dark:text-red-400"
              : "text-foreground/50 hover:text-red-600 dark:hover:text-red-400"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          title="Dislike this article"
          aria-label="Dislike"
        >
          <svg
            className="h-4 w-4"
            fill={feedback === -1.0 ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
            />
          </svg>
        </button>
      </div>
    );
  }

  // Prominent variant
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-foreground/70">
        Was this article helpful?
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleFeedback(1.0)}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
            feedback === 1.0
              ? "bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-500 dark:text-green-400"
              : "border-border text-foreground/80 hover:border-green-500 hover:bg-green-50 border-border dark:text-foreground/40 dark:hover:border-green-500 dark:hover:bg-green-900/20"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label="Like this article"
        >
          <svg
            className="h-5 w-5"
            fill={feedback === 1.0 ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>
          <span className="font-medium">Yes</span>
        </button>
        <button
          onClick={() => handleFeedback(-1.0)}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
            feedback === -1.0
              ? "bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-400"
              : "border-border text-foreground/80 hover:border-red-500 hover:bg-red-50 border-border dark:text-foreground/40 dark:hover:border-red-500 dark:hover:bg-red-900/20"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label="Dislike this article"
        >
          <svg
            className="h-5 w-5"
            fill={feedback === -1.0 ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
            />
          </svg>
          <span className="font-medium">No</span>
        </button>
      </div>
    </div>
  );
}

