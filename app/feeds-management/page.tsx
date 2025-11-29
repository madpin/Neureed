"use client";

import { useFeedNavigation } from "@/hooks/use-feed-navigation";
import { FeedManagementShell } from "./components/FeedManagementShell";
import { OverviewView } from "./components/views/OverviewView";
import { FeedDetailsView } from "./components/views/FeedDetailsView";
import { CategoryView } from "./components/views/CategoryView";
import { ModalManager } from "./components/modals/ModalManager";

/**
 * Feed Management Page
 *
 * Main entry point for the feed management system.
 * Uses URL-based navigation for natural back button support.
 *
 * URL Structure:
 * - /feeds-management → Overview
 * - /feeds-management?view=feed&id=123 → Feed details
 * - /feeds-management?view=category&id=456 → Category settings
 * - /feeds-management?modal=opml-import → OPML import modal
 * - /feeds-management?modal=bulk-edit&selected=id1,id2,id3 → Bulk edit modal
 */
export default function FeedsManagementPage() {
  const { view, id } = useFeedNavigation();

  return (
    <>
      <FeedManagementShell>
        {view === "overview" && <OverviewView />}
        {view === "feed" && id && <FeedDetailsView feedId={id} />}
        {view === "category" && id && <CategoryView categoryId={id} />}

        {/* Fallback: if view is invalid or id is missing, show overview */}
        {((view === "feed" || view === "category") && !id) && <OverviewView />}
      </FeedManagementShell>

      {/* Modal Manager - renders modals based on URL query params */}
      <ModalManager />
    </>
  );
}
