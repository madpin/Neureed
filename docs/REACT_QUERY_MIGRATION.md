# React Query Migration Guide

## Overview

The NeuReed codebase has been successfully set up with **TanStack React Query** (formerly React Query) for improved data fetching, caching, and state management. This document outlines what has been implemented and provides examples for migrating existing components.

## What Was Implemented

### ✅ 1. Core Infrastructure

#### QueryClient Provider
- **Location**: [app/components/providers/QueryProvider.tsx](../app/components/providers/QueryProvider.tsx)
- **Features**:
  - Configured with optimized defaults (60s stale time, 5min garbage collection)
  - Error handling with QueryCache and MutationCache
  - React Query DevTools (development only)
  - Automatic retry with exponential backoff

#### Query Keys Factory
- **Location**: [src/lib/query/query-keys.ts](../src/lib/query/query-keys.ts)
- **Features**:
  - Type-safe query key management
  - Hierarchical structure for easy invalidation
  - Organized by domain (user, articles, feeds, categories, admin)

#### API Client Utilities
- **Location**: [src/lib/query/api-client.ts](../src/lib/query/api-client.ts)
- **Features**:
  - Consistent error handling with `ApiError` class
  - Helper functions: `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`
  - Automatic JSON content-type headers

### ✅ 2. Custom Hooks

#### User Preferences Hooks
- **Location**: [src/hooks/queries/use-user-preferences.ts](../src/hooks/queries/use-user-preferences.ts)
- **Hooks**:
  - `useUserPreferences()` - Fetch user preferences with 5min cache
  - `useUpdateUserPreferences()` - Update with optimistic updates
  - `useUpdatePreference()` - Convenience hook for single field updates

#### Feeds Hooks
- **Location**: [src/hooks/queries/use-feeds.ts](../src/hooks/queries/use-feeds.ts)
- **Hooks**:
  - `useFeeds()` - All available feeds
  - `useUserFeeds()` - User's subscribed feeds
  - `useGroupedFeeds()` - Feeds grouped by category
  - `useSubscribeFeed()` / `useUnsubscribeFeed()` - Subscription mutations
  - `useValidateFeed()` - Validate feed URL
  - `useAddFeed()` - Add new feed
  - `useUpdateFeedSettings()` - Update feed-specific settings
  - `useRefreshFeed()` / `useRefreshAllFeeds()` - Manual refresh triggers

#### Categories Hooks
- **Location**: [src/hooks/queries/use-categories.ts](../src/hooks/queries/use-categories.ts)
- **Hooks**:
  - `useCategories()` - All categories
  - `useCategoryStates()` - Expanded/collapsed states
  - `useCreateCategory()` / `useUpdateCategory()` / `useDeleteCategory()` - CRUD with optimistic updates
  - `useReorderCategories()` - Reorder with optimistic updates
  - `useAssignFeedsToCategory()` - Assign feeds
  - `useUpdateCategoryState()` - Toggle expand/collapse

#### Articles Hooks
- **Location**: [src/hooks/queries/use-articles.ts](../src/hooks/queries/use-articles.ts)
- **Hooks**:
  - `useArticles()` - Paginated articles
  - `useInfiniteArticles()` - **Infinite scroll support** (replaces `useInfiniteScroll`)
  - `useArticleScores()` - Relevance scores
  - `useRelatedArticles()` - Related articles
  - `useArticleSummary()` - AI summary (cached indefinitely)
  - `useArticleTopics()` - All article topics
  - `useMarkArticleAsRead()` - Mark as read with optimistic update
  - `useTrackArticleView()` / `useTrackArticleExit()` - Analytics
  - `useSubmitArticleFeedback()` / `useDeleteArticleFeedback()` - User feedback

#### Admin Hooks
- **Location**: [src/hooks/queries/use-admin.ts](../src/hooks/queries/use-admin.ts)
- **Hooks**:
  - `useAdminMetrics(refetchInterval)` - Admin metrics with optional polling
  - `useCronStatus(refetchInterval)` - Cron job status with polling
  - `useCronHistory(jobName)` - Job execution history
  - `useTriggerCronJob()` - Manually trigger jobs
  - `useCacheStats(refetchInterval)` - Cache statistics with polling
  - `useClearCache()` - Clear Redis cache
  - `useEmbeddingConfig()` / `useUpdateEmbeddingConfig()` - Embedding configuration

