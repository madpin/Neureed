"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "@/app/components/ui";
import { useCategories, useCreateCategory } from "@/hooks/queries/use-categories";

interface CreateCategoryModalProps {
  onClose: () => void;
}

const COLOR_OPTIONS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#64748b", "#6b7280", "#71717a",
];

/**
 * Create Category Modal
 *
 * Quick modal for creating a new category.
 * Features:
 * - Name input with validation
 * - Color picker
 * - Parent category selection (hierarchical)
 * - Description field
 */
export function CreateCategoryModal({ onClose }: CreateCategoryModalProps) {
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    // Validation
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    if (name.trim().length < 2) {
      setError("Category name must be at least 2 characters");
      return;
    }

    try {
      await createCategory.mutateAsync({
        name: name.trim(),
        color,
      });
      onClose();
    } catch (err) {
      setError("Failed to create category. Please try again.");
      console.error("Create category error:", err);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="md">
      <ModalHeader title="Create New Category" onClose={onClose} />
      <ModalBody>
        <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
            <div className="text-sm text-destructive">{error}</div>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Category Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="e.g., Technology, News, Blogs"
            className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <p className="text-xs text-muted-foreground mt-1">
            Choose a descriptive name for your category
          </p>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium mb-2">Category Color</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((colorOption) => (
              <button
                key={colorOption}
                onClick={() => setColor(colorOption)}
                className={`w-8 h-8 rounded-full transition-all ${
                  color === colorOption
                    ? "ring-2 ring-offset-2 ring-primary scale-110"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: colorOption }}
                title={colorOption}
              />
            ))}
          </div>
        </div>

        {/* Parent Category */}
        <div>
          <label className="block text-sm font-medium mb-2">Parent Category</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">None (Top Level)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Create a sub-category by selecting a parent
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional description for this category..."
            className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Preview */}
        {name && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="text-sm font-medium mb-2">Preview</div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm">{name}</span>
              {parentId && (
                <>
                  <span className="text-xs text-muted-foreground">in</span>
                  <span className="text-xs text-muted-foreground">
                    {categories.find(c => c.id === parentId)?.name}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={createCategory.isPending}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleCreate}
          disabled={!name.trim() || createCategory.isPending}
          loading={createCategory.isPending}
        >
          {createCategory.isPending ? "Creating..." : "Create Category"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
