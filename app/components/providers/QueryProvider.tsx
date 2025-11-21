"use client";

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

/**
 * QueryProvider component that wraps the application with React Query context.
 *
 * Configuration:
 * - Default stale time: 60 seconds (data stays fresh for 1 minute)
 * - Cache time: 5 minutes (unused data is garbage collected after 5 minutes)
 * - Retry: 1 attempt (don't spam failed requests)
 * - Refetch on window focus: true (keep data fresh when user returns)
 * - Refetch on reconnect: true (update data after network reconnection)
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            // Log errors for monitoring (could send to error tracking service)
            console.error("Query error:", error, "Query key:", query.queryKey);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            // Log mutation errors
            console.error(
              "Mutation error:",
              error,
              "Mutation key:",
              mutation.options.mutationKey
            );
          },
        }),
        defaultOptions: {
          queries: {
            // Data is considered fresh for 60 seconds
            staleTime: 60 * 1000,
            // Unused data is garbage collected after 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry failed requests once
            retry: 1,
            // Retry delay with exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus (good for keeping data fresh)
            refetchOnWindowFocus: true,
            // Refetch on network reconnect
            refetchOnReconnect: true,
            // Don't refetch on mount if data is still fresh
            refetchOnMount: true,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
            // Show errors in console
            onError: (error) => {
              console.error("Mutation failed:", error);
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only visible in development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
