import type { Meta, StoryObj } from "@storybook/react";
import { LoadingSpinner } from "./LoadingSpinner";

const meta: Meta<typeof LoadingSpinner> = {
  title: "UI/LoadingSpinner",
  component: LoadingSpinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description: "Size variant of the spinner",
    },
    color: {
      control: "select",
      options: ["primary", "secondary", "white"],
      description: "Color variant of the spinner",
    },
    mode: {
      control: "select",
      options: ["inline", "fullscreen", "overlay"],
      description: "Display mode of the spinner",
    },
    label: {
      control: "text",
      description: "Optional text label below spinner",
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingSpinner>;

/**
 * Default inline spinner with medium size and primary color
 */
export const Default: Story = {
  args: {},
};

/**
 * Extra small spinner - perfect for inline buttons or compact UI
 */
export const ExtraSmall: Story = {
  args: {
    size: "xs",
  },
};

/**
 * Small spinner - good for inline usage
 */
export const Small: Story = {
  args: {
    size: "sm",
  },
};

/**
 * Large spinner - for major loading operations
 */
export const Large: Story = {
  args: {
    size: "lg",
  },
};

/**
 * Spinner with label text
 */
export const WithLabel: Story = {
  args: {
    label: "Loading...",
  },
};

/**
 * Spinner with longer label text
 */
export const WithLongLabel: Story = {
  args: {
    size: "lg",
    label: "Fetching your data, please wait...",
  },
};

/**
 * Secondary color variant
 */
export const SecondaryColor: Story = {
  args: {
    color: "secondary",
    label: "Processing...",
  },
};

/**
 * White color variant (view on dark background)
 */
export const WhiteColor: Story = {
  args: {
    color: "white",
    label: "Loading...",
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
};

/**
 * Fullscreen loading mode - takes over entire screen
 */
export const Fullscreen: Story = {
  args: {
    mode: "fullscreen",
    size: "lg",
    label: "Loading application...",
  },
  parameters: {
    layout: "fullscreen",
  },
};

/**
 * Overlay mode - shows over content with backdrop
 */
export const Overlay: Story = {
  args: {
    mode: "overlay",
    size: "lg",
    label: "Saving changes...",
  },
  parameters: {
    layout: "fullscreen",
  },
};

/**
 * All size variants displayed together
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="xs" />
        <span className="text-xs text-gray-500">xs</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="sm" />
        <span className="text-xs text-gray-500">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="md" />
        <span className="text-xs text-gray-500">md</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="lg" />
        <span className="text-xs text-gray-500">lg</span>
      </div>
    </div>
  ),
};

/**
 * All color variants displayed together
 */
export const AllColors: Story = {
  render: () => (
    <div className="flex gap-8">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner color="primary" />
        <span className="text-xs text-gray-500">primary</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner color="secondary" />
        <span className="text-xs text-gray-500">secondary</span>
      </div>
      <div className="flex flex-col items-center gap-2 rounded bg-gray-800 p-4">
        <LoadingSpinner color="white" />
        <span className="text-xs text-white">white</span>
      </div>
    </div>
  ),
};

/**
 * Inline spinner in a button (common use case)
 */
export const InlineButton: Story = {
  render: () => (
    <button
      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white"
      disabled
    >
      <LoadingSpinner size="xs" color="white" />
      <span>Loading...</span>
    </button>
  ),
};

/**
 * Spinner in a card
 */
export const InCard: Story = {
  render: () => (
    <div className="w-96 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col items-center justify-center py-8">
        <LoadingSpinner size="lg" label="Loading content..." />
      </div>
    </div>
  ),
};
