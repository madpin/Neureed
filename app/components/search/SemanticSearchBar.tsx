"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  title: string;
  excerpt?: string;
  similarity?: number;
}

export function SemanticSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch("/api/articles/semantic-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            limit: 5,
            minScore: 0.6,
            mode: "semantic",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setResults(data.data.results || []);
          setShowResults(true);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

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
    router.push(`/articles/${articleId}`);
    setShowResults(false);
    setQuery("");
  };

  const handleAdvancedSearch = () => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
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

      {isSearching && (
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
                  {result.similarity !== undefined && (
                    <div className="flex-shrink-0">
                      <span className="rounded bg-accent/20 px-2 py-1 text-xs font-medium text-accent">
                        {Math.round(result.similarity * 100)}%
                      </span>
                    </div>
                  )}
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

      {showResults && query.length >= 2 && results.length === 0 && !isSearching && (
        <div className="absolute top-full z-50 mt-2 w-96 rounded-lg border border-border bg-background p-4 shadow-lg">
          <p className="text-sm text-secondary">
            No results found for &quot;{query}&quot;
          </p>
        </div>
      )}
    </div>
  );
}

