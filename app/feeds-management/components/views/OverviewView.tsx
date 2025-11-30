"use client";

import { useState } from "react";
import { useFeedNavigation } from "@/hooks/use-feed-navigation";
import { useUserFeeds, type UserFeed } from "@/hooks/queries/use-feeds";
import { useCategories } from "@/hooks/queries/use-categories";

// Extended type to include articleCount which may be provided by API
interface UserFeedWithStats extends UserFeed {
  articleCount?: number;
}

/**
 * Overview View - Feed Management Dashboard
 *
 * Displays:
 * - Statistics panel (total categories, feeds, articles)
 * - OPML import/export section
 * - Feeds table with bulk operations
 * - Categories management section
 */
export function OverviewView() {
  const { navigateToFeed, navigateToCategory, openModal } = useFeedNavigation();
  const { data, isLoading: feedsLoading } = useUserFeeds();
  const feeds = (data || []) as UserFeedWithStats[];
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const [selectedFeedIds, setSelectedFeedIds] = useState<string[]>([]);

  // Calculate statistics
  const totalCategories = categories.length;
  const totalFeeds = feeds.length;
  const uncategorizedFeeds = feeds.filter(feed => !feed.category).length;
  const totalArticles = feeds.reduce((sum, feed) => sum + (feed.articleCount || 0), 0);

  // Handle bulk selection
  const toggleFeedSelection = (feedId: string) => {
    setSelectedFeedIds(prev =>
      prev.includes(feedId)
        ? prev.filter(id => id !== feedId)
        : [...prev, feedId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFeedIds.length === feeds.length) {
      setSelectedFeedIds([]);
    } else {
      setSelectedFeedIds(feeds.map(f => f.id));
    }
  };

  const isLoading = feedsLoading || categoriesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Feed Management Overview</h2>
        <div className="flex gap-2">
          <button
            onClick={() => openModal("opml-import")}
            className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors"
          >
            Import OPML
          </button>
          <button
            onClick={() => openModal("opml-export")}
            className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors"
          >
            Export OPML
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Categories</div>
          <div className="mt-2 text-2xl font-bold">
            {isLoading ? "..." : totalCategories}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Feeds</div>
          <div className="mt-2 text-2xl font-bold">
            {isLoading ? "..." : totalFeeds}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Uncategorized</div>
          <div className="mt-2 text-2xl font-bold">
            {isLoading ? "..." : uncategorizedFeeds}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Articles</div>
          <div className="mt-2 text-2xl font-bold">
            {isLoading ? "..." : totalArticles.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Feeds Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">All Feeds ({feeds.length})</h3>
          {selectedFeedIds.length > 0 && (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">
                {selectedFeedIds.length} selected
              </span>
              <button
                onClick={() => openModal("bulk-edit")}
                className="px-2 py-1 text-xs border border-border rounded hover:bg-muted transition-colors"
              >
                Bulk Edit
              </button>
              <button
                onClick={() => setSelectedFeedIds([])}
                className="px-2 py-1 text-xs border border-border rounded hover:bg-muted transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading feeds...
          </div>
        ) : feeds.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No feeds yet. Add your first feed to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-2 text-left">
                    <input
                      type="checkbox"
                      checked={selectedFeedIds.length === feeds.length && feeds.length > 0}
                      onChange={toggleSelectAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="p-2 text-left text-sm font-medium">Feed Name</th>
                  <th className="p-2 text-left text-sm font-medium">URL</th>
                  <th className="p-2 text-left text-sm font-medium">Category</th>
                  <th className="p-2 text-left text-sm font-medium">Articles</th>
                  <th className="p-2 text-left text-sm font-medium">Status</th>
                  <th className="p-2 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feeds.map((feed) => (
                  <tr
                    key={feed.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedFeedIds.includes(feed.id)}
                        onChange={() => toggleFeedSelection(feed.id)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => navigateToFeed(feed.id)}
                        className="text-sm hover:underline text-left"
                      >
                        {feed.name}
                      </button>
                    </td>
                    <td className="p-2 text-sm text-muted-foreground max-w-xs truncate">
                      {feed.url}
                    </td>
                    <td className="p-2 text-sm">
                      {feed.category
                        ? feed.category.name
                        : <span className="text-muted-foreground">Uncategorized</span>
                      }
                    </td>
                    <td className="p-2 text-sm">
                      {feed.articleCount || 0}
                    </td>
                    <td className="p-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                          feed.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {feed.isActive ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => navigateToFeed(feed.id)}
                        className="px-2 py-1 text-xs border border-border rounded hover:bg-muted transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Categories ({categories.length})</h3>
          <button
            onClick={() => openModal("create-category")}
            className="px-2 py-1 text-xs border border-border rounded hover:bg-muted transition-colors"
          >
            + New Category
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No categories yet. Create your first category to organize feeds.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => navigateToCategory(category.id)}
                className="p-4 rounded-lg border border-border hover:border-foreground/20 hover:bg-muted/50 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {category.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    <h4 className="font-medium">{category.name}</h4>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {category.feedCount || 0} feeds
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click to manage category settings and feeds
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
