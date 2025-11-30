# Optimistic Updates Implementation Guide

## Overview

Optimistic updates improve perceived performance by immediately updating the UI before server confirmation. This guide shows how to implement optimistic updates with React Query and Server Actions.

## Key Concepts

### What are Optimistic Updates?

Optimistic updates assume the mutation will succeed and update the UI immediately, then roll back if the mutation fails.

**Flow:**
1. User triggers action (e.g., like article)
2. UI updates immediately (optimistic)
3. Server request sent in background
4. If successful: keep optimistic update
5. If failed: rollback to previous state

### Benefits

- ✅ **Instant feedback**: No waiting for server
- ✅ **Better UX**: Feels responsive
- ✅ **Reduced perceived latency**: App feels faster
- ✅ **Offline support**: Can queue actions

### When to Use

**Good candidates** ✅:
- Toggle states (read/unread, favorite)
- Simple updates (rename, change category)
- Delete operations
- Incrementing counters

**Poor candidates** ❌:
- Complex calculations
- File uploads
- Payment processing
- Operations requiring server validation

## Implementation Patterns

### Pattern 1: Toggle State (Mark as Read)

```typescript
// src/hooks/queries/use-article-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markArticleAsReadAction } from '@/app/actions/articles';
import { queryKeys } from '@/lib/query/query-keys';

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ articleId, isRead }: { articleId: string; isRead: boolean }) =>
      markArticleAsReadAction(articleId, isRead),

    // Optimistic update
    onMutate: async ({ articleId, isRead }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.articles.all });

      // Snapshot previous value
      const previousArticles = queryClient.getQueryData(
        queryKeys.articles.list()
      );

      // Optimistically update
      queryClient.setQueryData(
        queryKeys.articles.list(),
        (old: Article[]) =>
          old?.map(article =>
            article.id === articleId
              ? { ...article, isRead, readAt: new Date().toISOString() }
              : article
          )
      );

      // Return context with snapshot
      return { previousArticles };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousArticles) {
        queryClient.setQueryData(
          queryKeys.articles.list(),
          context.previousArticles
        );
      }
      toast.error('Failed to update article');
    },

    // Refetch on success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
    },
  });
}
```

### Pattern 2: Delete with Optimistic Removal

```typescript
// src/hooks/queries/use-feed-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteFeedAction } from '@/app/actions/feeds';
import { queryKeys } from '@/lib/query/query-keys';

export function useDeleteFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedId: string) => deleteFeedAction(feedId),

    onMutate: async (feedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.feeds.all });

      const previousFeeds = queryClient.getQueryData(queryKeys.feeds.list());

      // Optimistically remove
      queryClient.setQueryData(
        queryKeys.feeds.list(),
        (old: Feed[]) => old?.filter(feed => feed.id !== feedId)
      );

      return { previousFeeds };
    },

    onError: (err, feedId, context) => {
      if (context?.previousFeeds) {
        queryClient.setQueryData(
          queryKeys.feeds.list(),
          context.previousFeeds
        );
      }
      toast.error('Failed to delete feed');
    },

    onSuccess: () => {
      toast.success('Feed deleted successfully');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
    },
  });
}
```

### Pattern 3: Update with Optimistic Changes

```typescript
// src/hooks/queries/use-category-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserCategoryAction } from '@/app/actions/categories';
import { queryKeys } from '@/lib/query/query-keys';

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: Partial<Category>;
    }) => updateUserCategoryAction(categoryId, data),

    onMutate: async ({ categoryId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });

      const previousCategories = queryClient.getQueryData(
        queryKeys.categories.list()
      );

      // Optimistically update
      queryClient.setQueryData(
        queryKeys.categories.list(),
        (old: Category[]) =>
          old?.map(category =>
            category.id === categoryId
              ? { ...category, ...data }
              : category
          )
      );

      // Also update single category query
      queryClient.setQueryData(
        queryKeys.categories.detail(categoryId),
        (old: Category) => (old ? { ...old, ...data } : old)
      );

      return { previousCategories };
    },

    onError: (err, variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(
          queryKeys.categories.list(),
          context.previousCategories
        );
      }
      toast.error('Failed to update category');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
```

### Pattern 4: Create with Optimistic Addition

