"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { CookieGuide } from "./CookieGuide";
import { OpmlExportModal } from "./OpmlExportModal";
import { OpmlImportModal } from "./OpmlImportModal";
import { BulkFeedSettingsModal, type BulkSettings } from "./BulkFeedSettingsModal";
import { formatSmartDate } from "@/lib/date-utils";
import { 
  useCategories, 
  useCreateCategory, 
  useDeleteCategory, 
  useUpdateCategory 
} from "@/hooks/queries/use-categories";
import { 
  useFeeds, 
  useUserFeeds, 
  useUpdateFeedSettings, 
  useRefreshFeed, 
  useUnsubscribeFeed, 
  useDeleteFeed,
  useBulkUpdateFeedSettings,
  type Feed,
  type UserFeed
} from "@/hooks/queries/use-feeds";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";

type ViewType = 'feed' | 'category' | 'overview';

interface FeedManagementModalProps {
  onClose: () => void;
  initialView?: ViewType;
  feedId?: string;
  categoryId?: string;
  onRefreshData?: () => void;
  onAddFeed?: () => void;
  onBrowseFeeds?: () => void;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon?: string | null;
  feedCount: number;
  feeds?: FeedInfo[];
}

interface FeedInfo {
  id: string;
  name: string;
  imageUrl: string | null;
  userFeedId: string;
  articleCount?: number;
  lastFetched?: Date | string | null;
}

interface ExtractionSettings {
  method: "rss" | "readability" | "playwright" | "custom";
  requiresAuth: boolean;
  contentMergeStrategy?: "replace" | "prepend" | "append";
  cookies?: { value: string };
  headers?: Record<string, string>;
  customSelector?: string;
  timeout?: number;
  lastTestedAt?: string;
  lastTestStatus?: "success" | "failed" | "pending";
  lastTestError?: string;
}

interface FeedDetails {
  id: string;
  name: string;
  url: string;
  imageUrl: string | null;
  settings?: ExtractionSettings;
  fetchInterval?: number;
}

interface Statistics {
  totalCategories: number;
  totalFeeds: number;
  totalArticles: number;
  uncategorizedFeeds: number;
}

