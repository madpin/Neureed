"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useSavedSearches,
  useDeleteSavedSearch,
  useRematchSavedSearch,
  type SavedSearch,
} from "@/hooks/queries/use-saved-searches";

interface SavedSearchListProps {
  selectedSearchId?: string;
  onSelectSearch?: (searchId: string | null) => void;
  isCollapsed?: boolean;
  onCloseMobileMenu?: () => void;
  onOpenCreateModal?: () => void;
  onOpenEditModal?: (search: SavedSearch) => void;
  onOpenOnboarding?: () => void;
}

/**
 * List of saved searches for the sidebar
 */
export function SavedSearchList({
  selectedSearchId,
  onSelectSearch,
  isCollapsed = false,
  onCloseMobileMenu,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenOnboarding,
}: SavedSearchListProps) {
  const router = useRouter();
  const [expandedSearchId, setExpandedSearchId] = useState<string | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  // Check if user has seen onboarding
  useEffect(() => {
    const seen = localStorage.getItem('neureed_saved_search_onboarding_seen');
    // Defer setState to avoid cascading renders
    const timer = setTimeout(() => setHasSeenOnboarding(seen === 'true'), 0);
    return () => clearTimeout(timer);
  }, []);

  // Queries
  const { data: savedSearches, isLoading } = useSavedSearches(false);

  // Mutations
  const deleteMutation = useDeleteSavedSearch();
  const rematchMutation = useRematchSavedSearch();

  const handleSelectSearch = (searchId: string | null) => {
    if (onSelectSearch) {
      onSelectSearch(searchId);
    } else {
      if (searchId) {
        router.push(`/?savedSearch=${searchId}`);
      } else {
        router.push("/");
      }
    }
    onCloseMobileMenu?.();
  };

  const handleToggleMenu = (searchId: string) => {
    setExpandedSearchId(expandedSearchId === searchId ? null : searchId);
  };

  const handleEdit = (search: SavedSearch) => {
    onOpenEditModal?.(search);
    setExpandedSearchId(null);
  };

  const handleDelete = async (search: SavedSearch) => {
    if (!confirm(`Are you sure you want to delete "${search.name}"?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(search.id);
      toast.success(`Deleted "${search.name}"`);
      setExpandedSearchId(null);
    } catch (error) {
      toast.error(`Failed to delete saved search: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleRematch = async (search: SavedSearch) => {
    const toastId = toast.loading(`Rematching "${search.name}"...`);

    try {
      const result = await rematchMutation.mutateAsync(search.id);
      toast.success(`Found ${result.newMatches} new matches for "${search.name}"`, { id: toastId });
      setExpandedSearchId(null);
    } catch (error) {
      toast.error(`Failed to rematch: ${error instanceof Error ? error.message : "Unknown error"}`, { id: toastId });
    }
  };

  const handleCreateNew = useCallback(() => {
    onOpenCreateModal?.();
  }, [onOpenCreateModal]);

  const handleStartOnboarding = useCallback(() => {
    onOpenOnboarding?.();
  }, [onOpenOnboarding]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-xs text-secondary">Loading saved searches...</div>
      </div>
    );
  }

  // Show empty state in main content area, simple button in sidebar
  if (!savedSearches || savedSearches.length === 0) {
    // In sidebar: show simple create button
    if (!isCollapsed) {
      return (
        <div className="space-y-2">
          <button
            onClick={handleCreateNew}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-left hover:bg-muted transition-colors"
          >
            <svg className="h-4 w-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm text-secondary">Create saved search</span>
          </button>

          {/* Show onboarding for first-time users */}
          {!hasSeenOnboarding && onOpenOnboarding && (
            <button
              onClick={handleStartOnboarding}
              className="flex w-full items-center gap-2 rounded-lg border border-blue-500/50 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-left hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
            >
              <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-blue-600 dark:text-blue-400">Take tour</span>
            </button>
          )}
        </div>
      );
    }

    // In collapsed mode: just show icon button
    return (
      <div>
        <button
          onClick={handleCreateNew}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-border hover:bg-muted transition-colors"
          title="Create saved search"
        >
          <svg className="h-4 w-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {savedSearches.map((search) => {
        const isSelected = selectedSearchId === search.id;

        if (isCollapsed) {
          // Icon-only mode
          return (
            <div key={search.id} title={search.name}>
              <button
                onClick={() => handleSelectSearch(search.id)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                  isSelected ? "bg-accent/10 text-primary" : "hover:bg-muted"
                }`}
              >
                <span className="text-lg">{search.icon || "🔍"}</span>
              </button>
            </div>
          );
        }

        // Full mode
        return (
          <div key={search.id} className="relative">
            {/* Main content */}
            <div
              className={`relative flex w-full items-center gap-2 rounded-lg px-3 py-1.5 transition-all ${
                isSelected ? "bg-accent/10 text-primary" : "hover:bg-muted"
              }`}
            >
              <button
                onClick={() => handleSelectSearch(search.id)}
                className="flex flex-1 items-center gap-2 text-left min-w-0"
              >
                <span className="text-base">{search.icon || "🔍"}</span>
                <div className="flex-1 min-w-0" style={{ fontSize: 'var(--font-size-sidebar)' }}>
                  <div className="font-normal truncate">{search.name}</div>
                  {search.totalMatches > 0 && (
                    <div className="text-secondary" style={{ fontSize: '0.7em', fontWeight: '300' }}>
                      {search.totalMatches} matches
                    </div>
                  )}
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleMenu(search.id);
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

            {/* Actions Menu */}
            {expandedSearchId === search.id && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-background shadow-lg">
                <button
                  onClick={() => handleRematch(search)}
                  disabled={rematchMutation.isPending}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-muted disabled:opacity-50"
                  style={{ fontSize: 'var(--font-size-sidebar)' }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Rematch
                </button>
                <button
                  onClick={() => handleEdit(search)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-muted"
                  style={{ fontSize: 'var(--font-size-sidebar)' }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(search)}
                  disabled={deleteMutation.isPending}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-muted disabled:opacity-50"
                  style={{ fontSize: 'var(--font-size-sidebar)' }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Add New Button */}
      <button
        onClick={handleCreateNew}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-1.5 text-left hover:bg-muted transition-colors mt-2"
      >
        <svg className="h-4 w-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {!isCollapsed && (
          <span className="text-sm text-secondary" style={{ fontSize: 'var(--font-size-sidebar)' }}>
            New saved search
          </span>
        )}
      </button>
    </div>
  );
}
