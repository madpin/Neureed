import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ArticleCard } from '@/app/components/articles/ArticleCard';

// Mock the hooks
vi.mock('@/hooks/queries/use-articles', () => ({
  useMarkArticleAsRead: () => ({ mutate: vi.fn() }),
  useMarkArticleAsUnread: () => ({ mutate: vi.fn() }),
  useArticleFeedback: () => ({ data: null }),
  useSubmitArticleFeedback: () => ({ mutate: vi.fn() }),
  useDeleteArticleFeedback: () => ({ mutate: vi.fn() }),
}));

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');
  return {
    ...actual,
    usePathname: () => '/',
  };
});

describe('ArticleCard - Baseline Snapshot', () => {
  const mockArticle = {
    id: 'test-123',
    title: 'Test Article',
    url: 'https://example.com/article',
    content: 'Test content',
    excerpt: 'Test excerpt',
    author: 'Test Author',
    publishedAt: new Date('2024-01-01'),
    feedId: 'feed-123',
    feed: {
      id: 'feed-123',
      title: 'Test Feed',
      url: 'https://example.com/feed',
      description: null,
      faviconUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    imageUrl: null,
    embedding: null,
  };

  it('renders without crashing - compact', () => {
    const { container } = render(
      <ArticleCard
        article={mockArticle}
        displayPreferences={{
          density: 'compact',
          showImage: false,
          showExcerpt: false,
          showAuthor: false,
          showFeedInfo: true,
          showDate: true,
          sectionOrder: ['title'],
        }}
      />
    );

    expect(container).toBeTruthy();
  });

  it('matches snapshot - normal density', () => {
    const { container } = render(
      <ArticleCard
        article={mockArticle}
        displayPreferences={{
          density: 'normal',
          showImage: true,
          showExcerpt: true,
          showAuthor: true,
          showFeedInfo: true,
          showDate: true,
          sectionOrder: ['feedInfo', 'title', 'excerpt', 'actions'],
        }}
      />
    );

    expect(container).toMatchSnapshot();
  });
});
