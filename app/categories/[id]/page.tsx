"use client";

import { useParams } from "next/navigation";
import { CategorySettingsView } from "@/app/components/feeds/management/views/CategorySettingsView";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";

/**
 * Full-page route for /categories/[id]
 * Displays when user navigates directly to this URL or refreshes the page
 */
export default function CategorySettingsPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const categoryId = params.id as string;

  const handleNavigateToFeed = (feedId: string) => {
    window.location.href = `/feeds/${feedId}`;
  };

  const handleNavigateToOverview = () => {
    window.location.href = '/feeds-overview';
  };

  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="rounded-lg border border-border bg-background">
        <CategorySettingsView
          categoryId={categoryId}
          onNavigateToFeed={handleNavigateToFeed}
          onNavigateToOverview={handleNavigateToOverview}
          onRefreshData={handleRefreshData}
        />
      </div>
    </div>
  );
}
