"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * This route serves as a catch-all for article URLs with feed context.
 * It redirects to the home page with both feed and article query params.
 */
export default function FeedArticlePage() {
  const params = useParams();
  const router = useRouter();
  const feedId = params.feedId as string;
  const articleId = params.articleId as string;

  useEffect(() => {
    // Redirect to the home page with feed and article query params
    router.replace(`/?feed=${feedId}&article=${articleId}`);
  }, [feedId, articleId, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading article...</p>
      </div>
    </div>
  );
}

