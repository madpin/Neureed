import type { User, UserPreferences, UserFeed, Feed, ReadArticle } from "@prisma/client";

export type UserWithPreferences = User & {
  preferences: UserPreferences | null;
};

export type UserFeedSubscription = UserFeed & {
  feed: Feed;
};

export type ReadArticleStatus = {
  articleId: string;
  isRead: boolean;
  readAt?: Date;
};

export type FeedWithSubscription = Feed & {
  isSubscribed: boolean;
  subscription?: UserFeed;
};

