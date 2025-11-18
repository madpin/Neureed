"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Legacy search page - redirects to main page with search parameter
 * This maintains backward compatibility with old /search?q=... URLs
 */
export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      // Redirect to main page with search parameter
      router.replace(`/?search=${encodeURIComponent(query)}`);
    } else {
      // No query, redirect to home
      router.replace("/");
    }
  }, [router, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-foreground/70">Redirecting...</p>
      </div>
    </div>
  );
}
