# Suspense Boundaries Implementation Guide

## Overview

This guide explains how to implement React Suspense boundaries with skeleton loading states across the NeuReed application.

## Architecture

### Component Structure
```
Page (Suspense Boundary)
├── Loading State (Skeleton)
└── Async Component (fetches data)
```

### Key Principles
1. **Granular Boundaries**: Suspense at component level, not page level
2. **Meaningful Skeletons**: Match actual content layout
3. **Progressive Loading**: Load critical content first
4. **Error Boundaries**: Always pair Suspense with ErrorBoundary

## Skeleton Components

We've created specialized skeleton components in `app/components/ui/Skeleton/`:

- `Skeleton` - Base skeleton with variants (rectangular, circular, text)
- `ArticleCardSkeleton` - For article cards
- `ArticleListSkeleton` - For article lists
- `FeedCardSkeleton` - For feed cards
- `FeedListSkeleton` - For feed grids
- `CategoryListSkeleton` - For category lists
- `SidebarSkeleton` - For sidebar navigation
- `TableSkeleton` - For data tables
- `CardGridSkeleton` - For generic card grids
- `DashboardStatsSkeleton` - For dashboard stats
- `ProfileHeaderSkeleton` - For profile headers
- `FormSkeleton` - For forms

## Usage Patterns

### Pattern 1: Page-Level Suspense

**Use Case**: Loading entire page content

```tsx
// app/articles/page.tsx
import { Suspense } from 'react';
import { ArticleListSkeleton } from '@/app/components/ui';

// Async Server Component
async function ArticleList({ filters }: { filters: ArticleFilters }) {
  const articles = await getArticlesAction(filters);

  return (
    <div className="space-y-4">
      {articles.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}

// Page with Suspense boundary
export default function ArticlesPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Articles</h1>

      <Suspense fallback={<ArticleListSkeleton count={10} />}>
        <ArticleList filters={searchParams} />
      </Suspense>
    </div>
  );
}
```

### Pattern 2: Component-Level Suspense

**Use Case**: Multiple independent async components

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';
import {
  DashboardStatsSkeleton,
  ArticleListSkeleton,
  FeedListSkeleton,
} from '@/app/components/ui';

async function DashboardStats() {
  const stats = await getDashboardStatsAction();
  return <StatsGrid stats={stats} />;
}

async function RecentArticles() {
  const articles = await getArticlesAction({ limit: 5 });
  return <ArticleList articles={articles} />;
}

async function UserFeeds() {
  const feeds = await getUserFeedsAction();
  return <FeedGrid feeds={feeds} />;
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Stats load independently */}
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Articles and Feeds load in parallel */}
        <Suspense fallback={<ArticleListSkeleton count={5} />}>
          <RecentArticles />
        </Suspense>

        <Suspense fallback={<FeedListSkeleton count={6} />}>
          <UserFeeds />
        </Suspense>
      </div>
    </div>
  );
}
```

### Pattern 3: Nested Suspense

**Use Case**: Progressive loading with dependencies

```tsx
// app/article/[id]/page.tsx
import { Suspense } from 'react';
import { Skeleton, ArticleCardSkeleton } from '@/app/components/ui';

async function ArticleContent({ id }: { id: string }) {
  const article = await getArticleAction(id);

  return (
    <article>
      <h1>{article.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />

      {/* Nested Suspense for related articles */}
      <Suspense fallback={<ArticleCardSkeleton />}>
        <RelatedArticles articleId={id} />
      </Suspense>
    </article>
  );
}

async function RelatedArticles({ articleId }: { articleId: string }) {
  const related = await getRelatedArticlesAction(articleId);
  return (
    <div className="mt-8">
      <h2>Related Articles</h2>
      {related.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}

export default function ArticlePage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<Skeleton className="h-screen" />}>
        <ArticleContent id={params.id} />
      </Suspense>
    </div>
  );
}
```

### Pattern 4: Suspense with Error Boundary

**Use Case**: Robust error handling

```tsx
// app/feeds/page.tsx
import { Suspense } from 'react';
import { ErrorBoundary, FeedListSkeleton } from '@/app/components/ui';

async function FeedList() {
  const feeds = await getFeedsAction({ page: 1, limit: 20 });

  if (feeds.feeds.length === 0) {
    return <EmptyState message="No feeds found" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {feeds.feeds.map(feed => (
        <FeedCard key={feed.id} feed={feed} />
      ))}
    </div>
  );
}

export default function FeedsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Feeds</h1>

      <ErrorBoundary fallback={<div>Error loading feeds</div>}>
        <Suspense fallback={<FeedListSkeleton count={12} />}>
          <FeedList />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
```

### Pattern 5: Conditional Suspense

**Use Case**: Client-side filtering with Suspense

```tsx
'use client';

import { Suspense, useState } from 'react';
import { ArticleListSkeleton } from '@/app/components/ui';

// Server Component for data fetching
async function FilteredArticles({ filters }: { filters: ArticleFilters }) {
  const articles = await getArticlesAction(filters);
  return <ArticleGrid articles={articles} />;
}

export function ArticlesWithFilters() {
  const [filters, setFilters] = useState<ArticleFilters>({});

  return (
    <div>
      <FilterBar filters={filters} onChange={setFilters} />

      <Suspense
        key={JSON.stringify(filters)} // Force remount on filter change
        fallback={<ArticleListSkeleton />}
      >
        <FilteredArticles filters={filters} />
      </Suspense>
    </div>
  );
}
```

### Pattern 6: Layout with Suspense

**Use Case**: Persistent layout with dynamic content

```tsx
// app/layout.tsx
import { Suspense } from 'react';
import { SidebarSkeleton } from '@/app/components/ui';

