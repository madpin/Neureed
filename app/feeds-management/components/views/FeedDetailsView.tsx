"use client";

import { useState } from "react";
import { useFeedNavigation } from "@/hooks/use-feed-navigation";
import { useUserFeeds, useToggleFeedStatus } from "@/hooks/queries/use-feeds";
import { useCategories } from "@/hooks/queries/use-categories";

interface FeedDetailsViewProps {
  feedId: string;
}

type TabId = "basic" | "refresh" | "content" | "connection" | "health" | "presentation" | "advanced";

/**
 * Feed Details View
 *
 * Displays detailed settings for a specific feed with 7 tabbed sections:
 * 1. Basic Settings - Name, categories, tags, enabled status
 * 2. Update & Refresh - Fetch interval, timeout, retry policy
 * 3. Content Processing - Retention, filtering, parsing rules
 * 4. Connection Settings - Auth, headers, proxy, user agent
 * 5. Quality & Health - Error tracking, health status, notifications
 * 6. Presentation - Preview length, feed icon
 * 7. Advanced Options - Caching, conditional GET, redirects
 */
export function FeedDetailsView({ feedId }: FeedDetailsViewProps) {
  const { navigateToOverview } = useFeedNavigation();
  const { data: feeds = [] } = useUserFeeds();
  const { data: categories = [] } = useCategories();
  const [activeTab, setActiveTab] = useState<TabId>("basic");

  const feed = feeds.find(f => f.id === feedId);

  const tabs = [
    { id: "basic" as TabId, label: "Basic Settings", icon: "⚙️" },
    { id: "refresh" as TabId, label: "Update & Refresh", icon: "🔄" },
    { id: "content" as TabId, label: "Content Processing", icon: "📝" },
    { id: "connection" as TabId, label: "Connection", icon: "🔌" },
    { id: "health" as TabId, label: "Quality & Health", icon: "❤️" },
    { id: "presentation" as TabId, label: "Presentation", icon: "🎨" },
    { id: "advanced" as TabId, label: "Advanced", icon: "⚡" },
  ];

  if (!feed) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Feed not found</p>
          <button
            onClick={navigateToOverview}
            className="mt-4 px-4 py-2 text-sm border border-border rounded hover:bg-muted transition-colors"
          >
            Back to Overview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feed Header */}
      <div>
        <h2 className="text-xl font-semibold">{feed.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">{feed.url}</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="rounded-lg border border-border bg-card p-6">
        {activeTab === "basic" && <BasicSettingsTab feed={feed} categories={categories} />}
        {activeTab === "refresh" && <UpdateRefreshTab feed={feed} />}
        {activeTab === "content" && <ContentProcessingTab feed={feed} />}
        {activeTab === "connection" && <ConnectionSettingsTab feed={feed} />}
        {activeTab === "health" && <QualityHealthTab feed={feed} />}
        {activeTab === "presentation" && <PresentationTab feed={feed} />}
        {activeTab === "advanced" && <AdvancedOptionsTab feed={feed} />}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors">
            Test Feed
          </button>
          <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors">
            Refresh Now
          </button>
          <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors">
            View Articles
          </button>
        </div>
        <button className="px-3 py-1.5 text-sm border border-destructive text-destructive rounded hover:bg-destructive hover:text-destructive-foreground transition-colors">
          Delete Feed
        </button>
      </div>
    </div>
  );
}

// Tab Components

