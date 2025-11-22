"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ThemePalette } from "./ThemePalette";
import { DraggableOrderEditor } from "./DraggableOrderEditor";
import { ArticleCard, type ArticleDisplayPreferences } from "@/app/components/articles/ArticleCard";
import { useUserPreferences, useUpdateUserPreferences, useResetPatterns, type UserPreferences } from "@/hooks/queries/use-user-preferences";

type ViewType = 'profile' | 'appearance' | 'articleDisplay' | 'reading' | 'learning' | 'llm' | 'feeds';

interface PreferencesModalProps {
  onClose: () => void;
  initialView?: ViewType;
}

export function PreferencesModal({
  onClose,
  initialView = 'profile',
}: PreferencesModalProps) {
  const { data: session, status: sessionStatus } = useSession();
  const { data: cachedPreferences, isLoading, error } = useUserPreferences();
  const updatePreferencesMutation = useUpdateUserPreferences();
  
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  
  const [localPreferences, setLocalPreferences] = useState<UserPreferences | null>(null);
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isShowingUnsavedDialog = useRef(false);

  // Initialize local state from cached data
  useEffect(() => {
    if (cachedPreferences) {
      const prefs = {
        ...getDefaultPreferences(),
        ...cachedPreferences,
      };
      // Only update if we haven't started editing or if it's the first load
      if (!localPreferences) {
        setLocalPreferences(prefs);
        setOriginalPreferences(prefs);
      }
    } else if (!isLoading && !localPreferences) {
       // Fallback if no data, auth error, or if unauthenticated
       // Use defaults for preview/unauthenticated state
       const defaultPrefs = getDefaultPreferences();
       setLocalPreferences(defaultPrefs);
       setOriginalPreferences(defaultPrefs);
    }
  }, [cachedPreferences, isLoading, localPreferences, error]);

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
    llmSummaryModel: null,
    llmEmbeddingModel: null,
    llmDigestModel: null,
    llmApiKey: null,
    llmBaseUrl: null,
    embeddingsEnabled: false,
    readingPanelEnabled: false,
    readingPanelPosition: "right",
    readingPanelSize: 50,
    readingFontFamily: "Georgia",
    readingFontSize: 18,
    readingLineHeight: 1.7,
    readingParagraphSpacing: 1.5,
    breakLineSpacing: 0.75,
    showReadingTime: true,
    // Article Display Customization
    articleCardDensity: "normal",
    showArticleImage: true,
    showArticleExcerpt: true,
    showArticleAuthor: true,
    showArticleFeedInfo: true,
    showArticleDate: true,
    articleCardSectionOrder: ["feedInfo", "title", "excerpt", "actions"],
    articleCardBorderWidth: "normal",
    articleCardBorderRadius: "normal",
    articleCardBorderContrast: "medium",
    articleCardSpacing: "normal",
  });

  const hasUnsavedChanges = () => {
    if (!localPreferences || !originalPreferences) return false;
    return JSON.stringify(localPreferences) !== JSON.stringify(originalPreferences);
  };

  const revertChanges = () => {
    if (!originalPreferences) return;
    
    // Revert theme and fontSize if they were changed in the UI but not saved
    if (localPreferences?.theme !== originalPreferences.theme) {
      window.dispatchEvent(new CustomEvent("preferencesUpdated", { 
        detail: { theme: originalPreferences.theme } 
      }));
    }
    
    if (localPreferences?.fontSize !== originalPreferences.fontSize) {
      window.dispatchEvent(new CustomEvent("preferencesUpdated", { 
        detail: { fontSize: originalPreferences.fontSize } 
      }));
    }
    
    setLocalPreferences(originalPreferences);
  };

  const handleCloseWithHistory = () => {
    if (hasUnsavedChanges()) {
      // Prevent showing multiple dialogs
      if (isShowingUnsavedDialog.current) {
        return;
      }
      
      isShowingUnsavedDialog.current = true;
      
      toast.warning("You have unsaved changes", {
        description: "Are you sure you want to close without saving?",
        action: {
          label: "Close anyway",
          onClick: () => {
            isShowingUnsavedDialog.current = false;
            revertChanges();
            if (window.history.state?.modal === 'preferences') {
              window.history.back();
            }
            onClose();
          },
        },
        cancel: {
          label: "Keep editing",
          onClick: () => {
            isShowingUnsavedDialog.current = false;
          },
        },
        onDismiss: () => {
          isShowingUnsavedDialog.current = false;
        },
        onAutoClose: () => {
          isShowingUnsavedDialog.current = false;
        },
      });
      return;
    }
    
    if (window.history.state?.modal === 'preferences') {
      window.history.back();
    }
    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      // Prevent showing multiple dialogs
      if (isShowingUnsavedDialog.current) {
        return;
      }
      
      isShowingUnsavedDialog.current = true;
      
      toast.warning("You have unsaved changes", {
        description: "Are you sure you want to close without saving?",
        action: {
          label: "Close anyway",
          onClick: () => {
            isShowingUnsavedDialog.current = false;
            revertChanges();
            onClose();
          },
        },
        cancel: {
          label: "Keep editing",
          onClick: () => {
            isShowingUnsavedDialog.current = false;
          },
        },
        onDismiss: () => {
          isShowingUnsavedDialog.current = false;
        },
        onAutoClose: () => {
          isShowingUnsavedDialog.current = false;
        },
      });
      return;
    }
    onClose();
  };

  const handleSave = async () => {
    if (!localPreferences) return;

    setIsSaving(true);
    setSaveMessage(null);

    // Client-side validation for common issues
    const validationIssues = [];
    
    if (localPreferences.articleCardBorderWidth && !["none", "thin", "normal", "thick"].includes(localPreferences.articleCardBorderWidth)) {
      validationIssues.push(`Invalid borderWidth: ${localPreferences.articleCardBorderWidth}`);
    }
    if (localPreferences.articleCardBorderRadius && !["sharp", "slight", "normal", "rounded"].includes(localPreferences.articleCardBorderRadius)) {
      validationIssues.push(`Invalid borderRadius: ${localPreferences.articleCardBorderRadius}`);
    }
    if (localPreferences.articleCardBorderContrast && !["subtle", "medium", "strong"].includes(localPreferences.articleCardBorderContrast)) {
      validationIssues.push(`Invalid borderContrast: ${localPreferences.articleCardBorderContrast}`);
    }
    if (localPreferences.articleCardSpacing && !["none", "compact", "normal", "comfortable", "spacious"].includes(localPreferences.articleCardSpacing)) {
      validationIssues.push(`Invalid spacing: ${localPreferences.articleCardSpacing}`);
    }
    
    if (validationIssues.length > 0) {
      console.error("Client-side validation failed:", validationIssues);
      setSaveMessage({
        type: "error",
        text: `Invalid values: ${validationIssues.join(", ")}`
      });
      setIsSaving(false);
      return;
    }

    try {
      // Use the mutation to save
      await updatePreferencesMutation.mutateAsync(localPreferences);

      setSaveMessage({ type: "success", text: "Preferences saved successfully!" });
      setOriginalPreferences(localPreferences);
      
      // Dispatch event for immediate UI update if listeners exist (though React Query cache update should handle most)
      window.dispatchEvent(new CustomEvent("preferencesUpdated", { detail: localPreferences }));
      
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error("Failed to save preferences:", error);
      console.error("Error details:", error.data);
      
      let errorMessage = "Failed to save preferences. Please try again.";
      
      if (error.data && Array.isArray(error.data)) {
        // Zod validation errors
        const fieldErrors = error.data.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ");
        errorMessage = `Validation error: ${fieldErrors}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setSaveMessage({
        type: "error",
        text: errorMessage
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setLocalPreferences((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  // Get label for current view
  const getViewLabel = (view: ViewType) => {
    const labels: Record<ViewType, string> = {
      profile: 'Profile',
      appearance: 'Appearance',
      articleDisplay: 'Article Display',
      reading: 'Reading',
      learning: 'Learning',
      llm: 'LLM Settings',
      feeds: 'Feeds'
    };
    return labels[view];
  };

  // Navigation menu items
  const navigationItems: Array<{ view: ViewType; label: string; icon: React.ReactNode }> = [
    {
      view: 'profile',
      label: 'Profile',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      view: 'appearance',
      label: 'Appearance',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
    {
      view: 'articleDisplay',
      label: 'Article Display',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 14a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 11a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
        </svg>
      )
    },
    {
      view: 'reading',
      label: 'Reading',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      view: 'learning',
      label: 'Learning',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      view: 'llm',
      label: 'LLM Settings',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      )
    }
  ];

  // Navigate to a different view
  const navigateToView = (view: ViewType) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false); // Close mobile menu on selection
    const state = { modal: 'preferences', view };
    window.history.pushState(state, '', window.location.href);
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.modal === 'preferences') {
        setCurrentView(event.state.view || 'profile');
      } else {
        handleCloseWithHistory();
      }
    };

    const initialState = { modal: 'preferences', view: initialView };
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
      // Close mobile dropdown when clicking outside
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [localPreferences, originalPreferences]);

  if (isLoading && !localPreferences) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="flex h-[90vh] w-full max-w-6xl items-center justify-center rounded-lg bg-background shadow-xl">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!localPreferences) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div ref={modalRef} className="flex h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-background shadow-xl">
        {/* Sidebar Navigation - Desktop Only */}
        <aside className="hidden md:flex w-52 flex-shrink-0 border-r border-border bg-muted">
          <div className="flex h-full flex-col">
            <div className="border-b border-border p-4">
              <h2 className="text-lg font-semibold">Preferences</h2>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-2">
              {navigationItems.map((item) => (
                <button
                  key={item.view}
                  onClick={() => navigateToView(item.view)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    currentView === item.view
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "hover:bg-muted"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
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
          {/* Mobile Navigation Dropdown */}
          <div className="md:hidden border-b border-border p-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                <span>{getViewLabel(currentView)}</span>
                <svg
                  className={`h-5 w-5 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isMobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-border bg-background shadow-lg z-10 max-h-80 overflow-y-auto">
                  {navigationItems.map((item) => (
                    <button
                      key={item.view}
                      onClick={() => navigateToView(item.view)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors border-b border-border last:border-b-0 ${
                        currentView === item.view
                          ? "bg-primary/10 text-primary dark:bg-primary/20"
                          : "hover:bg-muted"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

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
              <AppearanceView preferences={localPreferences} updatePreference={updatePreference} />
            )}
            {currentView === 'articleDisplay' && (
              <ArticleDisplayView preferences={localPreferences} updatePreference={updatePreference} />
            )}
            {currentView === 'reading' && (
              <ReadingView preferences={localPreferences} updatePreference={updatePreference} />
            )}
            {currentView === 'learning' && (
              <LearningView preferences={localPreferences} updatePreference={updatePreference} />
            )}
            {currentView === 'llm' && (
              <LLMView preferences={localPreferences} updatePreference={updatePreference} />
            )}
          </div>

          {/* Save Button Footer */}
          <div className="border-t border-border bg-background p-4">
            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-primary"
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
          <label className="mb-3 block text-sm font-medium">Theme</label>
          <ThemePalette
            selectedTheme={preferences.theme || "system"}
            onThemeChange={(theme) => {
              updatePreference("theme", theme);
              window.dispatchEvent(new CustomEvent("preferencesUpdated", {
                detail: { theme }
              }));
            }}
          />
        </div>

        {/* Font Size */}
        <div>
          <label className="mb-2 block text-sm font-medium">Font Size</label>
          <div className="flex gap-2">
            <select
              value={["small", "medium", "large"].includes(preferences.fontSize || "medium") ? preferences.fontSize : "custom"}
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
            {!["small", "medium", "large"].includes(preferences.fontSize || "medium") && (
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
            value={preferences.defaultView || "expanded"}
            onChange={(e) => updatePreference("defaultView", e.target.value as "compact" | "expanded")}
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

// Reading View Component
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
              checked={preferences.readingPanelEnabled || false}
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
                    value={preferences.readingPanelSize || 50}
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
            value={preferences.articlesPerPage || 20}
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
          checked={preferences.showReadArticles || false}
          onChange={(checked) => updatePreference("showReadArticles", checked)}
        />

        <ToggleSwitch
          label="Auto Mark as Read"
          description="Automatically mark articles as read when you open them"
          checked={preferences.autoMarkAsRead || false}
          onChange={(checked) => updatePreference("autoMarkAsRead", checked)}
        />

        <ToggleSwitch
          label="Show Excerpts in Related Articles"
          description="Display article snippets in the related articles section"
          checked={preferences.showRelatedExcerpts || false}
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
            Bounce Detection Threshold: {Math.round((preferences.bounceThreshold || 0.25) * 100)}%
          </label>
          <input
            type="range"
            min="10"
            max="50"
            step="5"
            value={(preferences.bounceThreshold || 0.25) * 100}
            onChange={(e) => updatePreference("bounceThreshold", parseInt(e.target.value) / 100)}
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            If you leave an article before reading {Math.round((preferences.bounceThreshold || 0.25) * 100)}% of the estimated time,
            it counts as negative feedback
          </p>
        </div>

        <ToggleSwitch
          label="Show Low-Relevance Articles"
          description="Display articles with low relevance scores (dimmed) instead of hiding them"
          checked={preferences.showLowRelevanceArticles || false}
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
          <ResetPatternsButton />
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

        {/* Summary Model */}
        <div>
          <label className="mb-2 block text-sm font-medium">Summarization Model</label>
          <input
            type="text"
            value={preferences.llmSummaryModel || ""}
            onChange={(e) => updatePreference("llmSummaryModel", e.target.value || null)}
            placeholder={preferences.llmProvider === "openai" ? "e.g., gpt-4o-mini" : preferences.llmProvider === "ollama" ? "e.g., llama2" : "Use system default"}
            className="w-full rounded-lg border border-border bg-muted px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {preferences.llmProvider === "openai" && "For article summaries. Recommended: gpt-4o-mini, gpt-4o, gpt-3.5-turbo"}
            {preferences.llmProvider === "ollama" && "For article summaries. Examples: llama2, mistral, codellama"}
            {!preferences.llmProvider && "Model for generating article summaries"}
          </p>
        </div>

        {/* Embedding Model */}
        <div>
          <label className="mb-2 block text-sm font-medium">Embedding Model</label>
          <input
            type="text"
            value={preferences.llmEmbeddingModel || ""}
            onChange={(e) => updatePreference("llmEmbeddingModel", e.target.value || null)}
            placeholder={preferences.llmProvider === "openai" ? "e.g., text-embedding-3-small" : preferences.llmProvider === "ollama" ? "e.g., nomic-embed-text" : "Use system default"}
            className="w-full rounded-lg border border-border bg-muted px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {preferences.llmProvider === "openai" && "For semantic search. Recommended: text-embedding-3-small, text-embedding-3-large"}
            {preferences.llmProvider === "ollama" && "For semantic search. Example: nomic-embed-text"}
            {!preferences.llmProvider && "Model for generating embeddings (semantic search)"}
          </p>
        </div>

        {/* Digest Model */}
        <div>
          <label className="mb-2 block text-sm font-medium">Digest Model</label>
          <input
            type="text"
            value={preferences.llmDigestModel || ""}
            onChange={(e) => updatePreference("llmDigestModel", e.target.value || null)}
            placeholder={preferences.llmProvider === "openai" ? "e.g., gpt-4o" : preferences.llmProvider === "ollama" ? "e.g., mistral" : "Use system default"}
            className="w-full rounded-lg border border-border bg-muted px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {preferences.llmProvider === "openai" && "For digest generation (future). Recommended: gpt-4o, gpt-4-turbo"}
            {preferences.llmProvider === "ollama" && "For digest generation (future). Example: mistral"}
            {!preferences.llmProvider && "Model for generating daily digests (future feature)"}
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

// Article Display View Component
function ArticleDisplayView({
  preferences,
  updatePreference,
}: {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}) {
  const densityOptions = [
    {
      value: "compact" as const,
      label: "Compact",
      description: "Minimal spacing, more articles visible",
    },
    {
      value: "normal" as const,
      label: "Normal",
      description: "Balanced spacing and readability",
    },
    {
      value: "comfortable" as const,
      label: "Comfortable",
      description: "Generous spacing, easier reading",
    },
  ];

  const currentDensity = (preferences.articleCardDensity as "compact" | "normal" | "comfortable") || "normal";

  // Sample articles for preview - one unread, one read
  const sampleArticles = useMemo(() => [
    {
      id: "preview-article-1",
      title: "How to Customize Your RSS Reader Experience",
      excerpt: "Learn how to personalize your article cards with custom layouts, density settings, and component visibility controls for the perfect reading experience.",
      content: "Sample content",
      url: "#",
      feedId: "sample-feed",
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
      author: "John Doe",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
      isRead: false, // Unread article
      feeds: {
        id: "sample-feed",
        name: "Tech News Daily",
        url: "#",
        imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=32&h=32&fit=crop",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    {
      id: "preview-article-2",
      title: "Building Modern Web Applications",
      excerpt: "Explore the latest techniques and best practices for creating responsive, performant web applications with modern frameworks.",
      content: "Sample content",
      url: "#",
      feedId: "sample-feed",
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(Date.now() - 3600000),
      author: "Jane Smith",
      imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop",
      isRead: true, // Read article
      feeds: {
        id: "sample-feed",
        name: "Tech News Daily",
        url: "#",
        imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=32&h=32&fit=crop",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  ], []);

  // Build display preferences from current settings
  const displayPreferences = useMemo<ArticleDisplayPreferences>(() => ({
    density: (preferences.articleCardDensity as "compact" | "normal" | "comfortable") || "normal",
    showImage: preferences.showArticleImage ?? true,
    showExcerpt: preferences.showArticleExcerpt ?? true,
    showAuthor: preferences.showArticleAuthor ?? true,
    showFeedInfo: preferences.showArticleFeedInfo ?? true,
    showDate: preferences.showArticleDate ?? true,
    sectionOrder: (preferences.articleCardSectionOrder as string[]) || ["feedInfo", "title", "excerpt", "actions"],
    borderWidth: (preferences.articleCardBorderWidth as "none" | "thin" | "normal" | "thick") || "normal",
    borderRadius: (preferences.articleCardBorderRadius as "sharp" | "slight" | "normal" | "rounded") || "normal",
    borderContrast: (preferences.articleCardBorderContrast as "subtle" | "medium" | "strong") || "medium",
  }), [preferences]);

  // Get spacing class for preview
  const previewSpacingClass = useMemo(() => {
    const spacing = preferences.articleCardSpacing || "normal";
    switch (spacing) {
      case "none":
        return "space-y-0";
      case "compact":
        return "space-y-2";
      case "comfortable":
        return "space-y-6";
      case "spacious":
        return "space-y-8";
      case "normal":
      default:
        return "space-y-4";
    }
  }, [preferences.articleCardSpacing]);

  const handleDensityChange = (density: "compact" | "normal" | "comfortable") => {
    updatePreference("articleCardDensity", density);
    
    // Auto-adjust visibility toggles based on density
    if (density === "compact") {
      updatePreference("showArticleImage", false);
      updatePreference("showArticleExcerpt", false);
    } else if (density === "comfortable") {
      updatePreference("showArticleImage", true);
      updatePreference("showArticleExcerpt", true);
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Article Display</h2>
      
      <div className="space-y-8">
        {/* Live Preview - Sticky */}
        <div className="sticky top-0 z-10 rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 shadow-lg backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Live Preview</h3>
              <p className="text-sm text-foreground/70">
                Changes apply instantly as you customize
              </p>
            </div>
            <div className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
              ● Real-time
            </div>
          </div>
          
          <div className="rounded-lg border border-border bg-background p-4">
            <div className={previewSpacingClass}>
              {sampleArticles.map((article) => (
                <ArticleCard 
                  key={article.id}
                  article={article as any}
                  displayPreferences={displayPreferences}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Density Presets */}
        <div>
          <label className="mb-3 block text-sm font-medium">Display Density</label>
          <div className="grid grid-cols-3 gap-3">
            {densityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleDensityChange(option.value)}
                className={`
                  flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all
                  ${
                    currentDensity === option.value
                      ? "border-primary bg-primary/10 dark:bg-primary/20"
                      : "border-border bg-background hover:bg-muted"
                  }
                `}
              >
                <span className="font-semibold text-sm">{option.label}</span>
                <span className="text-xs text-foreground/60">{option.description}</span>
                
                {/* Visual indicator */}
                <div className="mt-2 space-y-1 w-full">
                  <div className={`h-2 rounded bg-foreground/20 ${option.value === "compact" ? "w-3/4" : option.value === "comfortable" ? "w-full" : "w-5/6"}`} />
                  <div className={`h-1.5 rounded bg-foreground/10 ${option.value === "compact" ? "w-1/2" : "w-3/4"}`} />
                  {option.value !== "compact" && (
                    <div className="h-1 rounded bg-foreground/5 w-full" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Component Visibility Toggles */}
        <div className="rounded-lg border border-border bg-muted p-6">
          <h3 className="mb-4 text-lg font-semibold">Show/Hide Components</h3>
          <p className="mb-4 text-sm text-foreground/70">
            Choose which elements to display in article cards
          </p>
          
          <div className="space-y-4">
            <ToggleSwitch
              label="Show Feed Information"
              description="Display feed icon and name"
              checked={preferences.showArticleFeedInfo ?? true}
              onChange={(checked) => updatePreference("showArticleFeedInfo", checked)}
            />
            
            <ToggleSwitch
              label="Show Article Images"
              description="Display featured images when available"
              checked={preferences.showArticleImage ?? true}
              onChange={(checked) => updatePreference("showArticleImage", checked)}
            />
            
            <ToggleSwitch
              label="Show Excerpts"
              description="Display article summaries/descriptions"
              checked={preferences.showArticleExcerpt ?? true}
              onChange={(checked) => updatePreference("showArticleExcerpt", checked)}
            />
            
            <ToggleSwitch
              label="Show Author Names"
              description="Display article author when available"
              checked={preferences.showArticleAuthor ?? true}
              onChange={(checked) => updatePreference("showArticleAuthor", checked)}
            />
            
            <ToggleSwitch
              label="Show Publication Dates"
              description="Display when articles were published"
              checked={preferences.showArticleDate ?? true}
              onChange={(checked) => updatePreference("showArticleDate", checked)}
            />
          </div>
        </div>

        {/* Border Appearance */}
        <div className="rounded-lg border border-border bg-muted p-6">
          <h3 className="mb-4 text-lg font-semibold">Border Appearance</h3>
          <p className="mb-6 text-sm text-foreground/70">
            Customize borders to create a card-like or table-like appearance
          </p>
          
          <div className="space-y-6">
            {/* Border Width */}
            <div>
              <label className="mb-3 block text-sm font-medium">Border Width</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { value: "none", label: "None", description: "No borders (minimal)" },
                  { value: "thin", label: "Thin", description: "Subtle borders" },
                  { value: "normal", label: "Normal", description: "Standard borders" },
                  { value: "thick", label: "Thick", description: "Prominent (table-like)" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updatePreference("articleCardBorderWidth", option.value as "none" | "thin" | "normal" | "thick")}
                    className={`
                      flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-left transition-all
                      ${
                        (preferences.articleCardBorderWidth || "normal") === option.value
                          ? "border-primary bg-primary/10 dark:bg-primary/20"
                          : "border-border bg-background hover:bg-muted"
                      }
                    `}
                  >
                    <span className="text-sm font-semibold">{option.label}</span>
                    <span className="text-xs text-foreground/60 text-center">{option.description}</span>
                    <div className="mt-2 w-full h-8 bg-foreground/5 rounded flex items-center justify-center">
                      <div 
                        className={`bg-foreground/30 rounded ${
                          option.value === "none" ? "w-12 h-0" :
                          option.value === "thin" ? "w-12 h-0.5" :
                          option.value === "thick" ? "w-12 h-2" :
                          "w-12 h-1"
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Border Radius */}
            <div>
              <label className="mb-3 block text-sm font-medium">Border Radius</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { value: "sharp", label: "Sharp", description: "Square corners (table)" },
                  { value: "slight", label: "Slight", description: "Slightly rounded" },
                  { value: "normal", label: "Normal", description: "Rounded corners" },
                  { value: "rounded", label: "Rounded", description: "Very rounded (card)" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updatePreference("articleCardBorderRadius", option.value as "sharp" | "slight" | "normal" | "rounded")}
                    className={`
                      flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-left transition-all
                      ${
                        (preferences.articleCardBorderRadius || "normal") === option.value
                          ? "border-primary bg-primary/10 dark:bg-primary/20"
                          : "border-border bg-background hover:bg-muted"
                      }
                    `}
                  >
                    <span className="text-sm font-semibold">{option.label}</span>
                    <span className="text-xs text-foreground/60 text-center">{option.description}</span>
                    <div className="mt-2 w-full h-8 bg-foreground/5 flex items-center justify-center">
                      <div 
                        className={`w-12 h-6 bg-foreground/30 border-2 border-foreground/40 ${
                          option.value === "sharp" ? "rounded-none" :
                          option.value === "slight" ? "rounded" :
                          option.value === "rounded" ? "rounded-xl" :
                          "rounded-lg"
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Border Contrast */}
            <div>
              <label className="mb-3 block text-sm font-medium">Border Contrast</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "subtle", label: "Subtle", description: "Low visibility" },
                  { value: "medium", label: "Medium", description: "Balanced (default)" },
                  { value: "strong", label: "Strong", description: "Maximum contrast" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updatePreference("articleCardBorderContrast", option.value as "subtle" | "medium" | "strong")}
                    className={`
                      flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-left transition-all
                      ${
                        (preferences.articleCardBorderContrast || "medium") === option.value
                          ? "border-primary bg-primary/10 dark:bg-primary/20"
                          : "border-border bg-background hover:bg-muted"
                      }
                    `}
                  >
                    <span className="text-sm font-semibold">{option.label}</span>
                    <span className="text-xs text-foreground/60 text-center">{option.description}</span>
                    <div className="mt-2 w-full h-8 bg-foreground/5 rounded flex items-center justify-center">
                      <div 
                        className={`w-12 h-6 rounded ${
                          option.value === "subtle" ? "border border-foreground/40" :
                          option.value === "strong" ? "border-4 border-foreground" :
                          "border-2 border-foreground/80"
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Spacing */}
            <div>
              <label className="mb-3 block text-sm font-medium">Card Spacing</label>
              <p className="mb-3 text-xs text-foreground/60">
                Space between article cards in the feed
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  { value: "none", label: "None", description: "No spacing (table)" },
                  { value: "compact", label: "Compact", description: "Minimal spacing" },
                  { value: "normal", label: "Normal", description: "Standard spacing" },
                  { value: "comfortable", label: "Comfortable", description: "Generous spacing" },
                  { value: "spacious", label: "Spacious", description: "Maximum spacing" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updatePreference("articleCardSpacing", option.value as "none" | "compact" | "normal" | "comfortable" | "spacious")}
                    className={`
                      flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-left transition-all
                      ${
                        (preferences.articleCardSpacing || "normal") === option.value
                          ? "border-primary bg-primary/10 dark:bg-primary/20"
                          : "border-border bg-background hover:bg-muted"
                      }
                    `}
                  >
                    <span className="text-sm font-semibold">{option.label}</span>
                    <span className="text-xs text-foreground/60 text-center">{option.description}</span>
                    <div className="mt-2 w-full h-8 bg-foreground/5 rounded flex flex-col items-center justify-center gap-0.5">
                      <div className={`w-12 h-1 bg-foreground/30 rounded`} />
                      <div className={`w-12 ${
                        option.value === "none" ? "h-0" :
                        option.value === "compact" ? "h-0.5" :
                        option.value === "comfortable" ? "h-2" :
                        option.value === "spacious" ? "h-3" :
                        "h-1"
                      }`} />
                      <div className={`w-12 h-1 bg-foreground/30 rounded`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section Order Customization */}
        <div className="rounded-lg border border-border bg-muted p-6">
          <DraggableOrderEditor
            sections={(preferences.articleCardSectionOrder as string[]) || ["feedInfo", "title", "excerpt", "actions"]}
            onReorder={(newOrder) => updatePreference("articleCardSectionOrder", newOrder)}
          />
        </div>

        {/* Info Box */}
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 dark:border-primary/30 dark:bg-primary/20">
          <p className="text-sm text-primary dark:text-primary">
            💡 <strong>Tip:</strong> Watch the live preview above update instantly as you make changes. 
            All adjustments apply immediately to your feeds. You can reset to defaults anytime by selecting a density preset.
          </p>
        </div>
      </div>
    </div>
  );
}

// Reset Patterns Button Component
function ResetPatternsButton() {
  const resetPatterns = useResetPatterns();

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset all learned patterns? This cannot be undone.")) {
      try {
        await resetPatterns.mutateAsync();
        toast.success("Patterns reset successfully!");
      } catch (error) {
        console.error("Failed to reset patterns:", error);
        toast.error("Failed to reset patterns. Please try again.");
      }
    }
  };

  return (
    <button
      onClick={handleReset}
      disabled={resetPatterns.isPending}
      className="btn btn-danger btn-sm disabled:opacity-50"
    >
      {resetPatterns.isPending ? "Resetting..." : "Reset Learning"}
    </button>
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
