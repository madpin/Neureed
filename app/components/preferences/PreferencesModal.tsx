"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { OpmlExportModal } from "@/app/components/feeds/OpmlExportModal";
import { OpmlImportModal } from "@/app/components/feeds/OpmlImportModal";

type ViewType = 'profile' | 'appearance' | 'reading' | 'learning' | 'llm' | 'feeds';

interface PreferencesModalProps {
  onClose: () => void;
  initialView?: ViewType;
}

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
  readingFontFamily?: string;
  readingFontSize?: number;
  readingLineHeight?: number;
  readingParagraphSpacing?: number;
  breakLineSpacing?: number;
  showReadingTime?: boolean;
  defaultRefreshInterval?: number;
  defaultMaxArticlesPerFeed?: number;
  defaultMaxArticleAge?: number;
  infiniteScrollMode?: string;
  searchRecencyWeight?: number;
  searchRecencyDecayDays?: number;
}

export function PreferencesModal({
  onClose,
  initialView = 'profile',
}: PreferencesModalProps) {
  const { data: session } = useSession();
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/preferences");

      if (response.ok) {
        const data = await response.json();
        const loadedPrefs = data.data?.preferences;
        const prefs = {
          ...getDefaultPreferences(),
          ...loadedPrefs,
        };
        setPreferences(prefs);
        setOriginalPreferences(prefs);
      } else {
        const defaultPrefs = getDefaultPreferences();
        setPreferences(defaultPrefs);
        setOriginalPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
      const defaultPrefs = getDefaultPreferences();
      setPreferences(defaultPrefs);
      setOriginalPreferences(defaultPrefs);
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
    searchRecencyWeight: 0.3,
    searchRecencyDecayDays: 30,
    showLowRelevanceArticles: true,
    infiniteScrollMode: "both",
    llmProvider: null,
    llmModel: null,
    llmApiKey: null,
    llmBaseUrl: null,
    readingPanelEnabled: false,
    readingPanelPosition: "right",
    readingPanelSize: 50,
    readingFontFamily: "Georgia",
    readingFontSize: 18,
    readingLineHeight: 1.7,
    readingParagraphSpacing: 1.5,
    breakLineSpacing: 0.75,
    showReadingTime: true,
    defaultRefreshInterval: 60,
    defaultMaxArticlesPerFeed: 500,
    defaultMaxArticleAge: 90,
  });

  const hasUnsavedChanges = () => {
    if (!preferences || !originalPreferences) return false;
    return JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
  };

  const revertChanges = () => {
    if (!originalPreferences) return;
    
    // Revert theme and fontSize if they were changed
    if (preferences?.theme !== originalPreferences.theme) {
      window.dispatchEvent(new CustomEvent("preferencesUpdated", { 
        detail: { theme: originalPreferences.theme } 
      }));
    }
    
    if (preferences?.fontSize !== originalPreferences.fontSize) {
      window.dispatchEvent(new CustomEvent("preferencesUpdated", { 
        detail: { fontSize: originalPreferences.fontSize } 
      }));
    }
  };

  const handleCloseWithHistory = () => {
    if (hasUnsavedChanges()) {
      toast.warning("You have unsaved changes", {
        description: "Are you sure you want to close without saving?",
        action: {
          label: "Close anyway",
          onClick: () => {
            // Revert any immediately-applied changes
            revertChanges();
            
            // Go back through history to remove modal states
            if (window.history.state?.modal === 'preferences') {
              window.history.back();
            }
            onClose();
          },
        },
        cancel: {
          label: "Keep editing",
          onClick: () => {},
        },
      });
      return;
    }
    
    // Go back through history to remove modal states
    if (window.history.state?.modal === 'preferences') {
      window.history.back();
    }
    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      toast.warning("You have unsaved changes", {
        description: "Are you sure you want to close without saving?",
        action: {
          label: "Close anyway",
          onClick: () => {
            // Revert any immediately-applied changes
            revertChanges();
            onClose();
          },
        },
        cancel: {
          label: "Keep editing",
          onClick: () => {},
        },
      });
      return;
    }
    onClose();
  };

  const handleSave = async () => {
    if (!preferences) return;

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
        setOriginalPreferences(preferences);
        window.dispatchEvent(new CustomEvent("preferencesUpdated", { detail: preferences }));
        setTimeout(() => setSaveMessage(null), 3000);
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

  // Navigate to a different view
  const navigateToView = (view: ViewType) => {
    setCurrentView(view);
    
    // Push to browser history
    const state = { 
      modal: 'preferences',
      view
    };
    window.history.pushState(state, '', window.location.href);
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.modal === 'preferences') {
        // Navigate to the state from history
        setCurrentView(event.state.view || 'profile');
      } else {
        // If we're going back beyond the modal, close it
        handleCloseWithHistory();
      }
    };

    // Push initial state
    const initialState = { 
      modal: 'preferences',
      view: initialView
    };
    window.history.pushState(initialState, '', window.location.href);

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [initialView]);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleCloseWithHistory();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [preferences, originalPreferences]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="flex h-[90vh] w-full max-w-6xl items-center justify-center rounded-lg bg-background shadow-xl">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div ref={modalRef} className="flex h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-background shadow-xl">
        {/* Sidebar Navigation */}
        <aside className="w-52 flex-shrink-0 border-r border-border bg-muted">
          <div className="flex h-full flex-col">
            <div className="border-b border-border p-4">
              <h2 className="text-lg font-semibold">Preferences</h2>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-2">
              <button
                onClick={() => navigateToView('profile')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  currentView === 'profile'
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "hover:bg-muted"
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile</span>
              </button>

              <button
                onClick={() => navigateToView('appearance')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  currentView === 'appearance'
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "hover:bg-muted"
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <span>Appearance</span>
              </button>

              <button
                onClick={() => navigateToView('reading')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  currentView === 'reading'
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "hover:bg-muted"
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Reading</span>
              </button>

              <button
                onClick={() => navigateToView('learning')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  currentView === 'learning'
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "hover:bg-muted"
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Learning</span>
              </button>

              <button
                onClick={() => navigateToView('llm')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  currentView === 'llm'
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "hover:bg-muted"
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <span>LLM Settings</span>
              </button>

              <button
                onClick={() => navigateToView('feeds')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  currentView === 'feeds'
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "hover:bg-muted"
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Feeds & OPML</span>
              </button>
            </nav>
            <div className="border-t border-border p-2">
              <button
                onClick={handleCloseWithHistory}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Close</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 p-6">
            {saveMessage && (
              <div
                className={`mb-6 rounded-lg p-4 ${
                  saveMessage.type === "success"
                    ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                    : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                }`}
              >
                {saveMessage.text}
              </div>
            )}

            {currentView === 'profile' && session && (
              <ProfileView session={session} />
            )}
            {currentView === 'appearance' && (
              <AppearanceView preferences={preferences} updatePreference={updatePreference} />
            )}
            {currentView === 'reading' && (
              <ReadingView preferences={preferences} updatePreference={updatePreference} />
            )}
            {currentView === 'learning' && (
              <LearningView preferences={preferences} updatePreference={updatePreference} />
            )}
            {currentView === 'llm' && (
              <LLMView preferences={preferences} updatePreference={updatePreference} />
            )}
            {currentView === 'feeds' && (
              <FeedsView preferences={preferences} updatePreference={updatePreference} />
            )}
          </div>

          {/* Save Button Footer */}
          <div className="border-t border-border bg-background p-4">
            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="rounded-lg border border-border px-6 py-2 font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Profile View Component
function ProfileView({ session }: { session: any }) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Profile</h2>
      <div className="flex items-center gap-4">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="h-20 w-20 rounded-full"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-medium text-primary-foreground">
            {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "U"}
          </div>
        )}
        <div>
          <p className="text-lg font-medium">{session.user.name || "User"}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{session.user.email}</p>
        </div>
      </div>
    </div>
  );
}

// Appearance View Component
function AppearanceView({
  preferences,
  updatePreference,
}: {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Appearance</h2>
      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium">Theme</label>
          <select
            value={preferences.theme}
            onChange={(e) => {
              updatePreference("theme", e.target.value);
              window.dispatchEvent(new CustomEvent("preferencesUpdated", {
                detail: { theme: e.target.value }
              }));
            }}
            className="w-full rounded-lg border border-border bg-muted px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="nord-light">Nord Light</option>
            <option value="nord-dark">Nord Dark</option>
            <option value="solarized-light">Solarized Light</option>
            <option value="solarized-dark">Solarized Dark</option>
            <option value="barbie-light">Barbie Light</option>
            <option value="barbie-dark">Barbie Dark</option>
            <option value="purple-light">Purple Light</option>
            <option value="purple-dark">Purple Dark</option>
            <option value="orange-light">Orange Light</option>
            <option value="orange-dark">Orange Dark</option>
            <option value="rainbow-light">🌈 Rainbow Light</option>
            <option value="rainbow-dark">🌈 Rainbow Dark</option>
            <option value="system">System (Auto)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            System theme automatically switches between light and dark based on your device settings
          </p>
        </div>

        {/* Font Size */}
        <div>
          <label className="mb-2 block text-sm font-medium">Font Size</label>
          <div className="flex gap-2">
            <select
              value={["small", "medium", "large"].includes(preferences.fontSize) ? preferences.fontSize : "custom"}
              onChange={(e) => {
                if (e.target.value !== "custom") {
                  updatePreference("fontSize", e.target.value);
                }
              }}
              className="flex-1 rounded-lg border border-border bg-muted px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-32 rounded-lg border border-border bg-muted px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            )}
          </div>
        </div>

        {/* Default View */}
        <div>
          <label className="mb-2 block text-sm font-medium">Default Article View</label>
          <select
            value={preferences.defaultView}
            onChange={(e) => updatePreference("defaultView", e.target.value)}
            className="w-full rounded-lg border border-border bg-muted px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="compact">Compact</option>
            <option value="expanded">Expanded</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Reading View Component (simplified for brevity - you can expand this with all the reading preferences)
function ReadingView({
  preferences,
  updatePreference,
}: {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Reading Preferences</h2>
      <div className="space-y-6">
        {/* Reading Panel Section */}
        <div className="rounded-lg border border-border bg-muted p-6">
          <h3 className="mb-4 text-lg font-semibold">Reading Panel</h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Enable a split-pane reading panel to read articles without leaving the feed view.
            When disabled, articles will open in their own dedicated page.
          </p>
          
          <div className="space-y-4">
            <ToggleSwitch
              label="Enable Reading Panel"
              description="Show articles in a resizable side panel instead of a separate page"
              checked={preferences.readingPanelEnabled}
              onChange={(checked) => updatePreference("readingPanelEnabled", checked)}
            />

            {preferences.readingPanelEnabled && (
              <>
                {/* Panel Position */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Panel Position</label>
                  <div className="grid grid-cols-2 gap-2">
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
                            ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
                            : "border-border bg-background hover:bg-muted"
                        }`}
                      >
                        <span className="text-lg">{pos.icon}</span>
                        <span>{pos.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Choose where the reading panel appears on your screen
                  </p>
                </div>

                {/* Panel Size */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Default Panel Size: {preferences.readingPanelSize}%
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
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>30%</span>
                    <span>50%</span>
                    <span>70%</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Adjust the default size of the reading panel (can be resized while reading)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Articles Per Page */}
        <div>
          <label className="mb-2 block text-sm font-medium">Articles Per Page</label>
          <input
            type="number"
            min="5"
            max="100"
            value={preferences.articlesPerPage}
            onChange={(e) => updatePreference("articlesPerPage", parseInt(e.target.value))}
            className="w-full rounded-lg border border-border bg-muted px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Infinite Scroll Mode */}
        <div>
          <label className="mb-2 block text-sm font-medium">Infinite Scroll Mode</label>
          <select
            value={preferences.infiniteScrollMode || "both"}
            onChange={(e) => updatePreference("infiniteScrollMode", e.target.value)}
            className="w-full rounded-lg border border-border bg-muted px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="auto">Auto-load (scroll to load more)</option>
            <option value="button">Button only (manual load)</option>
            <option value="both">Both (auto-load + button)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Choose how to load more articles: automatically when scrolling, with a button, or both
          </p>
        </div>

        {/* Toggle Switches */}
        <ToggleSwitch
          label="Show Read Articles"
          description="Display articles you've already read in the feed"
          checked={preferences.showReadArticles}
          onChange={(checked) => updatePreference("showReadArticles", checked)}
        />

        <ToggleSwitch
          label="Auto Mark as Read"
          description="Automatically mark articles as read when you open them"
          checked={preferences.autoMarkAsRead}
          onChange={(checked) => updatePreference("autoMarkAsRead", checked)}
        />

        <ToggleSwitch
          label="Show Excerpts in Related Articles"
          description="Display article snippets in the related articles section"
          checked={preferences.showRelatedExcerpts}
          onChange={(checked) => updatePreference("showRelatedExcerpts", checked)}
        />
      </div>
    </div>
  );
}

// Learning View Component
function LearningView({
  preferences,
  updatePreference,
}: {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Learning System</h2>
      <div className="space-y-6">
        {/* Bounce Threshold */}
        <div>
          <label className="mb-2 block text-sm font-medium">
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

        <ToggleSwitch
          label="Show Low-Relevance Articles"
          description="Display articles with low relevance scores (dimmed) instead of hiding them"
          checked={preferences.showLowRelevanceArticles}
          onChange={(checked) => updatePreference("showLowRelevanceArticles", checked)}
        />

        {/* Search Recency Weight */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Search Recency Weight: {Math.round((preferences.searchRecencyWeight || 0.3) * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={(preferences.searchRecencyWeight || 0.3) * 100}
            onChange={(e) => updatePreference("searchRecencyWeight", parseInt(e.target.value) / 100)}
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            How much to prioritize recent articles in semantic search results. 
            0% = pure semantic similarity, 100% = only recency matters
          </p>
        </div>

        {/* Search Recency Decay Days */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Recency Decay Period: {preferences.searchRecencyDecayDays || 30} days
          </label>
          <input
            type="range"
            min="7"
            max="180"
            step="7"
            value={preferences.searchRecencyDecayDays || 30}
            onChange={(e) => updatePreference("searchRecencyDecayDays", parseInt(e.target.value))}
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            How quickly article recency importance fades. Shorter periods favor very recent articles.
          </p>
        </div>

        {/* Reset Button */}
        <div className="rounded-lg border border-border bg-muted p-4">
          <h3 className="mb-2 text-sm font-semibold">Learned Patterns</h3>
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
                    toast.success("Patterns reset successfully!");
                  }
                } catch (error) {
                  console.error("Failed to reset patterns:", error);
                  toast.error("Failed to reset patterns. Please try again.");
                }
              }
            }}
            className="rounded-lg border border-red-300 bg-background px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Reset Learning
          </button>
        </div>
      </div>
    </div>
  );
}

// LLM View Component
function LLMView({
  preferences,
  updatePreference,
}: {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}) {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">LLM Settings</h2>
      <div className="mb-4 rounded-lg border border-primary/20 bg-primary/10 p-4 dark:border-primary/30 dark:bg-primary/20">
        <p className="text-sm text-primary dark:text-primary">
          Configure your personal LLM settings for article summarization and key points extraction.
          Leave blank to use system defaults.
        </p>
      </div>
      <div className="space-y-6">
        {/* LLM Provider */}
        <div>
          <label className="mb-2 block text-sm font-medium">LLM Provider</label>
          <select
            value={preferences.llmProvider || ""}
            onChange={(e) => updatePreference("llmProvider", e.target.value || null)}
            className="w-full rounded-lg border border-border bg-muted px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">System Default</option>
            <option value="openai">OpenAI</option>
            <option value="ollama">Ollama (Local)</option>
          </select>
        </div>

        {/* LLM Model */}
        <div>
          <label className="mb-2 block text-sm font-medium">Model</label>
          <input
            type="text"
            value={preferences.llmModel || ""}
            onChange={(e) => updatePreference("llmModel", e.target.value || null)}
            placeholder={preferences.llmProvider === "openai" ? "e.g., gpt-4o-mini" : preferences.llmProvider === "ollama" ? "e.g., llama2" : "Use system default"}
            className="w-full rounded-lg border border-border bg-muted px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
            <label className="mb-2 block text-sm font-medium">OpenAI API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={preferences.llmApiKey || ""}
                onChange={(e) => updatePreference("llmApiKey", e.target.value || null)}
                placeholder="sk-..."
                className="w-full rounded-lg border border-border bg-muted px-4 py-2 pr-20 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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

        {/* Base URL */}
        {(preferences.llmProvider === "openai" || preferences.llmProvider === "ollama") && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              {preferences.llmProvider === "openai" ? "Base URL (Optional)" : "Ollama Base URL"}
            </label>
            <input
              type="url"
              value={preferences.llmBaseUrl || ""}
              onChange={(e) => updatePreference("llmBaseUrl", e.target.value || null)}
              placeholder={preferences.llmProvider === "openai" ? "https://api.openai.com/v1" : "http://localhost:11434"}
              className="w-full rounded-lg border border-border bg-muted px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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

// Feeds View Component
function FeedsView({
  preferences,
  updatePreference,
}: {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
}) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [uncategorizedFeeds, setUncategorizedFeeds] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    totalFeeds: number;
    totalCategories: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);
  const [feedSettings, setFeedSettings] = useState<any>({});

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Load feeds grouped by category
      const feedsResponse = await fetch("/api/user/feeds?groupByCategory=true");
      const feedsData = await feedsResponse.json();
      
      const cats = feedsData.data?.categories || [];
      const uncat = feedsData.data?.uncategorized || [];
      
      setCategories(cats);
      setUncategorizedFeeds(uncat);
      
      // Expand all categories by default
      setExpandedCategories(new Set(cats.map((c: any) => c.id)));

      setStats({
        totalFeeds: cats.reduce((sum: number, cat: any) => sum + cat.feedCount, 0) + uncat.length,
        totalCategories: cats.length,
      });
    } catch (error) {
      console.error("Failed to load feeds:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportSuccess = () => {
    loadAllData();
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const formatLastRefresh = (date: Date | string | null | undefined) => {
    if (!date) return "Never";
    
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const loadFeedSettings = async (feedId: string) => {
    try {
      const response = await fetch(`/api/user/feeds/${feedId}/settings`);
      if (response.ok) {
        const data = await response.json();
        setFeedSettings((prev: any) => ({
          ...prev,
          [feedId]: data.data,
        }));
      }
    } catch (error) {
      console.error("Failed to load feed settings:", error);
    }
  };

  const toggleFeedSettings = (feedId: string) => {
    if (editingFeedId === feedId) {
      setEditingFeedId(null);
    } else {
      setEditingFeedId(feedId);
      if (!feedSettings[feedId]) {
        loadFeedSettings(feedId);
      }
    }
  };

  const updateFeedSetting = async (feedId: string, key: string, value: number | null) => {
    try {
      const response = await fetch(`/api/user/feeds/${feedId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (response.ok) {
        const data = await response.json();
        setFeedSettings((prev: any) => ({
          ...prev,
          [feedId]: data.data,
        }));
      }
    } catch (error) {
      console.error("Failed to update feed settings:", error);
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Feeds & OPML Management</h2>
      <div className="space-y-6">
        {/* Info Section */}
        <div className="rounded-lg bg-primary/10 p-4 dark:bg-primary/20">
          <h3 className="mb-2 font-semibold text-primary dark:text-primary">
            What is OPML?
          </h3>
          <p className="text-sm text-primary/80 dark:text-primary/90">
            OPML (Outline Processor Markup Language) is a standard format for exchanging lists of RSS feeds.
            Use it to backup your feeds or transfer them between applications.
          </p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-muted p-4">
              <div className="text-3xl font-bold text-primary dark:text-primary">
                {stats.totalFeeds}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Subscribed Feeds
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted p-4">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalCategories}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Categories
              </div>
            </div>
          </div>
        ) : null}

        {/* Export Section */}
        <div className="rounded-lg border border-border p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-semibold">Export Feeds</h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Download your feed subscriptions as an OPML file. You can select specific
                categories or individual feeds to export.
              </p>
            </div>
            <button
              onClick={() => setShowExportModal(true)}
              disabled={loading || !stats || stats.totalFeeds === 0}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Export OPML
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="rounded-lg border border-border p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-semibold">Import Feeds</h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Import feeds from an OPML file. New feeds will be created automatically,
                and you'll be subscribed to all imported feeds. Categories will be created if needed.
              </p>
            </div>
            <button
              onClick={() => setShowImportModal(true)}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-primary bg-background px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50 dark:border-primary dark:text-primary"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import OPML
            </button>
          </div>
        </div>
      </div>

      {/* All Feeds List */}
      {!loading && (
        <div className="rounded-lg border border-border p-6 mt-6">
          <h3 className="mb-4 text-lg font-semibold">All Feeds</h3>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            View and manage settings for all your subscribed feeds. Click on a feed to configure its refresh interval and cleanup settings.
          </p>

          <div className="space-y-4">
            {/* Categories */}
            {categories.map((category) => (
              <div key={category.id} className="rounded-lg border border-border bg-background">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <svg className={`h-4 w-4 transition-transform ${expandedCategories.has(category.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-gray-500">({category.feedCount} feeds)</span>
                  </div>
                </button>

                {expandedCategories.has(category.id) && category.feeds && (
                  <div className="border-t border-border p-2 space-y-1">
                    {category.feeds.map((feed: any) => (
                      <div key={feed.id} className="rounded-lg border border-border bg-background">
                        <button
                          onClick={() => toggleFeedSettings(feed.id)}
                          className="flex w-full items-center justify-between p-3 text-left hover:bg-muted"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {feed.imageUrl ? (
                              <img src={feed.imageUrl} alt={feed.name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{feed.name}</div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{feed.articleCount || 0} articles</span>
                                <span>•</span>
                                <span title={feed.lastFetched ? new Date(feed.lastFetched).toLocaleString() : ''}>
                                  Last: {formatLastRefresh(feed.lastFetched)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <svg className={`h-4 w-4 transition-transform flex-shrink-0 ${editingFeedId === feed.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {editingFeedId === feed.id && feedSettings[feed.id] && (
                          <div className="border-t border-border p-4 bg-muted space-y-4">
                            <div className="text-sm">
                              <div className="mb-2 font-medium">Feed-specific Settings</div>
                              <p className="text-xs text-gray-500 mb-4">Override default settings for this feed. Set to empty to use category or user defaults.</p>
                              
                              {/* Refresh Interval */}
                              <div className="mb-4">
                                <label className="block text-sm mb-2">Refresh Interval (minutes)</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="15"
                                    max="1440"
                                    value={feedSettings[feed.id].overrides?.refreshInterval ?? ''}
                                    onChange={(e) => updateFeedSetting(feed.id, 'refreshInterval', e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder={`Default: ${feedSettings[feed.id].effective?.refreshInterval || 60}`}
                                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                  />
                                  <span className="text-xs text-gray-500">
                                    (Using: {feedSettings[feed.id].effective?.refreshInterval || 60}m from {feedSettings[feed.id].effective?.source?.refreshInterval || 'system'})
                                  </span>
                                </div>
                              </div>

                              {/* Max Articles */}
                              <div className="mb-4">
                                <label className="block text-sm mb-2">Max Articles</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="50"
                                    max="5000"
                                    value={feedSettings[feed.id].overrides?.maxArticlesPerFeed ?? ''}
                                    onChange={(e) => updateFeedSetting(feed.id, 'maxArticlesPerFeed', e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder={`Default: ${feedSettings[feed.id].effective?.maxArticlesPerFeed || 500}`}
                                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                  />
                                  <span className="text-xs text-gray-500">
                                    (Using: {feedSettings[feed.id].effective?.maxArticlesPerFeed || 500} from {feedSettings[feed.id].effective?.source?.maxArticlesPerFeed || 'system'})
                                  </span>
                                </div>
                              </div>

                              {/* Max Age */}
                              <div>
                                <label className="block text-sm mb-2">Max Article Age (days)</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={feedSettings[feed.id].overrides?.maxArticleAge ?? ''}
                                    onChange={(e) => updateFeedSetting(feed.id, 'maxArticleAge', e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder={`Default: ${feedSettings[feed.id].effective?.maxArticleAge || 90}`}
                                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                  />
                                  <span className="text-xs text-gray-500">
                                    (Using: {feedSettings[feed.id].effective?.maxArticleAge || 90}d from {feedSettings[feed.id].effective?.source?.maxArticleAge || 'system'})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Uncategorized Feeds */}
            {uncategorizedFeeds.length > 0 && (
              <div className="rounded-lg border border-border bg-background">
                <div className="p-4 border-b border-border">
                  <span className="font-medium">Uncategorized</span>
                  <span className="ml-2 text-sm text-gray-500">({uncategorizedFeeds.length} feeds)</span>
                </div>
                <div className="p-2 space-y-1">
                  {uncategorizedFeeds.map((feed: any) => (
                    <div key={feed.id} className="rounded-lg border border-border bg-background">
                      <button
                        onClick={() => toggleFeedSettings(feed.id)}
                        className="flex w-full items-center justify-between p-3 text-left hover:bg-muted"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {feed.imageUrl ? (
                            <img src={feed.imageUrl} alt={feed.name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{feed.name}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{feed.articleCount || 0} articles</span>
                              <span>•</span>
                              <span title={feed.lastFetched ? new Date(feed.lastFetched).toLocaleString() : ''}>
                                Last: {formatLastRefresh(feed.lastFetched)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <svg className={`h-4 w-4 transition-transform flex-shrink-0 ${editingFeedId === feed.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {editingFeedId === feed.id && feedSettings[feed.id] && (
                        <div className="border-t border-border p-4 bg-muted space-y-4">
                          <div className="text-sm">
                            <div className="mb-2 font-medium">Feed-specific Settings</div>
                            <p className="text-xs text-gray-500 mb-4">Override default settings for this feed. Set to empty to use user defaults.</p>
                            
                            {/* Same settings as above */}
                            <div className="mb-4">
                              <label className="block text-sm mb-2">Refresh Interval (minutes)</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="15"
                                  max="1440"
                                  value={feedSettings[feed.id].overrides?.refreshInterval ?? ''}
                                  onChange={(e) => updateFeedSetting(feed.id, 'refreshInterval', e.target.value ? parseInt(e.target.value) : null)}
                                  placeholder={`Default: ${feedSettings[feed.id].effective?.refreshInterval || 60}`}
                                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                />
                                <span className="text-xs text-gray-500">
                                  (Using: {feedSettings[feed.id].effective?.refreshInterval || 60}m from {feedSettings[feed.id].effective?.source?.refreshInterval || 'system'})
                                </span>
                              </div>
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm mb-2">Max Articles</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="50"
                                  max="5000"
                                  value={feedSettings[feed.id].overrides?.maxArticlesPerFeed ?? ''}
                                  onChange={(e) => updateFeedSetting(feed.id, 'maxArticlesPerFeed', e.target.value ? parseInt(e.target.value) : null)}
                                  placeholder={`Default: ${feedSettings[feed.id].effective?.maxArticlesPerFeed || 500}`}
                                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                />
                                <span className="text-xs text-gray-500">
                                  (Using: {feedSettings[feed.id].effective?.maxArticlesPerFeed || 500} from {feedSettings[feed.id].effective?.source?.maxArticlesPerFeed || 'system'})
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm mb-2">Max Article Age (days)</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  max="365"
                                  value={feedSettings[feed.id].overrides?.maxArticleAge ?? ''}
                                  onChange={(e) => updateFeedSetting(feed.id, 'maxArticleAge', e.target.value ? parseInt(e.target.value) : null)}
                                  placeholder={`Default: ${feedSettings[feed.id].effective?.maxArticleAge || 90}`}
                                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                />
                                <span className="text-xs text-gray-500">
                                  (Using: {feedSettings[feed.id].effective?.maxArticleAge || 90}d from {feedSettings[feed.id].effective?.source?.maxArticleAge || 'system'})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showExportModal && (
        <OpmlExportModal onClose={() => setShowExportModal(false)} />
      )}
      {showImportModal && (
        <OpmlImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
        />
      )}

      {/* Feed Refresh & Cleanup Settings */}
      <div className="rounded-lg border border-border p-6 mt-6">
        <h3 className="mb-2 text-lg font-semibold">Feed Refresh & Cleanup Settings</h3>
        <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
          Configure default settings for feed refresh intervals and article cleanup. 
          These can be overridden per-category or per-feed. Cleanup runs automatically after each feed refresh.
        </p>

        <div className="space-y-8">
          {/* Refresh Interval */}
          <div>
            <label className="mb-3 block text-sm font-medium">
              Default Refresh Interval
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="15"
                max="1440"
                step="15"
                value={preferences.defaultRefreshInterval || 60}
                onChange={(e) => updatePreference("defaultRefreshInterval", parseInt(e.target.value))}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="15"
                  max="1440"
                  value={preferences.defaultRefreshInterval || 60}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 15 && val <= 1440) {
                      updatePreference("defaultRefreshInterval", val);
                    }
                  }}
                  className="w-20 rounded-lg border border-border bg-muted px-3 py-2 text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">minutes</span>
              </div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>15 min</span>
              <span>1 hour</span>
              <span>6 hours</span>
              <span>24 hours</span>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              How often to check for new articles in your feeds
            </p>
          </div>

          {/* Max Articles Per Feed */}
          <div>
            <label className="mb-3 block text-sm font-medium">
              Max Articles Per Feed
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={preferences.defaultMaxArticlesPerFeed || 500}
                onChange={(e) => updatePreference("defaultMaxArticlesPerFeed", parseInt(e.target.value))}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="5000"
                  value={preferences.defaultMaxArticlesPerFeed || 500}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 50 && val <= 5000) {
                      updatePreference("defaultMaxArticlesPerFeed", val);
                    }
                  }}
                  className="w-24 rounded-lg border border-border bg-muted px-3 py-2 text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">articles</span>
              </div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>50</span>
              <span>500</span>
              <span>2500</span>
              <span>5000</span>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Maximum number of articles to keep per feed (oldest are deleted first)
            </p>
          </div>

          {/* Max Article Age */}
          <div>
            <label className="mb-3 block text-sm font-medium">
              Max Article Age
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="365"
                step="1"
                value={preferences.defaultMaxArticleAge || 90}
                onChange={(e) => updatePreference("defaultMaxArticleAge", parseInt(e.target.value))}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={preferences.defaultMaxArticleAge || 90}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= 365) {
                      updatePreference("defaultMaxArticleAge", val);
                    }
                  }}
                  className="w-20 rounded-lg border border-border bg-muted px-3 py-2 text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">days</span>
              </div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>1 day</span>
              <span>30 days</span>
              <span>90 days</span>
              <span>1 year</span>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Articles older than this will be automatically deleted
            </p>
          </div>

          {/* Info Box */}
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <div className="flex gap-3">
              <svg className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-semibold mb-1">Cascading Settings</p>
                <p>
                  These are your default settings. You can override them for specific categories or individual feeds.
                  Priority: Feed Settings → Category Settings → User Defaults
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <label className="text-sm font-medium">{label}</label>
        <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

