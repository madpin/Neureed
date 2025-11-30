import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PreferencesModal } from '@/app/components/preferences/PreferencesModal';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock user preferences hooks
vi.mock('@/hooks/queries/use-user-preferences', () => ({
  useUserPreferences: () => ({
    data: {
      theme: 'system',
      fontSize: 'medium',
      articlesPerPage: 20,
      defaultView: 'expanded',
      showReadArticles: true,
      autoMarkAsRead: false,
    },
    isLoading: false,
    error: null,
  }),
  useUpdateUserPreferences: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useResetPatterns: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// Mock article hooks for ArticleCard preview
vi.mock('@/hooks/queries/use-articles', () => ({
  useMarkArticleAsRead: () => ({ mutate: vi.fn() }),
  useMarkArticleAsUnread: () => ({ mutate: vi.fn() }),
  useArticleFeedback: () => ({ data: null }),
  useSubmitArticleFeedback: () => ({ mutate: vi.fn() }),
  useDeleteArticleFeedback: () => ({ mutate: vi.fn() }),
}));

describe('PreferencesModal - Baseline Snapshot', () => {
  const mockOnClose = vi.fn();

  it('renders without crashing - profile view', () => {
    const { container } = render(
      <PreferencesModal onClose={mockOnClose} initialView="profile" />
    );

    expect(container).toBeTruthy();
  });

  it('matches snapshot - appearance view', () => {
    const { container } = render(
      <PreferencesModal onClose={mockOnClose} initialView="appearance" />
    );

    expect(container).toMatchSnapshot();
  });
});
