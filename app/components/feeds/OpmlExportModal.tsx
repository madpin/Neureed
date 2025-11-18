"use client";

import { useState, useEffect, useRef } from "react";
import type { Feed, Category } from "@prisma/client";

interface FeedWithCategories extends Feed {
  feedCategories?: Array<{
    category: Category;
  }>;
}

interface OpmlExportModalProps {
  onClose: () => void;
}

export function OpmlExportModal({ onClose }: OpmlExportModalProps) {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [feeds, setFeeds] = useState<FeedWithCategories[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [exportMode, setExportMode] = useState<"all" | "categories" | "feeds">("all");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [selectedFeedIds, setSelectedFeedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user's feeds
      const feedsResponse = await fetch("/api/user/feeds");
      if (!feedsResponse.ok) throw new Error("Failed to load feeds");
      const feedsData = await feedsResponse.json();
      setFeeds(feedsData.data || []);

      // Load categories
      const categoriesResponse = await fetch("/api/feeds?limit=1000");
      if (!categoriesResponse.ok) throw new Error("Failed to load categories");
      const categoriesData = await categoriesResponse.json();

      // Extract unique categories from feeds
      const uniqueCategories = new Map<string, Category>();
      for (const feed of feedsData.data || []) {
        if (feed.feed?.feedCategories) {
          for (const fc of feed.feed.feedCategories) {
            if (fc.category && !uniqueCategories.has(fc.category.id)) {
              uniqueCategories.set(fc.category.id, fc.category);
            }
          }
        }
      }
      setCategories(Array.from(uniqueCategories.values()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();

      if (exportMode === "categories" && selectedCategoryIds.size > 0) {
        selectedCategoryIds.forEach((id) => params.append("categoryIds", id));
      } else if (exportMode === "feeds" && selectedFeedIds.size > 0) {
        selectedFeedIds.forEach((id) => params.append("feedIds", id));
      }

      // Make export request
      const response = await fetch(`/api/user/opml/export?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Export failed");
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neureed-feeds-${new Date().toISOString().split("T")[0]}.opml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Close modal after successful export
      setTimeout(() => onClose(), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newSelection = new Set(selectedCategoryIds);
    if (newSelection.has(categoryId)) {
      newSelection.delete(categoryId);
    } else {
      newSelection.add(categoryId);
    }
    setSelectedCategoryIds(newSelection);
  };

  const toggleFeed = (feedId: string) => {
    const newSelection = new Set(selectedFeedIds);
    if (newSelection.has(feedId)) {
      newSelection.delete(feedId);
    } else {
      newSelection.add(feedId);
    }
    setSelectedFeedIds(newSelection);
  };

  const selectAllCategories = () => {
    setSelectedCategoryIds(new Set(categories.map((c) => c.id)));
  };

  const deselectAllCategories = () => {
    setSelectedCategoryIds(new Set());
  };

  const selectAllFeeds = () => {
    setSelectedFeedIds(new Set(feeds.map((f) => f.feed.id)));
  };

  const deselectAllFeeds = () => {
    setSelectedFeedIds(new Set());
  };

  const getExportCount = () => {
    if (exportMode === "all") return feeds.length;
    if (exportMode === "categories") {
      return feeds.filter((f) =>
        f.feed?.feedCategories?.some((fc) =>
          selectedCategoryIds.has(fc.category.id)
        )
      ).length;
    }
    return selectedFeedIds.size;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div ref={modalRef} className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-lg border border-border bg-background shadow-xl border-border bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Export Feeds (OPML)
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 180px)" }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Export Mode Selection */}
              <div>
                <label className="mb-3 block text-sm font-medium text-foreground/70">
                  What would you like to export?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="exportMode"
                      value="all"
                      checked={exportMode === "all"}
                      onChange={(e) => setExportMode(e.target.value as any)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm text-foreground/70">
                      All feeds ({feeds.length})
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="exportMode"
                      value="categories"
                      checked={exportMode === "categories"}
                      onChange={(e) => setExportMode(e.target.value as any)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm text-foreground/70">
                      Select by categories
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="exportMode"
                      value="feeds"
                      checked={exportMode === "feeds"}
                      onChange={(e) => setExportMode(e.target.value as any)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm text-foreground/70">
                      Select individual feeds
                    </span>
                  </label>
                </div>
              </div>

              {/* Category Selection */}
              {exportMode === "categories" && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground/70">
                      Select Categories
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllCategories}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Select All
                      </button>
                      <span className="text-xs text-foreground/50">|</span>
                      <button
                        onClick={deselectAllCategories}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border border-border p-3 border-border">
                    {categories.length === 0 ? (
                      <p className="text-sm text-foreground/60">No categories found</p>
                    ) : (
                      categories.map((category) => (
                        <label key={category.id} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCategoryIds.has(category.id)}
                            onChange={() => toggleCategory(category.id)}
                            className="h-4 w-4 rounded text-blue-600"
                          />
                          <span className="text-sm text-foreground/70">
                            {category.name}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Feed Selection */}
              {exportMode === "feeds" && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground/70">
                      Select Feeds
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllFeeds}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Select All
                      </button>
                      <span className="text-xs text-foreground/50">|</span>
                      <button
                        onClick={deselectAllFeeds}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border border-border p-3 border-border">
                    {feeds.map((userFeed) => (
                      <label key={userFeed.feed.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFeedIds.has(userFeed.feed.id)}
                          onChange={() => toggleFeed(userFeed.feed.id)}
                          className="h-4 w-4 rounded text-blue-600"
                        />
                        <span className="text-sm text-foreground/70">
                          {userFeed.feed.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Info */}
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {getExportCount()} feed(s) will be exported
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 border-border">
          <button
            onClick={onClose}
            disabled={exporting}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 border-border"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || loading || getExportCount() === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {exporting ? "Exporting..." : "Export OPML"}
          </button>
        </div>
      </div>
    </div>
  );
}

