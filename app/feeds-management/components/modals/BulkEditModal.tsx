"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "@/app/components/ui";
import { useCategories } from "@/hooks/queries/use-categories";

interface BulkEditModalProps {
  selectedFeedIds: string[];
  onClose: () => void;
}

/**
 * Bulk Edit Modal
 *
 * Allows users to edit multiple feeds at once.
 * Features:
 * - Change category for multiple feeds
 * - Add/remove tags in bulk
 * - Enable/disable multiple feeds
 * - Apply common settings
 */
export function BulkEditModal({ selectedFeedIds, onClose }: BulkEditModalProps) {
  const { data: categories = [] } = useCategories();
  const [action, setAction] = useState<"category" | "tags" | "enable" | "settings">("category");
  const [newCategory, setNewCategory] = useState("");
  const [tagsAction, setTagsAction] = useState<"add" | "remove" | "replace">("add");
  const [tags, setTags] = useState("");
  const [enableFeeds, setEnableFeeds] = useState(true);

  const handleApply = () => {
    const changes = {
      feedIds: selectedFeedIds,
      action,
      data: {
        category: action === "category" ? newCategory : undefined,
        tags: action === "tags" ? { action: tagsAction, tags: tags.split(",").map(t => t.trim()).filter(Boolean) } : undefined,
        enabled: action === "enable" ? enableFeeds : undefined,
      },
    };
    // TODO: Implement bulk edit logic
    console.log("Applying bulk changes:", changes);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="md">
      <ModalHeader title="Bulk Edit Feeds" onClose={onClose} />
      <ModalBody>
        <div className="space-y-6">
        {/* Selection Summary */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="text-sm font-medium">
            {selectedFeedIds.length} {selectedFeedIds.length === 1 ? "feed" : "feeds"} selected
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Changes will apply to all selected feeds
          </div>
        </div>

        {/* Action Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Action</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setAction("category")}
              className={`p-3 text-sm border rounded transition-colors text-left ${
                action === "category"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="font-medium">Change Category</div>
              <div className="text-xs text-muted-foreground">Move to a different category</div>
            </button>

            <button
              onClick={() => setAction("tags")}
              className={`p-3 text-sm border rounded transition-colors text-left ${
                action === "tags"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="font-medium">Manage Tags</div>
              <div className="text-xs text-muted-foreground">Add, remove, or replace tags</div>
            </button>

            <button
              onClick={() => setAction("enable")}
              className={`p-3 text-sm border rounded transition-colors text-left ${
                action === "enable"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="font-medium">Enable/Disable</div>
              <div className="text-xs text-muted-foreground">Turn feeds on or off</div>
            </button>

            <button
              onClick={() => setAction("settings")}
              className={`p-3 text-sm border rounded transition-colors text-left ${
                action === "settings"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="font-medium">Apply Settings</div>
              <div className="text-xs text-muted-foreground">Set common feed settings</div>
            </button>
          </div>
        </div>

        {/* Action-Specific Options */}
        {action === "category" && (
          <div>
            <label className="block text-sm font-medium mb-2">New Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              All selected feeds will be moved to this category
            </p>
          </div>
        )}

        {action === "tags" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Tag Action</label>
              <select
                value={tagsAction}
                onChange={(e) => setTagsAction(e.target.value as "add" | "remove" | "replace")}
                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="add">Add tags (keep existing)</option>
                <option value="remove">Remove tags</option>
                <option value="replace">Replace all tags</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tech, news, programming"
                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Comma-separated tags
              </p>
            </div>
          </>
        )}

        {action === "enable" && (
          <div>
            <label className="block text-sm font-medium mb-3">Feed Status</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="enable"
                  checked={enableFeeds}
                  onChange={() => setEnableFeeds(true)}
                  className="cursor-pointer"
                />
                <label htmlFor="enable" className="text-sm cursor-pointer">
                  Enable feeds (start fetching articles)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="disable"
                  checked={!enableFeeds}
                  onChange={() => setEnableFeeds(false)}
                  className="cursor-pointer"
                />
                <label htmlFor="disable" className="text-sm cursor-pointer">
                  Disable feeds (pause article fetching)
                </label>
              </div>
            </div>
          </div>
        )}

        {action === "settings" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Refresh Interval (minutes)</label>
              <input
                type="number"
                min="5"
                max="1440"
                defaultValue={30}
                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Articles Per Feed</label>
              <input
                type="number"
                min="10"
                max="1000"
                defaultValue={100}
                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Article Age (days)</label>
              <input
                type="number"
                min="1"
                max="365"
                defaultValue={30}
                className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleApply}>
          Apply Changes
        </Button>
      </ModalFooter>
    </Modal>
  );
}
