"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "@/app/components/ui";
import { useCategories } from "@/hooks/queries/use-categories";

interface OpmlImportModalProps {
  onClose: () => void;
}

/**
 * OPML Import Modal
 *
 * Allows users to import feeds from an OPML file.
 * Features:
 * - File upload (drag-drop or click)
 * - Preview feeds before importing
 * - Category mapping for imported feeds
 * - Option to create new categories
 */
export function OpmlImportModal({ onClose }: OpmlImportModalProps) {
  const { data: categories = [] } = useCategories();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState("");
  const [createMissingCategories, setCreateMissingCategories] = useState(true);

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
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".opml") || droppedFile.name.endsWith(".xml")) {
        setFile(droppedFile);
      } else {
        alert("Please upload an OPML or XML file");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) return;
    // TODO: Implement OPML import logic
    console.log("Importing OPML:", { file, defaultCategory, createMissingCategories });
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <ModalHeader title="Import OPML" onClose={onClose} />
      <ModalBody>
        <div className="space-y-6">
        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium mb-2">OPML File</label>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".opml,.xml"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2">
              <svg
                className="w-12 h-12 mx-auto text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <div className="text-sm text-muted-foreground">
                {file ? (
                  <span className="font-medium text-foreground">{file.name}</span>
                ) : (
                  <>
                    <span className="font-medium text-foreground">Click to upload</span> or drag and drop
                  </>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                OPML or XML files only
              </div>
            </div>
          </div>
        </div>

        {/* Import Options */}
        {file && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Default Category</label>
              <select
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
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
                Feeds without categories will be placed here
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createCategories"
                  checked={createMissingCategories}
                  onChange={(e) => setCreateMissingCategories(e.target.checked)}
                  className="cursor-pointer"
                />
                <label htmlFor="createCategories" className="text-sm cursor-pointer">
                  Create missing categories from OPML file
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="skipDuplicates"
                  defaultChecked
                  className="cursor-pointer"
                />
                <label htmlFor="skipDuplicates" className="text-sm cursor-pointer">
                  Skip feeds that already exist (match by URL)
                </label>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="text-sm font-medium mb-2">Import Preview</div>
              <div className="text-sm text-muted-foreground">
                File selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Feed preview will appear here after parsing
              </div>
            </div>
          </>
        )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleImport}
          disabled={!file}
        >
          Import Feeds
        </Button>
      </ModalFooter>
    </Modal>
  );
}
