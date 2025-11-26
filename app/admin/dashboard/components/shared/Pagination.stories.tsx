import type { Meta, StoryObj } from "@storybook/react";
import { Pagination } from "./Pagination";
import { fn } from "@storybook/test";
import { useState } from "react";

const meta: Meta<typeof Pagination> = {
  title: "Admin/Pagination",
  component: Pagination,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    onPageChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

// Default pagination
export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
    totalItems: 247,
    itemsPerPage: 25,
    itemLabel: "users",
  },
};

// First page
export const FirstPage: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
    totalItems: 247,
    itemsPerPage: 25,
    itemLabel: "users",
  },
};

// Middle page
export const MiddlePage: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    totalItems: 247,
    itemsPerPage: 25,
    itemLabel: "items",
  },
};

// Last page
export const LastPage: Story = {
  args: {
    currentPage: 10,
    totalPages: 10,
    totalItems: 247,
    itemsPerPage: 25,
    itemLabel: "articles",
  },
};

// Few pages (all buttons visible)
export const FewPages: Story = {
  args: {
    currentPage: 2,
    totalPages: 3,
    totalItems: 67,
    itemsPerPage: 25,
    itemLabel: "feeds",
  },
};

// Many pages
export const ManyPages: Story = {
  args: {
    currentPage: 15,
    totalPages: 50,
    totalItems: 1247,
    itemsPerPage: 25,
    itemLabel: "results",
  },
};

// Single page (hidden)
export const SinglePage: Story = {
  args: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 12,
    itemsPerPage: 25,
    itemLabel: "items",
  },
  parameters: {
    docs: {
      description: {
        story: "Pagination is hidden when there's only one page.",
      },
    },
  },
};

// Near end
export const NearEnd: Story = {
  args: {
    currentPage: 48,
    totalPages: 50,
    totalItems: 1247,
    itemsPerPage: 25,
    itemLabel: "records",
  },
};

// Large dataset
export const LargeDataset: Story = {
  args: {
    currentPage: 42,
    totalPages: 100,
    totalItems: 2497,
    itemsPerPage: 25,
    itemLabel: "entries",
  },
};

// Interactive demo
export const Interactive: Story = {
  render: () => {
    const [page, setPage] = useState(1);

    return (
      <div className="space-y-4">
        <div className="text-sm text-foreground/60">
          Click the page buttons to navigate
        </div>
        <Pagination
          currentPage={page}
          totalPages={10}
          totalItems={247}
          itemsPerPage={25}
          onPageChange={setPage}
          itemLabel="users"
        />
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="text-sm text-foreground">
            Current page: <span className="font-bold">{page}</span>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive pagination demo - click buttons to change pages.",
      },
    },
  },
};
