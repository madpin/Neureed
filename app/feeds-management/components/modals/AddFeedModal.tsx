"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "@/app/components/ui";
import { useValidateFeed, useAddFeed } from "@/hooks/queries/use-feeds";
import { useCategories } from "@/hooks/queries/use-categories";

interface AddFeedModalProps {
  onClose: () => void;
}

type ExtractionMethod = "rss" | "readability" | "playwright" | "custom";

/**
 * Add Feed Modal
 *
 * Modal for adding a new RSS feed.
 * Features:
 * - URL input with validation
 * - Auto-detection of feed title
 * - Category selection
 * - Extraction method selection
 */
export function AddFeedModal({ onClose }: AddFeedModalProps) {
  const { data: categories = [] } = useCategories();
  const validateMutation = useValidateFeed();
  const addFeedMutation = useAddFeed();

  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [extractionMethod, setExtractionMethod] = useState<ExtractionMethod>("readability");
  const [error, setError] = useState("");
  const [feedInfo, setFeedInfo] = useState<{
    title: string;
    description?: string;
    itemCount: number;
  } | null>(null);

  const handleValidate = async () => {
    if (!url) return;

    setError("");
    setFeedInfo(null);

    try {
      const result = await validateMutation.mutateAsync(url);

      if (result.valid && result.feedInfo) {
        setFeedInfo({
          title: result.feedInfo.title || "",
          description: result.feedInfo.description,
          itemCount: result.feedInfo.itemCount || 0,
        });
        // Auto-fill name if empty
        if (!name && result.feedInfo.title) {
          setName(result.feedInfo.title);
        }
      } else {
        setError(result.error || "Invalid feed URL");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate feed");
    }
  };

  const handleAdd = async () => {
    if (!url.trim()) {
      setError("Feed URL is required");
      return;
    }

    try {
      await addFeedMutation.mutateAsync({
        url: url.trim(),
        name: name.trim() || undefined,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        settings: { method: extractionMethod },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add feed");
      console.error("Add feed error:", err);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="md">
      <ModalHeader title="Add New Feed" onClose={onClose} />
      <ModalBody>
        <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Feed URL <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError("");
                  setFeedInfo(null);
                }}
                placeholder="https://example.com/feed.xml"
                className="flex-1 px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleValidate}
                disabled={!url || validateMutation.isPending}
              >
                {validateMutation.isPending ? "..." : "Validate"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enter the RSS or Atom feed URL
            </p>
          </div>

          {/* Validation Success */}
          {feedInfo && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium text-green-800 dark:text-green-200">
                    Valid feed found!
                  </div>
                  <div className="mt-1 text-xs text-green-700 dark:text-green-300">
                    {feedInfo.title}
                    {feedInfo.description && ` - ${feedInfo.description}`}
                  </div>
                  <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                    {feedInfo.itemCount} items available
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feed Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Feed Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Auto-detected from feed"
              className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to use the feed&apos;s title
            </p>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Categories (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryToggle(category.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedCategoryIds.includes(category.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {category.color && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    {category.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Click to select categories for this feed
              </p>
            </div>
          )}

          {/* Extraction Method */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Extraction Method
            </label>
            <select
              value={extractionMethod}
              onChange={(e) => setExtractionMethod(e.target.value as ExtractionMethod)}
              className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="readability">Readability (Default - Fast)</option>
              <option value="rss">RSS Only (No extraction)</option>
              <option value="playwright">Playwright (JS-rendered content)</option>
              <option value="custom">Custom Selector</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Choose how to extract article content. Readability works for most sites.
            </p>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={addFeedMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleAdd}
          disabled={!url.trim() || addFeedMutation.isPending}
          loading={addFeedMutation.isPending}
        >
          {addFeedMutation.isPending ? "Adding..." : "Add Feed"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
