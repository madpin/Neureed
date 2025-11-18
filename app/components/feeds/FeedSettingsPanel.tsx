"use client";

import { useState, useEffect } from "react";
import { CookieGuide } from "./CookieGuide";

interface FeedSettingsPanelProps {
  feedId: string;
  feedName: string;
  onClose: () => void;
}

interface ExtractionSettings {
  method: "rss" | "readability" | "playwright" | "custom";
  requiresAuth: boolean;
  contentMergeStrategy?: "replace" | "prepend" | "append";
  cookies?: { value: string };
  headers?: Record<string, string>;
  customSelector?: string;
  timeout?: number;
  lastTestedAt?: string;
  lastTestStatus?: "success" | "failed" | "pending";
  lastTestError?: string;
}

export function FeedSettingsPanel({
  feedId,
  feedName,
  onClose,
}: FeedSettingsPanelProps) {
  const [settings, setSettings] = useState<ExtractionSettings>({
    method: "rss",
    requiresAuth: false,
    contentMergeStrategy: "replace",
  });
  const [cookies, setCookies] = useState("");
  const [headers, setHeaders] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Load settings
  useEffect(() => {
    loadSettings();
  }, [feedId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/feeds/${feedId}/settings`);
      const data = await response.json();

      if (data.data?.settings) {
        setSettings(data.data.settings);
        if (data.data.settings.cookies?.value) {
          setCookies(data.data.settings.cookies.value);
        }
        if (data.data.settings.headers) {
          setHeaders(JSON.stringify(data.data.settings.headers, null, 2));
        }
      }
    } catch (err) {
      setError("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const updates: any = {
        method: settings.method,
        requiresAuth: settings.requiresAuth,
        contentMergeStrategy: settings.contentMergeStrategy,
        customSelector: settings.customSelector,
        timeout: settings.timeout,
      };

      if (cookies.trim()) {
        updates.cookies = cookies;
      }

      if (headers.trim()) {
        try {
          updates.headers = JSON.parse(headers);
        } catch {
          setError("Invalid JSON in headers field");
          return;
        }
      }

      const response = await fetch(`/api/feeds/${feedId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      await loadSettings();
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setIsTesting(true);
      setError(null);
      setTestResult(null);

      const response = await fetch(`/api/feeds/${feedId}/test-extraction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || "Test failed";
        // Show a helpful message if no articles available
        if (errorMsg.includes("No article URL available")) {
          setError("No articles found in this feed yet. Please refresh the feed first, then test extraction.");
        } else {
          setError(errorMsg);
        }
        return;
      }

      setTestResult(data.data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed");
    } finally {
      setIsTesting(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Clear all extraction settings? This will reset to RSS-only mode.")) {
      return;
    }

    try {
      const response = await fetch(`/api/feeds/${feedId}/settings`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear settings");
      }

      setSettings({ method: "rss", requiresAuth: false, contentMergeStrategy: "replace" });
      setCookies("");
      setHeaders("");
      setTestResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear settings");
    }
  };

  const handleDeleteArticles = async () => {
    if (!confirm(`Delete all articles from "${feedName}"? This cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(`/api/feeds/${feedId}/delete-articles`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete articles");
      }

      const data = await response.json();
      alert(`Deleted ${data.data.count} articles`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete articles");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefreshFeed = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const response = await fetch(`/api/feeds/${feedId}/refresh`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to refresh feed");
      }

      const data = await response.json();
      alert(`Feed refreshed! ${data.data.newArticles} new articles, ${data.data.updatedArticles} updated`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh feed");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-gray-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold">Feed Settings</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{feedName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Extraction method */}
          <div>
            <label className="mb-2 block text-sm font-medium">Extraction Method</label>
            <select
              value={settings.method}
              onChange={(e) => setSettings({ ...settings, method: e.target.value as any })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="rss">RSS Only (Default)</option>
              <option value="readability">Readability (Clean extraction)</option>
              <option value="playwright">Playwright (JS-rendered content)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Choose how to extract content from articles
            </p>
          </div>

          {/* Requires authentication */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requiresAuth"
              checked={settings.requiresAuth}
              onChange={(e) => setSettings({ ...settings, requiresAuth: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="requiresAuth" className="text-sm">
              Requires authentication (cookies needed)
            </label>
          </div>

          {/* Content merge strategy */}
          {settings.method !== "rss" && (
            <div>
              <label className="mb-2 block text-sm font-medium">Content Merge Strategy</label>
              <select
                value={settings.contentMergeStrategy || "replace"}
                onChange={(e) => setSettings({ ...settings, contentMergeStrategy: e.target.value as any })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              >
                <option value="replace">Replace - Use only extracted content</option>
                <option value="prepend">Prepend - Extracted content first, then RSS</option>
                <option value="append">Append - RSS content first, then extracted</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                How to combine extracted content with RSS feed content
              </p>
            </div>
          )}

          {/* Cookies */}
          {settings.requiresAuth && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">Cookies</label>
                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {showGuide ? "Hide" : "Show"} Guide
                </button>
              </div>
              
              {showGuide && (
                <div className="mb-4">
                  <CookieGuide />
                </div>
              )}

              <textarea
                value={cookies}
                onChange={(e) => setCookies(e.target.value)}
                placeholder='[{"name": "session", "value": "..."}] or key=value format'
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Cookies are encrypted before storage
              </p>
            </div>
          )}

          {/* Custom headers */}
          <div>
            <label className="mb-2 block text-sm font-medium">Custom Headers (JSON)</label>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              placeholder='{"User-Agent": "...", "Authorization": "..."}'
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          {/* Custom selector */}
          <div>
            <label className="mb-2 block text-sm font-medium">Custom CSS Selector (optional)</label>
            <input
              type="text"
              value={settings.customSelector || ""}
              onChange={(e) => setSettings({ ...settings, customSelector: e.target.value })}
              placeholder="article.main-content"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          {/* Test status */}
          {settings.lastTestedAt && (
            <div className={`rounded-lg p-3 ${settings.lastTestStatus === "success" ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
              <div className="flex items-center gap-2">
                <svg className={`h-5 w-5 ${settings.lastTestStatus === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {settings.lastTestStatus === "success" ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${settings.lastTestStatus === "success" ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}>
                    Last test: {settings.lastTestStatus}
                  </div>
                  <div className={`text-xs ${settings.lastTestStatus === "success" ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                    {new Date(settings.lastTestedAt).toLocaleString()}
                  </div>
                  {settings.lastTestError && (
                    <div className="text-xs text-red-700 dark:text-red-300 mt-1">{settings.lastTestError}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Test info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Testing will extract content from the most recent article in this feed. 
              Make sure the feed has been refreshed at least once before testing.
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`rounded-lg p-3 ${testResult.success ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
              <div className="text-sm font-medium mb-2">Test Result</div>
              <div className="text-xs space-y-1">
                <div>Method: {testResult.method}</div>
                <div>Duration: {testResult.duration}ms</div>
                {testResult.title && <div>Title: {testResult.title}</div>}
                {testResult.contentPreview && (
                  <div className="mt-2">
                    <div className="font-medium mb-1">Content Preview:</div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded text-xs max-h-32 overflow-y-auto">
                      {testResult.contentPreview}
                    </div>
                  </div>
                )}
                {testResult.error && <div className="text-red-600 dark:text-red-400">Error: {testResult.error}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 dark:border-gray-700 space-y-3">
          {/* Feed actions */}
          <div className="flex gap-2">
            <button
              onClick={handleRefreshFeed}
              disabled={isRefreshing}
              className="flex-1 rounded-lg border border-blue-300 px-4 py-2 font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              {isRefreshing ? "Refreshing..." : "Refresh Feed"}
            </button>
            <button
              onClick={handleDeleteArticles}
              disabled={isDeleting}
              className="flex-1 rounded-lg border border-red-300 px-4 py-2 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {isDeleting ? "Deleting..." : "Delete All Articles"}
            </button>
          </div>

          {/* Settings actions */}
          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {isTesting ? "Testing..." : "Test Extraction"}
            </button>
            <button
              onClick={handleClear}
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Clear Settings
            </button>
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

