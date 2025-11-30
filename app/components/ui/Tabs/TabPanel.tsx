"use client";

import { ReactNode } from 'react';
import { useTabsContext, TabValue } from './Tabs';

export interface TabPanelProps {
  /**
   * Value that matches the corresponding Tab
   */
  value: TabValue;

  /**
   * Additional className
   */
  className?: string;

  /**
   * Panel content
   */
  children: ReactNode;
}

/**
 * TabPanel component - Individual tab content panel
 *
 * Only renders when its value matches the active tab.
 *
 * @example
 * ```tsx
 * <TabPanel value="settings">
 *   <SettingsForm />
 * </TabPanel>
 * ```
 */
export function TabPanel({ value, className = '', children }: TabPanelProps) {
  const { value: activeValue } = useTabsContext();
  const isActive = activeValue === value;

  if (!isActive) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={className}
    >
      {children}
    </div>
  );
}
