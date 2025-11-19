"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { use } from "react";
import { useSession } from "next-auth/react";
import { ArticleList } from "@/app/components/articles/ArticleList";
import { ArticleSortDropdown } from "@/app/components/articles/ArticleSortDropdown";
import { ReadingPanelLayout } from "@/app/components/layout/ReadingPanelLayout";
import type { Article, Feed } from "@prisma/client";
import type { ArticleSortOrder, ArticleSortDirection } from "@/lib/validations/article-validation";

interface ArticleWithFeed extends Article {
  feed: Feed;
}

export default function TopicDetailPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = use(params);
  const { data: session } = useSession();
  const decodedTopic = decodeURIComponent(topic);
  const [articles, setArticles] = useState<ArticleWithFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<ArticleSortOrder>("publishedAt");
  const [sortDirection, setSortDirection] = useState<ArticleSortDirection>("desc");

  useEffect(() => {
    if (session?.user) {
      loadUserPreferences();
    }
  }, [session]);

  useEffect(() => {
    loadArticles();
  }, [topic, sortOrder, sortDirection]);

  const loadUserPreferences = async () => {
    try {
      const response = await fetch("/api/user/preferences");
      const data = await response.json();
      if (data.data?.preferences) {
        const prefs = data.data.preferences;
        setSortOrder(prefs.articleSortOrder || "publishedAt");
        setSortDirection(prefs.articleSortDirection || "desc");
      }
    } catch (error) {
      console.error("Failed to load user preferences:", error);
    }
  };

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/articles/topics?topic=${encodeURIComponent(decodedTopic)}&limit=50&sortBy=${sortOrder}&sortDirection=${sortDirection}`
      );
      const data = await response.json();
      setArticles(data.data?.articles || []);
    } catch (error) {
      console.error("Failed to load articles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = async (newSortOrder: ArticleSortOrder, newSortDirection: ArticleSortDirection) => {
    setSortOrder(newSortOrder);
    setSortDirection(newSortDirection);

    if (session?.user) {
      try {
        await fetch("/api/user/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleSortOrder: newSortOrder,
            articleSortDirection: newSortDirection,
          }),
        });
      } catch (error) {
        console.error("Failed to update sort preferences:", error);
      }
    }
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
              variant="expanded"
              onArticleSelect={onArticleSelect}
            />
          </div>
        </div>
      )}
    </ReadingPanelLayout>
  );
}

