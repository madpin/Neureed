"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { use } from "react";
import { ArticleList } from "@/app/components/articles/ArticleList";
import { ReadingPanelLayout } from "@/app/components/layout/ReadingPanelLayout";
import type { Article, Feed } from "@prisma/client";

interface ArticleWithFeed extends Article {
  feed: Feed;
}

export default function TopicDetailPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = use(params);
  const decodedTopic = decodeURIComponent(topic);
  const [articles, setArticles] = useState<ArticleWithFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, [topic]);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/articles/topics?topic=${encodeURIComponent(decodedTopic)}&limit=50`
      );
      const data = await response.json();
      setArticles(data.data?.articles || []);
    } catch (error) {
      console.error("Failed to load articles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ReadingPanelLayout>
      {({ onArticleSelect }: { onArticleSelect?: (articleId: string) => void }) => (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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

              <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
                Topic: {decodedTopic}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Articles tagged with this topic
              </p>
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

