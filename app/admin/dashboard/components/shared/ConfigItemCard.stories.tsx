import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConfigItemCard } from "./ConfigItemCard";

const meta: Meta<typeof ConfigItemCard> = {
  title: "Admin/ConfigItemCard",
  component: ConfigItemCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    sourceBadge: {
      control: "select",
      options: ["none", "database", "environment"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ConfigItemCard>;

// Basic config item without source badge
export const Basic: Story = {
  args: {
    label: "nodeVersion",
    value: "v18.17.0",
  },
};

// Config item with database source badge
export const DatabaseSource: Story = {
  args: {
    label: "provider",
    value: "OpenAI",
    sourceBadge: "database",
  },
};

// Config item with environment source badge
export const EnvironmentSource: Story = {
  args: {
    label: "apiKey",
    value: "sk-*********************",
    sourceBadge: "environment",
  },
};

// Config item with long value (truncated)
export const LongValue: Story = {
  args: {
    label: "baseUrl",
    value: "https://api.openai.com/v1/embeddings/very/long/path/that/should/truncate",
    truncate: true,
  },
};

// Config item with long value (not truncated)
export const LongValueNoTruncate: Story = {
  args: {
    label: "connectionString",
    value: "postgresql://user:password@localhost:5432/database?schema=public",
    truncate: false,
  },
};

// Config item without monospace font
export const NoMonospace: Story = {
  args: {
    label: "description",
    value: "This is a regular text description",
    monospace: false,
  },
};

// Config item with number value
export const NumberValue: Story = {
  args: {
    label: "maxConnections",
    value: 100,
  },
};

// Config item with boolean-like value
export const BooleanValue: Story = {
  args: {
    label: "enabled",
    value: "true",
  },
};

// Grid layout example (like in ConfigTab)
export const GridLayout: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ width: "900px" }}>
      <ConfigItemCard
        label="nodeVersion"
        value="v18.17.0"
        sourceBadge="environment"
      />
      <ConfigItemCard
        label="platform"
        value="darwin"
        sourceBadge="environment"
      />
      <ConfigItemCard
        label="arch"
        value="arm64"
        sourceBadge="environment"
      />
      <ConfigItemCard label="provider" value="OpenAI" sourceBadge="database" />
      <ConfigItemCard label="model" value="gpt-4-turbo" sourceBadge="database" />
      <ConfigItemCard label="maxTokens" value="4096" />
      <ConfigItemCard
        label="baseUrl"
        value="https://api.openai.com/v1"
        truncate={false}
      />
      <ConfigItemCard label="enabled" value="true" />
      <ConfigItemCard label="timeout" value="30000" />
    </div>
  ),
};

// All source badge variants
export const AllSourceBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <ConfigItemCard label="noSource" value="Default value" sourceBadge="none" />
      <ConfigItemCard
        label="databaseSource"
        value="Database override"
        sourceBadge="database"
      />
      <ConfigItemCard
        label="environmentSource"
        value="Environment variable"
        sourceBadge="environment"
      />
    </div>
  ),
};

// Complex value with React node
export const ComplexValue: Story = {
  args: {
    label: "status",
    value: (
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-green-500"></span>
        <span>Connected</span>
      </div>
    ),
    monospace: false,
  },
};

// CamelCase label formatting example
export const CamelCaseLabels: Story = {
  render: () => (
    <div className="space-y-4">
      <ConfigItemCard label="camelCaseLabel" value="Value 1" />
      <ConfigItemCard label="anotherCamelCase" value="Value 2" />
      <ConfigItemCard label="veryLongCamelCaseLabel" value="Value 3" />
      <ConfigItemCard label="APIKey" value="Value 4" />
    </div>
  ),
};
