"use client";

import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { 
  useArticleFeedback, 
  useSubmitArticleFeedback, 
  useDeleteArticleFeedback 
} from "@/hooks/queries/use-articles";

interface ArticleFeedbackSectionProps {
  articleId: string;
}

export function ArticleFeedbackSection({
  articleId,
}: ArticleFeedbackSectionProps) {
  const { data: session } = useSession();
  
  const { data: feedbackData, isLoading } = useArticleFeedback(articleId);
  const feedback = feedbackData?.feedbackValue ?? null;
  
  const submitFeedback = useSubmitArticleFeedback();
  const deleteFeedback = useDeleteArticleFeedback();
  
  const isSubmitting = submitFeedback.isPending || deleteFeedback.isPending;

  const handleFeedback = async (value: number) => {
    if (!session?.user) {
      toast.error("Please sign in to provide feedback");
      return;
    }

    try {
      // If clicking the same button, remove feedback
      if (feedback === value) {
        await deleteFeedback.mutateAsync(articleId);
      } else {
        // Submit new feedback
        await submitFeedback.mutateAsync({ articleId, feedbackValue: value });
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    }
  };

  if (!session?.user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mt-8 border-t border-border pt-8 border-border">
        <div className="flex justify-center">
          <div className="h-20 w-64 animate-pulse rounded-lg bg-muted bg-background" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-border pt-8 border-border">
      <div className="flex justify-center">
        <div className="inline-block">
          <div className="text-center">
            <p className="mb-4 text-sm text-foreground/70">
              Help us learn your preferences
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleFeedback(1.0)}
                disabled={isSubmitting}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 px-8 py-4 transition-all ${
                  feedback === 1.0
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-border hover:border-green-500 hover:bg-green-50 border-border dark:hover:border-green-500 dark:hover:bg-green-900/20"
                } ${isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <svg
                  className="h-8 w-8 text-green-600 dark:text-green-400"
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
                <span className="font-medium">Helpful</span>
              </button>
              <button
                onClick={() => handleFeedback(-1.0)}
                disabled={isSubmitting}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 px-8 py-4 transition-all ${
                  feedback === -1.0
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-border hover:border-red-500 hover:bg-red-50 border-border dark:hover:border-red-500 dark:hover:bg-red-900/20"
                } ${isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <svg
                  className="h-8 w-8 text-red-600 dark:text-red-400"
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
                <span className="font-medium">Not Helpful</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

