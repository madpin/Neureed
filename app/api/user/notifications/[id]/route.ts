import { createHandler } from "@/lib/api-handler";
import {
  markNotificationAsRead,
  deleteNotification,
} from "@/lib/services/notification-service";

/**
 * PATCH /api/user/notifications/[id]
 * Mark a notification as read
 */
export const PATCH = createHandler(
  async ({ session, params }) => {
    const userId = session!.user.id;
    const notificationId = params.id as string;

    const notification = await markNotificationAsRead(notificationId, userId);

    return {
      data: notification,
      message: "Notification marked as read",
    };
  },
  {
    requireAuth: true,
  }
);

/**
 * DELETE /api/user/notifications/[id]
 * Delete a notification
 */
export const DELETE = createHandler(
  async ({ session, params }) => {
    const userId = session!.user.id;
    const notificationId = params.id as string;

    await deleteNotification(notificationId, userId);

    return {
      data: null,
      message: "Notification deleted",
    };
  },
  {
    requireAuth: true,
  }
);

