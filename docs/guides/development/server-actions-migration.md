# Server Actions Migration Guide

This document outlines how to migrate React Query hooks from API routes to Server Actions.

## Overview

We've created 47 Server Actions to replace API routes:
- **Articles**: 9 actions in `app/actions/articles.ts`
- **Notifications**: 4 actions in `app/actions/notifications.ts`
- **Feeds**: 10 actions in `app/actions/feeds.ts`
- **User Feeds**: 6 actions in `app/actions/user-feeds.ts`
- **Categories**: 6 actions in `app/actions/categories.ts`
- **Saved Searches**: 10 actions in `app/actions/saved-searches.ts`
- **User Preferences**: 2 actions in `app/actions/user-preferences.ts`

## Migration Pattern

### Before (API Route)
```typescript
import { apiGet, apiPost } from "@/lib/query/api-client";

async function fetchArticles(filters: ArticleFilters): Promise<ArticlesResponse> {
  return await apiGet<ArticlesResponse>("/api/articles", filters);
}

export function useArticles(filters: ArticleFilters) {
  return useQuery({
    queryKey: queryKeys.articles.list(filters),
    queryFn: () => fetchArticles(filters),
  });
}
```

### After (Server Action)
```typescript
import { getArticlesAction } from "@/app/actions/articles";

async function fetchArticles(filters: ArticleFilters): Promise<ArticlesResponse> {
  return await getArticlesAction(filters);
}

export function useArticles(filters: ArticleFilters) {
  return useQuery({
    queryKey: queryKeys.articles.list(filters),
    queryFn: () => fetchArticles(filters),
  });
}
```

## Key Changes

1. **Replace imports**: Change from `apiGet/apiPost/apiPut/apiDelete` to direct Server Action imports
2. **Remove URL strings**: Server Actions are called as functions, not via HTTP
3. **Keep React Query structure**: The `useQuery`/`useMutation` hooks remain the same
4. **Error handling**: Server Actions throw errors that React Query catches automatically

## File-by-File Migration

### src/hooks/queries/use-articles.ts

**Functions to migrate:**
- `fetchArticle` → `getArticleAction`
- `fetchArticles` → `getArticlesAction`
- `fetchRelatedArticles` → `getRelatedArticlesAction`
- `fetchArticleSummary` → `generateArticleSummaryAction`
- `deleteArticle` (mutation) → `deleteArticleAction`
- `searchArticles` → `searchArticlesAction` or `semanticSearchAction`

### src/hooks/queries/use-feeds.ts

**Functions to migrate:**
- `fetchFeeds` → `getFeedsAction`
- `fetchUserFeeds` → `getUserFeedsAction`
- `fetchFeed` → `getFeedAction`
- `subscribeFeed` (mutation) → `subscribeFeedAction`
- `unsubscribeFeed` (mutation) → `unsubscribeFeedAction`
- `updateFeed` (mutation) → `updateFeedAction`
- `deleteFeed` (mutation) → `deleteFeedAction`
- `refreshFeed` (mutation) → `refreshFeedAction`

### src/hooks/queries/use-categories.ts

**Functions to migrate:**
- `fetchCategories` → `getUserCategoriesAction`
- `createCategory` (mutation) → `createUserCategoryAction`
- `updateCategory` (mutation) → `updateUserCategoryAction`
- `deleteCategory` (mutation) → `deleteUserCategoryAction`
- `reorderCategories` (mutation) → `reorderUserCategoriesAction`

### src/hooks/queries/use-notifications.ts

**Functions to migrate:**
- `fetchNotifications` → `getNotificationsAction`
- `markAsRead` (mutation) → `markNotificationAsReadAction`
- `markAllAsRead` (mutation) → `markAllNotificationsAsReadAction`
- `getUnreadCount` → `getUnreadNotificationCountAction`

### src/hooks/queries/use-saved-searches.ts

