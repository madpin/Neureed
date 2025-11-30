'use client';

import { Select } from '@/app/components/ui/Form/Select';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectSettingFieldProps {
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
  value: string | null;

  /**
   * Callback when value changes
   */
  onChange: (value: string | null) => void;

  /**
   * Array of options to display
   */
  options: SelectOption[];

  /**
   * Default value to show when value is null
   */
  defaultValue?: string;

  /**
   * Whether to show the reset button
   */
  showReset?: boolean;

  /**
   * Placeholder text for empty option
   */
  placeholder?: string;

  /**
   * Whether the field is disabled
   */
  disabled?: boolean;

  /**
   * Helper text shown below the select
   */
  helperText?: string;
}

/**
 * SelectSettingField - Reusable select dropdown with optional reset button
 *
 * Used for settings that can cascade from category/user/system defaults.
 * When value is null, the setting uses the inherited default value.
 *
 * @example
 * ```tsx
 * <SelectSettingField
 *   label="Extraction Method"
 *   description="Choose how to extract article content"
 *   value={extractionMethod}
 *   onChange={setExtractionMethod}
 *   options={[
 *     { value: 'rss', label: 'RSS Only (Default)' },
 *     { value: 'readability', label: 'Readability (Clean extraction)' },
 *     { value: 'playwright', label: 'Playwright (JS-rendered content)' }
 *   ]}
 *   showReset={true}
 *   helperText="Determines how article content is extracted from this feed"
 * />
 * ```
 */
export function SelectSettingField({
  label,
  description,
  value,
  onChange,
  options,
  defaultValue,
  showReset = true,
  placeholder = 'Select an option',
  disabled = false,
  helperText,
}: SelectSettingFieldProps) {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    onChange(newValue || null);
  };

  const handleReset = () => {
    onChange(null);
  };

  const displayText = value
    ? options.find(opt => opt.value === value)?.label || value
    : defaultValue
    ? `Using default: ${defaultValue}`
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

      {/* Select Row */}
      <div className="flex items-center gap-3">
        <Select
          value={value ?? ''}
          onChange={handleSelectChange}
          disabled={disabled}
          className="text-sm"
        >
          {placeholder && (
            <option value="">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {/* Display Text */}
        {!value && (
          <span className="text-sm text-foreground/60 whitespace-nowrap">
            {displayText}
          </span>
        )}

        {/* Reset Button */}
        {showReset && value !== null && !disabled && (
          <button
            onClick={handleReset}
            className="text-xs text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
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