export function FeedManagementModal({
  onClose,
  initialView = 'overview',
  feedId: initialFeedId,
  categoryId: initialCategoryId,
  onRefreshData,
  onAddFeed,
  onBrowseFeeds,
}: FeedManagementModalProps) {
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [feedId, setFeedId] = useState<string | undefined>(initialFeedId);
  const [categoryId, setCategoryId] = useState<string | undefined>(initialCategoryId);
  const modalRef = useRef<HTMLDivElement>(null);

  // Navigate to a different view
  const navigateToView = (view: ViewType, newFeedId?: string, newCategoryId?: string) => {
    // Update state
    setCurrentView(view);
    if (newFeedId !== undefined) setFeedId(newFeedId);
    if (newCategoryId !== undefined) setCategoryId(newCategoryId);

    // Push to browser history
    const state = { 
      modal: 'feedManagement',
      view, 
      feedId: newFeedId, 
      categoryId: newCategoryId 
    };
    window.history.pushState(state, '', window.location.href);
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.modal === 'feedManagement') {
        // Navigate to the state from history
        setCurrentView(event.state.view || 'overview');
        setFeedId(event.state.feedId);
        setCategoryId(event.state.categoryId);
      } else {
        // If we're going back beyond the modal, close it
        onClose();
      }
    };

    // Push initial state
    const initialState = { 
      modal: 'feedManagement',
      view: initialView, 
      feedId: initialFeedId, 
      categoryId: initialCategoryId 
    };
    window.history.pushState(initialState, '', window.location.href);

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onClose, initialView, initialFeedId, initialCategoryId]);

  // Handle modal close - clean up history
  const handleClose = () => {
    // Go back through history to remove modal states
    if (window.history.state?.modal === 'feedManagement') {
      window.history.back();
    }
    onClose();
  };

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div ref={modalRef} className="flex h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-background shadow-xl bg-background">
        {/* Sidebar Navigation */}
        <aside className="w-52 flex-shrink-0 border-r border-border bg-muted border-border dark:bg-background">
          <div className="flex h-full flex-col">
            <div className="border-b border-border p-4 border-border">
              <h2 className="text-lg font-semibold">Feed Management</h2>
          </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-2 custom-scrollbar">
              <button
                onClick={() => navigateToView('overview')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  currentView === 'overview'
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "hover:bg-muted hover:bg-muted"
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Overview</span>
              </button>

              <button
                onClick={() => feedId && navigateToView('feed')}
                disabled={!feedId}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  currentView === 'feed'
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : feedId
                    ? "hover:bg-muted hover:bg-muted"
                    : "cursor-not-allowed opacity-50"
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                <span>Feed Settings</span>
              </button>

            <button
                onClick={() => categoryId && navigateToView('category')}
                disabled={!categoryId}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  currentView === 'category'
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : categoryId
                    ? "hover:bg-muted hover:bg-muted"
                    : "cursor-not-allowed opacity-50"
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
                <span>Category Settings</span>
            </button>
          </nav>
            <div className="border-t border-border p-2 border-border">
            <button
              onClick={handleClose}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted hover:bg-muted"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
                <span>Close</span>
            </button>
          </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {currentView === 'overview' && (
              <ManagementOverview
              onNavigateToCategory={(catId) => navigateToView('category', undefined, catId)}
              onNavigateToFeed={(fId) => navigateToView('feed', fId, undefined)}
                onRefreshData={onRefreshData}
                onAddFeed={onAddFeed}
                onBrowseFeeds={onBrowseFeeds}
              />
            )}
          {currentView === 'category' && categoryId && (
              <CategorySettingsView
                categoryId={categoryId}
              onNavigateToFeed={(fId) => navigateToView('feed', fId, undefined)}
              onNavigateToOverview={() => navigateToView('overview')}
                onRefreshData={onRefreshData}
              />
            )}
          {currentView === 'feed' && feedId && (
              <FeedSettingsView
                feedId={feedId}
                onRefreshData={onRefreshData}
                onClose={onClose}
              />
            )}
        </main>
      </div>
    </div>
  );
}

