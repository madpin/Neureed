"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeEditor } from "@/app/components/theme/ThemeEditor";
import { ThemeGallery } from "@/app/components/theme/ThemeGallery";
import type { UserTheme } from "@prisma/client";

export default function ThemesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [themes, setThemes] = useState<UserTheme[]>([]);
  const [activeTheme, setActiveTheme] = useState<UserTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<UserTheme | undefined>();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      loadThemes();
    }
  }, [status, router]);

  const loadThemes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/themes");
      const data = await response.json();
      setThemes(data.data?.themes || []);
      setActiveTheme(data.data?.activeTheme || null);
    } catch (error) {
      console.error("Failed to load themes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTheme = async (data: {
    name: string;
    description?: string;
    css: string;
    isPublic: boolean;
  }) => {
    const response = await fetch("/api/user/themes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create theme");
    }

    const newTheme = await response.json();
    await loadThemes();
    window.dispatchEvent(
      new CustomEvent("preferencesUpdated", {
        detail: {
          activeTheme: {
            id: newTheme.data?.theme?.id,
            css: newTheme.data?.theme?.css,
          },
        },
      })
    );
  };

  const handleUpdateTheme = async (
    themeId: string,
    data: {
      name: string;
      description?: string;
      css: string;
      isPublic: boolean;
    }
  ) => {
    const response = await fetch(`/api/user/themes/${themeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update theme");
    }

    const updatedTheme = await response.json();
    await loadThemes();
    window.dispatchEvent(
      new CustomEvent("preferencesUpdated", {
        detail: {
          activeTheme: {
            id: updatedTheme.data?.theme?.id,
            css: updatedTheme.data?.theme?.css,
          },
        },
      })
    );
  };

  const handleActivateTheme = async (themeId: string) => {
    try {
      const response = await fetch(`/api/user/themes/${themeId}/activate`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to activate theme");
      }

      await loadThemes();

      // Notify ThemeProvider to reload
      const data = await response.json();
      window.dispatchEvent(
        new CustomEvent("preferencesUpdated", {
          detail: {
            activeTheme: {
              id: data.data?.theme?.id,
              css: data.data?.theme?.css,
            },
          },
        })
      );
    } catch (error) {
      console.error("Failed to activate theme:", error);
      alert("Failed to activate theme");
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!confirm("Are you sure you want to delete this theme?")) {
      return;
    }

    try {
      const response = await fetch(`/api/user/themes/${themeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete theme");
      }

      await loadThemes();
    } catch (error) {
      console.error("Failed to delete theme:", error);
      alert("Failed to delete theme");
    }
  };

  const handleCloneTheme = async (themeId: string, newName?: string) => {
    try {
      const response = await fetch("/api/user/themes/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId, newName }),
      });

      if (!response.ok) {
        throw new Error("Failed to clone theme");
      }

      await loadThemes();
    } catch (error) {
      console.error("Failed to clone theme:", error);
      throw error;
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading themes...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Custom Themes
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create and manage your custom CSS themes
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsGalleryOpen(true)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Browse Gallery
            </button>
            <button
              onClick={() => {
                setEditingTheme(undefined);
                setIsEditorOpen(true);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create Theme
            </button>
            <Link
              href="/preferences"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Back to Preferences
            </Link>
          </div>
        </div>

        {/* Themes List */}
        {themes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
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
              No themes yet
            </h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Create your first custom theme or browse the gallery
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingTheme(undefined);
                  setIsEditorOpen(true);
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create Theme
              </button>
              <button
                onClick={() => setIsGalleryOpen(true)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                Browse Gallery
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {themes.map((theme) => (
              <div
                key={theme.id}
                className={`rounded-lg border p-4 ${
                  theme.id === activeTheme?.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {theme.name}
                      </h3>
                      {theme.isPreset && (
                        <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          Preset
                        </span>
                      )}
                      {theme.id === activeTheme?.id && (
                        <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                          Active
                        </span>
                      )}
                    </div>
                    {theme.description && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {theme.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-3 rounded border border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700">
                  <code className="text-xs text-gray-700 dark:text-gray-300">
                    {theme.css.substring(0, 80)}
                    {theme.css.length > 80 && "..."}
                  </code>
                </div>

                <div className="flex flex-wrap gap-2">
                  {theme.id !== activeTheme?.id && (
                    <button
                      onClick={() => handleActivateTheme(theme.id)}
                      className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Activate
                    </button>
                  )}
                  {!theme.isPreset && (
                    <>
                      <button
                        onClick={() => {
                          setEditingTheme(theme);
                          setIsEditorOpen(true);
                        }}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTheme(theme.id)}
                        className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Theme Editor Modal */}
      {isEditorOpen && (
        <ThemeEditor
          theme={editingTheme}
          onSave={async (data) => {
            if (editingTheme) {
              await handleUpdateTheme(editingTheme.id, data);
            } else {
              await handleCreateTheme(data);
            }
          }}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingTheme(undefined);
          }}
        />
      )}

      {/* Theme Gallery Modal */}
      {isGalleryOpen && (
        <ThemeGallery
          onClose={() => setIsGalleryOpen(false)}
          onClone={handleCloneTheme}
        />
      )}
    </div>
  );
}

