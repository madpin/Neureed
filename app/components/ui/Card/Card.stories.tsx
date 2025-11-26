import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardHeader, CardBody, CardFooter, StatCard } from "./index";
import { Button } from "../Button";

const meta: Meta = {
  title: "UI/Card",
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;

/**
 * Basic card with header, body, and footer
 */
export const BasicCard: StoryObj = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader title="Example Card" subtitle="This is a subtitle" />
      <CardBody>
        <p className="text-foreground/70">
          This is the main content area of the card. It can contain any content you want.
        </p>
      </CardBody>
      <CardFooter>
        <Button variant="outline">Cancel</Button>
        <Button variant="primary">Save</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Card with custom header content
 */
export const CustomHeader: StoryObj = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Custom Header</h3>
            <p className="text-sm text-foreground/60">With icon and custom layout</p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-foreground/70">Content goes here.</p>
      </CardBody>
    </Card>
  ),
};

/**
 * Card with header action
 */
export const CardWithAction: StoryObj = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader
        title="Recent Activity"
        subtitle="Last 7 days"
        action={<Button size="sm" variant="outline">View All</Button>}
      />
      <CardBody>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">New user registered</span>
            <span className="text-xs text-foreground/60">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Feed updated</span>
            <span className="text-xs text-foreground/60">5 hours ago</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Article published</span>
            <span className="text-xs text-foreground/60">1 day ago</span>
          </div>
        </div>
      </CardBody>
    </Card>
  ),
};

/**
 * Card without padding for custom layouts
 */
export const NoPaddingCard: StoryObj = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader title="Users Table" />
      <CardBody padding={false}>
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="px-4 py-2">John Doe</td>
              <td className="px-4 py-2">Active</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-4 py-2">Jane Smith</td>
              <td className="px-4 py-2">Active</td>
            </tr>
          </tbody>
        </table>
      </CardBody>
    </Card>
  ),
};

/**
 * Stat card for dashboard metrics
 */
export const StatsCard: StoryObj = {
  render: () => (
    <div className="grid gap-6 md:grid-cols-3">
      <StatCard
        title="Total Users"
        value={1234}
        label="Active users"
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
        iconColor="blue"
        trend={{ value: 12, label: "vs last month", direction: "up" }}
      />
      <StatCard
        title="Total Revenue"
        value="$45,231"
        label="This month"
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        iconColor="green"
        trend={{ value: 8, label: "vs last month", direction: "up" }}
      />
      <StatCard
        title="Error Rate"
        value="2.4%"
        label="System errors"
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
        iconColor="red"
        trend={{ value: 3, label: "vs last month", direction: "down" }}
      />
    </div>
  ),
};

/**
 * Stat card with footer content
 */
