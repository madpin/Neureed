import { createHandler } from "@/lib/api-handler";
import {
  getUserNotifications,
  markAllNotificationsAsRead,
} from "@/lib/services/notification-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  unreadOnly: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

/**
 * GET /api/user/notifications
 * Get user notifications
 */
export const GET = createHandler(
  async ({ session, query }) => {
    const userId = session!.user.id;
    
    // Transform query params
    const unreadOnly = query.unreadOnly === "true";
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const offset = query.offset ? parseInt(query.offset, 10) : 0;

    const result = await getUserNotifications(userId, {
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
  },
  {
    requireAuth: true,
    querySchema,
  }
);

/**
 * POST /api/user/notifications/mark-all-read
 * Mark all notifications as read
 */
export const POST = createHandler(
  async ({ session }) => {
    const userId = session!.user.id;
    const result = await markAllNotificationsAsRead(userId);

    return {
      data: { count: result.count },
      message: `Marked ${result.count} notification${result.count !== 1 ? "s" : ""} as read`,
    };
  },
  {
    requireAuth: true,
  }
);

