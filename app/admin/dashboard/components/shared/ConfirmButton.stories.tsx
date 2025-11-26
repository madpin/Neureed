import type { Meta, StoryObj } from "@storybook/react";
import { ConfirmButton } from "./ConfirmButton";

// Sample icon
const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const meta: Meta<typeof ConfirmButton> = {
  title: "Admin/ConfirmButton",
  component: ConfirmButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger", "warning"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    confirmTimeout: {
      control: { type: "number", min: 1000, max: 10000, step: 1000 },
    },
  },
  args: {
    onConfirm: () => console.log("Action confirmed"),
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmButton>;

// Default danger button
export const Danger: Story = {
  args: {
    children: "Delete User",
    confirmText: "Delete User?",
    warningDescription: "This action cannot be undone. Click again to confirm.",
    variant: "danger",
  },
};

// Warning variant
export const Warning: Story = {
  args: {
    children: "Clear Cache",
    confirmText: "Clear all cache?",
    warningDescription: "Click the button again to confirm. This will remove all cached data.",
    variant: "warning",
    confirmTimeout: 5000,
  },
};

// Primary variant
export const Primary: Story = {
  args: {
    children: "Run Cleanup",
    confirmText: "Run cleanup?",
    warningDescription: "Click again to confirm. This will remove articles older than 90 days.",
    variant: "primary",
  },
};

// With icon
export const WithIcon: Story = {
  args: {
    children: "Delete",
    confirmText: "Delete this item?",
    warningDescription: "This action is permanent.",
    variant: "danger",
    icon: <TrashIcon />,
  },
};

// Small size
export const SmallSize: Story = {
  args: {
    children: "Delete",
    confirmText: "Delete?",
    variant: "danger",
    size: "sm",
  },
};

// Large size
export const LargeSize: Story = {
  args: {
    children: "Reset Database",
    confirmText: "⚠️ DANGER: Reset Database?",
    warningDescription:
      "This will PERMANENTLY DELETE all feeds, articles, categories, and embeddings. Click again within 10 seconds to confirm.",
    variant: "danger",
    size: "lg",
    confirmTimeout: 10000,
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    children: "Delete",
    confirmText: "Delete?",
    variant: "danger",
    disabled: true,
  },
};

// Loading state
export const Loading: Story = {
  args: {
    children: "Delete",
    confirmText: "Delete?",
    variant: "danger",
    loading: true,
  },
};

// Different timeout durations
export const ShortTimeout: Story = {
  args: {
    children: "Quick Action",
    confirmText: "Confirm action?",
    warningDescription: "You have 2 seconds to confirm.",
    variant: "primary",
    confirmTimeout: 2000,
  },
  parameters: {
    docs: {
      description: {
        story: "Confirmation window expires after 2 seconds.",
      },
    },
  },
};

export const LongTimeout: Story = {
  args: {
    children: "Dangerous Action",
    confirmText: "⚠️ Are you absolutely sure?",
    warningDescription: "You have 10 seconds to confirm this dangerous action.",
    variant: "danger",
    confirmTimeout: 10000,
  },
  parameters: {
    docs: {
      description: {
        story: "Confirmation window expires after 10 seconds for dangerous actions.",
      },
    },
  },
};

// Interactive demo
export const InteractiveDemo: Story = {
  args: {
    children: "Try Two-Click Confirmation",
    confirmText: "Are you sure?",
    warningDescription: "Click again within 5 seconds to confirm. Watch the toast!",
    variant: "warning",
    onConfirm: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Action confirmed and executed!");
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Click the button once to see the warning toast. Then click again within 5 seconds to execute the action.",
      },
    },
  },
};

// Grid of variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ConfirmButton
        confirmText="Primary action?"
        variant="primary"
        onConfirm={async () => console.log("Primary confirmed")}
      >
        Primary
      </ConfirmButton>
      <ConfirmButton
        confirmText="Secondary action?"
        variant="secondary"
        onConfirm={async () => console.log("Secondary confirmed")}
      >
        Secondary
      </ConfirmButton>
      <ConfirmButton
        confirmText="Warning action?"
        variant="warning"
        onConfirm={async () => console.log("Warning confirmed")}
      >
        Warning
      </ConfirmButton>
      <ConfirmButton
        confirmText="Delete?"
        variant="danger"
        warningDescription="This action is permanent."
        onConfirm={async () => console.log("Danger confirmed")}
      >
        Danger
      </ConfirmButton>
    </div>
  ),
};
