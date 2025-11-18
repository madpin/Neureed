"use client";

import { useState, useEffect } from "react";
import type { UserTheme } from "@prisma/client";

interface ThemeEditorProps {
  theme?: UserTheme;
  onSave: (data: { name: string; description?: string; css: string; isPublic: boolean }) => Promise<void>;
  onClose: () => void;
}

export function ThemeEditor({ theme, onSave, onClose }: ThemeEditorProps) {
  const [name, setName] = useState(theme?.name || "");
  const [description, setDescription] = useState(theme?.description || "");
  const [css, setCSS] = useState(theme?.css || "");
  const [isPublic, setIsPublic] = useState(theme?.isPublic || false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewEnabled, setPreviewEnabled] = useState(false);

  // Apply preview CSS
  useEffect(() => {
    if (!previewEnabled) return;

    const styleTag = document.createElement("style");
    styleTag.id = "theme-preview-css";
    styleTag.textContent = css;
    document.head.appendChild(styleTag);

    return () => {
      const existing = document.getElementById("theme-preview-css");
      if (existing) {
        existing.remove();
      }
    };
  }, [css, previewEnabled]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Theme name is required");
      return;
    }

    if (!css.trim()) {
      setError("CSS content is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        css: css.trim(),
        isPublic,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save theme");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {theme ? "Edit Theme" : "Create Theme"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg
              className="h-6 w-6"
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
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Theme Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Theme Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Theme"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              disabled={theme?.isPreset}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A beautiful theme for reading"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* CSS Editor */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                CSS Content *
              </label>
              <button
                onClick={() => setPreviewEnabled(!previewEnabled)}
                className={`rounded-lg px-3 py-1 text-sm font-medium ${
                  previewEnabled
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                }`}
              >
                {previewEnabled ? "Preview On" : "Preview Off"}
              </button>
            </div>
            <textarea
              value={css}
              onChange={(e) => setCSS(e.target.value)}
              placeholder=":root {&#10;  --background: #ffffff;&#10;  --foreground: #171717;&#10;}"
              className="w-full h-96 rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              spellCheck={false}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Use CSS custom properties (--variable-name) for best results
            </p>
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Make Public
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Allow others to see and clone this theme
              </p>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublic ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || theme?.isPreset}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Theme"}
          </button>
        </div>
      </div>
    </div>
  );
}

