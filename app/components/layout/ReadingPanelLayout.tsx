"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { ResizableSplitPane } from "./ResizableSplitPane";
import { ArticlePanel } from "../articles/ArticlePanel";

type Position = "right" | "left" | "top" | "bottom";

interface ReadingPanelLayoutProps {
  children: ReactNode | ((props: { onArticleSelect?: (articleId: string) => void }) => ReactNode);
}

interface UserPreferences {
  readingPanelEnabled: boolean;
  readingPanelPosition: Position;
  readingPanelSize: number;
}

export function ReadingPanelLayout({ children }: ReadingPanelLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!session?.user) {
        setIsLoadingPreferences(false);
        return;
      }

      try {
        const response = await fetch("/api/user/preferences");
        if (response.ok) {
          const data = await response.json();
          const prefs = data.data?.preferences;
          if (prefs) {
            setPreferences({
              readingPanelEnabled: prefs.readingPanelEnabled ?? false,
              readingPanelPosition: prefs.readingPanelPosition ?? "right",
              readingPanelSize: prefs.readingPanelSize ?? 50,
            });
          }
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    loadPreferences();
  }, [session]);

  // Sync with URL state
  useEffect(() => {
    const articleId = searchParams.get("article");
    if (articleId && articleId !== selectedArticleId) {
      setSelectedArticleId(articleId);
    } else if (!articleId && selectedArticleId) {
      setSelectedArticleId(null);
    }
  }, [searchParams, selectedArticleId]);

  // Update URL when article selection changes
  const handleArticleSelect = useCallback(
    (articleId: string | null) => {
      console.log("[ReadingPanelLayout] Article selected:", articleId);
      setSelectedArticleId(articleId);

      // Get current query params to preserve feed/category filters
      const currentParams = new URLSearchParams(window.location.search);
      
      if (articleId) {
        // Add article param while preserving other filters
        currentParams.set('article', articleId);
        router.push(`/?${currentParams.toString()}`);
      } else {
        // Remove article param but keep other filters
        currentParams.delete('article');
        const paramsString = currentParams.toString();
        router.push(paramsString ? `/?${paramsString}` : '/');
      }
    },
    [router]
  );

  const handleClosePanel = useCallback(() => {
    handleArticleSelect(null);
  }, [handleArticleSelect]);

  // Debounced save of panel size
  const handleResize = useCallback(
    async (newSize: number) => {
      if (!session?.user) return;

      try {
        await fetch("/api/user/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            readingPanelSize: newSize,
          }),
        });

        setPreferences((prev) => prev ? { ...prev, readingPanelSize: newSize } : null);
      } catch (error) {
        console.error("Failed to save panel size:", error);
      }
    },
    [session]
  );

  const handlePositionChange = useCallback(
    async (newPosition: Position) => {
      if (!session?.user) return;

      try {
        await fetch("/api/user/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            readingPanelPosition: newPosition,
          }),
        });

        setPreferences((prev) => prev ? { ...prev, readingPanelPosition: newPosition } : null);
      } catch (error) {
        console.error("Failed to save panel position:", error);
      }
    },
    [session]
  );

  // Check if panel should be active
  const isPanelActive = !isLoadingPreferences && 
                        session?.user && 
                        preferences && 
                        preferences.readingPanelEnabled && 
                        !isMobile;

  // Render children with callback support
  const renderChildren = () => {
    if (typeof children === "function") {
      // Only pass the callback if panel is active
      return children({ 
        onArticleSelect: isPanelActive ? handleArticleSelect : undefined 
      });
    }
    return children;
  };

  // If loading preferences, show loading state
  if (isLoadingPreferences) {
    console.log("[ReadingPanelLayout] Loading preferences...");
    return <>{renderChildren()}</>;
  }

  // If not logged in, no preferences, panel disabled, or mobile, show normal layout
  if (!isPanelActive) {
    console.log("[ReadingPanelLayout] Panel disabled:", {
      hasSession: !!session?.user,
      hasPreferences: !!preferences,
      panelEnabled: preferences?.readingPanelEnabled,
      isMobile,
    });
    return <>{renderChildren()}</>;
  }

  console.log("[ReadingPanelLayout] Panel active:", {
    selectedArticleId,
    position: preferences.readingPanelPosition,
    size: preferences.readingPanelSize,
  });

  // If panel enabled but no article selected, show normal layout
  if (!selectedArticleId) {
    return <div className="h-full">{renderChildren()}</div>;
  }

  // Show split pane with article panel
  return (
    <div className="h-full">
      <ResizableSplitPane
        position={preferences.readingPanelPosition}
        size={preferences.readingPanelSize}
        onResize={handleResize}
        panel={
          <div className="relative h-full">
            <ArticlePanel articleId={selectedArticleId} onClose={handleClosePanel} />
            
            {/* Position switcher */}
            <div className="absolute bottom-4 right-4 z-10">
              <PositionSwitcher
                currentPosition={preferences.readingPanelPosition}
                onChange={handlePositionChange}
              />
            </div>
          </div>
        }
      >
        {renderChildren()}
      </ResizableSplitPane>
    </div>
  );
}

interface PositionSwitcherProps {
  currentPosition: Position;
  onChange: (position: Position) => void;
}

function PositionSwitcher({ currentPosition, onChange }: PositionSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positions: { value: Position; label: string; icon: ReactNode }[] = [
    {
      value: "right",
      label: "Right",
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <rect x="2" y="4" width="10" height="16" rx="1" />
          <rect x="14" y="4" width="8" height="16" rx="1" opacity="0.5" />
        </svg>
      ),
    },
    {
      value: "left",
      label: "Left",
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <rect x="2" y="4" width="8" height="16" rx="1" opacity="0.5" />
          <rect x="12" y="4" width="10" height="16" rx="1" />
        </svg>
      ),
    },
    {
      value: "top",
      label: "Top",
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="8" rx="1" opacity="0.5" />
          <rect x="2" y="12" width="20" height="10" rx="1" />
        </svg>
      ),
    },
    {
      value: "bottom",
      label: "Bottom",
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="10" rx="1" />
          <rect x="2" y="14" width="20" height="8" rx="1" opacity="0.5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg border border-gray-300 bg-white p-2 shadow-lg hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
        title="Change panel position"
      >
        <svg
          className="h-5 w-5 text-gray-700 dark:text-gray-300"
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

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute bottom-full right-0 mb-2 z-50 w-40 rounded-lg border border-gray-300 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800">
            <div className="p-1">
              {positions.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => {
                    onChange(pos.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    currentPosition === pos.value
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {pos.icon}
                  <span>{pos.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

