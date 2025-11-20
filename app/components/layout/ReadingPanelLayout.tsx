"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { ResizableSplitPane } from "./ResizableSplitPane";
import { ArticlePanel } from "../articles/ArticlePanel";

type Position = "right" | "left" | "top" | "bottom";

interface ReadingPanelLayoutProps {
  children: ReactNode | ((props: { onArticleSelect?: (articleId: string) => void }) => ReactNode);
  onArticleReadStatusChange?: () => void;
}

interface UserPreferences {
  readingPanelEnabled: boolean;
  readingPanelPosition: Position;
  readingPanelSize: number;
}

export function ReadingPanelLayout({ children, onArticleReadStatusChange }: ReadingPanelLayoutProps) {
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
          <ArticlePanel 
            articleId={selectedArticleId} 
            onClose={handleClosePanel}
            onReadStatusChange={onArticleReadStatusChange}
          />
        }
      >
        {renderChildren()}
      </ResizableSplitPane>
    </div>
  );
}


