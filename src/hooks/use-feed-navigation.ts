"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export type FeedManagementView = "overview" | "feed" | "category";
export type FeedManagementModal = "opml-import" | "opml-export" | "bulk-edit" | "create-category" | "add-feed" | null;

export interface FeedNavigationState {
  view: FeedManagementView;
  id: string | null;
  modal: FeedManagementModal;
  selectedIds: string[];
}

export interface FeedNavigationActions {
  navigateToOverview: () => void;
  navigateToFeed: (feedId: string) => void;
  navigateToCategory: (categoryId: string) => void;
  openModal: (modalType: Exclude<FeedManagementModal, null>, params?: Record<string, string>) => void;
  closeModal: () => void;
  goBack: () => void;
}

export interface UseFeedNavigationReturn extends FeedNavigationState, FeedNavigationActions {}

/**
 * Core navigation hook for Feed Management system
 *
 * Uses URL query parameters for navigation state, ensuring:
 * - Native browser back/forward button support
 * - Bookmarkable URLs
 * - Shareable links
 * - SSR compatibility
 *
 * URL Structure:
 * - /feeds-management → Overview
 * - /feeds-management?view=feed&id=123 → Feed details
 * - /feeds-management?view=category&id=456 → Category settings
 * - /feeds-management?modal=opml-import → Nested modal
 * - /feeds-management?modal=bulk-edit&selected=id1,id2,id3 → Bulk operations
 *
 * @example
 * ```tsx
 * const { view, id, navigateToFeed, openModal } = useFeedNavigation();
 *
 * // Navigate to feed details
 * <button onClick={() => navigateToFeed(feedId)}>Settings</button>
 *
 * // Open modal
 * <button onClick={() => openModal('opml-import')}>Import</button>
 * ```
 */
export function useFeedNavigation(): UseFeedNavigationReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse current state from URL
  const view = (searchParams.get("view") as FeedManagementView) || "overview";
  const id = searchParams.get("id");
  const modal = searchParams.get("modal") as FeedManagementModal;
  const selectedIds = searchParams.get("selected")?.split(",").filter(Boolean) || [];
  const isInModalContext = searchParams.get("feedsModal") === "open";

  /**
   * Navigate to overview page (main feed management dashboard)
   */
  const navigateToOverview = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Clear feed management specific params
    params.delete("view");
    params.delete("id");
    params.delete("modal");
    params.delete("selected");

    if (isInModalContext) {
      params.set("feedsModal", "open");
    } else {
      params.delete("feedsModal");
    }

    const path = params.toString() ? `/?${params.toString()}` : "/";
    router.push(path);
  }, [router, searchParams, isInModalContext]);

  /**
   * Navigate to specific feed details page
   * @param feedId - The ID of the feed to view
   */
  const navigateToFeed = useCallback(
    (feedId: string) => {
      const params = new URLSearchParams(searchParams.toString());

      // Set feed management params
      params.set("view", "feed");
      params.set("id", feedId);

      // Clear modal-specific params
      params.delete("modal");
      params.delete("selected");

      if (isInModalContext) {
        params.set("feedsModal", "open");
      } else {
        params.delete("feedsModal");
      }

      const basePath = isInModalContext ? "/" : "/feeds-management";
      router.push(`${basePath}?${params.toString()}`);
    },
    [router, searchParams, isInModalContext]
  );

  /**
   * Navigate to specific category settings page
   * @param categoryId - The ID of the category to view
   */
  const navigateToCategory = useCallback(
    (categoryId: string) => {
      const params = new URLSearchParams(searchParams.toString());

      // Set feed management params
      params.set("view", "category");
      params.set("id", categoryId);

      // Clear modal-specific params
      params.delete("modal");
      params.delete("selected");

      if (isInModalContext) {
        params.set("feedsModal", "open");
      } else {
        params.delete("feedsModal");
      }

      const basePath = isInModalContext ? "/" : "/feeds-management";
      router.push(`${basePath}?${params.toString()}`);
    },
    [router, searchParams, isInModalContext]
  );

  /**
   * Open a modal overlay while preserving current view
   * @param modalType - Type of modal to open
   * @param params - Additional URL parameters for the modal
   */
  const openModal = useCallback(
    (modalType: Exclude<FeedManagementModal, null>, params?: Record<string, string>) => {
      const current = new URLSearchParams(searchParams.toString());
      current.set("modal", modalType);

      // Add any additional parameters
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          current.set(key, value);
        });
      }

      const basePath = isInModalContext ? "/" : "/feeds-management";
      router.push(`${basePath}?${current.toString()}`);
    },
    [router, searchParams, isInModalContext]
  );

  /**
   * Close the current modal and return to underlying view
   */
  const closeModal = useCallback(() => {
    const current = new URLSearchParams(searchParams.toString());
    current.delete("modal");
    current.delete("selected"); // Clean up bulk operation selection
    const basePath = isInModalContext ? "/" : "/feeds-management";
    router.push(`${basePath}?${current.toString()}`);
  }, [router, searchParams, isInModalContext]);

  /**
   * Navigate back using browser history
   * This will work naturally because we're using URL-based state
   */
  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  return {
    // Current state
    view,
    id,
    modal,
    selectedIds,

    // Navigation actions
    navigateToOverview,
    navigateToFeed,
    navigateToCategory,
    openModal,
    closeModal,
    goBack,
  };
}
