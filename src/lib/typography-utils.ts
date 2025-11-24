/**
 * Typography Utility System
 *
 * This module provides utilities for managing consistent, configurable text sizing
 * across the application. It implements a relative sizing system where section-specific
 * font sizes (sidebar, cards, modals, UI) are relative to a base font size.
 *
 * Architecture:
 * - Base fontSize: "small" (14px) | "medium" (16px) | "large" (18px)
 * - Relative sizes: "smaller" (-2px) | "same" (0) | "larger" (+2px)
 * - Final size = base + relative offset
 *
 * Example:
 * - Base: "medium" (16px) + Sidebar: "smaller" (-2px) = 14px
 * - Base: "large" (18px) + Cards: "larger" (+2px) = 20px
 */

/**
 * Type definitions for font size preferences
 */
export type BaseFontSize = "small" | "medium" | "large";
export type RelativeFontSize = "smaller" | "same" | "larger";

/**
 * Section types that can have independent font size settings
 */
export type FontSizeSection = "sidebar" | "card" | "modal" | "ui";

/**
 * Base font sizes in pixels
 */
export const BASE_FONT_SIZES: Record<BaseFontSize, number> = {
  small: 14,
  medium: 16,
  large: 18,
} as const;

/**
 * Relative font size offsets in pixels
 */
export const RELATIVE_FONT_OFFSETS: Record<RelativeFontSize, number> = {
  smaller: -2,
  same: 0,
  larger: 2,
} as const;

/**
 * Calculate absolute font size from base and relative sizes
 *
 * @param baseFontSize - The base font size (small/medium/large)
 * @param relativeSize - The relative offset (smaller/same/larger)
 * @returns Absolute font size in pixels
 *
 * @example
 * getAbsoluteSize("medium", "smaller") // Returns 14 (16 - 2)
 * getAbsoluteSize("large", "larger")   // Returns 20 (18 + 2)
 */
export function getAbsoluteSize(
  baseFontSize: BaseFontSize,
  relativeSize: RelativeFontSize
): number {
  const base = BASE_FONT_SIZES[baseFontSize];
  const offset = RELATIVE_FONT_OFFSETS[relativeSize];
  return base + offset;
}

/**
 * Get CSS custom property value for a section
 *
 * @param section - The UI section (sidebar/card/modal/ui)
 * @returns CSS custom property name
 *
 * @example
 * getCSSPropertyName("sidebar") // Returns "--font-size-sidebar"
 */
export function getCSSPropertyName(section: FontSizeSection): string {
  return `--font-size-${section}`;
}

/**
 * Get inline style object for a section's font size
 *
 * @param section - The UI section
 * @param baseFontSize - Base font size
 * @param relativeSize - Relative size offset
 * @returns Style object with fontSize in pixels
 *
 * @example
 * getFontSizeStyle("sidebar", "medium", "smaller")
 * // Returns { fontSize: "14px" }
 */
export function getFontSizeStyle(
  section: FontSizeSection,
  baseFontSize: BaseFontSize,
  relativeSize: RelativeFontSize
): { fontSize: string } {
  const size = getAbsoluteSize(baseFontSize, relativeSize);
  return { fontSize: `${size}px` };
}

/**
 * Map of relative sizes to Tailwind text size classes
 * This provides approximate Tailwind equivalents for calculated sizes
 */
export const RELATIVE_SIZE_TAILWIND_MAP: Record<
  number,
  {
    base: string;
    sm: string;
    xs: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
  }
> = {
  12: {
    base: "text-xs",
    sm: "text-[10px]",
    xs: "text-[9px]",
    lg: "text-sm",
    xl: "text-base",
    "2xl": "text-lg",
    "3xl": "text-xl",
  },
  14: {
    base: "text-sm",
    sm: "text-xs",
    xs: "text-[10px]",
    lg: "text-base",
    xl: "text-lg",
    "2xl": "text-xl",
    "3xl": "text-2xl",
  },
  16: {
    base: "text-base",
    sm: "text-sm",
    xs: "text-xs",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
  },
  18: {
    base: "text-lg",
    sm: "text-base",
    xs: "text-sm",
    lg: "text-xl",
    xl: "text-2xl",
    "2xl": "text-3xl",
    "3xl": "text-4xl",
  },
  20: {
    base: "text-xl",
    sm: "text-lg",
    xs: "text-base",
    lg: "text-2xl",
    xl: "text-3xl",
    "2xl": "text-4xl",
    "3xl": "text-5xl",
  },
};

/**
 * Get Tailwind text size classes for a section based on preferences
 *
 * @param section - The UI section
 * @param baseFontSize - Base font size
 * @param relativeSize - Relative size offset
 * @param variant - Size variant (base, sm, xs, lg, xl, 2xl, 3xl)
 * @returns Tailwind class string
 *
 * @example
 * getTailwindClass("sidebar", "medium", "smaller", "base")
 * // Returns "text-sm" (14px base)
 *
 * getTailwindClass("card", "large", "larger", "xl")
 * // Returns "text-3xl" (20px base, xl variant)
 */
