"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { FeedDetailsView } from "@/app/components/feeds/management/views/FeedDetailsView";
import { OverviewView } from "@/app/components/feeds/management/views/OverviewView";
import { CategorySettingsView } from "@/app/components/feeds/management/views/CategorySettingsView";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

type ViewType = 'feed' | 'category' | 'overview';

/**
 * Full-page route for /feeds/[id]
 * Displays when user navigates directly to this URL or refreshes the page
 * Replicates the FeedManagementModal layout but as a full page (not a modal)
 */
export default function FeedDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const feedId = params.id as string;

  const [currentView, setCurrentView] = useState<ViewType>('feed');
  const [selectedFeedId, setSelectedFeedId] = useState<string | undefined>(feedId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  const { isOpen: isMobileMenuOpen, dropdownRef, close: closeMobileMenu, toggle: toggleMobileMenu } = useMobileMenu();

  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
  };

  const handleClose = () => {
    router.push('/');
  };

  const navigateToView = (view: ViewType, newFeedId?: string, newCategoryId?: string) => {
    setCurrentView(view);
    closeMobileMenu();
    if (newFeedId !== undefined) setSelectedFeedId(newFeedId);
    if (newCategoryId !== undefined) setSelectedCategoryId(newCategoryId);
  };

  const getViewLabel = (view: ViewType) => {
    if (view === 'overview') return 'Overview';
    if (view === 'feed') return 'Feed Details';
    if (view === 'category') return 'Category';
    return 'Overview';
  };

  const navigationItems = [
    {
      view: 'overview' as ViewType,
      label: 'Overview',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      disabled: false
    },
    {
      view: 'feed' as ViewType,
      label: 'Feed Details',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      ),
      disabled: !selectedFeedId
    },
    {
      view: 'category' as ViewType,
      label: 'Category',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      disabled: !selectedCategoryId
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="rounded-lg border border-border bg-background shadow-xl overflow-hidden">
        <div className="flex h-[80vh]">
          {/* Sidebar Navigation - Desktop Only */}
          <aside className="hidden md:flex w-52 flex-shrink-0 border-r border-border bg-muted">
            <div className="flex h-full flex-col">
              <div className="border-b border-border p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Feed Management</h2>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-1.5 hover:bg-background transition-colors"
                  aria-label="Close"
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
              <nav className="flex-1 space-y-1 overflow-y-auto p-2 custom-scrollbar">
                {navigationItems.map((item) => (
                  <button
                    key={item.view}
                    onClick={() => !item.disabled && navigateToView(item.view)}
                    disabled={item.disabled}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      currentView === item.view
                        ? "bg-primary/10 text-primary dark:bg-primary/20"
                        : item.disabled
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-muted"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Mobile Navigation Dropdown */}
            <div className="md:hidden border-b border-border p-4 sticky top-0 bg-background z-10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Feed Management</h2>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-1.5 hover:bg-background transition-colors"
                  aria-label="Close"
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
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleMobileMenu}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <span>{getViewLabel(currentView)}</span>
                  <svg
                    className={`h-5 w-5 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isMobileMenuOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-border bg-background shadow-lg z-20 max-h-60 overflow-y-auto">
                    {navigationItems.map((item) => (
                      <button
                        key={item.view}
                        onClick={() => !item.disabled && navigateToView(item.view)}
                        disabled={item.disabled}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors border-b border-border last:border-b-0 ${
                          currentView === item.view
                            ? "bg-primary/10 text-primary dark:bg-primary/20"
                            : item.disabled
                            ? "cursor-not-allowed opacity-50"
                            : "hover:bg-muted"
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {currentView === 'overview' && (
              <OverviewView
                onNavigateToCategory={(catId) => navigateToView('category', undefined, catId)}
                onNavigateToFeed={(fId) => navigateToView('feed', fId, undefined)}
                onRefreshData={handleRefreshData}
                onAddFeed={() => router.push('/?action=add-feed')}
                onBrowseFeeds={() => router.push('/?action=browse-feeds')}
              />
            )}
            {currentView === 'category' && selectedCategoryId && (
              <CategorySettingsView
                categoryId={selectedCategoryId}
                onNavigateToFeed={(fId) => navigateToView('feed', fId, undefined)}
                onNavigateToOverview={() => navigateToView('overview')}
                onRefreshData={handleRefreshData}
              />
            )}
            {currentView === 'feed' && selectedFeedId && (
              <FeedDetailsView
                feedId={selectedFeedId}
                onRefreshData={handleRefreshData}
                onClose={handleClose}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
