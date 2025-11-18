"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Feed } from "@prisma/client";
import { FeedManagementModal } from "./FeedManagementModal";
import { Tooltip } from "../layout/Tooltip";
import { IconPicker } from "./IconPicker";

interface FeedInfo {
  id: string;
  name: string;
  imageUrl: string | null;
  userFeedId: string;
  feedId?: string;
  articleCount?: number;
  unreadCount?: number;
  lastFetched?: Date | string | null;
}

interface CategoryInfo {
  id: string;
  name: string;
  description: string | null;
  icon?: string | null;
  feedCount: number;
  feeds?: FeedInfo[];
}

interface CategoryListProps {
  selectedFeedId?: string;
  selectedCategoryId?: string;
  onSelectFeed?: (feedId: string | null) => void;
  onDeleteFeed: (feedId: string) => void;
  onRefreshFeed: (feedId: string) => void;
  onUnsubscribeFeed: (feedId: string) => void;
  isCollapsed?: boolean;
  onSelectCategory?: (categoryId: string) => void;
  refreshTrigger?: number;
}

export function CategoryList({
  selectedFeedId,
  selectedCategoryId,
  onSelectFeed,
  onDeleteFeed,
  onRefreshFeed,
  onUnsubscribeFeed,
  isCollapsed = false,
  onSelectCategory,
  refreshTrigger,
}: CategoryListProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [uncategorizedFeeds, setUncategorizedFeeds] = useState<FeedInfo[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedFeedId, setExpandedFeedId] = useState<string | null>(null);
  const [managementModalState, setManagementModalState] = useState<{
    isOpen: boolean;
    view?: 'feed' | 'category' | 'overview';
    feedId?: string;
    categoryId?: string;
  }>({ isOpen: false });
  const [categoryActionsId, setCategoryActionsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);
  const [draggedFeedId, setDraggedFeedId] = useState<string | null>(null);
  const [draggedFeedUserFeedId, setDraggedFeedUserFeedId] = useState<string | null>(null);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [iconPickerState, setIconPickerState] = useState<{
    isOpen: boolean;
    categoryId?: string;
    currentIcon?: string;
  }>({ isOpen: false });

  const handleSelectFeed = (feedId: string | null) => {
    if (onSelectFeed) {
      // Use callback if provided
      onSelectFeed(feedId);
    } else {
      // Use router navigation with query params
      if (feedId) {
        router.push(`/?feed=${feedId}`);
      } else {
        router.push("/");
      }
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    // Clear any existing timer
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      // This is a double click - toggle expansion
      toggleCategory(categoryId);
    } else {
      // This is a single click - set timer to select category
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        // Single click - select category
        if (onSelectCategory) {
          onSelectCategory(categoryId);
        } else {
          router.push(`/?categoryId=${categoryId}`);
        }
      }, 250); // 250ms delay for double-click detection
    }
  };

  useEffect(() => {
    loadFeedsGroupedByCategory();
  }, [isCollapsed, refreshTrigger]); // Reload when collapsed state or refresh trigger changes

  // Auto-collapse all categories when sidebar is collapsed
  useEffect(() => {
    if (isCollapsed) {
      setExpandedCategories(new Set());
    }
  }, [isCollapsed]);

  // Cleanup click timer on unmount
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  const loadFeedsGroupedByCategory = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/feeds?groupByCategory=true");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data?.categories || []);
        setUncategorizedFeeds(data.data?.uncategorized || []);
        
        // Initialize expanded state from preferences only if sidebar is not collapsed
        if (!isCollapsed) {
          const prefs = await loadCategoryStates();
          setExpandedCategories(new Set(prefs));
        } else {
          setExpandedCategories(new Set());
        }
      }
    } catch (error) {
      console.error("Failed to load feeds:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryStates = async (): Promise<string[]> => {
    try {
      const response = await fetch("/api/user/preferences");
      if (response.ok) {
        const data = await response.json();
        const categoryStates = data.data?.preferences?.categoryStates || {};
        // Return IDs of expanded categories
        return Object.entries(categoryStates)
          .filter(([_, isExpanded]) => isExpanded)
          .map(([id]) => id);
      }
    } catch (error) {
      console.error("Failed to load category states:", error);
    }
    return [];
  };

  const toggleCategory = async (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);

    // Persist to backend
    await saveCategoryStates(newExpanded);
  };

  const saveCategoryStates = async (expanded: Set<string>) => {
    const categoryStates: Record<string, boolean> = {};
    categories.forEach(cat => {
      categoryStates[cat.id] = expanded.has(cat.id);
    });

    try {
      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryStates }),
      });
    } catch (error) {
      console.error("Failed to save category states:", error);
    }
  };

  const handleToggleFeed = (feedId: string) => {
    setExpandedFeedId(expandedFeedId === feedId ? null : feedId);
  };

  // Category drag handlers
  const handleCategoryDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedCategoryId(categoryId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `category:${categoryId}`);
  };

  const handleCategoryDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    // Only allow category reordering if we're dragging a category
    if (draggedCategoryId) {
      e.dataTransfer.dropEffect = "move";
      setDragOverCategoryId(categoryId);
    }
  };

  const handleCategoryDragLeave = () => {
    setDragOverCategoryId(null);
  };

  const handleCategoryDrop = async (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    setDragOverCategoryId(null);

    // Handle feed drop on category
    if (draggedFeedId && draggedFeedUserFeedId) {
      try {
        const response = await fetch(`/api/user/categories/${targetCategoryId}/feeds`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userFeedId: draggedFeedUserFeedId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to assign feed to category");
        }

        // Reload feeds
        await loadFeedsGroupedByCategory();
      } catch (error) {
        console.error("Failed to assign feed to category:", error);
        alert(error instanceof Error ? error.message : "Failed to assign feed to category");
      }

      setDraggedFeedId(null);
      setDraggedFeedUserFeedId(null);
      return;
    }

    // Handle category reordering
    if (!draggedCategoryId || draggedCategoryId === targetCategoryId) {
      setDraggedCategoryId(null);
      return;
    }

    // Reorder categories
    const newOrder = [...categories];
    const draggedIndex = newOrder.findIndex(c => c.id === draggedCategoryId);
    const targetIndex = newOrder.findIndex(c => c.id === targetCategoryId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedCategoryId(null);
      return;
    }

    // Remove dragged item and insert at target position
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    // Update local state immediately for better UX
    setCategories(newOrder);
    setDraggedCategoryId(null);

    // Persist to backend
    try {
      await fetch("/api/user/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryIds: newOrder.map(c => c.id),
        }),
      });
    } catch (error) {
      console.error("Failed to reorder categories:", error);
      // Reload on error
      loadFeedsGroupedByCategory();
    }
  };

  const handleCategoryDragEnd = () => {
    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
  };

  // Feed drag handlers
  const handleFeedDragStart = (e: React.DragEvent, feedId: string, userFeedId: string) => {
    setDraggedFeedId(feedId);
    setDraggedFeedUserFeedId(userFeedId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `feed:${feedId}`);
  };

  const handleFeedDragEnd = () => {
    setDraggedFeedId(null);
    setDraggedFeedUserFeedId(null);
  };

  const handleRenameCategory = async (categoryId: string, newName: string) => {
    try {
      const response = await fetch(`/api/user/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rename category");
      }

      // Reload categories
      await loadFeedsGroupedByCategory();
    } catch (error) {
      console.error("Failed to rename category:", error);
      alert(error instanceof Error ? error.message : "Failed to rename category");
    }
  };

  const handleUpdateCategoryIcon = async (categoryId: string, icon: string) => {
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

      // Reload categories
      await loadFeedsGroupedByCategory();
    } catch (error) {
      console.error("Failed to update category icon:", error);
      alert(error instanceof Error ? error.message : "Failed to update category icon");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/user/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete category");
      }

      // Reload categories
      await loadFeedsGroupedByCategory();
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert(error instanceof Error ? error.message : "Failed to delete category");
    }
  };

  const renderFeedIcon = (feed: FeedInfo) => {
    if (feed.imageUrl) {
      return (
        <img
          src={feed.imageUrl}
          alt={feed.name}
          className="h-8 w-8 rounded-full object-cover"
        />
      );
    }
    return (
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
    );
  };

  const renderFeed = (feed: FeedInfo) => {
    const isSelected = selectedFeedId === feed.id;

    if (isCollapsed) {
      // Icon-only mode with tooltip
      return (
        <div key={feed.id}>
          <Tooltip content={feed.name}>
            <button
              onClick={() => handleSelectFeed(feed.id)}
              className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${
                isSelected ? "bg-accent/10 text-primary" : "hover:bg-muted"
              }`}
              title={feed.name}
            >
              {renderFeedIcon(feed)}
            </button>
          </Tooltip>
        </div>
      );
    }

    // Full mode
    const isDraggingFeed = draggedFeedId === feed.id;
    
    return (
      <div key={feed.id} className="relative">
        <div
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
            isSelected ? "bg-accent/10 text-primary" : "hover:bg-muted"
          } ${isDraggingFeed ? "opacity-50" : ""}`}
          draggable={true}
          onDragStart={(e) => handleFeedDragStart(e, feed.id, feed.userFeedId)}
          onDragEnd={handleFeedDragEnd}
        >
          <button
            onClick={() => handleSelectFeed(feed.id)}
            className="flex flex-1 items-center gap-3 text-left min-w-0"
          >
            {renderFeedIcon(feed)}
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
            id={`feed-menu-${feed.id}`}
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
          <div className="fixed z-50 mt-1 w-48 rounded-lg border border-border bg-background shadow-lg"
            style={{
              top: `${(document.getElementById(`feed-menu-${feed.id}`)?.getBoundingClientRect().bottom || 0) + 4}px`,
              left: `${(document.getElementById(`feed-menu-${feed.id}`)?.getBoundingClientRect().right || 0) - 192}px`,
            }}
          >
            <button
              onClick={() => {
                onRefreshFeed(feed.id);
                setExpandedFeedId(null);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => {
                setExpandedFeedId(null);
                setManagementModalState({ isOpen: true, view: 'feed', feedId: feed.id });
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to unsubscribe from "${feed.name}"?`)) {
                  onUnsubscribeFeed(feed.id);
                }
                setExpandedFeedId(null);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
              </svg>
              Unsubscribe
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderCategory = (category: CategoryInfo) => {
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategoryId === category.id;

    if (isCollapsed) {
      // Icon-only mode: show category icon with tooltip
      return (
        <div key={category.id}>
          <Tooltip content={`${category.name} (${category.feedCount})`}>
            <button
              onClick={() => handleCategoryClick(category.id)}
              className={`flex h-12 w-12 items-center justify-center rounded-lg hover:bg-muted transition-colors ${
                isSelected ? "bg-accent/10 text-primary" : ""
              }`}
              title={category.name}
            >
              {category.icon ? (
                <span className="text-2xl">{category.icon}</span>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              )}
            </button>
          </Tooltip>
          {/* Show feeds below when expanded */}
          {isExpanded && category.feeds && (
            <div className="mt-1 space-y-1">
              {category.feeds.map(renderFeed)}
            </div>
          )}
        </div>
      );
    }

    // Full mode
    const isDragging = draggedCategoryId === category.id;
    const isDragOver = dragOverCategoryId === category.id;

    return (
      <div key={category.id} className="mb-2">
        <div 
          className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
            isSelected ? "bg-accent/10 text-primary" : "hover:bg-muted"
          } ${isDragging ? "opacity-50" : ""} ${isDragOver || (draggedFeedId && !isDragging) ? "border-2 border-blue-500" : ""}`}
          draggable={true}
          onDragStart={(e) => handleCategoryDragStart(e, category.id)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            // Show drop indicator for both category reordering and feed assignment
            if (draggedCategoryId || draggedFeedId) {
              setDragOverCategoryId(category.id);
            }
          }}
          onDragLeave={handleCategoryDragLeave}
          onDrop={(e) => handleCategoryDrop(e, category.id)}
          onDragEnd={handleCategoryDragEnd}
        >
          {/* Expand/Collapse Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCategory(category.id);
            }}
            onDragStart={(e) => e.stopPropagation()}
            draggable={false}
            className="p-1 hover:bg-muted rounded flex-shrink-0"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <svg
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Category Name - Single click to show feeds in this category, double click to expand */}
          <button
            onClick={() => handleCategoryClick(category.id)}
            onDragStart={(e) => e.stopPropagation()}
            draggable={false}
            className="flex flex-1 items-center gap-2 text-left text-sm font-semibold"
          >
            {category.icon ? (
              <span className="text-lg">{category.icon}</span>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            )}
            <span className="flex-1">{category.name}</span>
            <span className="text-xs text-secondary">{category.feedCount}</span>
          </button>

          {/* Menu Button */}
          <button
            id={`category-menu-${category.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setCategoryActionsId(category.id === categoryActionsId ? null : category.id);
            }}
            onDragStart={(e) => e.stopPropagation()}
            draggable={false}
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

        {/* Category Actions Menu - Same style as feed menu */}
        {categoryActionsId === category.id && (
          <div className="fixed z-50 mt-1 w-48 rounded-lg border border-border bg-background shadow-lg"
            style={{
              top: `${(document.getElementById(`category-menu-${category.id}`)?.getBoundingClientRect().bottom || 0) + 4}px`,
              left: `${(document.getElementById(`category-menu-${category.id}`)?.getBoundingClientRect().right || 0) - 192}px`,
            }}
          >
            <button
              onClick={() => {
                // Open rename dialog
                const newName = prompt(`Rename category "${category.name}":`, category.name);
                if (newName && newName.trim() && newName !== category.name) {
                  handleRenameCategory(category.id, newName.trim());
                }
                setCategoryActionsId(null);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Rename
            </button>
            <button
              onClick={() => {
                setCategoryActionsId(null);
                setIconPickerState({
                  isOpen: true,
                  categoryId: category.id,
                  currentIcon: category.icon || "📁",
                });
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Change Icon
            </button>
            <button
              onClick={() => {
                setCategoryActionsId(null);
                setManagementModalState({ isOpen: true, view: 'category', categoryId: category.id });
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <hr className="my-1 border-border" />
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete the category "${category.name}"?\n\nFeeds in this category will become uncategorized.`)) {
                  handleDeleteCategory(category.id);
                }
                setCategoryActionsId(null);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Category
            </button>
          </div>
        )}

        {isExpanded && category.feeds && (
          <div className="ml-4 mt-1 space-y-1">
            {category.feeds.map(renderFeed)}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-secondary">Loading feeds...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {/* All Articles */}
      {!isCollapsed ? (
        <button
          onClick={() => handleSelectFeed(null)}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
            !selectedFeedId && !selectedCategoryId ? "bg-accent/10 text-primary" : "hover:bg-muted"
          }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-medium">All Articles</div>
          </div>
        </button>
      ) : (
        <div>
          <Tooltip content="All Articles">
            <button
              onClick={() => handleSelectFeed(null)}
              className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${
                !selectedFeedId && !selectedCategoryId ? "bg-accent/10 text-primary" : "hover:bg-muted"
              }`}
              title="All Articles"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
            </button>
          </Tooltip>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="mt-4">
          {!isCollapsed && (
            <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wide text-secondary">
              Categories
            </h3>
          )}
          {categories.map(renderCategory)}
        </div>
      )}

      {/* Uncategorized Feeds */}
      {uncategorizedFeeds.length > 0 && (
        <div className="mt-4">
          {!isCollapsed && (
            <div 
              className={`mb-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-secondary rounded-lg ${
                draggedFeedId && dragOverCategoryId === "uncategorized" ? "border-2 border-blue-500 bg-muted/50" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedFeedId) {
                  e.dataTransfer.dropEffect = "move";
                  setDragOverCategoryId("uncategorized");
                }
              }}
              onDragLeave={() => {
                if (dragOverCategoryId === "uncategorized") {
                  setDragOverCategoryId(null);
                }
              }}
              onDrop={async (e) => {
                e.preventDefault();
                setDragOverCategoryId(null);
                
                if (draggedFeedId && draggedFeedUserFeedId) {
                  // Remove feed from all categories to make it uncategorized
                  try {
                    const response = await fetch(`/api/user/feeds/${draggedFeedUserFeedId}/categories`, {
                      method: "DELETE",
                    });

                    if (!response.ok) {
                      throw new Error("Failed to remove feed from categories");
                    }

                    await loadFeedsGroupedByCategory();
                  } catch (error) {
                    console.error("Failed to remove feed from categories:", error);
                    alert("Failed to remove feed from categories");
                  }

                  setDraggedFeedId(null);
                  setDraggedFeedUserFeedId(null);
                }
              }}
            >
              Uncategorized {draggedFeedId ? "(Drop here to remove from category)" : ""}
            </div>
          )}
          {uncategorizedFeeds.map(renderFeed)}
        </div>
      )}

      {categories.length === 0 && uncategorizedFeeds.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-secondary">
          No feeds yet. Add your first feed to get started!
        </div>
      )}

      {/* Feed Management Modal */}
      {managementModalState.isOpen && (
        <FeedManagementModal
          onClose={() => setManagementModalState({ isOpen: false })}
          initialView={managementModalState.view}
          feedId={managementModalState.feedId}
          categoryId={managementModalState.categoryId}
          onRefreshData={() => loadFeedsGroupedByCategory()}
        />
      )}

      {/* Icon Picker Modal */}
      {iconPickerState.isOpen && iconPickerState.categoryId && (
        <IconPicker
          currentIcon={iconPickerState.currentIcon}
          onSelect={(icon) => {
            handleUpdateCategoryIcon(iconPickerState.categoryId!, icon);
          }}
          onClose={() => setIconPickerState({ isOpen: false })}
        />
      )}
    </div>
  );
}


