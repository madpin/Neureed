"use client";

import { useState } from "react";
import Link from "next/link";
import { use } from "react";
import { ArticleList } from "@/app/components/articles/ArticleList";
import { ArticleSortDropdown } from "@/app/components/articles/ArticleSortDropdown";
import { ReadingPanelLayout } from "@/app/components/layout/ReadingPanelLayout";
import type { ArticleSortOrder, ArticleSortDirection } from "@/lib/validations/article-validation";
import { useArticles } from "@/hooks/queries/use-articles";
import { useUserPreferences, useUpdatePreference } from "@/hooks/queries/use-user-preferences";

export default function TopicDetailPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = use(params);
  const decodedTopic = decodeURIComponent(topic);
  
  // Use React Query for preferences
  const { data: preferences } = useUserPreferences();
  const updatePreference = useUpdatePreference();
  
  // Local state for immediate UI updates (synced with preferences)
  const sortOrder = (preferences?.articleSortOrder as ArticleSortOrder) || "publishedAt";
  const sortDirection = (preferences?.articleSortDirection as ArticleSortDirection) || "desc";

  // Use React Query for articles
  const { data: articlesData, isLoading } = useArticles({
    topic: decodedTopic,
    sortBy: sortOrder,
    sortOrder: sortDirection
  }, 50);

  const articles = articlesData?.articles || [];

  const handleSortChange = (newSortOrder: ArticleSortOrder, newSortDirection: ArticleSortDirection) => {
    updatePreference.mutate({
      articleSortOrder: newSortOrder,
      articleSortDirection: newSortDirection,
    });
  };

  return (
    <ReadingPanelLayout>
      {({ onArticleSelect }: { onArticleSelect?: (articleId: string) => void }) => (
        <div className="min-h-screen bg-background text-foreground">
          <div className="mx-auto max-w-7xl px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/topics"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Topics
              </Link>

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Topic: {decodedTopic}
                  </h1>
                  <p className="mt-2 text-foreground/70">
                    Articles tagged with this topic
                  </p>
                </div>
                <ArticleSortDropdown
                  currentSortOrder={sortOrder}
                  currentSortDirection={sortDirection}
                  onSortChange={handleSortChange}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Articles List */}
            <ArticleList
              articles={articles}
              isLoading={isLoading}
              onArticleSelect={onArticleSelect}
            />
          </div>
        </div>
      )}
    </ReadingPanelLayout>
  );
}

