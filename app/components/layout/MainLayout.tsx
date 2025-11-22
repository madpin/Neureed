"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { UserMenu } from "@/app/components/auth/UserMenu";
import { ArticleSortDropdown } from "@/app/components/articles/ArticleSortDropdown";
import { NotificationBell } from "@/app/components/notifications/NotificationBell";
import type { ArticleSortOrder, ArticleSortDirection } from "@/lib/validations/article-validation";
import { useUserPreferences, useUpdatePreference } from "@/hooks/queries/use-user-preferences";

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
  const { data: preferences } = useUserPreferences();
  const updatePreference = useUpdatePreference();

  const isSidebarCollapsed = preferences?.sidebarCollapsed ?? false;
  const storedSidebarWidth = preferences?.sidebarWidth ?? 20;

  // Local state for resizing
  const [currentSidebarWidth, setCurrentSidebarWidth] = useState(storedSidebarWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(storedSidebarWidth); // Track current width for saving

  // Detect if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on mount
    checkMobile();
    
    // Check on resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update local state when preferences change from server (but not while dragging)
  // Note: We don't include isDragging in deps to avoid resetting width when drag ends
  useEffect(() => {
    if (!isDragging) {
      setCurrentSidebarWidth(storedSidebarWidth);
      widthRef.current = storedSidebarWidth;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedSidebarWidth]);

  // Handle resize dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const totalWidth = rect.width;
      const distanceFromLeft = e.clientX - rect.left;
      let newWidth = (distanceFromLeft / totalWidth) * 100;

      // Clamp between 10% and 40%
      newWidth = Math.max(10, Math.min(40, newWidth));
      setCurrentSidebarWidth(newWidth);
      widthRef.current = newWidth; // Update ref immediately
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Save to preferences using the ref value (has the latest width, rounded to integer)
      const roundedWidth = Math.round(widthRef.current);
      updatePreference.mutate({ sidebarWidth: roundedWidth });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, updatePreference]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const toggleSidebarCollapse = () => {
    updatePreference.mutate({ sidebarCollapsed: !isSidebarCollapsed });
  };

  // Calculate actual width based on collapsed state (round to avoid sub-pixel issues)
  const actualSidebarWidth = isSidebarCollapsed ? 5 : Math.round(currentSidebarWidth);

  return (
    <div ref={containerRef} className="flex h-screen overflow-hidden bg-muted">
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ 
          // Only apply percentage width on desktop
          ...(!isMobile ? { width: `${actualSidebarWidth}%` } : {}),
        }}
        className={`
          flex-shrink-0 overflow-hidden border-r border-border bg-background
          fixed inset-y-0 left-0 z-[70] w-80
          md:relative md:translate-x-0 md:z-auto
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-center border-b border-border p-4">
            <h1 className="text-xl font-bold text-primary">
              {/* On mobile, always show full name. On desktop, respect collapse state */}
              <span className="md:hidden">NeuReed</span>
              <span className="hidden md:inline">{isSidebarCollapsed ? "N" : "NeuReed"}</span>
            </h1>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {typeof sidebar === "function"
              ? sidebar({ isCollapsed: isMobile ? false : isSidebarCollapsed })
              : sidebar}
          </div>

          {/* Collapse Toggle Button - Desktop Only */}
          <div className="hidden md:block border-t border-border p-4">
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

        {/* Resize Handle - Desktop Only */}
        {!isSidebarCollapsed && (
          <div
            onMouseDown={handleResizeStart}
            className="hidden md:block absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors group z-10"
            style={{
              backgroundColor: isDragging ? "rgb(59, 130, 246)" : "transparent"
            }}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
          >
            <div className="absolute right-0 top-0 bottom-0 w-1 group-hover:bg-blue-500" />
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden relative z-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Hamburger Menu Button - Mobile Only */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
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

            <h2 className="text-lg font-semibold text-foreground">
              Articles
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            {sortOrder && sortDirection && onSortChange && (
              <ArticleSortDropdown
                currentSortOrder={sortOrder}
                currentSortDirection={sortDirection}
                onSortChange={onSortChange}
                isLoading={isLoadingArticles}
              />
            )}

            {/* Notification Bell */}
            <NotificationBell />

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

