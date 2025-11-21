/**
 * OPML Query Hooks
 *
 * These hooks manage OPML export and import operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { apiPost } from "@/lib/query/api-client";

/**
 * Export OPML
 */
async function exportOpml(options: {
  categoryIds?: string[];
  feedIds?: string[];
}): Promise<Blob> {
  const params = new URLSearchParams();
  if (options.categoryIds) {
    options.categoryIds.forEach((id) => params.append("categoryIds", id));
  }
  if (options.feedIds) {
    options.feedIds.forEach((id) => params.append("feedIds", id));
  }

  // Using fetch directly here because apiGet assumes JSON response
  // and we need a Blob for file download
  const response = await fetch(`/api/user/opml/export?${params.toString()}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Export failed");
  }

  return await response.blob();
}

/**
 * Import OPML
 */
async function importOpml(file: File): Promise<{
  imported: number;
  failed: number;
  errors?: string[];
}> {
  const formData = new FormData();
  formData.append("file", file);

  // Using fetch directly for FormData
  const response = await fetch("/api/user/opml/import", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Import failed");
  }

  const data = await response.json();
  return data.data; // Assuming response format { data: { imported, failed, ... } }
}

/**
 * Hook to export OPML
 * Note: This is a mutation because it triggers a file download
 */
export function useExportOpml() {
  return useMutation({
    mutationFn: exportOpml,
  });
}

/**
 * Hook to import OPML
 */
export function useImportOpml() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importOpml,
    onSuccess: () => {
      // Invalidate feeds and categories after import
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
