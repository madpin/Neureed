'use client';

import { ReactNode } from 'react';

/**
 * Option for the grid selector
 */
export interface OptionGridOption {
  /**
   * Unique value for this option
   */
  value: string;

  /**
   * Display label
   */
  label: string;

  /**
   * Optional description shown below label
   */
  description?: string;

  /**
   * Optional icon displayed above label
   */
  icon?: ReactNode;

  /**
   * Optional visual preview component
   */
  preview?: ReactNode;
}

export interface OptionGridSelectorProps {
  /**
   * Label text for the selector
   */
  label: string;

  /**
   * Optional description text shown below the label
   */
  description?: string;

  /**
   * Current selected value
   */
  value: string;

  /**
   * Callback when selection changes
   */
  onChange: (value: string) => void;

  /**
   * Array of options to display
   */
  options: OptionGridOption[];

  /**
   * Number of columns or 'auto' for responsive grid
   */
  columns?: number | 'auto';

  /**
   * Layout style
   */
  layout?: 'compact' | 'comfortable';

  /**
   * Whether to show preview components
   */
  showPreview?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * OptionGridSelector - Grid-based option selector with visual previews
 *
 * Used for settings where users choose from a set of predefined options
 * displayed in a grid layout. Supports icons, descriptions, and visual
 * previews for each option.
 *
 * @example
 * ```tsx
 * <OptionGridSelector
 *   label="Display Density"
 *   description="Choose how much information to show"
 *   value={density}
 *   onChange={setDensity}
 *   options={[
 *     {
 *       value: "compact",
 *       label: "Compact",
 *       description: "Minimal spacing",
 *       preview: <CompactPreview />
 *     },
 *     {
 *       value: "normal",
 *       label: "Normal",
 *       description: "Balanced",
 *       preview: <NormalPreview />
 *     }
 *   ]}
 *   columns={3}
 *   showPreview
 * />
 * ```
 */
export function OptionGridSelector({
  label,
  description,
  value,
  onChange,
  options,
  columns = 3,
  layout = 'comfortable',
  showPreview = false,
  className = '',
}: OptionGridSelectorProps) {
  // Generate grid columns class
  const gridClass = columns === 'auto'
    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
    : `grid-cols-${columns}`;

  // Layout-specific padding
  const paddingClass = layout === 'compact' ? 'p-3' : 'p-4';

  return (
    <div className={`space-y-3 ${className}`}>
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

      {/* Options Grid */}
      <div className={`grid gap-3 ${gridClass}`}>
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`
                flex flex-col items-center gap-2 rounded-lg border-2 ${paddingClass}
                text-left transition-all hover:scale-[1.02]
                ${
                  isSelected
                    ? "border-primary bg-primary/10 dark:bg-primary/20"
                    : "border-border bg-background hover:bg-muted"
                }
              `}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${option.label}${option.description ? `: ${option.description}` : ''}`}
            >
              {/* Icon */}
              {option.icon && (
                <span className={isSelected ? 'text-primary' : 'text-foreground/70'}>
                  {option.icon}
                </span>
              )}

              {/* Label */}
              <span className="text-sm font-semibold text-foreground text-center">
                {option.label}
              </span>

              {/* Description */}
              {option.description && (
                <span className="text-xs text-foreground/60 text-center">
                  {option.description}
                </span>
              )}

              {/* Preview */}
              {showPreview && option.preview && (
                <div className="mt-2 w-full flex items-center justify-center">
                  {option.preview}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
