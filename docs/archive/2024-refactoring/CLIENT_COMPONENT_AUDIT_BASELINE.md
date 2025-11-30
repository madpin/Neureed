===================================================================
    NeuReed Client Component Audit
===================================================================

Date: 2025-11-25 19:02:55

-------------------------------------------------------------------
 1. Component Count Overview
-------------------------------------------------------------------
Total .tsx files in app/: \033[0;32m76\033[0m
Files with 'use client': \033[1;33m73\033[0m
Implied server components: \033[0;32m3\033[0m

Client component ratio: \033[1;33m96%\033[0m
(Target for optimal bundle size: ~30%)

-------------------------------------------------------------------
 2. Client Components by Directory
-------------------------------------------------------------------
  app/components: \033[1;33m63\033[0m / 64 (98%)
  app/admin: \033[1;33m1\033[0m / 1 (100%)

-------------------------------------------------------------------
 3. All Files with 'use client'
-------------------------------------------------------------------
app/admin/dashboard/page.tsx:"use client";
app/articles/[id]/page.tsx:"use client";
app/components/articles/ArticleCard.tsx:"use client";
app/components/articles/ArticleFeedbackSection.tsx:"use client";
app/components/articles/ArticleList.tsx:"use client";
app/components/articles/ArticlePageClient.tsx:"use client";
app/components/articles/ArticlePanel.tsx:"use client";
app/components/articles/ArticleSortDropdown.tsx:"use client";
app/components/articles/ArticleSummary.tsx:"use client";
app/components/articles/ArticleToolbar.tsx:"use client";
app/components/articles/ArticleViewTracker.tsx:"use client";
app/components/articles/FeedbackButtons.tsx:"use client";
app/components/articles/RelatedArticles.tsx:"use client";
app/components/articles/RelevanceScore.tsx:"use client";
app/components/auth/AuthProvider.tsx:"use client";
app/components/auth/SignInButton.tsx:"use client";
app/components/auth/SignOutButton.tsx:"use client";
app/components/auth/UserMenu.tsx:"use client";
app/components/feeds/AddFeedForm.tsx:"use client";
app/components/feeds/BulkFeedSettingsModal.tsx:"use client";
app/components/feeds/CategoryList.tsx:"use client";
app/components/feeds/CookieGuide.tsx:"use client";
app/components/feeds/FeedBrowser.tsx:"use client";
app/components/feeds/FeedList.tsx:"use client";
app/components/feeds/FeedManagementModal.tsx:"use client";
app/components/feeds/FeedSettingsPanel.tsx:"use client";
app/components/feeds/IconPicker.tsx:"use client";
app/components/feeds/OpmlExportModal.tsx:"use client";
app/components/feeds/OpmlImportModal.tsx:"use client";
app/components/landing/CTASection.tsx:"use client";
app/components/landing/ComparisonTable.tsx:"use client";
app/components/landing/FAQSection.tsx:"use client";
app/components/landing/FeaturesSection.tsx:"use client";
app/components/landing/Footer.tsx:"use client";
app/components/landing/HeroSection.tsx:"use client";
app/components/landing/LandingPage.tsx:"use client";
app/components/landing/RSSEducationSection.tsx:"use client";
app/components/landing/ScreenshotsGallery.tsx:"use client";
app/components/landing/TechnicalSection.tsx:"use client";
app/components/layout/EmptyState.tsx:"use client";
app/components/layout/LoadingSpinner.tsx:"use client";
app/components/layout/MainLayout.tsx:"use client";
app/components/layout/ReadingPanelLayout.tsx:"use client";
app/components/layout/ResizableSplitPane.tsx:"use client";
app/components/layout/Tooltip.tsx:"use client";
app/components/notifications/NotificationBell.tsx:"use client";
app/components/preferences/DraggableOrderEditor.tsx:"use client";
app/components/preferences/PreferencesModal.tsx:"use client";
app/components/preferences/SortableSectionItem.tsx:"use client";
app/components/preferences/ThemePalette.tsx:"use client";
app/components/providers/QueryProvider.tsx:"use client";
app/components/saved-searches/HelpTooltip.tsx:"use client";
app/components/saved-searches/MatchReasonTooltip.tsx:"use client";
app/components/saved-searches/QueryBuilder.tsx:"use client";
app/components/saved-searches/QuerySyntaxHelper.tsx:"use client";
app/components/saved-searches/RelevanceScoreBadge.tsx:"use client";
app/components/saved-searches/SavedSearchEmptyState.tsx:"use client";
app/components/saved-searches/SavedSearchList.tsx:"use client";
app/components/saved-searches/SavedSearchModal.tsx:"use client";
app/components/saved-searches/SavedSearchOnboarding.tsx:"use client";
app/components/saved-searches/SavedSearchSettings.tsx:"use client";
app/components/saved-searches/SavedSearchView.tsx:"use client";
app/components/search/SemanticSearchBar.tsx:"use client";
app/components/theme/ThemeProvider.tsx:"use client";
app/components/ui/ErrorBoundary.tsx:'use client';
app/feeds/[feedId]/articles/[articleId]/page.tsx:"use client";
app/global-error.tsx:"use client";
app/page.tsx:"use client";
app/preferences/analytics/page.tsx:"use client";
app/search/page.tsx:"use client";
app/topics/[topic]/page.tsx:"use client";
app/topics/page.tsx:"use client";
app/web-vitals.tsx:'use client';

-------------------------------------------------------------------
 4. Potential Optimization Candidates
-------------------------------------------------------------------
Looking for client components that might not need interactivity...

\033[1;33m?\033[0m app/web-vitals.tsx
   (No obvious hooks or event handlers detected)
\033[1;33m?\033[0m app/components/landing/CTASection.tsx
   (No obvious hooks or event handlers detected)
\033[1;33m?\033[0m app/components/landing/RSSEducationSection.tsx
   (No obvious hooks or event handlers detected)
\033[1;33m?\033[0m app/components/landing/ComparisonTable.tsx
   (No obvious hooks or event handlers detected)
\033[1;33m?\033[0m app/components/landing/LandingPage.tsx
   (No obvious hooks or event handlers detected)
\033[1;33m?\033[0m app/components/landing/Footer.tsx
   (No obvious hooks or event handlers detected)
\033[1;33m?\033[0m app/components/landing/HeroSection.tsx
   (No obvious hooks or event handlers detected)
\033[1;33m?\033[0m app/components/landing/TechnicalSection.tsx
   (No obvious hooks or event handlers detected)
\033[1;33m?\033[0m app/components/landing/FeaturesSection.tsx
   (No obvious hooks or event handlers detected)
\033[1;33m?\033[0m app/components/preferences/DraggableOrderEditor.tsx
   (No obvious hooks or event handlers detected)
\033[1;33m?\033[0m app/components/preferences/SortableSectionItem.tsx
   (No obvious hooks or event handlers detected)
\033[1;33m?\033[0m app/components/auth/AuthProvider.tsx
   (No obvious hooks or event handlers detected)
\033[1;33m?\033[0m app/components/layout/LoadingSpinner.tsx
   (No obvious hooks or event handlers detected)
\033[1;33m?\033[0m app/components/articles/RelevanceScore.tsx
   (No obvious hooks or event handlers detected)
\033[1;33m?\033[0m app/components/articles/RelatedArticles.tsx
   (No obvious hooks or event handlers detected)
\033[1;33m?\033[0m app/components/saved-searches/SavedSearchSettings.tsx
   (No obvious hooks or event handlers detected)
\033[1;33m?\033[0m app/topics/[topic]/page.tsx
   (No obvious hooks or event handlers detected)

-------------------------------------------------------------------
 5. Recommendations
-------------------------------------------------------------------

✓ \033[0;32mServer Components\033[0m (default, no 'use client'):
  - Better for SEO
  - Smaller bundle sizes
  - Can fetch data directly
  - Use for: static content, layouts, data fetching

✓ \033[1;33mClient Components\033[0m (with 'use client'):
  - Required for interactivity
  - Can use React hooks
  - Can use browser APIs
  - Use for: forms, interactive widgets, state management

📊 \033[1;33mNext Steps:\033[0m
  1. Review components marked with '?' above
  2. Consider splitting components: server wrapper + client interactive parts
  3. Push 'use client' as deep as possible in the component tree
  4. Aim for ~30% client components for optimal performance

===================================================================
 Audit Complete
===================================================================
