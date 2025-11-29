"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserPreferences, useUpdateUserPreferences, type UserPreferences } from "@/hooks/queries/use-user-preferences";
import { applyFontSizeVariables } from "@/lib/typography-utils";
import { Modal, ModalBody, ModalFooter, Button } from "@/app/components/ui";
import { getDefaultPreferences, validatePreferences, getViewLabel, NAVIGATION_ITEMS, type ViewType } from "@/app/lib/preferences";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useMobileMenu } from "@/hooks/use-mobile-menu";
import { useViewNavigation } from "@/hooks/use-view-navigation";
import {
  ProfileView,
  AppearanceView,
  ReadingView,
  LearningView,
  LLMView,
  ArticleDisplayView
} from "./views";

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: ViewType;
}

export function PreferencesModal({
  isOpen,
  onClose,
  initialView = 'profile',
}: PreferencesModalProps) {
  const { data: session, status: sessionStatus } = useSession();
  const { data: cachedPreferences, isLoading, error } = useUserPreferences();
  const updatePreferencesMutation = useUpdateUserPreferences();

  const [localPreferences, setLocalPreferences] = useState<UserPreferences | null>(null);
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Custom hooks for common patterns
  const { isOpen: isMobileMenuOpen, dropdownRef, close: closeMobileMenu, toggle: toggleMobileMenu } = useMobileMenu();

  const { currentView, navigateToView } = useViewNavigation<ViewType>({
    modalName: 'preferences',
    defaultView: initialView,
    isOpen: isOpen,
    onNavigate: () => closeMobileMenu(),
    onClose: (skipHistoryPush) => handleClose(skipHistoryPush),
  });

  const { confirmClose } = useUnsavedChanges(
    localPreferences,
    originalPreferences,
    {
      onRevert: (original) => {
        // Revert theme and fontSize if they were changed in the UI but not saved
        if (localPreferences?.theme !== original.theme) {
          window.dispatchEvent(new CustomEvent("preferencesUpdated", {
            detail: { theme: original.theme }
          }));
        }

        if (localPreferences?.fontSize !== original.fontSize) {
          window.dispatchEvent(new CustomEvent("preferencesUpdated", {
            detail: { fontSize: original.fontSize }
          }));
        }

        setLocalPreferences(original);
      },
    }
  );

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

  const handleClose = (skipHistoryPush = false) => {
    confirmClose(() => {
      if (skipHistoryPush && window.history.state?.modal === 'preferences') {
        window.history.back();
      }
      onClose();
    });
  };

  const handleSave = async () => {
    if (!localPreferences) return;

    setIsSaving(true);
    setSaveMessage(null);

    // Client-side validation
    const validation = validatePreferences(localPreferences);
    if (!validation.isValid) {
      console.error("Client-side validation failed:", validation.errors);
      setSaveMessage({
        type: "error",
        text: `Invalid values: ${validation.errors.join(", ")}`
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

  // Update CSS variables for preview when font size preferences change
  useEffect(() => {
    if (localPreferences) {
      console.log('Updating font size preview with:', localPreferences);
      applyFontSizeVariables({
        fontSize: localPreferences.fontSize || 'medium',
        sidebarFontSize: localPreferences.sidebarFontSize || 'smaller',
        cardFontSize: localPreferences.cardFontSize || 'same',
        modalFontSize: localPreferences.modalFontSize || 'same',
        uiFontSize: localPreferences.uiFontSize || 'same',
      });
    }
  }, [
    localPreferences?.fontSize,
    localPreferences?.sidebarFontSize,
    localPreferences?.cardFontSize,
    localPreferences?.modalFontSize,
    localPreferences?.uiFontSize
  ]);

  if (isLoading && !localPreferences) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalBody className="flex h-[70vh] items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </ModalBody>
      </Modal>
    );
  }

  if (!localPreferences) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={() => handleClose(true)} size="xl">
      <ModalBody padding={false} className="flex h-[70vh] overflow-hidden">
        {/* Sidebar Navigation - Desktop Only */}
        <aside className="hidden md:flex w-52 flex-shrink-0 border-r border-border bg-muted">
          <div className="flex h-full flex-col">
            <div className="border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Preferences</h2>
              <button
                onClick={() => handleClose(true)}
                className="rounded-lg p-1.5 hover:bg-background transition-colors"
                aria-label="Close modal"
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
            <nav className="flex-1 space-y-1 overflow-y-auto p-2">
              {NAVIGATION_ITEMS.map((item) => (
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
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile Navigation Dropdown */}
          <div className="md:hidden border-b border-border p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Preferences</h2>
              <button
                onClick={() => handleClose(true)}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors"
                aria-label="Close modal"
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
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleMobileMenu}
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
                  {NAVIGATION_ITEMS.map((item) => (
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

          <div className="flex-1 p-6 overflow-y-auto">
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
        </main>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={() => handleClose(false)}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving}
          loading={isSaving}
        >
          Save Preferences
        </Button>
      </ModalFooter>
    </Modal>
  );
}
