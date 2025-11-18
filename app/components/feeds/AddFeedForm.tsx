"use client";

import { useState } from "react";

interface AddFeedFormProps {
  onAdd: (url: string, name?: string) => Promise<void>;
  onClose: () => void;
}

export function AddFeedForm({ onAdd, onClose }: AddFeedFormProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [feedInfo, setFeedInfo] = useState<{
    title: string;
    description?: string;
    itemCount: number;
  } | null>(null);

  const handleValidate = async () => {
    if (!url) return;

    setIsValidating(true);
    setError(null);
    setFeedInfo(null);

    try {
      const response = await fetch("/api/feeds/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      console.log("Validation response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to validate feed");
      }

      // Check if response has the data wrapper
      const responseData = data.data || data;

      if (responseData.valid && responseData.feedInfo) {
        setFeedInfo(responseData.feedInfo);
        if (!name) {
          setName(responseData.feedInfo.title);
        }
      } else {
        setError(responseData.error || "Invalid feed URL");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate feed");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onAdd(url, name || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add feed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New Feed</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="url"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Feed URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/feed.xml"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                required
              />
              <button
                type="button"
                onClick={handleValidate}
                disabled={!url || isValidating}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                {isValidating ? "..." : "Validate"}
              </button>
            </div>
          </div>

          {feedInfo && (
            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium text-green-800 dark:text-green-200">
                    Valid feed found!
                  </div>
                  <div className="mt-1 text-xs text-green-700 dark:text-green-300">
                    {feedInfo.title} • {feedInfo.itemCount} articles
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Feed Name (optional)
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Auto-detected from feed"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !url}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Adding..." : "Add Feed"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