```typescript
// src/hooks/queries/use-saved-search-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSavedSearchAction } from '@/app/actions/saved-searches';
import { queryKeys } from '@/lib/query/query-keys';
import { nanoid } from 'nanoid';

export function useCreateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSavedSearchInput) => createSavedSearchAction(data),

    onMutate: async (newSearch) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.savedSearches.all });

      const previousSearches = queryClient.getQueryData(
        queryKeys.savedSearches.list()
      );

      // Create temporary ID
      const tempId = `temp-${nanoid()}`;
      const tempSearch = {
        id: tempId,
        ...newSearch,
        createdAt: new Date().toISOString(),
        isPending: true, // Flag for UI indication
      };

      // Optimistically add
      queryClient.setQueryData(
        queryKeys.savedSearches.list(),
        (old: SavedSearch[]) => [...(old || []), tempSearch]
      );

      return { previousSearches, tempId };
    },

    onError: (err, variables, context) => {
      if (context?.previousSearches) {
        queryClient.setQueryData(
          queryKeys.savedSearches.list(),
          context.previousSearches
        );
      }
      toast.error('Failed to create saved search');
    },

    onSuccess: (data, variables, context) => {
      // Replace temp item with real one
      queryClient.setQueryData(
        queryKeys.savedSearches.list(),
        (old: SavedSearch[]) =>
          old?.map(search =>
            search.id === context.tempId ? data.data : search
          )
      );
      toast.success('Saved search created');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedSearches.all });
    },
  });
}
```

### Pattern 5: Reorder with Optimistic Drag-and-Drop

```typescript
// src/hooks/queries/use-category-reorder.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reorderUserCategoriesAction } from '@/app/actions/categories';
import { queryKeys } from '@/lib/query/query-keys';

export function useReorderCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryIds: string[]) =>
      reorderUserCategoriesAction({ categoryIds }),

    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });

      const previousCategories = queryClient.getQueryData<Category[]>(
        queryKeys.categories.list()
      );

      if (!previousCategories) return { previousCategories };

      // Create ordered map
      const orderMap = new Map(newOrder.map((id, index) => [id, index]));

      // Optimistically reorder
      const reordered = [...previousCategories].sort(
        (a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0)
      );

      queryClient.setQueryData(queryKeys.categories.list(), reordered);

      return { previousCategories };
    },

    onError: (err, variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(
          queryKeys.categories.list(),
          context.previousCategories
        );
      }
      toast.error('Failed to reorder categories');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
```

### Pattern 6: Counter Increment

```typescript
// src/hooks/queries/use-notification-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markAllNotificationsAsReadAction } from '@/app/actions/notifications';
import { queryKeys } from '@/lib/query/query-keys';

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsReadAction(),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previousCount = queryClient.getQueryData<number>(
        queryKeys.notifications.unreadCount()
      );

      // Optimistically set to 0
      queryClient.setQueryData(queryKeys.notifications.unreadCount(), 0);

      // Update notifications list
      queryClient.setQueryData(
        queryKeys.notifications.list(),
        (old: Notification[]) =>
          old?.map(notif => ({ ...notif, isRead: true }))
      );

      return { previousCount };
    },

    onError: (err, variables, context) => {
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(
          queryKeys.notifications.unreadCount(),
          context.previousCount
        );
      }
      toast.error('Failed to mark notifications as read');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
```

## Advanced Patterns

### Pattern 7: Optimistic Update with Validation

```typescript
export function useUpdateFeedSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feedId, settings }: { feedId: string; settings: any }) =>
      updateUserFeedSettingsAction(feedId, settings),

    onMutate: async ({ feedId, settings }) => {
      // Validate before optimistic update
      const isValid = validateSettings(settings);
      if (!isValid) {
        throw new Error('Invalid settings');
      }

      await queryClient.cancelQueries({ queryKey: queryKeys.feeds.detail(feedId) });

      const previousFeed = queryClient.getQueryData(queryKeys.feeds.detail(feedId));

      queryClient.setQueryData(
        queryKeys.feeds.detail(feedId),
        (old: Feed) => (old ? { ...old, settings } : old)
      );

      return { previousFeed };
    },

    onError: (err, variables, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(
          queryKeys.feeds.detail(variables.feedId),
          context.previousFeed
        );
      }
    },

    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.feeds.detail(variables.feedId),
      });
    },
  });
}
```

### Pattern 8: Multiple Query Updates

```typescript
export function useSubscribeFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feedId, categoryId }: { feedId: string; categoryId?: string }) =>
      subscribeFeedAction({ feedId, categoryId }),

    onMutate: async ({ feedId, categoryId }) => {
      // Cancel multiple queries
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.feeds.all }),
        queryClient.cancelQueries({ queryKey: queryKeys.categories.all }),
      ]);

      // Snapshot multiple queries
      const previousUserFeeds = queryClient.getQueryData(queryKeys.feeds.user());
      const previousAllFeeds = queryClient.getQueryData(queryKeys.feeds.list());

      // Update user feeds
      queryClient.setQueryData(
        queryKeys.feeds.user(),
        (old: UserFeed[]) => {
          const newFeed = { id: feedId, categoryId, subscribedAt: new Date() };
          return [...(old || []), newFeed];
        }
      );

      // Update feed subscription status
      queryClient.setQueryData(
        queryKeys.feeds.list(),
        (old: FeedWithSubscription[]) =>
          old?.map(feed =>
            feed.id === feedId ? { ...feed, isSubscribed: true } : feed
          )
      );

      return { previousUserFeeds, previousAllFeeds };
    },

    onError: (err, variables, context) => {
      if (context?.previousUserFeeds) {
        queryClient.setQueryData(queryKeys.feeds.user(), context.previousUserFeeds);
      }
      if (context?.previousAllFeeds) {
        queryClient.setQueryData(queryKeys.feeds.list(), context.previousAllFeeds);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feeds.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
```

