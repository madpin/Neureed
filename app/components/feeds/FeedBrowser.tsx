"use client";

import { useState, useEffect } from "react";
import type { Feed } from "@prisma/client";

interface FeedWithSubscription extends Feed {
  isSubscribed: boolean;
}

interface FeedBrowserProps {
  onClose: () => void;
}

export function FeedBrowser({ onClose }: FeedBrowserProps) {
  const [feeds, setFeeds] = useState<FeedWithSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subscribingIds, setSubscribingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/feeds?includeAll=true");
      const data = await response.json();
      setFeeds(data.data?.feeds || []);
    } catch (error) {
      console.error("Failed to load feeds:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (feedId: string) => {
    setSubscribingIds((prev) => new Set(prev).add(feedId));
    try {
      const response = await fetch("/api/user/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId }),
      });

      if (response.ok) {
        setFeeds((prev) =>
          prev.map((feed) =>
            feed.id === feedId ? { ...feed, isSubscribed: true } : feed
          )
        );
      } else {
        const error = await response.json();
        alert(error.error || "Failed to subscribe");
      }
    } catch (error) {
      console.error("Failed to subscribe:", error);
      alert("Failed to subscribe to feed");
    } finally {
      setSubscribingIds((prev) => {
        const next = new Set(prev);
        next.delete(feedId);
        return next;
      });
    }
  };

  const handleUnsubscribe = async (feedId: string) => {
    setSubscribingIds((prev) => new Set(prev).add(feedId));
    try {
      const response = await fetch("/api/user/feeds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId }),
      });

      if (response.ok) {
        setFeeds((prev) =>
          prev.map((feed) =>
            feed.id === feedId ? { ...feed, isSubscribed: false } : feed
          )
        );
      } else {
        const error = await response.json();
        alert(error.error || "Failed to unsubscribe");
      }
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      alert("Failed to unsubscribe from feed");
    } finally {
      setSubscribingIds((prev) => {
        const next = new Set(prev);
        next.delete(feedId);
        return next;
      });
    }
  };

  const filteredFeeds = feeds.filter(
    (feed) =>
      feed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feed.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feed.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Browse Feeds
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
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
        </div>

        {/* Search */}
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <input
            type="text"
            placeholder="Search feeds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        {/* Feed List */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          ) : filteredFeeds.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? "No feeds found matching your search" : "No feeds available"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeeds.map((feed) => (
                <div
                  key={feed.id}
                  className="flex items-start gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-750"
                >
                  {feed.imageUrl && (
                    <img
                      src={feed.imageUrl}
                      alt={feed.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {feed.name}
                    </h3>
                    {feed.description && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {feed.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500 truncate">
                      {feed.url}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      feed.isSubscribed
                        ? handleUnsubscribe(feed.id)
                        : handleSubscribe(feed.id)
                    }
                    disabled={subscribingIds.has(feed.id)}
                    className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      feed.isSubscribed
                        ? "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    } disabled:opacity-50`}
                  >
                    {subscribingIds.has(feed.id)
                      ? "..."
                      : feed.isSubscribed
                        ? "Unsubscribe"
                        : "Subscribe"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