export function getTailwindClass(
  section: FontSizeSection,
  baseFontSize: BaseFontSize,
  relativeSize: RelativeFontSize,
  variant: "base" | "sm" | "xs" | "lg" | "xl" | "2xl" | "3xl" = "base"
): string {
  const absoluteSize = getAbsoluteSize(baseFontSize, relativeSize);
  const sizeMap = RELATIVE_SIZE_TAILWIND_MAP[absoluteSize];

  if (!sizeMap) {
    // Fallback for sizes not in map
    return RELATIVE_SIZE_TAILWIND_MAP[16][variant];
  }

  return sizeMap[variant];
}

/**
 * Calculate all section font sizes from user preferences
 *
 * @param preferences - User preferences object containing font size settings
 * @returns Object with calculated sizes for all sections
 *
 * @example
 * const sizes = calculateSectionSizes({
 *   fontSize: "medium",
 *   sidebarFontSize: "smaller",
 *   cardFontSize: "same",
 *   modalFontSize: "larger",
 *   uiFontSize: "same"
 * });
 * // Returns:
 * // {
 * //   sidebar: 14,
 * //   card: 16,
 * //   modal: 18,
 * //   ui: 16
 * // }
 */
export function calculateSectionSizes(preferences: {
  fontSize: string;
  sidebarFontSize: string;
  cardFontSize: string;
  modalFontSize: string;
  uiFontSize: string;
}): Record<FontSizeSection, number> {
  const baseFontSize = preferences.fontSize as BaseFontSize;

  return {
    sidebar: getAbsoluteSize(
      baseFontSize,
      preferences.sidebarFontSize as RelativeFontSize
    ),
    card: getAbsoluteSize(
      baseFontSize,
      preferences.cardFontSize as RelativeFontSize
    ),
    modal: getAbsoluteSize(
      baseFontSize,
      preferences.modalFontSize as RelativeFontSize
    ),
    ui: getAbsoluteSize(baseFontSize, preferences.uiFontSize as RelativeFontSize),
  };
}

/**
 * Generate CSS custom properties string for document root
 *
 * @param preferences - User preferences object
 * @returns CSS string to be applied to :root or document.documentElement
 *
 * @example
 * const css = generateCSSVariables(preferences);
 * document.documentElement.style.cssText += css;
 * // Applies:
 * // --font-size-sidebar: 14px;
 * // --font-size-card: 16px;
 * // --font-size-modal: 18px;
 * // --font-size-ui: 16px;
 */
export function generateCSSVariables(preferences: {
  fontSize: string;
  sidebarFontSize: string;
  cardFontSize: string;
  modalFontSize: string;
  uiFontSize: string;
}): string {
  const sizes = calculateSectionSizes(preferences);

  return Object.entries(sizes)
    .map(([section, size]) => `${getCSSPropertyName(section as FontSizeSection)}: ${size}px;`)
    .join(" ");
}

/**
 * Apply font size CSS variables to document root
 * This is the main function to call when preferences change
 *
 * @param preferences - User preferences object
 *
 * @example
 * applyFontSizeVariables(userPreferences);
 * // Updates document.documentElement with new CSS variables
 */
export function applyFontSizeVariables(preferences: {
  fontSize: string;
  sidebarFontSize: string;
  cardFontSize: string;
  modalFontSize: string;
  uiFontSize: string;
}): void {
  const sizes = calculateSectionSizes(preferences);

  Object.entries(sizes).forEach(([section, size]) => {
    document.documentElement.style.setProperty(
      getCSSPropertyName(section as FontSizeSection),
      `${size}px`
    );
  });
}

/**
 * Get readable label for relative size
 *
 * @param relativeSize - The relative size value
 * @returns Human-readable label
 */
export function getRelativeSizeLabel(relativeSize: RelativeFontSize): string {
  const labels: Record<RelativeFontSize, string> = {
    smaller: "Smaller",
    same: "Same as base",
    larger: "Larger",
  };
  return labels[relativeSize];
}

/**
 * Get readable label for base font size
 *
 * @param baseFontSize - The base font size value
 * @returns Human-readable label with pixel size
 */
export function getBaseFontSizeLabel(baseFontSize: BaseFontSize): string {
  const size = BASE_FONT_SIZES[baseFontSize];
  return `${baseFontSize.charAt(0).toUpperCase() + baseFontSize.slice(1)} (${size}px)`;
}

/**
 * Preview text sizes for a given configuration
 * Useful for preference UI to show what sizes will be applied
 *
 * @param baseFontSize - Base font size
 * @returns Object with preview information for all sections
 */
export function getPreviewSizes(baseFontSize: BaseFontSize): Record<
  RelativeFontSize,
  {
    size: number;
    label: string;
    description: string;
  }
> {
  return {
    smaller: {
      size: getAbsoluteSize(baseFontSize, "smaller"),
      label: "Smaller",
      description: `${BASE_FONT_SIZES[baseFontSize] - 2}px`,
    },
    same: {
      size: getAbsoluteSize(baseFontSize, "same"),
      label: "Same as base",
      description: `${BASE_FONT_SIZES[baseFontSize]}px`,
    },
    larger: {
      size: getAbsoluteSize(baseFontSize, "larger"),
      label: "Larger",
      description: `${BASE_FONT_SIZES[baseFontSize] + 2}px`,
    },
  };
}
