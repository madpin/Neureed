"use client";

import { ReactNode } from 'react';
import { useTabsContext } from './Tabs';

export interface TabListProps {
  /**
   * ARIA label for the tab list
   */
  'aria-label'?: string;

  /**
   * Additional className
   */
  className?: string;

  /**
   * Tab buttons
   */
  children: ReactNode;
}

/**
 * TabList component - Container for Tab buttons
 *
 * Provides the semantic tablist role and orientation for accessibility.
 * Keyboard navigation is handled by individual Tab components.
 *
 * @example
 * ```tsx
 * <TabList aria-label="Settings">
 *   <Tab value="general">General</Tab>
 *   <Tab value="privacy">Privacy</Tab>
 * </TabList>
 * ```
 */
export function TabList({ 'aria-label': ariaLabel, className = '', children }: TabListProps) {
  const { orientation } = useTabsContext();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation={orientation}
      className={className}
    >
      {children}
    </div>
  );
}