async function Sidebar() {
  const categories = await getUserCategoriesAction();
  return <SidebarNav categories={categories} />;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar with Suspense */}
      <aside className="w-64 border-r">
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
```

## Implementation Checklist

### High-Priority Pages

- [ ] `/` - Home page article list
- [ ] `/articles` - Article browsing
- [ ] `/articles/[id]` - Article detail view
- [ ] `/feeds` - Feed management
- [ ] `/feeds/[id]` - Feed detail view
- [ ] `/saved-searches` - Saved searches dashboard
- [ ] `/saved-searches/[id]` - Search results

### Medium-Priority Components

- [ ] Sidebar navigation
- [ ] Category list
- [ ] Notification panel
- [ ] User preferences modal
- [ ] Feed settings

### Low-Priority Components

- [ ] Dashboard stats
- [ ] Profile header
- [ ] Search suggestions
- [ ] Related articles widget

## Best Practices

### 1. Match Skeleton to Content

**Bad** ❌
```tsx
<Suspense fallback={<LoadingSpinner />}>
  <ArticleList />
</Suspense>
```

**Good** ✅
```tsx
<Suspense fallback={<ArticleListSkeleton count={10} />}>
  <ArticleList />
</Suspense>
```

### 2. Avoid Suspense for Fast Operations

**Bad** ❌
```tsx
// Don't use Suspense for synchronous operations
<Suspense fallback={<Skeleton />}>
  <LocalStateComponent />
</Suspense>
```

**Good** ✅
```tsx
// Only use Suspense for async data fetching
<Suspense fallback={<Skeleton />}>
  <AsyncServerComponent />
</Suspense>
```

### 3. Granular Boundaries

**Bad** ❌
```tsx
// One big Suspense boundary delays all content
<Suspense fallback={<Skeleton className="h-screen" />}>
  <Header />
  <ArticleList />
  <Sidebar />
  <Footer />
</Suspense>
```

**Good** ✅
```tsx
// Multiple boundaries allow progressive loading
<div>
  <Header /> {/* Static */}
  <div className="flex">
    <Suspense fallback={<ArticleListSkeleton />}>
      <ArticleList /> {/* Loads independently */}
    </Suspense>
    <Suspense fallback={<SidebarSkeleton />}>
      <Sidebar /> {/* Loads independently */}
    </Suspense>
  </div>
  <Footer /> {/* Static */}
</div>
```

### 4. Error Handling

Always pair Suspense with ErrorBoundary:

```tsx
<ErrorBoundary fallback={<ErrorMessage />}>
  <Suspense fallback={<Skeleton />}>
    <AsyncComponent />
  </Suspense>
</ErrorBoundary>
```

### 5. Loading States

Provide meaningful loading states:

```tsx
// Bad: Generic loading
<Suspense fallback={<div>Loading...</div>}>
  <ArticleList />
</Suspense>

// Good: Skeleton matching layout
<Suspense fallback={
  <div>
    <h2 className="text-xl mb-4">Loading Articles...</h2>
    <ArticleListSkeleton count={5} />
  </div>
}>
  <ArticleList />
</Suspense>
```

## Performance Considerations

### 1. Streaming SSR

Suspense enables streaming Server-Side Rendering:
- Initial HTML sent immediately
- Async components streamed as they resolve
- Faster Time to First Byte (TTFB)
- Better perceived performance

### 2. Parallel Data Fetching

Multiple Suspense boundaries fetch data in parallel:

```tsx
// These load in parallel ✅
<div className="grid grid-cols-2 gap-4">
  <Suspense fallback={<Skeleton />}>
    <FeedList />
  </Suspense>
  <Suspense fallback={<Skeleton />}>
    <CategoryList />
  </Suspense>
</div>
```

### 3. Preloading

Use React's `preload` for critical data:

```typescript
import { preload } from 'react-dom';

// Preload critical data
preload(getArticlesAction, { /* args */ });
```

## Testing

### Unit Tests

Test skeleton components render correctly:

```typescript
import { render } from '@testing-library/react';
import { ArticleCardSkeleton } from '@/app/components/ui';

describe('ArticleCardSkeleton', () => {
  it('renders skeleton structure', () => {
    const { container } = render(<ArticleCardSkeleton />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
```

### Integration Tests

Test Suspense boundaries work correctly:

```typescript
import { render, waitFor } from '@testing-library/react';
import { Suspense } from 'react';

describe('ArticlesPage', () => {
  it('shows skeleton while loading', async () => {
    const { getByText, queryByText } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <ArticleList />
      </Suspense>
    );

    expect(getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(queryByText('Loading...')).not.toBeInTheDocument();
    });
  });
});
```

## Accessibility

Skeletons include proper ARIA attributes:

```tsx
<div
  className="skeleton"
  aria-hidden="true"
  aria-label="Loading..."
/>
```

Screen readers announce loading states without reading skeleton content.

## Migration Strategy

1. **Phase 1**: Add Suspense to new pages
2. **Phase 2**: Refactor existing pages incrementally
3. **Phase 3**: Add to layout components
4. **Phase 4**: Optimize with preloading

## Conclusion

Suspense boundaries with skeleton loading states provide:
- ✅ Better perceived performance
- ✅ Progressive content loading
- ✅ Improved user experience
- ✅ Streaming SSR benefits
- ✅ Cleaner async code

Follow the patterns in this guide to implement Suspense across the application.
