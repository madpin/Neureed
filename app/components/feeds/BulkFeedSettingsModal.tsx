"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { UserFeed } from "@/hooks/queries/use-feeds";

interface BulkFeedSettingsModalProps {
  selectedFeeds: UserFeed[];
  onClose: () => void;
  onApply: (settings: BulkSettings) => Promise<void>;
}

export interface BulkSettings {
  refreshInterval?: number;
  maxArticlesPerFeed?: number;
  maxArticleAge?: number;
  extractionMethod?: "rss" | "readability" | "playwright";
}

// Default values
const DEFAULTS = {
  refreshInterval: 60,
  maxArticlesPerFeed: 500,
  maxArticleAge: 90,
  extractionMethod: "rss" as const,
};

export function BulkFeedSettingsModal({
  selectedFeeds,
  onClose,
  onApply,
}: BulkFeedSettingsModalProps) {
  // Settings values
  const [refreshInterval, setRefreshInterval] = useState<number>(DEFAULTS.refreshInterval);
  const [maxArticlesPerFeed, setMaxArticlesPerFeed] = useState<number>(DEFAULTS.maxArticlesPerFeed);
  const [maxArticleAge, setMaxArticleAge] = useState<number>(DEFAULTS.maxArticleAge);
  const [extractionMethod, setExtractionMethod] = useState<"rss" | "readability" | "playwright">(DEFAULTS.extractionMethod);

  // Track which fields have been modified
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  const [isApplying, setIsApplying] = useState(false);

  // Helper to mark a field as modified
  const markModified = (field: string) => {
    setModifiedFields(prev => new Set(prev).add(field));
  };

  // Helper to reset a field
  const resetField = (field: keyof typeof DEFAULTS) => {
    switch (field) {
      case "refreshInterval":
        setRefreshInterval(DEFAULTS.refreshInterval);
        break;
      case "maxArticlesPerFeed":
        setMaxArticlesPerFeed(DEFAULTS.maxArticlesPerFeed);
        break;
      case "maxArticleAge":
        setMaxArticleAge(DEFAULTS.maxArticleAge);
        break;
      case "extractionMethod":
        setExtractionMethod(DEFAULTS.extractionMethod);
        break;
    }
    setModifiedFields(prev => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  };

  const handleApply = async () => {
    // Validate at least one field has been modified
    if (modifiedFields.size === 0) {
      toast.error("Please modify at least one setting");
      return;
    }

    // Only include modified fields
    const settings: BulkSettings = {};

    if (modifiedFields.has("refreshInterval")) {
      settings.refreshInterval = refreshInterval;
    }
    if (modifiedFields.has("maxArticlesPerFeed")) {
      settings.maxArticlesPerFeed = maxArticlesPerFeed;
    }
    if (modifiedFields.has("maxArticleAge")) {
      settings.maxArticleAge = maxArticleAge;
    }
    if (modifiedFields.has("extractionMethod")) {
      settings.extractionMethod = extractionMethod;
    }

    try {
      setIsApplying(true);
      await onApply(settings);
      
      // Success message with details
      const changedSettings = Array.from(modifiedFields).join(", ");
      toast.success(
        `Successfully updated ${modifiedFields.size} setting${modifiedFields.size > 1 ? 's' : ''} for ${selectedFeeds.length} feed${selectedFeeds.length > 1 ? 's' : ''}`
      );
      
      onClose();
    } catch (error) {
      console.error("Failed to apply settings:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to apply settings: ${errorMessage}`);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-background border border-border shadow-xl">
        {/* Header */}
        <div className="border-b border-border p-6">
          <h2 className="text-xl font-semibold">Bulk Edit Feed Settings</h2>
          <p className="mt-1 text-sm text-foreground/60">
            Apply settings to {selectedFeeds.length} selected feed{selectedFeeds.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Selected Feeds Preview */}
          <div>
            <h3 className="text-sm font-medium mb-2 text-foreground/70">Selected Feeds</h3>
            <div className="rounded-lg border border-border bg-muted/50 p-3 max-h-28 overflow-y-auto custom-scrollbar">
              <div className="space-y-1.5">
                {selectedFeeds.map((feed) => (
                  <div key={feed.id} className="flex items-center gap-2 text-sm text-foreground/80">
                    {feed.imageUrl ? (
                      <img
                        src={feed.imageUrl}
                        alt=""
                        className="h-4 w-4 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-4 w-4 rounded bg-muted flex-shrink-0" />
                    )}
                    <span className="truncate">{feed.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info message */}
          <div className="rounded-lg bg-accent/5 border border-accent/20 p-3">
            <p className="text-xs text-foreground/70">
              💡 Modify any setting below to mark it for bulk update. Only changed settings will be applied.
            </p>
          </div>

          {/* Settings Form */}
          <div className="space-y-3">
            {/* Fetch Interval */}
            <div className={`rounded-lg border p-3.5 space-y-2.5 transition-colors ${
              modifiedFields.has("refreshInterval") 
                ? "border-primary bg-primary/5" 
                : "border-border bg-background"
            }`}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  Fetch Interval
                  {modifiedFields.has("refreshInterval") && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Will update
                    </span>
                  )}
                </label>
                {modifiedFields.has("refreshInterval") && (
                  <button
                    onClick={() => resetField("refreshInterval")}
                    className="text-xs text-foreground/60 hover:text-foreground transition-colors"
                    title="Reset to default"
                  >
                    Reset
                  </button>
                )}
              </div>
              <input
                type="number"
                min="15"
                max="1440"
                value={refreshInterval}
                onChange={(e) => {
                  setRefreshInterval(parseInt(e.target.value, 10));
                  markModified("refreshInterval");
                }}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-foreground/50">
                Minutes between fetches (15-1440)
              </p>
            </div>

            {/* Max Articles Per Feed */}
            <div className={`rounded-lg border p-3.5 space-y-2.5 transition-colors ${
              modifiedFields.has("maxArticlesPerFeed") 
                ? "border-primary bg-primary/5" 
                : "border-border bg-background"
            }`}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  Max Articles Per Feed
                  {modifiedFields.has("maxArticlesPerFeed") && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Will update
                    </span>
                  )}
                </label>
                {modifiedFields.has("maxArticlesPerFeed") && (
                  <button
                    onClick={() => resetField("maxArticlesPerFeed")}
                    className="text-xs text-foreground/60 hover:text-foreground transition-colors"
                    title="Reset to default"
                  >
                    Reset
                  </button>
                )}
              </div>
              <input
                type="number"
                min="50"
                max="5000"
                value={maxArticlesPerFeed}
                onChange={(e) => {
                  setMaxArticlesPerFeed(parseInt(e.target.value, 10));
                  markModified("maxArticlesPerFeed");
                }}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-foreground/50">
                Maximum number of articles to keep (50-5000)
              </p>
            </div>

            {/* Max Article Age */}
            <div className={`rounded-lg border p-3.5 space-y-2.5 transition-colors ${
              modifiedFields.has("maxArticleAge") 
                ? "border-primary bg-primary/5" 
                : "border-border bg-background"
            }`}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  Max Article Age
                  {modifiedFields.has("maxArticleAge") && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Will update
                    </span>
                  )}
                </label>
                {modifiedFields.has("maxArticleAge") && (
                  <button
                    onClick={() => resetField("maxArticleAge")}
                    className="text-xs text-foreground/60 hover:text-foreground transition-colors"
                    title="Reset to default"
                  >
                    Reset
                  </button>
                )}
              </div>
              <input
                type="number"
                min="1"
                max="365"
                value={maxArticleAge}
                onChange={(e) => {
                  setMaxArticleAge(parseInt(e.target.value, 10));
                  markModified("maxArticleAge");
                }}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-foreground/50">
                Days to keep articles (1-365)
              </p>
            </div>

            {/* Content Extraction Method */}
            <div className={`rounded-lg border p-3.5 space-y-2.5 transition-colors ${
              modifiedFields.has("extractionMethod") 
                ? "border-primary bg-primary/5" 
                : "border-border bg-background"
            }`}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  Content Extraction Method
                  {modifiedFields.has("extractionMethod") && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Will update
                    </span>
                  )}
                </label>
                {modifiedFields.has("extractionMethod") && (
                  <button
                    onClick={() => resetField("extractionMethod")}
                    className="text-xs text-foreground/60 hover:text-foreground transition-colors"
                    title="Reset to default"
                  >
                    Reset
                  </button>
                )}
              </div>
              <select
                value={extractionMethod}
                onChange={(e) => {
                  setExtractionMethod(e.target.value as any);
                  markModified("extractionMethod");
                }}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="rss">RSS Only (Default)</option>
                <option value="readability">Readability (Clean extraction)</option>
                <option value="playwright">Playwright (JS-rendered content)</option>
              </select>
              <div className="rounded bg-muted/50 px-2 py-1.5">
                <p className="text-xs text-foreground/60">
                  ⚠️ This applies system-wide to all users of these feeds
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex items-center justify-between">
          <div className="text-sm text-foreground/60">
            {modifiedFields.size > 0 ? (
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {modifiedFields.size} setting{modifiedFields.size > 1 ? 's' : ''} will be updated
              </span>
            ) : (
              <span>No changes made</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isApplying}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying || modifiedFields.size === 0}
              className="btn btn-primary"
            >
              {isApplying ? "Applying..." : "Apply to Selected"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

