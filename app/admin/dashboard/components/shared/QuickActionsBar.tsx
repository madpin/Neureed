import { Card, CardBody, Button } from "@/app/components/ui";
import { ConfirmButton } from "./ConfirmButton";

export interface QuickActionsBarProps {
  /** Handler for refreshing feeds */
  onRefreshFeeds: () => Promise<void> | void;
  /** Handler for generating embeddings */
  onGenerateEmbeddings: () => Promise<void> | void;
  /** Handler for running cleanup */
  onCleanup: () => Promise<void> | void;
  /** Handler for clearing cache */
  onClearCache: () => Promise<void> | void;
  /** Loading states for each action */
  loading?: {
    refreshFeeds?: boolean;
    embeddings?: boolean;
    cleanup?: boolean;
    cache?: boolean;
  };
}

// Icons for the buttons
const RefreshIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const LightningIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const CacheIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
    />
  </svg>
);

/**
 * QuickActionsBar component for common admin actions.
 * Displays buttons for refreshing feeds, generating embeddings, cleanup, and cache clearing.
 *
 * @example
 * ```tsx
 * <QuickActionsBar
 *   onRefreshFeeds={handleRefreshFeeds}
 *   onGenerateEmbeddings={handleGenerateEmbeddings}
 *   onCleanup={handleCleanup}
 *   onClearCache={handleClearCache}
 *   loading={{
 *     refreshFeeds: isRefreshing,
 *     embeddings: isGenerating,
 *   }}
 * />
 * ```
 */
export function QuickActionsBar({
  onRefreshFeeds,
  onGenerateEmbeddings,
  onCleanup,
  onClearCache,
  loading = {},
}: QuickActionsBarProps) {
  return (
    <Card className="bg-background shadow-sm">
      <CardBody>
        <h2 className="text-sm font-semibold uppercase text-foreground/50 tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2">
          {/* Refresh Feeds */}
          <Button
            onClick={onRefreshFeeds}
            disabled={loading.refreshFeeds}
            loading={loading.refreshFeeds}
            iconLeft={<RefreshIcon />}
            variant="primary"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-initial"
          >
            Refresh Feeds
          </Button>

          {/* Generate Embeddings */}
          <Button
            onClick={onGenerateEmbeddings}
            disabled={loading.embeddings}
            loading={loading.embeddings}
            iconLeft={<LightningIcon />}
            variant="primary"
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-initial"
          >
            Generate Embeddings
          </Button>

          {/* Cleanup Old Articles (with confirmation) */}
          <ConfirmButton
            onConfirm={onCleanup}
            confirmText="Run cleanup?"
            warningDescription="Click again to confirm. This will remove articles older than 90 days."
            variant="warning"
            size="sm"
            icon={<TrashIcon />}
            className="bg-orange-600 hover:bg-orange-700 flex-1 sm:flex-initial"
            loading={loading.cleanup}
          >
            Cleanup Old Articles
          </ConfirmButton>

          {/* Clear Cache (with confirmation) */}
          <ConfirmButton
            onConfirm={onClearCache}
            confirmText="Clear all cache?"
            warningDescription="Click the button again to confirm. This will remove all cached data."
            variant="warning"
            size="sm"
            icon={<CacheIcon />}
            className="bg-gray-600 hover:bg-gray-700 flex-1 sm:flex-initial"
            loading={loading.cache}
          >
            Clear Cache
          </ConfirmButton>
        </div>
      </CardBody>
    </Card>
  );
}
