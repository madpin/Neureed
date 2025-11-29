"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { toast } from "sonner";
import { OpmlExportModal } from "../../OpmlExportModal";
import { OpmlImportModal } from "../../OpmlImportModal";
import { BulkFeedSettingsModal, type BulkSettings } from "../../BulkFeedSettingsModal";
import { formatSmartDate } from "@/lib/date-utils";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
} from "@/hooks/queries/use-categories";
import {
  useUserFeeds,
  useBulkUpdateFeedSettings,
  type UserFeed as _UserFeed,
} from "@/hooks/queries/use-feeds";
import { Card, CardBody, StatCard } from "@/app/components/ui";

interface Statistics {
  totalCategories: number;
  totalFeeds: number;
  totalArticles: number;
  uncategorizedFeeds: number;
}

interface OverviewViewProps {
  onNavigateToCategory: (categoryId: string) => void;
  onNavigateToFeed: (feedId: string) => void;
  onRefreshData?: () => void;
  onAddFeed?: () => void;
  onBrowseFeeds?: () => void;
}

// Memoized FeedRow Component for performance
const FeedRow = memo(({
  feed,
  isSelected,
  onToggleSelect,
  onNavigateToFeed,
}: {
  feed: _UserFeed;
  isSelected: boolean;
  onToggleSelect: (feedId: string) => void;
  onNavigateToFeed: (feedId: string) => void;
}) => {
  const feedSettings = feed.settings || {};
  const refreshInterval = feedSettings.refreshInterval || 60;
  const hasExtractionSettings = (feed as any).settings?.extraction;
  const extractionMethod = hasExtractionSettings?.method || "readability";

  return (
    <tr
      key={feed.id}
      onClick={() => onToggleSelect(feed.id)}
      className={`hover:bg-muted/30 transition-colors cursor-pointer ${
        isSelected ? "bg-accent/5" : ""
      }`}
    >
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(feed.id)}
          className="h-4 w-4 rounded border-border cursor-pointer"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {feed.imageUrl ? (
            <img
              src={feed.imageUrl}
              alt=""
              className="h-8 w-8 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
              <svg className="h-4 w-4 text-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{feed.name}</div>
            {feed.category && (
              <div className="text-xs text-foreground/50 truncate">
                {feed.category.name}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-foreground/60 whitespace-nowrap">
        {feed.lastFetched ? formatSmartDate(new Date(feed.lastFetched)) : "Never"}
      </td>
      <td className="px-4 py-3 text-sm text-foreground/60">
        <span className="inline-flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {refreshInterval}m
        </span>
      </td>
      <td className="px-4 py-3 text-sm">
        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${
          extractionMethod === "rss"
            ? "bg-accent/10 text-accent border-accent/20"
            : extractionMethod === "readability"
            ? "bg-primary/10 text-primary border-primary/20"
            : "bg-secondary/10 text-secondary border-secondary/20"
        }`}>
          {extractionMethod}
        </span>
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onNavigateToFeed(feed.id)}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
          title="Edit feed settings"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="hidden sm:inline">Settings</span>
        </button>
      </td>
    </tr>
  );
});

FeedRow.displayName = "FeedRow";

// Memoized CategoryCard Component for performance
const CategoryCard = memo(({
  category,
  onNavigateToCategory,
  onDeleteCategory,
}: {
  category: any;
  onNavigateToCategory: (categoryId: string) => void;
  onDeleteCategory: (categoryId: string, categoryName: string) => void;
}) => (
  <div className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50">
    <div className="flex items-center gap-3">
      <span className="text-2xl">{category.icon || "📁"}</span>
      <div>
        <h3 className="font-medium">{category.name}</h3>
        <p className="text-sm text-foreground/60">
          {category.feedCount || 0} feeds
          {category.description && ` • ${category.description}`}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={() => onNavigateToCategory(category.id)}
        className="p-2 hover:bg-muted rounded-lg text-foreground/70 hover:text-foreground"
        title="Edit Category"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <button
        onClick={() => onDeleteCategory(category.id, category.name)}
        className="p-2 hover:bg-red-100 rounded-lg text-red-600 hover:text-red-700 dark:hover:bg-red-900/20"
        title="Delete Category"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
));

CategoryCard.displayName = "CategoryCard";

export function OverviewView({
  onNavigateToCategory,
  onNavigateToFeed,
  onRefreshData,
  onAddFeed,
  onBrowseFeeds,
}: OverviewViewProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Bulk operations state
  const [selectedFeedIds, setSelectedFeedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Use React Query hooks
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const { data: subscriptions = [], isLoading: loadingFeeds } = useUserFeeds();

  const createCategoryMutation = useCreateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const bulkUpdateMutation = useBulkUpdateFeedSettings();

  const isLoading = loadingCategories || loadingFeeds;

  // Memoize statistics calculation to avoid recalculating on every render
  const statistics: Statistics = useMemo(() => ({
    totalCategories: categories.length,
    totalFeeds: subscriptions.length,
    totalArticles: 0, // We don't have this data readily available in these hooks
    uncategorizedFeeds: subscriptions.filter(s => !s.category).length,
  }), [categories.length, subscriptions]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategoryMutation.mutateAsync({
        name: newCategoryName.trim(),
      });

      setNewCategoryName("");
      setNewCategoryDescription("");
      setIsCreating(false);
      onRefreshData?.();
    } catch (err) {
      console.error("Failed to create category:", err);
      toast.error("Failed to create category");
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?\n\nFeeds in this category will become uncategorized.`)) {
      return;
    }

    try {
      await deleteCategoryMutation.mutateAsync(categoryId);
      onRefreshData?.();
    } catch (err) {
      console.error("Failed to delete category:", err);
      toast.error("Failed to delete category");
    }
  };

  const handleImportSuccess = () => {
    setShowImportModal(false);
    onRefreshData?.();
  };

  // Bulk operations handlers - memoized with useCallback
  const handleToggleSelectAll = useCallback(() => {
    if (selectedFeedIds.size === subscriptions.length) {
      setSelectedFeedIds(new Set());
    } else {
      setSelectedFeedIds(new Set(subscriptions.map(s => s.id)));
    }
  }, [selectedFeedIds.size, subscriptions]);

  const handleToggleSelect = useCallback((feedId: string) => {
    const newSet = new Set(selectedFeedIds);
    if (newSet.has(feedId)) {
      newSet.delete(feedId);
    } else {
      newSet.add(feedId);
    }
    setSelectedFeedIds(newSet);
  }, [selectedFeedIds]);

  const handleBulkApply = useCallback(async (settings: BulkSettings) => {
    const feedIds = Array.from(selectedFeedIds);

    try {
      await bulkUpdateMutation.mutateAsync({
        feedIds,
        settings,
      });

      setSelectedFeedIds(new Set());
      onRefreshData?.();
    } catch (error) {
      throw error;
    }
  }, [selectedFeedIds, bulkUpdateMutation, onRefreshData]);

  // Memoize selectedFeeds calculation
  const selectedFeeds = useMemo(
    () => subscriptions.filter(s => selectedFeedIds.has(s.id)),
    [subscriptions, selectedFeedIds]
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feed & Category Management</h1>
        <div className="flex items-center gap-2">
          {onAddFeed && (
            <button
              onClick={onAddFeed}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Feed
            </button>
          )}
          {onBrowseFeeds && (
            <button
              onClick={onBrowseFeeds}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Feeds
            </button>
          )}
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Category
          </button>
        </div>
      </div>

      {/* Statistics Panel */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard
          title="Total Categories"
          value={statistics.totalCategories}
          label="Categories"
          iconColor="blue"
        />
        <StatCard
          title="Total Feeds"
          value={statistics.totalFeeds}
          label="Feeds"
          iconColor="green"
        />
        <StatCard
          title="Uncategorized"
          value={statistics.uncategorizedFeeds}
          label="Feeds"
          iconColor="yellow"
        />
        <StatCard
          title="Total Articles"
          value="-"
          label="Articles"
          iconColor="purple"
        />
      </div>

      {/* OPML Import/Export Section */}
      <div className="mb-6 space-y-4">
        {/* Info Section */}
        <Card className="bg-primary/10 dark:bg-primary/20">
          <CardBody>
            <h3 className="mb-2 font-semibold text-primary dark:text-primary">
              OPML Import & Export
            </h3>
            <p className="text-sm text-primary/80 dark:text-primary/90">
              OPML (Outline Processor Markup Language) is a standard format for exchanging lists of RSS feeds.
              Use it to backup your feeds or transfer them between applications.
            </p>
          </CardBody>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          {/* Export Section */}
          <Card>
            <CardBody>
              <h3 className="mb-2 text-base font-semibold">Export Feeds</h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Download your feed subscriptions as an OPML file.
              </p>
              <button
                onClick={() => setShowExportModal(true)}
                disabled={statistics.totalFeeds === 0}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Export OPML
              </button>
            </CardBody>
          </Card>

          {/* Import Section */}
          <Card>
            <CardBody>
              <h3 className="mb-2 text-base font-semibold">Import Feeds</h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Import feeds from another reader using an OPML file.
              </p>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import OPML
              </button>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Feeds List */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Your Feeds</h2>
            {selectedFeedIds.size > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {selectedFeedIds.size} selected
              </span>
            )}
          </div>
          {selectedFeedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkModal(true)}
                className="btn btn-primary btn-sm"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Bulk Edit
              </button>
              <button
                onClick={() => setSelectedFeedIds(new Set())}
                className="btn btn-outline btn-sm"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Feeds Table */}
        <div className="rounded-lg border border-border overflow-hidden bg-background">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={subscriptions.length > 0 && selectedFeedIds.size === subscriptions.length}
                      onChange={handleToggleSelectAll}
                      className="h-4 w-4 rounded border-border cursor-pointer"
                      title="Select all"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground/70">Feed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground/70">Last Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground/70">Interval</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground/70">Extraction</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-foreground/70">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="h-12 w-12 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                        <p className="text-sm text-foreground/50">No feeds found. Add your first feed to get started!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((feed) => (
                    <FeedRow
                      key={feed.id}
                      feed={feed}
                      isSelected={selectedFeedIds.has(feed.id)}
                      onToggleSelect={handleToggleSelect}
                      onNavigateToFeed={onNavigateToFeed}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Categories</h2>

        {/* Category Creation Form */}
        {isCreating && (
          <form onSubmit={handleCreateCategory} className="rounded-lg border border-border p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category Name</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <input
                type="text"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
              </button>
            </div>
          </form>
        )}

        {/* Categories Display */}
        <div className="space-y-2">
          {categories.map((category: any) => (
            <CategoryCard
              key={category.id}
              category={category}
              onNavigateToCategory={onNavigateToCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          ))}

          {categories.length === 0 && !isLoading && (
            <div className="text-center py-8 text-foreground/50">
              No categories found. Create one to organize your feeds.
            </div>
          )}
        </div>
      </div>

      <OpmlExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      <OpmlImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Bulk Edit Modal */}
      <BulkFeedSettingsModal
        isOpen={showBulkModal}
        selectedFeeds={selectedFeeds}
        onClose={() => setShowBulkModal(false)}
        onApply={handleBulkApply}
      />
    </div>
  );
}
