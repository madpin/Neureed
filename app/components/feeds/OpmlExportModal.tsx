"use client";

import { useState } from "react";
import { useUserFeeds } from "@/hooks/queries/use-feeds";
import { useCategories } from "@/hooks/queries/use-categories";
import { useExportOpml } from "@/hooks/queries/use-opml";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "@/app/components/ui";

interface OpmlExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OpmlExportModal({ isOpen, onClose }: OpmlExportModalProps) {
  const [exportMode, setExportMode] = useState<"all" | "categories" | "feeds">("all");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [selectedFeedIds, setSelectedFeedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Use React Query hooks
  const { data: subscriptions = [], isLoading: loadingFeeds } = useUserFeeds();
  const { data: categoriesData = [], isLoading: loadingCategories } = useCategories();

  const exportMutation = useExportOpml();

  const loading = loadingFeeds || loadingCategories;
  const exporting = exportMutation.isPending;

  const handleExport = async () => {
    try {
      setError(null);

      // Build options
      const options: { categoryIds?: string[]; feedIds?: string[] } = {};

      if (exportMode === "categories" && selectedCategoryIds.size > 0) {
        options.categoryIds = Array.from(selectedCategoryIds);
      } else if (exportMode === "feeds" && selectedFeedIds.size > 0) {
        options.feedIds = Array.from(selectedFeedIds);
      }

      // Make export request
      const blob = await exportMutation.mutateAsync(options);

      // Download file
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
    setSelectedCategoryIds(new Set(categoriesData.map((c) => c.id)));
  };

  const deselectAllCategories = () => {
    setSelectedCategoryIds(new Set());
  };

  const selectAllFeeds = () => {
    setSelectedFeedIds(new Set(subscriptions.map((s) => s.id)));
  };

  const deselectAllFeeds = () => {
    setSelectedFeedIds(new Set());
  };

  const getExportCount = () => {
    if (exportMode === "all") return subscriptions.length;
    if (exportMode === "categories") {
      // Count feeds in selected categories
      return subscriptions.filter((s) =>
        s.category && selectedCategoryIds.has(s.category.id)
      ).length;
    }
    return selectedFeedIds.size;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader title="Export Feeds (OPML)" onClose={onClose} />
      <ModalBody>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
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
                      className="h-4 w-4 text-primary"
                    />
                    <span className="text-sm text-foreground/70">
                      All feeds ({subscriptions.length})
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="exportMode"
                      value="categories"
                      checked={exportMode === "categories"}
                      onChange={(e) => setExportMode(e.target.value as any)}
                      className="h-4 w-4 text-primary"
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
                      className="h-4 w-4 text-primary"
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
                        className="text-xs text-primary hover:text-primary/90 dark:text-primary"
                      >
                        Select All
                      </button>
                      <span className="text-xs text-foreground/50">|</span>
                      <button
                        onClick={deselectAllCategories}
                        className="text-xs text-primary hover:text-primary/90 dark:text-primary"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border border-border p-3 border-border">
                    {categoriesData.length === 0 ? (
                      <p className="text-sm text-foreground/60">No categories found</p>
                    ) : (
                      categoriesData.map((category) => (
                        <label key={category.id} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCategoryIds.has(category.id)}
                            onChange={() => toggleCategory(category.id)}
                            className="h-4 w-4 rounded text-primary"
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
                        className="text-xs text-primary hover:text-primary/90 dark:text-primary"
                      >
                        Select All
                      </button>
                      <span className="text-xs text-foreground/50">|</span>
                      <button
                        onClick={deselectAllFeeds}
                        className="text-xs text-primary hover:text-primary/90 dark:text-primary"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border border-border p-3 border-border">
                    {subscriptions.map((subscription) => (
                      <label key={subscription.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFeedIds.has(subscription.id)}
                          onChange={() => toggleFeed(subscription.id)}
                          className="h-4 w-4 rounded text-blue-600"
                        />
                        <span className="text-sm text-foreground/70">
                          {subscription.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Info */}
              <div className="rounded-lg bg-primary/10 p-4 dark:bg-primary/20">
                <p className="text-sm text-primary dark:text-primary">
                  {getExportCount()} feed(s) will be exported
                </p>
              </div>
            </div>
          )}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={exporting}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleExport}
          disabled={exporting || loading || getExportCount() === 0}
          loading={exporting}
        >
          Export OPML
        </Button>
      </ModalFooter>
    </Modal>
  );
}
