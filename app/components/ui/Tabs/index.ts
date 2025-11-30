/**
 * Tabs Component Library
 *
 * A fully accessible tabs component with keyboard navigation,
 * controlled/uncontrolled modes, and horizontal/vertical orientations.
 *
 * @example
 * ```tsx
 * import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/app/components/ui/Tabs';
 *
 * function MyComponent() {
 *   return (
 *     <Tabs defaultValue="tab1">
 *       <TabList>
 *         <Tab value="tab1">Tab 1</Tab>
 *         <Tab value="tab2">Tab 2</Tab>
 *       </TabList>
 *       <TabPanels>
 *         <TabPanel value="tab1">Content 1</TabPanel>
 *         <TabPanel value="tab2">Content 2</TabPanel>
 *       </TabPanels>
 *     </Tabs>
 *   );
 * }
 * ```
 */

export { Tabs, useTabsContext } from './Tabs';
export type { TabsProps, TabValue, Orientation } from './Tabs';

export { TabList } from './TabList';
export type { TabListProps } from './TabList';

export { Tab } from './Tab';
export type { TabProps } from './Tab';

export { TabPanels } from './TabPanels';
export type { TabPanelsProps } from './TabPanels';

export { TabPanel } from './TabPanel';
export type { TabPanelProps } from './TabPanel';
