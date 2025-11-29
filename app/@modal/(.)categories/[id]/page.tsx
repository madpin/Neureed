"use client";

import { useRouter, useParams } from "next/navigation";
import { Modal, ModalBody } from "@/app/components/ui";
import { CategorySettingsView } from "@/app/components/feeds/management/views/CategorySettingsView";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";

/**
 * Intercepting route for /categories/[id] when navigating from home page
 * Displays the Category Settings view in a modal
 */
export default function CategorySettingsModal() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const categoryId = params.id as string;

  const handleClose = () => {
    router.back();
  };

  const handleNavigateToFeed = (feedId: string) => {
    router.push(`/feeds/${feedId}`);
  };

  const handleNavigateToOverview = () => {
    router.push('/feeds-overview');
  };

  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
  };

  return (
    <Modal isOpen={true} onClose={handleClose} size="xl">
      <ModalBody padding={false} className="flex h-[70vh] overflow-hidden">
        <CategorySettingsView
          categoryId={categoryId}
          onNavigateToFeed={handleNavigateToFeed}
          onNavigateToOverview={handleNavigateToOverview}
          onRefreshData={handleRefreshData}
        />
      </ModalBody>
    </Modal>
  );
}
