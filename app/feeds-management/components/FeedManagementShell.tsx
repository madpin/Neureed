"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useFeedNavigation } from "@/hooks/use-feed-navigation";
import { UserMenu } from "@/app/components/auth/UserMenu";
import { NotificationBell } from "@/app/components/notifications/NotificationBell";

interface FeedManagementShellProps {
  children: ReactNode;
  variant?: "page" | "modal";
}

/**
 * Feed Management Shell Component
 *
 * Provides the layout container for all feed management views.
 * Includes header, breadcrumbs, and responsive container.
 * Uses a simplified layout without the main sidebar.
 */
export function FeedManagementShell({
  children,
  variant = "page"
}: FeedManagementShellProps) {
  const { view, goBack } = useFeedNavigation();

  // Get page title based on current view
  const getTitle = () => {
    switch (view) {
      case "feed":
        return "Feed Settings";
      case "category":
        return "Category Settings";
      case "overview":
      default:
        return "Feed Management";
    }
  };

  return (
    <div className={`flex flex-col bg-background ${
      variant === "modal" ? "h-full" : "h-screen"
    }`}>
      {/* Top Navigation Bar */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold">
            NeuReed
          </Link>
          <span className="text-muted-foreground">|</span>
          <span className="text-sm text-muted-foreground">Feed Management</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Page Header */}
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="mx-auto max-w-7xl">
            {/* Breadcrumbs / Back button */}
            {view !== "overview" && (
              <button
                onClick={goBack}
                className="mb-2 flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  className="mr-1 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Overview
              </button>
            )}

            {/* Page Title */}
            <h1 className="text-2xl font-bold text-foreground">{getTitle()}</h1>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
