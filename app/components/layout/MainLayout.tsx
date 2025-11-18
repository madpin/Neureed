"use client";

import { ReactNode, useState } from "react";
import { SemanticSearchBar } from "@/app/components/search/SemanticSearchBar";
import { UserMenu } from "@/app/components/auth/UserMenu";
import Link from "next/link";

interface MainLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function MainLayout({ sidebar, children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-muted">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-0"
        } flex-shrink-0 overflow-hidden border-r border-border bg-background transition-all duration-300`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <h1 className="text-xl font-bold text-primary">
              NeuReed
            </h1>
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
          <div className="flex-1 overflow-y-auto p-4">{sidebar}</div>
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

