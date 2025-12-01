"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/use-auth";

// Layout components
import { DashboardHeader } from "./components/layout/DashboardHeader";
import { TabNavigation } from "./components/layout/TabNavigation";

// Shared components
import { QuickActionsBar } from "./components/shared/QuickActionsBar";

// Tab components
import { OverviewTab } from "./components/tabs/OverviewTab";
import { SearchTab } from "./components/tabs/SearchTab";
import { UsersTab } from "./components/tabs/UsersTab";
import { JobsTab } from "./components/tabs/JobsTab";
import { StorageTab } from "./components/tabs/StorageTab";
import { ConfigTab } from "./components/tabs/ConfigTab";
import { LLMConfigTab } from "./components/tabs/LLMConfigTab";
import { MemoryTab } from "./components/tabs/MemoryTab";

// Custom hooks
import { useDashboardData } from "./hooks/use-dashboard-data";
import { useAdminActions } from "./hooks/use-admin-actions";
import { useTabNavigation } from "./hooks/use-tab-navigation";

/**
 * AdminDashboardPage - Refactored admin dashboard using extracted components and hooks.
 *
 * Structure:
 * - DashboardHeader: Page title and navigation
 * - TabNavigation: Sidebar with tabs and favorites
 * - QuickActionsBar: Common admin actions (refresh, generate, cleanup, clear cache)
 * - Tab Components: Separate components for each tab (Overview, Search, Users, Jobs, Storage, Config, LLM Config)
 *
 * Hooks:
 * - useDashboardData: Consolidates all data fetching (12 React Query hooks)
 * - useAdminActions: Consolidates all mutation handlers (5 mutations)
 * - useTabNavigation: Manages tab state, URL sync, and favorites
 */
export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isLoadingAuth } = useIsAdmin();

  // State for dangerous action confirmations
  const [pendingDatabaseReset, setPendingDatabaseReset] = useState(false);

  // Data fetching: consolidates all React Query hooks
  const { data } = useDashboardData(30000); // 30s polling

  // Action handlers: consolidates all mutations
  const {
    handleClearCache,
    handleGenerateEmbeddings,
    handleRefreshFeeds,
    handleCleanup,
    handleDatabaseReset: handleDatabaseResetAction,
    isLoading: actionLoading,
  } = useAdminActions();

  // Tab navigation: state management, URL sync, favorites
  const {
    activeTab,
    favoriteTabs,
    mobileMenuOpen,
    handleTabChange,
    toggleFavorite,
    isFavorite,
    closeMobileMenu,
    toggleMobileMenu,
  } = useTabNavigation();

  // Redirect non-admin users
  useEffect(() => {
    if (!isLoadingAuth && !isAdmin) {
      router.push("/");
      toast.error("Access denied. Admin privileges required.");
    }
  }, [isAdmin, isLoadingAuth, router]);

  // Wrapper for database reset with confirmation state
  const handleDatabaseReset = async () => {
    if (!pendingDatabaseReset) {
      setPendingDatabaseReset(true);
      setTimeout(() => setPendingDatabaseReset(false), 5000);
      return;
    }

    setPendingDatabaseReset(false);
    await handleDatabaseResetAction();
  };

  // Don't render dashboard for non-admin users
  if (!isAdmin && !isLoadingAuth) {
    return null;
  }

  // Tab definitions
  const tabs = [
    {
      id: "overview" as const,
      label: "Overview",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: "search" as const,
      label: "Search",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
    },
    {
      id: "users" as const,
      label: "Users",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      id: "jobs" as const,
      label: "Jobs",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "storage" as const,
      label: "Storage",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      ),
    },
    {
      id: "config" as const,
      label: "Configuration",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      id: "llm-config" as const,
      label: "LLM Config",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
    },
    {
      id: "memory" as const,
      label: "Memory",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-[1600px]">
        {/* Header */}
        <DashboardHeader />

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            favoriteTabs={favoriteTabs}
            onTabChange={handleTabChange}
            onToggleFavorite={toggleFavorite}
            isFavorite={isFavorite}
            mobileMenuOpen={mobileMenuOpen}
            onToggleMobileMenu={toggleMobileMenu}
            onCloseMobileMenu={closeMobileMenu}
          />

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Quick Actions Bar (Always visible) */}
            <QuickActionsBar
              onRefreshFeeds={handleRefreshFeeds}
              onGenerateEmbeddings={handleGenerateEmbeddings}
              onCleanup={handleCleanup}
              onClearCache={handleClearCache}
              loading={actionLoading}
            />

            {/* Tab Content */}
            {activeTab === "overview" && (
              <OverviewTab
                metrics={data.metrics}
                cacheStats={data.cacheStats}
              />
            )}

            {activeTab === "search" && (
              <SearchTab
                embeddingStats={data.embeddingStats}
                embeddingConfig={data.embeddingConfig}
                adminSettings={data.adminSettings}
              />
            )}

            {activeTab === "users" && <UsersTab />}

            {activeTab === "jobs" && (
              <JobsTab jobs={data.cronHistory?.jobs || []} />
            )}

            {activeTab === "storage" && (
              <StorageTab
                postgres={data.postgresStats}
                redis={data.redisStats}
                onClearCache={handleClearCache}
                onDatabaseReset={handleDatabaseReset}
                pendingDatabaseReset={pendingDatabaseReset}
              />
            )}

            {activeTab === "config" && <ConfigTab />}

            {activeTab === "llm-config" && <LLMConfigTab />}

            {activeTab === "memory" && <MemoryTab refreshInterval={10000} />}
          </div>
        </div>
      </div>
    </div>
  );
}
