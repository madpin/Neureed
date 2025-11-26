"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Card, CardHeader, CardBody } from "@/app/components/ui";
import { useTopicsWithCounts } from "@/hooks/queries/use-articles";

export default function TopicsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Use React Query hook
  const { data: topics = [], isLoading } = useTopicsWithCounts(100);

  const filteredTopics = topics.filter((topic) =>
    topic.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate font sizes for topic cloud
  const maxCount = Math.max(...topics.map((t) => t.count), 1);
  const minCount = Math.min(...topics.map((t) => t.count), 1);

  const getFontSize = (count: number) => {
    const normalized = (count - minCount) / (maxCount - minCount);
    return 12 + normalized * 32; // Range from 12px to 44px
  };

  const getColor = (count: number) => {
    const normalized = (count - minCount) / (maxCount - minCount);
    if (normalized > 0.7) return "text-blue-700 dark:text-blue-400";
    if (normalized > 0.4) return "text-blue-600 dark:text-blue-500";
    return "text-blue-500 dark:text-blue-600";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Topic Cloud
              </h1>
              <p className="mt-2 text-foreground/70">
                Explore articles by topic
              </p>
            </div>
            <Link
              href="/"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Back to Home
            </Link>
          </div>

          {/* Search */}
          <div className="mt-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search topics..."
              className="w-full rounded-lg border border-border bg-muted px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : filteredTopics.length === 0 ? (
          <EmptyState
            illustration={
              <div className="mb-4 flex justify-center">
                <svg
                  className="h-16 w-16 text-foreground/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
            }
            title="No topics found"
            description={
              searchTerm
                ? "Try a different search term"
                : "Articles need to be analyzed first"
            }
          />
        ) : (
          <>
            {/* Topic Cloud */}
            <Card className="mb-8" padding>
              <CardHeader title="Visual Cloud" />
              <CardBody>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {filteredTopics.slice(0, 50).map((topic) => (
                    <Link
                      key={topic.topic}
                      href={`/topics/${encodeURIComponent(topic.topic)}`}
                      className={`font-semibold transition-colors hover:underline ${getColor(
                        topic.count
                      )}`}
                      style={{ fontSize: `${getFontSize(topic.count)}px` }}
                    >
                      {topic.topic}
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Topic List */}
            <Card>
              <CardHeader title={`All Topics (${filteredTopics.length})`} />
              <CardBody padding={false}>
                <div className="divide-y divide-border">
                  {filteredTopics.map((topic) => (
                    <Link
                    key={topic.topic}
                    href={`/topics/${encodeURIComponent(topic.topic)}`}
                    className="block p-4 transition-colors hover:bg-muted"
                  >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {topic.topic}
                        </span>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {topic.count} article{topic.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

