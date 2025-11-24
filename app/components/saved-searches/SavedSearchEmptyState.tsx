"use client";

import { useState } from "react";
import { SavedSearchModal } from "./SavedSearchModal";

interface SavedSearchEmptyStateProps {
  onStartTour?: () => void;
}

/**
 * Empty state component shown when user has no saved searches
 * Provides starter templates and guidance
 */
export function SavedSearchEmptyState({ onStartTour }: SavedSearchEmptyStateProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const starterTemplates = [
    {
      name: "Breaking News",
      icon: "🚨",
      query: '+breaking, +urgent, +"just in" -opinion',
      description: "Stay updated on urgent and breaking news stories",
      color: "from-red-500 to-orange-500",
    },
    {
      name: "Tech Trends",
      icon: "🚀",
      query: '(+AI, +"machine learning", +blockchain) +innovation',
      description: "Track emerging technologies and innovations",
      color: "from-blue-500 to-cyan-500",
    },
    {
      name: "Research Papers",
      icon: "📚",
      query: '(+research, +study, +paper) +"peer reviewed"',
      description: "Find academic research and scholarly articles",
      color: "from-purple-500 to-pink-500",
    },
    {
      name: "Local News",
      icon: "📍",
      query: '+local, +community, +city -national -world',
      description: "Discover news from your local area",
      color: "from-green-500 to-teal-500",
    },
    {
      name: "Career Opportunities",
      icon: "💼",
      query: '(+hiring, +"job opening", +remote) +tech',
      description: "Monitor job postings and career opportunities",
      color: "from-yellow-500 to-orange-500",
    },
    {
      name: "Industry Analysis",
      icon: "📊",
      query: '(+analysis, +trends, +forecast) +market',
      description: "Track industry insights and market analysis",
      color: "from-indigo-500 to-blue-500",
    },
  ];

  const handleTemplateSelect = (template: typeof starterTemplates[0]) => {
    setSelectedTemplate(template.query);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-12 text-center">
      {/* Hero Section */}
      <div className="mb-8 md:mb-12">
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl"></div>
            <div className="relative rounded-full bg-gradient-to-br from-primary to-accent p-6">
              <svg
                className="h-12 w-12 md:h-16 md:w-16 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <h2 className="mb-3 text-2xl md:text-3xl font-bold text-foreground">
          Create Your First Saved Search
        </h2>
        <p className="max-w-lg mx-auto text-sm md:text-base text-secondary">
          Automatically find relevant articles across all your feeds without manual searching.
          Set it up once, and let it work for you 24/7.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-6 hover:border-primary hover:bg-primary/10 transition-all"
        >
          <div className="rounded-full bg-primary/10 p-4 group-hover:bg-primary/20 transition-colors">
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-foreground">Create New</div>
            <div className="text-xs text-secondary">Start from scratch</div>
          </div>
        </button>

        {onStartTour && (
          <button
            onClick={onStartTour}
            className="group flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-blue-500/50 bg-blue-50 dark:bg-blue-950/30 p-6 hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-all"
          >
            <div className="rounded-full bg-blue-500/10 p-4 group-hover:bg-blue-500/20 transition-colors">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-400"
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
            </div>
            <div>
              <div className="font-semibold text-foreground">Take Tour</div>
              <div className="text-xs text-secondary">Learn the basics</div>
            </div>
          </button>
        )}

        <a
          href="/docs/USER_GUIDE_SAVED_SEARCHES.md"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-purple-500/50 bg-purple-50 dark:bg-purple-950/30 p-6 hover:border-purple-500 hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-all"
        >
          <div className="rounded-full bg-purple-500/10 p-4 group-hover:bg-purple-500/20 transition-colors">
            <svg
              className="h-6 w-6 text-purple-600 dark:text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-foreground">View Guide</div>
            <div className="text-xs text-secondary">Full documentation</div>
          </div>
        </a>
      </div>

      {/* Starter Templates */}
      <div className="w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Starter Templates
            </h3>
            <p className="text-sm text-secondary">
              Choose a template to get started quickly
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {starterTemplates.map((template) => (
            <button
              key={template.name}
              onClick={() => handleTemplateSelect(template)}
              className="group relative overflow-hidden rounded-lg border border-border bg-background p-5 text-left hover:border-primary/50 hover:shadow-md transition-all"
            >
              {/* Gradient background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-5 transition-opacity`}
              />

              {/* Content */}
              <div className="relative">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-3xl">{template.icon}</span>
                  <h4 className="text-base font-semibold text-foreground">
                    {template.name}
                  </h4>
                </div>

                <p className="mb-4 text-sm text-secondary line-clamp-2">
                  {template.description}
                </p>

                <div className="rounded bg-muted/50 px-3 py-2 mb-3">
                  <code className="text-xs font-mono text-foreground line-clamp-1">
                    {template.query}
                  </code>
                </div>

                <div className="flex items-center gap-2 text-xs text-primary">
                  <span>Use template</span>
                  <svg
                    className="h-4 w-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-12 w-full max-w-4xl">
        <div className="rounded-lg border border-border bg-muted/30 p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3">
                <svg
                  className="h-6 w-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="mb-2 text-base font-semibold text-foreground">
                Pro Tips
              </h4>
              <ul className="space-y-2 text-sm text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    Use <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">+</code> for
                    required terms and <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">-</code> to
                    exclude unwanted topics
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    Exact phrases in quotes like <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">"machine learning"</code> reduce
                    false positives
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    Start with 70-80% relevance threshold and adjust based on results
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <SavedSearchModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTemplate("");
        }}
        initialQuery={selectedTemplate}
      />
    </div>
  );
}
