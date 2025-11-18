"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Feed } from "@prisma/client";
import { FeedSettingsPanel } from "./FeedSettingsPanel";

interface FeedWithStats extends Feed {
  articleCount?: number;
  unreadCount?: number;
}

interface FeedListProps {
  feeds: FeedWithStats[];
  selectedFeedId?: string;
  onSelectFeed?: (feedId: string | null) => void;
  onDeleteFeed: (feedId: string) => void;
  onRefreshFeed: (feedId: string) => void;
  onUnsubscribeFeed: (feedId: string) => void;
}

export function FeedList({
  feeds,
  selectedFeedId,
  onSelectFeed,
  onDeleteFeed,
  onRefreshFeed,
  onUnsubscribeFeed,
}: FeedListProps) {
  const router = useRouter();
  const [expandedFeedId, setExpandedFeedId] = useState<string | null>(null);
  const [settingsFeedId, setSettingsFeedId] = useState<string | null>(null);

  const handleToggleFeed = (feedId: string) => {
    setExpandedFeedId(expandedFeedId === feedId ? null : feedId);
  };

  const handleSelectFeed = (feedId: string | null) => {
    if (onSelectFeed) {
      // Use callback if provided (for backwards compatibility)
      onSelectFeed(feedId);
    } else {
      // Use router navigation
      if (feedId) {
        router.push(`/feeds/${feedId}`);
      } else {
        router.push("/");
      }
    }
  };

  const hasExtractionSettings = (feed: Feed) => {
    if (!feed.settings || typeof feed.settings !== "object") return false;
    const settings = feed.settings as any;
    return !!settings.extraction;
  };

  return (
    <div className="flex flex-col gap-1">
      {/* All Articles */}
      <button
        onClick={() => handleSelectFeed(null)}
        className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
          !selectedFeedId
            ? "bg-accent/10 text-primary"
            : "hover:bg-muted"
        }`}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
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
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <div className="font-medium">All Articles</div>
        </div>
      </button>

      {/* Feed List */}
      <div className="mt-4">
        <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wide text-secondary">
          Feeds
        </h3>
        {feeds.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-secondary">
            No feeds yet. Add your first feed to get started!
          </div>
        ) : (
          feeds.map((feed) => (
            <div key={feed.id} className="relative">
              <div
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                  selectedFeedId === feed.id
                    ? "bg-accent/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <button
                  onClick={() => handleSelectFeed(feed.id)}
                  className="flex flex-1 items-center gap-3 text-left min-w-0"
                >
                  {feed.imageUrl ? (
                    <img
                      src={feed.imageUrl}
                      alt={feed.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
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
                          d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{feed.name}</div>
                    {feed.articleCount !== undefined && (
                      <div className="text-xs text-secondary">
                        {feed.articleCount} articles
                      </div>
                    )}
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFeed(feed.id);
                  }}
                  className="p-1 hover:bg-muted rounded flex-shrink-0"
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
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
              </div>

              {/* Feed Actions Menu */}
              {expandedFeedId === feed.id && (
                <div className="absolute right-4 top-full z-10 mt-1 w-48 rounded-lg border border-border bg-background shadow-lg">
                  <button
                    onClick={() => {
                      onRefreshFeed(feed.id);
                      setExpandedFeedId(null);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh
                  </button>
                  <button
                    onClick={() => {
                      setSettingsFeedId(feed.id);
                      setExpandedFeedId(null);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Settings
                    {hasExtractionSettings(feed) && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-accent" title="Has extraction settings" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Settings Panel */}
      {settingsFeedId && (
        <FeedSettingsPanel
          feedId={settingsFeedId}
          feedName={feeds.find((f) => f.id === settingsFeedId)?.name || "Feed"}
          onClose={() => setSettingsFeedId(null)}
          onUnsubscribe={onUnsubscribeFeed}
          onDelete={onDeleteFeed}
        />
      )}
    </div>
  );
}

