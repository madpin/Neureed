"use client";

import { useState } from "react";
import type { ArticleSortOrder, ArticleSortDirection } from "@/lib/validations/article-validation";

interface ArticleSortDropdownProps {
  currentSortOrder: ArticleSortOrder;
  currentSortDirection: ArticleSortDirection;
  onSortChange: (sortOrder: ArticleSortOrder, sortDirection: ArticleSortDirection) => void;
  isLoading?: boolean;
}

interface SortOption {
  value: ArticleSortOrder;
  label: string;
  icon: string;
  directions: {
    asc: string;
    desc: string;
  };
}

const sortOptions: SortOption[] = [
  {
    value: "publishedAt",
    label: "Date Published",
    icon: "📅",
    directions: {
      desc: "Newest first",
      asc: "Oldest first",
    },
  },
  {
    value: "updatedAt",
    label: "Date Updated",
    icon: "🔄",
    directions: {
      desc: "Recently updated",
      asc: "Least recently updated",
    },
  },
  {
    value: "relevance",
    label: "Relevance",
    icon: "⭐",
    directions: {
      desc: "Most relevant",
      asc: "Least relevant",
    },
  },
  {
    value: "title",
    label: "Title",
    icon: "🔤",
    directions: {
      desc: "Z to A",
      asc: "A to Z",
    },
  },
  {
    value: "feed",
    label: "Feed",
    icon: "📁",
    directions: {
      desc: "Z to A",
      asc: "A to Z",
    },
  },
];

export function ArticleSortDropdown({
  currentSortOrder,
  currentSortDirection,
  onSortChange,
  isLoading = false,
}: ArticleSortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = sortOptions.find((opt) => opt.value === currentSortOrder);
  const currentLabel = currentOption
    ? `${currentOption.label}: ${currentOption.directions[currentSortDirection]}`
    : "Sort by";

  const handleSortSelect = (sortOrder: ArticleSortOrder, sortDirection: ArticleSortDirection) => {
    setIsOpen(false);
    onSortChange(sortOrder, sortDirection);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Sort articles"
      >
        <span className="text-base">{currentOption?.icon || "⚙️"}</span>
        <span className="hidden sm:inline">{currentLabel}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
            <div className="p-2">
              {sortOptions.map((option) => (
                <div key={option.value} className="mb-1">
                  <div className="px-3 py-2 text-xs font-semibold text-foreground/60 flex items-center gap-2">
                    <span className="text-base">{option.icon}</span>
                    <span>{option.label}</span>
                  </div>
                  <button
                    onClick={() => handleSortSelect(option.value, "desc")}
                    className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                      currentSortOrder === option.value && currentSortDirection === "desc"
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      <span>{option.directions.desc}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleSortSelect(option.value, "asc")}
                    className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                      currentSortOrder === option.value && currentSortDirection === "asc"
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                      <span>{option.directions.asc}</span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

