"use client";

import { useState, useRef, useEffect } from "react";
import { useImportOpml } from "@/hooks/queries/use-opml";

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
  onClose: () => void;
  onSuccess?: () => void;
}

export function OpmlImportModal({ onClose, onSuccess }: OpmlImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Use React Query mutation
  const importMutation = useImportOpml();
  const importing = importMutation.isPending;

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const validExtensions = [".opml", ".xml"];
    const hasValidExtension = validExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      setError("Please select a valid OPML or XML file");
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError("File size exceeds 10MB limit");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(false);
    setSummary(null);
    setImportErrors([]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    try {
      setError(null);
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
      setError(err instanceof Error ? err.message : "Import failed");
    }
  };

  const handleClose = () => {
    if (success && onSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div ref={modalRef} className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-lg border border-border bg-background shadow-xl border-border bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Import Feeds (OPML)
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 hover:bg-muted"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 180px)" }}>
          {success && summary ? (
            /* Success View */
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <div className="flex items-center gap-3">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-200">
                      Import Successful!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your feeds have been imported
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-4 border-border">
                  <div className="text-2xl font-bold text-primary dark:text-primary">
                    {summary.subscriptionsAdded}
                  </div>
                  <div className="text-sm text-foreground/70">
                    New Subscriptions
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4 border-border">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {summary.feedsCreated}
                  </div>
                  <div className="text-sm text-foreground/70">
                    New Feeds Created
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4 border-border">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {summary.categoriesCreated}
                  </div>
                  <div className="text-sm text-foreground/70">
                    New Categories
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4 border-border">
                  <div className="text-2xl font-bold text-foreground/70">
                    {summary.feedsSkipped}
                  </div>
                  <div className="text-sm text-foreground/70">
                    Already Existing
                  </div>
                </div>
              </div>

              {/* Errors */}
              {importErrors.length > 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
                  <h4 className="mb-2 font-semibold text-yellow-800 dark:text-yellow-200">
                    {importErrors.length} feed(s) could not be imported:
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
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
            <div className="space-y-6">
              {/* File Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/10 dark:bg-primary/20"
                    : "border-border hover:border-primary border-border"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".opml,.xml"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {file ? (
                  <div className="space-y-3">
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
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <svg className="mx-auto h-12 w-12 text-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div>
                      <p className="text-foreground/70">
                        Drag and drop your OPML file here, or{" "}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-primary hover:text-primary/90 dark:text-primary"
                        >
                          browse
                        </button>
                      </p>
                      <p className="mt-1 text-sm text-foreground/60">
                        Accepts .opml and .xml files (max 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
                  {error}
                </div>
              )}

              {/* Info */}
              <div className="rounded-lg bg-primary/10 p-4 dark:bg-primary/20">
                <h3 className="mb-2 font-semibold text-primary dark:text-primary">
                  What happens when you import?
                </h3>
                <ul className="space-y-1 text-sm text-primary/80 dark:text-primary/90">
                  <li>• New feeds will be created automatically</li>
                  <li>• Missing categories will be created</li>
                  <li>• You will be subscribed to all imported feeds</li>
                  <li>• Existing feeds will be skipped (no duplicates)</li>
                  <li>• Articles will be fetched for new feeds</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 border-border">
          <button
            onClick={handleClose}
            disabled={importing}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 border-border"
          >
            {success ? "Done" : "Cancel"}
          </button>
          {!success && (
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {importing ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </span>
              ) : (
                "Import OPML"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

