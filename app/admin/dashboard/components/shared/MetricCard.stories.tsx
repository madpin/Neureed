import type { Meta, StoryObj } from "@storybook/react";
import { MetricCard } from "./MetricCard";

// Sample icons for the stories
const UsersIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-full w-full">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const FeedIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-full w-full">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"
    />
  </svg>
);

const ArticleIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-full w-full">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
    />
  </svg>
);

const meta: Meta<typeof MetricCard> = {
  title: "Admin/MetricCard",
  component: MetricCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    iconColor: {
      control: "select",
      options: ["blue", "green", "purple", "orange", "red"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[350px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MetricCard>;

// Basic metric card with footer
export const Users: Story = {
  args: {
    title: "Users",
    value: 150,
    subtitle: "Total Registered Users",
    icon: <UsersIcon />,
    iconColor: "blue",
    footer: {
      label: "Active (30d)",
      value: 45,
    },
  },
};

// Metric card with green icon color
export const Feeds: Story = {
  args: {
    title: "Feeds",
    value: 23,
    subtitle: "Total Feeds",
    icon: <FeedIcon />,
    iconColor: "green",
    footer: {
      label: "With Errors",
      value: 2,
      valueClassName: "font-medium text-red-500",
    },
  },
};

// Metric card with purple icon color
export const Articles: Story = {
  args: {
    title: "Articles",
    value: "12.5K",
    subtitle: "Total Articles",
    icon: <ArticleIcon />,
    iconColor: "purple",
    footer: {
      label: "With Embeddings",
      value: "8.2K",
    },
  },
};

// Metric card without footer
export const NoFooter: Story = {
  args: {
    title: "Storage",
    value: "2.4 GB",
    subtitle: "Database Size",
    icon: <ArticleIcon />,
    iconColor: "orange",
  },
};

// Metric card with badge
export const WithGreenBadge: Story = {
  args: {
    title: "Cache",
    value: "Connected",
    subtitle: "Redis Status",
    icon: <FeedIcon />,
    iconColor: "green",
    badge: {
      label: "Active",
      color: "green",
    },
    footer: {
      label: "Hit Rate",
      value: "98.5%",
    },
  },
};

// Metric card with red badge
export const WithRedBadge: Story = {
  args: {
    title: "Cache",
    value: "Disconnected",
    subtitle: "Redis Status",
    icon: <FeedIcon />,
    iconColor: "red",
    badge: {
      label: "Error",
      color: "red",
    },
  },
};

// Metric card with yellow badge
export const WithYellowBadge: Story = {
  args: {
    title: "System",
    value: "Pending",
    subtitle: "Update Status",
    icon: <ArticleIcon />,
    iconColor: "orange",
    badge: {
      label: "Warning",
      color: "yellow",
    },
  },
};

// All icon colors demonstration
export const AllIconColors: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Blue"
        value={100}
        subtitle="Blue Icon Color"
        icon={<UsersIcon />}
        iconColor="blue"
      />
      <MetricCard
        title="Green"
        value={100}
        subtitle="Green Icon Color"
        icon={<FeedIcon />}
        iconColor="green"
      />
      <MetricCard
        title="Purple"
        value={100}
        subtitle="Purple Icon Color"
        icon={<ArticleIcon />}
        iconColor="purple"
      />
      <MetricCard
        title="Orange"
        value={100}
        subtitle="Orange Icon Color"
        icon={<UsersIcon />}
        iconColor="orange"
      />
      <MetricCard
        title="Red"
        value={100}
        subtitle="Red Icon Color"
        icon={<FeedIcon />}
        iconColor="red"
      />
    </div>
  ),
};

// Grid layout example (like in dashboard)
export const DashboardGrid: Story = {
  render: () => (
    <div className="grid gap-6 md:grid-cols-3" style={{ width: "900px" }}>
      <MetricCard
        title="Users"
        value={150}
        subtitle="Total Registered Users"
        icon={<UsersIcon />}
        iconColor="blue"
        footer={{ label: "Active (30d)", value: 45 }}
      />
      <MetricCard
        title="Feeds"
        value={23}
        subtitle="Total Feeds"
        icon={<FeedIcon />}
        iconColor="green"
        footer={{
          label: "With Errors",
          value: 2,
          valueClassName: "font-medium text-red-500",
        }}
      />
      <MetricCard
        title="Articles"
        value="12.5K"
        subtitle="Total Articles"
        icon={<ArticleIcon />}
        iconColor="purple"
        footer={{ label: "With Embeddings", value: "8.2K" }}
      />
    </div>
  ),
};
