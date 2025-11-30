"use client";

import { useState } from "react";
import { useFeedNavigation } from "@/hooks/use-feed-navigation";
import { useCategories } from "@/hooks/queries/use-categories";
import { useGroupedFeeds } from "@/hooks/queries/use-feeds";

interface CategoryViewProps {
  categoryId: string;
}

const COLOR_OPTIONS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#64748b", "#6b7280", "#71717a",
];

/**
 * Category View
 *
 * Displays settings for a specific category including:
 * - Icon/color picker
 * - Name and description
 * - Parent category (hierarchical)
 * - Display settings (collapsed, sort order)
 * - Category flags (search, default, read-only)
 * - Bulk actions (mark read, refresh, export)
 * - Feeds in category with quick access
 */
export function CategoryView({ categoryId }: CategoryViewProps) {
  const { navigateToOverview, navigateToFeed } = useFeedNavigation();
  const { data: categories = [] } = useCategories();
  const { data: groupedFeeds } = useGroupedFeeds();

  const category = categories.find(c => c.id === categoryId);
  const categoryFeeds = groupedFeeds?.categories.find(c => c.id === categoryId)?.feeds || [];

  const [selectedColor, setSelectedColor] = useState(category?.color || COLOR_OPTIONS[0]);

  if (!category) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Category not found</p>
          <button
            onClick={navigateToOverview}
            className="mt-4 px-4 py-2 text-sm border border-border rounded hover:bg-muted transition-colors"
          >
            Back to Overview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full"
          style={{ backgroundColor: selectedColor }}
        />
        <div>
          <h2 className="text-xl font-semibold">{category.name}</h2>
          <p className="text-sm text-muted-foreground">
            {categoryFeeds.length} {categoryFeeds.length === 1 ? 'feed' : 'feeds'}
          </p>
        </div>
      </div>

      {/* Organization Section */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Organization</h3>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium mb-2">Category Color</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full transition-all ${
                  selectedColor === color
                    ? "ring-2 ring-offset-2 ring-primary scale-110"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Category Name</label>
          <input
            type="text"
            defaultValue={category.name}
            className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            rows={3}
            placeholder="Optional description for this category"
            className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Helps you remember what this category is for
          </p>
        </div>

        {/* Parent Category */}
        <div>
          <label className="block text-sm font-medium mb-2">Parent Category</label>
          <select
            defaultValue=""
            className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">None (Top Level)</option>
            {categories
              .filter(c => c.id !== categoryId) // Don't allow selecting self as parent
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Organize categories hierarchically
          </p>
        </div>
      </div>

      {/* Display Settings Section */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Display Settings</h3>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium mb-2">Feed Sort Order</label>
          <select className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="manual">Manual (Drag & Drop)</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="recent">Most Recently Updated</option>
            <option value="unread">Most Unread Articles</option>
          </select>
        </div>

        {/* Display Toggles */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="collapsed"
              className="cursor-pointer"
            />
            <label htmlFor="collapsed" className="text-sm cursor-pointer">
              Collapsed by default (hide feeds until expanded)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showDetails"
              defaultChecked
              className="cursor-pointer"
            />
            <label htmlFor="showDetails" className="text-sm cursor-pointer">
              Show feed details (unread count, last update)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showIcon"
              defaultChecked
              className="cursor-pointer"
            />
            <label htmlFor="showIcon" className="text-sm cursor-pointer">
              Show feed icons
            </label>
          </div>
        </div>
      </div>

      {/* Category Flags Section */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Category Flags</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeInSearch"
              defaultChecked
              className="cursor-pointer"
            />
            <label htmlFor="includeInSearch" className="text-sm cursor-pointer">
              Include in search results
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              className="cursor-pointer"
            />
            <label htmlFor="isDefault" className="text-sm cursor-pointer">
              Default category (new feeds assigned here automatically)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isReadOnly"
              className="cursor-pointer"
            />
            <label htmlFor="isReadOnly" className="text-sm cursor-pointer">
              Read-only (prevent modifications)
            </label>
          </div>
        </div>
      </div>

      {/* Feeds in Category Section */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Feeds in Category ({categoryFeeds.length})</h3>
          <button className="px-2 py-1 text-xs border border-border rounded hover:bg-muted transition-colors">
            Add Feeds
          </button>
        </div>

        {categoryFeeds.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No feeds in this category yet
          </div>
        ) : (
          <div className="divide-y divide-border">
            {categoryFeeds.map((feed) => (
              <div
                key={feed.id}
                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-muted-foreground cursor-move">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                  {feed.imageUrl && (
                    <img
                      src={feed.imageUrl}
                      alt={feed.name}
                      className="w-8 h-8 rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{feed.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-md">
                      {feed.url}
                    </div>
                  </div>
                  {feed.unreadCount !== undefined && feed.unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary">
                      {feed.unreadCount} unread
                    </span>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => navigateToFeed(feed.id)}
                    className="px-2 py-1 text-xs border border-border rounded hover:bg-muted transition-colors"
                  >
                    Edit
                  </button>
                  <button className="px-2 py-1 text-xs border border-border rounded hover:bg-muted transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Actions Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Bulk Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors">
            Mark All as Read
          </button>
          <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors">
            Refresh All Feeds
          </button>
          <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors">
            Export Category (OPML)
          </button>
          <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors">
            Move All Feeds
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-destructive bg-card p-6">
        <h3 className="font-medium text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Deleting this category will move all feeds to "Uncategorized". This action cannot be undone.
        </p>
        <button className="px-3 py-1.5 text-sm border border-destructive text-destructive rounded hover:bg-destructive hover:text-destructive-foreground transition-colors">
          Delete Category
        </button>
      </div>
    </div>
  );
}
