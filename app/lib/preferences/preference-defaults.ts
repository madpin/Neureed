import type { UserPreferences } from '@/hooks/queries/use-user-preferences';

/**
 * Get default preferences for new users or fallback when no preferences exist
 *
 * These defaults provide sensible starting values for all preference fields.
 * When a user hasn't set a preference, these values are used.
 *
 * @returns Complete UserPreferences object with all defaults
 */
export function getDefaultPreferences(): UserPreferences {
  return {
    theme: "system",
    fontSize: "medium",
    articlesPerPage: 20,
    defaultView: "expanded",
    showReadArticles: true,
    autoMarkAsRead: false,
    showRelatedExcerpts: false,
    bounceThreshold: 0.25,
    searchRecencyWeight: 0.3,
    searchRecencyDecayDays: 30,
    showLowRelevanceArticles: true,
    infiniteScrollMode: "both",
    llmProvider: null,
    llmSummaryModel: null,
    llmEmbeddingModel: null,
    llmDigestModel: null,
    llmApiKey: null,
    llmBaseUrl: null,
    embeddingsEnabled: false,
    readingMode: "side_panel",
    inlineAutoScroll: true,
    readingPanelEnabled: true,
    readingPanelPosition: "right",
    readingPanelSize: 50,
    readingFontFamily: "Georgia",
    readingFontSize: 18,
    readingLineHeight: 1.7,
    readingParagraphSpacing: 1.5,
    breakLineSpacing: 0.75,
    showReadingTime: true,
    // Article Display Customization
    articleCardDensity: "normal",
    showArticleImage: true,
    showArticleExcerpt: true,
    showArticleAuthor: true,
    showArticleFeedInfo: true,
    showArticleDate: true,
    articleCardSectionOrder: ["feedInfo", "title", "excerpt", "actions"],
    articleCardBorderWidth: "normal",
    articleCardBorderRadius: "normal",
    articleCardBorderContrast: "medium",
    articleCardSpacing: "normal",
  };
}
