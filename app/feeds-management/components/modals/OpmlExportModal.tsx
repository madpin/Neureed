"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "@/app/components/ui";
import { useCategories } from "@/hooks/queries/use-categories";

interface OpmlExportModalProps {
  onClose: () => void;
}

/**
 * OPML Export Modal
 *
 * Allows users to export feeds to an OPML file.
 * Features:
 * - Select specific categories or all feeds
 * - Include/exclude feed settings
 * - Download as OPML file
 */
export function OpmlExportModal({ onClose }: OpmlExportModalProps) {
  const { data: categories = [] } = useCategories();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [includeAllCategories, setIncludeAllCategories] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(false);
  const [includeStats, setIncludeStats] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleExport = () => {
    const exportData = {
      categories: includeAllCategories ? "all" : selectedCategories,
      includeSettings,
      includeStats,
    };
    // TODO: Implement OPML export logic
    console.log("Exporting OPML:", exportData);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="md">
      <ModalHeader title="Export OPML" onClose={onClose} />
      <ModalBody>
        <div className="space-y-6">
        {/* Export All or Specific Categories */}
        <div>
          <label className="block text-sm font-medium mb-3">Export Scope</label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="exportAll"
                checked={includeAllCategories}
                onChange={() => setIncludeAllCategories(true)}
                className="cursor-pointer"
              />
              <label htmlFor="exportAll" className="text-sm cursor-pointer">
                Export all feeds and categories
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="exportSelected"
                checked={!includeAllCategories}
                onChange={() => setIncludeAllCategories(false)}
                className="cursor-pointer"
              />
              <label htmlFor="exportSelected" className="text-sm cursor-pointer">
                Export specific categories only
              </label>
            </div>
          </div>
        </div>

        {/* Category Selection */}
        {!includeAllCategories && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Categories ({selectedCategories.length} selected)
            </label>
            <div className="border border-border rounded-lg max-h-60 overflow-y-auto">
              {categories.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No categories available
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="cursor-pointer"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        {category.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {category.feedCount || 0} feeds
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Export Options */}
        <div>
          <label className="block text-sm font-medium mb-3">Export Options</label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeSettings"
                checked={includeSettings}
                onChange={(e) => setIncludeSettings(e.target.checked)}
                className="cursor-pointer"
              />
              <label htmlFor="includeSettings" className="text-sm cursor-pointer">
                Include feed settings (refresh intervals, filters, etc.)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeStats"
                checked={includeStats}
                onChange={(e) => setIncludeStats(e.target.checked)}
                className="cursor-pointer"
              />
              <label htmlFor="includeStats" className="text-sm cursor-pointer">
                Include statistics (article counts, last update times)
              </label>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="text-sm font-medium mb-2">Export Summary</div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              • {includeAllCategories ? "All categories" : `${selectedCategories.length} selected categories`}
            </div>
            <div>
              • {includeAllCategories
                ? `${categories.reduce((sum, cat) => sum + (cat.feedCount || 0), 0)} total feeds`
                : `~${categories.filter(c => selectedCategories.includes(c.id)).reduce((sum, cat) => sum + (cat.feedCount || 0), 0)} feeds`}
            </div>
            <div>
              • Settings: {includeSettings ? "Included" : "Not included"}
            </div>
            <div>
              • Statistics: {includeStats ? "Included" : "Not included"}
            </div>
          </div>
        </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleExport}
          disabled={!includeAllCategories && selectedCategories.length === 0}
        >
          Download OPML
        </Button>
      </ModalFooter>
    </Modal>
  );
}
