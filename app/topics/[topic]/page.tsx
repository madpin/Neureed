"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { use } from "react";

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
}

export default function TopicDetailPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = use(params);
  const decodedTopic = decodeURIComponent(topic);
  const [articles, setArticles] = useState<Article[]>([]);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-8">
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
            <svg
              className="mb-4 h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              No articles found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No articles are tagged with this topic yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {article.title}
                </h2>
                {article.excerpt && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {article.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

