import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ToggleSwitch, ToggleSwitchProps } from "./ToggleSwitch";

const meta: Meta<typeof ToggleSwitch> = {
  title: "UI/ToggleSwitch",
  component: ToggleSwitch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    checked: {
      control: "boolean",
      description: "Whether the toggle is checked",
    },
    disabled: {
      control: "boolean",
      description: "Whether the toggle is disabled",
    },
    size: {
      control: "select",
      options: ["sm", "md"],
      description: "Size of the toggle",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToggleSwitch>;

// Wrapper component to handle state in stories
function ToggleSwitchWithState(props: Omit<ToggleSwitchProps, "onChange">) {
  const [checked, setChecked] = useState(props.checked || false);

  return <ToggleSwitch {...props} checked={checked} onChange={setChecked} />;
}

/**
 * Default toggle switch - checked
 */
export const Checked: Story = {
  render: () => (
    <ToggleSwitchWithState
      label="Enable feature"
      description="Turn this feature on or off"
      checked={true}
    />
  ),
};

/**
 * Unchecked toggle switch
 */
export const Unchecked: Story = {
  render: () => (
    <ToggleSwitchWithState
      label="Enable feature"
      description="Turn this feature on or off"
      checked={false}
    />
  ),
};

/**
 * Toggle without description
 */
export const WithoutDescription: Story = {
  render: () => (
    <ToggleSwitchWithState label="Enable notifications" checked={false} />
  ),
};

/**
 * Disabled toggle (checked)
 */
export const DisabledChecked: Story = {
  render: () => (
    <ToggleSwitch
      label="Disabled feature"
      description="This feature is disabled"
      checked={true}
      onChange={() => {}}
      disabled={true}
    />
  ),
};

/**
 * Disabled toggle (unchecked)
 */
export const DisabledUnchecked: Story = {
  render: () => (
    <ToggleSwitch
      label="Disabled feature"
      description="This feature is disabled"
      checked={false}
      onChange={() => {}}
      disabled={true}
    />
  ),
};

/**
 * Small size variant
 */
export const SmallSize: Story = {
  render: () => (
    <ToggleSwitchWithState
      label="Small toggle"
      description="Smaller size for compact layouts"
      checked={false}
      size="sm"
    />
  ),
};

/**
 * Medium size variant (default)
 */
export const MediumSize: Story = {
  render: () => (
    <ToggleSwitchWithState
      label="Medium toggle"
      description="Default size for most use cases"
      checked={false}
      size="md"
    />
  ),
};

// Component for interactive example
function PreferenceSettingsExample() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "400px" }}>
      <ToggleSwitch
        label="Enable notifications"
        description="Get notified about new articles"
        checked={notifications}
        onChange={setNotifications}
      />
      <ToggleSwitch
        label="Dark mode"
        description="Use dark theme across the app"
        checked={darkMode}
        onChange={setDarkMode}
      />
      <ToggleSwitch
        label="Auto-save"
        description="Automatically save changes"
        checked={autoSave}
        onChange={setAutoSave}
      />
    </div>
  );
}

/**
 * Interactive example - common preference settings
 */
export const PreferenceSettings: Story = {
  render: () => <PreferenceSettingsExample />,
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "300px" }}>
      <ToggleSwitchWithState
        label="Small size"
        checked={true}
        size="sm"
      />
      <ToggleSwitchWithState
        label="Medium size"
        checked={true}
        size="md"
      />
    </div>
  ),
};