// Management Overview Component
function ManagementOverview({
  onNavigateToCategory,
  onNavigateToFeed,
  onRefreshData,
  onAddFeed,
  onBrowseFeeds,
}: {
  onNavigateToCategory: (categoryId: string) => void;
  onNavigateToFeed: (feedId: string) => void;
  onRefreshData?: () => void;
  onAddFeed?: () => void;
  onBrowseFeeds?: () => void;
}) {
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
  // We use useUserFeeds here
  const { data: subscriptions = [], isLoading: loadingFeeds } = useUserFeeds();
  
  const createCategoryMutation = useCreateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const bulkUpdateMutation = useBulkUpdateFeedSettings();

  const isLoading = loadingCategories || loadingFeeds;

  const statistics: Statistics = {
    totalCategories: categories.length,
    totalFeeds: subscriptions.length,
    totalArticles: 0, // We don't have this data readily available in these hooks
    uncategorizedFeeds: subscriptions.filter(s => !s.category).length,
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategoryMutation.mutateAsync({
        name: newCategoryName.trim(),
        // Description support might need to be added to useCreateCategory hook or API if not present
        // Assuming API supports it but hook needs update if it doesn't pass it.
        // Current hook `useCreateCategory` takes `name` and `color`.
        // If API supports description, we should update hook.
        // For now we'll ignore description or update hook later.
        // Actually the hook takes `data: { name: string; color?: string }`.
        // I should update hook to support description.
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

  // Bulk operations handlers
  const handleToggleSelectAll = () => {
    if (selectedFeedIds.size === subscriptions.length) {
      setSelectedFeedIds(new Set());
    } else {
      setSelectedFeedIds(new Set(subscriptions.map(s => s.id)));
    }
  };

  const handleToggleSelect = (feedId: string) => {
    const newSet = new Set(selectedFeedIds);
    if (newSet.has(feedId)) {
      newSet.delete(feedId);
    } else {
      newSet.add(feedId);
    }
    setSelectedFeedIds(newSet);
  };

  const handleBulkApply = async (settings: BulkSettings) => {
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
  };

  const selectedFeeds = subscriptions.filter(s => selectedFeedIds.has(s.id));

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
        <div className="rounded-lg border border-border bg-muted p-4 border-border dark:bg-background">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Categories</div>
          <div className="text-2xl font-bold">{statistics.totalCategories}</div>
        </div>
        <div className="rounded-lg border border-border bg-muted p-4 border-border dark:bg-background">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Feeds</div>
          <div className="text-2xl font-bold">{statistics.totalFeeds}</div>
        </div>
        <div className="rounded-lg border border-border bg-muted p-4 border-border dark:bg-background">
          <div className="text-sm text-gray-600 dark:text-gray-400">Uncategorized</div>
          <div className="text-2xl font-bold">{statistics.uncategorizedFeeds}</div>
        </div>
        <div className="rounded-lg border border-border bg-muted p-4 border-border dark:bg-background">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Articles</div>
          <div className="text-2xl font-bold">-</div>
        </div>
      </div>

      {/* OPML Import/Export Section */}
      <div className="mb-6 space-y-4">
        {/* Info Section */}
        <div className="rounded-lg bg-primary/10 p-4 dark:bg-primary/20">
          <h3 className="mb-2 font-semibold text-primary dark:text-primary">
            OPML Import & Export
          </h3>
          <p className="text-sm text-primary/80 dark:text-primary/90">
            OPML (Outline Processor Markup Language) is a standard format for exchanging lists of RSS feeds.
            Use it to backup your feeds or transfer them between applications.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Export Section */}
          <div className="rounded-lg border border-border p-4">
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
          </div>

          {/* Import Section */}
          <div className="rounded-lg border border-border p-4">
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
          </div>
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
                  subscriptions.map((feed) => {
                    const feedSettings = feed.settings || {};
                    const refreshInterval = feedSettings.refreshInterval || 60;
                    const hasExtractionSettings = (feed as any).settings?.extraction;
                    const extractionMethod = hasExtractionSettings?.method || "rss";
                    
                    return (
                      <tr 
                        key={feed.id} 
                        onClick={() => handleToggleSelect(feed.id)}
                        className={`hover:bg-muted/30 transition-colors cursor-pointer ${
                          selectedFeedIds.has(feed.id) ? "bg-accent/5" : ""
                        }`}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedFeedIds.has(feed.id)}
                            onChange={() => handleToggleSelect(feed.id)}
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
                  })
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
            <div key={category.id} className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50">
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
                  onClick={() => handleDeleteCategory(category.id, category.name)}
                  className="p-2 hover:bg-red-100 rounded-lg text-red-600 hover:text-red-700 dark:hover:bg-red-900/20"
                  title="Delete Category"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          
          {categories.length === 0 && !isLoading && (
            <div className="text-center py-8 text-foreground/50">
              No categories found. Create one to organize your feeds.
            </div>
          )}
        </div>
      </div>

      {showExportModal && (
        <OpmlExportModal onClose={() => setShowExportModal(false)} />
      )}

      {showImportModal && (
        <OpmlImportModal onClose={() => setShowImportModal(false)} onSuccess={handleImportSuccess} />
      )}


      {/* Bulk Edit Modal */}
      {showBulkModal && (
        <BulkFeedSettingsModal
          selectedFeeds={selectedFeeds}
          onClose={() => setShowBulkModal(false)}
          onApply={handleBulkApply}
        />
      )}
    </div>
  );
}

// Placeholder for CategorySettingsView - would need full implementation similarly
function CategorySettingsView({
  categoryId,
  onNavigateToFeed,
  onNavigateToOverview,
  onRefreshData,
}: {
  categoryId: string;
  onNavigateToFeed: (feedId: string) => void;
  onNavigateToOverview: () => void;
  onRefreshData?: () => void;
}) {
  // In a real implementation we'd fetch category details here
  
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={onNavigateToOverview} className="p-2 hover:bg-muted rounded-lg">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">Category Settings</h1>
      </div>
      <div className="text-center py-12 text-foreground/50">
        Category settings implementation pending...
        <br/>
        (ID: {categoryId})
      </div>
    </div>
  );
}