function BasicSettingsTab({ feed, categories }: { feed: any; categories: any[] }) {
  const toggleStatus = useToggleFeedStatus();
  const [isEnabled, setIsEnabled] = useState(feed.isActive ?? true);

  const handleToggle = async () => {
    const newStatus = !isEnabled;
    setIsEnabled(newStatus); // Optimistic update

    try {
      await toggleStatus.mutateAsync({
        feedId: feed.id,
        enabled: newStatus
      });
    } catch (error) {
      // Revert on error
      setIsEnabled(!newStatus);
      console.error("Failed to toggle feed status:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Feed Name</label>
        <input
          type="text"
          defaultValue={feed.name}
          className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Custom name for this feed (overrides the feed&apos;s original title)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Feed URL</label>
        <input
          type="url"
          defaultValue={feed.url}
          className="w-full px-3 py-2 border border-border rounded bg-muted"
          disabled
        />
        <p className="text-xs text-muted-foreground mt-1">
          Feed URL cannot be changed
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Categories</label>
        <select
          defaultValue={feed.category?.id || ""}
          className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Uncategorized</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          Assign this feed to a category
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        <input
          type="text"
          placeholder="tech, news, programming"
          className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Comma-separated tags for organization and search
        </p>
      </div>

      {/* Feed Status Section */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
        <div>
          <label htmlFor="enabled" className="text-sm font-medium cursor-pointer block">
            Enable this feed
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            When disabled, this feed will not be fetched during updates
          </p>
          {feed.healthStatus && feed.healthStatus !== "healthy" && (
            <p className="text-xs text-muted-foreground mt-1">
              Current status: <span className="font-medium">{feed.healthStatus}</span>
              {feed.consecutiveFailures > 0 && ` (${feed.consecutiveFailures} failures)`}
            </p>
          )}
        </div>
        <button
          onClick={handleToggle}
          disabled={toggleStatus.isPending}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled
              ? "bg-primary"
              : "bg-muted-foreground/30"
          } ${toggleStatus.isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          aria-label={isEnabled ? "Disable feed" : "Enable feed"}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function UpdateRefreshTab({ feed }: { feed: any }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Fetch Interval (minutes)</label>
        <input
          type="number"
          min="5"
          max="1440"
          defaultValue={feed.settings?.refreshInterval || 30}
          className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          How often to check for new articles (5-1440 minutes). Uses cascade system.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Fetch Timeout (seconds)</label>
        <input
          type="number"
          min="5"
          max="120"
          defaultValue={30}
          className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Maximum time to wait for feed response
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Max Retries</label>
        <input
          type="number"
          min="0"
          max="5"
          defaultValue={3}
          className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Number of retry attempts on failure
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Retry Backoff Strategy</label>
        <select className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="linear">Linear (5s, 10s, 15s)</option>
          <option value="exponential">Exponential (5s, 25s, 125s)</option>
          <option value="fixed">Fixed (5s, 5s, 5s)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Last Fetched</label>
        <div className="px-3 py-2 border border-border rounded bg-muted text-sm">
          {feed.lastFetched ? new Date(feed.lastFetched).toLocaleString() : "Never"}
        </div>
      </div>
    </div>
  );
}

function ContentProcessingTab({ feed }: { feed: any }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Max Articles Per Feed</label>
        <input
          type="number"
          min="10"
          max="1000"
          defaultValue={feed.settings?.maxArticlesPerFeed || 100}
          className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Maximum number of articles to keep for this feed
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Max Article Age (days)</label>
        <input
          type="number"
          min="1"
          max="365"
          defaultValue={feed.settings?.maxArticleAge || 30}
          className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Automatically delete articles older than this
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Content Extraction Method</label>
        <select className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="readability">Readability (Fast)</option>
          <option value="playwright">Playwright (JS-rendered content)</option>
          <option value="none">None (Use feed content only)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Content Filters</label>
        <textarea
          rows={3}
          placeholder="One filter per line (e.g., exclude:spam, require:important)"
          className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Filter rules for content processing
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="fullText" className="cursor-pointer" />
        <label htmlFor="fullText" className="text-sm cursor-pointer">
          Always fetch full article text
        </label>
      </div>
    </div>
  );
}

function ConnectionSettingsTab({ feed }: { feed: any }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Authentication Type</label>
        <select className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="none">None</option>
          <option value="basic">Basic Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="cookie">Cookie-based</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Custom Headers</label>
        <textarea
          rows={4}
          placeholder='{"User-Agent": "Custom/1.0", "Accept": "application/rss+xml"}'
          className="w-full px-3 py-2 border border-border rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          JSON object with custom HTTP headers
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">User Agent Override</label>
        <input
          type="text"
          placeholder="Mozilla/5.0 (compatible; NeuReed/1.0)"
          className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Proxy URL</label>
        <input
          type="url"
          placeholder="http://proxy.example.com:8080"
          className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="verifySsl" defaultChecked className="cursor-pointer" />
        <label htmlFor="verifySsl" className="text-sm cursor-pointer">
          Verify SSL certificates
        </label>
      </div>
    </div>
  );
}

function QualityHealthTab({ feed }: { feed: any }) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg border border-border bg-muted/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Health Status</span>
          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Healthy
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          Consecutive failures: {feed.errorCount || 0}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Auto-disable Threshold</label>
        <input
          type="number"
          min="1"
          max="50"
          defaultValue={10}
          className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Disable feed after this many consecutive failures
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Last Error</label>
        <div className="px-3 py-2 border border-border rounded bg-muted text-sm">
          {feed.lastError || "No errors recorded"}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="notifyError" className="cursor-pointer" />
        <label htmlFor="notifyError" className="text-sm cursor-pointer">
          Send notification on feed errors
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="notifyNew" className="cursor-pointer" />
        <label htmlFor="notifyNew" className="text-sm cursor-pointer">
          Send notification for new articles
        </label>
      </div>

      <div>
        <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors">
          View Error History
        </button>
      </div>
    </div>
  );
}

function PresentationTab({ feed }: { feed: any }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Feed Icon</label>
        <div className="flex items-center gap-4">
          {feed.imageUrl && (
            <img
              src={feed.imageUrl}
              alt={feed.name}
              className="w-16 h-16 rounded border border-border"
            />
          )}
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors">
              Upload Icon
            </button>
            <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors">
              Use Feed Icon
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Article Excerpt Length</label>
        <input
          type="number"
          min="50"
          max="500"
          defaultValue={200}
          className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Number of characters for article previews
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Display Format</label>
        <select className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="card">Card View</option>
          <option value="list">List View</option>
          <option value="compact">Compact View</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="showImages" defaultChecked className="cursor-pointer" />
        <label htmlFor="showImages" className="text-sm cursor-pointer">
          Show article images in preview
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="showExcerpt" defaultChecked className="cursor-pointer" />
        <label htmlFor="showExcerpt" className="text-sm cursor-pointer">
          Show article excerpt
        </label>
      </div>
    </div>
  );
}

function AdvancedOptionsTab({ feed }: { feed: any }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <input type="checkbox" id="enableCache" defaultChecked className="cursor-pointer" />
        <label htmlFor="enableCache" className="text-sm cursor-pointer">
          Enable response caching
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="conditionalGet" defaultChecked className="cursor-pointer" />
        <label htmlFor="conditionalGet" className="text-sm cursor-pointer">
          Use conditional GET (ETag/Last-Modified)
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Redirect Handling</label>
        <select className="w-full px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="follow">Follow redirects automatically</option>
          <option value="manual">Require manual approval</option>
          <option value="reject">Reject redirects</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Raw Feed Data</label>
        <textarea
          rows={10}
          className="w-full px-3 py-2 border border-border rounded font-mono text-xs bg-muted"
          readOnly
          placeholder="Raw feed XML/JSON will appear here after fetching"
        />
      </div>

      <div>
        <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted transition-colors">
          Fetch Raw Feed Data
        </button>
      </div>
    </div>
  );
}
