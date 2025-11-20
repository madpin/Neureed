"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { Feed, Article } from "@prisma/client";
import type { ArticleSortOrder, ArticleSortDirection } from "@/lib/validations/article-validation";

interface FeedWithStats extends Feed {
  articleCount?: number;
}

interface ArticleWithFeed extends Article {
  feed: Feed;
  isRead?: boolean;
  readAt?: Date;
  similarity?: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [feeds, setFeeds] = useState<FeedWithStats[]>([]);
  const [articles, setArticles] = useState<ArticleWithFeed[]>([]);
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [isFeedBrowserOpen, setIsFeedBrowserOpen] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [sortOrder, setSortOrder] = useState<ArticleSortOrder>("publishedAt");
  const [sortDirection, setSortDirection] = useState<ArticleSortDirection>("desc");
  const [categoryListRefreshTrigger, setCategoryListRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchMode, setSearchMode] = useState<"semantic" | "hybrid">("semantic");
  const [searchMinScore, setSearchMinScore] = useState(0.7);
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [infiniteScrollMode, setInfiniteScrollMode] = useState<"auto" | "button" | "both">("both");
  const [searchRecencyWeight, setSearchRecencyWeight] = useState(0.3);
  const [searchRecencyDecayDays, setSearchRecencyDecayDays] = useState(30);
  const isInitialMount = useRef(true);
  const loadArticlesRef = useRef<((pageNum: number, append: boolean) => Promise<void>) | null>(null);
  
  // Infinite scroll hook
  const {
    page,
    isLoading: isLoadingMore,
    hasMore,
    loadMoreRef,
    loadMore,
    reset: resetInfiniteScroll,
    setHasMore,
    setIsLoading: setIsLoadingMore,
  } = useInfiniteScroll({
    enabled: infiniteScrollMode === "auto" || infiniteScrollMode === "both",
    threshold: 500,
  });

  // Sync selectedFeedId, selectedCategoryId, and searchQuery with URL params
  useEffect(() => {
    const feedIdFromUrl = searchParams.get('feed');
    const categoryIdFromUrl = searchParams.get('categoryId');
    const searchFromUrl = searchParams.get('search');
    
    if (feedIdFromUrl !== selectedFeedId) {
      setSelectedFeedId(feedIdFromUrl);
    }
    if (categoryIdFromUrl !== selectedCategoryId) {
      setSelectedCategoryId(categoryIdFromUrl);
    }
    if (searchFromUrl !== searchQuery) {
      setSearchQuery(searchFromUrl || "");
    }
  }, [searchParams]);

  // Load user preferences (including sort preferences)
  useEffect(() => {
    if (session?.user) {
      loadUserPreferences();
    }
  }, [session]);

  // Load feeds when session changes
  useEffect(() => {
    if (status !== "loading") {
      loadFeeds();
    }
  }, [session, status]);

  // These effects will be defined after loadArticles is declared