export const StatCardWithFooter: StoryObj = {
  render: () => (
    <StatCard
      title="Articles"
      value={5432}
      label="Total articles"
      icon={
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      iconColor="purple"
      footer={
        <div className="flex justify-between text-sm">
          <span className="text-foreground/70">With Embeddings</span>
          <span className="font-medium text-foreground">4521</span>
        </div>
      }
    />
  ),
};

/**
 * Card shadow variants
 */
export const ShadowVariants: StoryObj = {
  render: () => (
    <div className="grid gap-6 md:grid-cols-4">
      <Card shadow="none" padding className="max-w-xs">
        <h3 className="font-semibold mb-2">No Shadow</h3>
        <p className="text-sm text-foreground/70">Flat appearance</p>
      </Card>
      <Card shadow="sm" padding className="max-w-xs">
        <h3 className="font-semibold mb-2">Small Shadow</h3>
        <p className="text-sm text-foreground/70">Subtle elevation</p>
      </Card>
      <Card shadow="md" padding className="max-w-xs">
        <h3 className="font-semibold mb-2">Medium Shadow</h3>
        <p className="text-sm text-foreground/70">Moderate elevation</p>
      </Card>
      <Card shadow="lg" padding className="max-w-xs">
        <h3 className="font-semibold mb-2">Large Shadow</h3>
        <p className="text-sm text-foreground/70">High elevation</p>
      </Card>
    </div>
  ),
};

/**
 * Clickable card with hover effect
 */
export const ClickableCard: StoryObj = {
  render: () => (
    <div className="grid gap-6 md:grid-cols-3">
      <Card hover onClick={() => alert("Card 1 clicked")} className="max-w-xs">
        <CardHeader title="Clickable Card 1" />
        <CardBody>
          <p className="text-sm text-foreground/70">Click me to see an alert</p>
        </CardBody>
      </Card>
      <Card hover onClick={() => alert("Card 2 clicked")} className="max-w-xs">
        <CardHeader title="Clickable Card 2" />
        <CardBody>
          <p className="text-sm text-foreground/70">I have a hover effect</p>
        </CardBody>
      </Card>
      <Card hover onClick={() => alert("Card 3 clicked")} className="max-w-xs">
        <CardHeader title="Clickable Card 3" />
        <CardBody>
          <p className="text-sm text-foreground/70">Hover and click to interact</p>
        </CardBody>
      </Card>
    </div>
  ),
};

/**
 * Card with scrollable content
 */
export const ScrollableCard: StoryObj = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader title="Long Content" subtitle="Scrollable body" />
      <CardBody scrollable className="max-h-64">
        <div className="space-y-4">
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i} className="text-sm text-foreground/70">
              This is paragraph {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
          ))}
        </div>
      </CardBody>
    </Card>
  ),
};

/**
 * Footer alignment variants
 */
export const FooterAlignment: StoryObj = {
  render: () => (
    <div className="grid gap-6">
      <Card className="max-w-md">
        <CardHeader title="Left Aligned Footer" />
        <CardBody>
          <p className="text-sm text-foreground/70">Footer buttons aligned to the left</p>
        </CardBody>
        <CardFooter align="left">
          <Button size="sm" variant="outline">Cancel</Button>
          <Button size="sm" variant="primary">Save</Button>
        </CardFooter>
      </Card>
      <Card className="max-w-md">
        <CardHeader title="Space Between Footer" />
        <CardBody>
          <p className="text-sm text-foreground/70">Footer with space between elements</p>
        </CardBody>
        <CardFooter align="between">
          <Button size="sm" variant="danger">Delete</Button>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">Cancel</Button>
            <Button size="sm" variant="primary">Save</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  ),
};

/**
 * Complex dashboard layout example
 */
export const DashboardLayout: StoryObj = {
  render: () => (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard
          title="Users"
          value={1234}
          label="Total users"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          iconColor="blue"
        />
        <StatCard
          title="Articles"
          value={5432}
          label="Published"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          iconColor="purple"
        />
        <StatCard
          title="Feeds"
          value={89}
          label="Active feeds"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          }
          iconColor="green"
        />
        <StatCard
          title="Errors"
          value={12}
          label="Last 24h"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          iconColor="red"
        />
      </div>

      {/* Content Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent Activity"
            subtitle="Last 7 days"
            action={<Button size="sm" variant="outline">View All</Button>}
          />
          <CardBody>
            <div className="space-y-3">
              {["New user registered", "Feed updated", "Article published", "Settings changed"].map((activity, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{activity}</span>
                  <span className="text-xs text-foreground/60">{i + 1}h ago</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="System Status" />
          <CardBody>
            <div className="space-y-3">
              {[
                { label: "Database", status: "healthy", color: "green" },
                { label: "Cache", status: "healthy", color: "green" },
                { label: "API", status: "healthy", color: "green" },
                { label: "Jobs", status: "running", color: "blue" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded bg-${item.color}-100 text-${item.color}-800 dark:bg-${item.color}-900/30 dark:text-${item.color}-400`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  ),
};
