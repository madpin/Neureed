'use server';

/**
 * Server Actions for Notification operations
 *
 * These actions replace the following API routes:
 * - GET /api/user/notifications
 * - PATCH /api/user/notifications/[id]
 * - GET /api/user/notifications/unread-count
 */

import { auth } from '@/lib/auth';
import { z } from 'zod';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from '@/lib/services/notification-service';

// Validation schemas
const getNotificationsSchema = z.object({
  unreadOnly: z.boolean().optional().default(false),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

type GetNotificationsInput = z.infer<typeof getNotificationsSchema>;

/**
 * Get user notifications
 * Requires authentication
 */
export async function getNotificationsAction(input?: Partial<GetNotificationsInput>) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const validated = getNotificationsSchema.parse(input || {});
    const { unreadOnly, limit, offset } = validated;

    const result = await getUserNotifications(session.user.id, {
      unreadOnly,
      limit,
      offset,
    });

    return {
      data: result.notifications,
      meta: {
        total: result.total,
        limit,
        offset,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Mark a notification as read
 * Requires authentication
 */
export async function markNotificationAsReadAction(notificationId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!notificationId) {
    throw new Error('Notification ID is required');
  }

  const notification = await markNotificationAsRead(session.user.id, notificationId);

  return {
    data: notification,
    message: 'Notification marked as read',
  };
}

/**
 * Mark all notifications as read
 * Requires authentication
 */
export async function markAllNotificationsAsReadAction() {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const result = await markAllNotificationsAsRead(session.user.id);

  return {
    data: { count: result.count },
    message: `Marked ${result.count} notification${result.count !== 1 ? 's' : ''} as read`,
  };
}

/**
 * Get unread notification count
 * Requires authentication
 */
export async function getUnreadNotificationCountAction() {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const count = await getUnreadNotificationCount(session.user.id);

  return {
    data: { count },
  };
}
