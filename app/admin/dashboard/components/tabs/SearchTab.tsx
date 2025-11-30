import { Card, CardBody } from "@/app/components/ui";
import type { EmbeddingStats, EmbeddingConfig, AdminSettings } from "@/hooks/queries/use-admin";

export interface SearchTabProps {
  /** Embedding statistics */
  embeddingStats: EmbeddingStats | undefined;
  /** Embedding configuration */
  embeddingConfig: EmbeddingConfig | undefined;
  /** Admin settings (optional) */
  adminSettings?: AdminSettings;
}

/**
 * SearchTab component displays semantic search statistics and configuration.
 * Shows embedding coverage, vector status, and current configuration.
 *
 * @example
 * ```tsx
 * <SearchTab
 *   embeddingStats={embeddingStats}
 *   embeddingConfig={embeddingConfig}
 * />
 * ```
 */
export function SearchTab({ embeddingStats, embeddingConfig, adminSettings }: SearchTabProps) {
  // adminSettings is available if needed for future functionality
  return (
    <div className="space-y-6">
      {/* Search Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Embeddings Coverage */}
        <Card className="bg-background shadow-sm">
          <CardBody>
            <h3 className="text-lg font-medium text-foreground mb-2">Embeddings Coverage</h3>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-foreground">
                {(embeddingStats?.percentage || 0).toFixed(1)}%
              </div>
              <div className="mb-1 text-sm text-foreground/60">of articles</div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all duration-500"
                style={{ width: `${embeddingStats?.percentage || 0}%` }}
              ></div>
            </div>
          </CardBody>
        </Card>

        {/* Vector Status */}
        <Card className="bg-background shadow-sm">
          <CardBody>
            <h3 className="text-lg font-medium text-foreground mb-2">Vector Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-foreground/70">With Embeddings</span>
                <span className="font-medium text-foreground">
                  {embeddingStats?.withEmbeddings || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/70">Pending</span>
                <span className="font-medium text-foreground">
                  {embeddingStats?.withoutEmbeddings || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/70">Total Articles</span>
                <span className="font-medium text-foreground">
                  {embeddingStats?.total || 0}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Configuration */}
        <Card className="bg-background shadow-sm">
          <CardBody>
            <h3 className="text-lg font-medium text-foreground mb-2">Configuration</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-foreground/70">Provider</span>
                <span className="font-medium text-foreground capitalize">
                  {embeddingConfig?.provider || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/70">Model</span>
                <span
                  className="font-medium text-foreground truncate max-w-[150px]"
                  title={embeddingConfig?.model}
                >
                  {embeddingConfig?.model || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/70">Dimensions</span>
                <span className="font-medium text-foreground">
                  {embeddingConfig?.dimensions || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/70">Auto-Generate</span>
                <span
                  className={`font-medium ${
                    embeddingConfig?.enabled ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {embeddingConfig?.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
