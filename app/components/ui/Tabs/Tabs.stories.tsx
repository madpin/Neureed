import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from './index';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const HorizontalTabs: Story = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabList aria-label="Example tabs">
        <Tab value="tab1">First Tab</Tab>
        <Tab value="tab2">Second Tab</Tab>
        <Tab value="tab3">Third Tab</Tab>
      </TabList>
      <TabPanels className="mt-4 p-4 bg-muted rounded-lg">
        <TabPanel value="tab1">
          <h3 className="text-lg font-semibold mb-2">First Tab Content</h3>
          <p>This is the content for the first tab.</p>
        </TabPanel>
        <TabPanel value="tab2">
          <h3 className="text-lg font-semibold mb-2">Second Tab Content</h3>
          <p>This is the content for the second tab.</p>
        </TabPanel>
        <TabPanel value="tab3">
          <h3 className="text-lg font-semibold mb-2">Third Tab Content</h3>
          <p>This is the content for the third tab.</p>
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
};

export const VerticalTabs: Story = {
  render: () => (
    <Tabs defaultValue="settings" orientation="vertical">
      <div className="flex gap-4">
        <TabList aria-label="Settings navigation" className="flex flex-col gap-1 w-48">
          <Tab value="settings">Settings</Tab>
          <Tab value="profile">Profile</Tab>
          <Tab value="notifications">Notifications</Tab>
          <Tab value="privacy">Privacy</Tab>
        </TabList>
        <TabPanels className="flex-1 p-4 bg-muted rounded-lg">
          <TabPanel value="settings">
            <h3 className="text-lg font-semibold mb-2">Settings</h3>
            <p>Configure your application settings here.</p>
          </TabPanel>
          <TabPanel value="profile">
            <h3 className="text-lg font-semibold mb-2">Profile</h3>
            <p>Manage your profile information.</p>
          </TabPanel>
          <TabPanel value="notifications">
            <h3 className="text-lg font-semibold mb-2">Notifications</h3>
            <p>Control your notification preferences.</p>
          </TabPanel>
          <TabPanel value="privacy">
            <h3 className="text-lg font-semibold mb-2">Privacy</h3>
            <p>Manage your privacy settings.</p>
          </TabPanel>
        </TabPanels>
      </div>
    </Tabs>
  ),
};

export const TabsWithIcons: Story = {
  render: () => (
    <Tabs defaultValue="home">
      <TabList aria-label="Navigation" className="flex gap-2">
        <Tab
          value="home"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          }
        >
          Home
        </Tab>
        <Tab
          value="settings"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
        >
          Settings
        </Tab>
        <Tab
          value="profile"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          }
        >
          Profile
        </Tab>
      </TabList>
      <TabPanels className="mt-4 p-4 bg-muted rounded-lg">
        <TabPanel value="home">
          <h3 className="text-lg font-semibold mb-2">Home</h3>
          <p>Welcome to the home page!</p>
        </TabPanel>
        <TabPanel value="settings">
          <h3 className="text-lg font-semibold mb-2">Settings</h3>
          <p>Adjust your settings here.</p>
        </TabPanel>
        <TabPanel value="profile">
          <h3 className="text-lg font-semibold mb-2">Profile</h3>
          <p>View and edit your profile.</p>
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
};

export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabList aria-label="Example with disabled tab" className="flex gap-2">
        <Tab value="tab1">Active Tab</Tab>
        <Tab value="tab2" disabled>
          Disabled Tab
        </Tab>
        <Tab value="tab3">Another Active Tab</Tab>
      </TabList>
      <TabPanels className="mt-4 p-4 bg-muted rounded-lg">
        <TabPanel value="tab1">
          <p>This is the first tab content.</p>
        </TabPanel>
        <TabPanel value="tab2">
          <p>This content is not accessible.</p>
        </TabPanel>
        <TabPanel value="tab3">
          <p>This is the third tab content.</p>
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
};

export const ControlledTabs: Story = {
  render: function ControlledExample() {
    const [activeTab, setActiveTab] = React.useState('tab1');

    return (
      <div>
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">External Controls:</p>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('tab1')}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Go to Tab 1
            </button>
            <button
              onClick={() => setActiveTab('tab2')}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Go to Tab 2
            </button>
            <button
              onClick={() => setActiveTab('tab3')}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Go to Tab 3
            </button>
          </div>
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList aria-label="Controlled tabs" className="flex gap-2">
            <Tab value="tab1">Tab 1</Tab>
            <Tab value="tab2">Tab 2</Tab>
            <Tab value="tab3">Tab 3</Tab>
          </TabList>
          <TabPanels className="mt-4 p-4 bg-muted rounded-lg">
            <TabPanel value="tab1">
              <p>Content for tab 1. Current tab: {activeTab}</p>
            </TabPanel>
            <TabPanel value="tab2">
              <p>Content for tab 2. Current tab: {activeTab}</p>
            </TabPanel>
            <TabPanel value="tab3">
              <p>Content for tab 3. Current tab: {activeTab}</p>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    );
  },
};

// @ts-ignore - React is used in the story
import React from 'react';
