"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    readingPanelEnabled: boolean;
    readingPanelPosition: string;
    readingPanelSize: number;
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
            const response = await fetch("/api/user/preferences");

            if (response.ok) {
                const data = await response.json();
                setPreferences(data.data?.preferences || getDefaultPreferences());
            } else {
                setPreferences(getDefaultPreferences());
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
        readingPanelEnabled: false,
        readingPanelPosition: "right",
        readingPanelSize: 50,
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
}: {
    preferences: UserPreferences;
    updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}) {
    return (
        <div>
            <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Appearance
            </h2>
            <div className="space-y-6">
                {/* Theme Selection */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Theme
                    </label>
                    <select
                        value={preferences.theme}
                        onChange={(e) => {
                            updatePreference("theme", e.target.value);
                            // Apply theme immediately
                            window.dispatchEvent(new CustomEvent("preferencesUpdated", {
                                detail: { theme: e.target.value }
                            }));
                        }}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System (Auto)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        System theme automatically switches between light and dark based on your device settings
                    </p>
                </div>

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

                {/* Reading Panel Section */}
                <div className="border-t border-gray-200 pt-6 mt-6 dark:border-gray-700">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Reading Panel
                    </h3>

                    {/* Enable Reading Panel */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Enable Split-Pane Reading
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                View articles alongside the article list in a resizable panel
                            </p>
                        </div>
                        <button
                            onClick={() => updatePreference("readingPanelEnabled", !preferences.readingPanelEnabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.readingPanelEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.readingPanelEnabled ? "translate-x-6" : "translate-x-1"
                                    }`}
                            />
                        </button>
                    </div>

                    {preferences.readingPanelEnabled && (
                        <>
                            {/* Panel Position */}
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Panel Position
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: "right", label: "Right", icon: "→" },
                                        { value: "left", label: "Left", icon: "←" },
                                        { value: "top", label: "Top", icon: "↑" },
                                        { value: "bottom", label: "Bottom", icon: "↓" },
                                    ].map((pos) => (
                                        <button
                                            key={pos.value}
                                            onClick={() => updatePreference("readingPanelPosition", pos.value)}
                                            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                                                preferences.readingPanelPosition === pos.value
                                                    ? "border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-400"
                                                    : "border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                                            }`}
                                        >
                                            <span className="text-lg">{pos.icon}</span>
                                            {pos.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Panel Size */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Panel Size: {preferences.readingPanelSize}%
                                </label>
                                <input
                                    type="range"
                                    min="30"
                                    max="70"
                                    step="5"
                                    value={preferences.readingPanelSize}
                                    onChange={(e) => updatePreference("readingPanelSize", parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>30%</span>
                                    <span>50%</span>
                                    <span>70%</span>
                                </div>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Adjust how much screen space the reading panel takes up
                                </p>
                            </div>
                        </>
                    )}
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

