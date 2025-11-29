"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useCategories,
  useCategorySettings,
  useUpdateCategorySettings,
} from "@/hooks/queries/use-categories";
import { Card, CardBody } from "@/app/components/ui";

export interface CategorySettingsViewProps {
  categoryId: string;
  onNavigateToFeed: (feedId: string) => void;
  onNavigateToOverview: () => void;
  onRefreshData?: () => void;
}

export function CategorySettingsView({
  categoryId,
  onNavigateToFeed,
  onNavigateToOverview,
  onRefreshData,
}: CategorySettingsViewProps) {
  const { data: categories = [] } = useCategories();
  const category = categories.find((c: any) => c.id === categoryId);
  const { data: categorySettingsData, isLoading: loadingSettings } = useCategorySettings(categoryId);
  const updateCategorySettingsMutation = useUpdateCategorySettings();

  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [maxArticlesPerFeed, setMaxArticlesPerFeed] = useState<number | null>(null);
  const [maxArticleAge, setMaxArticleAge] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (categorySettingsData) {
      const settings = (categorySettingsData as any).settings || {};
      setRefreshInterval(settings.refreshInterval ?? null);
      setMaxArticlesPerFeed(settings.maxArticlesPerFeed ?? null);
      setMaxArticleAge(settings.maxArticleAge ?? null);
    }
  }, [categorySettingsData]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateCategorySettingsMutation.mutateAsync({
        categoryId,
        settings: { refreshInterval, maxArticlesPerFeed, maxArticleAge },
      });
      toast.success("Category settings saved successfully");
      onRefreshData?.();
    } catch (error) {
      console.error("Failed to save category settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setRefreshInterval(null);
    setMaxArticlesPerFeed(null);
    setMaxArticleAge(null);
  };

  if (loadingSettings) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading category settings...</div>
      </div>
    );
  }

  const feedsInCategory = (categorySettingsData as any)?.feeds || [];
  const feedCount = (categorySettingsData as any)?.feedCount || 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={onNavigateToOverview} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{(category as any)?.icon || "📁"}</span>
          <div>
            <h1 className="text-2xl font-bold">{category?.name || "Category"} Settings</h1>
            {(category as any)?.description && (
              <p className="text-sm text-foreground/60">{(category as any).description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <h3 className="mb-2 font-semibold text-primary">Settings Cascade Priority</h3>
        <p className="text-sm text-primary/80">
          Settings configured here apply to all <strong>{feedCount} feeds</strong> in this category.
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-primary/70">
          <div className="flex items-center gap-1">
            <span className="font-semibold">1.</span> Feed Settings
          </div>
          <span>→</span>
          <div className="flex items-center gap-1 font-semibold text-primary">
            <span>2.</span> Category Settings (here)
          </div>
          <span>→</span>
          <div className="flex items-center gap-1">
            <span>3.</span> User Defaults
          </div>
          <span>→</span>
          <div className="flex items-center gap-1">
            <span>4.</span> System Defaults
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="bg-background">
          <CardBody>
            <label className="mb-2 block text-sm font-medium">Refresh Interval (minutes)</label>
            <p className="mb-3 text-xs text-foreground/60">
              How often feeds in this category should be checked for new articles
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={refreshInterval ?? ""}
                onChange={(e) => setRefreshInterval(e.target.value ? Number(e.target.value) : null)}
                placeholder="Default: 60"
                min={15}
                max={1440}
                className="w-40 rounded-lg border border-border px-3 py-2 text-sm"
              />
              <span className="text-sm text-foreground/60">
                {refreshInterval ? `${refreshInterval} minutes` : "Using default"}
              </span>
              {refreshInterval && (
                <button
                  onClick={() => setRefreshInterval(null)}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Reset to default
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-foreground/50">Valid range: 15-1440 minutes</p>
          </CardBody>
        </Card>

        <Card className="bg-background">
          <CardBody>
            <label className="mb-2 block text-sm font-medium">Max Articles Per Feed</label>
            <p className="mb-3 text-xs text-foreground/60">
              Maximum number of articles to keep for each feed in this category
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={maxArticlesPerFeed ?? ""}
                onChange={(e) => setMaxArticlesPerFeed(e.target.value ? Number(e.target.value) : null)}
                placeholder="Default: 1000"
                min={50}
                max={5000}
                className="w-40 rounded-lg border border-border px-3 py-2 text-sm"
              />
              <span className="text-sm text-foreground/60">
                {maxArticlesPerFeed ? `${maxArticlesPerFeed} articles` : "Using default"}
              </span>
              {maxArticlesPerFeed && (
                <button
                  onClick={() => setMaxArticlesPerFeed(null)}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Reset to default
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-foreground/50">Valid range: 50-5000 articles</p>
          </CardBody>
        </Card>

        <Card className="bg-background">
          <CardBody>
            <label className="mb-2 block text-sm font-medium">Max Article Age (days)</label>
            <p className="mb-3 text-xs text-foreground/60">
              How long to keep articles before automatically deleting them
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={maxArticleAge ?? ""}
                onChange={(e) => setMaxArticleAge(e.target.value ? Number(e.target.value) : null)}
                placeholder="Default: 90"
                min={1}
                max={365}
                className="w-40 rounded-lg border border-border px-3 py-2 text-sm"
              />
              <span className="text-sm text-foreground/60">
                {maxArticleAge ? `${maxArticleAge} days` : "Using default"}
              </span>
              {maxArticleAge && (
                <button
                  onClick={() => setMaxArticleAge(null)}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Reset to default
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-foreground/50">Valid range: 1-365 days</p>
          </CardBody>
        </Card>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
          >
            Reset All to Defaults
          </button>
        </div>
      </div>

      {feedsInCategory.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Feeds in this Category ({feedCount})</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {feedsInCategory.map((feed: any) => (
                <button
                  key={feed.id}
                  onClick={() => onNavigateToFeed(feed.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                    <span className="text-sm font-medium">{feed.name}</span>
                  </div>
                  <svg className="h-4 w-4 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-foreground/50">
            Click on a feed to configure feed-specific settings that override these category settings.
          </p>
        </div>
      )}
    </div>
  );
}
