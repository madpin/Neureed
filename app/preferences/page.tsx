"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { UserTheme } from "@prisma/client";

interface UserPreferences {
    theme: string;
    fontSize: string;
    articlesPerPage: number;
    defaultView: string;
    showReadArticles: boolean;
    autoMarkAsRead: boolean;
    showRelatedExcerpts: boolean;
    bounceThreshold: number;
    showLowRelevanceArticles: boolean;
    llmProvider: string | null;
    llmModel: string | null;
    llmApiKey: string | null;
    llmBaseUrl: string | null;
}

type TabId = "profile" | "appearance" | "reading" | "learning" | "llm";

interface Tab {
    id: TabId;
    label: string;
    icon: React.ReactNode;
}

export default function PreferencesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabId>("profile");
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [customThemes, setCustomThemes] = useState<UserTheme[]>([]);
    const [activeCustomTheme, setActiveCustomTheme] = useState<UserTheme | null>(null);
    const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);
    const [editingTheme, setEditingTheme] = useState<UserTheme | undefined>();

    const tabs: Tab[] = [
        {
            id: "profile",
            label: "Profile",
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
        },
        {
            id: "appearance",
            label: "Appearance",
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
            ),
        },
        {
            id: "reading",
            label: "Reading",
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
        },
        {
            id: "learning",
            label: "Learning",
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            ),
        },
        {
            id: "llm",
            label: "LLM Settings",
            icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
            ),
        },
    ];

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        } else if (status === "authenticated") {
            loadPreferences();
        }
    }, [status, router]);

    const loadPreferences = async () => {
        setIsLoading(true);
        try {
            const [prefsResponse, themesResponse] = await Promise.all([
                fetch("/api/user/preferences"),
                fetch("/api/user/themes"),
            ]);

            if (prefsResponse.ok) {
                const data = await prefsResponse.json();
                setPreferences(data.data?.preferences || getDefaultPreferences());
            } else {
                setPreferences(getDefaultPreferences());
            }

            if (themesResponse.ok) {
                const data = await themesResponse.json();
                setCustomThemes(data.data?.themes || []);
                setActiveCustomTheme(data.data?.activeTheme || null);
            }
        } catch (error) {
            console.error("Failed to load preferences:", error);
            setPreferences(getDefaultPreferences());
        } finally {
            setIsLoading(false);
        }
    };

    const getDefaultPreferences = (): UserPreferences => ({
        theme: "system",
        fontSize: "medium",
        articlesPerPage: 20,
        defaultView: "expanded",
        showReadArticles: true,
        autoMarkAsRead: false,
        showRelatedExcerpts: false,
        bounceThreshold: 0.25,
        showLowRelevanceArticles: true,
        llmProvider: null,
        llmModel: null,
        llmApiKey: null,
        llmBaseUrl: null,
    });

    const handleSave = async (closeAfter = false) => {
        if (!preferences) return;

        if (!session?.user) {
            setSaveMessage({ type: "error", text: "You must be signed in to save preferences" });
            return;
        }

        setIsSaving(true);
        setSaveMessage(null);

        try {
            const response = await fetch("/api/user/preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(preferences),
            });

            if (response.ok) {
                setSaveMessage({ type: "success", text: "Preferences saved successfully!" });

                // Trigger a custom event to notify ThemeProvider
                window.dispatchEvent(new CustomEvent("preferencesUpdated", { detail: preferences }));

                // Clear success message after 3 seconds
                setTimeout(() => setSaveMessage(null), 3000);

                if (closeAfter) {
                    // Navigate to home page
                    setTimeout(() => router.push("/"), 500);
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save preferences");
            }
        } catch (error) {
            console.error("Failed to save preferences:", error);
            setSaveMessage({
                type: "error",
                text: error instanceof Error ? error.message : "Failed to save preferences. Please try again."
            });
        } finally {
            setIsSaving(false);
        }
    };

    const updatePreference = <K extends keyof UserPreferences>(
        key: K,
        value: UserPreferences[K]
    ) => {
        setPreferences((prev) => (prev ? { ...prev, [key]: value } : null));
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-foreground">
                <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="opacity-70">Loading preferences...</p>
                </div>
            </div>
        );
    }

    if (!session?.user || !preferences) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-7xl px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            Preferences
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Customize your NeuReed experience
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href="/preferences/analytics"
                            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        >
                            Learning Dashboard
                        </Link>
                        <Link
                            href="/"
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>

                {/* Save Message */}
                {saveMessage && (
                    <div
                        className={`mb-6 rounded-lg p-4 ${saveMessage.type === "success"
                                ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                                : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                            }`}
                    >
                        {saveMessage.text}
                    </div>
                )}

                {/* Main Content with Tabs */}
                <div className="flex gap-6">
                    {/* Vertical Tab Navigation */}
                    <div className="w-64 flex-shrink-0">
                        <nav className="space-y-1 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${activeTab === tab.id
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1">
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            {activeTab === "profile" && (
                                <ProfileTab session={session} />
                            )}

                            {activeTab === "appearance" && (
                                <AppearanceTab
                                    preferences={preferences}
                                    updatePreference={updatePreference}
                                    customThemes={customThemes}
                                    activeCustomTheme={activeCustomTheme}
                                    onCreateTheme={() => {
                                        setEditingTheme(undefined);
                                        setIsThemeEditorOpen(true);
                                    }}
                                    onEditTheme={(theme) => {
                                        setEditingTheme(theme);
                                        setIsThemeEditorOpen(true);
                                    }}
                                    onActivateTheme={async (themeId) => {
                                        try {
                                            // Check if it's a built-in theme
                                            if (["light", "dark", "system"].includes(themeId)) {
                                                // Update preferences directly
                                                updatePreference("theme", themeId);
                                                // Clear any active custom theme since we're switching to built-in
                                                setActiveCustomTheme(null);
                                                // Dispatch event to apply theme immediately
                                                window.dispatchEvent(new CustomEvent("preferencesUpdated", {
                                                    detail: { theme: themeId }
                                                }));
                                                setSaveMessage({ type: "success", text: "Theme activated! Click 'Save Preferences' to persist." });
                                            } else {
                                                // It's a custom theme - use the API
                                                const response = await fetch(`/api/user/themes/${themeId}/activate`, {
                                                    method: "POST",
                                                });
                                                if (response.ok) {
                                                    const data = await response.json();
                                                    const activatedTheme = data.data?.theme;
                                                    if (activatedTheme) {
                                                        // Update the active custom theme state
                                                        setActiveCustomTheme(activatedTheme);
                                                        // Dispatch event to apply theme immediately
                                                        window.dispatchEvent(new CustomEvent("preferencesUpdated", {
                                                            detail: {
                                                                activeTheme: {
                                                                    id: activatedTheme.id,
                                                                    css: activatedTheme.css
                                                                }
                                                            }
                                                        }));
                                                        setSaveMessage({ type: "success", text: "Theme activated!" });
                                                    }
                                                }
                                            }
                                        } catch (error) {
                                            console.error("Failed to activate theme:", error);
                                            setSaveMessage({ type: "error", text: "Failed to activate theme" });
                                        }
                                    }}
                                    onDeleteTheme={async (themeId) => {
                                        if (!confirm("Are you sure you want to delete this theme?")) return;
                                        try {
                                            const response = await fetch(`/api/user/themes/${themeId}`, {
                                                method: "DELETE",
                                            });
                                            if (response.ok) {
                                                await loadPreferences();
                                                setSaveMessage({ type: "success", text: "Theme deleted!" });
                                            }
                                        } catch (error) {
                                            console.error("Failed to delete theme:", error);
                                            setSaveMessage({ type: "error", text: "Failed to delete theme" });
                                        }
                                    }}
                                />
                            )}

                            {activeTab === "reading" && (
                                <ReadingTab preferences={preferences} updatePreference={updatePreference} />
                            )}

                            {activeTab === "learning" && (
                                <LearningTab preferences={preferences} updatePreference={updatePreference} />
                            )}

                            {activeTab === "llm" && (
                                <LLMTab preferences={preferences} updatePreference={updatePreference} />
                            )}
                        </div>

                        {/* Save Buttons */}
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => handleSave(false)}
                                disabled={isSaving}
                                className="rounded-lg border border-blue-600 bg-white px-6 py-3 font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:border-blue-500 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700"
                            >
                                {isSaving ? "Saving..." : "Save Preferences"}
                            </button>
                            <button
                                onClick={() => handleSave(true)}
                                disabled={isSaving}
                                className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSaving ? "Saving..." : "Save and Close"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Theme Editor Modal */}
            {isThemeEditorOpen && (
                <ThemeEditorModal
                    theme={editingTheme}
                    onSave={async (data) => {
                        try {
                            if (editingTheme) {
                                const response = await fetch(`/api/user/themes/${editingTheme.id}`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(data),
                                });
                                if (!response.ok) throw new Error("Failed to update theme");
                            } else {
                                const response = await fetch("/api/user/themes", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(data),
                                });
                                if (!response.ok) throw new Error("Failed to create theme");
                            }
                            await loadPreferences();
                            setIsThemeEditorOpen(false);
                            setEditingTheme(undefined);
                            setSaveMessage({ type: "success", text: "Theme saved!" });
                        } catch (error) {
                            console.error("Failed to save theme:", error);
                            setSaveMessage({ type: "error", text: "Failed to save theme" });
                        }
                    }}
                    onClose={() => {
                        setIsThemeEditorOpen(false);
                        setEditingTheme(undefined);
                    }}
                />
            )}
        </div>
    );
}

