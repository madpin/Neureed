import type { Meta, StoryObj } from "@storybook/react";
import { QuickActionsBar } from "./QuickActionsBar";

const meta: Meta<typeof QuickActionsBar> = {
  title: "Admin/QuickActionsBar",
  component: QuickActionsBar,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    onRefreshFeeds: () => console.log("Refresh feeds"),
    onGenerateEmbeddings: () => console.log("Generate embeddings"),
    onCleanup: () => console.log("Cleanup"),
    onClearCache: () => console.log("Clear cache"),
  },
};

export default meta;
type Story = StoryObj<typeof QuickActionsBar>;

// Default state (no loading)
export const Default: Story = {
  args: {
    loading: {
      refreshFeeds: false,
      embeddings: false,
      cleanup: false,
      cache: false,
    },
  },
};

// Refresh Feeds loading
export const RefreshingFeeds: Story = {
  args: {
    loading: {
      refreshFeeds: true,
      embeddings: false,
      cleanup: false,
      cache: false,
    },
  },
};

// Generating Embeddings loading
export const GeneratingEmbeddings: Story = {
  args: {
    loading: {
      refreshFeeds: false,
      embeddings: true,
      cleanup: false,
      cache: false,
    },
  },
};

// Cleanup loading
export const CleanupRunning: Story = {
  args: {
    loading: {
      refreshFeeds: false,
      embeddings: false,
      cleanup: true,
      cache: false,
    },
  },
};

// Clear cache loading
export const ClearingCache: Story = {
  args: {
    loading: {
      refreshFeeds: false,
      embeddings: false,
      cleanup: false,
      cache: true,
    },
  },
};

// Multiple actions loading
export const MultipleLoading: Story = {
  args: {
    loading: {
      refreshFeeds: true,
      embeddings: true,
      cleanup: false,
      cache: false,
    },
  },
};

// All actions loading
export const AllLoading: Story = {
  args: {
    loading: {
      refreshFeeds: true,
      embeddings: true,
      cleanup: true,
      cache: true,
    },
  },
};

// Interactive demo with console logging
export const Interactive: Story = {
  args: {
    onRefreshFeeds: async () => {
      console.log("Refreshing feeds...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Feeds refreshed!");
    },
    onGenerateEmbeddings: async () => {
      console.log("Generating embeddings...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Embeddings generated!");
    },
    onCleanup: async () => {
      console.log("Running cleanup...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Cleanup complete!");
    },
    onClearCache: async () => {
      console.log("Clearing cache...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Cache cleared!");
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Try clicking the buttons! Cleanup and Clear Cache require two clicks for confirmation. Check the console for logs.",
      },
    },
  },
};

// Mobile view
export const MobileView: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
    docs: {
      description: {
        story: "On mobile, buttons stack vertically and take full width.",
      },
    },
  },
};
