import type { User, user_preferences, user_feeds, feeds, read_articles } from "@prisma/client";

export type UserWithPreferences = User & {
  user_preferences: user_preferences | null;
};

export type UserFeedSubscription = user_feeds & {
  feeds: feeds;
};

export type ReadArticleStatus = {
  articleId: string;
  isRead: boolean;
  readAt?: Date;
};

export type FeedWithSubscription = feeds & {
  isSubscribed: boolean;
  subscription?: user_feeds;
};

