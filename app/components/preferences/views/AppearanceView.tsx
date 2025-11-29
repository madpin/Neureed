"use client";

import { ThemePalette } from "../ThemePalette";
import { Card, CardHeader, CardBody } from "@/app/components/ui";
import { SelectSettingField } from "@/app/components/shared/settings";
import type { UserPreferences } from "@/hooks/queries/use-user-preferences";

export interface AppearanceViewProps {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}

/**
 * Appearance View - Theme and font size customization
 */
export function AppearanceView({ preferences, updatePreference }: AppearanceViewProps) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Appearance</h2>
      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <label className="mb-3 block text-sm font-medium">Theme</label>
          <ThemePalette
            selectedTheme={preferences.theme || "system"}
            onThemeChange={(theme) => {
              updatePreference("theme", theme);
              window.dispatchEvent(new CustomEvent("preferencesUpdated", {
                detail: { theme }
              }));
            }}
          />
        </div>

        {/* Font Size */}
        <SelectSettingField
          label="Font Size"
          value={preferences.fontSize || "medium"}
          onChange={(value) => updatePreference("fontSize", value || "medium")}
          options={[
            { value: "small", label: "Small (14px)" },
            { value: "medium", label: "Medium (16px)" },
            { value: "large", label: "Large (18px)" },
          ]}
          showReset={false}
          helperText="Choose a preset font size for the main content"
        />

        {/* Section-Specific Font Sizes */}
        <Card className="bg-muted/50">
          <CardHeader title="Section-Specific Font Sizes" />
          <CardBody>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Customize text sizes for different sections relative to your main font size.
              &quot;Smaller&quot; is -2px, &quot;Same&quot; is ±0, &quot;Larger&quot; is +2px.
            </p>

          <div className="space-y-4">
            {/* Sidebar Font Size */}
            <SelectSettingField
              label="Sidebar"
              value={preferences.sidebarFontSize || "smaller"}
              onChange={(value) => updatePreference("sidebarFontSize", value || "smaller")}
              options={[
                { value: "smaller", label: "Smaller (Main -2px)" },
                { value: "same", label: "Same as Main" },
                { value: "larger", label: "Larger (Main +2px)" },
              ]}
              showReset={false}
            />

            {/* Article Cards Font Size */}
            <SelectSettingField
              label="Article Cards"
              value={preferences.cardFontSize || "same"}
              onChange={(value) => updatePreference("cardFontSize", value || "same")}
              options={[
                { value: "smaller", label: "Smaller (Main -2px)" },
                { value: "same", label: "Same as Main" },
                { value: "larger", label: "Larger (Main +2px)" },
              ]}
              showReset={false}
            />

            {/* Modals Font Size */}
            <SelectSettingField
              label="Modals & Dialogs"
              value={preferences.modalFontSize || "same"}
              onChange={(value) => updatePreference("modalFontSize", value || "same")}
              options={[
                { value: "smaller", label: "Smaller (Main -2px)" },
                { value: "same", label: "Same as Main" },
                { value: "larger", label: "Larger (Main +2px)" },
              ]}
              showReset={false}
            />

            {/* UI Elements Font Size */}
            <SelectSettingField
              label="UI Elements (Buttons, Badges, etc.)"
              value={preferences.uiFontSize || "same"}
              onChange={(value) => updatePreference("uiFontSize", value || "same")}
              options={[
                { value: "smaller", label: "Smaller (Main -2px)" },
                { value: "same", label: "Same as Main" },
                { value: "larger", label: "Larger (Main +2px)" },
              ]}
              showReset={false}
            />

            {/* Preview */}
            <div className="mt-4 rounded-lg bg-background p-4 border border-border">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Preview</p>
              <div className="space-y-2">
                <div style={{ fontSize: `var(--font-size-sidebar)` }}>
                  <span className="text-gray-500">Sidebar: </span>
                  <span>The quick brown fox jumps over the lazy dog</span>
                </div>
                <div style={{ fontSize: `var(--font-size-card)` }}>
                  <span className="text-gray-500">Cards: </span>
                  <span>The quick brown fox jumps over the lazy dog</span>
                </div>
                <div style={{ fontSize: `var(--font-size-modal)` }}>
                  <span className="text-gray-500">Modals: </span>
                  <span>The quick brown fox jumps over the lazy dog</span>
                </div>
                <div style={{ fontSize: `var(--font-size-ui)` }}>
                  <span className="text-gray-500">UI: </span>
                  <span>The quick brown fox jumps over the lazy dog</span>
                </div>
              </div>
            </div>
          </div>
          </CardBody>
        </Card>

        {/* Default View */}
        <SelectSettingField
          label="Default Article View"
          value={preferences.defaultView || "expanded"}
          onChange={(value) => updatePreference("defaultView", value as "compact" | "expanded")}
          options={[
            { value: "compact", label: "Compact" },
            { value: "expanded", label: "Expanded" },
          ]}
          showReset={false}
          helperText="Choose the default view for article cards"
        />
      </div>
    </div>
  );
}
