import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tooltip } from "./Tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    position: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
      description: "Position of the tooltip",
    },
    usePortal: {
      control: "boolean",
      description: "Use portal-based rendering for overflow cases",
    },
    delay: {
      control: "number",
      description: "Delay in milliseconds before showing",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

/**
 * Tooltip on top position (default)
 */
export const Top: Story = {
  render: () => (
    <Tooltip content="This is a helpful tooltip" position="top">
      <button className="btn btn-primary">Hover me</button>
    </Tooltip>
  ),
};

/**
 * Tooltip on bottom position
 */
export const Bottom: Story = {
  render: () => (
    <Tooltip content="Tooltip on the bottom" position="bottom">
      <button className="btn btn-secondary">Hover me</button>
    </Tooltip>
  ),
};

/**
 * Tooltip on left position
 */
export const Left: Story = {
  render: () => (
    <Tooltip content="Tooltip on the left" position="left">
      <button className="btn btn-outline">Hover me</button>
    </Tooltip>
  ),
};

/**
 * Tooltip on right position
 */
export const Right: Story = {
  render: () => (
    <Tooltip content="Tooltip on the right" position="right">
      <button className="btn btn-ghost">Hover me</button>
    </Tooltip>
  ),
};

/**
 * Tooltip with portal rendering (for overflow cases)
 */
export const WithPortal: Story = {
  render: () => (
    <div style={{ overflow: "hidden", padding: "20px", border: "1px solid #ccc" }}>
      <p style={{ marginBottom: "10px", fontSize: "12px", color: "#666" }}>
        Portal-based tooltip won&apos;t be clipped by overflow:hidden
      </p>
      <Tooltip content="Portal tooltip" position="top" usePortal>
        <button className="btn btn-primary">Hover me</button>
      </Tooltip>
    </div>
  ),
};

/**
 * Tooltip with custom delay
 */
export const WithDelay: Story = {
  render: () => (
    <Tooltip content="This tooltip has a 1s delay" position="top" delay={1000}>
      <button className="btn btn-secondary">Hover me (wait 1s)</button>
    </Tooltip>
  ),
};

/**
 * Tooltip with icon button
 */
export const WithIconButton: Story = {
  render: () => (
    <Tooltip content="Edit item" position="top">
      <button className="btn btn-ghost" style={{ padding: "0.5rem" }}>
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>
    </Tooltip>
  ),
};

/**
 * All positions comparison
 */
export const AllPositions: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "2rem",
        padding: "4rem",
      }}
    >
      <Tooltip content="Top position" position="top">
        <button className="btn btn-primary">Top</button>
      </Tooltip>
      <Tooltip content="Bottom position" position="bottom">
        <button className="btn btn-primary">Bottom</button>
      </Tooltip>
      <Tooltip content="Left position" position="left">
        <button className="btn btn-primary">Left</button>
      </Tooltip>
      <Tooltip content="Right position" position="right">
        <button className="btn btn-primary">Right</button>
      </Tooltip>
    </div>
  ),
};

/**
 * Tooltips on different elements
 */
export const DifferentElements: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "flex-start" }}>
      <Tooltip content="This is a button">
        <button className="btn btn-primary">Button</button>
      </Tooltip>

      <Tooltip content="This is a link">
        <a href="#" className="text-primary hover:underline">
          Link with tooltip
        </a>
      </Tooltip>

      <Tooltip content="This is an icon">
        <svg
          className="h-6 w-6 cursor-help"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </Tooltip>

      <Tooltip content="This is some text">
        <span className="cursor-help text-foreground/70">
          Hover over this text
        </span>
      </Tooltip>
    </div>
  ),
};
