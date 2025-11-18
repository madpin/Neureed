"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MainLayout } from "./components/layout/MainLayout";
import { ReadingPanelLayout } from "./components/layout/ReadingPanelLayout";
import { FeedList } from "./components/feeds/FeedList";
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
  const [feeds, setFeeds] = useState<FeedWithStats[]>([]);
  const [articles, setArticles] = useState<ArticleWithFeed[]>([]);
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [isFeedBrowserOpen, setIsFeedBrowserOpen] = useState(false);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);

  // Load feeds when session changes
  useEffect(() => {
    if (status !== "loading") {
      loadFeeds();
    }
  }, [session, status]);

  // Load articles when feed selection changes
  useEffect(() => {
    loadArticles();
  }, [selectedFeedId]);

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
  }, [selectedFeedId]);

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
      const url = selectedFeedId
        ? `/api/articles?feedId=${selectedFeedId}`
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
      if (selectedFeedId === feedId) {
        setSelectedFeedId(null);
      }
    } catch (error) {
      console.error("Failed to unsubscribe from feed:", error);
      alert("Failed to unsubscribe from feed");
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
      sidebar={
        <div className="flex flex-col gap-4">
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
            <FeedList
              feeds={feeds}
              selectedFeedId={selectedFeedId || undefined}
              onSelectFeed={setSelectedFeedId}
              onDeleteFeed={handleUnsubscribeFeed}
              onRefreshFeed={handleRefreshFeed}
            />
          )}
        </div>
      }
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
    </MainLayout>
  );
}
