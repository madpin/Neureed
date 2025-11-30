import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmptyState } from "./EmptyState";
import {
  Inbox,
  Search,
  FileText,
  Plus,
  Folder,
  Archive,
  Database,
  Users,
} from "lucide-react";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Main title text",
    },
    description: {
      control: "text",
      description: "Optional description text",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

/**
 * Basic empty state with icon and title
 */
export const Default: Story = {
  args: {
    icon: Inbox,
    title: "No items found",
  },
};

/**
 * Empty state with description
 */
export const WithDescription: Story = {
  args: {
    icon: FileText,
    title: "No articles yet",
    description: "Articles from your RSS feeds will appear here once you add some feeds.",
  },
};

/**
 * Empty state with action button
 */
export const WithAction: Story = {
  args: {
    icon: Plus,
    title: "No feeds yet",
    description: "Get started by adding your first RSS feed.",
    action: {
      label: "Add Feed",
      onClick: () => alert("Add feed clicked"),
    },
  },
};

/**
 * Empty state with secondary button
 */
export const WithSecondaryAction: Story = {
  args: {
    icon: Search,
    title: "No search results",
    description: "Try adjusting your search query or filters.",
    action: {
      label: "Clear Filters",
      onClick: () => alert("Clear filters clicked"),
      variant: "secondary",
    },
  },
};

/**
 * Empty state with outline button
 */
export const WithOutlineAction: Story = {
  args: {
    icon: Archive,
    title: "Archive is empty",
    description: "Archived items will be stored here.",
    action: {
      label: "Learn More",
      onClick: () => alert("Learn more clicked"),
      variant: "outline",
    },
  },
};

/**
 * Small size variant
 */
export const Small: Story = {
  args: {
    icon: Folder,
    title: "Empty folder",
    description: "This folder contains no items.",
    size: "sm",
  },
};

/**
 * Large size variant
 */
export const Large: Story = {
  args: {
    icon: Database,
    title: "No data available",
    description: "Connect your data source to see content here.",
    size: "lg",
    action: {
      label: "Connect Source",
      onClick: () => alert("Connect clicked"),
    },
  },
};

/**
 * With custom illustration instead of icon
 */
export const WithIllustration: Story = {
  args: {
    illustration: (
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="60" cy="60" r="50" fill="#E5E7EB" />
        <circle cx="60" cy="60" r="30" fill="#9CA3AF" />
        <circle cx="60" cy="60" r="15" fill="#6B7280" />
      </svg>
    ),
    title: "No data to visualize",
    description: "Add some data points to see your visualization.",
    action: {
      label: "Add Data",
      onClick: () => alert("Add data clicked"),
    },
  },
};

/**
 * No messages - common use case
 */
export const NoMessages: Story = {
  args: {
    icon: Inbox,
    title: "No messages",
    description: "When you receive messages, they'll appear here.",
  },
};

/**
 * No search results - common use case
 */
export const NoSearchResults: Story = {
  args: {
    icon: Search,
    title: "No results found",
    description: 'We couldn\'t find any results for your search. Try different keywords.',
  },
};

/**
 * No content - common use case
 */
export const NoContent: Story = {
  args: {
    icon: FileText,
    title: "No content yet",
    description: "Create your first post to get started.",
    action: {
      label: "Create Post",
      onClick: () => alert("Create post clicked"),
    },
  },
};

/**
 * No users - common use case
 */
export const NoUsers: Story = {
  args: {
    icon: Users,
    title: "No users found",
    description: "Invite team members to collaborate on this project.",
    action: {
      label: "Invite Users",
      onClick: () => alert("Invite clicked"),
    },
  },
};

/**
 * All size variants comparison
 */
export const AllSizes: Story = {
  render: () => (
    <div className="grid gap-8">
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <EmptyState
          icon={Inbox}
          title="Small size"
          description="This is a small empty state."
          size="sm"
        />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <EmptyState
          icon={Inbox}
          title="Medium size"
          description="This is a medium empty state (default)."
          size="md"
        />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <EmptyState
          icon={Inbox}
          title="Large size"
          description="This is a large empty state for prominent displays."
          size="lg"
        />
      </div>
    </div>
  ),
  decorators: [],
};

/**
 * Without icon or illustration
 */
export const NoIcon: Story = {
  args: {
    title: "Simple empty state",
    description: "Sometimes you don't need an icon.",
  },
};