  // Reload articles when user returns to the page (to update read status)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadArticles();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const loadUserPreferences = async () => {
    try {
      const response = await fetch("/api/user/preferences");
      const data = await response.json();
      if (data.data?.preferences) {
        const prefs = data.data.preferences;
        setSortOrder(prefs.articleSortOrder || "publishedAt");
        setSortDirection(prefs.articleSortDirection || "desc");
        setInfiniteScrollMode(prefs.infiniteScrollMode || "both");
        setSearchRecencyWeight(prefs.searchRecencyWeight ?? 0.3);
        setSearchRecencyDecayDays(prefs.searchRecencyDecayDays ?? 30);
      }
    } catch (error) {
      console.error("Failed to load user preferences:", error);
    }
  };

  // Callback to refresh sidebar counts when article read status changes
  const handleArticleReadStatusChange = useCallback(() => {
    console.log('[Home] Article read status changed, triggering sidebar refresh');
    // Trigger a refresh of the CategoryList by incrementing the trigger
    setCategoryListRefreshTrigger(prev => {
      console.log('[Home] Incrementing refresh trigger from', prev, 'to', prev + 1);
      return prev + 1;
    });
  }, []);

  const loadFeeds = async () => {
    if (!session?.user) {
      setFeeds([]);
      setIsLoadingFeeds(false);
      return;
    }

    setIsLoadingFeeds(true);
    try {
      const response = await fetch("/api/user/feeds");
      const data = await response.json();
      // Handle wrapped response - user feeds have subscription info
      const subscriptions = data.data?.subscriptions || [];
      // Merge feed data with custom name from subscription
      const feedsData = subscriptions.map((sub: any) => ({
        ...sub.feed,
        // Override name with custom name if it exists
        name: sub.customName || sub.feed.name,
        // Store original name for reference
        _originalName: sub.feed.name,
        _subscriptionId: sub.id,
      }));
      setFeeds(feedsData);
    } catch (error) {
      console.error("Failed to load feeds:", error);
    } finally {
      setIsLoadingFeeds(false);
    }
  };

  const loadArticles = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    console.log('[loadArticles] Starting load:', { pageNum, append });
    
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingArticles(true);
    }
    
    try {
      // If search query exists, use semantic search
      if (searchQuery && searchQuery.length >= 2) {
        const response = await fetch("/api/articles/semantic-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchQuery,
            limit: 20,
            minScore: searchMinScore,
            mode: searchMode,
            page: pageNum,
            recencyWeight: searchRecencyWeight,
            recencyDecayDays: searchRecencyDecayDays,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const newArticles = data.data.results || [];
          const pagination = data.data.pagination;
          
          if (append) {
            setArticles(prev => [...prev, ...newArticles]);
          } else {
            setArticles(newArticles);
          }
          
          setHasMore(pagination?.hasMore ?? false);
        }
      } else {
        // Build URL with optional feed, category, and sort filters
        const params = new URLSearchParams();
        params.append('page', pageNum.toString());
        params.append('limit', '20');
        
        if (selectedFeedId) {
          params.append('feedId', selectedFeedId);
        }
        if (selectedCategoryId) {
          params.append('categoryId', selectedCategoryId);
        }
        // Add sort parameters
        if (sortOrder) {
          params.append('sortBy', sortOrder);
        }
        if (sortDirection) {
          params.append('sortDirection', sortDirection);
        }
        
        const url = `/api/articles?${params.toString()}`;
          
        const response = await fetch(url);
        const data = await response.json();
        // Handle wrapped response
        const responseData = data.data || data;
        const newArticles = responseData.articles || [];
        const pagination = responseData.pagination;
        
        if (append) {
          setArticles(prev => [...prev, ...newArticles]);
        } else {
          setArticles(newArticles);
        }
        
        const hasMoreArticles = pagination?.hasMore ?? (pagination?.page < pagination?.totalPages);
        console.log('[loadArticles] Pagination info:', { 
          page: pagination?.page, 
          totalPages: pagination?.totalPages, 
          hasMore: hasMoreArticles,
          articlesLoaded: newArticles.length 
        });
        setHasMore(hasMoreArticles);
      }
    } catch (error) {
      console.error("Failed to load articles:", error);
    } finally {
      if (append) {
        setIsLoadingMore(false);
      } else {
        setIsLoadingArticles(false);
      }
    }
  }, [searchQuery, searchMinScore, searchMode, selectedFeedId, selectedCategoryId, sortOrder, sortDirection, setIsLoadingMore, setHasMore]);

  // Keep ref in sync
  loadArticlesRef.current = loadArticles;

  // Load articles when feed, category, search, or sort changes (reset pagination)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
    resetInfiniteScroll();
    setArticles([]);
    loadArticlesRef.current?.(1, false);
  }, [selectedFeedId, selectedCategoryId, searchQuery, sortOrder, sortDirection, resetInfiniteScroll]);

  // Load more articles when page changes
  useEffect(() => {
    if (page > 1) {
      loadArticlesRef.current?.(page, true);
    }
  }, [page]);

  const handleSelectFeed = (feedId: string | null) => {
    // Update URL to reflect feed filter and clear category and search
    if (feedId) {
      router.push(`/?feed=${feedId}`);
    } else {
      // Clear all filters - show all articles
      router.push("/");
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    // Update URL to reflect category filter and clear feed and search
    router.push(`/?categoryId=${categoryId}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery && searchQuery.length >= 2) {
      router.push(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    router.push("/");
  };

  const handleSortChange = async (newSortOrder: ArticleSortOrder, newSortDirection: ArticleSortDirection) => {
    // Update local state immediately for responsive UI
    setSortOrder(newSortOrder);
    setSortDirection(newSortDirection);

    // Update user preferences in the background
    if (session?.user) {
      try {
        await fetch("/api/user/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleSortOrder: newSortOrder,
            articleSortDirection: newSortDirection,
          }),
        });
      } catch (error) {
        console.error("Failed to update sort preferences:", error);
      }
    }
  };

  const handleAddFeed = async (url: string, name?: string) => {
    const response = await fetch("/api/feeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to add feed");
    }

    await loadFeeds();
  };

  const handleUnsubscribeFeed = async (feedId: string) => {
    try {
      const response = await fetch("/api/user/feeds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId }),
      });

      if (!response.ok) {
        throw new Error("Failed to unsubscribe from feed");
      }

      await loadFeeds();
      // No need to change URL since we're on the "all articles" page
    } catch (error) {
      console.error("Failed to unsubscribe from feed:", error);
      toast.error("Failed to unsubscribe from feed");
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    try {
      const response = await fetch(`/api/feeds/${feedId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete feed");
      }

      // Reload feeds and clear selection if we deleted the current feed
      await loadFeeds();
      if (selectedFeedId === feedId) {
        router.push("/");
      }

      toast.success("Feed deleted successfully");
    } catch (error) {
      console.error("Failed to delete feed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete feed");
    }
  };

  const handleRefreshFeed = async (feedId: string) => {
    try {
      const response = await fetch(`/api/feeds/${feedId}/refresh`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to refresh feed");
      }

      await loadArticles();
    } catch (error) {
      console.error("Failed to refresh feed:", error);
      toast.error("Failed to refresh feed");
    }
  };

  // Show sign-in prompt if not authenticated
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

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

          {isLoadingFeeds ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : (
            <CategoryList
              selectedFeedId={selectedFeedId || undefined}
              selectedCategoryId={selectedCategoryId || undefined}
              onSelectFeed={handleSelectFeed}
              onSelectCategory={handleSelectCategory}
              onDeleteFeed={handleDeleteFeed}
              onUnsubscribeFeed={handleUnsubscribeFeed}
              onRefreshFeed={handleRefreshFeed}
              isCollapsed={isCollapsed}
              refreshTrigger={categoryListRefreshTrigger}
            />
          )}
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
                
                <form onSubmit={handleSearchSubmit} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="What are you looking for?"
                        className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoadingArticles || searchQuery.length < 2}
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
            ) : (
              <ArticleList
                articles={articles}
                isLoading={isLoadingArticles}
                variant="expanded"
                onArticleSelect={onArticleSelect}
                onReadStatusChange={handleArticleReadStatusChange}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                onLoadMore={loadMore}
                loadMoreRef={loadMoreRef}
                infiniteScrollMode={infiniteScrollMode}
              />
            )}
          </div>
        )}
      </ReadingPanelLayout>

      {isAddFeedOpen && (
        <AddFeedForm
          onAdd={handleAddFeed}
          onClose={() => setIsAddFeedOpen(false)}
        />
      )}

      {isFeedBrowserOpen && (
        <FeedBrowser onClose={() => {
          setIsFeedBrowserOpen(false);
          loadFeeds(); // Reload feeds after browsing
        }} />
      )}

      {isManagementModalOpen && (
        <FeedManagementModal
          onClose={() => setIsManagementModalOpen(false)}
          initialView="overview"
          onRefreshData={() => loadFeeds()}
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
