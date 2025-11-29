"use client";

import { useMemo } from "react";
import { DraggableOrderEditor } from "../DraggableOrderEditor";
import { ArticleCard, type ArticleDisplayPreferences } from "@/app/components/articles/ArticleCard";
import { ToggleSwitch, Card, CardBody } from "@/app/components/ui";
import { OptionGridSelector } from "@/app/components/preferences/shared";
import type { UserPreferences } from "@/hooks/queries/use-user-preferences";

export interface ArticleDisplayViewProps {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}

/**
 * Article Display View - Customize article card appearance
 */
export function ArticleDisplayView({ preferences, updatePreference }: ArticleDisplayViewProps) {
  const densityOptions = [
    {
      value: "compact" as const,
      label: "Compact",
      description: "Minimal spacing, more articles visible",
    },
    {
      value: "normal" as const,
      label: "Normal",
      description: "Balanced spacing and readability",
    },
    {
      value: "comfortable" as const,
      label: "Comfortable",
      description: "Generous spacing, easier reading",
    },
  ];

  const currentDensity = (preferences.articleCardDensity as "compact" | "normal" | "comfortable") || "normal";

  // Sample articles for preview - one unread, one read
  // Use static dates to avoid react-hooks/purity errors
  const sampleArticles = useMemo(() => {
    const oneHourAgo = new Date(new Date().getTime() - 3600000);
    return [
    {
      id: "preview-article-1",
      title: "How to Customize Your RSS Reader Experience",
      excerpt: "Learn how to personalize your article cards with custom layouts, density settings, and component visibility controls for the perfect reading experience.",
      content: "Sample content",
      url: "#",
      feedId: "sample-feed",
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
      author: "John Doe",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
      isRead: false, // Unread article
      feeds: {
        id: "sample-feed",
        name: "Tech News Daily",
        url: "#",
        imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=32&h=32&fit=crop",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    {
      id: "preview-article-2",
      title: "Building Modern Web Applications",
      excerpt: "Explore the latest techniques and best practices for creating responsive, performant web applications with modern frameworks.",
      content: "Sample content",
      url: "#",
      feedId: "sample-feed",
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: oneHourAgo,
      author: "Jane Smith",
      imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop",
      isRead: true, // Read article
      feeds: {
        id: "sample-feed",
        name: "Tech News Daily",
        url: "#",
        imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=32&h=32&fit=crop",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  ];
  }, []);

  // Build display preferences from current settings
  const displayPreferences = useMemo<ArticleDisplayPreferences>(() => ({
    density: (preferences.articleCardDensity as "compact" | "normal" | "comfortable") || "normal",
    showImage: preferences.showArticleImage ?? true,
    showExcerpt: preferences.showArticleExcerpt ?? true,
    showAuthor: preferences.showArticleAuthor ?? true,
    showFeedInfo: preferences.showArticleFeedInfo ?? true,
    showDate: preferences.showArticleDate ?? true,
    sectionOrder: (preferences.articleCardSectionOrder as string[]) || ["feedInfo", "title", "excerpt", "actions"],
    borderWidth: (preferences.articleCardBorderWidth as "none" | "thin" | "normal" | "thick") || "normal",
    borderRadius: (preferences.articleCardBorderRadius as "sharp" | "slight" | "normal" | "rounded") || "normal",
    borderContrast: (preferences.articleCardBorderContrast as "subtle" | "medium" | "strong") || "medium",
  }), [preferences]);

  // Get spacing class for preview
  const previewSpacingClass = useMemo(() => {
    const spacing = preferences.articleCardSpacing || "normal";
    switch (spacing) {
      case "none":
        return "space-y-0";
      case "compact":
        return "space-y-2";
      case "comfortable":
        return "space-y-6";
      case "spacious":
        return "space-y-8";
      case "normal":
      default:
        return "space-y-4";
    }
  }, [preferences.articleCardSpacing]);

  const handleDensityChange = (density: "compact" | "normal" | "comfortable") => {
    updatePreference("articleCardDensity", density);

    // Auto-adjust visibility toggles based on density
    if (density === "compact") {
      updatePreference("showArticleImage", false);
      updatePreference("showArticleExcerpt", false);
    } else if (density === "comfortable") {
      updatePreference("showArticleImage", true);
      updatePreference("showArticleExcerpt", true);
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Article Display</h2>

      <div className="space-y-8">
        {/* Live Preview - Sticky */}
        <Card className="sticky top-0 z-10 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-lg backdrop-blur-sm">
          <CardBody>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Live Preview</h3>
                <p className="text-sm text-foreground/70">
                  Changes apply instantly as you customize
                </p>
              </div>
              <div className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                ● Real-time
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <div className={previewSpacingClass}>
                {sampleArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article as any}
                    displayPreferences={displayPreferences}
                  />
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Density Presets */}
        <OptionGridSelector
          label="Display Density"
          value={currentDensity}
          onChange={(value) => handleDensityChange(value as "compact" | "normal" | "comfortable")}
          options={[
            {
              value: "compact",
              label: "Compact",
              description: "Minimal spacing, more articles visible",
              preview: (
                <div className="mt-2 space-y-1 w-full">
                  <div className="h-2 rounded bg-foreground/20 w-3/4" />
                  <div className="h-1.5 rounded bg-foreground/10 w-1/2" />
                </div>
              )
            },
            {
              value: "normal",
              label: "Normal",
              description: "Balanced spacing and readability",
              preview: (
                <div className="mt-2 space-y-1 w-full">
                  <div className="h-2 rounded bg-foreground/20 w-5/6" />
                  <div className="h-1.5 rounded bg-foreground/10 w-3/4" />
                  <div className="h-1 rounded bg-foreground/5 w-full" />
                </div>
              )
            },
            {
              value: "comfortable",
              label: "Comfortable",
              description: "Generous spacing, easier reading",
              preview: (
                <div className="mt-2 space-y-1 w-full">
                  <div className="h-2 rounded bg-foreground/20 w-full" />
                  <div className="h-1.5 rounded bg-foreground/10 w-3/4" />
                  <div className="h-1 rounded bg-foreground/5 w-full" />
                </div>
              )
            }
          ]}
          columns={3}
          showPreview
        />

        {/* Component Visibility Toggles */}
        <Card className="bg-muted">
          <CardBody>
            <h3 className="mb-4 text-lg font-semibold">Show/Hide Components</h3>
            <p className="mb-4 text-sm text-foreground/70">
              Choose which elements to display in article cards
            </p>

            <div className="space-y-4">
              <ToggleSwitch
                label="Show Feed Information"
                description="Display feed icon and name"
                checked={preferences.showArticleFeedInfo ?? true}
                onChange={(checked) => updatePreference("showArticleFeedInfo", checked)}
              />

              <ToggleSwitch
                label="Show Article Images"
                description="Display featured images when available"
                checked={preferences.showArticleImage ?? true}
                onChange={(checked) => updatePreference("showArticleImage", checked)}
              />

              <ToggleSwitch
                label="Show Excerpts"
                description="Display article summaries/descriptions"
                checked={preferences.showArticleExcerpt ?? true}
                onChange={(checked) => updatePreference("showArticleExcerpt", checked)}
              />

              <ToggleSwitch
                label="Show Author Names"
                description="Display article author when available"
                checked={preferences.showArticleAuthor ?? true}
                onChange={(checked) => updatePreference("showArticleAuthor", checked)}
              />

              <ToggleSwitch
                label="Show Publication Dates"
                description="Display when articles were published"
                checked={preferences.showArticleDate ?? true}
                onChange={(checked) => updatePreference("showArticleDate", checked)}
              />
            </div>
          </CardBody>
        </Card>

        {/* Border Appearance */}
        <Card className="bg-muted">
          <CardBody>
            <h3 className="mb-4 text-lg font-semibold">Border Appearance</h3>
            <p className="mb-6 text-sm text-foreground/70">
              Customize borders to create a card-like or table-like appearance
            </p>

            <div className="space-y-6">
            <OptionGridSelector
              label="Border Width"
              value={preferences.articleCardBorderWidth || "normal"}
              onChange={(value) => updatePreference("articleCardBorderWidth", value as "none" | "thin" | "normal" | "thick")}
              options={[
                {
                  value: "none",
                  label: "None",
                  description: "No borders (minimal)",
                  preview: (
                    <div className="w-full h-8 bg-foreground/5 rounded flex items-center justify-center">
                      <div className="bg-foreground/30 rounded w-12 h-0" />
                    </div>
                  )
                },
                {
                  value: "thin",
                  label: "Thin",
                  description: "Subtle borders",
                  preview: (
                    <div className="w-full h-8 bg-foreground/5 rounded flex items-center justify-center">
                      <div className="bg-foreground/30 rounded w-12 h-0.5" />
                    </div>
                  )
                },
                {
                  value: "normal",
                  label: "Normal",
                  description: "Standard borders",
                  preview: (
                    <div className="w-full h-8 bg-foreground/5 rounded flex items-center justify-center">
                      <div className="bg-foreground/30 rounded w-12 h-1" />
                    </div>
                  )
                },
                {
                  value: "thick",
                  label: "Thick",
                  description: "Prominent (table-like)",
                  preview: (
                    <div className="w-full h-8 bg-foreground/5 rounded flex items-center justify-center">
                      <div className="bg-foreground/30 rounded w-12 h-2" />
                    </div>
                  )
                }
              ]}
              columns={4}
              showPreview
            />

            <OptionGridSelector
              label="Border Radius"
              value={preferences.articleCardBorderRadius || "normal"}
              onChange={(value) => updatePreference("articleCardBorderRadius", value as "sharp" | "slight" | "normal" | "rounded")}
              options={[
                {
                  value: "sharp",
                  label: "Sharp",
                  description: "Square corners (table)",
                  preview: (
                    <div className="w-full h-8 bg-foreground/5 flex items-center justify-center">
                      <div className="w-12 h-6 bg-foreground/30 border-2 border-foreground/40 rounded-none" />
                    </div>
                  )
                },
                {
                  value: "slight",
                  label: "Slight",
                  description: "Slightly rounded",
                  preview: (
                    <div className="w-full h-8 bg-foreground/5 flex items-center justify-center">
                      <div className="w-12 h-6 bg-foreground/30 border-2 border-foreground/40 rounded" />
                    </div>
                  )
                },
                {
                  value: "normal",
                  label: "Normal",
                  description: "Rounded corners",
                  preview: (
                    <div className="w-full h-8 bg-foreground/5 flex items-center justify-center">
                      <div className="w-12 h-6 bg-foreground/30 border-2 border-foreground/40 rounded-lg" />
                    </div>
                  )
                },
                {
                  value: "rounded",
                  label: "Rounded",
                  description: "Very rounded (card)",
                  preview: (
                    <div className="w-full h-8 bg-foreground/5 flex items-center justify-center">
                      <div className="w-12 h-6 bg-foreground/30 border-2 border-foreground/40 rounded-xl" />
                    </div>
                  )
                }
              ]}
              columns={4}
              showPreview
            />

            <OptionGridSelector
              label="Border Contrast"
              value={preferences.articleCardBorderContrast || "medium"}
              onChange={(value) => updatePreference("articleCardBorderContrast", value as "subtle" | "medium" | "strong")}
              options={[
                {
                  value: "subtle",
                  label: "Subtle",
                  description: "Low visibility",
                  preview: (
                    <div className="w-full h-8 bg-foreground/5 rounded flex items-center justify-center">
                      <div className="w-12 h-6 rounded border border-foreground/40" />
                    </div>
                  )
                },
                {
                  value: "medium",
                  label: "Medium",
                  description: "Balanced (default)",
                  preview: (
                    <div className="w-full h-8 bg-foreground/5 rounded flex items-center justify-center">
                      <div className="w-12 h-6 rounded border-2 border-foreground/80" />
                    </div>
                  )
                },
                {
                  value: "strong",
                  label: "Strong",
                  description: "Maximum contrast",
                  preview: (
                    <div className="w-full h-8 bg-foreground/5 rounded flex items-center justify-center">
                      <div className="w-12 h-6 rounded border-4 border-foreground" />
                    </div>
                  )
                }
              ]}
              columns={3}
              showPreview
            />

            <OptionGridSelector
              label="Card Spacing"
              description="Space between article cards in the feed"
              value={preferences.articleCardSpacing || "normal"}
              onChange={(value) => updatePreference("articleCardSpacing", value as "none" | "compact" | "normal" | "comfortable" | "spacious")}
              options={[
                {
                  value: "none",
                  label: "None",
                  description: "No spacing (table)",
                  preview: (
                    <div className="w-full h-8 bg-foreground/5 rounded flex flex-col items-center justify-center gap-0.5">
                      <div className="w-12 h-1 bg-foreground/30 rounded" />
                      <div className="w-12 h-0" />
                      <div className="w-12 h-1 bg-foreground/30 rounded" />
                    </div>
                  )
                },
                {
                  value: "compact",
                  label: "Compact",
                  description: "Minimal spacing",
                  preview: (
                    <div className="w-full h-8 bg-foreground/5 rounded flex flex-col items-center justify-center gap-0.5">
                      <div className="w-12 h-1 bg-foreground/30 rounded" />
                      <div className="w-12 h-0.5" />
                      <div className="w-12 h-1 bg-foreground/30 rounded" />
                    </div>
                  )
                },
                {
                  value: "normal",
                  label: "Normal",
                  description: "Standard spacing",
                  preview: (
                    <div className="w-full h-8 bg-foreground/5 rounded flex flex-col items-center justify-center gap-0.5">
                      <div className="w-12 h-1 bg-foreground/30 rounded" />
                      <div className="w-12 h-1" />
                      <div className="w-12 h-1 bg-foreground/30 rounded" />
                    </div>
                  )
                },
                {
                  value: "comfortable",
                  label: "Comfortable",
                  description: "Generous spacing",
                  preview: (
                    <div className="w-full h-8 bg-foreground/5 rounded flex flex-col items-center justify-center gap-0.5">
                      <div className="w-12 h-1 bg-foreground/30 rounded" />
                      <div className="w-12 h-2" />
                      <div className="w-12 h-1 bg-foreground/30 rounded" />
                    </div>
                  )
                },
                {
                  value: "spacious",
                  label: "Spacious",
                  description: "Maximum spacing",
                  preview: (
                    <div className="w-full h-8 bg-foreground/5 rounded flex flex-col items-center justify-center gap-0.5">
                      <div className="w-12 h-1 bg-foreground/30 rounded" />
                      <div className="w-12 h-3" />
                      <div className="w-12 h-1 bg-foreground/30 rounded" />
                    </div>
                  )
                }
              ]}
              columns={5}
              showPreview
            />
            </div>
          </CardBody>
        </Card>

        {/* Section Order Customization */}
        <Card className="bg-muted">
          <CardBody>
            <DraggableOrderEditor
              sections={(preferences.articleCardSectionOrder as string[]) || ["feedInfo", "title", "excerpt", "actions"]}
              onReorder={(newOrder) => updatePreference("articleCardSectionOrder", newOrder)}
            />
          </CardBody>
        </Card>

        {/* Info Box */}
        <Card className="border-primary/20 bg-primary/10 dark:border-primary/30 dark:bg-primary/20">
          <CardBody padding={false} className="p-4">
            <p className="text-sm text-primary dark:text-primary">
              💡 <strong>Tip:</strong> Watch the live preview above update instantly as you make changes.
              All adjustments apply immediately to your feeds. You can reset to defaults anytime by selecting a density preset.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
