import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticle } from "@/src/lib/services/article-service";
import { processArticleContent } from "@/src/lib/content-processor";
import { RelatedArticles } from "@/app/components/articles/RelatedArticles";
import { ArticleViewTracker } from "@/app/components/articles/ArticleViewTracker";
import { ArticleFeedbackSection } from "@/app/components/articles/ArticleFeedbackSection";
import { ArticlePageClient } from "@/app/components/articles/ArticlePageClient";

function normalizeKeyPoints(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((point) => (typeof point === "string" ? point : String(point)))
      .filter((point) => point.length > 0);
  }
  return [];
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    notFound();
  }

  const processedContent = processArticleContent(article.content, article.url);
  const initialSummary =
    article.summary && article.keyPoints && article.topics
      ? {
          summary: article.summary,
          keyPoints: normalizeKeyPoints(article.keyPoints),
          topics: Array.isArray(article.topics) ? article.topics : [],
        }
      : null;

  const formatDate = (date: Date | null) => {
    if (!date) return "Unknown date";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* View Tracker */}
      <ArticleViewTracker articleId={article.id} />

      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/"
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
            Back to articles
          </Link>
        </div>
      </header>

      {/* Article Page with Toolbar */}
      <ArticlePageClient
        articleId={article.id}
        articleUrl={article.url}
        initialSummary={initialSummary}
        headerContent={
          <>
            {/* Featured Image */}
            {article.imageUrl && (
              <img
                src={article.imageUrl}
                alt={article.title}
                className="mb-8 w-full rounded-lg object-cover"
                style={{ maxHeight: "400px" }}
              />
            )}

            {/* Feed Info */}
            <div className="mb-4 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              {article.feed.imageUrl && (
                <img
                  src={article.feed.imageUrl}
                  alt={article.feed.name}
                  className="h-6 w-6 rounded-full"
                />
              )}
              <span className="font-medium">{article.feed.name}</span>
              <span>•</span>
              <time dateTime={article.publishedAt?.toISOString()}>
                {formatDate(article.publishedAt)}
              </time>
              {article.author && (
                <>
                  <span>•</span>
                  <span>By {article.author}</span>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="mb-6 text-4xl font-bold leading-tight text-gray-900 dark:text-gray-100">
              {article.title}
            </h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="mb-8 text-xl leading-relaxed text-gray-600 dark:text-gray-300">
                {article.excerpt}
              </p>
            )}

          </>
        }
        mainContent={
          /* Content */
          <div
            className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:underline dark:prose-a:text-blue-400"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        }
        footerContent={
          <>
            {/* Feedback Section */}
            <ArticleFeedbackSection articleId={article.id} />

            {/* Related Articles */}
            <div className="mt-12">
              <RelatedArticles articleId={article.id} limit={6} minScore={0.65} />
            </div>
          </>
        }
      />
    </div>
  );
}

