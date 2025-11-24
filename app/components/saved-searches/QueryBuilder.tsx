"use client";

import { useState, useRef, useEffect } from "react";
import { QuerySyntaxHelper } from "./QuerySyntaxHelper";
import { usePreviewSearch } from "@/hooks/queries/use-saved-searches";
import type { Article } from "@/hooks/queries/use-articles";

interface QueryBuilderProps {
  value: string;
  onChange: (query: string) => void;
  onPreview?: () => void;
  showPreview?: boolean;
  placeholder?: string;
}

/**
 * Query builder component with syntax highlighting and preview
 */
export function QueryBuilder({
  value,
  onChange,
  onPreview,
  showPreview = false,
  placeholder = "Enter your search query...",
}: QueryBuilderProps) {
  const [showHelper, setShowHelper] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Preview query
  const { data: previewArticles, isLoading: isPreviewLoading } = usePreviewSearch(
    showPreview ? value : ""
  );

  // Validate query syntax (basic validation)
  const validateQuery = (query: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check for unbalanced quotes
    const quotes = (query.match(/"/g) || []).length;
    if (quotes % 2 !== 0) {
      errors.push("Unbalanced quotes");
    }

    // Check for unbalanced parentheses
    let parenCount = 0;
    for (const char of query) {
      if (char === "(") parenCount++;
      if (char === ")") parenCount--;
      if (parenCount < 0) {
        errors.push("Unbalanced parentheses");
        break;
      }
    }
    if (parenCount > 0) {
      errors.push("Unclosed parentheses");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const validation = validateQuery(value);

  // Handle operator insertion
  const handleInsertOperator = (operator: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = value;

    // Insert operator at cursor position
    const before = text.substring(0, start);
    const after = text.substring(end);

    let newText: string;
    let newCursorPos: number;

    if (operator === "+") {
      newText = `${before}+${after}`;
      newCursorPos = start + 1;
    } else if (operator === "-") {
      newText = `${before}-${after}`;
      newCursorPos = start + 1;
    } else if (operator === ",") {
      newText = `${before}, ${after}`;
      newCursorPos = start + 2;
    } else {
      newText = `${before}${operator}${after}`;
      newCursorPos = start + operator.length;
    }

    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Track cursor position
  const handleCursorChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  // Auto-balance quotes and parentheses
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '"' && !e.shiftKey) {
      const start = textareaRef.current?.selectionStart || 0;
      const end = textareaRef.current?.selectionEnd || 0;

      // If text is selected, wrap it in quotes
      if (start !== end) {
        e.preventDefault();
        const selectedText = value.substring(start, end);
        const before = value.substring(0, start);
        const after = value.substring(end);
        const newText = `${before}"${selectedText}"${after}`;
        onChange(newText);

        setTimeout(() => {
          textareaRef.current?.setSelectionRange(start + selectedText.length + 2, start + selectedText.length + 2);
        }, 0);
      }
    } else if (e.key === "(" && !e.shiftKey) {
      const start = textareaRef.current?.selectionStart || 0;
      const end = textareaRef.current?.selectionEnd || 0;

      // If text is selected, wrap it in parentheses
      if (start !== end) {
        e.preventDefault();
        const selectedText = value.substring(start, end);
        const before = value.substring(0, start);
        const after = value.substring(end);
        const newText = `${before}(${selectedText})${after}`;
        onChange(newText);

        setTimeout(() => {
          textareaRef.current?.setSelectionRange(start + selectedText.length + 2, start + selectedText.length + 2);
        }, 0);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Query Input */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleCursorChange}
          onClick={handleCursorChange}
          onKeyUp={handleCursorChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          className={`w-full rounded-lg border ${
            !validation.valid && value.length > 0
              ? "border-red-500 focus:ring-red-500"
              : "border-border focus:ring-primary"
          } bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-secondary focus:outline-none focus:ring-2`}
        />

        {/* Character count */}
        <div className="absolute bottom-2 right-2 text-xs text-secondary">
          {value.length} chars
        </div>
      </div>

      {/* Validation Errors */}
      {!validation.valid && value.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-50 dark:bg-red-950/30 p-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400"
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
          <div>
            <h4 className="text-sm font-semibold text-red-900 dark:text-red-200">
              Syntax Errors
            </h4>
            <ul className="mt-1 space-y-1 text-sm text-red-800 dark:text-red-300">
              {validation.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Quick Operators */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-secondary">Quick insert:</span>
        <button
          onClick={() => handleInsertOperator("+")}
          className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
          title="Required term (AND)"
        >
          + AND
        </button>
        <button
          onClick={() => handleInsertOperator("-")}
          className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
          title="Exclude term (NOT)"
        >
          - NOT
        </button>
        <button
          onClick={() => handleInsertOperator(",")}
          className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
          title="Alternative term (OR)"
        >
          , OR
        </button>
        <button
          onClick={() => setShowHelper(!showHelper)}
          className="ml-auto text-xs text-primary hover:underline"
        >
          {showHelper ? "Hide" : "Show"} syntax help
        </button>
      </div>

      {/* Syntax Helper */}
      {showHelper && <QuerySyntaxHelper onInsertOperator={handleInsertOperator} />}

      {/* Preview Results */}
      {showPreview && value.length >= 2 && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              Preview Results
            </h4>
            {isPreviewLoading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            )}
          </div>

          {previewArticles && previewArticles.length > 0 ? (
            <div className="space-y-2">
              {previewArticles.slice(0, 5).map((article: Article) => (
                <div
                  key={article.id}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <h5 className="mb-1 text-sm font-medium text-foreground line-clamp-1">
                    {article.title}
                  </h5>
                  {article.excerpt && (
                    <p className="text-xs text-secondary line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}
                </div>
              ))}
              {previewArticles.length > 5 && (
                <p className="text-xs text-secondary text-center pt-2">
                  +{previewArticles.length - 5} more articles
                </p>
              )}
            </div>
          ) : (
            !isPreviewLoading && (
              <p className="text-sm text-secondary text-center py-4">
                No matching articles found
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
