"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { ResizableSplitPane } from "./ResizableSplitPane";
import { ArticlePanel } from "../articles/ArticlePanel";
import { useUserPreferences, useUpdatePreference } from "@/hooks/queries/use-user-preferences";

type Position = "right" | "left" | "top" | "bottom";

interface ReadingPanelLayoutProps {
  children: ReactNode | ((props: { onArticleSelect?: (articleId: string) => void }) => ReactNode);
  onArticleReadStatusChange?: () => void;
}

export function ReadingPanelLayout({ children, onArticleReadStatusChange }: ReadingPanelLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Use React Query for preferences
  const { data: preferences, isLoading: isLoadingPreferences } = useUserPreferences();
  const updatePreference = useUpdatePreference();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
    (newSize: number) => {
      if (!session?.user) return;
      updatePreference.mutate({ readingPanelSize: newSize });
    },
    [session, updatePreference]
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
    return <>{renderChildren()}</>;
  }

  // If not logged in, no preferences, panel disabled, or mobile, show normal layout
  if (!isPanelActive) {
    return <>{renderChildren()}</>;
  }

  // If panel enabled but no article selected, show normal layout
  if (!selectedArticleId) {
    return <div className="h-full">{renderChildren()}</div>;
  }

  // Safely cast preferences to required types since we verified they exist in isPanelActive
  const panelPosition = (preferences?.readingPanelPosition as Position) || "right";
  const panelSize = preferences?.readingPanelSize || 50;

  // Show split pane with article panel
  return (
    <div className="h-full">
      <ResizableSplitPane
        position={panelPosition}
        size={panelSize}
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


