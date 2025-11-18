"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { MainLayout } from "./components/layout/MainLayout";
import { ReadingPanelLayout } from "./components/layout/ReadingPanelLayout";
import { CategoryList } from "./components/feeds/CategoryList";
import { CategoryManagement } from "./components/feeds/CategoryManagement";
import { AddFeedForm } from "./components/feeds/AddFeedForm";
import { FeedBrowser } from "./components/feeds/FeedBrowser";
import { ArticleList } from "./components/articles/ArticleList";
import { SignInWithGoogleButton, SignInWithGitHubButton } from "./components/auth/SignInButton";
import type { Feed, Article } from "@prisma/client";

interface FeedWithStats extends Feed {
  articleCount?: number;
}

interface ArticleWithFeed extends Article {
  feed: Feed;
  isRead?: boolean;
  readAt?: Date;
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
  const [isCategoryManagementOpen, setIsCategoryManagementOpen] = useState(false);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);

  // Sync selectedFeedId and selectedCategoryId with URL params
  useEffect(() => {
    const feedIdFromUrl = searchParams.get('feed');
    const categoryIdFromUrl = searchParams.get('categoryId');
    
    if (feedIdFromUrl !== selectedFeedId) {
      setSelectedFeedId(feedIdFromUrl);
    }
    if (categoryIdFromUrl !== selectedCategoryId) {
      setSelectedCategoryId(categoryIdFromUrl);
    }
  }, [searchParams]);

  // Load feeds when session changes
  useEffect(() => {
    if (status !== "loading") {
      loadFeeds();
    }
  }, [session, status]);

  // Load articles when feed or category selection changes
  useEffect(() => {
    loadArticles();
  }, [selectedFeedId, selectedCategoryId]);

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

  const loadArticles = async () => {
    setIsLoadingArticles(true);
    try {
      // Build URL with optional feed and/or category filter
      const params = new URLSearchParams();
      if (selectedFeedId) {
        params.append('feedId', selectedFeedId);
      }
      if (selectedCategoryId) {
        params.append('categoryId', selectedCategoryId);
      }
      
      const url = params.toString() 
        ? `/api/articles?${params.toString()}`
        : "/api/articles";
        
      const response = await fetch(url);
      const data = await response.json();
      // Handle wrapped response
      const responseData = data.data || data;
      setArticles(responseData.articles || []);
    } catch (error) {
      console.error("Failed to load articles:", error);
    } finally {
      setIsLoadingArticles(false);
    }
  };

  const handleSelectFeed = (feedId: string | null) => {
    // Update URL to reflect feed filter
    if (feedId) {
      router.push(`/?feed=${feedId}`);
    } else {
      router.push("/");
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    // Update URL to reflect category filter
    router.push(`/?categoryId=${categoryId}`);
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
      alert("Failed to unsubscribe from feed");
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

      alert("Feed deleted successfully");
    } catch (error) {
      console.error("Failed to delete feed:", error);
      alert(error instanceof Error ? error.message : "Failed to delete feed");
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
      alert("Failed to refresh feed");
    }
  };

  // Show sign-in prompt if not authenticated
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8 rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Welcome to NeuReed
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Sign in to access your personalized RSS feed reader
            </p>
          </div>
          <div className="space-y-4">
            <SignInWithGoogleButton />
            <SignInWithGitHubButton />
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Your feeds and preferences will be synced across all your devices
          </p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      sidebar={({ isCollapsed }) => (
        <div className="flex flex-col gap-4">
          {!isCollapsed && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddFeedOpen(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add
                </button>
                <button
                  onClick={() => setIsFeedBrowserOpen(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Browse
                </button>
              </div>
              <button
                onClick={() => setIsCategoryManagementOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
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
                Manage Categories
              </button>
            </div>
          )}

          {isCollapsed && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setIsAddFeedOpen(true)}
                className="flex items-center justify-center rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-700"
                title="Add Feed"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsFeedBrowserOpen(true)}
                className="flex items-center justify-center rounded-lg border border-gray-300 p-3 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                title="Browse Feeds"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsCategoryManagementOpen(true)}
                className="flex items-center justify-center rounded-lg border border-gray-300 p-3 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                title="Manage Categories"
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
            </div>
          )}

          {isLoadingFeeds ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
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
            />
          )}
        </div>
      )}
    >
      <ReadingPanelLayout>
        {({ onArticleSelect }: { onArticleSelect?: (articleId: string) => void }) => (
          <ArticleList
            articles={articles}
            isLoading={isLoadingArticles}
            variant="expanded"
            onArticleSelect={onArticleSelect}
          />
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

      {isCategoryManagementOpen && (
        <CategoryManagement
          onClose={() => setIsCategoryManagementOpen(false)}
          onCategoryCreated={() => {
            setIsCategoryManagementOpen(false);
            // The CategoryList component will automatically reload
          }}
        />
      )}
    </MainLayout>
  );
}
