"use client";

import { ReactNode, useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserMenu } from "@/app/components/auth/UserMenu";
import { ArticleSortDropdown } from "@/app/components/articles/ArticleSortDropdown";
import { NotificationBell } from "@/app/components/notifications/NotificationBell";
import { SavedSearchModal } from "@/app/components/saved-searches/SavedSearchModal";
import { SavedSearchOnboarding } from "@/app/components/saved-searches/SavedSearchOnboarding";
import type { ArticleSortOrder, ArticleSortDirection } from "@/lib/validations/article-validation";
import { useUserPreferences, useUpdatePreference } from "@/hooks/queries/use-user-preferences";
import type { SavedSearch } from "@/hooks/queries/use-saved-searches";

interface MainLayoutProps {
  sidebar: ReactNode | ((props: {
    isCollapsed: boolean;
    closeMobileMenu: () => void;
    onOpenCreateModal: () => void;
    onOpenEditModal: (search: SavedSearch) => void;
    onOpenOnboarding: () => void;
  }) => ReactNode);
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: preferences } = useUserPreferences();
  const updatePreference = useUpdatePreference();

  const isSidebarCollapsed = preferences?.sidebarCollapsed ?? false;
  const storedSidebarWidth = preferences?.sidebarWidth ?? 20;

  // Track expected params to avoid navigation loops in React Strict Mode
  const expectedParamsRef = useRef<URLSearchParams | null>(null);

  // Local state for resizing
  const [currentSidebarWidth, setCurrentSidebarWidth] = useState(storedSidebarWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(storedSidebarWidth); // Track current width for saving

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Saved search modal state
  const [isSaveSearchModalOpen, setIsSaveSearchModalOpen] = useState(false);
  const [editingSavedSearch, setEditingSavedSearch] = useState<SavedSearch | undefined>();
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  // Saved search modal handlers
  const handleOpenCreateModal = useCallback(() => {
    setEditingSavedSearch(undefined);
    setIsSaveSearchModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((search: SavedSearch) => {
    setEditingSavedSearch(search);
    setIsSaveSearchModalOpen(true);
  }, []);

  const handleOpenOnboarding = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  const handleCompleteOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem('neureed_saved_search_onboarding_seen', 'true');
    // Open create modal after completing onboarding
    setEditingSavedSearch(undefined);
    setIsSaveSearchModalOpen(true);
  }, []);

  // Initialize and sync ref with searchParams
  useEffect(() => {
    expectedParamsRef.current = new URLSearchParams(searchParams.toString());
  }, [searchParams]);

  const pushWithPreservedParams = useCallback((updates: Record<string, string | null>) => {
    // Use ref instead of searchParams directly to avoid dependency that causes navigation loops
    if (!expectedParamsRef.current) {
      expectedParamsRef.current = new URLSearchParams(searchParams.toString());
    }

    const currentParams = new URLSearchParams(expectedParamsRef.current.toString());

    // Apply updates (null means delete the param)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    });

    const paramsString = currentParams.toString();
    router.push(paramsString ? `/?${paramsString}` : '/');

    // Update ref with new expected params
    expectedParamsRef.current = currentParams;
  }, [router, searchParams]);

  // Search handlers
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      pushWithPreservedParams({ search: searchQuery.trim() });
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      // Focus input when opening
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  // Focus input when search opens on desktop
  useEffect(() => {
    if (isSearchOpen && !isMobile && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen, isMobile]);

  // Calculate actual width (round to avoid sub-pixel issues)
  const actualSidebarWidth = Math.round(currentSidebarWidth);

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
          ...(!isMobile ? { width: isSidebarCollapsed ? "80px" : `${actualSidebarWidth}%` } : {}),
        }}
        className={`
          flex-shrink-0 overflow-hidden border-r border-border bg-background
          fixed inset-y-0 left-0 z-[70] ${isMobile ? "w-80" : "w-80 md:w-auto"}
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
              ? sidebar({
                  isCollapsed: isMobile ? false : isSidebarCollapsed,
                  closeMobileMenu: () => setIsMobileMenuOpen(false),
                  onOpenCreateModal: handleOpenCreateModal,
                  onOpenEditModal: handleOpenEditModal,
                  onOpenOnboarding: handleOpenOnboarding,
                })
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
            className="hidden md:block absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors group z-50"
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

            {/* Semantic Search */}
            <div className="relative flex items-center">
              {/* Desktop: Always visible input that expands */}
              <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center">
                <div className={`transition-all duration-200 ${isSearchOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      // Close if empty after a short delay
                      setTimeout(() => {
                        if (!searchQuery.trim()) setIsSearchOpen(false);
                      }, 200);
                    }}
                    placeholder="Semantic search..."
                    className="w-full px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  type={isSearchOpen ? "submit" : "button"}
                  onClick={isSearchOpen ? undefined : handleSearchToggle}
                  disabled={isSearchOpen && searchQuery.trim().length < 2}
                  className="p-2 hover:bg-muted rounded-lg transition-colors ml-2"
                  title="Semantic Search (AI-powered)"
                  aria-label="Semantic Search"
                >
                  <svg
                    className="h-5 w-5 text-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
                {/* Save Search Button */}
                {isSearchOpen && searchQuery.trim().length >= 2 && (
                  <button
                    type="button"
                    onClick={() => setIsSaveSearchModalOpen(true)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors ml-1"
                    title="Save this search"
                    aria-label="Save Search"
                  >
                    <svg
                      className="h-5 w-5 text-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </button>
                )}
              </form>

              {/* Mobile: Button opens modal */}
              <button
                onClick={handleSearchToggle}
                className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
                title="Semantic Search"
                aria-label="Semantic Search"
              >
                <svg
                  className="h-5 w-5 text-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* User Menu */}
            <UserMenu />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>

      {/* Mobile Search Modal */}
      {isSearchOpen && isMobile && (
        <div className="fixed inset-0 z-[80] bg-black/50 md:hidden" onClick={() => setIsSearchOpen(false)}>
          <div className="absolute top-0 left-0 right-0 bg-background border-b border-border p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Close search"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <form onSubmit={handleSearchSubmit} className="flex-1">
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What are you looking for?"
                  autoFocus
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </form>
              <button
                onClick={handleSearchSubmit}
                disabled={searchQuery.trim().length < 2}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Search
              </button>
            </div>
            <p className="text-xs text-foreground/60 mt-2">
              🤖 AI-powered semantic search - finds relevant articles by meaning, not just keywords
            </p>
          </div>
        </div>
      )}

      {/* Saved Search Modal */}
      <SavedSearchModal
        isOpen={isSaveSearchModalOpen}
        onClose={() => {
          setIsSaveSearchModalOpen(false);
          setEditingSavedSearch(undefined);
        }}
        initialQuery={searchQuery}
        savedSearch={editingSavedSearch}
      />

      {/* Onboarding Modal */}
      <SavedSearchOnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleCompleteOnboarding}
      />
    </div>
  );
}

