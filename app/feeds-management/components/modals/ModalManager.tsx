"use client";

import { useFeedNavigation } from "@/hooks/use-feed-navigation";
import { ModalLevelProvider } from "@/app/components/ui/Modal/useModalLevel";
import { OpmlImportModal } from "@/app/components/feeds/OpmlImportModal";
import { OpmlExportModal } from "@/app/components/feeds/OpmlExportModal";
import { BulkEditModal } from "./BulkEditModal";
import { CreateCategoryModal } from "./CreateCategoryModal";
import { AddFeedModal } from "./AddFeedModal";

/**
 * Modal Manager
 *
 * Manages modal display based on URL query parameters.
 * Uses the navigation hook to determine which modal to show.
 * Wraps nested modals with ModalLevelProvider for proper z-index stacking.
 */
export function ModalManager() {
  const { modal, selectedIds, closeModal } = useFeedNavigation();

  if (!modal) return null;

  return (
    <ModalLevelProvider>
      {modal === "opml-import" && (
        <OpmlImportModal
          isOpen
          onClose={closeModal}
          onSuccess={closeModal}
        />
      )}
      {modal === "opml-export" && (
        <OpmlExportModal isOpen onClose={closeModal} />
      )}
      {modal === "bulk-edit" && <BulkEditModal selectedFeedIds={selectedIds} onClose={closeModal} />}
      {modal === "create-category" && <CreateCategoryModal onClose={closeModal} />}
      {modal === "add-feed" && <AddFeedModal onClose={closeModal} />}
    </ModalLevelProvider>
  );
}
