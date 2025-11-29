"use client";

import { useRouter } from "next/navigation";
import { Modal, ModalBody } from "@/app/components/ui";
import { OverviewView } from "@/app/components/feeds/management/views/OverviewView";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";

/**
 * Intercepting route for /feeds-overview when navigating from home page
 * Displays the Overview view in a modal
 */
export default function FeedsOverviewModal() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleClose = () => {
    router.back();
  };

  const handleNavigateToCategory = (categoryId: string) => {
    router.push(`/categories/${categoryId}`);
  };

  const handleNavigateToFeed = (feedId: string) => {
    router.push(`/feeds/${feedId}`);
  };

  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
  };

  const handleAddFeed = () => {
    // This will be handled by the parent page's AddFeedForm modal
    // For now, navigate back to home where the modal state is managed
    router.push('/?action=add-feed');
  };

  const handleBrowseFeeds = () => {
    // This will be handled by the parent page's FeedBrowser modal
    // For now, navigate back to home where the modal state is managed
    router.push('/?action=browse-feeds');
  };

  return (
    <Modal isOpen={true} onClose={handleClose} size="xl">
      <ModalBody padding={false} className="flex h-[70vh] overflow-hidden">
        <OverviewView
          onNavigateToCategory={handleNavigateToCategory}
          onNavigateToFeed={handleNavigateToFeed}
          onRefreshData={handleRefreshData}
          onAddFeed={handleAddFeed}
          onBrowseFeeds={handleBrowseFeeds}
        />
      </ModalBody>
    </Modal>
  );
}