// Profile Tab Component
function ProfileTab({ session }: { session: any }) {
    return (
        <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Profile
            </h2>
            <div className="flex items-center gap-4">
                {session.user.image ? (
                    <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="h-20 w-20 rounded-full"
                    />
                ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-3xl font-medium text-white">
                        {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                )}
                <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {session.user.name || "User"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {session.user.email}
                    </p>
                </div>
            </div>
        </div>
    );
}

// Appearance Tab Component
function AppearanceTab({
    preferences,
    updatePreference,
    customThemes,
    activeCustomTheme,
    onCreateTheme,
    onEditTheme,
    onActivateTheme,
    onDeleteTheme,
}: {
    preferences: UserPreferences;
    updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
    customThemes: UserTheme[];
    activeCustomTheme: UserTheme | null;
    onCreateTheme: () => void;
    onEditTheme: (theme: UserTheme) => void;
    onActivateTheme: (themeId: string) => void;
    onDeleteTheme: (themeId: string) => void;
}) {
    // Extract colors from CSS for preview
    const extractColors = (css: string): string[] => {
        const colorRegex = /#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/g;
        const matches = css.match(colorRegex) || [];
        return [...new Set(matches)].slice(0, 5); // Get unique colors, max 5
    };

    // Built-in themes
    const builtInThemes = [
        {
            id: "light",
            name: "Light",
            description: "Clean light theme",
            css: `:root { --background: #ffffff; --foreground: #171717; }`,
            isPreset: true,
        },
        {
            id: "dark",
            name: "Dark",
            description: "Dark theme for low-light environments",
            css: `:root.dark { --background: #0a0a0a; --foreground: #ededed; }`,
            isPreset: true,
        },
        {
            id: "system",
            name: "System",
            description: "Follow system preference",
            css: `/* Automatically switches between light and dark based on system settings */`,
            isPreset: true,
        },
    ];

    // Combine built-in and custom themes
    const allThemes = [...builtInThemes, ...customThemes];

    return (
        <div>
            <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Appearance
            </h2>
            <div className="space-y-6">

                {/* Font Size */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Font Size
                    </label>
                    <div className="flex gap-2">
                        <select
                            value={["small", "medium", "large"].includes(preferences.fontSize) ? preferences.fontSize : "custom"}
                            onChange={(e) => {
                                if (e.target.value !== "custom") {
                                    updatePreference("fontSize", e.target.value);
                                }
                            }}
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        >
                            <option value="small">Small (14px)</option>
                            <option value="medium">Medium (16px)</option>
                            <option value="large">Large (18px)</option>
                            <option value="custom">Custom</option>
                        </select>
                        {!["small", "medium", "large"].includes(preferences.fontSize) && (
                            <input
                                type="text"
                                value={preferences.fontSize}
                                onChange={(e) => updatePreference("fontSize", e.target.value)}
                                placeholder="e.g., 20px"
                                className="w-32 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            />
                        )}
                    </div>
                </div>

                {/* Default View */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Default Article View
                    </label>
                    <select
                        value={preferences.defaultView}
                        onChange={(e) => updatePreference("defaultView", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                        <option value="compact">Compact</option>
                        <option value="expanded">Expanded</option>
                    </select>
                </div>

                {/* Themes Section */}
                <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Themes
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Built-in and custom CSS themes
                            </p>
                        </div>
                        <button
                            onClick={onCreateTheme}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Create Theme
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {allThemes.map((theme) => {
                            const colors = extractColors(theme.css);
                            // Check if this theme is active (prioritize active custom themes over built-in preferences)
                            const isActive = activeCustomTheme?.id === theme.id ||
                                (!activeCustomTheme && theme.isPreset && preferences.theme === theme.id);

                            return (
                                <div
                                    key={theme.id}
                                    className={`rounded-lg border p-4 transition-all ${isActive
                                            ? "border-blue-500 bg-blue-50 shadow-md dark:bg-blue-900/20"
                                            : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                                        }`}
                                >
                                    <div className="mb-3 flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {theme.name}
                                                </h4>
                                                {isActive && (
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

                                    {/* Color Palette Preview */}
                                    {colors.length > 0 && (
                                        <div className="mb-3 flex gap-1">
                                            {colors.map((color, idx) => (
                                                <div
                                                    key={idx}
                                                    className="h-8 flex-1 rounded border border-gray-300 dark:border-gray-600"
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* CSS Preview */}
                                    <div className="mb-3 overflow-hidden rounded border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-900">
                                        <code className="block overflow-x-auto p-2 text-xs text-gray-700 dark:text-gray-300">
                                            {theme.css.substring(0, 100)}
                                            {theme.css.length > 100 && "..."}
                                        </code>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {!isActive && (
                                            <button
                                                onClick={() => onActivateTheme(theme.id)}
                                                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                            >
                                                Activate
                                            </button>
                                        )}
                                        {!theme.isPreset && (
                                            <>
                                                <button
                                                    onClick={() => onEditTheme(theme as any)}
                                                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => onDeleteTheme(theme.id)}
                                                    className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Reading Tab Component
function ReadingTab({ preferences, updatePreference }: {
    preferences: UserPreferences;
    updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}) {
    return (
        <div>
            <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Reading Preferences
            </h2>
            <div className="space-y-6">
                {/* Articles Per Page */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Articles Per Page
                    </label>
                    <input
                        type="number"
                        min="5"
                        max="100"
                        value={preferences.articlesPerPage}
                        onChange={(e) => updatePreference("articlesPerPage", parseInt(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                </div>

                {/* Show Read Articles */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Show Read Articles
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Display articles you've already read in the feed
                        </p>
                    </div>
                    <button
                        onClick={() => updatePreference("showReadArticles", !preferences.showReadArticles)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.showReadArticles ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.showReadArticles ? "translate-x-6" : "translate-x-1"
                                }`}
                        />
                    </button>
                </div>

                {/* Auto Mark as Read */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Auto Mark as Read
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Automatically mark articles as read when you open them
                        </p>
                    </div>
                    <button
                        onClick={() => updatePreference("autoMarkAsRead", !preferences.autoMarkAsRead)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.autoMarkAsRead ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.autoMarkAsRead ? "translate-x-6" : "translate-x-1"
                                }`}
                        />
                    </button>
                </div>

                {/* Show Related Article Excerpts */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Show Excerpts in Related Articles
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Display article snippets in the related articles section
                        </p>
                    </div>
                    <button
                        onClick={() => updatePreference("showRelatedExcerpts", !preferences.showRelatedExcerpts)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.showRelatedExcerpts ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.showRelatedExcerpts ? "translate-x-6" : "translate-x-1"
                                }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Learning Tab Component
function LearningTab({ preferences, updatePreference }: {
    preferences: UserPreferences;
    updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}) {
    return (
        <div>
            <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Learning System
            </h2>
            <div className="space-y-6">
                {/* Bounce Threshold */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Bounce Detection Threshold: {Math.round(preferences.bounceThreshold * 100)}%
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="50"
                        step="5"
                        value={preferences.bounceThreshold * 100}
                        onChange={(e) => updatePreference("bounceThreshold", parseInt(e.target.value) / 100)}
                        className="w-full"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        If you leave an article before reading {Math.round(preferences.bounceThreshold * 100)}% of the estimated time,
                        it counts as negative feedback
                    </p>
                </div>

                {/* Show Low Relevance Articles */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Show Low-Relevance Articles
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Display articles with low relevance scores (dimmed) instead of hiding them
                        </p>
                    </div>
                    <button
                        onClick={() => updatePreference("showLowRelevanceArticles", !preferences.showLowRelevanceArticles)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.showLowRelevanceArticles ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.showLowRelevanceArticles ? "translate-x-6" : "translate-x-1"
                                }`}
                        />
                    </button>
                </div>

                {/* Pattern Management */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
                    <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Learned Patterns
                    </h3>
                    <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
                        The system learns from your feedback to personalize article recommendations
                    </p>
                    <button
                        onClick={async () => {
                            if (confirm("Are you sure you want to reset all learned patterns? This cannot be undone.")) {
                                try {
                                    const response = await fetch("/api/user/patterns/reset", {
                                        method: "POST",
                                    });
                                    if (response.ok) {
                                        alert("Patterns reset successfully!");
                                    }
                                } catch (error) {
                                    console.error("Failed to reset patterns:", error);
                                    alert("Failed to reset patterns. Please try again.");
                                }
                            }
                        }}
                        className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        Reset Learning
                    </button>
                </div>
            </div>
        </div>
    );
}

// LLM Tab Component
function LLMTab({ preferences, updatePreference }: {
    preferences: UserPreferences;
    updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}) {
    const [showApiKey, setShowApiKey] = useState(false);

    return (
        <div>
            <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
                LLM Settings
            </h2>
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    Configure your personal LLM settings for article summarization and key points extraction.
                    Leave blank to use system defaults.
                </p>
            </div>
            <div className="space-y-6">
                {/* LLM Provider */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        LLM Provider
                    </label>
                    <select
                        value={preferences.llmProvider || ""}
                        onChange={(e) => updatePreference("llmProvider", e.target.value || null)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                        <option value="">System Default</option>
                        <option value="openai">OpenAI</option>
                        <option value="ollama">Ollama (Local)</option>
                    </select>
                </div>

                {/* LLM Model */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Model
                    </label>
                    <input
                        type="text"
                        value={preferences.llmModel || ""}
                        onChange={(e) => updatePreference("llmModel", e.target.value || null)}
                        placeholder={preferences.llmProvider === "openai" ? "e.g., gpt-4o-mini" : preferences.llmProvider === "ollama" ? "e.g., llama2" : "Use system default"}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {preferences.llmProvider === "openai" && "OpenAI models: gpt-4o-mini, gpt-4o, gpt-3.5-turbo"}
                        {preferences.llmProvider === "ollama" && "Ollama models: llama2, mistral, codellama, etc."}
                        {!preferences.llmProvider && "Select a provider first"}
                    </p>
                </div>

                {/* API Key (OpenAI only) */}
                {preferences.llmProvider === "openai" && (
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            OpenAI API Key
                        </label>
                        <div className="relative">
                            <input
                                type={showApiKey ? "text" : "password"}
                                value={preferences.llmApiKey || ""}
                                onChange={(e) => updatePreference("llmApiKey", e.target.value || null)}
                                placeholder="sk-..."
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-20 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-3 py-1 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                {showApiKey ? "Hide" : "Show"}
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Your API key is encrypted and stored securely
                        </p>
                    </div>
                )}

                {/* Base URL (OpenAI and Ollama) */}
                {(preferences.llmProvider === "openai" || preferences.llmProvider === "ollama") && (
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {preferences.llmProvider === "openai" ? "Base URL (Optional)" : "Ollama Base URL"}
                        </label>
                        <input
                            type="url"
                            value={preferences.llmBaseUrl || ""}
                            onChange={(e) => updatePreference("llmBaseUrl", e.target.value || null)}
                            placeholder={preferences.llmProvider === "openai" ? "https://api.openai.com/v1" : "http://localhost:11434"}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {preferences.llmProvider === "openai"
                                ? "For OpenAI-compatible endpoints (e.g., Azure OpenAI, local proxies). Leave blank for default OpenAI API."
                                : "URL where your Ollama instance is running"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Theme Editor Modal Component
function ThemeEditorModal({
    theme,
    onSave,
    onClose,
}: {
    theme?: UserTheme;
    onSave: (data: { name: string; description?: string; css: string; isPublic: boolean }) => Promise<void>;
    onClose: () => void;
}) {
    const [name, setName] = useState(theme?.name || "");
    const [description, setDescription] = useState(theme?.description || "");
    const [css, setCss] = useState(
        theme?.css ||
        `/* Custom Theme CSS */
:root {
  --primary-color: #3b82f6;
  --background: #ffffff;
  --foreground: #171717;
}

.dark {
  --background: #0a0a0a;
  --foreground: #ededed;
}

/* Add your custom styles here */`
    );
    const [isPublic, setIsPublic] = useState(theme?.isPublic || false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save theme");
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl dark:bg-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {theme ? "Edit Theme" : "Create Theme"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
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
                                placeholder="e.g., Solarized Dark"
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
                                placeholder="A brief description of your theme"
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            />
                        </div>

                        {/* CSS Editor */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                CSS Code *
                            </label>
                            <div className="rounded-lg border border-gray-300 dark:border-gray-600">
                                <textarea
                                    value={css}
                                    onChange={(e) => setCss(e.target.value)}
                                    className="w-full rounded-lg bg-gray-50 p-4 font-mono text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                                    rows={20}
                                    spellCheck={false}
                                    style={{
                                        tabSize: 2,
                                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                                    }}
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Write CSS to customize the appearance. Use CSS variables, classes, and selectors.
                            </p>
                        </div>

                        {/* Public Toggle */}
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Make Public
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Allow others to discover and use your theme
                                </p>
                            </div>
                            <button
                                onClick={() => setIsPublic(!isPublic)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? "translate-x-6" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-gray-200 p-6 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="rounded-lg border border-gray-300 px-6 py-2 font-medium hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSaving ? "Saving..." : "Save Theme"}
                    </button>
                </div>
            </div>
        </div>
    );
}
