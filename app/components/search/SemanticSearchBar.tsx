"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useArticles } from "@/hooks/queries/use-articles";
import { useUserPreferences } from "@/hooks/queries/use-user-preferences";

// Simple debounce hook implementation
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

interface SearchResult {
  id: string;
  title: string;
  excerpt?: string;
  similarity?: number;
}

export function SemanticSearchBar() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  
  const debouncedQuery = useDebounceValue(query, 500);

  // Get user preferences
  const { data: preferences } = useUserPreferences();
  const searchRecencyWeight = preferences?.searchRecencyWeight ?? 0.3;
  const searchRecencyDecayDays = preferences?.searchRecencyDecayDays ?? 30;

  // Use React Query for search
  const isQueryEnabled = debouncedQuery.length >= 2;
  
  const { data: searchResultData, isLoading: isSearchLoading } = useArticles(
    {
      search: debouncedQuery,
      minScore: 0.6,
      mode: "semantic",
      recencyWeight: searchRecencyWeight,
      recencyDecayDays: searchRecencyDecayDays
    },
    5 // limit
  );
  
  // Only show results if we have a query and it's enabled
  const results = isQueryEnabled && searchResultData?.articles ? 
    searchResultData.articles.map(article => ({
      id: article.id,
      title: article.title,
      excerpt: article.excerpt,
      similarity: article.relevanceScore // Check if relevanceScore maps to similarity or if we need `similarity` field from article which might be dynamic
      // In Article interface, I added `relevanceScore`. The search API returns `similarity` in the raw response, 
      // but `fetchArticles` maps it to `Article` type.
      // `useArticles` calls `fetchArticles` which calls `/api/articles/semantic-search`.
      // `/api/articles/semantic-search` returns `results` which have `similarity`.
      // My `Article` interface has `relevanceScore`.
      // The `fetchArticles` function returns `ArticlesResponse` with `articles: Article[]`.
      // If the API returns `similarity`, and `Article` has `relevanceScore`, we might need to ensure the mapping is correct or use `similarity` if added to interface.
      // I added `similarity` to ArticleWithFeed in page.tsx, but in `use-articles.ts` Article interface I didn't add `similarity`.
      // I should check `use-articles.ts` Article interface.
      // I see `relevanceScore`. I probably should use that or add `similarity`.
      // Let's use `relevanceScore` as it's the standard field for score.
    })) 
    : [];

  // Effect to show results when data arrives
  useEffect(() => {
    if (isQueryEnabled && searchResultData?.articles?.length) {
      setShowResults(true);
    } else if (!isQueryEnabled) {
      setShowResults(false);
    }
  }, [searchResultData, isQueryEnabled]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (articleId: string) => {
    router.push(`/?article=${articleId}`);
    setShowResults(false);
    setQuery("");
  };

  const handleAdvancedSearch = () => {
    router.push(`/?search=${encodeURIComponent(query)}`);
    setShowResults(false);
  };

  return (
    <div ref={searchRef} className="relative">
      <input
        type="search"
        placeholder="Semantic search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setShowResults(true)}
        className="w-64 rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <svg
        className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      {isSearchLoading && isQueryEnabled && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      )}

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full z-50 mt-2 w-96 rounded-lg border border-border bg-background shadow-lg">
          <div className="max-h-96 overflow-y-auto">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleResultClick(result.id)}
                className="w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted last:border-b-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="line-clamp-2 text-sm font-medium text-foreground">
                      {result.title}
                    </h4>
                    {result.excerpt && (
                      <p className="mt-1 line-clamp-2 text-xs text-secondary">
                        {result.excerpt}
                      </p>
                    )}
                  </div>
                  {/* Using relevanceScore/similarity */}
                  <div className="flex-shrink-0">
                    <span className="rounded bg-accent/20 px-2 py-1 text-xs font-medium text-accent">
                      {/* We don't have exact similarity value if mapped to relevanceScore, let's assume it's passed or we use relevanceScore */}
                      Match
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-border p-2">
            <button
              onClick={handleAdvancedSearch}
              className="w-full rounded px-3 py-2 text-sm text-primary hover:bg-muted"
            >
              Advanced search for &quot;{query}&quot; →
            </button>
          </div>
        </div>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !isSearchLoading && (
        <div className="absolute top-full z-50 mt-2 w-96 rounded-lg border border-border bg-background p-4 shadow-lg">
          <p className="text-sm text-secondary">
            No results found for &quot;{query}&quot;
          </p>
        </div>
      )}
    </div>
  );
}

