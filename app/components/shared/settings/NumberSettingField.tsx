'use client';

import { Input } from '@/app/components/ui';

export interface NumberSettingFieldProps {
  /**
   * Label text for the field
   */
  label: string;

  /**
   * Optional description text shown below the label
   */
  description?: string;

  /**
   * Current value (null indicates using default)
   */
  value: number | null;

  /**
   * Callback when value changes
   */
  onChange: (value: number | null) => void;

  /**
   * Minimum allowed value
   */
  min?: number;

  /**
   * Maximum allowed value
   */
  max?: number;

  /**
   * Step increment for the input
   */
  step?: number;

  /**
   * Unit to display (e.g., "minutes", "articles", "days")
   */
  unit?: string;

  /**
   * Default value to show in placeholder
   */
  defaultValue?: number;

  /**
   * Whether to show the reset button
   */
  showReset?: boolean;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Whether the field is disabled
   */
  disabled?: boolean;

  /**
   * Helper text shown below the input
   */
  helperText?: string;
}

/**
 * NumberSettingField - Reusable number input with optional reset button
 *
 * Used for settings that can cascade from category/user/system defaults.
 * When value is null, the setting uses the inherited default value.
 *
 * @example
 * ```tsx
 * <NumberSettingField
 *   label="Refresh Interval"
 *   description="How often to check for new articles"
 *   value={refreshInterval}
 *   onChange={setRefreshInterval}
 *   min={15}
 *   max={1440}
 *   unit="minutes"
 *   defaultValue={60}
 *   showReset={true}
 *   helperText="Valid range: 15-1440 minutes"
 * />
 * ```
 */
export function NumberSettingField({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  defaultValue,
  showReset = true,
  placeholder,
  disabled = false,
  helperText,
}: NumberSettingFieldProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue ? Number(newValue) : null);
  };

  const handleReset = () => {
    onChange(null);
  };

  const displayPlaceholder = placeholder || (defaultValue ? `Default: ${defaultValue}` : undefined);
  const displayText = value
    ? `${value}${unit ? ` ${unit}` : ''}`
    : 'Using default';

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>

      {/* Description */}
      {description && (
        <p className="text-xs text-foreground/60">
          {description}
        </p>
      )}

      {/* Input Row */}
      <div className="flex items-center gap-3">
        <Input
          type="number"
          value={value ?? ''}
          onChange={handleInputChange}
          placeholder={displayPlaceholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-40 text-sm"
        />

        {/* Display Text */}
        <span className="text-sm text-foreground/60">
          {displayText}
        </span>

        {/* Reset Button */}
        {showReset && value !== null && !disabled && (
          <button
            onClick={handleReset}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
            type="button"
          >
            Reset to default
          </button>
        )}
      </div>

      {/* Helper Text */}
      {helperText && (
        <p className="text-xs text-foreground/50">
          {helperText}
        </p>
      )}
    </div>
  );
}