**Functions to migrate:**
- `fetchSavedSearches` → `getSavedSearchesAction`
- `fetchSavedSearch` → `getSavedSearchAction`
- `createSavedSearch` (mutation) → `createSavedSearchAction`
- `updateSavedSearch` (mutation) → `updateSavedSearchAction`
- `deleteSavedSearch` (mutation) → `deleteSavedSearchAction`
- `fetchMatchingArticles` → `getSavedSearchArticlesAction`
- `rematchSearch` (mutation) → `rematchSavedSearchAction`
- `previewSearch` → `previewSearchAction`
- `fetchTemplates` → `getSearchTemplatesAction`
- `fetchInsights` → `getSavedSearchInsightsAction`

### src/hooks/queries/use-user-preferences.ts

**Functions to migrate:**
- `fetchPreferences` → `getUserPreferencesAction`
- `updatePreferences` (mutation) → `updateUserPreferencesAction`

## Benefits of Server Actions

1. **Type Safety**: Direct function calls with TypeScript types
2. **No HTTP Overhead**: Functions called directly, no serialization
3. **Better Error Handling**: Errors thrown naturally, caught by React Query
4. **Automatic Revalidation**: Built-in `revalidatePath` support
5. **Simpler Code**: No need to construct URLs or handle response parsing
6. **Server-side Execution**: Code runs on server, closer to database

## Testing After Migration

After migrating each hook:

1. **Check TypeScript**: Ensure no type errors
2. **Test Queries**: Verify data fetching works
3. **Test Mutations**: Verify create/update/delete operations
4. **Check Invalidation**: Ensure cache invalidation triggers correctly
5. **Verify Errors**: Check error states display properly

## Rollout Strategy

Migrate incrementally by feature:

1. ✅ **Phase 1**: Create all Server Actions (DONE)
2. 🔄 **Phase 2**: Migrate hooks file by file
3. 🔄 **Phase 3**: Update components to use new hooks
4. 🔄 **Phase 4**: Remove old API routes
5. ✅ **Phase 5**: Verify all functionality works

## Notes

- Server Actions are marked with `'use server'` directive
- They automatically handle authentication via `auth()` from NextAuth
- All inputs are validated with Zod schemas
- Cache revalidation happens automatically with `revalidatePath`
- Background jobs are supported (matching, notifications, etc.)

## Example: Complete Hook Migration

**Before:**
```typescript
// src/hooks/queries/use-preferences.ts
import { apiGet, apiPut } from "@/lib/query/api-client";

async function fetchPreferences() {
  const response = await apiGet<{ preferences: UserPreferences }>("/api/user/preferences");
  return response.preferences;
}

async function updatePreferences(data: Partial<UserPreferences>) {
  const response = await apiPut<{ preferences: UserPreferences }>(
    "/api/user/preferences",
    data
  );
  return response.preferences;
}

export function usePreferences() {
  return useQuery({
    queryKey: queryKeys.preferences.detail(),
    queryFn: fetchPreferences,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.all });
    },
  });
}
```

**After:**
```typescript
// src/hooks/queries/use-preferences.ts
import {
  getUserPreferencesAction,
  updateUserPreferencesAction,
} from "@/app/actions/user-preferences";

async function fetchPreferences() {
  const response = await getUserPreferencesAction();
  return response.preferences;
}

async function updatePreferences(data: Partial<UserPreferences>) {
  const response = await updateUserPreferencesAction(data);
  return response.preferences;
}

export function usePreferences() {
  return useQuery({
    queryKey: queryKeys.preferences.detail(),
    queryFn: fetchPreferences,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.all });
    },
  });
}
```

## Conclusion

The migration from API routes to Server Actions is straightforward:
1. Import the Server Action
2. Replace the API call with the Server Action call
3. Keep everything else the same

The React Query hooks remain unchanged, only the underlying data fetching mechanism changes from HTTP to direct function calls.
