"use client";

import { SavedSearchModal } from "./SavedSearchModal";
import type { SavedSearch } from "@/hooks/queries/use-saved-searches";

interface SavedSearchSettingsProps {
  savedSearch: SavedSearch;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Settings panel for a saved search (reuses SavedSearchModal for editing)
 */
export function SavedSearchSettings({
  savedSearch,
  isOpen,
  onClose,
}: SavedSearchSettingsProps) {
  return (
    <SavedSearchModal
      isOpen={isOpen}
      onClose={onClose}
      savedSearch={savedSearch}
    />
  );
}
