import type { ReactNode } from "react";
import type { TabId } from "../../hooks/use-tab-navigation";

export interface Tab {
  id: TabId;
  label: string;
  icon: ReactNode;
}

export interface TabNavigationProps {
  /** List of available tabs */
  tabs: Tab[];
  /** Currently active tab */
  activeTab: TabId;
  /** List of favorite tab IDs */
  favoriteTabs: TabId[];
  /** Callback when tab is clicked */
  onTabChange: (tabId: TabId) => void;
  /** Callback when favorite is toggled */
  onToggleFavorite: (tabId: TabId) => void;
  /** Mobile menu open state */
  mobileMenuOpen: boolean;
  /** Callback to toggle mobile menu */
  onToggleMobileMenu: () => void;
}

/**
 * TabNavigation component displays vertical tab navigation with favorites support.
 * Responsive: shows dropdown on mobile, sidebar on desktop.
 *
 * @example
 * ```tsx
 * <TabNavigation
 *   tabs={tabs}
 *   activeTab={activeTab}
 *   favoriteTabs={favoriteTabs}
 *   onTabChange={handleTabChange}
 *   onToggleFavorite={toggleFavorite}
 *   mobileMenuOpen={mobileMenuOpen}
 *   onToggleMobileMenu={toggleMobileMenu}
 * />
 * ```
 */
export function TabNavigation({
  tabs,
  activeTab,
  favoriteTabs,
  onTabChange,
  onToggleFavorite,
  mobileMenuOpen,
  onToggleMobileMenu,
}: TabNavigationProps) {
  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={onToggleMobileMenu}
          className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted w-full justify-between"
        >
          <span className="flex items-center gap-2">
            {tabs.find((t) => t.id === activeTab)?.icon}
            {tabs.find((t) => t.id === activeTab)?.label}
          </span>
          <svg
            className={`h-5 w-5 transition-transform ${mobileMenuOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Vertical Tab Navigation (Desktop) / Dropdown Menu (Mobile) */}
      <div
        className={`${mobileMenuOpen ? "block" : "hidden"} md:block w-full md:w-56 flex-shrink-0`}
      >
        <nav className="space-y-1 rounded-lg border border-border bg-background p-2">
          {/* Favorite tabs section */}
          {favoriteTabs.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                Favorites
              </div>
              {tabs
                .filter((tab) => favoriteTabs.includes(tab.id))
                .map((tab) => (
                  <div key={`fav-${tab.id}`} className="relative group">
                    <button
                      onClick={() => onTabChange(tab.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-600 text-white"
                          : "text-foreground/80 hover:bg-muted"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(tab.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove from favorites"
                    >
                      <svg className="h-4 w-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </button>
                  </div>
                ))}
              <div className="my-2 border-t border-border" />
            </>
          )}

          {/* All tabs */}
          {tabs
            .filter((tab) => !favoriteTabs.includes(tab.id))
            .map((tab) => (
              <div key={tab.id} className="relative group">
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-foreground/80 hover:bg-muted"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(tab.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Add to favorites"
                >
                  <svg
                    className="h-4 w-4 text-foreground/30 hover:text-yellow-500 fill-current transition-colors"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </button>
              </div>
            ))}
        </nav>
      </div>
    </>
  );
}
