"use client";

import { useState } from "react";
import { useImportOpml } from "@/hooks/queries/use-opml";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, StatCard } from "@/app/components/ui";
import { useFileDrop } from "@/hooks/use-file-drop";

interface ImportSummary {
  totalFeeds: number;
  feedsCreated: number;
  feedsSkipped: number;
  subscriptionsAdded: number;
  categoriesCreated: number;
}

interface ImportError {
  feedUrl: string;
  feedTitle: string;
  error: string;
}

interface OpmlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function OpmlImportModal({ isOpen, onClose, onSuccess }: OpmlImportModalProps) {
  const [success, setSuccess] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);

  // Use React Query mutation
  const importMutation = useImportOpml();
  const importing = importMutation.isPending;

  // Use custom hook for file drop handling
  const { file, isDragging, error, handleDrag, handleDrop, reset } = useFileDrop({
    accept: ['.opml', '.xml'],
    maxSize: 10 * 1024 * 1024, // 10MB
    errorMessages: {
      invalidType: 'Please select a valid OPML or XML file',
      sizeTooLarge: 'File size exceeds 10MB limit',
    },
    onFileSelect: () => {
      // Reset success state when new file is selected
      setSuccess(false);
      setSummary(null);
      setImportErrors([]);
    },
  });

  // Simulate file input click for browse functionality
  const triggerFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.opml,.xml';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        // Create a synthetic drag event to reuse handleDrop
        const syntheticEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
          dataTransfer: { files: target.files },
        } as React.DragEvent;
        handleDrop(syntheticEvent);
      }
    };
    input.click();
  };

  const handleImport = async () => {
    if (!file) {
      return; // Error is already handled by useFileDrop
    }

    try {
      setSuccess(false);

      const result = await importMutation.mutateAsync(file);

      // Success
      setSuccess(true);
      setSummary({
        totalFeeds: (result as any).totalFeeds || 0,
        feedsCreated: result.imported || 0,
        feedsSkipped: 0,
        subscriptionsAdded: result.imported || 0,
        categoriesCreated: 0,
      });
      setImportErrors((result.errors || []).map((err: any) =>
        typeof err === 'string' ? { feedUrl: '', feedTitle: '', error: err } : err
      ));

      // Call onSuccess callback if provided
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (err) {
      // Import errors are shown via importErrors state
      console.error('Import failed:', err);
    }
  };

  const handleClose = () => {
    if (success && onSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader title="Import Feeds (OPML)" onClose={handleClose} />
      <ModalBody>
          {success && summary ? (
            /* Success View */
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-900/20" style={{ padding: "var(--space-4)" }}>
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">Import Successful!</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">Your feeds have been imported</p>
                </div>
              </div>

              {/* Summary Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-4)" }}>
                <StatCard
                  title="Subscriptions"
                  value={summary.subscriptionsAdded}
                  label="New subscriptions added"
                  iconColor="blue"
                />
                <StatCard
                  title="Feeds"
                  value={summary.feedsCreated}
                  label="New feeds created"
                  iconColor="green"
                />
                <StatCard
                  title="Categories"
                  value={summary.categoriesCreated}
                  label="New categories"
                  iconColor="purple"
                />
                <StatCard
                  title="Skipped"
                  value={summary.feedsSkipped}
                  label="Already existing"
                />
              </div>

              {/* Errors */}
              {importErrors.length > 0 && (
                <div
                  className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20"
                  style={{ padding: "var(--space-4)" }}
                >
                  <h4 style={{ marginBottom: "var(--space-2)" }} className="font-semibold text-yellow-800 dark:text-yellow-200">
                    {importErrors.length} feed(s) could not be imported:
                  </h4>
                  <div style={{ maxHeight: "8rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                    {importErrors.map((err, idx) => (
                      <div key={idx} className="text-sm text-yellow-700 dark:text-yellow-300">
                        <span className="font-medium">{err.feedTitle}</span>: {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Upload View */
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
              {/* File Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative rounded-lg border-2 border-dashed text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/10 dark:bg-primary/20"
                    : "border-border hover:border-primary border-border"
                }`}
                style={{ padding: "var(--space-8)", transition: "var(--transition-base)" }}
              >
                {file ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    <svg className="mx-auto h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="text-sm text-foreground/60">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={reset}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                      style={{ transition: "var(--transition-fast)" }}
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    <svg className="mx-auto h-12 w-12 text-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div>
                      <p className="text-foreground/70">
                        Drag and drop your OPML file here, or{" "}
                        <button
                          onClick={triggerFileSelect}
                          className="text-primary hover:text-primary/90 dark:text-primary"
                          style={{ transition: "var(--transition-fast)" }}
                        >
                          browse
                        </button>
                      </p>
                      <p style={{ marginTop: "var(--space-1)" }} className="text-sm text-foreground/60">
                        Accepts .opml and .xml files (max 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="rounded-lg bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                  style={{ padding: "var(--space-4)" }}
                >
                  {error}
                </div>
              )}

              {/* Info */}
              <div
                className="rounded-lg bg-primary/10 dark:bg-primary/20"
                style={{ padding: "var(--space-4)" }}
              >
                <h3 style={{ marginBottom: "var(--space-2)" }} className="font-semibold text-primary dark:text-primary">
                  What happens when you import?
                </h3>
                <ul style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }} className="text-sm text-primary/80 dark:text-primary/90">
                  <li>• New feeds will be created automatically</li>
                  <li>• Missing categories will be created</li>
                  <li>• You will be subscribed to all imported feeds</li>
                  <li>• Existing feeds will be skipped (no duplicates)</li>
                  <li>• Articles will be fetched for new feeds</li>
                </ul>
              </div>
            </div>
          )}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={importing}
        >
          {success ? "Done" : "Cancel"}
        </Button>
        {!success && (
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={!file || importing}
            loading={importing}
          >
            Import OPML
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

