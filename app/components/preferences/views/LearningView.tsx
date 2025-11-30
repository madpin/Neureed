"use client";

import { toast } from "sonner";
import { ToggleSwitch, Card, CardHeader, CardBody } from "@/app/components/ui";
import { useResetPatterns, type UserPreferences } from "@/hooks/queries/use-user-preferences";
import { RangeSliderField } from "@/app/components/preferences/shared";

export interface LearningViewProps {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}

/**
 * Learning View - AI learning system preferences
 */
export function LearningView({ preferences, updatePreference }: LearningViewProps) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Learning System</h2>
      <div className="space-y-6">
        <RangeSliderField
          label="Bounce Detection Threshold"
          description="If you leave an article before reading this percentage of the estimated time, it counts as negative feedback"
          value={(preferences.bounceThreshold || 0.25) * 100}
          onChange={(value) => updatePreference("bounceThreshold", value / 100)}
          min={10}
          max={50}
          step={5}
          unit="%"
        />

        <ToggleSwitch
          label="Show Low-Relevance Articles"
          description="Display articles with low relevance scores (dimmed) instead of hiding them"
          checked={preferences.showLowRelevanceArticles || false}
          onChange={(checked) => updatePreference("showLowRelevanceArticles", checked)}
        />

        <RangeSliderField
          label="Search Recency Weight"
          description="How much to prioritize recent articles in semantic search results. 0% = pure semantic similarity, 100% = only recency matters"
          value={(preferences.searchRecencyWeight || 0.3) * 100}
          onChange={(value) => updatePreference("searchRecencyWeight", value / 100)}
          min={0}
          max={100}
          step={5}
          unit="%"
        />

        <RangeSliderField
          label="Recency Decay Period"
          description="How quickly article recency importance fades. Shorter periods favor very recent articles."
          value={preferences.searchRecencyDecayDays || 30}
          onChange={(value) => updatePreference("searchRecencyDecayDays", value)}
          min={7}
          max={180}
          step={7}
          unit="days"
        />

        {/* Reset Button */}
        <Card className="bg-muted">
          <CardHeader title="Learned Patterns" />
          <CardBody>
            <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
              The system learns from your feedback to personalize article recommendations
            </p>
            <ResetPatternsButton />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

/**
 * Reset Patterns Button - Allows users to reset all learned patterns
 */
function ResetPatternsButton() {
  const resetPatterns = useResetPatterns();

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset all learned patterns? This cannot be undone.")) {
      try {
        await resetPatterns.mutateAsync();
        toast.success("Patterns reset successfully!");
      } catch (error) {
        console.error("Failed to reset patterns:", error);
        toast.error("Failed to reset patterns. Please try again.");
      }
    }
  };

  return (
    <button
      onClick={handleReset}
      disabled={resetPatterns.isPending}
      className="btn btn-danger btn-sm disabled:opacity-50"
    >
      {resetPatterns.isPending ? "Resetting..." : "Reset Learning"}
    </button>
  );
}
