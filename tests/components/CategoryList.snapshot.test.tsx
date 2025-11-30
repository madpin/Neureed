import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CategoryList } from '@/app/components/feeds/CategoryList';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock feed hooks
vi.mock('@/hooks/queries/use-feeds', () => ({
  useGroupedFeeds: () => ({
    data: {
      categories: [],
      uncategorized: [],
    },
    isLoading: false,
  }),
  useRefreshFeed: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUnsubscribeFeed: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useRemoveFeedFromCategories: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// Mock category hooks
vi.mock('@/hooks/queries/use-categories', () => ({
  useCategoryStates: () => ({
    data: {},
    isLoading: false,
  }),
  useUpdateCategoryState: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdateCategory: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteCategory: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useReorderCategories: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useAssignFeedsToCategory: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('CategoryList - Baseline Snapshot', () => {
  it('renders without crashing - empty state', () => {
    const { container } = render(
      <CategoryList />
    );

    expect(container).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { container } = render(
      <CategoryList
        selectedFeedId="feed-123"
        onSelectFeed={vi.fn()}
      />
    );

    expect(container).toMatchSnapshot();
  });
});
