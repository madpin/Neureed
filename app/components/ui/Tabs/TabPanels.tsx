"use client";

import { ReactNode } from 'react';

export interface TabPanelsProps {
  /**
   * Additional className
   */
  className?: string;

  /**
   * TabPanel components
   */
  children: ReactNode;
}

/**
 * TabPanels component - Container for TabPanel components
 *
 * @example
 * ```tsx
 * <TabPanels>
 *   <TabPanel value="tab1">Content 1</TabPanel>
 *   <TabPanel value="tab2">Content 2</TabPanel>
 * </TabPanels>
 * ```
 */
export function TabPanels({ className = '', children }: TabPanelsProps) {
  return <div className={className}>{children}</div>;
}
