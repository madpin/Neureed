"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

/**
 * This route serves as a catch-all for article URLs without feed context.
 * It redirects to the home page, which will display the article in the reading panel.
 */
export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = params.id as string;

  useEffect(() => {
    // Preserve any existing query params (like feed context)
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('article', articleId);
    
    // Redirect to the home page with the article in the reading panel
    router.replace(`/?${newParams.toString()}`);
  }, [articleId, router, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center bg-muted bg-background">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-foreground/70">Loading article...</p>
      </div>
    </div>
  );
}
