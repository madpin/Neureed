"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type TabId = "overview" | "search" | "users" | "jobs" | "storage" | "config" | "llm-config";

const FAVORITE_TABS_KEY = "admin-favorite-tabs";

/**
 * Hook for managing admin dashboard tab navigation.
 * Handles active tab state, URL synchronization, favorites, and mobile menu.
 *
 * Features:
 * - URL parameter synchronization (?tab=overview)
 * - LocalStorage persistence for favorite tabs
 * - Mobile menu state management
 * - Automatic URL updates on tab change
 *
 * @example
 * ```tsx
 * const { activeTab, handleTabChange, toggleFavorite, favoriteTabs } = useTabNavigation();
 *
 * <TabButton
 *   active={activeTab === "overview"}
 *   onClick={() => handleTabChange("overview")}
 *   isFavorite={favoriteTabs.includes("overview")}
 *   onFavoriteToggle={() => toggleFavorite("overview")}
 * />
 * ```
 */
export function useTabNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial tab from URL or use "overview" as default
  const initialTab = (searchParams.get("tab") as TabId) || "overview";

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [favoriteTabs, setFavoriteTabs] = useState<TabId[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /**
   * Load favorite tabs from localStorage on mount.
   * Runs once on component initialization.
   */
  useEffect(() => {
    const stored = localStorage.getItem(FAVORITE_TABS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setFavoriteTabs(parsed);
        }
      } catch (e) {
        console.error("Failed to parse favorite tabs:", e);
      }
    }
  }, []);

  /**
   * Sync activeTab with URL parameter.
   * Updates local state when URL changes (e.g., browser back/forward).
   */
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as TabId;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  /**
   * Handle tab change.
   * Updates both local state and URL parameter.
   * Automatically closes mobile menu.
   */
  const handleTabChange = useCallback(
    (tabId: TabId) => {
      setActiveTab(tabId);
      setMobileMenuOpen(false); // Close mobile menu on tab change

      // Update URL with new tab parameter
      const params = new URLSearchParams(searchParams);
      params.set("tab", tabId);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  /**
   * Toggle favorite status for a tab.
   * Persists to localStorage immediately.
   */
  const toggleFavorite = useCallback((tabId: TabId) => {
    setFavoriteTabs((prev) => {
      const newFavorites = prev.includes(tabId)
        ? prev.filter((id) => id !== tabId)
        : [...prev, tabId];

      // Persist to localStorage
      localStorage.setItem(FAVORITE_TABS_KEY, JSON.stringify(newFavorites));

      return newFavorites;
    });
  }, []);

  /**
   * Check if a tab is marked as favorite.
   */
  const isFavorite = useCallback(
    (tabId: TabId) => favoriteTabs.includes(tabId),
    [favoriteTabs]
  );

  /**
   * Open mobile menu.
   */
  const openMobileMenu = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  /**
   * Close mobile menu.
   */
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  /**
   * Toggle mobile menu open/closed.
   */
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  return {
    // Current state
    activeTab,
    favoriteTabs,
    mobileMenuOpen,

    // Tab navigation
    handleTabChange,
    setActiveTab, // Direct setter if needed

    // Favorites management
    toggleFavorite,
    isFavorite,

    // Mobile menu controls
    openMobileMenu,
    closeMobileMenu,
    toggleMobileMenu,
    setMobileMenuOpen, // Direct setter if needed
  };
}
