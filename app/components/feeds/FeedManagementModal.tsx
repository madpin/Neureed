"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { CookieGuide } from "./CookieGuide";
import { IconPicker } from "./IconPicker";
import { OpmlExportModal } from "./OpmlExportModal";
import { OpmlImportModal } from "./OpmlImportModal";
import { formatSmartDate, formatLocalizedDateTime } from "@/lib/date-utils";

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
  const isNavigatingRef = useRef(false);

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [allFeedsGrouped, setAllFeedsGrouped] = useState<{
    categories: Category[];
    uncategorized: FeedInfo[];
  }>({ categories: [], uncategorized: [] });
  const [statistics, setStatistics] = useState<Statistics>({
    totalCategories: 0,
    totalFeeds: 0,
    totalArticles: 0,
    uncategorizedFeeds: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const formatLastRefresh = (date: Date | string | null | undefined) => {
    if (!date) return "Never";
    return formatSmartDate(date);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load categories
      const categoriesRes = await fetch("/api/user/categories");
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.data?.categories || []);
      }

      // Load feeds grouped by category with full details
      const feedsRes = await fetch("/api/user/feeds?groupByCategory=true");
      if (feedsRes.ok) {
        const data = await feedsRes.json();
        const cats = data.data?.categories || [];
        const uncategorized = data.data?.uncategorized || [];
        
        setAllFeedsGrouped({
          categories: cats,
          uncategorized,
        });
        
        const totalFeeds = cats.reduce((sum: number, cat: Category) => sum + cat.feedCount, 0) + uncategorized.length;
        
        setStatistics({
          totalCategories: cats.length,
          totalFeeds,
          totalArticles: 0, // Would need separate API call
          uncategorizedFeeds: uncategorized.length,
        });
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("/api/user/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create category");
      }

      setNewCategoryName("");
      setNewCategoryDescription("");
      setIsCreating(false);
      await loadData();
      onRefreshData?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?\n\nFeeds in this category will become uncategorized.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/user/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete category");
      }

      await loadData();
      onRefreshData?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  const handleImportSuccess = async () => {
    setShowImportModal(false);
    await loadData();
    onRefreshData?.();
  };

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
              Import feeds from an OPML file.
            </p>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary bg-background px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 dark:border-primary dark:text-primary"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import OPML
            </button>
          </div>
        </div>
      </div>

      {/* Create Category Form */}
      {isCreating && (
        <div className="mb-6 rounded-lg border border-border bg-background p-4 border-border bg-background">
          <h3 className="mb-4 text-lg font-semibold">Create New Category</h3>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}
          <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Category Name *</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Technology, News, Entertainment"
              required
              maxLength={100}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description (optional)</label>
            <textarea
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Brief description of this category"
              maxLength={500}
              rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newCategoryName.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewCategoryName("");
                setNewCategoryDescription("");
                setError(null);
              }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted border-border dark:hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
        </div>
      )}

      {/* All Feeds Overview */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">All Feeds</h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          View all your feeds with their last update times. Click on a feed to configure its settings, or click the gear icon to manage category settings.
        </p>
        
        {statistics.totalFeeds === 0 ? (
          <div className="rounded-lg border border-border bg-muted p-8 text-center border-border dark:bg-background">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No feeds yet. Subscribe to feeds to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Categorized Feeds */}
            {allFeedsGrouped.categories.map((category) => (
              <div key={category.id} className="rounded-lg border border-border bg-background">
                <div className="flex w-full items-center justify-between p-4 hover:bg-muted">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <svg className={`h-4 w-4 transition-transform ${expandedCategories.has(category.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <div>
                      <span className="font-medium">{category.name}</span>
                      <span className="ml-2 text-sm text-gray-500">({category.feedCount} feeds)</span>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToCategory(category.id);
                    }}
                    className="rounded-lg p-2 hover:bg-muted"
                    title="Category Settings"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>

                {expandedCategories.has(category.id) && category.feeds && (
                  <div className="border-t border-border p-2 space-y-1">
                    {category.feeds.map((feed) => (
                      <button
                        key={feed.id}
                        onClick={() => onNavigateToFeed(feed.id)}
                        className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 text-left hover:bg-muted"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {feed.imageUrl ? (
                            <img src={feed.imageUrl} alt={feed.name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{feed.name}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{feed.articleCount || 0} articles</span>
                              <span>•</span>
                              <span title={feed.lastFetched ? formatLocalizedDateTime(feed.lastFetched) : ''}>
                                Last: {formatLastRefresh(feed.lastFetched)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Uncategorized Feeds */}
            {allFeedsGrouped.uncategorized.length > 0 && (
              <div className="rounded-lg border border-border bg-background">
                <div className="p-4 border-b border-border">
                  <span className="font-medium">Uncategorized</span>
                  <span className="ml-2 text-sm text-gray-500">({allFeedsGrouped.uncategorized.length} feeds)</span>
                </div>
                <div className="p-2 space-y-1">
                  {allFeedsGrouped.uncategorized.map((feed) => (
                    <button
                      key={feed.id}
                      onClick={() => onNavigateToFeed(feed.id)}
                      className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 text-left hover:bg-muted"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {feed.imageUrl ? (
                          <img src={feed.imageUrl} alt={feed.name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{feed.name}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{feed.articleCount || 0} articles</span>
                            <span>•</span>
                            <span title={feed.lastFetched ? new Date(feed.lastFetched).toLocaleString() : ''}>
                              Last: {formatLastRefresh(feed.lastFetched)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* OPML Modals */}
      {showExportModal && (
        <OpmlExportModal onClose={() => setShowExportModal(false)} />
      )}
      {showImportModal && (
        <OpmlImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
}

// Category Settings View Component
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
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Add feeds state
  const [addTab, setAddTab] = useState<'existing' | 'new'>('existing');
  const [allFeeds, setAllFeeds] = useState<FeedInfo[]>([]);
  const [selectedFeedToAdd, setSelectedFeedToAdd] = useState("");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [isAddingFeed, setIsAddingFeed] = useState(false);
  
  // Default settings state
  const [defaultExtractionMethod, setDefaultExtractionMethod] = useState("readability");
  const [defaultFetchInterval, setDefaultFetchInterval] = useState(60);
  const [autoApplyToExisting, setAutoApplyToExisting] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Category override settings
  const [categoryRefreshInterval, setCategoryRefreshInterval] = useState<number | null>(null);
  const [categoryMaxArticles, setCategoryMaxArticles] = useState<number | null>(null);
  const [categoryMaxArticleAge, setCategoryMaxArticleAge] = useState<number | null>(null);
  const [isSavingOverrides, setIsSavingOverrides] = useState(false);
  
  // Icon picker state
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  useEffect(() => {
    loadCategory();
    loadAllFeeds();
    loadCategoryOverrides();
  }, [categoryId]);

  const formatLastRefresh = (date: Date | string | null | undefined) => {
    if (!date) return "Never";
    return formatSmartDate(date);
  };

  const loadCategory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/user/categories/${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        const cat = data.data?.category;
        setCategory(cat);
        setEditedName(cat?.name || "");
        setEditedDescription(cat?.description || "");
        
        // Load default settings
        const settings = cat?.settings || {};
        if (settings.extraction) {
          setDefaultExtractionMethod(settings.extraction.method || "readability");
        }
        if (settings.fetchInterval) {
          setDefaultFetchInterval(settings.fetchInterval);
        }
      }
    } catch (err) {
      console.error("Failed to load category:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllFeeds = async () => {
    try {
      const response = await fetch("/api/user/feeds?groupByCategory=true");
      if (response.ok) {
        const data = await response.json();
        const categories = data.data?.categories || [];
        const uncategorized = data.data?.uncategorized || [];
        
        // Get all feeds from all categories and uncategorized
        const allFeedsList: FeedInfo[] = [
          ...uncategorized,
          ...categories.flatMap((cat: Category) => cat.feeds || [])
        ];
        
        setAllFeeds(allFeedsList);
      }
    } catch (err) {
      console.error("Failed to load feeds:", err);
    }
  };

  const loadCategoryOverrides = async () => {
    try {
      const response = await fetch(`/api/user/categories/${categoryId}/settings`);
      if (response.ok) {
        const data = await response.json();
        const settings = data.data?.settings;
        
        setCategoryRefreshInterval(settings?.refreshInterval ?? null);
        setCategoryMaxArticles(settings?.maxArticlesPerFeed ?? null);
        setCategoryMaxArticleAge(settings?.maxArticleAge ?? null);
      }
    } catch (err) {
      console.error("Failed to load category override settings:", err);
    }
  };

  const handleSaveName = async () => {
    setError(null);
    try {
      const response = await fetch(`/api/user/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: editedName.trim(),
          description: editedDescription.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update category");
      }

      setIsEditingName(false);
      await loadCategory();
      onRefreshData?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category");
    }
  };

  const handleUpdateIcon = async (icon: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/user/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icon }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update category icon");
      }

      await loadCategory();
      onRefreshData?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category icon");
    }
  };

  const handleRemoveFeed = async (userFeedId: string, feedName: string) => {
    if (!confirm(`Remove "${feedName}" from this category?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/user/categories/${categoryId}/feeds`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userFeedId }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove feed from category");
      }

      await loadCategory();
      await loadAllFeeds();
      onRefreshData?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove feed");
    }
  };

  const handleAddExistingFeed = async () => {
    if (!selectedFeedToAdd) return;

    setIsAddingFeed(true);
    try {
      const response = await fetch(`/api/user/categories/${categoryId}/feeds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userFeedId: selectedFeedToAdd }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add feed to category");
      }

      setSelectedFeedToAdd("");
      await loadCategory();
      await loadAllFeeds();
      onRefreshData?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add feed");
    } finally {
      setIsAddingFeed(false);
    }
  };

  const handleAddNewFeed = async () => {
    if (!newFeedUrl.trim()) return;

    setIsAddingFeed(true);
    try {
      // First, add the feed
      const addResponse = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newFeedUrl.trim() }),
      });

      if (!addResponse.ok) {
        const data = await addResponse.json();
        throw new Error(data.error || "Failed to add feed");
      }

      const addData = await addResponse.json();
      const newFeedId = addData.data?.feeds?.id;
      
      // Get the user feed ID
      const feedsResponse = await fetch("/api/user/feeds");
      if (feedsResponse.ok) {
        const feedsData = await feedsResponse.json();
        const subscriptions = feedsData.data?.subscriptions || [];
        const subscription = subscriptions.find((sub: any) => sub.feeds.id === newFeedId);
        
        if (subscription) {
          // Then assign it to this category
          await fetch(`/api/user/categories/${categoryId}/feeds`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userFeedId: subscription.id }),
        });
        }
      }

      setNewFeedUrl("");
      await loadCategory();
      await loadAllFeeds();
      onRefreshData?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add new feed");
    } finally {
      setIsAddingFeed(false);
    }
  };

  const handleSaveDefaultSettings = async () => {
    setIsSavingSettings(true);
    setError(null);

    try {
      const settings = {
        extraction: {
          method: defaultExtractionMethod,
        },
        fetchInterval: defaultFetchInterval,
      };

      const response = await fetch(`/api/user/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save settings");
      }

      // TODO: If autoApplyToExisting, update all feeds in this category
      toast.success("Default settings saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveCategoryOverrides = async () => {
    try {
      setIsSavingOverrides(true);
      setError(null);

      const response = await fetch(`/api/user/categories/${categoryId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshInterval: categoryRefreshInterval,
          maxArticlesPerFeed: categoryMaxArticles,
          maxArticleAge: categoryMaxArticleAge,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save category override settings");
      }

      await loadCategoryOverrides();
      onRefreshData?.();
      toast.success("Category override settings saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category override settings");
    } finally {
      setIsSavingOverrides(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!category) return;

    const confirmMessage = category.feedCount > 0
      ? `Are you sure you want to delete the category "${category.name}"?\n\n${category.feedCount} ${category.feedCount === 1 ? 'feed' : 'feeds'} will become uncategorized.`
      : `Are you sure you want to delete the category "${category.name}"?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/user/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete category");
      }

      // Navigate back to overview after successful deletion
      onRefreshData?.();
      onNavigateToOverview();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Category not found</div>
      </div>
    );
  }

  // Get feeds that are not in this category for the "Add Existing" dropdown
  const feedsNotInCategory = allFeeds.filter(
    feed => !category.feeds?.some(catFeed => catFeed.userFeedId === feed.userFeedId)
  );

  return (
    <div className="p-6">
      {/* Header with Category Badge */}
      <div className="mb-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary dark:bg-primary/20">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>Editing Category Settings</span>
        </div>
        
        {isEditingName ? (
          <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
            <div>
              <label className="mb-1 block text-sm font-medium">Category Name</label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveName}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditingName(false);
                  setEditedName(category.name);
                  setEditedDescription(category.description || "");
                  setError(null);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted border-border dark:hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {/* Category Icon */}
              <button
                onClick={() => setIsIconPickerOpen(true)}
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-border text-2xl hover:bg-muted transition-colors"
                title="Change icon"
              >
                {category.icon || "📁"}
              </button>
              
              <div>
                <h1 className="text-2xl font-bold">{category.name}</h1>
                {category.description && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  {category.feedCount} {category.feedCount === 1 ? 'feed' : 'feeds'} in this category
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted border-border dark:hover:bg-muted"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Add Feeds to Category */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold">Add Feeds to Category</h2>
        <div className="rounded-lg border border-border bg-background p-4 border-border bg-background">
        {/* Tabs */}
          <div className="mb-4 flex gap-2 border-b border-border border-border">
          <button
              onClick={() => setAddTab('existing')}
              className={`pb-2 px-4 text-sm font-medium transition-colors ${
                addTab === 'existing'
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Assign Existing
          </button>
          <button
              onClick={() => setAddTab('new')}
              className={`pb-2 px-4 text-sm font-medium transition-colors ${
                addTab === 'new'
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Subscribe New
          </button>
        </div>

        {/* Tab Content */}
          {addTab === 'existing' ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Select Feed</label>
            <select
              value={selectedFeedToAdd}
              onChange={(e) => setSelectedFeedToAdd(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
                >
                  <option value="">Choose a feed...</option>
                  {feedsNotInCategory.map((feed) => (
                    <option key={feed.userFeedId} value={feed.userFeedId}>
                      {feed.name}
                    </option>
              ))}
            </select>
              </div>
            <button
                onClick={handleAddExistingFeed}
                disabled={!selectedFeedToAdd || isAddingFeed}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
                {isAddingFeed ? "Adding..." : "Add to Category"}
            </button>
          </div>
        ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Feed URL</label>
            <input
              type="url"
              value={newFeedUrl}
              onChange={(e) => setNewFeedUrl(e.target.value)}
              placeholder="https://example.com/feed.xml"
                  className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
            />
              </div>
            <button
                onClick={handleAddNewFeed}
                disabled={!newFeedUrl.trim() || isAddingFeed}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
                {isAddingFeed ? "Adding..." : "Subscribe & Add to Category"}
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Default Category Settings */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold">Default Category Settings</h2>
        <div className="rounded-lg border border-border bg-background p-4 border-border bg-background">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            These settings will be used as defaults for all feeds in this category.
            Individual feed settings will override these defaults.
          </p>
          <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Content Extraction Method</label>
          <select
                value={defaultExtractionMethod}
                onChange={(e) => setDefaultExtractionMethod(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
              >
                <option value="rss">RSS Only (Default)</option>
                <option value="readability">Readability (Clean extraction)</option>
            <option value="playwright">Playwright (JS-rendered content)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Feed Refresh Interval (minutes)</label>
          <input
            type="number"
            min="5"
            max="1440"
                value={defaultFetchInterval}
                onChange={(e) => setDefaultFetchInterval(parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoApply"
                checked={autoApplyToExisting}
                onChange={(e) => setAutoApplyToExisting(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="autoApply" className="text-sm">
                Apply to existing feeds in this category
          </label>
        </div>
        <button
              onClick={handleSaveDefaultSettings}
              disabled={isSavingSettings}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
              {isSavingSettings ? "Saving..." : "Save Default Settings"}
        </button>
          </div>
        </div>
      </div>

      {/* Category Override Settings */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold">Category Override Settings</h2>
        <div className="rounded-lg border border-border bg-background p-4 border-border bg-background">
          <div className="rounded-lg bg-blue-50 p-3 mb-4 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Override default refresh and cleanup settings for all feeds in this category. 
              Leave empty to use user defaults. Individual feed settings will override these.
            </p>
          </div>
          
          <div className="space-y-4">
            {/* Refresh Interval Override */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Refresh Interval (minutes)
              </label>
              <input
                type="number"
                min="15"
                max="1440"
                value={categoryRefreshInterval ?? ''}
                onChange={(e) => setCategoryRefreshInterval(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Leave empty to use user default"
                className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                How often to check for new articles (15-1440 minutes)
              </p>
            </div>

            {/* Max Articles Override */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Max Articles Per Feed
              </label>
              <input
                type="number"
                min="50"
                max="5000"
                value={categoryMaxArticles ?? ''}
                onChange={(e) => setCategoryMaxArticles(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Leave empty to use user default"
                className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Maximum number of articles to keep per feed (50-5000)
              </p>
            </div>

            {/* Max Article Age Override */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Max Article Age (days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={categoryMaxArticleAge ?? ''}
                onChange={(e) => setCategoryMaxArticleAge(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Leave empty to use user default"
                className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Articles older than this will be automatically deleted (1-365 days)
              </p>
            </div>

            <button
              onClick={handleSaveCategoryOverrides}
              disabled={isSavingOverrides}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSavingOverrides ? "Saving..." : "Save Override Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* Feeds in Category */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Feeds in Category</h2>
        {category.feeds && category.feeds.length > 0 ? (
          <div className="space-y-2">
            {category.feeds.map((feed) => (
              <div
                key={feed.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-3 border-border bg-background"
              >
                <div className="flex items-center gap-3">
                {feed.imageUrl ? (
                  <img src={feed.imageUrl} alt={feed.name} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted dark:bg-muted">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </div>
                )}
                  <div>
                  <div className="font-medium">{feed.name}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    {feed.articleCount !== undefined && (
                      <span>{feed.articleCount} articles</span>
                    )}
                    {feed.articleCount !== undefined && feed.lastFetched && (
                      <span>•</span>
                    )}
                    {feed.lastFetched && (
                      <span title={formatLocalizedDateTime(feed.lastFetched)}>
                        Last refreshed: {formatLastRefresh(feed.lastFetched)}
                      </span>
                    )}
                  </div>
                </div>
                </div>
                <div className="flex items-center gap-2">
                <button
                    onClick={() => onNavigateToFeed(feed.id)}
                    className="rounded-lg p-2 hover:bg-muted dark:hover:bg-muted"
                    title="Feed Settings"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                    onClick={() => handleRemoveFeed(feed.userFeedId, feed.name)}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  title="Remove from category"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted p-4 text-center text-sm text-gray-600 border-border dark:bg-background dark:text-gray-400">
            No feeds in this category yet. Add feeds using the section above.
          </div>
        )}
      </div>

      {/* Icon Picker Modal */}
      {isIconPickerOpen && (
        <IconPicker
          currentIcon={category.icon || "📁"}
          onSelect={(icon) => {
            handleUpdateIcon(icon);
            setIsIconPickerOpen(false);
          }}
          onClose={() => setIsIconPickerOpen(false)}
        />
      )}
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
  const [feed, setFeed] = useState<FeedDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

  // Basic settings
  const [selectedCategory, setSelectedCategory] = useState("");
  const [extractionMethod, setExtractionMethod] = useState<"rss" | "readability" | "playwright">("rss");
  const [customName, setCustomName] = useState("");
  const [fetchInterval, setFetchInterval] = useState(60);

  // Advanced settings
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [contentMergeStrategy, setContentMergeStrategy] = useState<"replace" | "prepend" | "append">("replace");
  const [cookies, setCookies] = useState("");
  const [headers, setHeaders] = useState("");
  const [customSelector, setCustomSelector] = useState("");
  const [timeout, setTimeout] = useState<number | undefined>(undefined);

  // Categories for dropdown
  const [categories, setCategories] = useState<Category[]>([]);

  // Feed override settings
  const [showOverrideSettings, setShowOverrideSettings] = useState(false);
  const [overrideRefreshInterval, setOverrideRefreshInterval] = useState<number | null>(null);
  const [overrideMaxArticles, setOverrideMaxArticles] = useState<number | null>(null);
  const [overrideMaxArticleAge, setOverrideMaxArticleAge] = useState<number | null>(null);
  const [effectiveSettings, setEffectiveSettings] = useState<any>(null);
  const [isSavingOverrides, setIsSavingOverrides] = useState(false);

  useEffect(() => {
    loadFeed();
    loadCategories();
    loadFeedOverrides();
  }, [feedId]);

  const loadFeed = async () => {
    try {
      setIsLoading(true);
      
      // Load feed details
      const feedResponse = await fetch(`/api/feeds/${feedId}`);
      if (feedResponse.ok) {
        const data = await feedResponse.json();
        const feedData = data.data?.feed;
        setFeed(feedData);
        setCustomName(feedData?.name || "");
        setFetchInterval(feedData?.fetchInterval || 60);
      }

      // Load feed settings
      const settingsResponse = await fetch(`/api/feeds/${feedId}/settings`);
      if (settingsResponse.ok) {
        const data = await settingsResponse.json();
        const settings = data.data?.settings;
        
        if (settings) {
          setExtractionMethod(settings.method || "rss");
          setRequiresAuth(settings.requiresAuth || false);
          setContentMergeStrategy(settings.contentMergeStrategy || "replace");
          setCustomSelector(settings.customSelector || "");
          setTimeout(settings.timeout);
          
          if (settings.cookies?.value) {
            setCookies(settings.cookies.value);
          }
          if (settings.headers) {
            setHeaders(JSON.stringify(settings.headers, null, 2));
          }
        }
      }
    } catch (err) {
      console.error("Failed to load feed:", err);
      setError("Failed to load feed settings");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/user/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data?.categories || []);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const loadFeedOverrides = async () => {
    try {
      const response = await fetch(`/api/user/feeds/${feedId}/settings`);
      if (response.ok) {
        const data = await response.json();
        const settings = data.data;
        
        setOverrideRefreshInterval(settings.overrides?.refreshInterval ?? null);
        setOverrideMaxArticles(settings.overrides?.maxArticlesPerFeed ?? null);
        setOverrideMaxArticleAge(settings.overrides?.maxArticleAge ?? null);
        setEffectiveSettings(settings.effective);
      }
    } catch (err) {
      console.error("Failed to load feed override settings:", err);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const updates: any = {
        method: extractionMethod,
        requiresAuth,
        contentMergeStrategy,
        customSelector,
        timeout,
      };

      if (cookies.trim()) {
        updates.cookies = cookies;
      }

      if (headers.trim()) {
        try {
          updates.headers = JSON.parse(headers);
        } catch {
          setError("Invalid JSON in headers field");
          return;
        }
      }

      const response = await fetch(`/api/feeds/${feedId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      await loadFeed();
      onRefreshData?.();
      toast.success("Settings saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOverrides = async () => {
    try {
      setIsSavingOverrides(true);
      setError(null);

      const response = await fetch(`/api/user/feeds/${feedId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refreshInterval: overrideRefreshInterval,
          maxArticlesPerFeed: overrideMaxArticles,
          maxArticleAge: overrideMaxArticleAge,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save override settings");
      }

      await loadFeedOverrides();
      onRefreshData?.();
      toast.success("Override settings saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save override settings");
    } finally {
      setIsSavingOverrides(false);
    }
  };

  const handleTest = async () => {
    try {
      setIsTesting(true);
      setError(null);
      setTestResult(null);

      const response = await fetch(`/api/feeds/${feedId}/test-extraction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || "Test failed";
        if (errorMsg.includes("No article URL available")) {
          setError("No articles found in this feed yet. Please refresh the feed first, then test extraction.");
        } else {
          setError(errorMsg);
        }
        return;
      }

      setTestResult(data.data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed");
    } finally {
      setIsTesting(false);
    }
  };

  const handleRefreshFeed = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const response = await fetch(`/api/feeds/${feedId}/refresh`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to refresh feed");
      }

      const data = await response.json();
      toast.success(`Feed refreshed! ${data.data.newArticles} new articles, ${data.data.updatedArticles} updated`);
      onRefreshData?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh feed");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteArticles = async () => {
    if (!confirm(`Delete all articles from "${feed?.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(`/api/feeds/${feedId}/delete-articles`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete articles");
      }

      const data = await response.json();
      toast.success(`Deleted ${data.data.count} articles`);
      onRefreshData?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete articles");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!confirm(`Are you sure you want to unsubscribe from "${feed?.name}"?`)) {
      return;
    }

    try {
      const response = await fetch("/api/user/feeds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId }),
      });

      if (!response.ok) {
        throw new Error("Failed to unsubscribe from feed");
      }

      onRefreshData?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unsubscribe");
    }
  };

  const handleDeleteFeed = async () => {
    if (
      !confirm(
        `⚠️ DANGER: Are you sure you want to permanently delete "${feed?.name}"?\n\nThis will:\n• Delete the feed for ALL users\n• Delete ALL articles from this feed\n• This action CANNOT be undone`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/feeds/${feedId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete feed");
      }

      onRefreshData?.();
      onClose();
      toast.success("Feed deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete feed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!feed) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Feed not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        {feed.imageUrl ? (
          <img src={feed.imageUrl} alt={feed.name} className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted dark:bg-muted">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{feed.name}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{feed.url}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

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
          <label className="mb-1 block text-sm font-medium">Content Extraction Method</label>
          <select
            value={extractionMethod}
            onChange={(e) => setExtractionMethod(e.target.value as any)}
            className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
          >
            <option value="rss">RSS Only (Default)</option>
            <option value="readability">Readability (Clean extraction)</option>
            <option value="playwright">Playwright (JS-rendered content)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Choose how to extract content from articles
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Custom Feed Name</label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={feed.name}
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

      {/* Advanced Settings (Expandable) */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mb-4 flex w-full items-center justify-between rounded-lg border border-border bg-muted px-4 py-3 text-left font-semibold hover:bg-muted border-border bg-background dark:hover:bg-muted"
        >
          <span>Advanced Settings</span>
          <svg
            className={`h-5 w-5 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showAdvanced && (
          <div className="space-y-4 rounded-lg border border-border bg-background p-4 border-border bg-background">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requiresAuth"
                checked={requiresAuth}
                onChange={(e) => setRequiresAuth(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="requiresAuth" className="text-sm">
                Requires authentication (cookies needed)
              </label>
            </div>

            {extractionMethod !== "rss" && (
              <div>
                <label className="mb-1 block text-sm font-medium">Content Merge Strategy</label>
                <select
                  value={contentMergeStrategy}
                  onChange={(e) => setContentMergeStrategy(e.target.value as any)}
                  className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
                >
                  <option value="replace">Replace - Use only extracted content</option>
                  <option value="prepend">Prepend - Extracted content first, then RSS</option>
                  <option value="append">Append - RSS content first, then extracted</option>
                </select>
              </div>
            )}

            {requiresAuth && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium">Cookies</label>
                  <button
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {showGuide ? "Hide" : "Show"} Guide
                  </button>
                </div>
                
                {showGuide && (
                  <div className="mb-4">
                    <CookieGuide />
                  </div>
                )}

                <textarea
                  value={cookies}
                  onChange={(e) => setCookies(e.target.value)}
                  placeholder='[{"name": "session", "value": "..."}] or key=value format'
                  rows={4}
                  className="w-full rounded-lg border border-border px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 border-border dark:bg-muted"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Cookies are encrypted before storage
                </p>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Custom Headers (JSON)</label>
              <textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder='{"User-Agent": "...", "Authorization": "..."}'
                rows={3}
                className="w-full rounded-lg border border-border px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 border-border dark:bg-muted"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Custom CSS Selector (optional)</label>
              <input
                type="text"
                value={customSelector}
                onChange={(e) => setCustomSelector(e.target.value)}
                placeholder="article.main-content"
                className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Timeout (seconds)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={timeout || ""}
                onChange={(e) => setTimeout(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                placeholder="30"
                className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
              />
            </div>
          </div>
        )}
      </div>

      {/* Feed Override Settings (Expandable) */}
      <div className="mb-6">
        <button
          onClick={() => setShowOverrideSettings(!showOverrideSettings)}
          className="mb-4 flex w-full items-center justify-between rounded-lg border border-border bg-muted px-4 py-3 text-left font-semibold hover:bg-muted border-border bg-background dark:hover:bg-muted"
        >
          <span>Feed Override Settings</span>
          <svg
            className={`h-5 w-5 transition-transform ${showOverrideSettings ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showOverrideSettings && (
          <div className="space-y-4 rounded-lg border border-border bg-background p-4">
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Override default refresh and cleanup settings for this specific feed. 
                Leave empty to use category or user defaults.
                {effectiveSettings && (
                  <span className="block mt-2 text-xs">
                    Current hierarchy: Feed → Category → User Default
                  </span>
                )}
              </p>
            </div>

            {/* Refresh Interval Override */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Refresh Interval (minutes)
              </label>
              <input
                type="number"
                min="15"
                max="1440"
                value={overrideRefreshInterval ?? ''}
                onChange={(e) => setOverrideRefreshInterval(e.target.value ? parseInt(e.target.value) : null)}
                placeholder={effectiveSettings?.refreshInterval ? `Default: ${effectiveSettings.refreshInterval}` : 'Default: 60'}
                className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
              />
              {effectiveSettings && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Currently using: {effectiveSettings.refreshInterval || 60} minutes 
                  {effectiveSettings.source?.refreshInterval && ` (from ${effectiveSettings.source.refreshInterval})`}
                </p>
              )}
            </div>

            {/* Max Articles Override */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Max Articles Per Feed
              </label>
              <input
                type="number"
                min="50"
                max="5000"
                value={overrideMaxArticles ?? ''}
                onChange={(e) => setOverrideMaxArticles(e.target.value ? parseInt(e.target.value) : null)}
                placeholder={effectiveSettings?.maxArticlesPerFeed ? `Default: ${effectiveSettings.maxArticlesPerFeed}` : 'Default: 500'}
                className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
              />
              {effectiveSettings && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Currently using: {effectiveSettings.maxArticlesPerFeed || 500} articles 
                  {effectiveSettings.source?.maxArticlesPerFeed && ` (from ${effectiveSettings.source.maxArticlesPerFeed})`}
                </p>
              )}
            </div>

            {/* Max Article Age Override */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Max Article Age (days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={overrideMaxArticleAge ?? ''}
                onChange={(e) => setOverrideMaxArticleAge(e.target.value ? parseInt(e.target.value) : null)}
                placeholder={effectiveSettings?.maxArticleAge ? `Default: ${effectiveSettings.maxArticleAge}` : 'Default: 90'}
                className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary border-border dark:bg-muted"
              />
              {effectiveSettings && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Currently using: {effectiveSettings.maxArticleAge || 90} days 
                  {effectiveSettings.source?.maxArticleAge && ` (from ${effectiveSettings.source.maxArticleAge})`}
                </p>
              )}
            </div>

            <button
              onClick={handleSaveOverrides}
              disabled={isSavingOverrides}
              className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSavingOverrides ? "Saving..." : "Save Override Settings"}
            </button>
          </div>
        )}
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`mb-6 rounded-lg p-3 ${testResult.success ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
          <div className="text-sm font-medium mb-2">Test Result</div>
          <div className="text-xs space-y-1">
            <div>Method: {testResult.method}</div>
            <div>Duration: {testResult.duration}ms</div>
            {testResult.title && <div>Title: {testResult.title}</div>}
            {testResult.contentPreview && (
              <div className="mt-2">
                <div className="font-medium mb-1">Content Preview:</div>
                <div className="bg-background bg-background p-2 rounded text-xs max-h-32 overflow-y-auto">
                  {testResult.contentPreview}
                </div>
              </div>
            )}
            {testResult.error && <div className="text-red-600 dark:text-red-400">Error: {testResult.error}</div>}
          </div>
        </div>
      )}

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
          onClick={handleDeleteArticles}
          disabled={isDeleting}
          className="w-full rounded-lg border border-red-300 px-4 py-2 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          {isDeleting ? "Deleting..." : "Delete All Articles"}
        </button>
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
              className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted border-border dark:hover:bg-muted"
            >
              Unsubscribe from Feed
            </button>
            <button
              onClick={handleDeleteFeed}
              className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete Feed Permanently
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