### ✅ 3. Component Refactoring

#### MainLayout.tsx
- **Before**: Manual `fetch()` calls, `useState`, `useEffect`
- **After**: Uses `useUserPreferences()` and `useUpdatePreference()`
- **Benefits**:
  - Removed ~40 lines of boilerplate code
  - Automatic caching (sidebar state shared across components)
  - Optimistic updates (instant UI feedback)

## Migration Examples

### Example 1: Simple Data Fetching

**Before** (Manual):
```tsx
function MyComponent() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/user/preferences");
        const json = await response.json();
        setData(json.data.preferences);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data?.theme}</div>;
}
```

**After** (React Query):
```tsx
import { useUserPreferences } from "@/hooks/queries/use-user-preferences";

function MyComponent() {
  const { data, isLoading, error } = useUserPreferences();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data?.theme}</div>;
}
```

### Example 2: Mutations with Optimistic Updates

**Before** (Manual):
```tsx
function PreferencesToggle() {
  const [theme, setTheme] = useState("light");
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme); // Optimistic update

    setIsSaving(true);
    try {
      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch (error) {
      setTheme(theme); // Rollback on error
    } finally {
      setIsSaving(false);
    }
  };

  return <button onClick={handleToggle}>Toggle Theme</button>;
}
```

**After** (React Query):
```tsx
import { useUserPreferences, useUpdatePreference } from "@/hooks/queries/use-user-preferences";

function PreferencesToggle() {
  const { data: preferences } = useUserPreferences();
  const updatePreference = useUpdatePreference();

  const handleToggle = () => {
    const newTheme = preferences?.theme === "light" ? "dark" : "light";
    updatePreference.mutate({ theme: newTheme });
    // Optimistic update and rollback handled automatically!
  };

  return (
    <button onClick={handleToggle} disabled={updatePreference.isPending}>
      Toggle Theme
    </button>
  );
}
```

### Example 3: Infinite Scroll

**Before** (Custom Hook):
```tsx
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

function ArticleList() {
  const [articles, setArticles] = useState([]);
  const { page, isLoading, hasMore, loadMoreRef } = useInfiniteScroll();

  const loadArticles = async (pageNum, append) => {
    const response = await fetch(`/api/articles?page=${pageNum}`);
    const data = await response.json();

    if (append) {
      setArticles(prev => [...prev, ...data.articles]);
    } else {
      setArticles(data.articles);
    }
  };

  useEffect(() => {
    loadArticles(page, page > 1);
  }, [page]);

  return (
    <div>
      {articles.map(article => <ArticleCard key={article.id} article={article} />)}
      {hasMore && <div ref={loadMoreRef}>Loading more...</div>}
    </div>
  );
}
```

**After** (React Query):
```tsx
import { useInfiniteArticles } from "@/hooks/queries/use-articles";

function ArticleList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteArticles({ feedId: 1 });

  const allArticles = data?.pages.flatMap(page => page.articles) ?? [];

  return (
    <div>
      {allArticles.map(article => <ArticleCard key={article.id} article={article} />)}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
```

### Example 4: Polling/Auto-Refresh

**Before** (setInterval):
```tsx
function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    async function loadMetrics() {
      const response = await fetch("/api/admin/metrics");
      const data = await response.json();
      setMetrics(data);
    }

    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Poll every 30s

    return () => clearInterval(interval);
  }, []);

  return <div>Users: {metrics?.users.total}</div>;
}
```

**After** (React Query):
```tsx
import { useAdminMetrics } from "@/hooks/queries/use-admin";

function AdminDashboard() {
  const { data: metrics } = useAdminMetrics(30000); // Poll every 30s

  return <div>Users: {metrics?.users.total}</div>;
}
```

### Example 5: Dependent Queries

**Before** (Nested useEffect):
```tsx
function ArticleWithScores() {
  const [articles, setArticles] = useState([]);
  const [scores, setScores] = useState({});

  useEffect(() => {
    async function loadArticles() {
      const response = await fetch("/api/articles");
      const data = await response.json();
      setArticles(data.articles);
    }
    loadArticles();
  }, []);

  useEffect(() => {
    if (articles.length > 0) {
      async function loadScores() {
        const ids = articles.map(a => a.id);
        const response = await fetch("/api/user/articles/scores", {
          method: "POST",
          body: JSON.stringify({ articleIds: ids }),
        });
        const data = await response.json();
        setScores(data.scores);
      }
      loadScores();
    }
  }, [articles]);

  return <div>...</div>;
}
```

