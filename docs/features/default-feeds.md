# Default Feeds for New Users

## Overview

NeuReed automatically subscribes new users to a curated set of default feeds when they create an account. This provides an immediate, high-quality reading experience without requiring users to manually search for and add feeds.

## Default Feed List

New users are automatically subscribed to the following feeds:

### Technology
- **TechCrunch** - `https://techcrunch.com/feed`
- **The Verge** - `https://www.theverge.com/rss/index.xml`
- **Hacker News** - `https://hnrss.org/frontpage`

### News
- **BBC News** - `https://feeds.bbci.co.uk/news/rss.xml`

### Science
- **Nature** - `https://www.nature.com/nature.rss`
- **Science Daily** - `https://www.sciencedaily.com/rss/all.xml`

### Positive News
- **Good News Network** - `https://www.goodnewsnetwork.org/feed`
- **Positive News** - `https://www.positive.news/feed`

### Satire
- **The Onion** - `https://www.theonion.com/rss`

## How It Works

### 1. User Creation Event
When a new user signs up through any OAuth provider (Google, GitHub, or generic OAuth), the `createUser` event in NextAuth triggers the default feed subscription process.

**Implementation:** `src/lib/auth.ts`

```typescript
events: {
  async createUser({ user }) {
    // ... create user preferences ...
    
    // Subscribe new user to default feeds
    const { subscribeUserToDefaultFeeds } = await import(
      "@/lib/services/default-feeds-service"
    );
    await subscribeUserToDefaultFeeds(user.id);
  }
}
```

### 2. Feed Initialization
The system ensures all default feeds exist in the database before subscribing the user:

1. Creates feed categories if they don't exist (Technology, News, Science, etc.)
2. Creates feed entries with appropriate refresh intervals
3. Associates feeds with their categories

**Implementation:** `src/lib/services/default-feeds-service.ts`

### 3. User Subscription
The subscription process:
- Checks if user is already subscribed (to handle account linking scenarios)
- Creates `user_feeds` entries for each default feed
- Skips feeds that the user is already subscribed to
- Logs all operations for debugging

## Configuration

### Modifying Default Feeds

To change the list of default feeds, edit the `DEFAULT_FEEDS` array in:

```
src/lib/services/default-feeds-service.ts
```

Each feed entry requires:
```typescript
{
  name: "Feed Display Name",
  url: "https://example.com/feed.xml",
  categoryName: "Category Name"
}
```

### Refresh Intervals

Default refresh intervals are set in the seed file (`prisma/seed.ts`):
- News feeds: 30 minutes (1800 seconds)
- Technology feeds: 1 hour (3600 seconds)
- Science/Journal feeds: 2 hours (7200 seconds)
- Daily publications: 24 hours (86400 seconds)

These can be adjusted per-feed or overridden by user preferences.

## Database Seeding

The database seed script (`prisma/seed.ts`) includes all default feeds, ensuring they're available immediately after setup:

```bash
npm run db:seed
```

This creates:
- All default feed categories
- All default feed entries
- Feed-category associations
- Sample articles for testing

## Testing

### Test New User Creation

To verify the default feeds feature works:

1. **Reset database (optional):**
   ```bash
   npm run db:reset
   npm run db:seed
   ```

2. **Create a new user:**
   - Sign up with a new account using any OAuth provider
   - Or use the test user: `test@neureed.com`

3. **Verify subscriptions:**
   - Navigate to the feeds page
   - Check that all 9 default feeds are subscribed
   - Verify feeds are organized by category

### Manual Testing Script

You can also test the subscription logic directly:

```typescript
import { subscribeUserToDefaultFeeds } from "@/lib/services/default-feeds-service";

// Subscribe a specific user to default feeds
await subscribeUserToDefaultFeeds("user_id_here");
```

## Error Handling

The subscription process is designed to be resilient:

- **Feed creation failures:** Logged but don't block user creation
- **Already subscribed:** Silently skipped, no duplicate subscriptions
- **Missing feeds:** Warned and skipped
- **Network issues:** Don't affect user authentication

All errors are logged to the console for debugging.

## Benefits

1. **Immediate Value:** New users see content right away
2. **Quality Content:** Curated, reliable sources across diverse topics
3. **Balanced Perspective:** Mix of tech, news, science, and positive content
4. **Easy Cleanup:** Users can unsubscribe from any feed they don't want

## Future Enhancements

Potential improvements to consider:

1. **User Preferences:** Allow users to select interests during onboarding
2. **Regional Feeds:** Add location-specific default feeds
3. **Language Support:** Provide feeds in multiple languages
4. **A/B Testing:** Test different default feed combinations
5. **Admin Interface:** Manage default feeds through admin dashboard

## Related Files

- **Service:** `src/lib/services/default-feeds-service.ts`
- **Auth Integration:** `src/lib/auth.ts`
- **Database Seed:** `prisma/seed.ts`
- **User Feed Service:** `src/lib/services/user-feed-service.ts`

