"use client";

import { Card, CardBody } from "@/app/components/ui";
import { useAdminConfig } from "@/hooks/queries/use-admin";

// Loading Spinner Component
function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      <span className="ml-3 text-foreground/60">{message}</span>
    </div>
  );
}

/**
 * ConfigTab component displays system configuration information.
 * Shows server, database, LLM, cache, cron jobs, and other configuration details.
 *
 * @example
 * ```tsx
 * <ConfigTab />
 * ```
 */
export function ConfigTab() {
  const { data: configData, isLoading } = useAdminConfig();

  if (isLoading) {
    return <LoadingSpinner message="Loading configuration..." />;
  }

  if (!configData) {
    return (
      <div className="py-12 text-center text-foreground/50">
        No configuration data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Server Info */}
      {configData?.server && (
        <Card className="bg-background shadow-sm">
          <CardBody>
            <h3 className="text-lg font-medium text-foreground mb-4">Server Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(configData.server).map(([key, value]) => (
                <div key={key} className="p-3 rounded bg-muted/20 border border-border">
                  <div className="text-xs text-foreground/50 uppercase mb-1">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="font-medium text-sm truncate font-mono" title={String(value)}>
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Database */}
      {configData?.database && (
        <Card className="bg-background shadow-sm">
          <CardBody>
            <h3 className="text-lg font-medium text-foreground mb-4">Database</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(configData.database).map(([key, value]) => (
                <div key={key} className="p-3 rounded bg-muted/20 border border-border">
                  <div className="text-xs text-foreground/50 uppercase mb-1">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="font-medium text-sm font-mono break-all" title={String(value)}>
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* LLM & Embeddings */}
      {(configData?.llm || configData?.embeddings) && (
        <Card className="bg-background shadow-sm">
          <CardBody>
            <h3 className="text-lg font-medium text-foreground mb-4">
              LLM & Embeddings Configuration
            </h3>
            <div className="space-y-4">
              {configData?.llm && (
                <div>
                  <h4 className="font-medium text-sm text-foreground/70 mb-2">LLM</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(configData.llm).map(([key, value]) => (
                      <div key={key} className="p-3 rounded bg-muted/20 border border-border">
                        <div className="text-xs text-foreground/50 uppercase mb-1">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </div>
                        <div className="font-medium text-sm font-mono truncate" title={String(value)}>
                          {String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {configData?.embeddings && (
                <div>
                  <h4 className="font-medium text-sm text-foreground/70 mb-2">Embeddings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(configData.embeddings).map(([key, value]) => (
                      <div key={key} className="p-3 rounded bg-muted/20 border border-border">
                        <div className="text-xs text-foreground/50 uppercase mb-1">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </div>
                        <div className="font-medium text-sm font-mono truncate" title={String(value)}>
                          {String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Cache & Redis */}
      {configData?.cache && (
        <Card className="bg-background shadow-sm">
          <CardBody>
            <h3 className="text-lg font-medium text-foreground mb-4">Cache & Storage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(configData.cache).map(([key, value]) => (
                <div key={key} className="p-3 rounded bg-muted/20 border border-border">
                  <div className="text-xs text-foreground/50 uppercase mb-1">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="font-medium text-sm font-mono truncate" title={String(value)}>
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Cron Jobs */}
      {configData?.cronJobs && (
        <Card className="bg-background shadow-sm">
          <CardBody>
            <h3 className="text-lg font-medium text-foreground mb-4">Cron Jobs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(configData.cronJobs).map(([key, value]) => (
                <div key={key} className="p-3 rounded bg-muted/20 border border-border">
                  <div className="text-xs text-foreground/50 uppercase mb-1">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="font-medium text-sm font-mono truncate" title={String(value)}>
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Content Extraction */}
      {configData?.contentExtraction && (
        <Card className="bg-background shadow-sm">
          <CardBody>
            <h3 className="text-lg font-medium text-foreground mb-4">Content Extraction</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(configData.contentExtraction).map(([key, value]) => (
                <div key={key} className="p-3 rounded bg-muted/20 border border-border">
                  <div className="text-xs text-foreground/50 uppercase mb-1">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="font-medium text-sm truncate" title={String(value)}>
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Authentication */}
      {configData?.auth && (
        <Card className="bg-background shadow-sm">
          <CardBody>
            <h3 className="text-lg font-medium text-foreground mb-4">Authentication</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(configData.auth).map(([key, value]) => (
                <div key={key} className="p-3 rounded bg-muted/20 border border-border">
                  <div className="text-xs text-foreground/50 uppercase mb-1">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="font-medium text-sm truncate" title={String(value)}>
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
