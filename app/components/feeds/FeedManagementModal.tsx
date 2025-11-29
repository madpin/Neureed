"use client";

import { useState } from "react";
import { Modal, ModalBody } from "@/app/components/ui";
import { useMobileMenu } from "@/hooks/use-mobile-menu";
import { OverviewView } from "./management/views/OverviewView";
import { CategorySettingsView } from "./management/views/CategorySettingsView";
import { FeedDetailsView } from "./management/views/FeedDetailsView";

type ViewType = 'feed' | 'category' | 'overview';

export interface FeedManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: ViewType;
  feedId?: string;
  categoryId?: string;
  onRefreshData?: () => void;
  onAddFeed?: () => void;
  onBrowseFeeds?: () => void;
}

export function FeedManagementModal({
  isOpen,
  onClose,
  initialView = 'overview',
  feedId: initialFeedId,
  categoryId: initialCategoryId,
  onRefreshData,
  onAddFeed,
  onBrowseFeeds,
}: FeedManagementModalProps) {

  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [feedId, setFeedId] = useState<string | undefined>(initialFeedId);
  const [categoryId, setCategoryId] = useState<string | undefined>(initialCategoryId);

  // Custom hook for mobile menu management
  const { isOpen: isMobileMenuOpen, dropdownRef, close: closeMobileMenu, toggle: toggleMobileMenu } = useMobileMenu();

  // Navigate to a different view
  const navigateToView = (view: ViewType, newFeedId?: string, newCategoryId?: string) => {
    setCurrentView(view);
    closeMobileMenu();
    if (newFeedId !== undefined) setFeedId(newFeedId);
    if (newCategoryId !== undefined) setCategoryId(newCategoryId);
  };

  const handleClose = () => {
    onClose();
  };

  // Get label for current view
  const getViewLabel = (view: ViewType) => {
    if (view === 'overview') return 'Overview';
    if (view === 'feed') return 'Feed Details';
    if (view === 'category') return 'Category';
    return 'Overview';
  };

  // Navigation items
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
      disabled: !feedId
    },
    {
      view: 'category' as ViewType,
      label: 'Category',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      disabled: !categoryId
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" closeOnOutsideClick={true}>
      <ModalBody padding={false} className="flex h-[80vh] overflow-hidden">
        {/* Sidebar Navigation - Desktop Only */}
        <aside className="hidden md:flex w-52 min-w-[13rem] flex-shrink-0 border-r border-border bg-muted">
          <div className="flex h-full flex-col">
            <div className="border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Feed Management</h2>
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 hover:bg-background transition-colors"
                aria-label="Close modal"
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
                aria-label="Close modal"
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

              {/* Dropdown Menu */}
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
              onRefreshData={onRefreshData}
              onAddFeed={onAddFeed}
              onBrowseFeeds={onBrowseFeeds}
            />
          )}
          {currentView === 'category' && categoryId && (
            <CategorySettingsView
              categoryId={categoryId}
              onNavigateToFeed={(fId) => navigateToView('feed', fId, undefined)}
              onNavigateToOverview={() => navigateToView('overview')}
              onRefreshData={onRefreshData}
            />
          )}
          {currentView === 'feed' && feedId && (
            <FeedDetailsView
              feedId={feedId}
              onRefreshData={onRefreshData}
              onClose={onClose}
            />
          )}
        </main>
      </ModalBody>
    </Modal>
  );
}
