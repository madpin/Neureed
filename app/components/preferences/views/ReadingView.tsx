"use client";

import { ToggleSwitch, Card, CardHeader, CardBody } from "@/app/components/ui";
import { NumberSettingField, SelectSettingField } from "@/app/components/shared/settings";
import { OptionGridSelector, RangeSliderField, ConditionalSection } from "@/app/components/preferences/shared";
import type { UserPreferences } from "@/hooks/queries/use-user-preferences";

export interface ReadingViewProps {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}

/**
 * Reading View - Reading mode and behavior customization
 */
export function ReadingView({ preferences, updatePreference }: ReadingViewProps) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Reading Preferences</h2>
      <div className="space-y-6">
        {/* Reading Mode Section */}
        <Card className="bg-muted">
          <CardHeader title="Reading Mode" />
          <CardBody>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Choose how articles open when you click them in the feed.
            </p>

          <div className="space-y-4">
            <OptionGridSelector
              label="Reading Mode"
              value={preferences.readingMode || "side_panel"}
              onChange={(value) => updatePreference("readingMode", value as "side_panel" | "inline" | "standalone")}
              options={[
                {
                  value: "side_panel",
                  label: "Side Panel",
                  description: "Split-view with resizable panel",
                  icon: <span className="text-xl">⊞</span>
                },
                {
                  value: "inline",
                  label: "Inline",
                  description: "Accordion-style expansion in list",
                  icon: <span className="text-xl">⬍</span>
                },
                {
                  value: "standalone",
                  label: "Standalone",
                  description: "Full-page dedicated view",
                  icon: <span className="text-xl">□</span>
                }
              ]}
              columns={1}
            />

            {/* Inline Mode Settings */}
            <ConditionalSection show={(preferences.readingMode || "side_panel") === "inline"} padding>
              <ToggleSwitch
                label="Auto-scroll to Article"
                description="Automatically scroll to the article when it expands"
                checked={preferences.inlineAutoScroll ?? true}
                onChange={(checked) => updatePreference("inlineAutoScroll", checked)}
              />
            </ConditionalSection>

            {/* Side Panel Settings */}
            <ConditionalSection show={(preferences.readingMode || "side_panel") === "side_panel"} padding>
              <div className="space-y-4">
                <ToggleSwitch
                  label="Enable Reading Panel"
                  description="Show articles in a resizable side panel"
                  checked={preferences.readingPanelEnabled || false}
                  onChange={(checked) => updatePreference("readingPanelEnabled", checked)}
                />

                <ConditionalSection show={preferences.readingPanelEnabled || false}>
                  <div className="space-y-4">
                    <OptionGridSelector
                      label="Panel Position"
                      description="Choose where the reading panel appears on your screen"
                      value={preferences.readingPanelPosition || "right"}
                      onChange={(value) => updatePreference("readingPanelPosition", value)}
                      options={[
                        { value: "right", label: "Right", icon: <span className="text-lg">→</span> },
                        { value: "left", label: "Left", icon: <span className="text-lg">←</span> },
                        { value: "top", label: "Top", icon: <span className="text-lg">↑</span> },
                        { value: "bottom", label: "Bottom", icon: <span className="text-lg">↓</span> }
                      ]}
                      columns={2}
                    />

                    <RangeSliderField
                      label="Default Panel Size"
                      description="Adjust the default size of the reading panel (can be resized while reading)"
                      value={preferences.readingPanelSize || 50}
                      onChange={(value) => updatePreference("readingPanelSize", value)}
                      min={30}
                      max={70}
                      step={5}
                      unit="%"
                      showMarkers
                    />
                  </div>
                </ConditionalSection>
              </div>
            </ConditionalSection>
          </div>
          </CardBody>
        </Card>

        {/* Articles Per Page */}
        <NumberSettingField
          label="Articles Per Page"
          value={preferences.articlesPerPage || 20}
          onChange={(value) => updatePreference("articlesPerPage", value || 20)}
          min={5}
          max={100}
          showReset={false}
          helperText="Number of articles to display per page"
        />

        {/* Infinite Scroll Mode */}
        <SelectSettingField
          label="Infinite Scroll Mode"
          value={preferences.infiniteScrollMode || "both"}
          onChange={(value) => updatePreference("infiniteScrollMode", value || "both")}
          options={[
            { value: "auto", label: "Auto-load (scroll to load more)" },
            { value: "button", label: "Button only (manual load)" },
            { value: "both", label: "Both (auto-load + button)" },
          ]}
          showReset={false}
          helperText="Choose how to load more articles: automatically when scrolling, with a button, or both"
        />

        {/* Toggle Switches */}
        <ToggleSwitch
          label="Show Read Articles"
          description="Display articles you've already read in the feed"
          checked={preferences.showReadArticles || false}
          onChange={(checked) => updatePreference("showReadArticles", checked)}
        />

        <ToggleSwitch
          label="Auto Mark as Read"
          description="Automatically mark articles as read when you open them"
          checked={preferences.autoMarkAsRead ?? true}
          onChange={(checked) => updatePreference("autoMarkAsRead", checked)}
        />

        <ToggleSwitch
          label="Show Excerpts in Related Articles"
          description="Display article snippets in the related articles section"
          checked={preferences.showRelatedExcerpts || false}
          onChange={(checked) => updatePreference("showRelatedExcerpts", checked)}
        />
      </div>
    </div>
  );
}
