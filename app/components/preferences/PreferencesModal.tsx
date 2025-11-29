"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserPreferences, useUpdateUserPreferences, type UserPreferences } from "@/hooks/queries/use-user-preferences";
import { applyFontSizeVariables } from "@/lib/typography-utils";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, ModalSidebarNavigation } from "@/app/components/ui";
import { getDefaultPreferences, validatePreferences, NAVIGATION_ITEMS, type ViewType } from "@/app/lib/preferences";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
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

  // View navigation hook
  const { currentView, navigateToView } = useViewNavigation<ViewType>({
    modalName: 'preferences',
    defaultView: initialView,
    isOpen: isOpen,
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
      <ModalHeader title="Preferences" onClose={() => handleClose(true)} />
      <ModalBody padding={false} className="flex overflow-hidden">
        <ModalSidebarNavigation
          items={NAVIGATION_ITEMS.map(item => ({
            id: item.view,
            label: item.label,
            icon: item.icon
          }))}
          currentItem={currentView}
          onNavigate={navigateToView}
        />
        <main className="flex-1 p-6 overflow-y-auto">
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
