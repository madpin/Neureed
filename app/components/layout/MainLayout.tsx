"use client";

import { ReactNode, useState, useEffect } from "react";
import { SemanticSearchBar } from "@/app/components/search/SemanticSearchBar";
import { UserMenu } from "@/app/components/auth/UserMenu";
import { ArticleSortDropdown } from "@/app/components/articles/ArticleSortDropdown";
import Link from "next/link";
import type { ArticleSortOrder, ArticleSortDirection } from "@/src/lib/validations/article-validation";

interface MainLayoutProps {
  sidebar: ReactNode | ((props: { isCollapsed: boolean }) => ReactNode);
  children: ReactNode;
  sortOrder?: ArticleSortOrder;
  sortDirection?: ArticleSortDirection;
  onSortChange?: (sortOrder: ArticleSortOrder, sortDirection: ArticleSortDirection) => void;
  isLoadingArticles?: boolean;
}

export function MainLayout({ 
  sidebar, 
  children, 
  sortOrder, 
  sortDirection, 
  onSortChange,
  isLoadingArticles 
}: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Load sidebar collapsed state from preferences
  useEffect(() => {
    loadSidebarState();
  }, []);

  const loadSidebarState = async () => {
    try {
      const response = await fetch("/api/user/preferences");
      if (response.ok) {
        const data = await response.json();
        const collapsed = data.data?.preferences?.sidebarCollapsed ?? false;
        setIsSidebarCollapsed(collapsed);
      }
    } catch (error) {
      console.error("Failed to load sidebar state:", error);
    }
  };

  const toggleSidebarCollapse = async () => {
    const newCollapsed = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsed);

    // Persist to backend
    try {
      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sidebarCollapsed: newCollapsed }),
      });
    } catch (error) {
      console.error("Failed to save sidebar state:", error);
    }
  };

  const sidebarWidth = isSidebarCollapsed ? "w-20" : "w-64";

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? sidebarWidth : "w-0"
        } flex-shrink-0 overflow-hidden border-r border-border bg-background transition-all duration-300`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className={`flex items-center border-b border-border p-4 ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}>
            {!isSidebarCollapsed && (
              <h1 className="text-xl font-bold text-primary">
                NeuReed
              </h1>
            )}
            {isSidebarCollapsed && (
              <h1 className="text-xl font-bold text-primary">
                N
              </h1>
            )}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-lg p-1 hover:bg-muted lg:hidden"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {typeof sidebar === "function"
              ? sidebar({ isCollapsed: isSidebarCollapsed })
              : sidebar}
          </div>

          {/* Collapse Toggle Button */}
          <div className="border-t border-border p-4">
            <button
              onClick={toggleSidebarCollapse}
              className="flex w-full items-center gap-2 rounded-lg p-2 hover:bg-muted transition-colors"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className={`h-5 w-5 transition-transform ${isSidebarCollapsed ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
              {!isSidebarCollapsed && <span className="text-sm">Collapse</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-semibold text-foreground">
              Articles
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Semantic Search */}
            <div className="hidden md:block">
              <SemanticSearchBar />
            </div>

            {/* Sort Dropdown */}
            {sortOrder && sortDirection && onSortChange && (
              <ArticleSortDropdown
                currentSortOrder={sortOrder}
                currentSortDirection={sortDirection}
                onSortChange={onSortChange}
                isLoading={isLoadingArticles}
              />
            )}

            {/* User Menu */}
            <UserMenu />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}

