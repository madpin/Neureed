"use client";

import { useRouter, useParams } from "next/navigation";
import { FeedManagementModal } from "@/app/components/feeds/FeedManagementModal";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";

/**
 * Intercepting route for /feeds/[id] when navigating from home page
 * Displays the Feed Management modal with full navigation sidebar
 */
export default function FeedDetailsModal() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const feedId = params.id as string;

  const handleClose = () => {
    router.back();
  };

  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
  };

  return (
    <FeedManagementModal
      isOpen={true}
      onClose={handleClose}
      initialView="feed"
      feedId={feedId}
      onRefreshData={handleRefreshData}
    />
  );
}