**After** (React Query):
```tsx
import { useArticles, useArticleScores } from "@/hooks/queries/use-articles";

function ArticleWithScores() {
  const { data: articlesData } = useArticles({});
  const articles = articlesData?.articles ?? [];

  const articleIds = articles.map(a => a.id);
  const { data: scores } = useArticleScores(articleIds);
  // Automatically waits for articles to load before fetching scores!

  return <div>...</div>;
}
```

## Migration Checklist

When migrating a component to React Query:

- [ ] Identify all `fetch()` calls, `useState`, and `useEffect` for data fetching
- [ ] Find the corresponding hook in [src/hooks/queries/](../src/hooks/queries/)
- [ ] Replace manual state management with the hook
- [ ] Remove `isLoading`, `error`, `data` state variables
- [ ] For mutations, replace manual optimistic updates with React Query's built-in support
- [ ] Remove manual cache invalidation (React Query handles this)
- [ ] Test the component to ensure it works correctly

## Key Benefits

### 1. **Less Code**
- Eliminated ~40% of boilerplate in MainLayout.tsx
- No more manual loading/error/data state management
- No more cleanup of intervals and event listeners

### 2. **Better UX**
- **Stale-while-revalidate**: Users see cached data instantly, background updates keep it fresh
- **Optimistic updates**: UI updates immediately, rolls back on error
- **Automatic retries**: Failed requests retry with exponential backoff
- **Request deduplication**: Multiple components requesting same data = single network request

### 3. **Better Performance**
- **Intelligent caching**: 60s stale time, 5min garbage collection
- **Background updates**: Data stays fresh without user interaction
- **Automatic cleanup**: Unused data is removed from memory

### 4. **Better DX (Developer Experience)**
- **Type-safe**: Full TypeScript support with type inference
- **DevTools**: React Query DevTools for debugging (development only)
- **Predictable**: Consistent patterns across the entire codebase
- **Testable**: Easy to mock and test

## Advanced Features

### Selective Invalidation

```tsx
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";

function MyComponent() {
  const queryClient = useQueryClient();

  const handleAction = () => {
    // Invalidate all article queries
    queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });

    // Invalidate specific feed's articles
    queryClient.invalidateQueries({ queryKey: queryKeys.articles.list({ feedId: 1 }) });

    // Invalidate everything
    queryClient.invalidateQueries();
  };
}
```

### Manual Data Updates

```tsx
const queryClient = useQueryClient();

// Get cached data
const preferences = queryClient.getQueryData(queryKeys.user.preferences());

// Set cached data
queryClient.setQueryData(queryKeys.user.preferences(), newPreferences);
```

### Prefetching

```tsx
const queryClient = useQueryClient();

// Prefetch data before user needs it
await queryClient.prefetchQuery({
  queryKey: queryKeys.articles.list({ feedId: 1 }),
  queryFn: () => fetchArticles({ feedId: 1, page: 1, limit: 20 }),
});
```

## Troubleshooting

### Query not refetching?
- Check `staleTime` - data might still be considered fresh
- Check if component is unmounting/remounting
- Use React Query DevTools to inspect query state

### Mutation not invalidating?
- Ensure you're using the correct query key in `invalidateQueries`
- Check console for errors in mutation `onSuccess` callback

### Too many refetches?
- Increase `staleTime` in the query options
- Disable `refetchOnWindowFocus` if not needed
- Use `enabled: false` to prevent automatic fetching

## Next Steps

The following components should be migrated next (in priority order):

1. **app/page.tsx** - Main feed view (complex, high impact)
2. **app/components/feeds/CategoryList.tsx** - Category management
3. **app/components/articles/ArticleList.tsx** - Article display
4. **app/components/preferences/PreferencesModal.tsx** - User settings
5. **app/components/articles/RelatedArticles.tsx** - Related content
6. **app/admin/dashboard/page.tsx** - Admin dashboard

Each of these components will see significant simplification and performance improvements.

## Resources

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Query Keys Guide](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [Infinite Queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries)

---

**Status**: ✅ Infrastructure complete, build passing, ready for component migration
