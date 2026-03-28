import { ArticleExtractionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { extractContent } from "@/lib/services/content-extraction-service";
import { extractionRateLimiter } from "@/lib/services/extraction-rate-limiter";
import { sanitizeExtractionErrorMessage } from "@/lib/services/extraction-error-utils";
import { isUserSubscribed } from "@/lib/services/user-feed-service";
import { updateArticle } from "@/lib/services/article-service";

export type RetryExtractionResult =
  | { ok: true; articleId: string }
  | { ok: false; error: string; status?: number };

/**
 * Re-run server-side extraction for an article (authenticated subscriber only).
 * Updates article body and extraction status on success or failure.
 */
export async function retryArticleContentExtraction(
  articleId: string,
  userId: string
): Promise<RetryExtractionResult> {
  const article = await prisma.articles.findUnique({
    where: { id: articleId },
    include: { feeds: true },
  });

  if (!article) {
    return { ok: false, error: "Article not found", status: 404 };
  }

  const subscribed = await isUserSubscribed(userId, article.feedId);
  if (!subscribed) {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  const settings = (
    article.feeds.settings as {
      extraction?: { method?: string; contentMergeStrategy?: string };
    } | null
  )?.extraction;
  if (!settings || settings.method === "rss") {
    return {
      ok: false,
      error: "Full-page extraction is not enabled for this feed (RSS-only mode).",
      status: 400,
    };
  }

  if (!article.url?.trim()) {
    return { ok: false, error: "Article has no URL to fetch", status: 400 };
  }

  await extractionRateLimiter.waitForSlot(article.url, article.feedId);

  try {
    const extracted = await extractContent(article.url, article.feedId);

    let extractionHttpStatus: number | undefined;
    if (!extracted.success && extracted.error) {
      const statusMatch = extracted.error.match(/status[:\s]+(\d{3})/i);
      if (statusMatch?.[1]) {
        extractionHttpStatus = parseInt(statusMatch[1], 10);
      }
    }

    if (!extracted.success) {
      const safe = sanitizeExtractionErrorMessage(extracted.error);
      await updateArticle(articleId, {
        extractionStatus: ArticleExtractionStatus.FAILED,
        extractionError: safe,
      });
      await extractionRateLimiter.recordExtraction(
        article.url,
        false,
        extracted.error,
        extractionHttpStatus
      );
      return {
        ok: false,
        error: safe ?? "Could not load full article text",
        status: 502,
      };
    }

    const mergeStrategy = settings.contentMergeStrategy || "replace";
    const rssContent = article.content || "";
    const extractedContent = extracted.content || "";

    let newContent: string;
    switch (mergeStrategy) {
      case "prepend":
        newContent = `${extractedContent}\n\n${rssContent}`;
        break;
      case "append":
        newContent = `${rssContent}\n\n${extractedContent}`;
        break;
      case "replace":
      default:
        newContent = extractedContent;
        break;
    }

    await updateArticle(articleId, {
      title: extracted.title || article.title,
      excerpt: (extracted.excerpt ?? article.excerpt) ?? undefined,
      author: (extracted.author ?? article.author) ?? undefined,
      imageUrl: (extracted.imageUrl ?? article.imageUrl) ?? undefined,
      publishedAt: extracted.publishedAt
        ? new Date(extracted.publishedAt)
        : article.publishedAt ?? undefined,
      content: newContent,
      extractionStatus: ArticleExtractionStatus.SUCCESS,
      extractionError: null,
    });

    await extractionRateLimiter.recordExtraction(article.url, true);

    return { ok: true, articleId };
  } catch (err) {
    const extractionError = err instanceof Error ? err.message : String(err);
    logger.error(`[RetryExtraction] ${articleId}: ${extractionError}`);
    const safe = sanitizeExtractionErrorMessage(extractionError);
    await updateArticle(articleId, {
      extractionStatus: ArticleExtractionStatus.FAILED,
      extractionError: safe,
    });
    if (article.url) {
      await extractionRateLimiter.recordExtraction(article.url, false, extractionError);
    }
    return { ok: false, error: safe ?? "Extraction failed", status: 500 };
  }
}
