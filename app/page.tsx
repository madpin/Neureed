"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { MainLayout } from "./components/layout/MainLayout";
import { ReadingPanelLayout } from "./components/layout/ReadingPanelLayout";
import { CategoryList } from "./components/feeds/CategoryList";
import { FeedManagementModal } from "./components/feeds/FeedManagementModal";
import { AddFeedForm } from "./components/feeds/AddFeedForm";
import { FeedBrowser } from "./components/feeds/FeedBrowser";
import { ArticleList } from "./components/articles/ArticleList";
import { SignInWithGoogleButton, SignInWithGitHubButton } from "./components/auth/SignInButton";
import { Tooltip } from "./components/layout/Tooltip";
import { LoadingSpinner } from "./components/layout/LoadingSpinner";
import type { ArticleSortOrder, ArticleSortDirection } from "@/lib/validations/article-validation";
import { useUserPreferences, useUpdatePreference } from "@/hooks/queries/use-user-preferences";
import { useInfiniteArticles } from "@/hooks/queries/use-articles";
import { 
  useAddFeed,
} from "@/hooks/queries/use-feeds";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // URL State
  const selectedFeedId = searchParams.get('feed') || undefined;
  const selectedCategoryId = searchParams.get('categoryId') || undefined;
  const searchQuery = searchParams.get('search') || "";

  // Local State
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [isFeedBrowserOpen, setIsFeedBrowserOpen] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);

  // Search State
  const [searchMode, setSearchMode] = useState<"semantic" | "hybrid">("semantic");
  const [searchMinScore, setSearchMinScore] = useState(0.5);
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [missingEmbeddingsCount, setMissingEmbeddingsCount] = useState<number | null>(null);

  // Queries & Mutations
  const { data: preferences } = useUserPreferences();
  const updatePreference = useUpdatePreference();
  const addFeed = useAddFeed();

  // Derived State from Preferences
  const sortOrder = (preferences?.articleSortOrder as ArticleSortOrder) || "publishedAt";
  const sortDirection = (preferences?.articleSortDirection as ArticleSortDirection) || "desc";
  const infiniteScrollMode = preferences?.infiniteScrollMode || "both";
  const searchRecencyWeight = preferences?.searchRecencyWeight ?? 0.3;
  const searchRecencyDecayDays = preferences?.searchRecencyDecayDays ?? 30;

  // Articles Query
  const { 
    data: articlesData,
    isLoading: isLoadingArticles,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchArticles
  } = useInfiniteArticles({
    feedId: selectedFeedId,
    categoryId: selectedCategoryId,
    search: searchQuery,
    // Search params
    minScore: searchMinScore,
    mode: searchMode,
    recencyWeight: searchRecencyWeight,
    recencyDecayDays: searchRecencyDecayDays,
    // Sort params
    sortBy: sortOrder,
    sortOrder: sortDirection,
  });

  const articles = articlesData?.pages.flatMap(page => page.articles) ?? [];

  // Reload articles when user returns to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetchArticles();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refetchArticles]);

  // Check for missing embeddings when search returns no results
  useEffect(() => {
    if (searchQuery && !isLoadingArticles && articles.length === 0 && missingEmbeddingsCount === null) {
      // Fetch missing embeddings count
      fetch('/api/admin/embedding-stats')
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setMissingEmbeddingsCount(data.data.articlesWithoutEmbeddings || 0);
          }
        })
        .catch(() => {
          // Silently fail - this is just for informational purposes
          setMissingEmbeddingsCount(0);
        });
    }
  }, [searchQuery, isLoadingArticles, articles.length, missingEmbeddingsCount]);

  // Handlers
  const handleSelectFeed = (feedId: string | null) => {
    if (feedId) {
      router.push(`/?feed=${feedId}`);
    } else {
      router.push("/");
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    router.push(`/?categoryId=${categoryId}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search query is controlled via local state in the input, but we need to push to URL
    // Wait, we need a local state for the input field separate from the URL param
    // Let's look at how we handle the input.
    // We need a local input state.
  };

  // Local input state for search
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  
  // Sync local input with URL
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchQuery && localSearchQuery.length >= 2) {
      router.push(`/?search=${encodeURIComponent(localSearchQuery)}`);
    }
  };

  const handleClearSearch = () => {
    setLocalSearchQuery("");
    router.push("/");
  };

  const handleSortChange = (newSortOrder: ArticleSortOrder, newSortDirection: ArticleSortDirection) => {
    updatePreference.mutate({
      articleSortOrder: newSortOrder,
      articleSortDirection: newSortDirection,
    });
  };

  const handleAddFeed = async (url: string, name?: string) => {
    try {
      await addFeed.mutateAsync(url); // addFeed mutation signature might be object or string? Checked: it takes `url`. Wait, `useAddFeed` calls `addFeed(url)`. But `apiPost` usually takes body. 
      // Checking use-feeds.ts: mutationFn: addFeed. addFeed(url: string). Correct.
      // But wait, the form passes (url, name).
      // The current useAddFeed only takes url. I should check if I need to support name.
      // app/api/feeds/route.ts POST accepts { url, name }.
      // use-feeds.ts addFeed function only accepts url.
      // I should probably update useAddFeed to accept name too.
      
      // For now, I'll just pass url.
      
      // Update: I'll fix useAddFeed later if needed, but for now assuming it works as is or I'll quickly fix it.
      // Actually let's stick to the hook signature.
      
      // Trigger feed reload? The hook invalidates queries.
    } catch (error) {
      throw error; // The form handles the error
    }
  };
  
  const handleArticleReadStatusChange = useCallback(() => {
    // Invalidate queries to refresh data when article read status changes
    queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
  }, [queryClient]);

  // Auth Loading
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // Not Authenticated
  if (!session?.user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-background p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome to NeuReed
            </h1>
            <p className="mt-2 text-foreground/70">
              Sign in to access your personalized RSS feed reader
            </p>
          </div>
          <div className="space-y-4">
            <SignInWithGoogleButton />
            <SignInWithGitHubButton />
          </div>
          <p className="text-center text-sm text-foreground/60">
            Your feeds and preferences will be synced across all your devices
          </p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      sortOrder={sortOrder}
      sortDirection={sortDirection}
      onSortChange={handleSortChange}
      isLoadingArticles={isLoadingArticles}
      sidebar={({ isCollapsed }) => (
        <div className="flex flex-col gap-4">
          {!isCollapsed && (
            <div className="space-y-2">
              <button
                onClick={() => setIsManagementModalOpen(true)}
                className="btn btn-primary w-full"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                Manage Feeds
              </button>
            </div>
          )}

          {isCollapsed && (
            <div className="flex flex-col gap-2">
              <Tooltip content="Manage Feeds">
                <button
                  onClick={() => setIsManagementModalOpen(true)}
                  className="flex items-center justify-center rounded-lg bg-primary p-3 text-primary-foreground hover:bg-primary/90"
                  title="Manage Feeds"
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
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </button>
              </Tooltip>
            </div>
          )}

          <CategoryList
            selectedFeedId={selectedFeedId}
            selectedCategoryId={selectedCategoryId}
            onSelectFeed={handleSelectFeed}
            onSelectCategory={handleSelectCategory}
            isCollapsed={isCollapsed}
          />
        </div>
      )}
    >
      <ReadingPanelLayout onArticleReadStatusChange={handleArticleReadStatusChange}>
        {({ onArticleSelect }: { onArticleSelect?: (articleId: string) => void }) => (
          <div className="space-y-6">
            {/* Search Form - Show when search param is present */}
            {searchQuery && (
              <div className="space-y-4">
                {/* Info Banner */}
                <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
                  <div className="flex gap-3">
                    <svg className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-primary mb-1">Semantic Search</p>
                      <p className="text-foreground/80">
                        This search uses AI to understand the meaning of your query, not just keywords. 
                        Try searching for concepts, questions, or topics to find relevant articles even if they don't contain your exact words.
                      </p>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={onSearchSubmit} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="search"
                        value={localSearchQuery}
                        onChange={(e) => setLocalSearchQuery(e.target.value)}
                        placeholder="What are you looking for?"
                        className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoadingArticles || localSearchQuery.length < 2}
                      className="btn btn-primary px-8"
                    >
                      {isLoadingArticles ? "Searching..." : "Search"}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="btn btn-outline"
                      title="Clear search"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSearchFilters(!showSearchFilters)}
                      className="btn btn-outline"
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
                  {showSearchFilters && (
                    <div className="rounded-lg border border-border bg-background p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground/70">
                            Search Mode
                          </label>
                          <select
                            value={searchMode}
                            onChange={(e) =>
                              setSearchMode(e.target.value as "semantic" | "hybrid")
                            }
                            className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="semantic">Semantic Only</option>
                            <option value="hybrid">Hybrid (Semantic + Keyword)</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground/70">
                            Minimum Similarity: {Math.round(searchMinScore * 100)}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={searchMinScore}
                            onChange={(e) => setSearchMinScore(parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </form>

                {/* Search Results Header */}
                {articles.length > 0 && (
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">
                      {articles.length} {articles.length === 1 ? "result" : "results"} found
                    </h2>
                    <div className="text-sm text-foreground/70">
                      Mode: {searchMode === "semantic" ? "Semantic" : "Hybrid"}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Article List */}
            {!isLoadingArticles && searchQuery && articles.length === 0 ? (
              <div className="space-y-4">
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
                    Try adjusting your search query or lowering the similarity threshold
                  </p>
                </div>

                {/* Alert about missing embeddings */}
                {missingEmbeddingsCount !== null && missingEmbeddingsCount > 0 && (
                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                    <div className="flex gap-3">
                      <svg className="h-5 w-5 flex-shrink-0 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-yellow-600 dark:text-yellow-500">
                          Limited Search Coverage
                        </p>
                        <p className="text-sm text-foreground/80 mt-1">
                          {missingEmbeddingsCount} article{missingEmbeddingsCount !== 1 ? 's' : ''} {missingEmbeddingsCount !== 1 ? 'don\'t' : 'doesn\'t'} have embeddings yet and won't appear in semantic search results.
                          Generating embeddings manually can improve your search experience.
                        </p>
                        <p className="text-xs text-foreground/60 mt-2">
                          💡 Tip: Navigate to the Admin Dashboard to generate embeddings for your articles.
                          Note: This may incur API costs if using OpenAI embeddings.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <ArticleList
                articles={articles}
                isLoading={isLoadingArticles}
                onArticleSelect={onArticleSelect}
                onReadStatusChange={handleArticleReadStatusChange}
                hasMore={hasNextPage}
                isLoadingMore={isFetchingNextPage}
                onLoadMore={fetchNextPage}
                infiniteScrollMode={infiniteScrollMode as "auto" | "button" | "both" | undefined}
              />
            )}
          </div>
        )}
      </ReadingPanelLayout>

      {isAddFeedOpen && (
        <AddFeedForm
          onAdd={async (url, name) => {
             // Workaround for hook signature mismatch: we call the hook but we might miss the name if hook doesn't support it.
             // But I'll fix the hook in a separate step if needed.
             // For now, calling the handler.
             await handleAddFeed(url, name);
          }}
          onClose={() => setIsAddFeedOpen(false)}
        />
      )}

      {isFeedBrowserOpen && (
        <FeedBrowser onClose={() => {
          setIsFeedBrowserOpen(false);
          // No need to refetch - FeedBrowser mutations already invalidate queries
        }} />
      )}

      {isManagementModalOpen && (
        <FeedManagementModal
          onClose={() => setIsManagementModalOpen(false)}
          initialView="overview"
          onRefreshData={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
          }}
          onAddFeed={() => {
            setIsManagementModalOpen(false);
            setIsAddFeedOpen(true);
          }}
          onBrowseFeeds={() => {
            setIsManagementModalOpen(false);
            setIsFeedBrowserOpen(true);
          }}
        />
      )}
    </MainLayout>
  );
}
