'use client';

import { useState } from 'react';

export interface PasswordFieldProps {
  /**
   * Label text for the field
   */
  label: string;

  /**
   * Optional description text shown below the label
   */
  description?: string;

  /**
   * Current value
   */
  value: string;

  /**
   * Callback when value changes
   */
  onChange: (value: string) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Helper text shown below the input (e.g., security info)
   */
  helperText?: string;

  /**
   * Whether the field is disabled
   */
  disabled?: boolean;
}

/**
 * PasswordField - Password input with show/hide toggle
 *
 * Used for sensitive text inputs like API keys. Includes a toggle button
 * to show/hide the password text and proper autocomplete attributes.
 *
 * @example
 * ```tsx
 * <PasswordField
 *   label="API Key"
 *   description="Your OpenAI API key"
 *   value={apiKey}
 *   onChange={setApiKey}
 *   placeholder="sk-..."
 *   helperText="🔒 Your API key is encrypted before storage"
 * />
 * ```
 */
export function PasswordField({
  label,
  description,
  value,
  onChange,
  placeholder,
  helperText,
  disabled = false,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

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

      {/* Input Container */}
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={label}
        />

        {/* Show/Hide Toggle Button */}
        <button
          type="button"
          onClick={toggleShowPassword}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Helper Text */}
      {helperText && (
        <p className="text-xs text-primary/80">
          {helperText}
        </p>
      )}
    </div>
  );
}
