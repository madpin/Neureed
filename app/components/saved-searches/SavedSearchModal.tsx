"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { QueryBuilder } from "./QueryBuilder";
import { HelpTooltip } from "./HelpTooltip";
import {
  useCreateSavedSearch,
  useUpdateSavedSearch,
  type SavedSearch,
  type CreateSavedSearchInput,
} from "@/hooks/queries/use-saved-searches";

interface SavedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSearch?: SavedSearch; // If provided, edit mode
  initialQuery?: string; // Pre-fill query when creating new
}

/**
 * Modal for creating or editing saved searches
 */
export function SavedSearchModal({
  isOpen,
  onClose,
  savedSearch,
  initialQuery = "",
}: SavedSearchModalProps) {
  const isEditMode = !!savedSearch;

  // Form state
  const [name, setName] = useState("");
  const [query, setQuery] = useState(initialQuery);
  const [icon, setIcon] = useState("🔍");
  const [threshold, setThreshold] = useState(0.6);
  const [notifyOnMatch, setNotifyOnMatch] = useState(false);
  const [notifyThreshold, setNotifyThreshold] = useState(0.85);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [recencyBias, setRecencyBias] = useState(0.0);

  // Mutations
  const createMutation = useCreateSavedSearch();
  const updateMutation = useUpdateSavedSearch();

  // Popular icons for quick selection
  const popularIcons = ["🔍", "⭐", "📰", "🔥", "💡", "📌", "🎯", "🚀", "💼", "🌐", "📊", "🔔"];

  // Initialize form when saved search changes
  useEffect(() => {
    // Defer setState calls to avoid cascading renders
    const timer = setTimeout(() => {
      if (savedSearch) {
        setName(savedSearch.name);
        setQuery(savedSearch.query);
        setIcon(savedSearch.icon || "🔍");
        setThreshold(savedSearch.threshold);
        setNotifyOnMatch(savedSearch.notifyOnMatch);
        setNotifyThreshold(savedSearch.notifyThreshold);
        setDailyDigest(savedSearch.dailyDigest);
        setRecencyBias(savedSearch.recencyBias);
      } else {
        // Reset for create mode
        setName("");
        setQuery(initialQuery);
        setIcon("🔍");
        setThreshold(0.6);
        setNotifyOnMatch(false);
        setNotifyThreshold(0.85);
        setDailyDigest(false);
        setRecencyBias(0.0);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [savedSearch, initialQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a name for your saved search");
      return;
    }

    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    try {
      if (isEditMode && savedSearch) {
        await updateMutation.mutateAsync({
          id: savedSearch.id,
          input: {
            name: name.trim(),
            query: query.trim(),
            icon,
            threshold,
            notifyOnMatch,
            notifyThreshold,
            dailyDigest,
            recencyBias,
          },
        });
        toast.success(`Updated "${name}"`);
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          query: query.trim(),
          icon,
          threshold,
          notifyOnMatch,
          notifyThreshold,
          dailyDigest,
          recencyBias,
        });
        toast.success(`Created "${name}"`);
      }
      onClose();
    } catch (error) {
      toast.error(
        `Failed to ${isEditMode ? "update" : "create"} saved search: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-lg border-t md:border border-border bg-background shadow-xl transition-transform duration-300 ease-out"
        style={{
          animation: isOpen ? 'slideUp 0.3s ease-out' : 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-muted rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            {isEditMode ? "Edit Saved Search" : "Create Saved Search"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Name and Icon */}
          <div className="grid grid-cols-[auto_1fr] gap-4">
            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Icon
              </label>
              <div className="relative">
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-border bg-background text-2xl hover:bg-muted transition-colors"
                  title="Select icon"
                >
                  {icon}
                </button>
                <div className="absolute top-full left-0 mt-2 z-10 hidden group-hover:block">
                  <div className="rounded-lg border border-border bg-background p-2 shadow-lg grid grid-cols-6 gap-1">
                    {popularIcons.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setIcon(emoji)}
                        className="h-10 w-10 rounded hover:bg-muted text-xl transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="flex-1">
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., AI Ethics News"
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* Query Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">
                Search Query <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-primary hover:underline"
              >
                {showPreview ? "Hide" : "Show"} preview
              </button>
            </div>
            <QueryBuilder
              value={query}
              onChange={setQuery}
              showPreview={showPreview}
              placeholder='e.g., (+AI, +"machine learning") +ethics -chatbot'
            />
          </div>

          {/* Threshold */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label htmlFor="threshold" className="block text-sm font-medium text-foreground">
                Match Threshold: {Math.round(threshold * 100)}%
              </label>
              <HelpTooltip
                content="Only show articles with relevance above this threshold. Lower = more results but less relevant. Higher = fewer but more precise matches."
                position="right"
              />
            </div>
            <input
              id="threshold"
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="mt-1 text-xs text-secondary">
              Only show articles with relevance above this threshold
            </p>
          </div>

          {/* Notifications */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              <HelpTooltip
                content="Get notified when new articles match this search. Choose between real-time alerts or daily digest."
                position="right"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyOnMatch}
                onChange={(e) => setNotifyOnMatch(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-foreground">
                Notify me when new articles match this search
              </span>
            </label>

            {notifyOnMatch && (
              <div className="ml-7 space-y-3">
                <div>
                  <label htmlFor="notifyThreshold" className="block text-xs font-medium text-foreground mb-1">
                    Notification Threshold: {Math.round(notifyThreshold * 100)}%
                  </label>
                  <input
                    id="notifyThreshold"
                    type="range"
                    min="0.7"
                    max="1.0"
                    step="0.05"
                    value={notifyThreshold}
                    onChange={(e) => setNotifyThreshold(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-secondary">
                    Only notify for high-quality matches
                  </p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dailyDigest}
                    onChange={(e) => setDailyDigest(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-xs text-foreground">
                    Send daily digest instead of real-time notifications
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Advanced Settings */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-semibold text-foreground">
                Advanced Settings
              </span>
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
              <div className="mt-4 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                {/* Recency Bias */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label htmlFor="recencyBias" className="block text-sm font-medium text-foreground">
                      Recency Bias: {recencyBias.toFixed(1)}
                    </label>
                    <HelpTooltip
                      content="Control preference for newer articles. 0 = no preference, 1.0 = strong preference for recent content."
                      position="right"
                    />
                  </div>
                  <input
                    id="recencyBias"
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.1"
                    value={recencyBias}
                    onChange={(e) => setRecencyBias(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-secondary">
                    Higher values prioritize newer articles over older ones
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : isEditMode
                ? "Update"
                : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
