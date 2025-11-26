import type { Meta, StoryObj } from "@storybook/react";
import { OverviewTab } from "./OverviewTab";
import type { AdminMetrics, CacheStats } from "@/hooks/queries/use-admin";

const meta: Meta<typeof OverviewTab> = {
  title: "Admin/Tabs/OverviewTab",
  component: OverviewTab,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof OverviewTab>;

// Mock data
const mockMetrics: AdminMetrics = {
  users: {
    total: 1247,
    active: 856,
  },
  feeds: {
    total: 342,
    active: 338,
    errorCount: 4,
  },
  articles: {
    total: 45892,
    withEmbeddings: 43201,
    recentCount: 1523,
  },
  storage: {
    postgres: {
      size: "2.4 GB",
      tables: 12,
    },
    redis: {
      keys: 8472,
      memory: "128 MB",
    },
  },
  cron: {
    lastRun: "2025-01-26T10:30:00Z",
    status: "success",
  },
};

const mockCacheStats: CacheStats = {
  hits: 124589,
  misses: 8472,
  keys: 8472,
  memory: "128 MB",
  hitRate: 93.6,
};

const mockCacheStatsLowHitRate: CacheStats = {
  hits: 5420,
  misses: 8472,
  keys: 8472,
  memory: "128 MB",
  hitRate: 39.0,
};

// Default story with healthy system
export const Default: Story = {
  args: {
    metrics: mockMetrics,
    cacheStats: mockCacheStats,
  },
};

// System with feed errors
export const WithFeedErrors: Story = {
  args: {
    metrics: {
      ...mockMetrics,
      feeds: {
        total: 342,
        active: 320,
        errorCount: 22,
      },
    },
    cacheStats: mockCacheStats,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows system with multiple feed errors (red indicator).",
      },
    },
  },
};

// Low embedding coverage
export const LowEmbeddingCoverage: Story = {
  args: {
    metrics: {
      ...mockMetrics,
      articles: {
        total: 45892,
        withEmbeddings: 12000,
        recentCount: 1523,
      },
    },
    cacheStats: mockCacheStats,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows system with low embedding coverage (~26%).",
      },
    },
  },
};

// Cache disconnected
export const CacheDisconnected: Story = {
  args: {
    metrics: mockMetrics,
    cacheStats: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows system with Redis cache disconnected.",
      },
    },
  },
};

// Low cache hit rate
export const LowCacheHitRate: Story = {
  args: {
    metrics: mockMetrics,
    cacheStats: mockCacheStatsLowHitRate,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows system with poor cache performance (39% hit rate).",
      },
    },
  },
};

// Small system (few users/feeds/articles)
export const SmallSystem: Story = {
  args: {
    metrics: {
      users: {
        total: 12,
        active: 8,
      },
      feeds: {
        total: 25,
        active: 24,
        errorCount: 1,
      },
      articles: {
        total: 1247,
        withEmbeddings: 856,
        recentCount: 42,
      },
      storage: {
        postgres: {
          size: "248 MB",
          tables: 12,
        },
        redis: {
          keys: 142,
          memory: "8 MB",
        },
      },
      cron: {
        lastRun: "2025-01-26T10:30:00Z",
        status: "success",
      },
    },
    cacheStats: {
      hits: 1247,
      misses: 356,
      keys: 142,
      memory: "8 MB",
      hitRate: 77.8,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Shows a small/new system with minimal data.",
      },
    },
  },
};

// Large system (many users/feeds/articles)
export const LargeSystem: Story = {
  args: {
    metrics: {
      users: {
        total: 58942,
        active: 42856,
      },
      feeds: {
        total: 8472,
        active: 8468,
        errorCount: 4,
      },
      articles: {
        total: 2458927,
        withEmbeddings: 2401856,
        recentCount: 45892,
      },
      storage: {
        postgres: {
          size: "124 GB",
          tables: 12,
        },
        redis: {
          keys: 458927,
          memory: "4.2 GB",
        },
      },
      cron: {
        lastRun: "2025-01-26T10:30:00Z",
        status: "success",
      },
    },
    cacheStats: {
      hits: 8458927,
      misses: 124589,
      keys: 458927,
      memory: "4.2 GB",
      hitRate: 98.5,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Shows a large production system with extensive data.",
      },
    },
  },
};

// No data (loading/empty state)
export const NoData: Story = {
  args: {
    metrics: undefined,
    cacheStats: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows empty state when no data is available (all zeros).",
      },
    },
  },
};

// Zero users (fresh install)
export const FreshInstall: Story = {
  args: {
    metrics: {
      users: {
        total: 0,
        active: 0,
      },
      feeds: {
        total: 0,
        active: 0,
        errorCount: 0,
      },
      articles: {
        total: 0,
        withEmbeddings: 0,
        recentCount: 0,
      },
      storage: {
        postgres: {
          size: "24 MB",
          tables: 12,
        },
        redis: {
          keys: 0,
          memory: "1 MB",
        },
      },
      cron: {
        status: "idle",
      },
    },
    cacheStats: {
      hits: 0,
      misses: 0,
      keys: 0,
      memory: "1 MB",
      hitRate: 0,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Shows a fresh installation with no users or data yet.",
      },
    },
  },
};
