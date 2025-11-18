"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArticleCard } from "@/app/components/articles/ArticleCard";
import { ReadingPanelLayout } from "@/app/components/layout/ReadingPanelLayout";

interface SearchResult {
  id: string;
  title: string;
  content: string;
  excerpt?: string | null;
  url: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
  similarity?: number;
  createdAt: Date;
  updatedAt: Date;
  feedId: string;
  guid?: string | null;
  author?: string | null;
  summary?: string | null;
  keyPoints?: string[] | null;
  topics?: string[];
  contentHash: string;
  feed: {
    id: string;
    name: string;
    url: string;
    imageUrl?: string | null;
  };
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<"semantic" | "hybrid">("semantic");
  const [minScore, setMinScore] = useState(0.7);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string = query) => {
    if (searchQuery.length < 2) return;

    setIsSearching(true);
    try {
      const response = await fetch("/api/articles/semantic-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          limit: 50,
          minScore,
          mode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.data.results || []);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  return (
    <ReadingPanelLayout>
      {({ onArticleSelect }: { onArticleSelect?: (articleId: string) => void }) => (
        <div className="min-h-screen bg-background text-foreground">
          <div className="mx-auto max-w-7xl px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">
                Semantic Search
              </h1>
              <p className="mt-2 text-foreground/70">
                Search articles using AI-powered semantic understanding
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
                <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || query.length < 2}
              className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-lg border border-border px-4 py-3 hover:bg-muted"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 rounded-lg border border-border bg-background p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground/70">
                    Search Mode
                  </label>
                  <select
                    value={mode}
                    onChange={(e) =>
                      setMode(e.target.value as "semantic" | "hybrid")
                    }
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="semantic">Semantic Only</option>
                    <option value="hybrid">Hybrid (Semantic + Keyword)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground/70">
                    Minimum Similarity: {Math.round(minScore * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={minScore}
                    onChange={(e) => setMinScore(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Results */}
        {results.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {results.length} {results.length === 1 ? "result" : "results"}{" "}
                found
              </h2>
              <div className="text-sm text-foreground/70">
                Mode: {mode === "semantic" ? "Semantic" : "Hybrid"}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {results.map((article) => (
                <div key={article.id} className="relative">
                  <ArticleCard 
                    article={article as any}
                    onArticleClick={onArticleSelect}
                  />
                  {article.similarity !== undefined && (
                    <div className="absolute right-2 top-2">
                      <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-lg">
                        {Math.round(article.similarity * 100)}% match
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!isSearching && query.length >= 2 && results.length === 0 && (
          <div className="rounded-lg border border-border bg-background p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-foreground/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-foreground">
              No results found
            </h3>
            <p className="mt-2 text-foreground/70">
              Try adjusting your search query or lowering the similarity
              threshold
            </p>
          </div>
        )}

        {/* Empty State */}
        {!query && results.length === 0 && (
          <div className="rounded-lg border border-border bg-background p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-foreground/50"
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
            <h3 className="mt-4 text-lg font-medium text-foreground">
              Start searching
            </h3>
            <p className="mt-2 text-foreground/70">
              Enter a query to find articles using semantic search
            </p>
          </div>
        )}
          </div>
        </div>
      )}
    </ReadingPanelLayout>
  );
}

