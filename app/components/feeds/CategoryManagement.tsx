"use client";

import { useState, useEffect } from "react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  feedCount: number;
}

interface CategoryManagementProps {
  onClose: () => void;
  onCategoryCreated?: () => void;
}

export function CategoryManagement({
  onClose,
  onCategoryCreated,
}: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data?.categories || []);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/user/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create category");
      }

      // Reset form
      setName("");
      setDescription("");
      setIsCreating(false);

      // Reload categories
      await loadCategories();

      // Notify parent
      if (onCategoryCreated) {
        onCategoryCreated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRename = async (category: Category) => {
    const newName = prompt(`Rename category "${category.name}":`, category.name);
    if (!newName || !newName.trim() || newName === category.name) {
      return;
    }

    try {
      const response = await fetch(`/api/user/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rename category");
      }

      await loadCategories();
      if (onCategoryCreated) {
        onCategoryCreated();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to rename category");
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete the category "${category.name}"?\n\nFeeds in this category will become uncategorized.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/user/categories/${category.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete category");
      }

      await loadCategories();
      if (onCategoryCreated) {
        onCategoryCreated();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-background p-6 shadow-lg max-h-[80vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Category Management</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-muted"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {!isCreating && !editingCategory ? (
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-secondary">
                Loading categories...
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-secondary">
                    {categories.length === 0 
                      ? "No categories yet. Create your first category to organize your feeds."
                      : `Manage your ${categories.length} ${categories.length === 1 ? 'category' : 'categories'}`
                    }
                  </p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create
                  </button>
                </div>

                {categories.length > 0 && (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <div>
                            <div className="font-medium">{category.name}</div>
                            {category.description && (
                              <div className="text-xs text-secondary">{category.description}</div>
                            )}
                            <div className="text-xs text-secondary mt-0.5">
                              {category.feedCount} {category.feedCount === 1 ? 'feed' : 'feeds'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRename(category)}
                            className="rounded-lg p-2 hover:bg-muted"
                            title="Rename"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="rounded-lg p-2 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400"
                            title="Delete"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-medium"
              >
                Category Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Technology, News, Entertainment"
                required
                maxLength={100}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-1 block text-sm font-medium"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this category"
                maxLength={500}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Category"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setName("");
                  setDescription("");
                  setError(null);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

interface CategoryActionsMenuProps {
  categoryId: string;
  categoryName: string;
  onClose: () => void;
  onCategoryUpdated?: () => void;
  onCategoryDeleted?: () => void;
}

export function CategoryActionsMenu({
  categoryId,
  categoryName,
  onClose,
  onCategoryUpdated,
  onCategoryDeleted,
}: CategoryActionsMenuProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [newName, setNewName] = useState(categoryName);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/user/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rename category");
      }

      setIsRenaming(false);
      if (onCategoryUpdated) {
        onCategoryUpdated();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete the category "${categoryName}"?\n\nFeeds in this category will become uncategorized.`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/user/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete category");
      }

      if (onCategoryDeleted) {
        onCategoryDeleted();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isRenaming ? "Rename Category" : "Category Actions"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {isRenaming ? (
          <form onSubmit={handleRename} className="space-y-4">
            <div>
              <label htmlFor="newName" className="mb-1 block text-sm font-medium">
                New Name
              </label>
              <input
                id="newName"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                maxLength={100}
                autoFocus
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !newName.trim()}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRenaming(false);
                  setNewName(categoryName);
                  setError(null);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => setIsRenaming(true)}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-muted"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span>Rename Category</span>
            </button>

            <button
              onClick={() => setIsEditingSettings(true)}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-muted"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Category Settings</span>
            </button>

            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>{isSubmitting ? "Deleting..." : "Delete Category"}</span>
            </button>
          </div>
        )}

        {isEditingSettings && (
          <CategorySettingsPanel
            categoryId={categoryId}
            categoryName={categoryName}
            onClose={() => setIsEditingSettings(false)}
            onSaved={() => {
              setIsEditingSettings(false);
              if (onCategoryUpdated) {
                onCategoryUpdated();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

interface CategorySettingsPanelProps {
  categoryId: string;
  categoryName: string;
  onClose: () => void;
  onSaved?: () => void;
}

function CategorySettingsPanel({
  categoryId,
  categoryName,
  onClose,
  onSaved,
}: CategorySettingsPanelProps) {
  const [extractionMethod, setExtractionMethod] = useState<string>("readability");
  const [fetchInterval, setFetchInterval] = useState<number>(60);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCategorySettings();
  }, [categoryId]);

  const loadCategorySettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/user/categories/${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        const settings = data.data?.category?.settings || {};
        if (settings.extraction) {
          setExtractionMethod(settings.extraction.method || "readability");
        }
        if (settings.fetchInterval) {
          setFetchInterval(settings.fetchInterval);
        }
      }
    } catch (err) {
      console.error("Failed to load category settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const settings = {
        extraction: {
          method: extractionMethod,
        },
        fetchInterval,
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

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Settings for "{categoryName}"
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-secondary">
            Loading settings...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <p className="text-sm text-secondary">
              These settings will be used as defaults for all feeds in this category.
              Individual feed settings will override these defaults.
            </p>

            <div>
              <label
                htmlFor="extractionMethod"
                className="mb-1 block text-sm font-medium"
              >
                Content Extraction Method
              </label>
              <select
                id="extractionMethod"
                value={extractionMethod}
                onChange={(e) => setExtractionMethod(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="readability">Readability (default)</option>
                <option value="playwright">Playwright (JavaScript rendering)</option>
              </select>
              <p className="mt-1 text-xs text-secondary">
                Readability is faster, Playwright supports JavaScript-heavy sites
              </p>
            </div>

            <div>
              <label
                htmlFor="fetchInterval"
                className="mb-1 block text-sm font-medium"
              >
                Feed Refresh Interval (minutes)
              </label>
              <input
                id="fetchInterval"
                type="number"
                min="5"
                max="1440"
                value={fetchInterval}
                onChange={(e) => setFetchInterval(parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-secondary">
                How often to check for new articles (5-1440 minutes)
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Settings"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

