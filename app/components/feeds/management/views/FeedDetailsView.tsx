"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useCategories,
} from "@/hooks/queries/use-categories";
import {
  useFeed,
  useUpdateFeedSettings,
  useRefreshFeed,
  useUnsubscribeFeed,
  useDeleteFeed,
  useFeedSummarizationSettings,
  useUpdateFeedSummarizationSettings,
  useClearFeedSummarizationSettings,
  useRefreshLastArticles,
} from "@/hooks/queries/use-feeds";
import {
  NumberSettingField,
  SelectSettingField,
  ToggleSettingField,
  SettingsSection,
  type SelectOption,
} from "../shared";

export interface FeedDetailsViewProps {
  feedId: string;
  onRefreshData?: () => void;
  onClose: () => void;
}

export function FeedDetailsView({
  feedId,
  onRefreshData,
  onClose,
}: FeedDetailsViewProps) {
  // Optimized: Only fetch the specific feed we need, not all subscriptions
  const { data: feed, isLoading: loadingFeed } = useFeed(feedId);
  // Only fetch categories list for the dropdown (already optimized with staleTime)
  const { data: categories = [], isLoading: loadingCategories } = useCategories();

  const updateFeedSettingsMutation = useUpdateFeedSettings();
  const refreshFeedMutation = useRefreshFeed();
  const deleteFeedMutation = useDeleteFeed();
  const unsubscribeFeedMutation = useUnsubscribeFeed();
  const refreshLastArticlesMutation = useRefreshLastArticles();

  // Summarization hooks - only fetched when needed
  const { data: summarizationConfigRaw } = useFeedSummarizationSettings(feedId);
  const updateSummarizationMutation = useUpdateFeedSummarizationSettings();
  const clearSummarizationMutation = useClearFeedSummarizationSettings();

  // Unwrap the double-wrapped data (API returns {data: {...}}, then it's wrapped again by our response format)
  const summarizationConfig = (summarizationConfigRaw as any)?.data || summarizationConfigRaw;

  // Local State
  const [customName, setCustomName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [fetchInterval, setFetchInterval] = useState(60);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

  // Refresh articles state
  const [isRefreshingArticles, setIsRefreshingArticles] = useState(false);
  const [articlesToRefresh, setArticlesToRefresh] = useState(10);

  // Summarization state
  const [summarizationEnabled, setSummarizationEnabled] = useState(false);
  const [minContentLength, setMinContentLength] = useState(5000);
  const [includeKeyPoints, setIncludeKeyPoints] = useState(true);
  const [includeTopics, setIncludeTopics] = useState(true);
  
  // Advanced Extraction Settings
  const [extractionMethod, setExtractionMethod] = useState<string | null>(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [contentMergeStrategy, setContentMergeStrategy] = useState<string | null>(null);
  const [timeoutVal, setTimeoutVal] = useState<number | null>(30);

  // Test result state
  const [isTesting, setIsTesting] = useState(false);

  // Initialize state when data loads
  useEffect(() => {
    if (feed) {
      setCustomName((feed as any).name || "");
      if (feed.category) {
        setSelectedCategory(feed.category.id);
      }

      if (feed.settings) {
        setFetchInterval(feed.settings.refreshInterval || 60);

        // Load extraction settings if they exist
        const extractionSettings = (feed.settings as any)?.extraction;
        if (extractionSettings) {
          if (extractionSettings.method) {
            setExtractionMethod(extractionSettings.method);
          }
          if (extractionSettings.requiresAuth !== undefined) {
            setRequiresAuth(extractionSettings.requiresAuth);
          }
          if (extractionSettings.contentMergeStrategy) {
            setContentMergeStrategy(extractionSettings.contentMergeStrategy);
          }
          if (extractionSettings.timeout) {
            setTimeoutVal(extractionSettings.timeout);
          }
        }
      }
    }
  }, [feed]);

  // Initialize summarization settings
  useEffect(() => {
    if (summarizationConfig?.effectiveSettings) {
      console.log('[FeedSettings] Summarization config:', summarizationConfig);
      setSummarizationEnabled(summarizationConfig.effectiveSettings.enabled);
      setMinContentLength(summarizationConfig.effectiveSettings.minContentLength);
      setIncludeKeyPoints(summarizationConfig.effectiveSettings.includeKeyPoints);
      setIncludeTopics(summarizationConfig.effectiveSettings.includeTopics);
    }
  }, [summarizationConfig]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Prepare settings object
      const settings = {
        customName: customName.trim() || null,
        refreshInterval: fetchInterval,
        // Other settings would go here
      };

      // Save feed settings
      await updateFeedSettingsMutation.mutateAsync({
        feedId: feedId,
        settings
      });

      // Save summarization settings if system is enabled
      if (summarizationConfig?.systemEnabled) {
        await updateSummarizationMutation.mutateAsync({
          feedId,
          settings: {
            enabled: summarizationEnabled,
            minContentLength,
            includeKeyPoints,
            includeTopics,
          },
        });
      }

      toast.success("Settings saved successfully");
      onRefreshData?.();
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshFeed = async () => {
    try {
      setIsRefreshing(true);
      const feedName = feed?.name || "Feed";
      const toastId = `refresh-modal-${feedId}`;

      toast.loading(
        <div
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(toastId);
          }}
        >
          Refreshing {feedName}...
        </div>,
        { id: toastId }
      );

      // Let's check use-feeds.ts. useRefreshFeed expects `feedId: string`.
      // So removing parseInt.
      const data = await refreshFeedMutation.mutateAsync(feedId);
      const result = (data as any)?.data || data;
      const hasUpdates = (result?.newArticles || 0) > 0 || (result?.updatedArticles || 0) > 0;

      if (hasUpdates) {
        toast.success(
          <div
            className="flex flex-col gap-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(toastId);
            }}
          >
            <div className="font-semibold">{feedName} refreshed</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {result.newArticles > 0 && (
                <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                  📰 {result.newArticles} new
                </span>
              )}
              {result.updatedArticles > 0 && (
                <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                  🔄 {result.updatedArticles} updated
                </span>
              )}
              {result.articlesCleanedUp > 0 && (
                <span className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded">
                  🧹 {result.articlesCleanedUp} cleaned
                </span>
              )}
              {result.embeddingsGenerated > 0 && (
                <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                  🧠 {result.embeddingsGenerated} embeddings
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 italic">Click to dismiss</div>
          </div>,
          { id: toastId, duration: 6000 }
        );
      } else {
        toast.success(`${feedName} refreshed - No new articles`, { id: toastId });
      }
      onRefreshData?.();
    } catch (error) {
      console.error("Failed to refresh feed:", error);
      const feedName = feed?.name || "Feed";
      const toastId = `refresh-modal-${feedId}`;
      toast.error(`Failed to refresh ${feedName}`, { id: toastId });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshLastArticles = async () => {
    try {
      setIsRefreshingArticles(true);
      const feedName = feed?.name || "Feed";
      const toastId = `refresh-articles-modal-${feedId}`;

      toast.loading(
        <div
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(toastId);
          }}
        >
          Re-extracting last {articlesToRefresh} articles from {feedName}...
        </div>,
        { id: toastId }
      );

      const data = await refreshLastArticlesMutation.mutateAsync({
        feedId,
        count: articlesToRefresh
      });
      const result = (data as any)?.data || data;

      toast.success(
        <div
          className="flex flex-col gap-2 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(toastId);
          }}
        >
          <div className="font-semibold">Articles re-extracted</div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
              📄 {result.articlesProcessed} processed
            </span>
            {result.articlesUpdated > 0 && (
              <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                ✅ {result.articlesUpdated} updated
              </span>
            )}
            {result.articlesFailed > 0 && (
              <span className="flex items-center gap-1 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">
                ❌ {result.articlesFailed} failed
              </span>
            )}
            {result.embeddingsGenerated > 0 && (
              <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                🧠 {result.embeddingsGenerated} embeddings
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 italic">Click to dismiss</div>
        </div>,
        { id: toastId, duration: 6000 }
      );

      onRefreshData?.();
    } catch (error) {
      console.error("Failed to refresh articles:", error);
      const feedName = feed?.name || "Feed";
      const toastId = `refresh-articles-modal-${feedId}`;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(
        <div className="flex flex-col gap-1">
          <div>Failed to refresh articles</div>
          <div className="text-xs opacity-80">{errorMessage}</div>
        </div>,
        { id: toastId }
      );
    } finally {
      setIsRefreshingArticles(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!confirm(`Are you sure you want to unsubscribe from "${feed?.name}"?`)) {
      return;
    }

    try {
      setIsUnsubscribing(true);
      await unsubscribeFeedMutation.mutateAsync(feedId);
      toast.success("Unsubscribed successfully");
      onRefreshData?.();
      onClose();
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      toast.error("Failed to unsubscribe");
    } finally {
      setIsUnsubscribing(false);
    }
  };

  const handleDeleteFeed = async () => {
    if (!confirm(`⚠️ DANGER: Are you sure you want to permanently delete "${feed?.name}"? This action CANNOT be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteFeedMutation.mutateAsync(feedId);
      toast.success("Feed deleted successfully");
      onRefreshData?.();
      onClose();
    } catch (error) {
      console.error("Failed to delete feed:", error);
      toast.error("Failed to delete feed");
    } finally {
      setIsDeleting(false);
    }
  };

  // Placeholder for test functionality
  const handleTest = async () => {
    setIsTesting(true);
    // Simulate test
    setTimeout(() => {
      toast.success("Extraction test passed (Mock)");
      setIsTesting(false);
    }, 1000);
  };

  const handleResetSummarization = async () => {
    if (!confirm("Reset summarization settings to defaults?")) {
      return;
    }

    try {
      setIsSaving(true);
      await clearSummarizationMutation.mutateAsync(feedId);
      toast.success("Summarization settings reset to defaults");
    } catch (error) {
      console.error("Failed to reset summarization settings:", error);
      toast.error("Failed to reset settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state while fetching data
  if (loadingFeed || loadingCategories) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading feed settings...</div>
      </div>
    );
  }

  // Check if feed exists
  if (!feed) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Feed not found or not subscribed</div>
      </div>
    );
  }

  const displayFeed = feed;

  // Prepare options for select fields
  const categoryOptions: SelectOption[] = [
    { value: "", label: "Uncategorized" },
    ...categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })),
  ];

  const extractionMethodOptions: SelectOption[] = [
    { value: "rss", label: "RSS Only (Default)" },
    { value: "readability", label: "Readability (Clean extraction)" },
    { value: "playwright", label: "Playwright (JS-rendered content)" },
  ];

  const contentMergeStrategyOptions: SelectOption[] = [
    { value: "replace", label: "Replace RSS content" },
    { value: "prepend", label: "Prepend to RSS content" },
    { value: "append", label: "Append to RSS content" },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        {(displayFeed as any)?.imageUrl || (displayFeed as any)?.favicon ? (
          <img
            src={(displayFeed as any).imageUrl || (displayFeed as any).favicon}
            alt={displayFeed?.name || ""}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted dark:bg-muted">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{displayFeed?.name}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{displayFeed?.url}</p>
        </div>
      </div>

      {/* Basic Settings */}
      <SettingsSection
        title="Basic Settings"
        description="Configure the basic feed properties"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-muted"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Custom Feed Name</label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={displayFeed?.name}
            className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-muted"
          />
        </div>

        <NumberSettingField
          label="Fetch Interval (minutes)"
          description="How often to check for new articles"
          value={fetchInterval}
          onChange={(val) => setFetchInterval(val ?? 60)}
          min={5}
          max={1440}
          unit="minutes"
          defaultValue={60}
          showReset={false}
          helperText="Valid range: 5-1440 minutes"
        />
      </SettingsSection>

      {/* Advanced Extraction Settings */}
      <SettingsSection
        title="Content Extraction"
        description="Configure how article content is extracted from this feed"
        collapsible={true}
        defaultExpanded={false}
      >
        <ToggleSettingField
          label="Requires authentication (cookies needed)"
          checked={requiresAuth}
          onChange={setRequiresAuth}
        />

        <SelectSettingField
          label="Content Extraction Method"
          description="Choose how to extract article content from this feed"
          value={extractionMethod}
          onChange={setExtractionMethod}
          options={extractionMethodOptions}
          defaultValue="readability"
        />

        <SelectSettingField
          label="Content Merge Strategy"
          description="How to combine extracted content with RSS content"
          value={contentMergeStrategy}
          onChange={setContentMergeStrategy}
          options={contentMergeStrategyOptions}
          defaultValue="replace"
        />

        <NumberSettingField
          label="Extraction Timeout (seconds)"
          description="Maximum time to wait for content extraction"
          value={timeoutVal}
          onChange={setTimeoutVal}
          min={5}
          max={120}
          unit="seconds"
          defaultValue={30}
        />
      </SettingsSection>

      {/* Re-extract Articles Section */}
      {extractionMethod !== "rss" && (
        <SettingsSection
          title="Re-extract Existing Articles"
          description="Apply new extraction settings to recent articles"
          collapsible={true}
          defaultExpanded={false}
        >
          <div className="rounded-lg bg-primary/10 p-3 dark:bg-primary/20">
            <p className="text-xs text-primary/80 dark:text-primary/90">
              <strong>When to use:</strong> If you changed the extraction method or merge strategy above,
              you can re-extract recent articles to apply the new settings. This is especially useful when
              switching from RSS to Readability/Playwright extraction.
            </p>
          </div>

          <NumberSettingField
            label="Number of articles to re-extract (max 50)"
            description="Re-extracts the last X articles using the current extraction settings"
            value={articlesToRefresh}
            onChange={(val) => setArticlesToRefresh(Math.min(50, Math.max(1, val ?? 10)))}
            min={1}
            max={50}
            unit="articles"
            showReset={false}
          />

          <button
            onClick={handleRefreshLastArticles}
            disabled={isRefreshingArticles}
            className="w-full rounded-lg border border-primary/30 px-4 py-2 font-medium text-primary hover:bg-primary/10 disabled:opacity-50 dark:border-primary/60 dark:text-primary dark:hover:bg-primary/20"
          >
            {isRefreshingArticles ? "Re-extracting..." : `Re-extract Last ${articlesToRefresh} Articles`}
          </button>
        </SettingsSection>
      )}

      {/* Article Summarization */}
      <SettingsSection
        title="Article Summarization"
        description={
          summarizationConfig?.systemEnabled
            ? "Automatically generate summaries for long articles"
            : "Article summarization is disabled system-wide by the administrator"
        }
        collapsible={true}
        defaultExpanded={false}
      >
        {!summarizationConfig?.systemEnabled ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Article summarization is disabled system-wide by the administrator.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <ToggleSettingField
                label="Enable automatic summarization"
                checked={summarizationEnabled}
                onChange={setSummarizationEnabled}
                source={summarizationConfig?.source ? `Source: ${summarizationConfig.source}` : undefined}
              />
              {summarizationConfig?.source && summarizationConfig.source !== "system" && (
                <button
                  onClick={handleResetSummarization}
                  disabled={isSaving}
                  className="text-xs text-primary hover:text-primary/80 disabled:opacity-50"
                >
                  Reset to defaults
                </button>
              )}
            </div>

            {summarizationEnabled && (
              <>
                <NumberSettingField
                  label="Minimum Content Length (characters)"
                  description="Only articles longer than this will be summarized"
                  value={minContentLength}
                  onChange={(val) => setMinContentLength(val ?? 5000)}
                  min={100}
                  max={100000}
                  step={100}
                  unit="characters"
                  defaultValue={5000}
                  showReset={false}
                  helperText="Valid range: 100-100,000 characters"
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium">What to generate</label>

                  <ToggleSettingField
                    label="Generate key points (3-5 bullet points)"
                    checked={includeKeyPoints}
                    onChange={setIncludeKeyPoints}
                  />

                  <ToggleSettingField
                    label="Detect topics and tags (3-5 topics)"
                    checked={includeTopics}
                    onChange={setIncludeTopics}
                  />
                </div>

                <div className="rounded-lg bg-primary/10 p-3 dark:bg-primary/20">
                  <p className="text-xs text-primary/80 dark:text-primary/90">
                    <strong>Note:</strong> Summaries are generated in the background after feed refresh.
                    You&apos;ll receive a notification when complete. This feature may incur costs if using OpenAI.
                    Settings will be saved when you click the main &quot;Save Settings&quot; button below.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </SettingsSection>

      {/* Actions */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <button
              onClick={handleTest}
              disabled={isTesting}
              className="flex-1 rounded-lg border border-border px-4 py-2 font-medium hover:bg-muted disabled:opacity-50 dark:hover:bg-muted"
            >
            {isTesting ? "Testing..." : "Test Extraction"}
          </button>
          <button
            onClick={handleRefreshFeed}
            disabled={isRefreshing}
            className="flex-1 rounded-lg border border-primary/30 px-4 py-2 font-medium text-primary hover:bg-primary/10 disabled:opacity-50 dark:border-primary/60 dark:text-primary dark:hover:bg-primary/20"
          >
            {isRefreshing ? "Refreshing..." : "Refresh Feed"}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Danger Zone (Expandable) */}
      <div>
        <button
          onClick={() => setShowDangerZone(!showDangerZone)}
          className="mb-4 flex w-full items-center justify-between rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-left font-semibold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
        >
          <span>Danger Zone</span>
          <svg
            className={`h-5 w-5 transition-transform ${showDangerZone ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showDangerZone && (
          <div className="space-y-2 rounded-lg border border-red-200 bg-background p-4 dark:border-red-900">
            <button
              onClick={handleUnsubscribe}
              disabled={isUnsubscribing}
              className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted dark:hover:bg-muted"
            >
              {isUnsubscribing ? "Unsubscribing..." : "Unsubscribe from Feed"}
            </button>
            <button
              onClick={handleDeleteFeed}
              disabled={isDeleting}
              className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Feed Permanently"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
