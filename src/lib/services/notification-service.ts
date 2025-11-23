import { prisma } from "@/lib/db";
import { user_notifications } from "@/generated/prisma/client";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

/**
 * Notification types
 */
export type NotificationType = "feed_refresh" | "info" | "warning" | "error" | "success";

/**
 * Notification data structure
 */
export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Feed refresh notification metadata
 */
export interface FeedRefreshMetadata {
  totalFeeds: number;
  successful: number;
  failed: number;
  newArticles: number;
  updatedArticles: number;
  articlesCleanedUp?: number;
  embeddingsGenerated?: number;
  totalTokens?: number;
  summariesGenerated?: number;
  summariesFailed?: number;
  summariesSkipped?: number;
  duration?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  data: NotificationData
): Promise<user_notifications> {
  try {
    const notification = await prisma.user_notifications.create({
      data: {
        id: nanoid(),
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata ?? undefined,
        read: false,
        updatedAt: new Date(),
      },
    });

    logger.info("Notification created", {
      userId: data.userId,
      type: data.type,
      title: data.title,
    });

    return notification;
  } catch (error) {
    logger.error("Failed to create notification", { error, data });
    throw error;
  }
}

/**
 * Create feed refresh notification for a user
 */
export async function createFeedRefreshNotification(
  userId: string,
  metadata: FeedRefreshMetadata
): Promise<user_notifications | null> {
  try {
    // Only create notification if there are new articles or updates
    if (metadata.newArticles === 0 && metadata.updatedArticles === 0) {
      return null;
    }

    let message = "";
    if (metadata.newArticles > 0 && metadata.updatedArticles > 0) {
      message = `${metadata.newArticles} new and ${metadata.updatedArticles} updated articles from ${metadata.successful} feed${metadata.successful > 1 ? "s" : ""}`;
    } else if (metadata.newArticles > 0) {
      message = `${metadata.newArticles} new article${metadata.newArticles > 1 ? "s" : ""} from ${metadata.successful} feed${metadata.successful > 1 ? "s" : ""}`;
    } else {
      message = `${metadata.updatedArticles} updated article${metadata.updatedArticles > 1 ? "s" : ""} from ${metadata.successful} feed${metadata.successful > 1 ? "s" : ""}`;
    }

    return await createNotification({
      userId,
      type: "feed_refresh",
      title: "Feeds Refreshed",
      message,
      metadata,
    });
  } catch (error) {
    logger.error("Failed to create feed refresh notification", {
      error,
      userId,
      metadata,
    });
    // Don't throw - notification failure shouldn't break feed refresh
    return null;
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  options: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ notifications: user_notifications[]; total: number }> {
  const { unreadOnly = false, limit = 20, offset = 0 } = options;

  const where = {
    userId,
    ...(unreadOnly && { read: false }),
  };

  const [notifications, total] = await Promise.all([
    prisma.user_notifications.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.user_notifications.count({ where }),
  ]);

  return { notifications, total };
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<user_notifications> {
  return await prisma.user_notifications.update({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
    data: {
      read: true,
      updatedAt: new Date(),
    },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ count: number }> {
  const result = await prisma.user_notifications.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
      updatedAt: new Date(),
    },
  });

  return { count: result.count };
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<void> {
  await prisma.user_notifications.delete({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
  });
}

/**
 * Delete all read notifications for a user
 */
export async function deleteReadNotifications(
  userId: string
): Promise<{ count: number }> {
  const result = await prisma.user_notifications.deleteMany({
    where: {
      userId,
      read: true,
    },
  });

  return { count: result.count };
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  return await prisma.user_notifications.count({
    where: {
      userId,
      read: false,
    },
  });
}

/**
 * Clean up old notifications (keep only last 100 per user)
 */
export async function cleanupOldNotifications(userId: string): Promise<void> {
  try {
    // Get IDs of notifications to keep (last 100)
    const notificationsToKeep = await prisma.user_notifications.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true },
    });

    const idsToKeep = notificationsToKeep.map((n) => n.id);

    // Delete older notifications
    await prisma.user_notifications.deleteMany({
      where: {
        userId,
        id: { notIn: idsToKeep },
      },
    });
  } catch (error) {
    logger.error("Failed to cleanup old notifications", { error, userId });
  }
}

