import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchTab } from "./SearchTab";
import type { EmbeddingStats, EmbeddingConfig } from "@/hooks/queries/use-admin";

const meta: Meta<typeof SearchTab> = {
  title: "Admin/Tabs/SearchTab",
  component: SearchTab,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SearchTab>;

// Mock data
const mockEmbeddingStatsHighCoverage: EmbeddingStats = {
  total: 45892,
  withEmbeddings: 43201,
  withoutEmbeddings: 2691,
  percentage: 94.1,
};

const mockEmbeddingStatsLowCoverage: EmbeddingStats = {
  total: 45892,
  withEmbeddings: 12000,
  withoutEmbeddings: 33892,
  percentage: 26.1,
};

const mockEmbeddingConfigOpenAI: EmbeddingConfig = {
  provider: "openai",
  model: "text-embedding-3-small",
  dimensions: 1536,
  enabled: true,
};

const mockEmbeddingConfigLocal: EmbeddingConfig = {
  provider: "local",
  model: "BAAI/bge-small-en-v1.5",
  dimensions: 384,
  enabled: true,
};

const mockEmbeddingConfigDisabled: EmbeddingConfig = {
  provider: "openai",
  model: "text-embedding-3-small",
  dimensions: 1536,
  enabled: false,
};

// Default story with OpenAI and high coverage
export const Default: Story = {
  args: {
    embeddingStats: mockEmbeddingStatsHighCoverage,
    embeddingConfig: mockEmbeddingConfigOpenAI,
  },
};

// High coverage with OpenAI
export const HighCoverageOpenAI: Story = {
  args: {
    embeddingStats: mockEmbeddingStatsHighCoverage,
    embeddingConfig: mockEmbeddingConfigOpenAI,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows system with high embedding coverage (94.1%) using OpenAI.",
      },
    },
  },
};

// Low coverage with OpenAI
export const LowCoverageOpenAI: Story = {
  args: {
    embeddingStats: mockEmbeddingStatsLowCoverage,
    embeddingConfig: mockEmbeddingConfigOpenAI,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows system with low embedding coverage (26.1%) - needs generation.",
      },
    },
  },
};

// Local model configuration
export const LocalModel: Story = {
  args: {
    embeddingStats: mockEmbeddingStatsHighCoverage,
    embeddingConfig: mockEmbeddingConfigLocal,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows system using local embedding model (BAAI/bge-small-en-v1.5).",
      },
    },
  },
};

// Auto-generation disabled
export const AutoGenerationDisabled: Story = {
  args: {
    embeddingStats: mockEmbeddingStatsLowCoverage,
    embeddingConfig: mockEmbeddingConfigDisabled,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows system with auto-generation disabled (manual embedding generation required).",
      },
    },
  },
};

// Complete coverage (100%)
export const CompleteCoverage: Story = {
  args: {
    embeddingStats: {
      total: 45892,
      withEmbeddings: 45892,
      withoutEmbeddings: 0,
      percentage: 100.0,
    },
    embeddingConfig: mockEmbeddingConfigOpenAI,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows system with complete embedding coverage (100%).",
      },
    },
  },
};

// No embeddings yet
export const NoEmbeddings: Story = {
  args: {
    embeddingStats: {
      total: 45892,
      withEmbeddings: 0,
      withoutEmbeddings: 45892,
      percentage: 0.0,
    },
    embeddingConfig: mockEmbeddingConfigOpenAI,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows system with no embeddings generated yet (0% coverage).",
      },
    },
  },
};

// Small dataset
export const SmallDataset: Story = {
  args: {
    embeddingStats: {
      total: 247,
      withEmbeddings: 189,
      withoutEmbeddings: 58,
      percentage: 76.5,
    },
    embeddingConfig: mockEmbeddingConfigLocal,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows a small dataset with moderate coverage.",
      },
    },
  },
};

// Large dataset
export const LargeDataset: Story = {
  args: {
    embeddingStats: {
      total: 2458927,
      withEmbeddings: 2401856,
      withoutEmbeddings: 57071,
      percentage: 97.7,
    },
    embeddingConfig: mockEmbeddingConfigOpenAI,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows a large production dataset with high coverage.",
      },
    },
  },
};

// No data available
export const NoData: Story = {
  args: {
    embeddingStats: undefined,
    embeddingConfig: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows empty state when no data is available.",
      },
    },
  },
};

// Fresh installation
export const FreshInstall: Story = {
  args: {
    embeddingStats: {
      total: 0,
      withEmbeddings: 0,
      withoutEmbeddings: 0,
      percentage: 0.0,
    },
    embeddingConfig: mockEmbeddingConfigOpenAI,
  },
  parameters: {
    docs: {
      description: {
        story: "Shows a fresh installation with no articles yet.",
      },
    },
  },
};

// Different model variants
export const OpenAILargeModel: Story = {
  args: {
    embeddingStats: mockEmbeddingStatsHighCoverage,
    embeddingConfig: {
      provider: "openai",
      model: "text-embedding-3-large",
      dimensions: 3072,
      enabled: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Shows system using OpenAI's large embedding model (3072 dimensions).",
      },
    },
  },
};

export const CustomLocalModel: Story = {
  args: {
    embeddingStats: mockEmbeddingStatsHighCoverage,
    embeddingConfig: {
      provider: "local",
      model: "sentence-transformers/all-MiniLM-L6-v2",
      dimensions: 384,
      enabled: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Shows system using a different local model (sentence-transformers).",
      },
    },
  },
};
