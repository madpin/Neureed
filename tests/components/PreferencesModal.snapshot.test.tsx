import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreferencesModal } from '@/app/components/preferences/PreferencesModal';

// Modal and Button use framer-motion; mock for stable snapshots (no animation state / invalid DOM attrs)
const MOTION_PROP_KEYS = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'whileHover',
  'whileTap',
  'whileFocus',
  'whileDrag',
  'whileInView',
  'layout',
  'layoutId',
  'layoutRoot',
  'drag',
  'dragConstraints',
  'onAnimationStart',
  'onAnimationComplete',
  'onUpdate',
]);

function stripMotionProps<T extends Record<string, unknown>>(props: T): T {
  const next = { ...props };
  for (const k of MOTION_PROP_KEYS) {
    delete (next as Record<string, unknown>)[k];
  }
  return next;
}

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => (
      <div {...stripMotionProps(props)}>{children}</div>
    ),
    button: ({ children, ...props }: any) => (
      <button {...stripMotionProps(props)}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

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
      autoMarkAsRead: true,
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
      <PreferencesModal isOpen onClose={mockOnClose} initialView="profile" />
    );

    expect(container).toBeTruthy();
  });

  it('matches snapshot - appearance view', async () => {
    render(
      <PreferencesModal isOpen onClose={mockOnClose} initialView="appearance" />
    );

    // Modal uses createPortal(document.body); RTL `container` stays an empty wrapper.
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toMatchSnapshot();
  });
});
