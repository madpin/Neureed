'use client';

import { Input } from '@/app/components/ui/Form/Input';

export interface TextInputFieldProps {
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
   * Input type
   */
  type?: 'text' | 'url' | 'email';

  /**
   * Placeholder text for empty input
   */
  placeholder?: string;

  /**
   * Default value to show when value is null
   */
  defaultValue?: string;

  /**
   * Whether to show the reset button
   */
  showReset?: boolean;

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
 * TextInputField - Reusable text input with optional reset button
 *
 * Used for settings that can cascade from category/user/system defaults.
 * When value is null, the setting uses the inherited default value.
 *
 * @example
 * ```tsx
 * <TextInputField
 *   label="Summarization Model"
 *   description="Model for generating article summaries"
 *   value={summaryModel}
 *   onChange={setSummaryModel}
 *   type="text"
 *   placeholder="e.g., gpt-4o-mini"
 *   showReset={true}
 *   helperText="Recommended: gpt-4o-mini, gpt-4o, gpt-3.5-turbo"
 * />
 * ```
 */
export function TextInputField({
  label,
  description,
  value,
  onChange,
  type = 'text',
  placeholder = 'Enter value',
  defaultValue,
  showReset = true,
  disabled = false,
  helperText,
}: TextInputFieldProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue || null);
  };

  const handleReset = () => {
    onChange(null);
  };

  const displayText = value
    ? value
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

      {/* Input Row */}
      <div className="flex items-center gap-3">
        <Input
          type={type}
          value={value ?? ''}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="text-sm"
        />

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
