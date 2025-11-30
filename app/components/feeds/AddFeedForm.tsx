"use client";

import { useState } from "react";
import { useValidateFeed } from "@/hooks/queries/use-feeds";
import { useCategories } from "@/hooks/queries/use-categories";
import { Button } from "@/app/components/ui";
import {
  Form,
  FormField,
  ControlledInput,
  ControlledSelect,
} from "@/app/components/ui/Form";
import { addFeedSchema, type AddFeedFormData, type ExtractionMethod } from "@/lib/schemas/feed-schemas";

interface AddFeedFormProps {
  onAdd: (
    url: string,
    name?: string,
    categoryIds?: string[],
    extractionMethod?: ExtractionMethod
  ) => Promise<void>;
  onClose: () => void;
}

export function AddFeedForm({ onAdd, onClose }: AddFeedFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedInfo, setFeedInfo] = useState<{
    title: string;
    description?: string;
    itemCount: number;
  } | null>(null);

  // Use React Query hooks
  const validateMutation = useValidateFeed();
  const { data: categories } = useCategories();

  const handleValidate = async (url: string) => {
    if (!url) return;

    setError(null);
    setFeedInfo(null);

    try {
      const result = await validateMutation.mutateAsync(url);

      if (result.valid && result.feedInfo) {
        setFeedInfo({
          title: result.feedInfo.title || "",
          description: result.feedInfo.description,
          itemCount: result.feedInfo.itemCount || 0,
        });
        return result.feedInfo.title;
      } else {
        setError(result.error || "Invalid feed URL");
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate feed");
      return null;
    }
  };

  const handleSubmit = async (data: AddFeedFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await onAdd(
        data.url,
        data.name || undefined,
        data.categoryIds && data.categoryIds.length > 0 ? data.categoryIds : undefined,
        data.extractionMethod
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add feed");
      setIsLoading(false); // Only set false on error, success unmounts
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New Feed</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-muted"
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

        <Form
          schema={addFeedSchema}
          onSubmit={handleSubmit}
          defaultValues={{
            url: "",
            name: "",
            categoryIds: [],
            extractionMethod: "readability",
          }}
        >
          {({ watch, setValue }) => {
            const url = watch("url");
            const name = watch("name");

            return (
              <div className="space-y-4">
                <FormField
                  label="Feed URL"
                  htmlFor="url"
                  name="url"
                  required
                >
                  <div className="flex gap-2">
                    <ControlledInput
                      name="url"
                      type="url"
                      placeholder="https://example.com/feed.xml"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={async () => {
                        const title = await handleValidate(url);
                        if (title && !name) {
                          setValue("name", title);
                        }
                      }}
                      disabled={!url || validateMutation.isPending}
                      variant="secondary"
                      size="sm"
                    >
                      {validateMutation.isPending ? "..." : "Validate"}
                    </Button>
                  </div>
                </FormField>

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
                          {feedInfo.title}
                          {feedInfo.description && ` • ${feedInfo.description}`}
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

                <FormField
                  label="Feed Name (optional)"
                  htmlFor="name"
                  name="name"
                  description="Auto-detected from feed"
                >
                  <ControlledInput
                    name="name"
                    type="text"
                    placeholder="Auto-detected from feed"
                  />
                </FormField>

                <FormField
                  label="Categories (optional)"
                  htmlFor="categoryIds"
                  name="categoryIds"
                  description="Hold Ctrl/Cmd to select multiple categories"
                >
                  <ControlledSelect
                    name="categoryIds"
                    multiple
                    size={Math.min((categories?.length || 0) + 1, 5)}
                  >
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </ControlledSelect>
                </FormField>

                <FormField
                  label="Extraction Method"
                  htmlFor="extractionMethod"
                  name="extractionMethod"
                  description="Choose how to extract article content. Readability works for most sites."
                >
                  <ControlledSelect name="extractionMethod">
                    <option value="readability">Readability (Default - Fast)</option>
                    <option value="rss">RSS Only (No extraction)</option>
                    <option value="playwright">Playwright (JS-rendered content)</option>
                    <option value="custom">Custom Selector</option>
                  </ControlledSelect>
                </FormField>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !url}
                    variant="primary"
                    className="flex-1"
                  >
                    {isLoading ? "Adding..." : "Add Feed"}
                  </Button>
                </div>
              </div>
            );
          }}
        </Form>
      </div>
    </div>
  );
}
