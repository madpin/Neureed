import { useState, useEffect, useRef, useCallback } from "react";

export interface UseInfiniteScrollOptions {
  initialPage?: number;
  threshold?: number; // Distance from bottom in pixels to trigger load
  enabled?: boolean; // Whether auto-load is enabled
}

export interface UseInfiniteScrollReturn {
  page: number;
  isLoading: boolean;
  hasMore: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement>;
  loadMore: () => void;
  reset: () => void;
  setHasMore: (hasMore: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
}

/**
 * Custom hook for infinite scroll functionality
 * Supports both auto-load (via intersection observer) and manual "Load More" button
 */
export function useInfiniteScroll(
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const {
    initialPage = 1,
    threshold = 500,
    enabled = true,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isLoadingRef = useRef(isLoading);
  const hasMoreRef = useRef(hasMore);
  
  // Keep refs in sync with state
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);
  
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  // Load more handler
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [isLoading, hasMore]);

  // Reset to initial state
  const reset = useCallback(() => {
    setPage(initialPage);
    setHasMore(false);
    setIsLoading(false);
  }, [initialPage]);

  // Set up intersection observer for auto-load
  useEffect(() => {
    if (!enabled || !loadMoreRef.current) {
      // Disconnect if disabled
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      return;
    }

    // Only create observer once
    if (!observerRef.current) {
      console.log('[IntersectionObserver] Creating new observer');
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const target = entries[0];
          console.log('[IntersectionObserver] Triggered:', { 
            isIntersecting: target.isIntersecting, 
            isLoading: isLoadingRef.current,
            hasMore: hasMoreRef.current,
          });
          // Check if intersecting, not loading, and has more pages (use refs to avoid stale closure)
          if (target.isIntersecting && !isLoadingRef.current && hasMoreRef.current) {
            console.log('[IntersectionObserver] Loading next page');
            setPage((prev) => {
              console.log('[IntersectionObserver] Page increment:', prev, '->', prev + 1);
              return prev + 1;
            });
          }
        },
        {
          root: null,
          rootMargin: `${threshold}px`,
          threshold: 0.1,
        }
      );

      // Observe the target element
      observerRef.current.observe(loadMoreRef.current);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [enabled, threshold]);

  return {
    page,
    isLoading,
    hasMore,
    loadMoreRef: loadMoreRef as React.RefObject<HTMLDivElement>,
    loadMore,
    reset,
    setHasMore,
    setIsLoading,
  };
}

