import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FeedManagementModal } from '@/app/components/feeds/FeedManagementModal';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock React Query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
    }),
  };
});

// Mock category hooks
vi.mock('@/hooks/queries/use-categories', () => ({
  useCategories: () => ({
    data: [],
    isLoading: false,
  }),
  useCreateCategory: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteCategory: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useCategorySettings: () => ({
    data: null,
    isLoading: false,
  }),
  useUpdateCategorySettings: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// Mock feed hooks
vi.mock('@/hooks/queries/use-feeds', () => ({
  useUserFeeds: () => ({
    data: [],
    isLoading: false,
  }),
  useFeed: () => ({
    data: null,
    isLoading: false,
  }),
  useUpdateFeedSettings: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useRefreshFeed: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUnsubscribeFeed: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteFeed: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useBulkUpdateFeedSettings: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useFeedSummarizationSettings: () => ({
    data: null,
    isLoading: false,
  }),
  useUpdateFeedSummarizationSettings: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useClearFeedSummarizationSettings: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useRefreshLastArticles: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('FeedManagementModal - Baseline Snapshot', () => {
  const mockOnClose = vi.fn();

  it('renders without crashing - overview view', () => {
    const { container } = render(
      <FeedManagementModal onClose={mockOnClose} initialView="overview" />
    );

    expect(container).toBeTruthy();
  });

  it('matches snapshot - overview view', () => {
    const { container } = render(
      <FeedManagementModal onClose={mockOnClose} initialView="overview" />
    );

    expect(container).toMatchSnapshot();
  });
});
