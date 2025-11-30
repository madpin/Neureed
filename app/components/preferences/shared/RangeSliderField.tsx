'use client';

import { ReactNode } from 'react';

export interface RangeSliderFieldProps {
  /**
   * Label text for the slider
   */
  label: string;

  /**
   * Optional description text shown below the slider
   */
  description?: string;

  /**
   * Current value
   */
  value: number;

  /**
   * Callback when value changes
   */
  onChange: (value: number) => void;

  /**
   * Minimum allowed value
   */
  min: number;

  /**
   * Maximum allowed value
   */
  max: number;

  /**
   * Step increment for the slider
   */
  step: number;

  /**
   * Unit to display (e.g., "%", "days", "px")
   */
  unit?: string;

  /**
   * Custom function to format the value display
   */
  formatValue?: (val: number) => string;

  /**
   * Whether to show min/max markers below the slider
   */
  showMarkers?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * RangeSliderField - Reusable range slider with value display and markers
 *
 * Used for numeric settings that users adjust with a slider.
 * Automatically shows the current value and optional min/max markers.
 *
 * @example
 * ```tsx
 * <RangeSliderField
 *   label="Bounce Threshold"
 *   description="Articles read for less than this percentage are considered bounced"
 *   value={bounceThreshold}
 *   onChange={setBounceThreshold}
 *   min={0.1}
 *   max={0.5}
 *   step={0.01}
 *   unit="%"
 *   formatValue={(val) => `${Math.round(val * 100)}%`}
 *   showMarkers
 * />
 * ```
 */
export function RangeSliderField({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step,
  unit = '',
  formatValue,
  showMarkers = false,
  className = '',
}: RangeSliderFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  // Format the display value
  const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label with current value */}
      <label className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-semibold text-primary">
          {displayValue}
        </span>
      </label>

      {/* Slider */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={displayValue}
      />

      {/* Markers */}
      {showMarkers && (
        <div className="mt-1 flex justify-between text-xs text-foreground/50">
          <span>{formatValue ? formatValue(min) : `${min}${unit}`}</span>
          <span>{formatValue ? formatValue(max) : `${max}${unit}`}</span>
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="mt-1 text-xs text-foreground/60">
          {description}
        </p>
      )}
    </div>
  );
}
