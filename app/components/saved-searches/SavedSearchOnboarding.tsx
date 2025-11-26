"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@/app/components/ui";

interface SavedSearchOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

/**
 * Interactive onboarding tutorial for saved searches feature
 * Guides users through key concepts and functionality
 */
export function SavedSearchOnboarding({
  isOpen,
  onClose,
  onComplete,
}: SavedSearchOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const steps = [
    {
      title: "Welcome to Saved Searches! 🔍",
      description:
        "Automatically find relevant articles across all your feeds without manual searching. Let's take a quick tour!",
      icon: "🎉",
      visual: (
        <div className="flex items-center justify-center py-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl">
                📰
              </div>
              <div className="text-xs text-secondary mt-2">Articles</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl">
                🔍
              </div>
              <div className="text-xs text-secondary mt-2">Search</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center text-white text-2xl">
                ✨
              </div>
              <div className="text-xs text-secondary mt-2">Matches</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Create Persistent Queries",
      description:
        "Instead of searching repeatedly, create a saved search once. It continuously monitors new articles and finds matches automatically.",
      icon: "💾",
      visual: (
        <Card className="bg-muted/30">
          <CardBody>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🤖</span>
              <div className="text-sm font-medium text-foreground">
                AI Ethics News
              </div>
            </div>
            <div className="rounded bg-background p-3 mb-3">
              <code className="text-xs font-mono text-foreground">
                (+AI, +&quot;machine learning&quot;) +ethics
              </code>
            </div>
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>42 matches found</span>
              <span className="text-green-600 dark:text-green-400">● Active</span>
            </div>
          </CardBody>
        </Card>
      ),
    },
    {
      title: "Powerful Query Syntax",
      description:
        "Use operators to build precise queries: + for required terms, - to exclude, commas for alternatives, and quotes for exact phrases.",
      icon: "⚡",
      visual: (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <code className="rounded bg-green-100 dark:bg-green-900/30 px-2 py-1 font-mono text-green-800 dark:text-green-300">
              +
            </code>
            <span className="text-foreground">Required (AND)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <code className="rounded bg-red-100 dark:bg-red-900/30 px-2 py-1 font-mono text-red-800 dark:text-red-300">
              -
            </code>
            <span className="text-foreground">Exclude (NOT)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <code className="rounded bg-blue-100 dark:bg-blue-900/30 px-2 py-1 font-mono text-blue-800 dark:text-blue-300">
              ,
            </code>
            <span className="text-foreground">Alternative (OR)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <code className="rounded bg-purple-100 dark:bg-purple-900/30 px-2 py-1 font-mono text-purple-800 dark:text-purple-300">
              &quot;...&quot;
            </code>
            <span className="text-foreground">Exact phrase</span>
          </div>
        </div>
      ),
    },
    {
      title: "AI-Powered Matching",
      description:
        "We use semantic search (AI embeddings) + keyword matching to find relevant articles. Each match gets a relevance score from 0-100%.",
      icon: "🤖",
      visual: (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-green-500/50 bg-green-50 dark:bg-green-950/30 p-3">
            <span className="text-sm text-foreground">Perfect match</span>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
              95%
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-blue-500/50 bg-blue-50 dark:bg-blue-950/30 p-3">
            <span className="text-sm text-foreground">Good match</span>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              78%
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30 p-3">
            <span className="text-sm text-foreground">Fair match</span>
            <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              62%
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Smart Notifications",
      description:
        "Get notified when high-relevance articles match your searches. Choose between real-time alerts or daily digests.",
      icon: "🔔",
      visual: (
        <Card className="bg-muted/30">
          <CardBody>
            <div className="flex items-start gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
                🔍
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground mb-1">
                  New match for &quot;AI Ethics News&quot;
                </div>
                <div className="text-xs text-secondary">
                  The Ethics of Artificial Intelligence in Healthcare
                </div>
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                92%
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>TechCrunch • 2 min ago</span>
              <span>View article →</span>
            </div>
          </CardBody>
        </Card>
      ),
    },
    {
      title: "You're All Set! 🎉",
      description:
        "Ready to create your first saved search? Click below to get started, or explore the templates for inspiration.",
      icon: "✨",
      visual: (
        <div className="grid grid-cols-2 gap-3">
          <button className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-4 hover:bg-muted transition-colors">
            <span className="text-2xl">➕</span>
            <span className="text-xs font-medium text-foreground">
              Create New
            </span>
          </button>
          <button className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-4 hover:bg-muted transition-colors">
            <span className="text-2xl">📋</span>
            <span className="text-xs font-medium text-foreground">
              Browse Templates
            </span>
          </button>
          <button className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-4 hover:bg-muted transition-colors">
            <span className="text-2xl">📖</span>
            <span className="text-xs font-medium text-foreground">
              View Guide
            </span>
          </button>
          <button className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-4 hover:bg-muted transition-colors">
            <span className="text-2xl">💡</span>
            <span className="text-xs font-medium text-foreground">
              See Examples
            </span>
          </button>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  if (!step) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4"
      onClick={handleSkip}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] md:max-h-[90vh] overflow-hidden rounded-t-2xl md:rounded-lg border-t md:border border-border bg-background shadow-xl"
        style={{
          animation: 'slideUp 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-muted rounded-full"></div>
        </div>

        {/* Header */}
        <div className="border-b border-border p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl md:text-4xl">{step.icon}</span>
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                {step.title}
              </h2>
            </div>
            <button
              onClick={handleSkip}
              className="rounded-lg p-2 hover:bg-muted transition-colors text-secondary"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1 mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          <p className="text-sm md:text-base text-foreground mb-6">
            {step.description}
          </p>

          {/* Visual */}
          <div className="mb-6">{step.visual}</div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 md:p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="text-xs text-secondary">
              {currentStep + 1} of {steps.length}
            </div>

            <button
              onClick={handleNext}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