## Priority Mutations for Optimistic Updates

### High Priority (Implement First)

1. **Mark Article as Read** - Immediate feedback essential
2. **Delete Article** - Common operation, fast feedback needed
3. **Toggle Favorite** - Like/unlike should be instant
4. **Mark Notification as Read** - Badge count updates
5. **Delete Feed** - Remove from list immediately

### Medium Priority

6. **Update Category Name** - Rename operations
7. **Reorder Categories** - Drag-and-drop feedback
8. **Subscribe/Unsubscribe Feed** - Add/remove from list
9. **Update Preferences** - Setting toggles
10. **Create Saved Search** - Add to list immediately

### Lower Priority

11. **Update Feed Settings** - Less frequent operation
12. **Create Category** - Less frequent, can show spinner
13. **Batch Operations** - Complex, harder to optimize
14. **File Uploads** - Progress indicators sufficient

## Best Practices

### 1. Always Cancel Queries

Prevent race conditions:

```typescript
onMutate: async (variables) => {
  // Cancel any outgoing refetches
  await queryClient.cancelQueries({ queryKey: queryKeys.articles.all });
  // ...
}
```

### 2. Always Snapshot

Keep previous state for rollback:

```typescript
onMutate: async (variables) => {
  const previous = queryClient.getQueryData(queryKey);
  // Optimistic update
  return { previous }; // Return for onError
}
```

### 3. Always Rollback on Error

Restore previous state if mutation fails:

```typescript
onError: (err, variables, context) => {
  if (context?.previous) {
    queryClient.setQueryData(queryKey, context.previous);
  }
  toast.error('Operation failed');
}
```

### 4. Always Invalidate on Settled

Ensure eventual consistency:

```typescript
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
}
```

### 5. Visual Feedback

Show pending state in UI:

```tsx
function ArticleCard({ article }) {
  const markAsRead = useMarkAsRead();
  const isPending = markAsRead.isPending && markAsRead.variables?.articleId === article.id;

  return (
    <div className={cn('card', isPending && 'opacity-50')}>
      {/* Content */}
    </div>
  );
}
```

## Testing

### Unit Tests

Test optimistic update logic:

```typescript
describe('useMarkAsRead', () => {
  it('updates article optimistically', async () => {
    const { result } = renderHook(() => useMarkAsRead(), {
      wrapper: createQueryWrapper(),
    });

    act(() => {
      result.current.mutate({ articleId: '123', isRead: true });
    });

    // Check optimistic update
    const articles = queryClient.getQueryData(queryKeys.articles.list());
    expect(articles[0].isRead).toBe(true);
  });

  it('rolls back on error', async () => {
    // Mock mutation to fail
    server.use(
      rest.post('/api/articles/*/read', (req, res, ctx) =>
        res(ctx.status(500))
      )
    );

    const { result } = renderHook(() => useMarkAsRead(), {
      wrapper: createQueryWrapper(),
    });

    act(() => {
      result.current.mutate({ articleId: '123', isRead: true });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Check rollback
    const articles = queryClient.getQueryData(queryKeys.articles.list());
    expect(articles[0].isRead).toBe(false);
  });
});
```

## Implementation Checklist

- [ ] Mark article as read/unread
- [ ] Delete article
- [ ] Toggle article favorite
- [ ] Mark notification as read
- [ ] Mark all notifications as read
- [ ] Delete feed
- [ ] Subscribe/unsubscribe feed
- [ ] Update category name
- [ ] Reorder categories (drag-and-drop)
- [ ] Update user preferences
- [ ] Create saved search
- [ ] Delete saved search
- [ ] Update saved search

## Conclusion

Optimistic updates significantly improve perceived performance by providing instant feedback. Follow the patterns in this guide to implement optimistic updates for key mutations throughout the application.

**Key Takeaways:**
- ✅ Cancel queries to prevent race conditions
- ✅ Snapshot previous state for rollback
- ✅ Update UI immediately
- ✅ Rollback on error
- ✅ Invalidate on settled for consistency
- ✅ Provide visual feedback for pending states
