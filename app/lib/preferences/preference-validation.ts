import type { UserPreferences } from '@/hooks/queries/use-user-preferences';

/**
 * Validation result for user preferences
 */
export interface ValidationResult {
  /**
   * Whether all preferences are valid
   */
  isValid: boolean;

  /**
   * Array of validation error messages (empty if valid)
   */
  errors: string[];
}

/**
 * Validate user preferences before saving
 *
 * Performs client-side validation to catch common issues before sending
 * to the server. This provides faster feedback to users and reduces
 * server load.
 *
 * @param preferences - User preferences to validate
 * @returns Validation result with errors if any
 *
 * @example
 * ```tsx
 * const validation = validatePreferences(preferences);
 * if (!validation.isValid) {
 *   console.error('Validation failed:', validation.errors);
 * }
 * ```
 */
export function validatePreferences(preferences: UserPreferences): ValidationResult {
  const errors: string[] = [];

  // Validate article card border width
  if (
    preferences.articleCardBorderWidth &&
    !["none", "thin", "normal", "thick"].includes(preferences.articleCardBorderWidth)
  ) {
    errors.push(`Invalid borderWidth: ${preferences.articleCardBorderWidth}`);
  }

  // Validate article card border radius
  if (
    preferences.articleCardBorderRadius &&
    !["sharp", "slight", "normal", "rounded"].includes(preferences.articleCardBorderRadius)
  ) {
    errors.push(`Invalid borderRadius: ${preferences.articleCardBorderRadius}`);
  }

  // Validate article card border contrast
  if (
    preferences.articleCardBorderContrast &&
    !["subtle", "medium", "strong"].includes(preferences.articleCardBorderContrast)
  ) {
    errors.push(`Invalid borderContrast: ${preferences.articleCardBorderContrast}`);
  }

  // Validate article card spacing
  if (
    preferences.articleCardSpacing &&
    !["none", "compact", "normal", "comfortable", "spacious"].includes(preferences.articleCardSpacing)
  ) {
    errors.push(`Invalid spacing: ${preferences.articleCardSpacing}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
