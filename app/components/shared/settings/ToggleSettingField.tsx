'use client';

import { ToggleSwitch } from '@/app/components/ui/ToggleSwitch';

export interface ToggleSettingFieldProps {
  /**
   * Label text for the toggle
   */
  label: string;

  /**
   * Optional description text shown below the label
   */
  description?: string;

  /**
   * Whether the toggle is checked
   */
  checked: boolean;

  /**
   * Callback when toggle state changes
   */
  onChange: (checked: boolean) => void;

  /**
   * Whether the toggle is disabled
   */
  disabled?: boolean;

  /**
   * Optional source indicator (e.g., "From category settings", "From user defaults")
   * Shown when the value is inherited from a cascade setting
   */
  source?: string;

  /**
   * Size of the toggle
   */
  size?: 'sm' | 'md';

  /**
   * Helper text shown below the toggle
   */
  helperText?: string;
}

/**
 * ToggleSettingField - Reusable toggle switch for boolean settings
 *
 * Wraps the ToggleSwitch component with additional features for settings that
 * can cascade from category/user/system defaults. Shows an optional source
 * indicator when the setting is inherited.
 *
 * @example
 * ```tsx
 * <ToggleSettingField
 *   label="Enable Summarization"
 *   description="Automatically generate summaries for articles"
 *   checked={summarizationEnabled}
 *   onChange={setSummarizationEnabled}
 *   source="From user preferences"
 *   helperText="Summaries help you quickly understand article content"
 * />
 * ```
 */
export function ToggleSettingField({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  source,
  size = 'md',
  helperText,
}: ToggleSettingFieldProps) {
  return (
    <div className="space-y-2">
      <ToggleSwitch
        label={label}
        description={description}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        size={size}
      />

      {/* Source Indicator */}
      {source && (
        <p className="text-xs text-foreground/50 italic">
          {source}
        </p>
      )}

      {/* Helper Text */}
      {helperText && (
        <p className="text-xs text-foreground/50">
          {helperText}
        </p>
      )}
    </div>
  );
}
