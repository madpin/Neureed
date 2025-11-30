"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "@/app/components/ui";
import { useFeedNavigation } from "@/hooks/use-feed-navigation";
import { OverviewView } from "./views/OverviewView";
import { FeedDetailsView } from "./views/FeedDetailsView";
import { CategoryView } from "./views/CategoryView";
import { ModalManager } from "./modals/ModalManager";

/**
 * Feed Management Modal
 *
 * Modal version of the feed management system that overlays on top of the current page.
 * Controlled by URL parameter: ?feedsModal=open
 *
 * This provides a modal experience while maintaining URL-based navigation benefits:
 * - Browser back button closes the modal or navigates within it
 * - URL can be bookmarked to return to specific feed/category
 * - Native browser history support
 */
export function FeedManagementModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { view, id, goBack } = useFeedNavigation();

  const isOpen = searchParams.get("feedsModal") === "open";

  const handleClose = useCallback(() => {
    // Remove all feed management related query params
    const params = new URLSearchParams(window.location.search);
    params.delete("feedsModal");
    params.delete("view");
    params.delete("id");
    params.delete("modal");
    params.delete("selected");

    const paramsString = params.toString();
    router.push(paramsString ? `/?${paramsString}` : "/");
  }, [router]);

  // Get dynamic title based on current view
  const getTitle = () => {
    switch (view) {
      case "feed":
        return "Feed Settings";
      case "category":
        return "Category Settings";
      default:
        return "Feed Management";
    }
  };

  // Placeholder save handler (will be implemented with actual save logic)
  const handleSave = () => {
    // TODO: Implement save logic
    console.log("Save clicked for view:", view);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      closeOnEscape={true}
      closeOnOutsideClick={true}
    >
      <ModalHeader title={getTitle()} onClose={handleClose} />
      <ModalBody padding={false} className="flex overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {view === "overview" && <OverviewView />}
            {view === "feed" && id && <FeedDetailsView feedId={id} />}
            {view === "category" && id && <CategoryView categoryId={id} />}

            {/* Fallback: if view is invalid or id is missing, show overview */}
            {((view === "feed" || view === "category") && !id) && <OverviewView />}
          </div>
        </main>

        {/* Modal Manager - renders modals based on URL query params */}
        <ModalManager />
      </ModalBody>

      {/* Context-sensitive footer */}
      {view === "overview" && (
        <ModalFooter align="right">
          <Button variant="outline" onClick={handleClose}>Close</Button>
        </ModalFooter>
      )}

      {(view === "feed" || view === "category") && (
        <ModalFooter align="between">
          <Button variant="outline" onClick={goBack}>Back to Overview</Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save Changes</Button>
          </div>
        </ModalFooter>
      )}
    </Modal>
  );
}
