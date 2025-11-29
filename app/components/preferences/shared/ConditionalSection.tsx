'use client';

import { ReactNode } from 'react';

export interface ConditionalSectionProps {
  /**
   * Whether to show the section
   */
  show: boolean;

  /**
   * Content to conditionally render
   */
  children: ReactNode;

  /**
   * Whether to animate show/hide transitions
   */
  animate?: boolean;

  /**
   * Whether to add padding and styled container
   */
  padding?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ConditionalSection - Wrapper for conditionally displayed content
 *
 * Used to show/hide sections based on other preference values.
 * Supports smooth animations and optional styled container.
 *
 * @example
 * ```tsx
 * <ConditionalSection
 *   show={readingMode === "side_panel"}
 *   padding
 *   animate
 * >
 *   <PanelPositionSelector />
 *   <PanelSizeSlider />
 * </ConditionalSection>
 * ```
 */
export function ConditionalSection({
  show,
  children,
  animate = true,
  padding = false,
  className = '',
}: ConditionalSectionProps) {
  // If not animating, just return null when hidden
  if (!show && !animate) {
    return null;
  }

  return (
    <div
      className={`
        ${animate ? 'transition-all duration-200 ease-in-out' : ''}
        ${show ? 'opacity-100 max-h-full' : 'opacity-0 max-h-0 overflow-hidden'}
        ${padding ? 'rounded-lg border border-border bg-muted/50 p-4' : ''}
        ${className}
      `}
      aria-hidden={!show}
      role={padding ? 'region' : undefined}
    >
      {children}
    </div>
  );
}
