"use client";

import { useState, useEffect } from "react";

interface QuerySyntaxHelperProps {
  onInsertOperator?: (operator: string) => void;
}

/**
 * Component displaying query syntax help and providing quick insert buttons
 * Simplified on mobile with expandable sections
 */
export function QuerySyntaxHelper({ onInsertOperator }: QuerySyntaxHelperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const syntaxExamples = [
    {
      operator: ",",
      name: "OR",
      description: "Match any of the terms",
      example: 'AI, "machine learning"',
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      operator: "+",
      name: "AND (Required)",
      description: "Must contain this term",
      example: "+AI +ethics",
      color: "text-green-600 dark:text-green-400",
    },
    {
      operator: "-",
      name: "NOT (Exclude)",
      description: "Must not contain this term",
      example: "AI -chatbot",
      color: "text-red-600 dark:text-red-400",
    },
    {
      operator: '"..."',
      name: "Phrase",
      description: "Exact phrase match",
      example: '"artificial intelligence"',
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      operator: "()",
      name: "Grouping",
      description: "Group terms together",
      example: "(AI, ML) +ethics",
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  if (isMobile) {
    // Mobile: Simplified accordion-style interface
    return (
      <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
        <h3 className="text-sm font-semibold text-foreground">Query Syntax Help</h3>

        {/* Quick operators */}
        <div className="grid grid-cols-3 gap-2">
          {syntaxExamples.slice(0, 3).map((item) => (
            <button
              key={item.operator}
              onClick={() =>
                setExpandedSection(expandedSection === item.operator ? null : item.operator)
              }
              className="flex flex-col items-center gap-1 rounded-lg border border-border bg-background p-2 text-center"
            >
              <code className={`text-sm font-mono font-bold ${item.color}`}>
                {item.operator}
              </code>
              <span className="text-xs text-secondary">{item.name}</span>
            </button>
          ))}
        </div>

        {/* Expanded details */}
        {expandedSection && (
          <div className="rounded-lg border border-border bg-background p-3 space-y-2">
            {syntaxExamples
              .filter((item) => item.operator === expandedSection)
              .map((item) => (
                <div key={item.operator}>
                  <p className="text-sm text-foreground font-medium mb-1">{item.name}</p>
                  <p className="text-xs text-secondary mb-2">{item.description}</p>
                  <div className="rounded bg-muted px-2 py-1">
                    <code className="text-xs font-mono text-foreground">{item.example}</code>
                  </div>
                  {onInsertOperator && item.operator !== '"..."' && item.operator !== "()" && (
                    <button
                      onClick={() => {
                        onInsertOperator(item.operator);
                        setExpandedSection(null);
                      }}
                      className="mt-2 w-full rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    >
                      Insert {item.operator}
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Collapsible advanced section */}
        <button
          onClick={() => setExpandedSection(expandedSection === 'advanced' ? null : 'advanced')}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-2 text-left"
        >
          <span className="text-xs font-medium text-foreground">More operators & examples</span>
          <svg
            className={`h-4 w-4 transition-transform ${expandedSection === 'advanced' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expandedSection === 'advanced' && (
          <div className="space-y-2 rounded-lg border border-border bg-background p-3">
            {syntaxExamples.slice(3).map((item) => (
              <div key={item.operator} className="pb-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className={`text-xs font-mono font-semibold ${item.color}`}>
                    {item.operator}
                  </code>
                  <span className="text-xs font-medium text-foreground">{item.name}</span>
                </div>
                <p className="text-xs text-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop: Full interface
  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Query Syntax
        </h3>
        <p className="text-xs text-secondary">
          Build powerful queries using operators to find exactly what you need.
        </p>
      </div>

      <div className="space-y-3">
        {syntaxExamples.map((item) => (
          <div
            key={item.operator}
            className="rounded-lg border border-border bg-background p-3"
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <code
                  className={`rounded bg-muted px-2 py-0.5 text-xs font-mono font-semibold ${item.color}`}
                >
                  {item.operator}
                </code>
                <span className="text-sm font-medium text-foreground">
                  {item.name}
                </span>
              </div>
              {onInsertOperator && item.operator !== '"..."' && item.operator !== "()" && (
                <button
                  onClick={() => onInsertOperator(item.operator)}
                  className="text-xs text-primary hover:underline"
                  title={`Insert ${item.operator}`}
                >
                  Insert
                </button>
              )}
            </div>
            <p className="mb-2 text-xs text-secondary">{item.description}</p>
            <div className="rounded bg-muted px-2 py-1">
              <code className="text-xs font-mono text-foreground">
                {item.example}
              </code>
            </div>
          </div>
        ))}
      </div>

      {/* Complex Examples */}
      <div className="border-t border-border pt-4">
        <h4 className="mb-2 text-sm font-semibold text-foreground">
          Complex Examples
        </h4>
        <div className="space-y-2">
          <div className="rounded bg-muted px-3 py-2">
            <code className="text-xs font-mono text-foreground">
              (+AI, +&quot;machine learning&quot;) +ethics -chatbot
            </code>
            <p className="mt-1 text-xs text-secondary">
              Articles about AI or ML, must include ethics, but not chatbot
            </p>
          </div>
          <div className="rounded bg-muted px-3 py-2">
            <code className="text-xs font-mono text-foreground">
              &quot;climate change&quot; +(policy, regulation) -opinion
            </code>
            <p className="mt-1 text-xs text-secondary">
              Exact phrase &quot;climate change&quot; with policy or regulation, excluding
              opinions
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-lg border border-border bg-blue-50 dark:bg-blue-950/30 p-3">
        <div className="flex gap-2">
          <svg
            className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-200">
              Pro Tips
            </h5>
            <ul className="mt-1 space-y-1 text-xs text-blue-800 dark:text-blue-300">
              <li>• Combine semantic search with keyword matching for best results</li>
              <li>• Use quotes for exact phrases to reduce false positives</li>
              <li>• Parentheses help control operator precedence</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
