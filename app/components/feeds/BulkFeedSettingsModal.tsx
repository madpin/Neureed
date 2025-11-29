"use client";

import { useState, ReactNode } from "react";
import { toast } from "sonner";
import type { UserFeed } from "@/hooks/queries/use-feeds";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "@/app/components/ui";
import { NumberSettingField, SelectSettingField } from "@/app/components/feeds/management/shared";
import { useFormChanges } from "@/hooks/use-form-changes";

interface BulkFeedSettingsModalProps {
  isOpen: boolean;
  selectedFeeds: UserFeed[];
  onClose: () => void;
  onApply: (settings: BulkSettings) => Promise<void>;
}

export interface BulkSettings {
  refreshInterval?: number;
  maxArticlesPerFeed?: number;
  maxArticleAge?: number;
  extractionMethod?: "rss" | "readability" | "playwright";
}

// Default values
const DEFAULTS = {
  refreshInterval: 60,
  maxArticlesPerFeed: 500,
  maxArticleAge: 90,
  extractionMethod: "readability" as const,
};

// Bulk field wrapper component (inline helper)
function BulkFieldWrapper({
  children,
  isModified,
  onReset,
}: {
  children: ReactNode;
  isModified: boolean;
  onReset: () => void;
}) {
  return (
    <div className={`rounded-lg border p-3.5 space-y-2 transition-colors ${
      isModified ? "border-primary bg-primary/5" : "border-border bg-background"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isModified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Will update
            </span>
          )}
        </div>
        {isModified && (
          <button
            onClick={onReset}
            className="text-xs text-foreground/60 hover:text-foreground transition-colors"
            title="Reset to default"
            type="button"
          >
            Reset
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export function BulkFeedSettingsModal({
  isOpen,
  selectedFeeds,
  onClose,
  onApply,
}: BulkFeedSettingsModalProps) {
  const [isApplying, setIsApplying] = useState(false);

  // Use custom hook to track form changes
  const { values, modifiedFields, updateField, resetField, hasChanges, getChangedValues } = useFormChanges(DEFAULTS);

  const handleApply = async () => {
    // Validate at least one field has been modified
    if (!hasChanges) {
      toast.error("Please modify at least one setting");
      return;
    }

    // Get only the modified fields
    const settings = getChangedValues() as BulkSettings;

    try {
      setIsApplying(true);
      await onApply(settings);

      // Success message with details
      toast.success(
        `Successfully updated ${modifiedFields.size} setting${modifiedFields.size > 1 ? 's' : ''} for ${selectedFeeds.length} feed${selectedFeeds.length > 1 ? 's' : ''}`
      );

      onClose();
    } catch (error) {
      console.error("Failed to apply settings:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to apply settings: ${errorMessage}`);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <div>
          <h2 className="text-xl font-semibold">Bulk Edit Feed Settings</h2>
          <p className="mt-1 text-sm text-foreground/60">
            Apply settings to {selectedFeeds.length} selected feed{selectedFeeds.length > 1 ? 's' : ''}
          </p>
        </div>
      </ModalHeader>
      <ModalBody className="space-y-5">
          {/* Selected Feeds Preview */}
          <div>
            <h3 className="text-sm font-medium mb-2 text-foreground/70">Selected Feeds</h3>
            <div className="rounded-lg border border-border bg-muted/50 p-3 max-h-28 overflow-y-auto custom-scrollbar">
              <div className="space-y-1.5">
                {selectedFeeds.map((feed) => (
                  <div key={feed.id} className="flex items-center gap-2 text-sm text-foreground/80">
                    {feed.imageUrl ? (
                      <img
                        src={feed.imageUrl}
                        alt=""
                        className="h-4 w-4 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-4 w-4 rounded bg-muted flex-shrink-0" />
                    )}
                    <span className="truncate">{feed.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Info message */}
          <div className="rounded-lg bg-accent/5 border border-accent/20 p-3">
            <p className="text-xs text-foreground/70">
              💡 Modify any setting below to mark it for bulk update. Only changed settings will be applied.
            </p>
          </div>

          {/* Settings Form */}
          <div className="space-y-3">
            {/* Fetch Interval */}
            <BulkFieldWrapper
              isModified={modifiedFields.has("refreshInterval")}
              onReset={() => resetField("refreshInterval")}
            >
              <NumberSettingField
                label="Fetch Interval"
                value={values.refreshInterval}
                onChange={(val) => {
                  if (val !== null) {
                    updateField("refreshInterval", val);
                  }
                }}
                min={15}
                max={1440}
                unit="minutes"
                showReset={false}
                helperText="Minutes between fetches (15-1440)"
              />
            </BulkFieldWrapper>

            {/* Max Articles Per Feed */}
            <BulkFieldWrapper
              isModified={modifiedFields.has("maxArticlesPerFeed")}
              onReset={() => resetField("maxArticlesPerFeed")}
            >
              <NumberSettingField
                label="Max Articles Per Feed"
                value={values.maxArticlesPerFeed}
                onChange={(val) => {
                  if (val !== null) {
                    updateField("maxArticlesPerFeed", val);
                  }
                }}
                min={50}
                max={5000}
                unit="articles"
                showReset={false}
                helperText="Maximum number of articles to keep (50-5000)"
              />
            </BulkFieldWrapper>

            {/* Max Article Age */}
            <BulkFieldWrapper
              isModified={modifiedFields.has("maxArticleAge")}
              onReset={() => resetField("maxArticleAge")}
            >
              <NumberSettingField
                label="Max Article Age"
                value={values.maxArticleAge}
                onChange={(val) => {
                  if (val !== null) {
                    updateField("maxArticleAge", val);
                  }
                }}
                min={1}
                max={365}
                unit="days"
                showReset={false}
                helperText="Days to keep articles (1-365)"
              />
            </BulkFieldWrapper>

            {/* Content Extraction Method */}
            <BulkFieldWrapper
              isModified={modifiedFields.has("extractionMethod")}
              onReset={() => resetField("extractionMethod")}
            >
              <SelectSettingField
                label="Content Extraction Method"
                value={values.extractionMethod}
                onChange={(val) => {
                  if (val !== null) {
                    updateField("extractionMethod", val as any);
                  }
                }}
                options={[
                  { value: 'rss', label: 'RSS Only (Default)' },
                  { value: 'readability', label: 'Readability (Clean extraction)' },
                  { value: 'playwright', label: 'Playwright (JS-rendered content)' }
                ]}
                showReset={false}
              />
              <div className="rounded bg-muted/50 px-2 py-1.5 mt-2">
                <p className="text-xs text-foreground/60">
                  ⚠️ This applies system-wide to all users of these feeds
                </p>
              </div>
            </BulkFieldWrapper>
          </div>
      </ModalBody>
      <ModalFooter align="between">
        <div className="text-sm text-foreground/60">
          {modifiedFields.size > 0 ? (
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {modifiedFields.size} setting{modifiedFields.size > 1 ? 's' : ''} will be updated
            </span>
          ) : (
            <span>No changes made</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isApplying}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            disabled={isApplying || modifiedFields.size === 0}
            loading={isApplying}
          >
            Apply to Selected
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
