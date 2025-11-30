"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export type TabValue = string;
export type Orientation = 'horizontal' | 'vertical';

interface TabsContextValue {
  value: TabValue | null;
  onChange: (value: TabValue) => void;
  orientation: Orientation;
  registerTab: (value: TabValue) => void;
  unregisterTab: (value: TabValue) => void;
  tabs: TabValue[];
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compound components must be used within a Tabs component');
  }
  return context;
}

export interface TabsProps {
  /**
   * The controlled value of the active tab
   */
  value?: TabValue;

  /**
   * The default value for uncontrolled mode
   */
  defaultValue?: TabValue;

  /**
   * Callback when the active tab changes
   */
  onChange?: (value: TabValue) => void;

  /**
   * Orientation of the tabs
   * @default 'horizontal'
   */
  orientation?: Orientation;

  /**
   * Additional className
   */
  className?: string;

  /**
   * Tab content
   */
  children: ReactNode;
}

/**
 * Tabs component - Container for tab navigation
 *
 * Supports both controlled and uncontrolled modes, horizontal and vertical orientations,
 * keyboard navigation, and full accessibility.
 *
 * @example
 * ```tsx
 * // Uncontrolled
 * <Tabs defaultValue="tab1">
 *   <TabList>
 *     <Tab value="tab1">Tab 1</Tab>
 *     <Tab value="tab2">Tab 2</Tab>
 *   </TabList>
 *   <TabPanels>
 *     <TabPanel value="tab1">Content 1</TabPanel>
 *     <TabPanel value="tab2">Content 2</TabPanel>
 *   </TabPanels>
 * </Tabs>
 *
 * // Controlled
 * <Tabs value={activeTab} onChange={setActiveTab}>
 *   <TabList>
 *     <Tab value="tab1">Tab 1</Tab>
 *     <Tab value="tab2">Tab 2</Tab>
 *   </TabList>
 *   <TabPanels>
 *     <TabPanel value="tab1">Content 1</TabPanel>
 *     <TabPanel value="tab2">Content 2</TabPanel>
 *   </TabPanels>
 * </Tabs>
 * ```
 */
export function Tabs({
  value,
  defaultValue,
  onChange,
  orientation = 'horizontal',
  className = '',
  children,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState<TabValue | null>(defaultValue || null);
  const [tabs, setTabs] = useState<TabValue[]>([]);

  // Determine if controlled
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalValue;

  // Warn if neither value nor defaultValue is provided
  useEffect(() => {
    if (value === undefined && defaultValue === undefined) {
      console.warn('Tabs: Either "value" or "defaultValue" must be provided.');
    }
  }, [value, defaultValue]);

  const handleChange = useCallback(
    (newValue: TabValue) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      if (onChange) {
        onChange(newValue);
      }
    },
    [isControlled, onChange]
  );

  const registerTab = useCallback((tabValue: TabValue) => {
    setTabs((prev) => {
      if (prev.includes(tabValue)) return prev;
      return [...prev, tabValue];
    });
  }, []);

  const unregisterTab = useCallback((tabValue: TabValue) => {
    setTabs((prev) => prev.filter((v) => v !== tabValue));
  }, []);

  const contextValue: TabsContextValue = {
    value: activeValue,
    onChange: handleChange,
    orientation,
    registerTab,
    unregisterTab,
    tabs,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}
