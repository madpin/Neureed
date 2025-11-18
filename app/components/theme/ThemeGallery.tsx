"use client";

import { useState, useEffect } from "react";
import type { UserTheme } from "@prisma/client";

interface ThemeGalleryProps {
  onClose: () => void;
  onClone: (themeId: string, newName?: string) => Promise<void>;
}

export function ThemeGallery({ onClose, onClone }: ThemeGalleryProps) {
  const [themes, setThemes] = useState<UserTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<UserTheme | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    loadPublicThemes();
  }, []);

  const loadPublicThemes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/themes/public");
      if (response.ok) {
        const data = await response.json();
        setThemes(data.data?.themes || []);
      }
    } catch (error) {
      console.error("Failed to load public themes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClone = async (theme: UserTheme) => {
    setIsCloning(true);
    try {
      await onClone(theme.id);
      onClose();
    } catch (error) {
      console.error("Failed to clone theme:", error);
      alert("Failed to clone theme. Please try again.");
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Theme Gallery
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : themes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              className="mb-4 h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              No public themes yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Be the first to share a theme!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {themes.map((theme) => (
              <div
                key={theme.id}
                className="rounded-lg border border-gray-200 p-4 hover:border-blue-500 dark:border-gray-700 dark:hover:border-blue-500"
              >
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {theme.name}
                  </h3>
                  {theme.description && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {theme.description}
                    </p>
                  )}
                </div>

                {/* CSS Preview */}
                <div className="mb-3 rounded border border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700">
                  <code className="text-xs text-gray-700 dark:text-gray-300">
                    {theme.css.substring(0, 100)}
                    {theme.css.length > 100 && "..."}
                  </code>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTheme(theme)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleClone(theme)}
                    disabled={isCloning}
                    className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Clone
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Theme Preview Modal */}
        {selectedTheme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedTheme.name}
                </h3>
                <button
                  onClick={() => setSelectedTheme(null)}
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

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  CSS Content
                </label>
                <pre className="max-h-96 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-600 dark:bg-gray-700">
                  <code className="text-gray-800 dark:text-gray-200">
                    {selectedTheme.css}
                  </code>
                </pre>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedTheme(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleClone(selectedTheme);
                    setSelectedTheme(null);
                  }}
                  disabled={isCloning}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Clone This Theme
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

