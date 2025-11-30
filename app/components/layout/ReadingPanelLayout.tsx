"use client";

import { ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { ResizableSplitPane } from "./ResizableSplitPane";
import { ArticlePanel } from "../articles/ArticlePanel";
import { useUserPreferences, useUpdatePreference } from "@/hooks/queries/use-user-preferences";

type Position = "right" | "left" | "top" | "bottom";

interface ReadingPanelLayoutProps {
  children: ReactNode | ((props: { onArticleSelect?: (articleId: string | null) => void; selectedArticleId?: string | null }) => ReactNode);
  onArticleReadStatusChange?: () => void;
}

export function ReadingPanelLayout({ children, onArticleReadStatusChange }: ReadingPanelLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Track the last URL article ID we've processed (intent) to prevent circular updates
  const intentUrlRef = useRef<string | null>(null);
  // Track the last confirmed URL article ID to handle race conditions
  const confirmedUrlRef = useRef<string | null>(null);
  // Track the last time we set an intent to debounce stale URL updates
  const lastIntentTimeRef = useRef<number>(0);

  // Track expected params to prevent reading stale window.location.search during rapid clicks
  // Initialize to null to avoid React Strict Mode double-mounting issues
  const expectedParamsRef = useRef<URLSearchParams | null>(null);

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

  // Sync with URL state (only when URL changes externally, e.g., back/forward navigation)
  useEffect(() => {
    const urlArticleId = searchParams.get("article");

    // Initialize refs on first run if needed (handles React Strict Mode double-mounting)
    if (!expectedParamsRef.current) {
      expectedParamsRef.current = new URLSearchParams(searchParams.toString());
    }

    // Initialize URL refs if they are null (first mount)
    if (intentUrlRef.current === null && confirmedUrlRef.current === null) {
      intentUrlRef.current = urlArticleId;
      confirmedUrlRef.current = urlArticleId;
    }

    // Check if the URL matches our intent
    if (urlArticleId === intentUrlRef.current) {
      // We have arrived at the intended URL
      confirmedUrlRef.current = urlArticleId;
      
      // Ensure local state matches URL (important for initial load or deep links)
      setSelectedArticleId(prev => {
        if (prev !== urlArticleId) return urlArticleId;
        return prev;
      });
      
      // Update expected params
      expectedParamsRef.current = new URLSearchParams(searchParams.toString());
      return;
    }

    // URL mismatch handling
    
    // Case 1: We are seeing the OLD URL while a navigation is in progress
    // If the current URL matches what we previously confirmed, but not what we intend,
    // it means the router hasn't finished navigating yet. We should ignore this stale state.
    if (urlArticleId === confirmedUrlRef.current) {
      return;
    }

    // Case 2: Stale URL check with timestamp
    // In dev mode (Strict Mode), effects can run multiple times and with stale data.
    // If we set an intent recently (< 1s), and the URL doesn't match it, 
    // assume it's a stale update or a race condition and ignore it.
    // This prevents "reverting" to the previous article immediately after clicking a new one.
    if (Date.now() - lastIntentTimeRef.current < 1000) {
      return;
    }

    // Case 3: External navigation (Back/Forward button) or completely new state
    // The URL is neither what we intended nor what we were at, and enough time has passed. 
    // We must accept this new reality.
    intentUrlRef.current = urlArticleId;
    confirmedUrlRef.current = urlArticleId;
    setSelectedArticleId(urlArticleId);

    // Sync expected params ref with actual params
    expectedParamsRef.current = new URLSearchParams(searchParams.toString());
  }, [searchParams]);

  // Update URL when article selection changes
  const handleArticleSelect = useCallback(
    (articleId: string | null) => {
      // Update intent to track this URL change
      intentUrlRef.current = articleId;
      lastIntentTimeRef.current = Date.now();
      
      // Optimistic update
      setSelectedArticleId(articleId);

      // Initialize ref if needed (safety check for React Strict Mode)
      if (!expectedParamsRef.current) {
        expectedParamsRef.current = new URLSearchParams(window.location.search);
      }

      // Use expectedParamsRef instead of window.location.search to avoid reading stale params during rapid clicks
      const currentParams = new URLSearchParams(expectedParamsRef.current.toString());

      if (articleId) {
        // Add article param while preserving other filters
        currentParams.set('article', articleId);
        router.push(`/?${currentParams.toString()}`);

        // Update expected params ref so next rapid click uses these params
        expectedParamsRef.current = currentParams;
      } else {
        // Remove article param but keep other filters
        currentParams.delete('article');
        const paramsString = currentParams.toString();
        router.push(paramsString ? `/?${paramsString}` : '/');

        // Update expected params ref
        expectedParamsRef.current = currentParams;
      }
    },
    [router]  // Only router in dependencies - callback is stable
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

  // Get reading mode (default to side_panel for backward compatibility)
  const readingMode = preferences?.readingMode || "side_panel";

  // Check if panel should be active (side_panel mode only)
  const isPanelActive = !isLoadingPreferences &&
                        session?.user &&
                        preferences &&
                        readingMode === "side_panel" &&
                        preferences.readingPanelEnabled &&
                        !isMobile;

  // Check if inline mode is active
  const isInlineMode = !isLoadingPreferences &&
                       session?.user &&
                       preferences &&
                       readingMode === "inline";

  // Check if standalone mode (full page navigation)
  const isStandaloneMode = !isLoadingPreferences &&
                          session?.user &&
                          preferences &&
                          readingMode === "standalone";

  // Render children with callback support
  const renderChildren = () => {
    if (typeof children === "function") {
      // Pass callbacks for side_panel and inline modes
      const shouldPassCallbacks = isPanelActive || isInlineMode;
      return children({
        onArticleSelect: shouldPassCallbacks ? handleArticleSelect : undefined,
        selectedArticleId: shouldPassCallbacks ? selectedArticleId : null
      });
    }
    return children;
  };

  // If loading preferences, show loading state
  if (isLoadingPreferences) {
    return <>{renderChildren()}</>;
  }

  // If not logged in or no preferences, show normal layout
  if (!session?.user || !preferences) {
    return <>{renderChildren()}</>;
  }

  // For inline mode, render without split pane (ArticleList will handle inline expansion)
  if (isInlineMode) {
    return <div className="h-full">{renderChildren()}</div>;
  }

  // For standalone mode, render without callbacks (forces full-page navigation)
  if (isStandaloneMode) {
    return <>{renderChildren()}</>;
  }

  // For side_panel mode: if panel disabled or mobile, show normal layout
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


