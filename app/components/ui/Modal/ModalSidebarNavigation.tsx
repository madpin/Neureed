"use client";

import { ReactNode } from "react";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

export interface ModalSidebarNavigationItem<T extends string = string> {
  id: T;
  label: string;
  icon?: ReactNode;
}

export interface ModalSidebarNavigationProps<T extends string = string> {
  items: ModalSidebarNavigationItem<T>[];
  currentItem: T;
  onNavigate: (item: T) => void;
}

/**
 * Reusable sidebar/dropdown navigation for multi-view modals
 *
 * Features:
 * - Desktop: Vertical sidebar with navigation buttons
 * - Mobile: Dropdown menu
 * - Active state highlighting
 * - Optional icon support
 * - Accessible keyboard navigation
 *
 * @example
 * ```tsx
 * <ModalSidebarNavigation
 *   items={[
 *     { id: 'profile', label: 'Profile', icon: <UserIcon /> },
 *     { id: 'settings', label: 'Settings', icon: <SettingsIcon /> }
 *   ]}
 *   currentItem={currentView}
 *   onNavigate={navigateToView}
 * />
 * ```
 */
export function ModalSidebarNavigation<T extends string = string>({
  items,
  currentItem,
  onNavigate,
}: ModalSidebarNavigationProps<T>) {
  const { isOpen, dropdownRef, close, toggle } = useMobileMenu();

  const currentLabel = items.find(item => item.id === currentItem)?.label || '';

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-52 flex-shrink-0 border-r border-border bg-muted">
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                currentItem === item.id
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "hover:bg-muted-foreground/10"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Dropdown */}
      <div className="md:hidden border-b border-border p-4 flex-shrink-0">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggle}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <span>{currentLabel}</span>
            <svg
              className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-border bg-background shadow-lg z-10 max-h-80 overflow-y-auto">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    close();
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors border-b border-border last:border-b-0 ${
                    currentItem === item.id
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
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
    </>
  );
}