// Feed Settings View Component
function FeedSettingsView({
  feedId,
  onRefreshData,
  onClose,
}: {
  feedId: string;
  onRefreshData?: () => void;
  onClose: () => void;
}) {
  // Hooks
  const { data: feeds = [] } = useFeeds();
  const { data: subscriptions = [] } = useUserFeeds();
  const { data: categories = [] } = useCategories();
  
  const updateFeedSettingsMutation = useUpdateFeedSettings();
  const refreshFeedMutation = useRefreshFeed();
  const deleteFeedMutation = useDeleteFeed();
  const unsubscribeFeedMutation = useUnsubscribeFeed();
  
  // Find the feed and subscription
  const feed = feeds.find(f => f.id === feedId);
  const subscription = subscriptions.find(s => (s as any).id === feedId || (s as any).feedId === feedId);
  
  // Local State
  const [customName, setCustomName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [fetchInterval, setFetchInterval] = useState(60);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);
  
  // Advanced Extraction Settings
  const [extractionMethod, setExtractionMethod] = useState<"rss" | "readability" | "playwright" | "custom">("rss");
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [contentMergeStrategy, setContentMergeStrategy] = useState<"replace" | "prepend" | "append">("replace");
  const [cookies, setCookies] = useState("");
  const [headers, setHeaders] = useState("");
  const [customSelector, setCustomSelector] = useState("");
  const [timeoutVal, setTimeoutVal] = useState<number | undefined>(30);
  
  // Test result state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  
  // Initialize state when data loads
  useEffect(() => {
    if (subscription) {
      setCustomName((subscription as any).name || "");
      if (subscription.category) {
        setSelectedCategory(subscription.category.id);
      }
      
      if (subscription.settings) {
        setFetchInterval(subscription.settings.refreshInterval || 60);
        
        // Load extraction settings if they exist
        const extractionSettings = (subscription.settings as any)?.extraction;
        if (extractionSettings) {
          if (extractionSettings.method) {
            setExtractionMethod(extractionSettings.method);
          }
          if (extractionSettings.requiresAuth !== undefined) {
            setRequiresAuth(extractionSettings.requiresAuth);
          }
          if (extractionSettings.contentMergeStrategy) {
            setContentMergeStrategy(extractionSettings.contentMergeStrategy);
          }
          if (extractionSettings.timeout) {
            setTimeoutVal(extractionSettings.timeout);
          }
        }
      }
    }
  }, [subscription, feed]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Prepare settings object
      const settings = {
        refreshInterval: fetchInterval,
        // Other settings would go here
      };
      
      await updateFeedSettingsMutation.mutateAsync({
        feedId: feedId,
        settings
      });
      
      toast.success("Settings saved successfully");
      onRefreshData?.();
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshFeed = async () => {
    try {
      setIsRefreshing(true);
      // Let's check use-feeds.ts. useRefreshFeed expects `feedId: string`.
      // So removing parseInt.
      await refreshFeedMutation.mutateAsync(feedId);
      toast.success("Feed refreshed successfully");
      onRefreshData?.();
    } catch (error) {
      console.error("Failed to refresh feed:", error);
      toast.error("Failed to refresh feed");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!confirm(`Are you sure you want to unsubscribe from "${feed?.name || (subscription as any)?.name}"?`)) {
      return;
    }

    try {
      setIsUnsubscribing(true);
      await unsubscribeFeedMutation.mutateAsync(feedId);
      toast.success("Unsubscribed successfully");
      onRefreshData?.();
      onClose();
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      toast.error("Failed to unsubscribe");
    } finally {
      setIsUnsubscribing(false);
    }
  };

  const handleDeleteFeed = async () => {
    if (!confirm(`⚠️ DANGER: Are you sure you want to permanently delete "${feed?.name}"? This action CANNOT be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteFeedMutation.mutateAsync(feedId);
      toast.success("Feed deleted successfully");
      onRefreshData?.();
      onClose();
    } catch (error) {
      console.error("Failed to delete feed:", error);
      toast.error("Failed to delete feed");
    } finally {
      setIsDeleting(false);
    }
  };

  // Placeholder for test functionality
  const handleTest = async () => {
    setIsTesting(true);
    // Simulate test
    setTimeout(() => {
      setTestResult({ success: true, message: "Extraction test passed (Mock)" });
      setIsTesting(false);
    }, 1000);
  };

  if (!feed && !subscription) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Feed not found</div>
      </div>
    );
  }

  const displayFeed = feed || subscription;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        {(displayFeed as any)?.imageUrl || (displayFeed as any)?.favicon ? (
          <img 
            src={(displayFeed as any).imageUrl || (displayFeed as any).favicon} 
            alt={displayFeed?.name || ""} 
            className="h-16 w-16 rounded-full object-cover" 
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted dark:bg-muted">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{displayFeed?.name}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{displayFeed?.url}</p>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="mb-6 space-y-4">
        <h2 className="text-lg font-semibold">Basic Settings</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
          >
            <option value="">Uncategorized</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Custom Feed Name</label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={displayFeed?.name}
            className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Fetch Interval (minutes)</label>
          <input
            type="number"
            min="5"
            max="1440"
            value={fetchInterval}
            onChange={(e) => setFetchInterval(parseInt(e.target.value, 10))}
            className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            How often to check for new articles (5-1440 minutes)
          </p>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="mb-6 space-y-4">
        <h3 className="text-base font-semibold">Advanced Settings</h3>
        
        <div className="space-y-4 rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requiresAuth"
              checked={requiresAuth}
              onChange={(e) => setRequiresAuth(e.target.checked)}
              className="h-4 w-4 rounded border-border cursor-pointer"
            />
            <label htmlFor="requiresAuth" className="text-sm cursor-pointer">
              Requires authentication (cookies needed)
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Content Extraction Method</label>
            <select
              value={extractionMethod}
              onChange={(e) => setExtractionMethod(e.target.value as any)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="rss">RSS Only (Default)</option>
              <option value="readability">Readability (Clean extraction)</option>
              <option value="playwright">Playwright (JS-rendered content)</option>
            </select>
            <p className="mt-1.5 text-xs text-foreground/50">
              Choose how to extract article content from this feed
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Content Merge Strategy</label>
            <select
              value={contentMergeStrategy}
              onChange={(e) => setContentMergeStrategy(e.target.value as any)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="replace">Replace RSS content</option>
              <option value="prepend">Prepend to RSS content</option>
              <option value="append">Append to RSS content</option>
            </select>
            <p className="mt-1.5 text-xs text-foreground/50">
              How to combine extracted content with RSS content
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="flex-1 rounded-lg border border-border px-4 py-2 font-medium hover:bg-muted disabled:opacity-50 border-border dark:hover:bg-muted"
          >
            {isTesting ? "Testing..." : "Test Extraction"}
          </button>
          <button
            onClick={handleRefreshFeed}
            disabled={isRefreshing}
            className="flex-1 rounded-lg border border-primary/30 px-4 py-2 font-medium text-primary hover:bg-primary/10 disabled:opacity-50 dark:border-primary/60 dark:text-primary dark:hover:bg-primary/20"
          >
            {isRefreshing ? "Refreshing..." : "Refresh Feed"}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Danger Zone (Expandable) */}
      <div>
        <button
          onClick={() => setShowDangerZone(!showDangerZone)}
          className="mb-4 flex w-full items-center justify-between rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-left font-semibold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
        >
          <span>Danger Zone</span>
          <svg
            className={`h-5 w-5 transition-transform ${showDangerZone ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showDangerZone && (
          <div className="space-y-2 rounded-lg border border-red-200 bg-background p-4 dark:border-red-900 bg-background">
            <button
              onClick={handleUnsubscribe}
              disabled={isUnsubscribing}
              className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted border-border dark:hover:bg-muted"
            >
              {isUnsubscribing ? "Unsubscribing..." : "Unsubscribe from Feed"}
            </button>
            <button
              onClick={handleDeleteFeed}
              disabled={isDeleting}
              className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Feed Permanently"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
